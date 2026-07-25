<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'age')) {
                $table->unsignedSmallInteger('age')->nullable();
            }
            if (! Schema::hasColumn('users', 'status')) {
                $table->string('status')->default('active')->index(); // pending | active
            }
            if (! Schema::hasColumn('users', 'verification_token')) {
                $table->string('verification_token', 64)->nullable()->index();
            }
        });

        Schema::table('ai_tools', function (Blueprint $table) {
            if (! Schema::hasColumn('ai_tools', 'free_enabled')) {
                $table->boolean('free_enabled')->default(false);
            }
            if (! Schema::hasColumn('ai_tools', 'free_limit')) {
                $table->unsignedInteger('free_limit')->nullable(); // null = unlimited free uses
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            foreach (['age', 'status', 'verification_token'] as $col) {
                if (Schema::hasColumn('users', $col)) $table->dropColumn($col);
            }
        });
        Schema::table('ai_tools', function (Blueprint $table) {
            foreach (['free_enabled', 'free_limit'] as $col) {
                if (Schema::hasColumn('ai_tools', $col)) $table->dropColumn($col);
            }
        });
    }
};
