<?php

namespace App\Services;

use App\Models\Language;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Machine-translates site text automatically using Google Translate's public
 * endpoint (no API key required). Translations live as a JSON map on each
 * languages row. Includes every dynamic text (pages, packages, categories,
 * testimonials, tools) via syncContentKeys().
 */
class AutoTranslateService
{
    /** Upsert English keys for ALL dynamic/demo content into the en dictionary. */
    public function syncContentKeys(): array
    {
        $en = Language::where('code', 'en')->first();
        if (! $en) return [];

        $map = $en->translations ?? [];

        // Complete UI dictionary — any interface text not yet in the map gets its default
        foreach (\App\Services\UiStrings::STRINGS as $key => $value) {
            if (! isset($map[$key])) $map[$key] = $value;
        }

        foreach (\App\Models\AiTool::all() as $tool) {
            $map["tool.{$tool->slug}.name"] = $tool->name;
            $map["tool.{$tool->slug}.desc"] = $tool->description ?? '';
        }
        foreach (\App\Models\SitePage::all() as $page) {
            $map["page.{$page->slug}.title"]   = $page->title;
            $map["page.{$page->slug}.content"] = $page->content ?? '';
        }
        foreach (\App\Models\Taxonomy::all() as $cat) {
            $map["taxonomy.{$cat->slug}"] = $cat->name;
        }
        foreach (\App\Models\Testimonial::all() as $ts) {
            $map["testimonial.{$ts->id}.quote"] = $ts->quote;
            if ($ts->role) $map["testimonial.{$ts->id}.role"] = $ts->role;
        }
        foreach (\App\Models\Package::where('is_custom', false)->get() as $pkg) {
            $map["package.{$pkg->id}.name"] = $pkg->name;
        }
        foreach (\App\Models\MenuItem::all() as $item) {
            $map["menu.{$item->id}"] = $item->label;
        }

        $en->update(['translations' => $map]);

        return $map;
    }

    /** Translate one string (HTML survives). Returns null on failure. */
    public function translate(string $text, string $to, string $from = 'en'): ?string
    {
        if (trim($text) === '' || $to === $from) return $text;

        try {
            $response = Http::timeout(25)->connectTimeout(6)->asForm()->post(
                'https://translate.googleapis.com/translate_a/single?client=gtx&sl=' . $from . '&tl=' . $to . '&dt=t',
                ['q' => $text]
            );

            if (! $response->ok()) return null;

            $data = $response->json();
            $out = '';
            foreach ($data[0] ?? [] as $segment) {
                $out .= $segment[0] ?? '';
            }

            return $out !== '' ? $out : null;
        } catch (\Throwable $e) {
            Log::warning("Auto-translate to {$to} failed: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Fill the whole dictionary for a language. Long values (page HTML) are
     * translated one by one; short UI strings go in batches of 40.
     */
    public function translateAll(string $to, bool $overwrite = false): array
    {
        @set_time_limit(600);
        $english = $this->syncContentKeys();
        $lang = Language::where('code', $to)->firstOrFail();
        $current = $overwrite ? [] : ($lang->translations ?? []);

        $pending = array_filter($english, fn ($v, $k) => ! isset($current[$k]) || trim((string) $current[$k]) === '', ARRAY_FILTER_USE_BOTH);
        $done = 0; $failed = 0;

        $short = []; $long = [];
        foreach ($pending as $k => $v) {
            if (mb_strlen($v) > 400) {
                $long[$k] = $v;
            } else {
                $short[$k] = $v;
            }
        }

        foreach (array_chunk($short, 25, true) as $chunk) {
            $joined = implode("\n@@\n", array_values($chunk));
            $translated = $this->translate($joined, $to);
            if ($translated === null) { sleep(2); $translated = $this->translate($joined, $to); } // one retry
            $keys = array_keys($chunk);

            if ($translated === null) { $failed += count($chunk); continue; }

            $parts = preg_split('/\n?\s*@@\s*\n?/u', $translated);
            foreach ($keys as $i => $key) {
                $value = trim($parts[$i] ?? '');
                if ($value === '') { $failed++; continue; }
                $current[$key] = $value;
                $done++;
            }
        }

        foreach ($long as $key => $value) {
            $translated = $this->translate($value, $to);
            if ($translated === null) { sleep(2); $translated = $this->translate($value, $to); }
            if ($translated === null) { $failed++; continue; }
            $current[$key] = $translated;
            $done++;
        }

        $lang->update(['translations' => $current]);

        return [$done, $failed];
    }

    /** Re-translate specific keys in every enabled language (after admin edits). */
    public function retranslateKeys(array $keyValues): void
    {
        $en = Language::where('code', 'en')->first();
        if ($en) {
            $en->update(['translations' => array_merge($en->translations ?? [], $keyValues)]);
        }

        foreach (Language::where('enabled', true)->where('code', '!=', 'en')->get() as $lang) {
            $map = $lang->translations ?? [];
            foreach ($keyValues as $key => $english) {
                $value = $this->translate($english, $lang->code);
                if ($value !== null) $map[$key] = $value;
            }
            $lang->update(['translations' => $map]);
        }
    }
}
