<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Taxonomy extends Model
{
    protected $fillable = ['name', 'slug', 'sort_order'];

    public function tools()
    {
        return $this->hasMany(AiTool::class);
    }
}
