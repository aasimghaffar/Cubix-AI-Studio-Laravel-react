<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Package extends Model
{
    protected $fillable = [
        'name', 'price', 'billing_cycle', 'stripe_plan_id',
        'paypal_plan_id', 'status', 'features', 'discount_percent', 'max_sessions', 'is_custom', 'user_id', 'paypal_plan_id',
    ];

    protected $casts = [
        'is_custom' => 'boolean',
        'features' => 'array',
        'price'    => 'decimal:2',
    ];

    public function subscriptions()
    {
        return $this->hasMany(Subscription::class);
    }

    /** Limit for a given feature key, e.g. image_generation_credits. 0 = not included. */
    public function limitFor(string $featureKey): int
    {
        return (int) ($this->features[$featureKey] ?? 0);
    }
}
