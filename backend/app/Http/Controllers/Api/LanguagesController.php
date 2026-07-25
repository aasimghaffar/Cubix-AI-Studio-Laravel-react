<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Language;
use Illuminate\Http\Request;

class LanguagesController extends Controller
{
    /** GET /api/languages — enabled languages with translations (public). */
    public function index()
    {
        return Language::where('enabled', true)
            ->orderBy('sort_order')
            ->get(['code', 'name', 'native_name', 'dir', 'translations']);
    }

    /** GET /api/admin/languages — all languages for management. */
    public function adminIndex()
    {
        return Language::orderBy('sort_order')->get();
    }

    /** POST /api/admin/languages — add a custom language. */
    public function store(Request $request)
    {
        $data = $request->validate([
            'code'         => 'required|string|max:10|unique:languages,code',
            'name'         => 'required|string|max:60',
            'native_name'  => 'required|string|max:60',
            'dir'          => 'required|in:ltr,rtl',
            'translations' => 'required|array',
        ]);

        return Language::create($data + [
            'enabled'    => true,
            'is_custom'  => true,
            'sort_order' => (Language::max('sort_order') ?? 0) + 1,
        ]);
    }

    /** PUT /api/admin/languages/{language} — enable/disable or edit translations. */
    public function update(Request $request, Language $language)
    {
        $data = $request->validate([
            'enabled'      => 'sometimes|boolean',
            'name'         => 'sometimes|string|max:60',
            'native_name'  => 'sometimes|string|max:60',
            'dir'          => 'sometimes|in:ltr,rtl',
            'translations' => 'sometimes|array',
            'sort_order'   => 'sometimes|integer|min:0',
        ]);

        // English is the fallback dictionary — it can be edited but never disabled.
        if ($language->code === 'en' && array_key_exists('enabled', $data) && ! $data['enabled']) {
            abort(422, 'English is the fallback language and cannot be disabled.');
        }

        $language->update($data);

        return $language;
    }

    /** DELETE /api/admin/languages/{language} — custom languages only. */
    public function destroy(Language $language)
    {
        abort_if(! $language->is_custom, 422, 'Built-in languages can be disabled but not deleted.');
        $language->delete();

        return response()->json(['message' => 'Language deleted.']);
    }

    /**
     * GET /api/admin/languages/template
     * The complete list of every text key on the site with its English value.
     * Translate the values (keep the keys!) and upload the file as a new
     * language — the entire site switches, WordPress-style.
     */
    public function template(\App\Services\AutoTranslateService $translator)
    {
        // Make sure every dynamic text (pages, packages, categories, testimonials,
        // tools, menu) is included before exporting.
        $strings = $translator->syncContentKeys();
        ksort($strings);

        return response()->json($strings, 200, [
            'Content-Disposition' => 'attachment; filename="translation-template.json"',
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    }

    /**
     * POST /api/admin/languages/{language}/auto-translate
     * Machine-translate the entire site into this language automatically.
     */
    public function autoTranslate(\App\Models\Language $language, \App\Services\AutoTranslateService $translator)
    {
        abort_if($language->code === 'en', 422, 'English is the source language.');

        set_time_limit(300); // whole-site translation can take a couple of minutes

        [$done, $failed] = $translator->translateAll($language->code, overwrite: request()->boolean('overwrite'));

        return response()->json([
            'message' => "Translated {$done} texts automatically" . ($failed ? " ({$failed} kept English fallback — run again to retry)." : '.'),
            'translated' => $done,
            'failed' => $failed,
        ]);
    }
}
