<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

/** Runs the complete setup: admin account + tools + languages + pages + demo showroom. */
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::firstOrCreate(['email' => 'admin@example.com'], [
            'name'              => 'Site Admin',
            'password'          => 'password',
            'role'              => 'admin',
            'status'            => 'active',
            'email_verified_at' => now(),
        ]);

        $this->call([
            AiToolSeeder::class,
            LanguageSeeder::class,
            PagesMenuSeeder::class,
            DemoDataSeeder::class,
        ]);
    }
}
