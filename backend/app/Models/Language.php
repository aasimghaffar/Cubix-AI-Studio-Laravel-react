<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Language extends Model
{
    protected $fillable = [
        'code', 'name', 'native_name', 'dir', 'enabled',
        'is_custom', 'sort_order', 'translations',
    ];

    protected $casts = [
        'enabled'      => 'boolean',
        'is_custom'    => 'boolean',
        'translations' => 'array',
    ];
}
