<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Services\AI\AiService;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    /** Secrets are returned masked — never send full keys back to the browser. */
    public function index()
    {
        return Setting::all()->map(function (Setting $s) {
            $value = $s->value;
            if (Setting::isSecret($s->key)) {
                $plain = Setting::get($s->key);
                $value = $plain ? '••••' . substr($plain, -4) : null;
            }
            return ['key' => $s->key, 'value' => $value, 'group' => $s->group, 'is_secret' => Setting::isSecret($s->key)];
        })->values();
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'settings'         => 'required|array',
            'settings.*.key'   => 'required|string|max:100',
            'settings.*.value' => 'nullable|string',
            'settings.*.group' => 'nullable|string|max:50',
        ]);

        foreach ($data['settings'] as $item) {
            // Skip masked placeholders so an untouched secret field doesn't overwrite the real key.
            if (str_starts_with((string) $item['value'], '••••')) {
                continue;
            }
            Setting::put($item['key'], $item['value'], $item['group'] ?? 'general');
        }

        return response()->json(['message' => 'Settings saved.']);
    }

    /** POST /api/admin/settings/logo — upload the site logo (PNG/JPG/SVG/WebP, max 2 MB). */
    public function uploadLogo(Request $request)
    {
        $request->validate([
            'logo' => 'required|file|mimes:png,jpg,jpeg,svg,webp|max:2048',
        ]);

        $path = $request->file('logo')->storeAs(
            'branding',
            'logo.' . $request->file('logo')->getClientOriginalExtension(),
            'public'
        );

        $url = \Illuminate\Support\Facades\Storage::url($path) . '?v=' . time();
        Setting::put('brand_logo', $url, 'branding');

        return response()->json(['brand_logo' => $url]);
    }

    /** POST /api/admin/settings/logo/remove — revert to the default icon. */
    public function removeLogo()
    {
        Setting::put('brand_logo', null, 'branding');

        return response()->json(['brand_logo' => null]);
    }

    /** POST /api/admin/settings/test/{provider} — "Test Connection" button. */
    public function testConnection(\Illuminate\Http\Request $request, string $provider, AiService $ai)
    {
        // Test what's typed in the form RIGHT NOW — saving first is not required.
        $overrides = $request->input('overrides', []);
        if (is_array($overrides)) {
            app(\App\Services\SettingsService::class)->override($overrides);
        }

        if ($provider === 'paypal') {
            try {
                $settings = app(\App\Services\SettingsService::class);
                abort_if(! $settings->paypalClientId() || ! $settings->paypalSecret(), 422, 'Enter the PayPal Client ID and Secret first.');
                \Illuminate\Support\Facades\Http::withBasicAuth($settings->paypalClientId(), $settings->paypalSecret())
                    ->asForm()->timeout(20)
                    ->post($settings->paypalBase() . '/v1/oauth2/token', ['grant_type' => 'client_credentials'])
                    ->throw();
                return response()->json(['ok' => true, 'message' => 'PayPal credentials work (' . $settings->paypalMode() . ' mode)!']);
            } catch (\Throwable $e) {
                return response()->json(['ok' => false, 'message' => 'PayPal rejected the credentials — check ID, secret, and mode.']);
            }
        }

        // Google OAuth credentials: ask Google's token endpoint to exchange a
        // deliberately invalid code. Google answers "invalid_client" when the
        // ID/secret are wrong and "invalid_grant" when they are correct but the
        // code isn't — so invalid_grant is our success signal. No user
        // interaction and nothing is created on Google's side.
        if ($provider === 'google') {
            $settings = app(\App\Services\SettingsService::class);
            $clientId = \App\Models\Setting::get('google_client_id');
            $secret   = \App\Models\Setting::get('google_client_secret');

            foreach ($overrides as $k => $v) {
                if ($k === 'google_client_id' && $v !== '' && ! str_contains($v, '•')) $clientId = $v;
                if ($k === 'google_client_secret' && $v !== '' && ! str_contains($v, '•')) $secret = $v;
            }

            if (! $clientId || ! $secret) {
                return response()->json(['ok' => false, 'message' => 'Enter the Google Client ID and Secret first.']);
            }
            if (! str_ends_with($clientId, '.apps.googleusercontent.com')) {
                return response()->json(['ok' => false, 'message' => 'That does not look like a Google Client ID — it should end in .apps.googleusercontent.com']);
            }

            try {
                $res = \Illuminate\Support\Facades\Http::asForm()->timeout(20)
                    ->post('https://oauth2.googleapis.com/token', [
                        'client_id'     => $clientId,
                        'client_secret' => $secret,
                        'code'          => 'connection-test-invalid-code',
                        'grant_type'    => 'authorization_code',
                        'redirect_uri'  => \App\Http\Controllers\Api\GoogleAuthController::redirectUri(),
                    ]);
                $error = $res->json('error');

                if ($error === 'invalid_grant') {
                    return response()->json(['ok' => true, 'message' =>
                        'Google credentials work. Authorized redirect URI must be exactly: ' .
                        \App\Http\Controllers\Api\GoogleAuthController::redirectUri()]);
                }
                if ($error === 'invalid_client') {
                    return response()->json(['ok' => false, 'message' => 'Google rejected these credentials — check the Client ID and Secret.']);
                }

                return response()->json(['ok' => false, 'message' => 'Google replied: ' . ($res->json('error_description') ?? $error ?? 'unexpected response')]);
            } catch (\Throwable $e) {
                return response()->json(['ok' => false, 'message' => 'Could not reach Google — check the server internet connection.']);
            }
        }

        return response()->json($ai->testConnection($provider));
    }
}
