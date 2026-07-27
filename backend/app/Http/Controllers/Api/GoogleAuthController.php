<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

/**
 * Google OAuth implemented directly against Google's endpoints — no extra
 * composer packages needed. Enable it in Admin → Settings with a Client ID
 * and Secret from console.cloud.google.com (OAuth consent + Web credentials).
 * Authorized redirect URI must be:  {APP_URL}/api/auth/google/callback
 */
class GoogleAuthController extends Controller
{
    protected function frontend(): string
    {
        return rtrim(env('FRONTEND_URL', 'http://localhost:5173'), '/');
    }

    /**
     * The redirect URI sent to Google. Built from APP_URL — never from the
     * incoming request — because Google matches this string EXACTLY against
     * the Authorized redirect URI list, and http://localhost:8000 and
     * http://127.0.0.1:8000 count as two different values. Pinning it here
     * means the URI is identical whichever address the browser used.
     */
    public static function redirectUri(): string
    {
        return rtrim(config('app.url'), '/') . '/api/auth/google/callback';
    }

    /** GET /api/auth/google/redirect — sends the browser to Google's consent screen. */
    public function redirect()
    {
        $clientId = Setting::get('google_client_id');
        abort_if(! Setting::get('google_login_enabled') || ! $clientId, 404, 'Google login is not enabled.');

        $params = http_build_query([
            'client_id'     => $clientId,
            'redirect_uri'  => self::redirectUri(),
            'response_type' => 'code',
            'scope'         => 'openid email profile',
            'prompt'        => 'select_account',
        ]);

        return redirect("https://accounts.google.com/o/oauth2/v2/auth?{$params}");
    }

    /** GET /api/auth/google/callback — exchanges the code, signs the user in. */
    public function callback()
    {
        $code = request('code');
        if (! $code) {
            return redirect($this->frontend() . '/login?google=failed');
        }

        try {
            $tokenResponse = Http::asForm()->post('https://oauth2.googleapis.com/token', [
                'client_id'     => Setting::get('google_client_id'),
                'client_secret' => Setting::get('google_client_secret'),
                'code'          => $code,
                'grant_type'    => 'authorization_code',
                'redirect_uri'  => self::redirectUri(),
            ])->throw()->json();

            $info = Http::withToken($tokenResponse['access_token'])
                ->get('https://www.googleapis.com/oauth2/v2/userinfo')
                ->throw()->json();
        } catch (\Throwable $e) {
            \Log::warning('Google login failed: ' . $e->getMessage());
            return redirect($this->frontend() . '/login?google=failed');
        }

        if (empty($info['email'])) {
            return redirect($this->frontend() . '/login?google=failed');
        }

        $user = User::where('google_id', $info['id'] ?? '___')->first()
            ?? User::where('email', $info['email'])->first();

        if ($user) {
            // Google has verified the email — activate pending accounts.
            $user->update([
                'google_id'          => $info['id'] ?? $user->google_id,
                'status'             => 'active',
                'email_verified_at'  => $user->email_verified_at ?? now(),
                'verification_token' => null,
            ]);
        } else {
            $user = User::create([
                'name'              => $info['name'] ?? Str::before($info['email'], '@'),
                'email'             => $info['email'],
                'password'          => Str::random(40), // never used — Google signs them in
                'role'              => 'customer',
                'status'            => 'active',
                'google_id'         => $info['id'] ?? null,
                'email_verified_at' => now(),
            ]);
        }

        if ($user->is_blocked) {
            return redirect($this->frontend() . '/login?google=blocked');
        }

        $limit = $user->sessionLimit();
        if ($limit !== null && $user->tokens()->count() >= $limit) {
            return redirect($this->frontend() . '/login?google=session_limit');
        }

        $token = $user->createToken('google')->plainTextToken;

        return redirect($this->frontend() . '/auth/google#token=' . urlencode($token));
    }
}
