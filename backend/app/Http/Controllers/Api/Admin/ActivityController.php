<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Subscription;
use App\Models\UsageLog;
use Illuminate\Http\Request;

class ActivityController extends Controller
{
    /** GET /api/admin/subscriptions */
    public function subscriptions(Request $request)
    {
        return Subscription::with(['user:id,name,email', 'package:id,name,price,billing_cycle'])
            ->when($request->query('status'), fn ($q, $s) => $q->where('status', $s))
            ->latest()
            ->paginate(20);
    }

    /** GET /api/admin/usage-logs */
    public function usageLogs(Request $request)
    {
        return UsageLog::with('user:id,name,email')
            ->when($request->query('tool'), fn ($q, $t) => $q->where('tool_slug', $t))
            ->latest()
            ->paginate(30);
    }
}
