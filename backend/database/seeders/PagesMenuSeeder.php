<?php

namespace Database\Seeders;

use App\Models\MenuItem;
use App\Models\SitePage;
use Illuminate\Database\Seeder;

class PagesMenuSeeder extends Seeder
{
    public function run(): void
    {
        $terms = SitePage::firstOrCreate(['slug' => 'terms'], [
            'title' => 'Terms & Conditions', 'is_system' => true, 'published' => true,
            'content' => '<h2>Terms &amp; Conditions</h2><p>Edit this page in <strong>Admin → Pages</strong> — you can style text, add bullet points, headings, and open/close sections.</p><ul><li>Use of this service means you accept these terms.</li><li>Credits reset each billing cycle and do not roll over.</li><li>Do not use the tools for illegal content.</li></ul><details><summary>Refunds</summary><p>Describe your refund policy here.</p></details>',
        ]);

        $privacy = SitePage::firstOrCreate(['slug' => 'privacy-policy'], [
            'title' => 'Privacy Policy', 'is_system' => true, 'published' => true,
            'content' => '<h2>Privacy Policy</h2><p>Edit this page in <strong>Admin → Pages</strong>.</p><ul><li>We store your account details and tool results to provide the service.</li><li>We never sell your personal data.</li></ul><details><summary>What we collect</summary><p>Name, email, and the content you submit to the tools.</p></details>',
        ]);

        SitePage::firstOrCreate(['slug' => 'faq'], [
            'title' => 'Frequently Asked Questions', 'is_system' => false, 'published' => true,
            'content' => '<h2>Frequently Asked Questions</h2><p>Everything you need to know before getting started. Can\'t find your answer? Reach us through the contact page — we reply fast.</p>'
                . '<details><summary>What do I get with a subscription?</summary><p>Every plan unlocks every AI tool — images, writing, translation, documents, background removal, audio, chat, rewriting and summaries. Plans differ only in monthly credits.</p></details>'
                . '<details><summary>Do unused credits roll over?</summary><p>Credits refresh at the start of each billing cycle and don\'t roll over — pick the plan that matches your monthly usage, and upgrade any time.</p></details>'
                . '<details><summary>Can I cancel anytime?</summary><p>Yes. Cancel from your account page — you keep full access and your remaining credits until the end of the paid period, and you won\'t be charged again.</p></details>'
                . '<details><summary>Do you offer custom plans?</summary><p>Absolutely. Use the "Request a custom package" button on the pricing page and tell us what your team needs — we\'ll build a private plan with your own credit amounts and price.</p></details>'
                . '<details><summary>Who owns the content I create?</summary><p>You do. Everything you generate is yours to use commercially.</p></details>'
                . '[cta]',
        ]);

        // Default menu mirrors the classic navigation; admin can reorder/nest/remove freely.
        if (MenuItem::count() === 0) {
            $core = [
                ['label' => 'Home',    'target' => '/'],
                ['label' => 'Tools',   'target' => '/tools'],
                ['label' => 'Pricing', 'target' => '/pricing'],
                ['label' => 'Contact', 'target' => '/contact'],
            ];
            foreach ($core as $i => $item) {
                MenuItem::create($item + ['type' => 'core', 'sort_order' => $i + 1, 'enabled' => true]);
            }

            MenuItem::create(['label' => 'FAQ', 'type' => 'page', 'target' => 'faq', 'sort_order' => 5, 'enabled' => true]);
            $legal = MenuItem::create(['label' => 'Legal', 'type' => 'core', 'target' => '#', 'sort_order' => 6, 'enabled' => true]);
            MenuItem::create(['label' => 'Terms & Conditions', 'type' => 'page', 'target' => 'terms', 'parent_id' => $legal->id, 'sort_order' => 1, 'enabled' => true]);
            MenuItem::create(['label' => 'Privacy Policy', 'type' => 'page', 'target' => 'privacy-policy', 'parent_id' => $legal->id, 'sort_order' => 2, 'enabled' => true]);
        }
    }
}
