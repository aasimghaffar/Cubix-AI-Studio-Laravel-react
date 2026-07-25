<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = ['name', 'email', 'password', 'role', 'is_blocked', 'age', 'status', 'verification_token', 'google_id', 'notify_prefs', 'date_of_birth'];

    protected $hidden = ['password', 'remember_token', 'verification_token'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
            'is_blocked'        => 'boolean',
        ];
    }

    public function subscriptions()
    {
        return $this->hasMany(Subscription::class);
    }

    public function activeSubscription()
    {
        return $this->hasOne(Subscription::class)
            ->where('status', 'active')
            ->where(fn ($q) => $q->whereNull('expires_at')->orWhere('expires_at', '>', now()))
            ->latestOfMany();
    }

    public function usageLogs()
    {
        return $this->hasMany(UsageLog::class);
    }

    /** Max simultaneous browsers from the active package (null = unlimited). */
    public function sessionLimit(): ?int
    {
        if ($this->isAdmin()) return null;

        $package = $this->activeSubscription?->package;
        if (! $package) return 1; // no plan yet → one browser

        return $package->max_sessions; // null = unlimited
    }

    /** Per-user notification opt-outs. Types: plan_purchased, plan_expiry, account_updates. */
    public function wantsNotification(string $type): bool
    {
        $prefs = $this->notify_prefs ?? [];
        if (($prefs['all'] ?? true) === false) return false;
        return ($prefs[$type] ?? true) !== false;
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }
}
