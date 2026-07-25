<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('generations')) {
            Schema::create('generations', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->string('tool_slug')->index();
                $table->json('input')->nullable();   // the form values (files excluded)
                $table->json('output');              // the tool result payload
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('generations');
    }
};
