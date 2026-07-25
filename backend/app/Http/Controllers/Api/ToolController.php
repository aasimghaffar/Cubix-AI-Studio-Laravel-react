<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AiTool;
use App\Models\UsageLog;
use App\Models\Generation;
use App\Services\AI\AiService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

/**
 * The Dynamic API Controller.
 * - index(): serves the tool catalog + JSON input schemas (the frontend
 *   renders its forms entirely from this — nothing is hardcoded).
 * - process(): validates against the schema and executes the AI request.
 */
class ToolController extends Controller
{
    public function __construct(protected AiService $ai) {}

    /** GET /api/tools — catalog with dynamic input schemas + user's credit meters. */
    public function index(Request $request)
    {
        $tools = AiTool::visible()->with('taxonomy')->get()->map(function (AiTool $tool) {
            $schema = $tool->input_schema;

            // Dynamic option sources (e.g. ElevenLabs voices) are resolved at request time.
            foreach ($schema['fields'] ?? [] as $i => $field) {
                if (($field['options_source'] ?? null) === 'voices') {
                    $schema['fields'][$i]['options'] = $this->ai->listVoices();
                }
            }
            $tool->input_schema = $schema;

            return $tool;
        });

        $meters = [];
        $sub = $request->user()->activeSubscription()->with('package')->first();

        if ($sub) {
            foreach ($tools->where('status', 'active') as $tool) {
                $limit = $sub->effectiveLimit($tool->feature_key);
                $used  = UsageLog::where('user_id', $request->user()->id)
                    ->where('feature_key', $tool->feature_key)
                    ->where('created_at', '>=', $sub->cycleStart())
                    ->sum('amount');

                $meters[$tool->feature_key] = ['used' => (int) $used, 'limit' => $limit, 'free' => false];
            }
        } else {
            // Free-mode meters: uses this calendar month per free-enabled tool
            foreach ($tools->where('status', 'active')->where('free_enabled', true) as $tool) {
                $windowStart = $tool->free_unit === 'day' ? now()->startOfDay() : now()->startOfMonth();
                $used = UsageLog::where('user_id', $request->user()->id)
                    ->where('tool_slug', $tool->slug)
                    ->where('created_at', '>=', $windowStart)
                    ->count();

                $meters[$tool->feature_key] = [
                    'used' => (int) $used, 'limit' => $tool->free_limit,
                    'free' => true, 'renews' => $tool->free_unit === 'day' ? 'day' : 'month',
                ];
            }
        }

        return response()->json(['tools' => $tools, 'meters' => $meters, 'has_plan' => (bool) $sub]);
    }

    /** POST /api/tools/{tool}/process — runs behind EnforcePackageLimits middleware. */
    public function process(Request $request, AiTool $tool)
    {
        $this->validateAgainstSchema($request, $tool);
        @set_time_limit(300); // slow AI providers must not hit PHP's 60s kill switch

        try {
            $result = $this->execute($tool, $request);
        } catch (\Illuminate\Http\Client\RequestException $e) {
            $status = $e->response?->status();
            $detail = $e->response?->json('error.message') ?? $e->response?->json('detail') ?? 'The AI provider rejected the request.';
            return response()->json([
                'message' => $status === 401
                    ? 'The AI provider API key appears to be invalid. Please contact the site administrator.'
                    : "Generation failed: {$detail}",
            ], 422);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Tool generation failed: ' . $e->getMessage(), ['tool' => $tool->slug]);
            report($e);
            return response()->json(['message' => 'Something went wrong while generating. Please try again.'], 500);
        }

        // Only charge credits after a successful generation.
        UsageLog::create([
            'user_id'     => $request->user()->id,
            'tool_slug'   => $tool->slug,
            'feature_key' => $tool->feature_key,
            'amount'      => $request->attributes->get('estimated_cost', 1),
            'meta'        => ['input' => collect($request->except(['document', 'image']))->toArray()],
        ]);

        // Persist the result so users can leave the page and come back to it.
        Generation::create([
            'user_id'   => $request->user()->id,
            'tool_slug' => $tool->slug,
            'input'     => collect($request->except(['document', 'image']))->toArray(),
            'output'    => $result,
        ]);

        return response()->json(['success' => true, 'result' => $result]);
    }

    protected function execute(AiTool $tool, Request $request): array
    {
        return match ($tool->slug) {
            'ai-image-generator'    => $this->ai->generateImage($request->only(['prompt', 'aspect_ratio', 'style', 'resolution', 'quality'])),
            'ai-document-assistant' => $this->ai->queryDocument($request->file('document'), (string) $request->input('prompt')),
            'ai-background-removal' => $this->ai->removeBackground($request->file('image')),
            'ai-text-to-audio'      => $this->ai->textToAudio($request->only(['text', 'voice_id', 'speed'])),
            'ai-content-writer'     => $this->ai->writeContent($request->only(['topic', 'content_type', 'tone', 'length', 'language', 'keywords'])),
            'ai-translator'         => $this->ai->translate($request->only(['text', 'target_language', 'formality'])),
            'ai-chat-assistant'     => $this->ai->chatAssistant($request->only(['message', 'style'])),
            'ai-text-rewriter'      => $this->ai->rewriteText($request->only(['text', 'mode'])),
            'ai-summarizer'         => $this->ai->summarize($request->only(['text', 'length'])),
            default                 => abort(404, 'Unknown tool.'),
        };
    }

    /** GET /api/tools/{slug}/history — this user's recent results for a tool. */
    public function history(Request $request, string $slug)
    {
        return Generation::where('user_id', $request->user()->id)
            ->where('tool_slug', $slug)
            ->latest()
            ->limit(24)
            ->get(['id', 'input', 'output', 'created_at']);
    }

    /** DELETE /api/tools/{slug}/history — wipe this user's results for a tool. */
    public function clearHistory(Request $request, string $slug)
    {
        Generation::where('user_id', $request->user()->id)->where('tool_slug', $slug)->delete();

        return response()->json(['message' => 'History cleared.']);
    }

    /** Build Laravel validation rules directly from the stored JSON schema. */
    protected function validateAgainstSchema(Request $request, AiTool $tool): void
    {
        $rules = [];

        foreach ($tool->input_schema['fields'] ?? [] as $field) {
            $name  = $field['name'];
            $parts = [($field['required'] ?? false) ? 'required' : 'nullable'];

            switch ($field['type']) {
                case 'file':
                    $parts[] = 'file';
                    if (! empty($field['accept_extensions'])) {
                        $parts[] = 'mimes:' . implode(',', $field['accept_extensions']);
                    }
                    if (! empty($field['max_kb'])) {
                        $parts[] = 'max:' . $field['max_kb'];
                    }
                    break;
                case 'select':
                    $options = array_column($field['options'] ?? [], 'value');
                    if ($options && empty($field['options_source'])) {
                        $parts[] = 'in:' . implode(',', $options);
                    }
                    break;
                case 'range':
                    $parts[] = 'numeric';
                    if (isset($field['min'])) $parts[] = 'min:' . $field['min'];
                    if (isset($field['max'])) $parts[] = 'max:' . $field['max'];
                    break;
                default:
                    $parts[] = 'string';
                    if (! empty($field['max_length'])) {
                        $parts[] = 'max:' . $field['max_length'];
                    }
            }

            $rules[$name] = implode('|', $parts);
        }

        Validator::make($request->all(), $rules)->validate();
    }
}
