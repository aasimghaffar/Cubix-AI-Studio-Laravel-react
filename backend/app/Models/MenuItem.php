<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MenuItem extends Model
{
    protected $fillable = ['label', 'type', 'target', 'parent_id', 'sort_order', 'enabled'];

    protected $casts = ['enabled' => 'boolean'];

    public function children()
    {
        return $this->hasMany(self::class, 'parent_id')->orderBy('sort_order');
    }
}
