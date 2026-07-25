<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Package;
use App\Models\Subscription;
use App\Models\User;
use App\Services\SettingsService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Multi-gateway billing. Stripe implemented via its REST API using the
 * admin's stored secret key; PayPal left as a documented extension point.
 */
class BillingController extends Controller
{
    public function __construct(protected SettingsService $settings) {}

    /** GET /api/packages — public pricing table. */
    public function packages(Request $request)
    {
        $user = $request->user('sanctum'); // optional — route stays public

        return Package::where('status', 'active')
            ->where(function ($q) use ($user) {
                $q->where('is_custom', false);
                if ($user) $q->orWhere(fn ($qq) => $qq->where('is_custom', true)->where('user_id', $user->id));
            })
            ->orderBy('price')
            ->get();
    }

    /** POST /api/packages/request-custom — lands in the admin inbox. */
    public function requestCustom(Request $request)
    {
        $data = $request->validate(['message' => 'required|string|min:20|max:2000']);

        \App\Models\ContactMessage::create([
            'name'    => $request->user()->name,
            'email'   => $request->user()->email,
            'subject' => 'Custom package request',
            'message' => $data['message'],
            'is_read' => false,
        ]);

        return response()->json(['message' => "Request sent! We'll get back to you by email with a tailored plan."]);
    }

    /** POST /api/billing/checkout — creates a Stripe Checkout session. */
    public function checkout(Request $request)
    {
        $data = $request->validate(['package_id' => 'required|exists:packages,id']);
        $package = Package::findOrFail($data['package_id']);

        // Custom packages are private to the customer they were made for
        abort_if($package->is_custom && $package->user_id !== $request->user()->id, 403,
            'This package is reserved for another customer.');
        $secret  = $this->settings->stripeSecret();

        abort_if(! $this->settings->stripeEnabled(), 503, 'Card payments are currently disabled.');
        abort_if(! $secret, 503, 'Payments are not configured yet.');

        $payload = [
            'mode'                => 'subscription',
            'customer_email'      => $request->user()->email,
            'client_reference_id' => $request->user()->id,
            'line_items[0][quantity]' => 1,
            'metadata[package_id]'    => $package->id,
            'subscription_data[metadata][package_id]' => $package->id,
            // Back to OUR server first (verify + activate), then on to the frontend
            'success_url' => url('/api/billing/stripe/return') . '?session_id={CHECKOUT_SESSION_ID}',
            'cancel_url'  => rtrim(env('FRONTEND_URL', 'http://localhost:5173'), '/') . '/pricing?checkout=canceled',
        ];

        if ($package->stripe_plan_id) {
            // Admin attached a Stripe Price ID — use it
            $payload['line_items[0][price]'] = $package->stripe_plan_id;
        } else {
            // No Price ID needed: the price is generated on the fly from the package
            $currency = strtolower($this->settings->currency()['code'] ?? 'usd');
            $payload += [
                'line_items[0][price_data][currency]'    => $currency,
                'line_items[0][price_data][unit_amount]' => (int) round($package->price * 100),
                'line_items[0][price_data][recurring][interval]' => $package->billing_cycle === 'yearly' ? 'year' : 'month',
                'line_items[0][price_data][product_data][name]'  => $package->name,
            ];
        }

        $session = Http::withToken($secret)->asForm()
            ->post('https://api.stripe.com/v1/checkout/sessions', $payload)
            ->throw()->json();

        return response()->json(['checkout_url' => $session['url']]);
    }

    /**
     * GET /api/billing/stripe/return — the browser lands here after Stripe Checkout.
     * We fetch the session straight from Stripe (never trusting the URL alone),
     * activate the subscription, then send the customer to the tools page.
     * Works on localhost too — no webhook required (the webhook remains as a
     * second activation path for live sites).
     */
    public function stripeReturn(Request $request)
    {
        $frontend = rtrim(env('FRONTEND_URL', 'http://localhost:5173'), '/');
        $sessionId = $request->query('session_id');
        $secret = $this->settings->stripeSecret();

        if (! $sessionId || ! $secret) {
            return redirect($frontend . '/pricing?checkout=failed');
        }

        try {
            $session = Http::withToken($secret)
                ->get("https://api.stripe.com/v1/checkout/sessions/{$sessionId}")
                ->throw()->json();
        } catch (\Throwable $e) {
            Log::warning('Stripe return verify failed: ' . $e->getMessage());
            return redirect($frontend . '/pricing?checkout=failed');
        }

        $paid = ($session['payment_status'] ?? '') === 'paid' || ($session['status'] ?? '') === 'complete';
        if (! $paid) {
            return redirect($frontend . '/pricing?checkout=canceled');
        }

        $this->activateSubscription($session);

        $package = Package::find($session['metadata']['package_id'] ?? null);
        $plan = $package ? urlencode($package->name) : '';

        return redirect($frontend . '/tools?checkout=success&plan=' . $plan);
    }

    // ─────────────────────────────── PayPal ───────────────────────────────

    protected function paypalToken(): string
    {
        $response = Http::withBasicAuth($this->settings->paypalClientId(), $this->settings->paypalSecret())
            ->asForm()
            ->post($this->settings->paypalBase() . '/v1/oauth2/token', ['grant_type' => 'client_credentials'])
            ->throw()->json();

        return $response['access_token'];
    }

    /** Everything is created dynamically — no PayPal dashboard setup needed. */
    protected function paypalPlanId(Package $package, string $token): string
    {
        $currency = strtoupper($this->settings->currency()['code'] ?? 'USD');
        $fingerprint = implode('|', [$package->price, $package->billing_cycle, $currency, $this->settings->paypalMode()]);

        if ($package->paypal_plan_id && str_ends_with($package->paypal_plan_id, '|' . $fingerprint)) {
            return explode('|', $package->paypal_plan_id)[0];
        }

        $base = $this->settings->paypalBase();

        $productId = \App\Models\Setting::get('paypal_product_id_' . $this->settings->paypalMode());
        if (! $productId) {
            $product = Http::withToken($token)->post("{$base}/v1/catalogs/products", [
                'name' => \App\Models\Setting::get('brand_name', config('app.name')) . ' subscription',
                'type' => 'SERVICE',
            ])->throw()->json();
            $productId = $product['id'];
            \App\Models\Setting::updateOrCreate(
                ['key' => 'paypal_product_id_' . $this->settings->paypalMode()],
                ['value' => $productId, 'group' => 'payments']
            );
        }

        $plan = Http::withToken($token)->post("{$base}/v1/billing/plans", [
            'product_id' => $productId,
            'name'       => $package->name,
            'billing_cycles' => [[
                'frequency' => ['interval_unit' => $package->billing_cycle === 'yearly' ? 'YEAR' : 'MONTH', 'interval_count' => 1],
                'tenure_type' => 'REGULAR',
                'sequence'    => 1,
                'total_cycles' => 0, // until canceled
                'pricing_scheme' => ['fixed_price' => ['value' => number_format($package->price, 2, '.', ''), 'currency_code' => $currency]],
            ]],
            'payment_preferences' => ['auto_bill_outstanding' => true, 'payment_failure_threshold' => 2],
        ])->throw()->json();

        $package->update(['paypal_plan_id' => $plan['id'] . '|' . $fingerprint]);

        return $plan['id'];
    }

    /** POST /api/billing/paypal/checkout */
    public function paypalCheckout(Request $request)
    {
        $data = $request->validate(['package_id' => 'required|exists:packages,id']);
        $package = Package::findOrFail($data['package_id']);

        abort_if($package->is_custom && $package->user_id !== $request->user()->id, 403,
            'This package is reserved for another customer.');
        abort_if(! $this->settings->paypalEnabled(), 503, 'PayPal payments are currently disabled.');

        $token = $this->paypalToken();
        $planId = $this->paypalPlanId($package, $token);

        $subscription = Http::withToken($token)
            ->post($this->settings->paypalBase() . '/v1/billing/subscriptions', [
                'plan_id'   => $planId,
                'custom_id' => (string) $request->user()->id,
                'application_context' => [
                    'brand_name'  => \App\Models\Setting::get('brand_name', config('app.name')),
                    'user_action' => 'SUBSCRIBE_NOW',
                    'return_url'  => url("/api/billing/paypal/return?package_id={$package->id}"),
                    'cancel_url'  => rtrim(env('FRONTEND_URL', 'http://localhost:5173'), '/') . '/pricing?checkout=canceled',
                ],
            ])->throw()->json();

        $approve = collect($subscription['links'] ?? [])->firstWhere('rel', 'approve')['href'] ?? null;
        abort_if(! $approve, 502, 'PayPal did not return an approval link.');

        return response()->json(['checkout_url' => $approve]);
    }

    /** GET /api/billing/paypal/return — PayPal redirects the browser here after approval. */
    public function paypalReturn(Request $request)
    {
        $frontend = rtrim(env('FRONTEND_URL', 'http://localhost:5173'), '/');
        $subId = $request->query('subscription_id');
        $package = Package::find($request->query('package_id'));

        if (! $subId || ! $package) {
            return redirect($frontend . '/pricing?checkout=failed');
        }

        try {
            // Verify with PayPal directly — never trust the redirect alone
            $remote = Http::withToken($this->paypalToken())
                ->get($this->settings->paypalBase() . "/v1/billing/subscriptions/{$subId}")
                ->throw()->json();
        } catch (\Throwable $e) {
            Log::warning('PayPal verify failed: ' . $e->getMessage());
            return redirect($frontend . '/pricing?checkout=failed');
        }

        $user = User::find($remote['custom_id'] ?? null);
        $active = in_array($remote['status'] ?? '', ['ACTIVE', 'APPROVED'], true);

        if (! $user || ! $active) {
            return redirect($frontend . '/pricing?checkout=failed');
        }

        Subscription::updateOrCreate(
            ['paypal_subscription_id' => $subId],
            [
                'user_id'    => $user->id,
                'package_id' => $package->id,
                'gateway'    => 'paypal',
                'status'     => 'active',
                'expires_at' => $package->billing_cycle === 'yearly' ? now()->addYear() : now()->addMonth(),
            ]
        );

        app(\App\Services\NotificationService::class)->planPurchased($user, $package->name);

        return redirect($frontend . '/tools?checkout=success&plan=' . urlencode($package->name));
    }

    /** POST /api/billing/cancel — customer cancels their own plan (access continues until expiry). */
    public function cancel(Request $request)
    {
        $sub = $request->user()->activeSubscription()->first();
        abort_if(! $sub, 422, 'You have no active subscription to cancel.');
        abort_if($sub->cancel_at_period_end, 422, 'Your subscription is already set to cancel.');

        if ($sub->gateway === 'paypal' && $sub->paypal_subscription_id && $this->settings->paypalEnabled()) {
            try {
                Http::withToken($this->paypalToken())
                    ->post($this->settings->paypalBase() . "/v1/billing/subscriptions/{$sub->paypal_subscription_id}/cancel",
                        ['reason' => 'Customer canceled from the account page.']);
            } catch (\Throwable $e) {
                Log::warning('PayPal cancel failed: ' . $e->getMessage());
            }
        }

        // Tell Stripe not to renew (customer keeps what they paid for until the period ends).
        if ($sub->gateway === 'stripe' && $sub->stripe_subscription_id) {
            $secret = $this->settings->stripeSecret();
            if ($secret) {
                Http::withToken($secret)->asForm()
                    ->post("https://api.stripe.com/v1/subscriptions/{$sub->stripe_subscription_id}", [
                        'cancel_at_period_end' => 'true',
                    ])->throw();
            }
        }

        $sub->update(['cancel_at_period_end' => true]);

        return response()->json([
            'message' => 'Your subscription will not renew. You keep full access until '
                . optional($sub->expires_at)->format('M j, Y') . '.',
            'subscription' => $sub->fresh()->load('package'),
        ]);
    }

    /** POST /api/billing/webhook/stripe — Stripe event handler (excluded from auth + CSRF). */
    public function stripeWebhook(Request $request)
    {
        if (! $this->verifyStripeSignature($request)) {
            return response()->json(['message' => 'Invalid signature.'], 400);
        }

        $event = $request->json()->all();
        $type  = $event['type'] ?? '';
        $object = $event['data']['object'] ?? [];

        match ($type) {
            'checkout.session.completed'    => $this->activateSubscription($object),
            'invoice.payment_succeeded'     => $this->renewSubscription($object),
            'customer.subscription.deleted' => $this->cancelSubscription($object),
            default                         => Log::info("Stripe webhook ignored: {$type}"),
        };

        return response()->json(['received' => true]);
    }

    protected function verifyStripeSignature(Request $request): bool
    {
        $secret = $this->settings->stripeWebhookSecret();
        if (! $secret) {
            return app()->environment('local'); // allow unsigned events only in local dev
        }

        $header = $request->header('Stripe-Signature', '');
        parse_str(str_replace(',', '&', $header), $parts);

        $signed = hash_hmac('sha256', ($parts['t'] ?? '') . '.' . $request->getContent(), $secret);

        return hash_equals($signed, $parts['v1'] ?? '');
    }

    protected function activateSubscription(array $session): void
    {
        $user = User::find($session['client_reference_id'] ?? null);
        $packageId = $session['metadata']['package_id'] ?? null;
        if (! $user || ! $packageId) {
            return;
        }

        $package = Package::find($packageId);

        Subscription::updateOrCreate(
            ['stripe_subscription_id' => $session['subscription'] ?? null],
            [
                'user_id'    => $user->id,
                'package_id' => $packageId,
                'gateway'    => 'stripe',
                'status'     => 'active',
                'expires_at' => $package?->billing_cycle === 'yearly' ? now()->addYear() : now()->addMonth(),
            ]
        );

        if ($package) {
            app(\App\Services\NotificationService::class)->planPurchased($user, $package->name);
        }
    }

    protected function renewSubscription(array $invoice): void
    {
        $sub = Subscription::where('stripe_subscription_id', $invoice['subscription'] ?? null)->first();
        if ($sub) {
            $sub->update([
                'status'     => 'active',
                'expires_at' => $sub->package?->billing_cycle === 'yearly' ? now()->addYear() : now()->addMonth(),
            ]);
        }
    }

    protected function cancelSubscription(array $subscription): void
    {
        Subscription::where('stripe_subscription_id', $subscription['id'] ?? null)
            ->update(['status' => 'canceled']);
    }

    /**
     * PayPal / local gateway extension point.
     * Implement createPaypalOrder() + paypalWebhook() here following the
     * same pattern: create plan checkout → verify webhook → upsert Subscription.
     */
}
