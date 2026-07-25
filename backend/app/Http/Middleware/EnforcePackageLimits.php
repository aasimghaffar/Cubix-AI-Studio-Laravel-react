<?php

namespace App\Http\Middleware;

use App\Models\AiTool;
use App\Models\UsageLog;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Checks the authenticated user's active package limits BEFORE
 * any AI tool controller runs. Route must contain a {tool:slug} param.
 */
class EnforcePackageLimits
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user->is_blocked) {
            return response()->json(['message' => 'Your account has been suspended. Please contact support.'], 403);
        }

        /** @var AiTool|null $tool */
        $tool = $request->route('tool');
        if (! $tool instanceof AiTool) {
            $tool = AiTool::where('slug', $request->route('tool'))->first();
        }

        if (! $tool || $tool->status !== 'active') {
            return response()->json(['message' => 'This tool is not available.'], 404);
        }

        $subscription = $user->activeSubscription()->with('package')->first();

        if (! $subscription) {
            // ── Free mode: admin can open individual tools to signed-in users ──
            if (! $tool->free_enabled) {
                return response()->json([
                    'message' => 'No active subscription. Please choose a plan to start using AI tools.',
                    'code'    => 'NO_SUBSCRIPTION',
                ], 402);
            }

            $cost = $this->estimateCost($tool, $request);

            if ($tool->free_limit !== null) {
                $windowStart = $tool->free_unit === 'day' ? now()->startOfDay() : now()->startOfMonth();
                $used = UsageLog::where('user_id', $user->id)
                    ->where('tool_slug', $tool->slug)
                    ->where('created_at', '>=', $windowStart)
                    ->count(); // free limit counts USES, not credits

                if (($used + 1) > $tool->free_limit) {
                    return response()->json([
                        'message' => \App\Models\Setting::get(
                            'free_limit_message',
                            'Your free limit for this tool is used up — choose a plan to keep creating.'
                        ),
                        'code'  => 'FREE_LIMIT_EXCEEDED',
                        'used'  => (int) $used,
                        'limit' => (int) $tool->free_limit,
                    ], 402);
                }
            }

            $request->attributes->set('tool', $tool);
            $request->attributes->set('estimated_cost', $cost);

            return $next($request);
        }

        $limit = $subscription->effectiveLimit($tool->feature_key);

        // Unlimited credits for this tool on this package
        if ($limit === -1) {
            $request->attributes->set('tool', $tool);
            $request->attributes->set('subscription', $subscription);
            $request->attributes->set('estimated_cost', $this->estimateCost($tool, $request));

            return $next($request);
        }

        $used = UsageLog::where('user_id', $user->id)
            ->where('feature_key', $tool->feature_key)
            ->where('created_at', '>=', $subscription->cycleStart())
            ->sum('amount');

        // How much this request will consume (audio is charged per 100 chars).
        $cost = $this->estimateCost($tool, $request);

        if (($used + $cost) > $limit) {
            return response()->json([
                'message'   => "You have used {$used} of {$limit} credits for {$tool->name} this billing cycle. Please upgrade your plan to continue.",
                'code'      => 'LIMIT_EXCEEDED',
                'used'      => (int) $used,
                'limit'     => $limit,
            ], 402);
        }

        // Share with the controller so it can log the exact amount after success.
        $request->attributes->set('tool', $tool);
        $request->attributes->set('subscription', $subscription);
        $request->attributes->set('estimated_cost', $cost);

        return $next($request);
    }

    protected function estimateCost(AiTool $tool, Request $request): int
    {
        if ($tool->feature_key === 'audio_character_limit') {
            return max(1, (int) ceil(mb_strlen((string) $request->input('text', '')) ));
        }

        return 1; // image / document / background removal = 1 credit each
    }
}
