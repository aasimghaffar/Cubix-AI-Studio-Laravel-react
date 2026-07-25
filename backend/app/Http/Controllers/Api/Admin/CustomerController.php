<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Package;
use App\Models\Subscription;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class CustomerController extends Controller
{
    public function __construct(protected NotificationService $notify) {}

    public function index(Request $request)
    {
        // Admins are listed too so they can manage their own sign-in details here.
        return User::whereIn('role', ['customer', 'admin'])
            ->with('activeSubscription.package')
            ->when($request->query('search'), fn ($q, $s) =>
                $q->where(fn ($w) => $w->where('name', 'like', "%{$s}%")->orWhere('email', 'like', "%{$s}%")))
            ->orderByRaw("FIELD(role, 'admin', 'customer')")
            ->latest()
            ->paginate(20);
    }

    /** POST /api/admin/customers — admin creates a customer account. */
    public function store(Request $request)
    {
        $data = $request->validate([
            'name'     => 'required|string|max:100',
            'email'    => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
        ]);

        $user = User::create($data + ['role' => 'customer', 'status' => 'active']);

        $this->notify->accountCreated($user);

        return response()->json($user, 201);
    }

    /** POST /api/admin/customers/{user}/assign-plan — manual subscription (no payment). */
    public function assignPlan(Request $request, User $user)
    {
        abort_if($user->isAdmin(), 422, 'Plans can only be assigned to customers.');

        $data = $request->validate([
            'package_id' => 'required|exists:packages,id',
            'months'     => 'required|integer|min:1|max:36',
        ]);

        $package = Package::findOrFail($data['package_id']);
        abort_if($package->status !== 'active', 422, 'This package is inactive.');

        // Cancel any current subscription so limits come from the new plan only.
        $user->subscriptions()->where('status', 'active')->update(['status' => 'canceled']);

        $subscription = Subscription::create([
            'user_id'    => $user->id,
            'package_id' => $package->id,
            'gateway'    => 'manual',
            'status'     => 'active',
            'expires_at' => now()->addMonths($data['months']),
        ]);

        $this->notify->planPurchased($user, $package->name);

        return response()->json($subscription->load('package'), 201);
    }

    /** POST /api/admin/customers/{user}/status — pending <-> active. */
    public function setStatus(Request $request, User $user)
    {
        abort_if($user->isAdmin(), 422, 'Admin status cannot be changed here.');

        $data = $request->validate(['status' => 'required|in:pending,active']);

        $user->update([
            'status'             => $data['status'],
            'email_verified_at'  => $data['status'] === 'active' ? ($user->email_verified_at ?? now()) : $user->email_verified_at,
            'verification_token' => $data['status'] === 'active' ? null : $user->verification_token,
        ]);

        return $user;
    }

    /** Toggle block/unblock (emails the customer when blocked). */
    /**
     * PUT /api/admin/customers/{user} — edit name, email and (optionally) password.
     *
     * Changing an ADMIN account's password requires that admin's current
     * password, which in practice means admins can only reset their own.
     * Customer passwords can be reset by an admin without it.
     */
    public function update(Request $request, User $user)
    {
        $data = $request->validate([
            'first_name'       => 'required|string|max:60',
            'last_name'        => 'nullable|string|max:60',
            'email'            => 'required|email|unique:users,email,' . $user->id,
            'password'         => 'nullable|string|min:8',
            'current_password' => 'nullable|string',
            'notify'           => 'sometimes|boolean',
        ]);

        if ($user->role === 'admin' && ! empty($data['password'])) {
            if (empty($data['current_password']) || ! Hash::check($data['current_password'], $user->password)) {
                return response()->json([
                    'message' => 'The current password is incorrect. Changing an administrator password requires it.',
                    'errors'  => ['current_password' => ['The current password is incorrect.']],
                ], 422);
            }
        }

        $name = trim($data['first_name'] . ' ' . ($data['last_name'] ?? ''));

        $user->update(array_filter([
            'name'     => $name,
            'email'    => $data['email'],
            'password' => ! empty($data['password']) ? Hash::make($data['password']) : null,
        ], fn ($v) => $v !== null));

        // Signing details changed → other browser sessions should re-authenticate.
        if (! empty($data['password'])) {
            $user->tokens()->where('id', '!=', optional($request->user()->currentAccessToken())->id)->delete();
        }

        if ($request->boolean('notify')) {
            $this->sendUpdateEmail($user, $data['password'] ?? null);
        }

        return $user->fresh()->load('activeSubscription.package');
    }

    /** POST /api/admin/customers/{user}/notify — email the user their current details. */
    public function notifyUpdate(User $user)
    {
        $this->sendUpdateEmail($user, null);

        return response()->json(['message' => "Details emailed to {$user->email}."]);
    }

    protected function sendUpdateEmail(User $user, ?string $newPassword): void
    {
        $this->notify->accountUpdated($user, [
            'Name'  => $user->name,
            'Email' => $user->email,
        ], $newPassword);
    }

    public function toggleBlock(User $user)
    {
        abort_if($user->isAdmin(), 422, 'Admins cannot be blocked.');
        $user->update(['is_blocked' => ! $user->is_blocked]);

        if ($user->is_blocked) {
            $user->tokens()->delete(); // force sign-out everywhere
            $this->notify->accountBlocked($user);
        }

        return $user;
    }

    /** Manually adjust remaining credits by writing bonus credits onto the subscription. */
    public function adjustCredits(Request $request, User $user)
    {
        $data = $request->validate([
            'feature_key' => 'required|string',
            'bonus'       => 'required|integer',
        ]);

        $sub = $user->activeSubscription()->first();
        abort_if(! $sub, 422, 'This customer has no active subscription.');

        $adjustments = $sub->credit_adjustments ?? [];
        $adjustments[$data['feature_key']] = ($adjustments[$data['feature_key']] ?? 0) + $data['bonus'];
        $sub->update(['credit_adjustments' => $adjustments]);

        return $sub->fresh();
    }
}
