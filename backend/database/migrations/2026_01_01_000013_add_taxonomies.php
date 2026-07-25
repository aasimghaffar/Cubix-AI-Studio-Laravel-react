<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('taxonomies')) {
            Schema::create('taxonomies', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('slug')->unique();
                $table->unsignedInteger('sort_order')->default(0);
                $table->timestamps();
            });
        }

        Schema::table('ai_tools', function (Blueprint $table) {
            if (! Schema::hasColumn('ai_tools', 'taxonomy_id')) {
                $table->foreignId('taxonomy_id')->nullable()->constrained('taxonomies')->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('ai_tools', function (Blueprint $table) {
            if (Schema::hasColumn('ai_tools', 'taxonomy_id')) {
                $table->dropConstrainedForeignId('taxonomy_id');
            }
        });
        Schema::dropIfExists('taxonomies');
    }
};
