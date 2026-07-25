<?php

use App\Http\Controllers\Api\Admin\ActivityController;
use App\Http\Controllers\Api\Admin\CustomerController;
use App\Http\Controllers\Api\Admin\DashboardController;
use App\Http\Controllers\Api\Admin\PackageController;
use App\Http\Controllers\Api\Admin\SettingsController;
use App\Http\Controllers\Api\Admin\ToolManagerController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BillingController;
use App\Http\Controllers\Api\ContactController;
use App\Http\Controllers\Api\LanguagesController;
use App\Http\Controllers\Api\PagesController;
use App\Http\Controllers\Api\MenuController;
use App\Http\Controllers\Api\GoogleAuthController;
use App\Http\Controllers\Api\AccountController;
use App\Http\Controllers\Api\ToolController;
use Illuminate\Support\Facades\Route;

// ── Public ──
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login',    [AuthController::class, 'login']);
Route::get('/packages',       [BillingController::class, 'packages']);
Route::get('/branding',       fn () => app(\App\Services\SettingsService::class)->branding());
Route::get('/tools/public',   fn () => \App\Models\AiTool::visible()->get(['slug', 'name', 'icon', 'description', 'status', 'free_enabled', 'free_limit']));
Route::post('/contact',       [ContactController::class, 'store']);
Route::get('/languages',      [LanguagesController::class, 'index']);
Route::get('/auth/verify/{token}', [\App\Http\Controllers\Api\AuthController::class, 'verify']);
Route::get('/pages/{slug}',   [PagesController::class, 'show']);
Route::get('/menu',           [MenuController::class, 'index']);
Route::get('/testimonials',   [\App\Http\Controllers\Api\TestimonialsController::class, 'index']);
Route::get('/auth/google/redirect', [GoogleAuthController::class, 'redirect']);
Route::get('/auth/google/callback', [GoogleAuthController::class, 'callback']);

// Stripe posts here directly — no auth middleware.
Route::post('/billing/webhook/stripe', [BillingController::class, 'stripeWebhook']);
Route::get('/billing/paypal/return', [BillingController::class, 'paypalReturn']);
Route::get('/billing/stripe/return', [BillingController::class, 'stripeReturn']);

// ── Authenticated (Sanctum token) ──
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/me',      [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    Route::get('/tools', [ToolController::class, 'index']);
    Route::get('/tools/{slug}/history', [ToolController::class, 'history']);
    Route::delete('/tools/{slug}/history', [ToolController::class, 'clearHistory']);
    Route::put('/account/profile',         [AccountController::class, 'updateProfile']);
    Route::post('/packages/request-custom', [\App\Http\Controllers\Api\BillingController::class, 'requestCustom']);
    Route::post('/billing/paypal/checkout', [\App\Http\Controllers\Api\BillingController::class, 'paypalCheckout']);
    Route::put('/account/password',        [AccountController::class, 'updatePassword']);
    Route::put('/account/notifications',   [AccountController::class, 'updateNotifications']);
    Route::post('/tools/{tool:slug}/process', [ToolController::class, 'process'])
        ->middleware('package.limits');

    Route::post('/billing/checkout', [BillingController::class, 'checkout']);
    Route::post('/billing/cancel',   [BillingController::class, 'cancel']);

    // ── Admin only ──
    Route::middleware('admin')->prefix('admin')->group(function () {
        Route::get('/dashboard', [DashboardController::class, 'index']);

        Route::get('/packages',              [PackageController::class, 'index']);
        Route::post('/packages',             [PackageController::class, 'store']);
        Route::put('/packages/{package}',    [PackageController::class, 'update']);
        Route::delete('/packages/{package}', [PackageController::class, 'destroy']);

        Route::get('/customers',                      [CustomerController::class, 'index']);
        Route::post('/customers',                     [CustomerController::class, 'store']);
        Route::put('/customers/{user}',               [CustomerController::class, 'update']);
        Route::post('/customers/{user}/notify',       [CustomerController::class, 'notifyUpdate']);
        Route::post('/customers/{user}/assign-plan',  [CustomerController::class, 'assignPlan']);
        Route::post('/customers/{user}/block',   [CustomerController::class, 'toggleBlock']);
        Route::post('/customers/{user}/credits', [CustomerController::class, 'adjustCredits']);

        Route::get('/subscriptions', [ActivityController::class, 'subscriptions']);
        Route::get('/usage-logs',    [ActivityController::class, 'usageLogs']);

        Route::get('/taxonomies',              [\App\Http\Controllers\Api\Admin\TaxonomyController::class, 'index']);
        Route::post('/taxonomies',             [\App\Http\Controllers\Api\Admin\TaxonomyController::class, 'store']);
        Route::put('/taxonomies/{taxonomy}',   [\App\Http\Controllers\Api\Admin\TaxonomyController::class, 'update']);
        Route::delete('/taxonomies/{taxonomy}', [\App\Http\Controllers\Api\Admin\TaxonomyController::class, 'destroy']);

        Route::get('/tools',         [ToolManagerController::class, 'index']);
        Route::put('/tools/{tool}',  [ToolManagerController::class, 'update']);

        Route::get('/messages',                     [ContactController::class, 'index']);
        Route::post('/messages/{message}/read',     [ContactController::class, 'toggleRead']);
        Route::delete('/messages/{message}',        [ContactController::class, 'destroy']);

        Route::get('/testimonials',              [\App\Http\Controllers\Api\TestimonialsController::class, 'adminIndex']);
        Route::post('/testimonials',             [\App\Http\Controllers\Api\TestimonialsController::class, 'store']);
        Route::put('/testimonials/{testimonial}', [\App\Http\Controllers\Api\TestimonialsController::class, 'update']);
        Route::delete('/testimonials/{testimonial}', [\App\Http\Controllers\Api\TestimonialsController::class, 'destroy']);

        Route::post('/demo/install', function (\Illuminate\Http\Request $request) {
            $request->validate(['password' => 'required|string']);
            abort_unless(\Illuminate\Support\Facades\Hash::check($request->password, $request->user()->password), 422, 'Your password is incorrect.');

            set_time_limit(900);
            \Illuminate\Support\Facades\Artisan::call('migrate:fresh', ['--force' => true]);
            \Illuminate\Support\Facades\Artisan::call('db:seed', ['--force' => true]);
            \Illuminate\Support\Facades\Artisan::call('optimize:clear');

            // Complete every enabled language with machine translations (best effort)
            $translator = app(\App\Services\AutoTranslateService::class);
            foreach (\App\Models\Language::where('enabled', true)->where('code', '!=', 'en')->get() as $lang) {
                try { $translator->translateAll($lang->code); } catch (\Throwable $e) { /* offline — admin can auto-translate later */ }
            }

            return response()->json(['message' => 'Demo data installed. All previous data was removed — please sign in again with admin@example.com / password.']);
        });

        Route::get('/pages',            [PagesController::class, 'index']);
        Route::post('/pages',           [PagesController::class, 'store']);
        Route::put('/pages/{page}',     [PagesController::class, 'update']);
        Route::delete('/pages/{page}',  [PagesController::class, 'destroy']);

        Route::get('/menu',             [MenuController::class, 'adminIndex']);
        Route::post('/menu',            [MenuController::class, 'store']);
        Route::put('/menu/{item}',      [MenuController::class, 'update']);
        Route::post('/menu/{item}/move', [MenuController::class, 'move']);
        Route::post('/menu/reorder',     [MenuController::class, 'reorder']);
        Route::delete('/menu/{item}',   [MenuController::class, 'destroy']);

        Route::get('/languages/template',     [LanguagesController::class, 'template']);
        Route::post('/languages/{language}/auto-translate', [LanguagesController::class, 'autoTranslate']);
        Route::get('/languages',              [LanguagesController::class, 'adminIndex']);
        Route::post('/languages',             [LanguagesController::class, 'store']);
        Route::put('/languages/{language}',   [LanguagesController::class, 'update']);
        Route::delete('/languages/{language}', [LanguagesController::class, 'destroy']);

        Route::post('/customers/{user}/status', [\App\Http\Controllers\Api\Admin\CustomerController::class, 'setStatus']);

        Route::get('/settings',                  [SettingsController::class, 'index']);
        Route::put('/settings',                  [SettingsController::class, 'update']);
        Route::post('/settings/test/{provider}', [SettingsController::class, 'testConnection']);
        Route::post('/settings/logo',            [SettingsController::class, 'uploadLogo']);
        Route::post('/settings/logo/remove',     [SettingsController::class, 'removeLogo']);
    });
});
