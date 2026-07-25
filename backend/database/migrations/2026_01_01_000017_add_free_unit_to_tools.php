<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ai_tools', function (Blueprint $table) {
            if (! Schema::hasColumn('ai_tools', 'free_unit')) {
                $table->string('free_unit', 10)->default('month'); // month | day — when free credits renew
            }
        });
    }

    public function down(): void
    {
        Schema::table('ai_tools', function (Blueprint $table) {
            if (Schema::hasColumn('ai_tools', 'free_unit')) $table->dropColumn('free_unit');
        });
    }
};
