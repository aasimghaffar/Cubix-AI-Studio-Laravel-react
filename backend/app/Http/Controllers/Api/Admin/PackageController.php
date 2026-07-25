<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Package;
use Illuminate\Http\Request;

class PackageController extends Controller
{
    public function index()
    {
        return Package::withCount('subscriptions')->orderBy('price')->get();
    }

    public function store(Request $request)
    {
        return Package::create($this->validated($request));
    }

    public function update(Request $request, Package $package)
    {
        $package->update($this->validated($request));

        return $package;
    }

    public function destroy(Package $package)
    {
        // Never hard-delete a package with subscribers — deactivate instead.
        if ($package->subscriptions()->exists()) {
            $package->update(['status' => 'inactive']);
            return response()->json(['message' => 'Package has subscribers, so it was deactivated instead of deleted.']);
        }

        $package->delete();

        return response()->json(['message' => 'Package deleted.']);
    }

    protected function validated(Request $request): array
    {
        return $request->validate([
            'name'           => 'required|string|max:100',
            'price'          => 'required|numeric|min:0',
            'billing_cycle'  => 'required|in:monthly,yearly',
            'stripe_plan_id' => 'nullable|string',
            'paypal_plan_id' => 'nullable|string',
            'status'         => 'required|in:active,inactive',
            'features'   => 'required|array',
            'discount_percent' => 'nullable|integer|min:1|max:90',
            'max_sessions'     => 'nullable|integer|min:1|max:100',
            'is_custom'        => 'sometimes|boolean',
            'user_id'          => 'nullable|required_if:is_custom,true|exists:users,id',
            'features.*'       => 'integer|min:-1', // -1 = unlimited
            'features.*' => 'integer|min:0',
        ]);
    }
}
