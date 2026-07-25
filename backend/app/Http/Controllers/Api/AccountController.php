<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AccountController extends Controller
{
    /** PUT /api/account/profile — name and date of birth. Email stays fixed (it's the login). */
    public function updateProfile(Request $request)
    {
        $data = $request->validate([
            'first_name'    => 'required|string|max:60',
            'last_name'     => 'nullable|string|max:60',
            'date_of_birth' => 'nullable|date|before:today|after:1900-01-01',
        ]);

        $request->user()->update([
            'name'          => trim($data['first_name'] . ' ' . ($data['last_name'] ?? '')),
            'date_of_birth' => $data['date_of_birth'] ?? null,
        ]);

        return response()->json(['message' => 'Profile updated.', 'user' => $request->user()->fresh()]);
    }

    /** PUT /api/account/password */
    public function updatePassword(Request $request)
    {
        $data = $request->validate([
            'current_password' => 'required|string',
            'password'         => 'required|string|min:8|confirmed',
        ]);

        if (! Hash::check($data['current_password'], $request->user()->password)) {
            throw ValidationException::withMessages(['current_password' => 'Your current password is incorrect.']);
        }

        $request->user()->update(['password' => $data['password']]);

        return response()->json(['message' => 'Password updated.']);
    }

    /** PUT /api/account/notifications — per-user opt-outs. */
    public function updateNotifications(Request $request)
    {
        $data = $request->validate([
            'prefs'                   => 'required|array',
            'prefs.all'               => 'sometimes|boolean',
            'prefs.plan_purchased'    => 'sometimes|boolean',
            'prefs.plan_expiry'       => 'sometimes|boolean',
            'prefs.account_updates'   => 'sometimes|boolean',
        ]);

        $request->user()->update(['notify_prefs' => $data['prefs']]);

        return response()->json(['message' => 'Notification preferences saved.', 'prefs' => $data['prefs']]);
    }
}
