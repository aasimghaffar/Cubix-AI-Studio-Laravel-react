<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('languages')) {
            Schema::create('languages', function (Blueprint $table) {
                $table->id();
                $table->string('code', 10)->unique();   // en, es, zh, ar, fr…
                $table->string('name');                 // English name
                $table->string('native_name');          // Shown in the switcher
                $table->string('dir', 3)->default('ltr'); // ltr | rtl
                $table->boolean('enabled')->default(true);
                $table->boolean('is_custom')->default(false);
                $table->unsignedInteger('sort_order')->default(0);
                $table->json('translations');           // flat key → string map
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('languages');
    }
};
