<?php

namespace Database\Seeders;

use App\Models\AiTool;
use App\Models\Package;
use App\Models\Taxonomy;
use Illuminate\Database\Seeder;

/**
 * Professional-looking demo content: tool categories and yearly plans
 * with discount badges. Safe to run repeatedly.
 */
class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        // ── Tool categories ──
        $cats = [
            'creative'     => ['name' => 'Creative Studio',   'sort_order' => 1],
            'writing'      => ['name' => 'Writing & Content', 'sort_order' => 2],
            'productivity' => ['name' => 'Productivity',      'sort_order' => 3],
            'voice'        => ['name' => 'Voice & Audio',     'sort_order' => 4],
        ];
        $ids = [];
        foreach ($cats as $slug => $cat) {
            $ids[$slug] = Taxonomy::firstOrCreate(['slug' => $slug], $cat)->id;
        }

        $map = [
            'ai-image-generator'    => 'creative',
            'ai-background-removal' => 'creative',
            'ai-content-writer'     => 'writing',
            'ai-text-rewriter'      => 'writing',
            'ai-translator'         => 'writing',
            'ai-document-assistant' => 'productivity',
            'ai-summarizer'         => 'productivity',
            'ai-chat-assistant'     => 'productivity',
            'ai-text-to-audio'      => 'voice',
        ];
        foreach ($map as $slug => $cat) {
            AiTool::where('slug', $slug)->whereNull('taxonomy_id')->update(['taxonomy_id' => $ids[$cat]]);
        }

        // ── 3 professional monthly plans (created only if missing) ──
        $plans = [
            ['name' => 'Starter',  'price' => 9.99,  'mult' => 1],
            ['name' => 'Creator',  'price' => 24.99, 'mult' => 3],
        ];
        $base = [
            'image_generation_credits'   => 50,
            'content_writer_credits'     => 40,
            'translation_credits'        => 60,
            'document_query_credits'     => 40,
            'background_removal_credits' => 30,
            'audio_character_limit'      => 20000,
            'chat_credits'               => 100,
            'rewriter_credits'           => 60,
            'summarizer_credits'         => 60,
        ];
        foreach ($plans as $i => $plan) {
            if (Package::where('name', $plan['name'])->exists()) continue;
            Package::create([
                'name'             => $plan['name'],
                'price'            => $plan['price'],
                'billing_cycle'    => 'monthly',
                'features'         => collect($base)->map(fn ($v) => $v * $plan['mult'])->all(),
                'status'           => 'active',
                'discount_percent' => null,
                'stripe_plan_id'   => null, // add your Stripe price ID in Admin → Packages
            ]);
        }

        // ── Yearly versions of the 3 demo plans only → exactly 3 monthly + 3 yearly ──
        foreach (Package::whereIn('name', ['Starter', 'Creator'])->where('billing_cycle', 'monthly')->get() as $monthly) {
            $name = $monthly->name . ' Yearly';
            if (Package::where('name', $name)->exists()) continue;

            Package::create([
                'name'             => $name,
                'price'            => round($monthly->price * 10, 2), // pay for 10 months, use 12
                'billing_cycle'    => 'yearly',
                'features'         => collect($monthly->features)->map(fn ($v) => (int) $v * 12)->all(),
                'status'           => 'active',
                'discount_percent' => 17,
                'stripe_plan_id'   => null, // add your yearly Stripe price ID in Admin → Packages
            ]);
        }

        // ── Agency: a yearly-only top tier (no monthly version, per design) ──
        if (! Package::where('name', 'Agency Yearly')->exists()) {
            Package::create([
                'name'             => 'Agency Yearly',
                'price'            => 599.99,
                'billing_cycle'    => 'yearly',
                'features'         => collect($base)->map(fn ($v) => $v * 10 * 12)->all(),
                'status'           => 'active',
                'discount_percent' => 17,
                'max_sessions'     => 5,
                'stripe_plan_id'   => null,
            ]);
        }

        // ── Testimonials shown in "Loved by creators" (edit in Admin → Testimonials) ──
        $testimonials = [
            ['name' => 'Sarah Mitchell', 'role' => 'Content lead, Northwind Media', 'quote' => 'We replaced four separate AI subscriptions with this one platform. The writing and translation tools alone save my team a full day every week.', 'rating' => 5],
            ['name' => 'Omar Farooq', 'role' => 'Founder, PixelForge Studio', 'quote' => 'The image generator and background removal fit straight into our client workflow. Deliverables that took an afternoon now take minutes.', 'rating' => 5],
            ['name' => 'Elena Petrova', 'role' => 'Freelance copywriter', 'quote' => 'The rewriter and summarizer are my daily drivers. Clean results, my own tone preserved, and the credit meters make costs completely predictable.', 'rating' => 5],
            ['name' => 'James Okafor', 'role' => 'E-commerce manager', 'quote' => 'Product descriptions in five languages used to be a bottleneck. Now it is one prompt and a coffee break. Support replies fast too.', 'rating' => 4],
        ];
        foreach ($testimonials as $i => $row) {
            \App\Models\Testimonial::firstOrCreate(['name' => $row['name']], $row + ['sort_order' => $i + 1, 'enabled' => true]);
        }

        // ── Default settings (only filled when missing — never overwrites real values) ──
        $settings = [
            'currency_code'          => 'USD',
            'theme_toggle_enabled'   => '1',
            'google_login_enabled'   => '0',
            'language_switcher'      => 'float',
            'stripe_mode'            => 'test',
            'notify_account_created' => '1',
            'notify_account_updated' => '1',
            'notify_account_blocked' => '1',
            'notify_plan_purchased'  => '1',
            'notify_plan_expiry'     => '1',
            'notify_expiry_days'     => '3',
            'free_limit_message'     => 'Your free limit for this tool is used up — choose a plan to keep creating.',
            'business_email'         => 'cubix-ai-studio@gmail.com',
            'business_phone'         => '+0000000000',
            'business_address'       => 'Cubix AI Studio, Office No 12, Kings Road, London',
            'stripe_enabled'         => '1',
            'paypal_enabled'         => '0',
            'paypal_mode'            => 'sandbox',
            'image_provider'         => 'pollinations',
            'engine_ai-image-generator'    => 'pollinations',
            'engine_ai-content-writer'     => 'openai',
            'engine_ai-translator'         => 'openai',
            'engine_ai-document-assistant' => 'openai',
            'engine_ai-chat-assistant'     => 'openai',
            'engine_ai-text-rewriter'      => 'openai',
            'engine_ai-summarizer'         => 'openai',
        ];
        foreach ($settings as $key => $value) {
            if (\App\Models\Setting::whereKey($key)->doesntExist()) {
                \App\Models\Setting::create(['key' => $key, 'value' => $value, 'group' => 'demo']);
            }
        }

        // ── Demo customers with plans and activity (so the dashboard looks alive) ──
        $starter = Package::where('name', 'Starter')->first();
        $creator = Package::where('name', 'Creator')->first();
        $demoUsers = [
            ['name' => 'Maya Chen',      'email' => 'maya@example.com',   'package' => $creator],
            ['name' => 'Liam Turner',    'email' => 'liam@example.com',   'package' => $starter],
            ['name' => 'Fatima Noor',    'email' => 'fatima@example.com', 'package' => $creator],
        ];
        $slugFeature = [
            'ai-image-generator'    => 'image_generation_credits',
            'ai-content-writer'     => 'content_writer_credits',
            'ai-chat-assistant'     => 'chat_credits',
            'ai-summarizer'         => 'summarizer_credits',
            'ai-translator'         => 'translation_credits',
        ];
        foreach ($demoUsers as $d) {
            $u = \App\Models\User::firstOrCreate(['email' => $d['email']], [
                'name' => $d['name'], 'password' => 'password', 'role' => 'customer',
                'status' => 'active', 'email_verified_at' => now(),
            ]);
            if ($d['package'] && ! $u->subscriptions()->exists()) {
                \App\Models\Subscription::create([
                    'user_id' => $u->id, 'package_id' => $d['package']->id, 'gateway' => 'manual',
                    'status' => 'active', 'expires_at' => now()->addMonth(),
                ]);
            }
            if (\App\Models\UsageLog::where('user_id', $u->id)->doesntExist()) {
                foreach (range(1, 14) as $day) {
                    if (random_int(0, 2) === 0) continue; // quiet days keep the chart natural
                    $slug = array_rand($slugFeature);
                    \App\Models\UsageLog::create([
                        'user_id' => $u->id, 'tool_slug' => $slug,
                        'feature_key' => $slugFeature[$slug],
                        'amount' => random_int(1, 4),
                        'created_at' => now()->subDays($day)->setHour(random_int(9, 21)),
                        'updated_at' => now()->subDays($day),
                    ]);
                }
            }
        }

        // ── Sample inbox messages ──
        $messages = [
            ['name' => 'Daniel Wright', 'email' => 'daniel@agencyhub.io', 'subject' => 'Custom package request', 'message' => "Hi — we're a 12-person content agency. Could you put together a custom plan with unlimited images, ~2,000 writer credits, and 5 browser logins? Happy to jump on a call."],
            ['name' => 'Sofia Ricci', 'email' => 'sofia@bellamoda.it', 'subject' => 'Question about yearly billing', 'message' => 'If I switch from monthly to yearly mid-cycle, do my remaining credits carry over? Thanks!'],
        ];
        foreach ($messages as $m) {
            \App\Models\ContactMessage::firstOrCreate(['email' => $m['email'], 'subject' => $m['subject']], $m + ['is_read' => false]);
        }

        // ── Register every seeded text in the English dictionary so translations cover it all ──
        app(\App\Services\AutoTranslateService::class)->syncContentKeys();

        // ── Merge the BUNDLED translations so the demo is multilingual offline ──
        // (Auto-translate still fills anything new the admin adds later.)
        $bundled = [];
        foreach ([\App\Services\ContentTranslations::MAPS, \App\Services\UiTranslations::MAPS] as $set) {
            foreach ($set as $code => $map) {
                $bundled[$code] = array_merge($bundled[$code] ?? [], $map);
            }
        }

        foreach ($bundled as $code => $map) {
            $language = \App\Models\Language::where('code', $code)->first();
            if (! $language) continue;

            $existing = $language->translations ?? [];
            $language->update(['translations' => array_merge($existing, $map)]);
        }
    }
}