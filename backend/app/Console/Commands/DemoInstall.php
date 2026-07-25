<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;

/**
 * One-command showroom reset:  php artisan demo:install
 * Wipes the database and rebuilds it with professional demo content only —
 * exactly what a fresh customer sees after setting the product up.
 */
class DemoInstall extends Command
{
    protected $signature = 'demo:install {--yes : Skip the confirmation prompt}';

    protected $description = 'DELETE all data and reinstall with clean demo content (admin@example.com / password)';

    public function handle(): int
    {
        if (! $this->option('yes') && ! $this->confirm('This DELETES EVERYTHING in the database and reinstalls demo content. Continue?')) {
            $this->info('Cancelled — nothing was changed.');
            return self::SUCCESS;
        }

        $this->info('Rebuilding database…');
        Artisan::call('migrate:fresh', ['--force' => true], $this->getOutput());

        $this->info('Seeding demo content…');
        Artisan::call('db:seed', ['--force' => true], $this->getOutput());

        Artisan::call('optimize:clear');

        // Fill every enabled language with machine translations of the complete
        // dictionary (UI + all demo content). Needs internet; skips gracefully offline.
        $this->info('Translating all languages (needs internet — a minute or two)…');
        @set_time_limit(900);
        $translator = app(\App\Services\AutoTranslateService::class);
        foreach (\App\Models\Language::where('enabled', true)->where('code', '!=', 'en')->get() as $lang) {
            try {
                [$done, $failed] = $translator->translateAll($lang->code);
                $this->line("  {$lang->name}: {$done} translated" . ($failed ? ", {$failed} skipped" : ''));
            } catch (\Throwable $e) {
                $this->warn("  {$lang->name}: skipped (no internet or service busy) — use Auto-translate in Admin → Languages later.");
            }
        }

        $this->newLine();
        $this->info('✔ Done! Clean demo install ready.');
        $this->warn('Text tools need one AI key: add OpenAI, Gemini (free at aistudio.google.com) or Groq (free at console.groq.com) in Admin → AI Settings → API Keys. The image tool is free out of the box.');
        $this->table(['Account', 'Email', 'Password'], [
            ['Admin',         'admin@example.com',  'password'],
            ['Demo customer', 'maya@example.com',   'password'],
            ['Demo customer', 'liam@example.com',   'password'],
            ['Demo customer', 'fatima@example.com', 'password'],
        ]);

        return self::SUCCESS;
    }
}
