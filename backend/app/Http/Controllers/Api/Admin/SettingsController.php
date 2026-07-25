<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Services\AI\AiService;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    /** Secrets are returned masked — never send full keys back to the browser. */
    public function index()
    {
        return Setting::all()->map(function (Setting $s) {
            $value = $s->value;
            if (Setting::isSecret($s->key)) {
                $plain = Setting::get($s->key);
                $value = $plain ? '••••' . substr($plain, -4) : null;
            }
            return ['key' => $s->key, 'value' => $value, 'group' => $s->group, 'is_secret' => Setting::isSecret($s->key)];
        })->values();
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'settings'         => 'required|array',
            'settings.*.key'   => 'required|string|max:100',
            'settings.*.value' => 'nullable|string',
            'settings.*.group' => 'nullable|string|max:50',
        ]);

        foreach ($data['settings'] as $item) {
            // Skip masked placeholders so an untouched secret field doesn't overwrite the real key.
            if (str_starts_with((string) $item['value'], '••••')) {
                continue;
            }
            Setting::put($item['key'], $item['value'], $item['group'] ?? 'general');
        }

        return response()->json(['message' => 'Settings saved.']);
    }

    /** POST /api/admin/settings/logo — upload the site logo (PNG/JPG/SVG/WebP, max 2 MB). */
    public function uploadLogo(Request $request)
    {
        $request->validate([
            'logo' => 'required|file|mimes:png,jpg,jpeg,svg,webp|max:2048',
        ]);

        $path = $request->file('logo')->storeAs(
            'branding',
            'logo.' . $request->file('logo')->getClientOriginalExtension(),
            'public'
        );

        $url = \Illuminate\Support\Facades\Storage::url($path) . '?v=' . time();
        Setting::put('brand_logo', $url, 'branding');

        return response()->json(['brand_logo' => $url]);
    }

    /** POST /api/admin/settings/logo/remove — revert to the default icon. */
    public function removeLogo()
    {
        Setting::put('brand_logo', null, 'branding');

        return response()->json(['brand_logo' => null]);
    }

    /** POST /api/admin/settings/test/{provider} — "Test Connection" button. */
    public function testConnection(\Illuminate\Http\Request $request, string $provider, AiService $ai)
    {
        // Test what's typed in the form RIGHT NOW — saving first is not required.
        $overrides = $request->input('overrides', []);
        if (is_array($overrides)) {
            app(\App\Services\SettingsService::class)->override($overrides);
        }

        if ($provider === 'paypal') {
            try {
                $settings = app(\App\Services\SettingsService::class);
                abort_if(! $settings->paypalClientId() || ! $settings->paypalSecret(), 422, 'Enter the PayPal Client ID and Secret first.');
                \Illuminate\Support\Facades\Http::withBasicAuth($settings->paypalClientId(), $settings->paypalSecret())
                    ->asForm()->timeout(20)
                    ->post($settings->paypalBase() . '/v1/oauth2/token', ['grant_type' => 'client_credentials'])
                    ->throw();
                return response()->json(['ok' => true, 'message' => 'PayPal credentials work (' . $settings->paypalMode() . ' mode)!']);
            } catch (\Throwable $e) {
                return response()->json(['ok' => false, 'message' => 'PayPal rejected the credentials — check ID, secret, and mode.']);
            }
        }

        return response()->json($ai->testConnection($provider));
    }
}
