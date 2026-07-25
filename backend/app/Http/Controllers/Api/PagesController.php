<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SitePage;
use Illuminate\Http\Request;

class PagesController extends Controller
{
    /** GET /api/pages/{slug} — public page content. */
    public function show(string $slug)
    {
        return SitePage::where('slug', $slug)->where('published', true)->firstOrFail(['slug', 'title', 'content']);
    }

    /** GET /api/admin/pages */
    public function index()
    {
        return SitePage::orderBy('title')->get();
    }

    /** POST /api/admin/pages */
    public function store(Request $request)
    {
        $data = $request->validate([
            'title'   => 'required|string|max:120',
            'content' => 'nullable|string',
        ]);

        $slug = \Illuminate\Support\Str::slug($data['title']);
        abort_if(SitePage::where('slug', $slug)->exists(), 422, 'A page with this title already exists.');

        return SitePage::create($data + ['slug' => $slug, 'published' => true]);
    }

    /** PUT /api/admin/pages/{page} */
    public function update(Request $request, SitePage $page)
    {
        $data = $request->validate([
            'title'     => 'sometimes|string|max:120',
            'content'   => 'sometimes|nullable|string',
            'published' => 'sometimes|boolean',
        ]);

        $page->update($data);

        return $page;
    }

    /** DELETE /api/admin/pages/{page} */
    public function destroy(SitePage $page)
    {
        abort_if($page->is_system, 422, 'Terms and Privacy pages can be edited but not deleted.');
        \App\Models\MenuItem::where('type', 'page')->where('target', $page->slug)->delete();
        $page->delete();

        return response()->json(['message' => 'Page deleted.']);
    }
}
