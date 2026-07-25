<?php

namespace App\Services;

use App\Models\Setting;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * Sends transactional emails to customers — each type can be switched
 * on/off by the admin in Settings → Email notifications.
 *
 * Types: account_created | account_updated | account_blocked | plan_purchased | plan_expiry
 */
class NotificationService
{
    /** Use the admin's configured sender address when set (Admin → Settings → Business info). */
    protected function applyMailFrom(): void
    {
        $from = \App\Models\Setting::get('mail_from_address');
        if ($from) {
            config(['mail.from.address' => $from]);
            config(['mail.from.name' => \App\Models\Setting::get('brand_name', config('app.name'))]);
        }
    }

    public function isEnabled(string $type): bool
    {
        return Setting::get("notify_{$type}", '1') === '1';
    }

    public function expiryReminderDays(): int
    {
        return max(1, (int) Setting::get('notify_expiry_days', 3));
    }

    public function send(string $type, User $user, string $subject, string $body): void
    {
        if (! $this->isEnabled($type)) {
            return;
        }

        $brand = Setting::get('brand_name', 'Cubix AI Studio');

        try {
            Mail::raw($body . "\n\n— The {$brand} team", function ($message) use ($user, $subject, $brand) {
                $message->to($user->email, $user->name)->subject("[{$brand}] {$subject}");
            });
        } catch (\Throwable $e) {
            // Never let a mail failure break the main action (e.g. registration).
            Log::warning("Notification email failed ({$type}): " . $e->getMessage());
        }
    }

    /** Verification is essential — always sent, ignoring notification toggles. */
    public function sendVerification(User $user): void
    {
        $brand = Setting::get('brand_name', 'Cubix AI Studio');
        $link  = url("/api/auth/verify/{$user->verification_token}");

        try {
            Mail::raw(
                "Hi {$user->name},\n\nWelcome to {$brand}! Please confirm your email address by opening this link:\n\n{$link}\n\nIf you didn't create this account, you can ignore this email.\n\n— The {$brand} team",
                fn ($m) => $m->to($user->email, $user->name)->subject("[{$brand}] Verify your email")
            );
        } catch (\Throwable $e) {
            Log::warning('Verification email failed: ' . $e->getMessage());
        }
    }

    public function accountCreated(User $user): void
    {
        $this->applyMailFrom();
        $this->send('account_created', $user, 'Welcome aboard!',
            "Hi {$user->name},\n\nYour account has been created successfully. Sign in with your email address to start exploring the AI tools.");
    }

    /**
     * Tells the customer what an admin changed on their account. The new
     * password is included ONLY when the admin actually set one, and is
     * passed separately so it is never persisted anywhere.
     */
    public function accountUpdated(User $user, array $changes, ?string $newPassword = null): void
    {
        $this->applyMailFrom();

        $lines = '';
        foreach ($changes as $label => $value) {
            $lines .= "- {$label}: {$value}\n";
        }
        if ($newPassword) {
            $lines .= "- Password: {$newPassword}\n";
        }

        $body = "Hi {$user->name},\n\n"
              . "Your account details have been updated by our team. Here are your current details:\n\n"
              . $lines
              . "\nYou can sign in with these details right away.";

        if ($newPassword) {
            $body .= " For your security, please change this password after signing in (My account → Password).";
        }

        $this->send('account_updated', $user, 'Your account details have been updated', $body);
    }

    public function accountBlocked(User $user): void
    {
        $this->applyMailFrom();
        if (! $user->wantsNotification('account_updates')) return;
        $this->send('account_blocked', $user, 'Your account has been suspended',
            "Hi {$user->name},\n\nYour account has been suspended by an administrator. If you believe this is a mistake, please contact support.");
    }

    public function planPurchased(User $user, string $packageName): void
    {
        $this->applyMailFrom();
        if (! $user->wantsNotification('plan_purchased')) return;
        $this->send('plan_purchased', $user, 'Your plan is active',
            "Hi {$user->name},\n\nYour \"{$packageName}\" plan is now active. Your credits are ready — happy creating!");
    }

    public function planExpiring(User $user, string $packageName, int $days): void
    {
        $this->applyMailFrom();
        if (! $user->wantsNotification('plan_expiry')) return;
        $this->send('plan_expiry', $user, 'Your plan expires soon',
            "Hi {$user->name},\n\nYour \"{$packageName}\" plan expires in {$days} day(s). Renew or upgrade to keep your credits flowing without interruption.");
    }
}
