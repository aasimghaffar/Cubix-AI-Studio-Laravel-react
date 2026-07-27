<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SitePage extends Model
{
    protected $fillable = ['slug', 'title', 'content', 'is_system', 'published', 'layout'];

    protected $casts = ['is_system' => 'boolean', 'published' => 'boolean'];
}
