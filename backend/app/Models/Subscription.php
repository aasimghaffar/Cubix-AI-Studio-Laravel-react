<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Subscription extends Model
{
    protected $fillable = [
        'user_id', 'package_id', 'gateway', 'stripe_subscription_id',
        'status', 'expires_at', 'credit_adjustments', 'cancel_at_period_end', 'paypal_subscription_id',
    ];

    protected $casts = [
        'expires_at'         => 'datetime',
        'credit_adjustments' => 'array',
        'cancel_at_period_end' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function package()
    {
        return $this->belongsTo(Package::class);
    }

    /** Package limit + any manual adjustment granted by the admin. */
    public function effectiveLimit(string $featureKey): int
    {
        $base  = $this->package?->limitFor($featureKey) ?? 0;
        if ((int) $base === -1) return -1; // -1 = unlimited credits for this tool

        $bonus = (int) ($this->credit_adjustments[$featureKey] ?? 0);

        return max(0, $base + $bonus);
    }

    /** Start of the current billing cycle window for usage counting. */
    public function cycleStart(): \Carbon\Carbon
    {
        $anchor = $this->created_at ?? now();

        return $this->package?->billing_cycle === 'yearly'
            ? $anchor->copy()->addYears($anchor->diffInYears(now()))
            : $anchor->copy()->addMonths($anchor->diffInMonths(now()));
    }
}
