<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('packages', function (Blueprint $table) {
            if (! Schema::hasColumn('packages', 'paypal_plan_id')) {
                $table->string('paypal_plan_id')->nullable(); // auto-created: "P-xxx|price|cycle|currency|mode"
            }
        });
        Schema::table('subscriptions', function (Blueprint $table) {
            if (! Schema::hasColumn('subscriptions', 'paypal_subscription_id')) {
                $table->string('paypal_subscription_id')->nullable()->index();
            }
        });
    }

    public function down(): void
    {
        Schema::table('packages', function (Blueprint $table) {
            if (Schema::hasColumn('packages', 'paypal_plan_id')) $table->dropColumn('paypal_plan_id');
        });
        Schema::table('subscriptions', function (Blueprint $table) {
            if (Schema::hasColumn('subscriptions', 'paypal_subscription_id')) $table->dropColumn('paypal_subscription_id');
        });
    }
};
