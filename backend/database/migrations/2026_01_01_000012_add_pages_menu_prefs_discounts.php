<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'google_id')) {
                $table->string('google_id')->nullable()->index();
            }
            if (! Schema::hasColumn('users', 'notify_prefs')) {
                $table->json('notify_prefs')->nullable(); // per-user notification opt-outs
            }
        });

        Schema::table('packages', function (Blueprint $table) {
            if (! Schema::hasColumn('packages', 'discount_percent')) {
                $table->unsignedTinyInteger('discount_percent')->nullable(); // display badge, e.g. 20 = "20% OFF"
            }
        });

        if (! Schema::hasTable('site_pages')) {
            Schema::create('site_pages', function (Blueprint $table) {
                $table->id();
                $table->string('slug')->unique();      // terms, privacy-policy, about…
                $table->string('title');
                $table->longText('content')->nullable(); // rich HTML from the admin editor
                $table->boolean('is_system')->default(false); // terms/privacy can't be deleted
                $table->boolean('published')->default(true);
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('menu_items')) {
            Schema::create('menu_items', function (Blueprint $table) {
                $table->id();
                $table->string('label');
                $table->string('type');                // core | page | link
                $table->string('target')->nullable();  // core route (/tools), page slug, or external URL
                $table->foreignId('parent_id')->nullable()->constrained('menu_items')->nullOnDelete();
                $table->unsignedInteger('sort_order')->default(0);
                $table->boolean('enabled')->default(true);
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('menu_items');
        Schema::dropIfExists('site_pages');
        Schema::table('packages', function (Blueprint $table) {
            if (Schema::hasColumn('packages', 'discount_percent')) $table->dropColumn('discount_percent');
        });
        Schema::table('users', function (Blueprint $table) {
            foreach (['google_id', 'notify_prefs'] as $col) {
                if (Schema::hasColumn('users', $col)) $table->dropColumn($col);
            }
        });
    }
};
