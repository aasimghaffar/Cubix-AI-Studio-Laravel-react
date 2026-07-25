<?php

namespace App\Console\Commands;

use App\Models\Subscription;
use App\Services\NotificationService;
use Illuminate\Console\Command;

class SendExpiryReminders extends Command
{
    protected $signature = 'subscriptions:send-expiry-reminders';
    protected $description = 'Email customers whose plan expires in N days (admin-configurable)';

    public function handle(NotificationService $notify): int
    {
        $days = $notify->expiryReminderDays();
        $target = now()->addDays($days)->toDateString();

        $subs = Subscription::with(['user', 'package'])
            ->where('status', 'active')
            ->whereDate('expires_at', $target)
            ->get();

        foreach ($subs as $sub) {
            if ($sub->user && $sub->package) {
                $notify->planExpiring($sub->user, $sub->package->name, $days);
            }
        }

        $this->info("Sent {$subs->count()} expiry reminder(s) for plans expiring on {$target}.");

        return self::SUCCESS;
    }
}
