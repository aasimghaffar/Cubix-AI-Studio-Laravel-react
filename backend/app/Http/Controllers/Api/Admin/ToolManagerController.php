<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AiTool;
use Illuminate\Http\Request;

class ToolManagerController extends Controller
{
    /** GET /api/admin/tools — every tool regardless of status. */
    public function index()
    {
        return AiTool::with('taxonomy')->orderBy('sort_order')->get();
    }

    /** PUT /api/admin/tools/{tool} — edit name, description, status, order. */
    public function update(Request $request, AiTool $tool)
    {
        $data = $request->validate([
            'taxonomy_id' => 'sometimes|nullable|exists:taxonomies,id',
            'name'        => 'sometimes|string|max:100',
            'description' => 'sometimes|nullable|string|max:255',
            'status'      => 'sometimes|in:active,inactive,coming_soon',
            'sort_order'   => 'sometimes|integer|min:0',
            'free_enabled' => 'sometimes|boolean',
            'free_limit'   => 'sometimes|nullable|integer|min:1|max:100000',
            'free_unit'    => 'sometimes|in:day,month',
        ]);

        $tool->update($data);

        // Keep every language current automatically when name/description change
        if ($request->hasAny(['name', 'description'])) {
            try {
                app(\App\Services\AutoTranslateService::class)->retranslateKeys(array_filter([
                    "tool.{$tool->slug}.name" => $request->input('name'),
                    "tool.{$tool->slug}.desc" => $request->input('description'),
                ]));
            } catch (\Throwable $e) {
                \Log::warning('Tool auto-translate skipped: ' . $e->getMessage());
            }
        }


        return $tool;
    }
}
