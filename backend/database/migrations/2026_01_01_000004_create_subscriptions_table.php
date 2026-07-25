<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('subscriptions')) {
            Schema::create('subscriptions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->foreignId('package_id')->constrained()->cascadeOnDelete();
                $table->string('gateway')->default('stripe'); // stripe | paypal | manual
                $table->string('stripe_subscription_id')->nullable()->index();
                $table->string('status')->default('active'); // active | canceled | past_due | expired
                $table->timestamp('expires_at')->nullable();
                // Admin can grant bonus credits per tool: {"image_generation_credits": 10}
                $table->json('credit_adjustments')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('subscriptions');
    }
};
