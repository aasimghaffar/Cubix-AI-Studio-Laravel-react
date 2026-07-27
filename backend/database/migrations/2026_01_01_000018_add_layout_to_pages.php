<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('site_pages', function (Blueprint $table) {
            if (! Schema::hasColumn('site_pages', 'layout')) {
                // narrow (reading width, e.g. Terms) | wide (landing width, e.g. FAQ)
                // | full (edge to edge, for shortcode-driven pages)
                $table->string('layout', 20)->default('narrow');
            }
        });
    }

    public function down(): void
    {
        Schema::table('site_pages', function (Blueprint $table) {
            if (Schema::hasColumn('site_pages', 'layout')) $table->dropColumn('layout');
        });
    }
};
