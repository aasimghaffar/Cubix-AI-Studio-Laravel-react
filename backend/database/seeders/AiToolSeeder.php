<?php

namespace Database\Seeders;

use App\Models\AiTool;
use App\Models\Package;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AiToolSeeder extends Seeder
{
    public function run(): void
    {
        // ── Default admin account (change the password immediately) ──
        User::firstOrCreate(
            ['email' => 'admin@example.com'],
            ['name' => 'Administrator', 'password' => Hash::make('password'), 'role' => 'admin']
        );

        // ── Remove retired tools if present from earlier versions ──
        AiTool::whereIn('slug', ['ai-video-generator', 'ai-code-assistant'])->delete();

        // ── Starter packages (all six tool limits) ──
        foreach ([
            ['name' => 'Starter', 'price' => 9.00,  'features' => ['image_generation_credits' => 25,  'document_query_credits' => 50,   'background_removal_credits' => 15,  'audio_character_limit' => 5000,   'content_writer_credits' => 30,  'translation_credits' => 50, 'chat_credits' => 100, 'rewriter_credits' => 50, 'summarizer_credits' => 50]],
            ['name' => 'Pro',     'price' => 29.00, 'features' => ['image_generation_credits' => 150, 'document_query_credits' => 300,  'background_removal_credits' => 100, 'audio_character_limit' => 30000,  'content_writer_credits' => 200, 'translation_credits' => 300, 'chat_credits' => 600, 'rewriter_credits' => 300, 'summarizer_credits' => 300]],
            ['name' => 'Agency',  'price' => 79.00, 'features' => ['image_generation_credits' => 600, 'document_query_credits' => 1200, 'background_removal_credits' => 400, 'audio_character_limit' => 120000, 'content_writer_credits' => 800, 'translation_credits' => 1200, 'chat_credits' => 2500, 'rewriter_credits' => 1200, 'summarizer_credits' => 1200]],
        ] as $p) {
            Package::updateOrCreate(['name' => $p['name']], $p + ['billing_cycle' => 'monthly', 'status' => 'active']);
        }

        $tools = [
            [
                'slug' => 'ai-image-generator', 'name' => 'AI Image Generator', 'icon' => 'ImagePlus',
                'free_enabled' => true, 'free_limit' => 5,
                'description' => 'Turn text prompts into stunning images.', 'feature_key' => 'image_generation_credits',
                'status' => 'active', 'sort_order' => 1,
                'input_schema' => ['submit_label' => 'Generate image', 'fields' => [
                    ['name' => 'prompt', 'type' => 'textarea', 'label' => 'Prompt', 'placeholder' => 'A cozy mountain cabin at sunset…', 'required' => true, 'max_length' => 2000],
                    ['name' => 'aspect_ratio', 'type' => 'select', 'label' => 'Aspect ratio', 'default' => '1:1', 'options' => [
                        ['value' => '1:1', 'label' => 'Square (1:1)'], ['value' => '16:9', 'label' => 'Widescreen (16:9)'],
                        ['value' => '4:3', 'label' => 'Classic (4:3)'], ['value' => '9:16', 'label' => 'Portrait (9:16)'],
                    ]],
                    ['name' => 'style', 'type' => 'select', 'label' => 'Style', 'default' => 'Photorealistic', 'options' => [
                        ['value' => 'Photorealistic', 'label' => 'Photorealistic'], ['value' => 'Anime', 'label' => 'Anime'],
                        ['value' => '3D Render', 'label' => '3D Render'], ['value' => 'Watercolor', 'label' => 'Watercolor'],
                    ]],
                    ['name' => 'resolution', 'type' => 'select', 'label' => 'Resolution', 'default' => '1024x1024', 'options' => [
                        ['value' => '512x512', 'label' => '512 × 512'], ['value' => '1024x1024', 'label' => '1024 × 1024'],
                    ]],
                    ['name' => 'quality', 'type' => 'select', 'label' => 'Quality', 'default' => 'standard', 'options' => [
                        ['value' => 'standard', 'label' => 'Standard'], ['value' => 'hd', 'label' => 'HD (finer detail)'],
                    ]],
                ]],
            ],
            [
                'slug' => 'ai-content-writer', 'name' => 'AI Content Writer', 'icon' => 'PenLine',
                'free_enabled' => true, 'free_limit' => 4,
                'description' => 'Blog posts, product copy & social captions in seconds.', 'feature_key' => 'content_writer_credits',
                'status' => 'active', 'sort_order' => 2,
                'input_schema' => ['submit_label' => 'Write content', 'fields' => [
                    ['name' => 'topic', 'type' => 'textarea', 'label' => 'What should it write about?', 'placeholder' => 'e.g. 5 benefits of morning walks, product description for a leather wallet…', 'required' => true, 'max_length' => 1000],
                    ['name' => 'content_type', 'type' => 'select', 'label' => 'Content type', 'default' => 'blog_post', 'options' => [
                        ['value' => 'blog_post', 'label' => 'Blog post'], ['value' => 'product_description', 'label' => 'Product description'],
                        ['value' => 'social_caption', 'label' => 'Social media caption'], ['value' => 'email', 'label' => 'Marketing email'],
                    ]],
                    ['name' => 'tone', 'type' => 'select', 'label' => 'Tone', 'default' => 'Professional', 'options' => [
                        ['value' => 'Professional', 'label' => 'Professional'], ['value' => 'Casual', 'label' => 'Casual'],
                        ['value' => 'Persuasive', 'label' => 'Persuasive'], ['value' => 'Friendly', 'label' => 'Friendly'],
                    ]],
                    ['name' => 'length', 'type' => 'select', 'label' => 'Length', 'default' => 'medium', 'options' => [
                        ['value' => 'short', 'label' => 'Short (~150 words)'], ['value' => 'medium', 'label' => 'Medium (~400 words)'],
                        ['value' => 'long', 'label' => 'Long (~800 words)'],
                    ]],
                    ['name' => 'language', 'type' => 'select', 'label' => 'Output language', 'default' => 'English', 'options' => [
                        ['value' => 'English', 'label' => 'English'], ['value' => 'Urdu', 'label' => 'Urdu'],
                        ['value' => 'Arabic', 'label' => 'Arabic'], ['value' => 'Spanish', 'label' => 'Spanish'],
                        ['value' => 'French', 'label' => 'French'], ['value' => 'German', 'label' => 'German'],
                    ]],
                    ['name' => 'keywords', 'type' => 'text', 'label' => 'Keywords to include (optional)', 'placeholder' => 'e.g. affordable, handmade, eco-friendly', 'max_length' => 200],
                ]],
            ],
            [
                'slug' => 'ai-translator', 'name' => 'AI Translator', 'icon' => 'Languages',
                'description' => 'Natural, context-aware translation into 12+ languages.', 'feature_key' => 'translation_credits',
                'status' => 'active', 'sort_order' => 3,
                'input_schema' => ['submit_label' => 'Translate', 'fields' => [
                    ['name' => 'text', 'type' => 'textarea', 'label' => 'Text to translate', 'placeholder' => 'Paste your text here…', 'required' => true, 'max_length' => 5000],
                    ['name' => 'target_language', 'type' => 'select', 'label' => 'Translate to', 'required' => true, 'options' => [
                        ['value' => 'English', 'label' => 'English'], ['value' => 'Urdu', 'label' => 'Urdu'],
                        ['value' => 'Arabic', 'label' => 'Arabic'], ['value' => 'Spanish', 'label' => 'Spanish'],
                        ['value' => 'French', 'label' => 'French'], ['value' => 'German', 'label' => 'German'],
                        ['value' => 'Chinese (Simplified)', 'label' => 'Chinese (Simplified)'], ['value' => 'Hindi', 'label' => 'Hindi'],
                        ['value' => 'Portuguese', 'label' => 'Portuguese'], ['value' => 'Russian', 'label' => 'Russian'],
                        ['value' => 'Japanese', 'label' => 'Japanese'], ['value' => 'Turkish', 'label' => 'Turkish'],
                    ]],
                    ['name' => 'formality', 'type' => 'select', 'label' => 'Style', 'default' => 'natural', 'options' => [
                        ['value' => 'natural', 'label' => 'Natural'], ['value' => 'formal', 'label' => 'Formal'],
                        ['value' => 'informal', 'label' => 'Informal'],
                    ]],
                ]],
            ],
            [
                'slug' => 'ai-document-assistant', 'name' => 'AI Document Assistant', 'icon' => 'FileSearch',
                'description' => 'Upload a document and ask it anything.', 'feature_key' => 'document_query_credits',
                'status' => 'active', 'sort_order' => 4,
                'input_schema' => ['submit_label' => 'Ask document', 'fields' => [
                    ['name' => 'document', 'type' => 'file', 'label' => 'Document', 'required' => true,
                     'accept_extensions' => ['pdf', 'txt', 'docx'], 'max_kb' => 10240],
                    ['name' => 'prompt', 'type' => 'text', 'label' => 'Your question', 'placeholder' => 'What are the key findings?', 'required' => true, 'max_length' => 500],
                ]],
            ],
            [
                'slug' => 'ai-background-removal', 'name' => 'AI Background Removal', 'icon' => 'Eraser',
                'description' => 'Remove image backgrounds in one click.', 'feature_key' => 'background_removal_credits',
                'status' => 'active', 'sort_order' => 5,
                'input_schema' => ['submit_label' => 'Remove background', 'fields' => [
                    ['name' => 'image', 'type' => 'file', 'label' => 'Image', 'required' => true,
                     'accept_extensions' => ['jpg', 'jpeg', 'png'], 'max_kb' => 5120],
                ]],
            ],
            [
                'slug' => 'ai-text-to-audio', 'name' => 'AI Text-to-Audio', 'icon' => 'AudioLines',
                'description' => 'Natural voiceovers from your text.', 'feature_key' => 'audio_character_limit',
                'status' => 'active', 'sort_order' => 6,
                'input_schema' => ['submit_label' => 'Generate audio', 'credit_note' => '1 credit per character', 'fields' => [
                    ['name' => 'text', 'type' => 'textarea', 'label' => 'Text', 'placeholder' => 'Type or paste your script…', 'required' => true, 'max_length' => 5000],
                    ['name' => 'voice_id', 'type' => 'select', 'label' => 'Voice', 'options_source' => 'voices', 'options' => []],
                    ['name' => 'speed', 'type' => 'range', 'label' => 'Speed', 'min' => 0.5, 'max' => 1.5, 'step' => 0.1, 'default' => 1.0],
                ]],
            ],
            [
                'slug' => 'ai-chat-assistant', 'name' => 'AI Chat Assistant', 'icon' => 'MessageCircleMore',
                'description' => 'Ask anything — your everyday AI helper.', 'feature_key' => 'chat_credits',
                'status' => 'active', 'sort_order' => 7, 'free_enabled' => false, 'free_limit' => null,
                'input_schema' => ['submit_label' => 'Ask', 'fields' => [
                    ['name' => 'message', 'type' => 'textarea', 'label' => 'Your question', 'placeholder' => 'Ask me anything…', 'required' => true, 'max_length' => 4000],
                    ['name' => 'style', 'type' => 'select', 'label' => 'Answer style', 'default' => 'helpful', 'options' => [
                        ['value' => 'helpful', 'label' => 'Helpful'], ['value' => 'concise', 'label' => 'Concise'],
                        ['value' => 'detailed', 'label' => 'Detailed'], ['value' => 'creative', 'label' => 'Creative'],
                    ]],
                ]],
            ],
            [
                'slug' => 'ai-text-rewriter', 'name' => 'AI Grammar & Rewriter', 'icon' => 'SpellCheck2',
                'description' => 'Fix grammar or rewrite text in one click.', 'feature_key' => 'rewriter_credits',
                'status' => 'active', 'sort_order' => 8, 'free_enabled' => false, 'free_limit' => null,
                'input_schema' => ['submit_label' => 'Rewrite', 'fields' => [
                    ['name' => 'text', 'type' => 'textarea', 'label' => 'Your text', 'placeholder' => 'Paste the text to fix or rewrite…', 'required' => true, 'max_length' => 8000],
                    ['name' => 'mode', 'type' => 'select', 'label' => 'What should it do?', 'default' => 'fix_grammar', 'options' => [
                        ['value' => 'fix_grammar', 'label' => 'Fix grammar & spelling'], ['value' => 'improve', 'label' => 'Improve & polish'],
                        ['value' => 'simplify', 'label' => 'Simplify'], ['value' => 'shorten', 'label' => 'Make shorter'],
                        ['value' => 'expand', 'label' => 'Expand'],
                    ]],
                ]],
            ],
            [
                'slug' => 'ai-summarizer', 'name' => 'AI Summarizer', 'icon' => 'ScanText',
                'description' => 'Long text in, key points out.', 'feature_key' => 'summarizer_credits',
                'status' => 'active', 'sort_order' => 9, 'free_enabled' => false, 'free_limit' => null,
                'input_schema' => ['submit_label' => 'Summarize', 'fields' => [
                    ['name' => 'text', 'type' => 'textarea', 'label' => 'Text to summarize', 'placeholder' => 'Paste an article, report, or any long text…', 'required' => true, 'max_length' => 15000],
                    ['name' => 'length', 'type' => 'select', 'label' => 'Summary style', 'default' => 'short', 'options' => [
                        ['value' => 'one_sentence', 'label' => 'One sentence'], ['value' => 'short', 'label' => 'Short paragraph'],
                        ['value' => 'bullets', 'label' => 'Bullet points'],
                    ]],
                ]],
            ],
        ];

        foreach ($tools as $tool) {
            AiTool::updateOrCreate(['slug' => $tool['slug']], $tool);
        }
    }
}
