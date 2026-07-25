<?php

namespace App\Services\AI;

use App\Services\SettingsService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * Executes AI tool requests using the ADMIN's stored API keys (never .env).
 * Each public method returns an array the frontend can render directly.
 */
class AiService
{
    public function __construct(protected SettingsService $settings) {}

    // ─────────────────────────── Tool 1: Image Generation ───────────────────────────

    public function generateImage(array $input): array
    {
        @set_time_limit(300);

        $primary = $this->settings->engineFor('ai-image-generator');
        $errors  = [];
        $result  = null;

        foreach ($this->imageEngineOrder($primary) as $engine) {
            try {
                $result = $this->generateImageWith($engine, $input);
                if ($engine !== $primary) {
                    \Illuminate\Support\Facades\Log::info("Image engine fallback used: {$primary} → {$engine}");
                }
                break;
            } catch (\Throwable $e) {
                $errors[$engine] = $e->getMessage();
            }
        }

        if ($result === null) {
            \Illuminate\Support\Facades\Log::error('All image engines failed', $errors);
            throw new RuntimeException($this->engineFailureMessage($errors, 'image'));
        }

        // Normalize: always expose a urls[] array (gallery) + url (first, back-compat)
        $urls = $result['urls'] ?? [$result['url']];

        return ['type' => 'image', 'urls' => $urls, 'url' => $urls[0]];
    }

    /** Run one named image engine. */
    protected function generateImageWith(string $engine, array $input): array
    {
        return match ($engine) {
            'stable_diffusion' => $this->generateImageStability($input),
            'pollinations'     => $this->generateImagePollinations($input),
            'gemini'           => $this->generateImageGemini($input),
            default            => $this->generateImageOpenAi($input),
        };
    }

    /** Selected image engine first, then every other engine that is usable. */
    protected function imageEngineOrder(string $primary): array
    {
        $usable = array_keys(array_filter([
            'openai'           => (bool) $this->settings->openAiKey(),
            'gemini'           => (bool) $this->settings->geminiKey(),
            'stable_diffusion' => (bool) $this->settings->stableDiffusionKey(),
            'pollinations'     => true, // free, no key — always the last resort
        ]));

        return array_values(array_unique(array_merge([$primary], array_diff($usable, [$primary]))));
    }

    /**
     * Turn a pile of provider errors into ONE message the customer (or admin)
     * can act on: missing keys read very differently from a busy provider.
     */
    protected function engineFailureMessage(array $errors, string $kind): string
    {
        $allMissingKeys = $errors !== [] && count(array_filter(
            $errors,
            fn ($m) => str_contains($m, 'API key is not configured')
        )) === count($errors);

        if ($allMissingKeys) {
            return "No {$kind} engine is set up yet. Please ask the site administrator to add an API key in Admin → AI Settings → API Keys.";
        }

        return "The {$kind} engine is very busy right now — please try again in a moment.";
    }

    /** Gemini / Imagen 3 — needs a Google AI Studio key. */
    protected function generateImageGemini(array $input): array
    {
        $key = $this->requireKey($this->settings->geminiKey(), 'Gemini');

        $aspect = match ($input['aspect_ratio'] ?? '1:1') {
            '16:9' => '16:9', '9:16' => '9:16', '4:3' => '4:3', default => '1:1',
        };

        $response = Http::timeout(120)
            ->post("https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key={$key}", [
                'instances'  => [['prompt' => trim(($input['prompt'] ?? '') . ', ' . ($input['style'] ?? 'photorealistic') . ' style')]],
                'parameters' => ['sampleCount' => 2, 'aspectRatio' => $aspect],
            ])->throw()->json();

        $urls = [];
        foreach ($response['predictions'] ?? [] as $pred) {
            if (! empty($pred['bytesBase64Encoded'])) {
                $path = 'generations/' . Str::uuid() . '.png';
                Storage::disk('public')->put($path, base64_decode($pred['bytesBase64Encoded']));
                $urls[] = Storage::url($path);
            }
        }

        abort_if(empty($urls), 500, 'Gemini returned no images.');

        return ['type' => 'image', 'urls' => $urls];
    }

    /** FREE provider — no API key required. */
    protected function generateImagePollinations(array $input): array
    {
        [$w, $h] = match ($input['aspect_ratio'] ?? '1:1') {
            '16:9'  => [1280, 720],
            '4:3'   => [1152, 864],
            '9:16'  => [720, 1280],
            default => [1024, 1024],
        };

        $prompt = trim(($input['prompt'] ?? '') . ', ' . ($input['style'] ?? 'photorealistic') . ' style');
        $base = 'https://image.pollinations.ai/prompt/' . rawurlencode($prompt)
            . "?width={$w}&height={$h}&nologo=true";

        // Four variations per run — different seeds, fetched in parallel.
        $seeds = [random_int(1, 999999), random_int(1, 999999), random_int(1, 999999), random_int(1, 999999)];
        $responses = Http::pool(fn ($pool) => collect($seeds)
            ->map(fn ($seed) => $pool->timeout(120)->get($base . "&seed={$seed}"))
            ->all());

        $urls = [];
        foreach ($responses as $response) {
            if ($response instanceof \Illuminate\Http\Client\Response && $response->successful()) {
                $path = 'generations/' . Str::uuid() . '.jpg';
                Storage::disk('public')->put($path, $response->body());
                $urls[] = Storage::url($path);
            }
        }

        abort_if(empty($urls), 500, 'Image service is busy right now — please try again.');

        return ['type' => 'image', 'urls' => $urls];
    }

    protected function generateImageOpenAi(array $input): array
    {
        $key = $this->requireKey($this->settings->openAiKey(), 'OpenAI');

        $size = $input['resolution'] ?? '1024x1024';
        // DALL-E 3 supports 1024x1024, 1792x1024, 1024x1792 — map aspect ratios.
        $size = match ($input['aspect_ratio'] ?? '1:1') {
            '16:9', '4:3' => '1792x1024',
            '9:16'        => '1024x1792',
            default       => '1024x1024',
        };

        $prompt = trim(($input['prompt'] ?? '') . ' Style: ' . ($input['style'] ?? 'Photorealistic'));

        $response = Http::withToken($key)
            ->timeout(120)
            ->post('https://api.openai.com/v1/images/generations', [
                'model'   => 'dall-e-3',
                'prompt'  => $prompt,
                'n'       => 1,
                'size'    => $size,
                'quality' => in_array($input['quality'] ?? 'standard', ['standard', 'hd']) ? ($input['quality'] ?? 'standard') : 'standard',
                'response_format' => 'b64_json',
            ])->throw()->json();

        $path = 'generations/' . Str::uuid() . '.png';
        Storage::disk('public')->put($path, base64_decode($response['data'][0]['b64_json']));

        return ['type' => 'image', 'url' => Storage::url($path)];
    }

    protected function generateImageStability(array $input): array
    {
        $key = $this->requireKey($this->settings->stableDiffusionKey(), 'Stable Diffusion');

        $response = Http::withToken($key)
            ->timeout(120)
            ->asMultipart()
            ->attach('none', '')
            ->post('https://api.stability.ai/v2beta/stable-image/generate/core', [
                'prompt'       => ($input['prompt'] ?? '') . ' in ' . ($input['style'] ?? 'photorealistic') . ' style',
                'aspect_ratio' => $input['aspect_ratio'] ?? '1:1',
                'output_format'=> 'png',
            ])->throw();

        $path = 'generations/' . Str::uuid() . '.png';
        Storage::disk('public')->put($path, $response->body());

        return ['type' => 'image', 'url' => Storage::url($path)];
    }

    // ─────────────────────────── Tool 2: Document Assistant ───────────────────────────

    public function queryDocument(UploadedFile $file, string $question): array
    {
        $text = $this->extractText($file);

        if ($text === '') {
            throw new RuntimeException('Could not read any text from the uploaded document.');
        }

        // Simple, reliable approach: prompt-inject the extracted text (truncated).
        // The free Pollinations endpoint can't swallow huge payloads — keep it lean there.
        $engine = $this->settings->engineFor('ai-document-assistant');
        $context = Str::limit($text, $engine === 'pollinations' ? 12000 : 48000, '…');

        $answer = $this->chatComplete([
            ['role' => 'system', 'content' => 'Answer strictly using the provided document. If the answer is not in the document, say so.'],
            ['role' => 'user',   'content' => "DOCUMENT:\n{$context}\n\nQUESTION: {$question}"],
        ], $engine);

        return ['type' => 'text', 'answer' => $answer];
    }

    protected function extractText(UploadedFile $file): string
    {
        $ext = strtolower($file->getClientOriginalExtension());

        if ($ext === 'txt') {
            return (string) file_get_contents($file->getRealPath());
        }

        if ($ext === 'pdf' && class_exists(\Smalot\PdfParser\Parser::class)) {
            return (new \Smalot\PdfParser\Parser())->parseFile($file->getRealPath())->getText();
        }

        if ($ext === 'docx' && class_exists(\PhpOffice\PhpWord\IOFactory::class)) {
            $text = '';
            $doc  = \PhpOffice\PhpWord\IOFactory::load($file->getRealPath());
            foreach ($doc->getSections() as $section) {
                foreach ($section->getElements() as $el) {
                    if (method_exists($el, 'getText')) {
                        $text .= $el->getText() . "\n";
                    }
                }
            }
            return $text;
        }

        throw new RuntimeException("Unsupported document type: .$ext (install smalot/pdfparser and phpoffice/phpword).");
    }

    // ─────────────────────────── Tool 3: Background Removal ───────────────────────────

    public function removeBackground(UploadedFile $image): array
    {
        if ($this->settings->engineFor('ai-background-removal') === 'removebg') {
            return $this->removeBackgroundRemoveBg($image);
        }

        $key = $this->requireKey($this->settings->clipdropKey(), 'Clipdrop');

        $response = Http::withHeaders(['x-api-key' => $key])
            ->timeout(90)
            ->attach('image_file', file_get_contents($image->getRealPath()), $image->getClientOriginalName())
            ->post('https://clipdrop-api.co/remove-background/v1')
            ->throw();

        $path = 'generations/' . Str::uuid() . '.png';
        Storage::disk('public')->put($path, $response->body());

        return ['type' => 'image', 'url' => Storage::url($path)];
    }

    // ─────────────────────────── Tool 4: Text-to-Audio ───────────────────────────

    /** remove.bg — popular dedicated background removal API. */
    protected function removeBackgroundRemoveBg(UploadedFile $image): array
    {
        $key = $this->requireKey($this->settings->removeBgKey(), 'remove.bg');

        $response = Http::withHeaders(['X-Api-Key' => $key])
            ->timeout(90)
            ->attach('image_file', file_get_contents($image->getRealPath()), $image->getClientOriginalName())
            ->post('https://api.remove.bg/v1.0/removebg', ['size' => 'auto'])
            ->throw();

        $path = 'generations/' . Str::uuid() . '.png';
        Storage::disk('public')->put($path, $response->body());

        return ['type' => 'image', 'url' => Storage::url($path), 'urls' => [Storage::url($path)]];
    }

    public function textToAudio(array $input): array
    {
        @set_time_limit(300);

        $primary = $this->settings->audioProvider() === 'openai' ? 'openai' : 'elevenlabs';
        $order   = $primary === 'openai' ? ['openai', 'elevenlabs'] : ['elevenlabs', 'openai'];
        $errors  = [];

        foreach ($order as $engine) {
            try {
                return $engine === 'openai' ? $this->ttsOpenAi($input) : $this->ttsElevenLabs($input);
            } catch (\Throwable $e) {
                $errors[$engine] = $e->getMessage();
            }
        }

        \Illuminate\Support\Facades\Log::error('All audio engines failed', $errors);
        throw new RuntimeException($this->engineFailureMessage($errors, 'voice'));
    }

    /** ElevenLabs text-to-speech. */
    protected function ttsElevenLabs(array $input): array
    {
        $key     = $this->requireKey($this->settings->elevenLabsKey(), 'ElevenLabs');
        $voiceId = ($input['voice_id'] ?? null) ?: '21m00Tcm4TlvDq8ikWAM'; // Rachel (default)

        $response = Http::withHeaders(['xi-api-key' => $key])
            ->timeout(120)
            ->post("https://api.elevenlabs.io/v1/text-to-speech/{$voiceId}", [
                'text'           => $input['text'] ?? '',
                'model_id'       => 'eleven_multilingual_v2',
                'voice_settings' => ['speed' => (float) ($input['speed'] ?? 1.0)],
            ])->throw();

        $path = 'generations/' . Str::uuid() . '.mp3';
        Storage::disk('public')->put($path, $response->body());

        return ['type' => 'audio', 'url' => Storage::url($path)];
    }

    protected function ttsOpenAi(array $input): array
    {
        $key = $this->requireKey($this->settings->openAiKey(), 'OpenAI');

        $response = Http::withToken($key)
            ->timeout(120)
            ->post('https://api.openai.com/v1/audio/speech', [
                'model' => 'tts-1',
                'voice' => ($input['voice_id'] ?? null) ?: 'alloy',
                'input' => $input['text'] ?? '',
                'speed' => (float) ($input['speed'] ?? 1.0),
            ])->throw();

        $path = 'generations/' . Str::uuid() . '.mp3';
        Storage::disk('public')->put($path, $response->body());

        return ['type' => 'audio', 'url' => Storage::url($path)];
    }

    /** Fetch available ElevenLabs voices for the dynamic select field. */
    public function listVoices(): array
    {
        $key = $this->settings->elevenLabsKey();
        if (! $key) {
            return [['value' => 'alloy', 'label' => 'Default voice']];
        }

        try {
            $voices = Http::withHeaders(['xi-api-key' => $key])
                ->get('https://api.elevenlabs.io/v1/voices')
                ->throw()->json('voices', []);

            return collect($voices)
                ->map(fn ($v) => ['value' => $v['voice_id'], 'label' => $v['name']])
                ->values()->all();
        } catch (\Throwable) {
            return [['value' => '21m00Tcm4TlvDq8ikWAM', 'label' => 'Rachel (default)']];
        }
    }

    // ─────────────────────────── Text engine (provider-routed) ───────────────────────────

    /**
     * Runs a chat completion on the admin-selected text provider.
     * 'pollinations' is FREE and needs no API key; 'openai' uses the stored key.
     */
    public function chatComplete(array $messages, ?string $provider = null): string
    {
        // Try the selected engine first; if it fails, silently fall back to any
        // other text engine that has a working configuration. The customer only
        // ever sees an error if EVERYTHING is down.
        $primary = $provider ?? $this->settings->textProvider();
        $errors = [];

        try {
            return $this->coerceText($this->chatCompleteRaw($messages, $primary));
        } catch (\Throwable $e) {
            $errors[$primary] = $e->getMessage();
        }

        foreach ($this->textFallbacks($primary) as $fallback) {
            try {
                $text = $this->coerceText($this->chatCompleteRaw($messages, $fallback));
                \Illuminate\Support\Facades\Log::info("Text engine fallback used: {$primary} → {$fallback}");
                return $text;
            } catch (\Throwable $e) {
                $errors[$fallback] = $e->getMessage();
            }
        }

        \Illuminate\Support\Facades\Log::error('All text engines failed', $errors);
        throw new \RuntimeException($this->engineFailureMessage($errors, 'text'));
    }

    /** Other text engines with usable configuration, best free/cheap first. */
    protected function textFallbacks(string $except): array
    {
        $candidates = [
            'groq'         => (bool) $this->settings->groqKey(),
            'gemini'       => (bool) $this->settings->geminiKey(),
            'deepseek'     => (bool) $this->settings->deepseekKey(),
            'mistral'      => (bool) $this->settings->mistralKey(),
            'openai'       => (bool) $this->settings->openAiKey(),
            'claude'       => (bool) $this->settings->claudeKey(),
            'pollinations' => true, // free — kept ONLY as the silent last resort
        ];

        return array_keys(array_filter($candidates, fn ($ok, $name) => $ok && $name !== $except, ARRAY_FILTER_USE_BOTH));
    }

    /**
     * Pollinations free text API with browser-like headers, rate-limit backoff,
     * and per-endpoint failure tracking (see pollinationsDiagnose()).
     */
    protected function pollinationsText(array $messages, ?array &$reasons = null): string
    {
        $reasons = [];
        $flat = collect($messages)->pluck('content')->implode("\n\n");
        $short = rawurlencode(Str::limit($flat, 3000, ''));

        // Their edge sometimes filters non-browser clients — look like one.
        $client = fn () => Http::timeout(25)->connectTimeout(6)->withHeaders([
            'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
            'Referer'    => 'https://pollinations.ai/',
            'Accept'     => 'text/plain, application/json;q=0.9, */*;q=0.8',
        ]);

        $attempts = [
            'GET ?model=openai' => fn () => $client()->get("https://text.pollinations.ai/{$short}?model=openai"),
            'GET plain'         => fn () => $client()->get("https://text.pollinations.ai/{$short}"),
            'POST /openai'      => fn () => $client()->acceptJson()->post('https://text.pollinations.ai/openai', ['model' => 'openai', 'messages' => $messages]),
            'POST /'            => fn () => $client()->asJson()->post('https://text.pollinations.ai/', ['messages' => $messages, 'model' => 'openai']),
        ];

        foreach ($attempts as $label => $attempt) {
            try {
                $response = $attempt();

                if ($response->status() === 429) {
                    // Rate-limited (free tier) — wait once and retry this endpoint
                    sleep(4);
                    $response = $attempt();
                }

                if (! $response->successful()) {
                    $reasons[$label] = 'HTTP ' . $response->status() . ' — ' . Str::limit(trim($response->body()), 160);
                    continue;
                }

                $text = str_starts_with($label, 'POST /openai')
                    ? $response->json('choices.0.message.content')
                    : $response->body();
                if (is_string($text)) $text = trim($text);

                if ($text && ! str_starts_with($text, '<!DOCTYPE') && ! str_starts_with($text, '<html')) {
                    return $text;
                }
                $reasons[$label] = 'Empty or HTML response';
            } catch (\Throwable $e) {
                $reasons[$label] = Str::limit($e->getMessage(), 160);
            }
        }

        \Illuminate\Support\Facades\Log::warning('Pollinations text failed on all endpoints', $reasons);
        throw new \RuntimeException('Pollinations did not answer: ' . implode(' | ', array_map(
            fn ($k, $v) => "{$k}: {$v}", array_keys($reasons), $reasons
        )));
    }

    /** Providers sometimes return content as arrays of blocks — always flatten to a string. */
    protected function coerceText(mixed $content): string
    {
        if (is_string($content)) return trim($content);

        if (is_array($content)) {
            $parts = [];
            foreach ($content as $piece) {
                if (is_string($piece)) $parts[] = $piece;
                elseif (is_array($piece)) $parts[] = $piece['text'] ?? $piece['content'] ?? '';
            }
            return trim(implode("\n", array_filter($parts)));
        }

        return trim((string) $content);
    }

    protected function chatCompleteRaw(array $messages, ?string $provider = null): mixed
    {
        $provider ??= $this->settings->textProvider();

        // OpenAI-compatible hosted providers
        $compat = [
            'deepseek' => ['https://api.deepseek.com/chat/completions',           'deepseek-chat',              $this->settings->deepseekKey(), 'DeepSeek'],
            'mistral'  => ['https://api.mistral.ai/v1/chat/completions',          'mistral-small-latest',       $this->settings->mistralKey(),  'Mistral'],
            'groq'     => ['https://api.groq.com/openai/v1/chat/completions',     'llama-3.3-70b-versatile',    $this->settings->groqKey(),     'Groq'],
        ];

        if (isset($compat[$provider])) {
            [$url, $model, $key, $name] = $compat[$provider];
            $key = $this->requireKey($key, $name);

            $response = Http::withToken($key)->timeout(90)
                ->post($url, ['model' => $model, 'messages' => $messages])
                ->throw()->json();

            return $response['choices'][0]['message']['content'] ?? '';
        }

        if ($provider === 'gemini') {
            $key = $this->requireKey($this->settings->geminiKey(), 'Gemini');

            $system = collect($messages)->firstWhere('role', 'system')['content'] ?? null;
            $contents = collect($messages)
                ->reject(fn ($m) => $m['role'] === 'system')
                ->map(fn ($m) => ['role' => $m['role'] === 'assistant' ? 'model' : 'user', 'parts' => [['text' => $m['content']]]])
                ->values()->all();

            $payload = ['contents' => $contents];
            if ($system) $payload['systemInstruction'] = ['parts' => [['text' => $system]]];

            $response = Http::timeout(90)
                ->post("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={$key}", $payload)
                ->throw()->json();

            return $response['candidates'][0]['content']['parts'][0]['text'] ?? '';
        }

        if ($provider === 'claude') {
            $key = $this->requireKey($this->settings->claudeKey(), 'Claude');

            $system = collect($messages)->firstWhere('role', 'system')['content'] ?? null;
            $chat = collect($messages)->reject(fn ($m) => $m['role'] === 'system')->values()->all();

            $payload = ['model' => 'claude-haiku-4-5', 'max_tokens' => 2048, 'messages' => $chat];
            if ($system) $payload['system'] = $system;

            $response = Http::withHeaders(['x-api-key' => $key, 'anthropic-version' => '2023-06-01'])
                ->timeout(90)
                ->post('https://api.anthropic.com/v1/messages', $payload)
                ->throw()->json();

            return $response['content'][0]['text'] ?? '';
        }

        if ($provider === 'pollinations') {
            // Pollinations is free but flaky. PHP kills web requests at ~60s, so the
            // whole chain must fit a strict time budget: raise the limit and keep
            // every attempt short. GET first — it is their most reliable endpoint.
            @set_time_limit(300);
            return $this->pollinationsText($messages);
        }

        $key = $this->requireKey($this->settings->openAiKey(), 'OpenAI');

        $response = Http::withToken($key)
            ->timeout(90)
            ->post('https://api.openai.com/v1/chat/completions', [
                'model'    => 'gpt-4o-mini',
                'messages' => $messages,
            ])->throw()->json();

        return $response['choices'][0]['message']['content'] ?? '';
    }

    // ─────────────────────────── Tool 5: Content Writer ───────────────────────────

    public function writeContent(array $input): array
    {
        $words = match ($input['length'] ?? 'medium') {
            'short' => 150, 'long' => 800, default => 400,
        };
        $type = str_replace('_', ' ', $input['content_type'] ?? 'blog post');

        $answer = $this->chatComplete([
            ['role' => 'system', 'content' => "You are a professional copywriter. Write a {$type} in a " . ($input['tone'] ?? 'Professional') . " tone, roughly {$words} words, in " . ($input['language'] ?? 'English') . "."
                . (! empty($input['keywords']) ? " Naturally include these keywords: {$input['keywords']}." : '')
                . " Output only the content itself, no preamble."],
            ['role' => 'user',   'content' => (string) ($input['topic'] ?? '')],
        ], $this->settings->engineFor('ai-content-writer'));

        return ['type' => 'text', 'answer' => $answer];
    }

    // ─────────────────────────── Tool 6: Translator ───────────────────────────

    public function translate(array $input): array
    {
        $style = match ($input['formality'] ?? 'natural') {
            'formal'   => 'Use a formal register.',
            'informal' => 'Use an informal, conversational register.',
            default    => 'Keep the tone natural and faithful to the source.',
        };

        $answer = $this->chatComplete([
            ['role' => 'system', 'content' => "You are an expert translator. Translate the user's text into " . ($input['target_language'] ?? 'English') . ". {$style} Output only the translation, nothing else."],
            ['role' => 'user',   'content' => (string) ($input['text'] ?? '')],
        ], $this->settings->engineFor('ai-translator'));

        return ['type' => 'text', 'answer' => $answer];
    }

    // ─────────────────────────── Tool 7: Chat Assistant ───────────────────────────

    public function chatAssistant(array $input): array
    {
        $styleMap = [
            'helpful'  => 'Be helpful, clear and friendly.',
            'concise'  => 'Be extremely concise — answer in as few words as possible.',
            'detailed' => 'Be thorough and detailed, with examples where useful.',
            'creative' => 'Be imaginative and creative in your answer.',
        ];

        $answer = $this->chatComplete([
            ['role' => 'system', 'content' => 'You are a helpful AI assistant. ' . ($styleMap[$input['style'] ?? 'helpful'] ?? $styleMap['helpful'])],
            ['role' => 'user',   'content' => (string) ($input['message'] ?? '')],
        ], $this->settings->engineFor('ai-chat-assistant'));

        return ['type' => 'text', 'answer' => $answer];
    }

    // ─────────────────────────── Tool 8: Rewriter ───────────────────────────

    public function rewriteText(array $input): array
    {
        $modeMap = [
            'fix_grammar' => 'Fix all grammar, spelling and punctuation mistakes. Keep the wording as close to the original as possible.',
            'improve'     => 'Rewrite it to be clearer, more fluent and more engaging while keeping the meaning.',
            'simplify'    => 'Rewrite it in simple, easy-to-understand language.',
            'shorten'     => 'Rewrite it significantly shorter while keeping every key point.',
            'expand'      => 'Expand it with more detail and richer phrasing while keeping the original intent.',
        ];

        $answer = $this->chatComplete([
            ['role' => 'system', 'content' => 'You are an expert editor. ' . ($modeMap[$input['mode'] ?? 'improve'] ?? $modeMap['improve']) . ' Output only the rewritten text.'],
            ['role' => 'user',   'content' => (string) ($input['text'] ?? '')],
        ], $this->settings->engineFor('ai-text-rewriter'));

        return ['type' => 'text', 'answer' => $answer];
    }

    // ─────────────────────────── Tool 9: Summarizer ───────────────────────────

    public function summarize(array $input): array
    {
        $lengthMap = [
            'one_sentence' => 'Summarize it in exactly one sentence.',
            'short'        => 'Summarize it in one short paragraph.',
            'bullets'      => 'Summarize it as clear bullet points covering every key idea.',
        ];

        $answer = $this->chatComplete([
            ['role' => 'system', 'content' => 'You are a summarization expert. ' . ($lengthMap[$input['length'] ?? 'short'] ?? $lengthMap['short']) . ' Output only the summary.'],
            ['role' => 'user',   'content' => (string) ($input['text'] ?? '')],
        ], $this->settings->engineFor('ai-summarizer'));

        return ['type' => 'text', 'answer' => $answer];
    }

    // ─────────────────────────── Key connection tests ───────────────────────────

    public function testConnection(string $provider): array
    {
        if ($provider === 'pollinations') {
            try {
                $reasons = [];
                $text = $this->pollinationsText([['role' => 'user', 'content' => 'Reply with the single word: OK']], $reasons);
                return ['ok' => true, 'message' => 'Pollinations works! Response: ' . Str::limit($text, 40)];
            } catch (\Throwable $e) {
                return ['ok' => false, 'message' => $e->getMessage()];
            }
        }

        // Newer providers first
        try {
            switch ($provider) {
                case 'gemini':
                    $key = $this->requireKey($this->settings->geminiKey(), 'Gemini');
                    Http::timeout(20)->get("https://generativelanguage.googleapis.com/v1beta/models?key={$key}")->throw();
                    return ['ok' => true, 'message' => 'Gemini key works!'];
                case 'claude':
                    $key = $this->requireKey($this->settings->claudeKey(), 'Claude');
                    Http::withHeaders(['x-api-key' => $key, 'anthropic-version' => '2023-06-01'])->timeout(20)
                        ->post('https://api.anthropic.com/v1/messages', ['model' => 'claude-haiku-4-5', 'max_tokens' => 8, 'messages' => [['role' => 'user', 'content' => 'hi']]])->throw();
                    return ['ok' => true, 'message' => 'Claude key works!'];
                case 'deepseek':
                    $key = $this->requireKey($this->settings->deepseekKey(), 'DeepSeek');
                    Http::withToken($key)->timeout(20)->get('https://api.deepseek.com/models')->throw();
                    return ['ok' => true, 'message' => 'DeepSeek key works!'];
                case 'mistral':
                    $key = $this->requireKey($this->settings->mistralKey(), 'Mistral');
                    Http::withToken($key)->timeout(20)->get('https://api.mistral.ai/v1/models')->throw();
                    return ['ok' => true, 'message' => 'Mistral key works!'];
                case 'groq':
                    $key = $this->requireKey($this->settings->groqKey(), 'Groq');
                    Http::withToken($key)->timeout(20)->get('https://api.groq.com/openai/v1/models')->throw();
                    return ['ok' => true, 'message' => 'Groq key works!'];
                case 'removebg':
                    $key = $this->requireKey($this->settings->removeBgKey(), 'remove.bg');
                    Http::withHeaders(['X-Api-Key' => $key])->timeout(20)->get('https://api.remove.bg/v1.0/account')->throw();
                    return ['ok' => true, 'message' => 'remove.bg key works!'];
            }
        } catch (\Throwable $e) {
            return ['ok' => false, 'message' => 'Connection failed — check the key. (' . $e->getMessage() . ')'];
        }

        try {
            $ok = match ($provider) {
                'openai'           => Http::withToken($this->requireKey($this->settings->openAiKey(), 'OpenAI'))
                                        ->get('https://api.openai.com/v1/models')->successful(),
                'stable_diffusion' => Http::withToken($this->requireKey($this->settings->stableDiffusionKey(), 'Stable Diffusion'))
                                        ->get('https://api.stability.ai/v1/user/account')->successful(),
                'clipdrop'         => in_array(
                    Http::withHeaders(['x-api-key' => $this->requireKey($this->settings->clipdropKey(), 'Clipdrop')])
                        ->timeout(20)->post('https://clipdrop-api.co/remove-background/v1')->status(),
                    [400, 402], true // 400/402 = authenticated (just no image / no credits); 401/403 = bad key
                ),
                'elevenlabs'       => Http::withHeaders(['xi-api-key' => $this->requireKey($this->settings->elevenLabsKey(), 'ElevenLabs')])
                                        ->get('https://api.elevenlabs.io/v1/user')->successful(),
                'stripe'           => Http::withToken($this->requireKey($this->settings->stripeSecret(), 'Stripe'))
                                        ->asForm()->get('https://api.stripe.com/v1/balance')->successful(),
                default            => false,
            };

            return ['ok' => $ok, 'message' => $ok ? 'Connection verified.' : 'The API rejected this key.'];
        } catch (\Throwable $e) {
            return ['ok' => false, 'message' => $e->getMessage()];
        }
    }

    protected function requireKey(?string $key, string $provider): string
    {
        if (! $key) {
            throw new RuntimeException("{$provider} API key is not configured. Add it in Admin → AI Settings → API Keys.");
        }
        return $key;
    }
}
