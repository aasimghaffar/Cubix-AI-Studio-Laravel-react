<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('packages')) {
            Schema::create('packages', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->decimal('price', 10, 2)->default(0);
                $table->string('billing_cycle')->default('monthly'); // monthly | yearly
                $table->string('stripe_plan_id')->nullable();
                $table->string('paypal_plan_id')->nullable();
                $table->string('status')->default('active'); // active | inactive
                // e.g. {"image_generation_credits":50,"document_query_credits":100,
                //       "background_removal_credits":30,"audio_character_limit":10000}
                $table->json('features');
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('packages');
    }
};
