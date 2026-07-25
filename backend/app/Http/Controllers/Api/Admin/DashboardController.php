<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Subscription;
use App\Models\UsageLog;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index()
    {
        $revenue = Subscription::where('subscriptions.status', 'active')
            ->join('packages', 'packages.id', '=', 'subscriptions.package_id')
            ->sum('packages.price');

        $monthlySignups = User::where('created_at', '>=', now()->subMonths(6))
            ->select(DB::raw("DATE_FORMAT(created_at, '%Y-%m') as month"), DB::raw('count(*) as total'))
            ->groupBy('month')->orderBy('month')->get();

        $creditUsage = UsageLog::where('created_at', '>=', now()->subMonth())
            ->select('feature_key', DB::raw('sum(amount) as total'))
            ->groupBy('feature_key')->get();

        $toolUsage = UsageLog::where('created_at', '>=', now()->subDays(30))
            ->select('tool_slug', DB::raw('count(*) as runs'), DB::raw('sum(amount) as credits'))
            ->groupBy('tool_slug')->orderByDesc('runs')->get();

        $revenueByMonth = Subscription::join('packages', 'packages.id', '=', 'subscriptions.package_id')
            ->where('subscriptions.created_at', '>=', now()->subMonths(6))
            ->select(DB::raw("DATE_FORMAT(subscriptions.created_at, '%Y-%m') as month"), DB::raw('sum(packages.price) as total'))
            ->groupBy('month')->orderBy('month')->get();

        $dailyActivity = UsageLog::where('created_at', '>=', now()->subDays(14))
            ->select(DB::raw('DATE(created_at) as day'), DB::raw('count(*) as runs'))
            ->groupBy('day')->orderBy('day')->get();

        return response()->json([
            'total_revenue'      => (float) $revenue,
            'active_subscribers' => Subscription::where('status', 'active')->count(),
            'total_customers'    => User::where('role', 'customer')->count(),
            'credit_usage'       => $creditUsage,
            'monthly_growth'     => $monthlySignups,
            'tool_usage'         => $toolUsage,
            'revenue_by_month'   => $revenueByMonth,
            'daily_activity'     => $dailyActivity,
        ]);
    }
}
