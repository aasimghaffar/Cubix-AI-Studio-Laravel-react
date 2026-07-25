<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use App\Services\NotificationService;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $data = $request->validate([
            'first_name'    => 'required_without:name|string|max:60',
            'last_name'     => 'nullable|string|max:60',
            'name'          => 'required_without:first_name|string|max:100', // legacy clients
            'email'         => 'required|email|unique:users,email',
            'password'      => 'required|string|min:8',
            'date_of_birth' => 'nullable|date|before:today|after:1900-01-01',
            'age'           => 'nullable|integer|min:13|max:120', // legacy clients
        ]);

        $name = $data['name'] ?? trim($data['first_name'] . ' ' . ($data['last_name'] ?? ''));

        $user = User::create([
            'name'          => $name,
            'email'         => $data['email'],
            'password'      => $data['password'],
            'date_of_birth' => $data['date_of_birth'] ?? null,
            'age'           => $data['age'] ?? null,
        ] + [
            'role'               => 'customer',
            'status'             => 'pending',
            'verification_token' => \Illuminate\Support\Str::random(48),
        ]);

        app(NotificationService::class)->sendVerification($user);
        app(NotificationService::class)->accountCreated($user);

        return response()->json([
            'message' => 'Account created! Check your email for a verification link before signing in.',
            'requires_verification' => true,
        ], 201);
    }

    /** GET /api/auth/verify/{token} — clicked from the verification email. */
    public function verify(string $token)
    {
        $user = User::where('verification_token', $token)->first();
        $frontend = rtrim(env('FRONTEND_URL', 'http://localhost:5173'), '/');

        if (! $user) {
            return redirect($frontend . '/login?verified=0');
        }

        $user->update([
            'status'             => 'active',
            'email_verified_at'  => now(),
            'verification_token' => null,
        ]);

        return redirect($frontend . '/login?verified=1');
    }

    public function login(Request $request)
    {
        $data = $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
            'force'    => 'sometimes|boolean', // true = sign out other browsers first
        ]);

        $user = User::where('email', $data['email'])->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages(['email' => 'These credentials do not match our records.']);
        }

        if ($user->is_blocked) {
            throw ValidationException::withMessages(['email' => 'This account has been suspended.']);
        }

        if ($user->status === 'pending') {
            throw ValidationException::withMessages(['email' => 'Please verify your email first — we sent you a link when you registered.']);
        }

        // ── Browser limit from the customer's package (null = unlimited, admins exempt) ──
        $limit = $user->sessionLimit();
        if ($limit !== null) {
            $active = $user->tokens()->count();

            if ($active >= $limit) {
                if ($request->boolean('force')) {
                    $user->tokens()->delete(); // sign out everywhere, then continue below
                } else {
                    return response()->json([
                        'message' => $limit === 1
                            ? 'Your plan allows signing in on 1 browser at a time, and you are already signed in elsewhere. Sign out there first — or continue here to sign out the other browser automatically.'
                            : "Your plan allows signing in on {$limit} browsers at a time, and you have reached that limit. Sign out on another browser — or continue here to sign out everywhere else automatically.",
                        'code'    => 'SESSION_LIMIT',
                        'limit'   => $limit,
                        'active'  => $active,
                    ], 409);
                }
            }
        }

        return response()->json([
            'token' => $user->createToken('spa')->plainTextToken,
            'user'  => $user,
        ]);
    }

    public function me(Request $request)
    {
        return $request->user()->load('activeSubscription.package');
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Signed out.']);
    }
}
