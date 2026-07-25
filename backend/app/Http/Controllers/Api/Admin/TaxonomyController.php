<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Taxonomy;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class TaxonomyController extends Controller
{
    public function index()
    {
        return Taxonomy::withCount('tools')->orderBy('sort_order')->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate(['name' => 'required|string|max:60']);
        $slug = Str::slug($data['name']);
        abort_if(Taxonomy::where('slug', $slug)->exists(), 422, 'This category already exists.');

        return Taxonomy::create([
            'name' => $data['name'],
            'slug' => $slug,
            'sort_order' => (Taxonomy::max('sort_order') ?? 0) + 1,
        ]);
    }

    public function update(Request $request, Taxonomy $taxonomy)
    {
        $data = $request->validate([
            'name'       => 'sometimes|string|max:60',
            'sort_order' => 'sometimes|integer|min:0',
        ]);
        $taxonomy->update($data);

        return $taxonomy;
    }

    public function destroy(Taxonomy $taxonomy)
    {
        $taxonomy->delete(); // tools keep working — their category just becomes "General"

        return response()->json(['message' => 'Category deleted.']);
    }
}
