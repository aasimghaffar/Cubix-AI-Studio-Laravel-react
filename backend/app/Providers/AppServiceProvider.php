<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // MUST be a singleton: the "Test key" override is set on this instance and
        // must be the same instance AiService & BillingController read from.
        $this->app->singleton(\App\Services\SettingsService::class);
    }

    public function boot(): void
    {
        //
    }
}
