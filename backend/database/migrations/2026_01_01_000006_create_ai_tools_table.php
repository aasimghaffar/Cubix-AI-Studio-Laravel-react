<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('ai_tools')) {
            Schema::create('ai_tools', function (Blueprint $table) {
                $table->id();
                $table->string('slug')->unique();
                $table->string('name');
                $table->string('icon')->nullable();       // lucide icon name for the frontend
                $table->string('description')->nullable();
                $table->string('status')->default('active'); // active | inactive | coming_soon
                $table->string('feature_key');            // maps to packages.features key
                $table->unsignedInteger('sort_order')->default(0);
                $table->json('input_schema');             // dynamic form definition served to React
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_tools');
    }
};
