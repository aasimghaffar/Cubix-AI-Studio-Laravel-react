<?php

namespace App\Services;

use App\Models\Setting;

/**
 * Central accessor for admin-configured settings.
 * IMPORTANT: AI provider keys always come from the database (admin panel),
 * never from the server's .env file.
 */
class SettingsService
{
    /** Temporary values used by "Test key" so unsaved keys can be verified. */
    protected array $overrides = [];

    public function override(array $values): void
    {
        $this->overrides = array_filter($values, fn ($v) => $v !== null && $v !== '' && ! str_contains((string) $v, '•'));
    }

    protected function val(string $key, $default = null)
    {
        return $this->overrides[$key] ?? Setting::get($key, $default);
    }

    public function openAiKey(): ?string        { return $this->val('openai_api_key'); }
    public function stableDiffusionKey(): ?string { return $this->val('stable_diffusion_api_key'); }
    public function clipdropKey(): ?string      { return $this->val('clipdrop_api_key'); }
    public function elevenLabsKey(): ?string    { return $this->val('elevenlabs_api_key'); }
    public function geminiKey(): ?string        { return $this->val('gemini_api_key'); }
    public function claudeKey(): ?string        { return $this->val('claude_api_key'); }
    public function deepseekKey(): ?string      { return $this->val('deepseek_api_key'); }
    public function mistralKey(): ?string       { return $this->val('mistral_api_key'); }
    public function groqKey(): ?string          { return $this->val('groq_api_key'); }
    public function removeBgKey(): ?string      { return $this->val('removebg_api_key'); }
    /** 'test' or 'live' — controls which Stripe key set is used everywhere. */
    public function paymentMode(): string
    {
        return $this->val('stripe_mode', 'test') === 'live' ? 'live' : 'test';
    }

    public function stripeSecret(): ?string
    {
        $mode = $this->paymentMode();
        // Falls back to the legacy single-key setting for smooth upgrades.
        return $this->val("stripe_{$mode}_secret_api_key") ?? $this->val('stripe_secret_api_key');
    }

    public function stripePublishable(): ?string
    {
        $mode = $this->paymentMode();
        return $this->val("stripe_{$mode}_publishable_key") ?? $this->val('stripe_publishable_key');
    }

    public function stripeWebhookSecret(): ?string
    {
        $mode = $this->paymentMode();
        return $this->val("stripe_{$mode}_webhook_secret") ?? $this->val('stripe_webhook_secret');
    }

    public function branding(): array
    {
        return [
            'brand_name'   => $this->val('brand_name', 'Cubix AI Studio'),
            'brand_color'  => $this->val('brand_color', '#0ea5a4'),
            'brand_logo'   => $this->val('brand_logo'),
            'header_style' => $this->val('header_style', 'classic'),   // classic | centered | minimal
            'footer_style' => $this->val('footer_style', 'simple'),    // simple | columns | minimal
            'currency'     => $this->currency(),
            'language_switcher' => $this->val('language_switcher', 'header'), // header | footer | both | off
            'free_limit_message' => $this->val('free_limit_message', 'Your free limit for this tool is used up — choose a plan to keep creating.'),
            'theme_toggle' => $this->val('theme_toggle_enabled', '1') === '1',
            'google_login' => $this->val('google_login_enabled') === '1' && (bool) $this->val('google_client_id'),
            'payments' => [
                'stripe' => $this->stripeEnabled() && (bool) $this->stripeSecret(),
                'paypal' => $this->paypalEnabled(),
            ],
            'business' => [
                'email'   => $this->val('business_email'),
                'phone'   => $this->val('business_phone'),
                'address' => $this->val('business_address'),
            ],
            'theme_colors' => [
                'dark_bg'    => $this->val('theme_dark_bg'),
                'dark_text'  => $this->val('theme_dark_text'),
                'light_bg'   => $this->val('theme_light_bg'),
                'light_text' => $this->val('theme_light_text'),
            ],
        ];
    }

    public function imageProvider(): string
    {
        return $this->val('image_provider', 'pollinations'); // openai | stable_diffusion
    }

    public function audioProvider(): string
    {
        return $this->val('audio_provider', 'elevenlabs'); // elevenlabs | openai
    }

    public function textProvider(): string
    {
        return $this->val('text_provider', 'openai'); // openai | gemini | claude | deepseek | mistral | groq
    }

    /**
     * Per-tool AI engine. Each tool can run on a different provider,
     * with sensible fallbacks to the old global settings.
     */
    public function engineFor(string $slug): string
    {
        $default = match ($slug) {
            'ai-image-generator'    => $this->imageProvider(),
            'ai-text-to-audio'      => $this->audioProvider(),
            'ai-background-removal' => 'clipdrop',
            default                 => $this->textProvider(),
        };

        return $this->val("engine_{$slug}", $default);
    }

    public function stripeEnabled(): bool
    {
        return $this->val('stripe_enabled', '1') === '1';
    }

    public function paypalEnabled(): bool
    {
        return $this->val('paypal_enabled') === '1' && $this->paypalClientId() && $this->paypalSecret();
    }

    public function paypalMode(): string
    {
        return $this->val('paypal_mode', 'sandbox') === 'live' ? 'live' : 'sandbox';
    }

    public function paypalBase(): string
    {
        return $this->paypalMode() === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
    }

    public function paypalClientId(): ?string
    {
        return $this->val('paypal_client_id');
    }

    public function paypalSecret(): ?string
    {
        return $this->val('paypal_secret_key');
    }

    public function currency(): array
    {
        $code = $this->val('currency_code', 'USD');
        $symbols = [
            'USD' => '$', 'EUR' => '€', 'GBP' => '£', 'PKR' => '₨', 'INR' => '₹',
            'AED' => 'د.إ', 'SAR' => '﷼', 'CNY' => '¥', 'JPY' => '¥', 'CAD' => 'C$', 'AUD' => 'A$',
        ];
        return ['code' => $code, 'symbol' => $symbols[$code] ?? $code . ' '];
    }
}
