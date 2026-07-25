<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AiTool extends Model
{
    protected $fillable = [
        'slug', 'name', 'icon', 'description', 'status',
        'feature_key', 'sort_order', 'input_schema', 'free_enabled', 'free_limit', 'free_unit',
     'taxonomy_id',];

    protected $casts = ['input_schema' => 'array', 'free_enabled' => 'boolean'];

    public function scopeVisible($query)
    {
        return $query->whereIn('status', ['active', 'coming_soon'])->orderBy('sort_order');
    }

    public function taxonomy()
    {
        return $this->belongsTo(Taxonomy::class);
    }
}
