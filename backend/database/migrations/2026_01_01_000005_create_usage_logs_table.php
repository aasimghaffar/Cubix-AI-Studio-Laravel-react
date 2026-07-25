<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('usage_logs')) {
            Schema::create('usage_logs', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->string('tool_slug')->index();     // ai-image-generator, etc.
                $table->string('feature_key')->index();   // image_generation_credits, audio_character_limit...
                $table->unsignedInteger('amount')->default(1); // credits or characters consumed
                $table->json('meta')->nullable();         // prompt, provider, cost estimate, etc.
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('usage_logs');
    }
};
