<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Testimonial;
use Illuminate\Http\Request;

class TestimonialsController extends Controller
{
    /** GET /api/testimonials — public, enabled only. */
    public function index()
    {
        return Testimonial::where('enabled', true)->orderBy('sort_order')->get(['id', 'name', 'role', 'quote', 'rating']);
    }

    /** GET /api/admin/testimonials */
    public function adminIndex()
    {
        return Testimonial::orderBy('sort_order')->get();
    }

    /** POST /api/admin/testimonials */
    public function store(Request $request)
    {
        $data = $request->validate([
            'name'   => 'required|string|max:80',
            'role'   => 'nullable|string|max:120',
            'quote'  => 'required|string|max:600',
            'rating' => 'nullable|integer|min:1|max:5',
        ]);

        return Testimonial::create($data + [
            'sort_order' => (Testimonial::max('sort_order') ?? 0) + 1,
            'enabled'    => true,
        ]);
    }

    /** PUT /api/admin/testimonials/{testimonial} */
    public function update(Request $request, Testimonial $testimonial)
    {
        $data = $request->validate([
            'name'       => 'sometimes|string|max:80',
            'role'       => 'sometimes|nullable|string|max:120',
            'quote'      => 'sometimes|string|max:600',
            'rating'     => 'sometimes|integer|min:1|max:5',
            'sort_order' => 'sometimes|integer|min:0',
            'enabled'    => 'sometimes|boolean',
        ]);

        $testimonial->update($data);

        return $testimonial;
    }

    /** DELETE /api/admin/testimonials/{testimonial} */
    public function destroy(Testimonial $testimonial)
    {
        $testimonial->delete();

        return response()->json(['message' => 'Testimonial removed.']);
    }
}
