<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Generation extends Model
{
    protected $fillable = ['user_id', 'tool_slug', 'input', 'output'];

    protected $casts = ['input' => 'array', 'output' => 'array'];
}
