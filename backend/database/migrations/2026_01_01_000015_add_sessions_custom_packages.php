<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('packages', function (Blueprint $table) {
            if (! Schema::hasColumn('packages', 'max_sessions')) {
                $table->unsignedSmallInteger('max_sessions')->nullable(); // null = unlimited browsers
            }
            if (! Schema::hasColumn('packages', 'is_custom')) {
                $table->boolean('is_custom')->default(false);
            }
            if (! Schema::hasColumn('packages', 'user_id')) {
                $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete(); // custom package owner
            }
        });
    }

    public function down(): void
    {
        Schema::table('packages', function (Blueprint $table) {
            if (Schema::hasColumn('packages', 'user_id')) $table->dropConstrainedForeignId('user_id');
            foreach (['max_sessions', 'is_custom'] as $col) {
                if (Schema::hasColumn('packages', $col)) $table->dropColumn($col);
            }
        });
    }
};
