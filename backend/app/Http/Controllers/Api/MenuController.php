<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MenuItem;
use Illuminate\Http\Request;

class MenuController extends Controller
{
    /** GET /api/menu — enabled items as a nested tree (public). */
    public function index()
    {
        return MenuItem::where('enabled', true)
            ->whereNull('parent_id')
            ->with(['children' => fn ($q) => $q->where('enabled', true)])
            ->orderBy('sort_order')
            ->get();
    }

    /** GET /api/admin/menu — everything, flat with children. */
    public function adminIndex()
    {
        return MenuItem::whereNull('parent_id')->with('children')->orderBy('sort_order')->get();
    }

    /** POST /api/admin/menu */
    public function store(Request $request)
    {
        $data = $request->validate([
            'label'     => 'required|string|max:60',
            'type'      => 'required|in:core,page,link',
            'target'    => 'required|string|max:255',
            'parent_id' => 'nullable|exists:menu_items,id',
        ]);

        // Submenus are one level deep (like most site headers)
        if (! empty($data['parent_id']) && MenuItem::find($data['parent_id'])?->parent_id) {
            abort(422, 'Submenus can only be one level deep.');
        }

        return MenuItem::create($data + [
            'sort_order' => (MenuItem::where('parent_id', $data['parent_id'] ?? null)->max('sort_order') ?? 0) + 1,
            'enabled'    => true,
        ]);
    }

    /** PUT /api/admin/menu/{item} — label, enable/disable, move, re-parent. */
    public function update(Request $request, MenuItem $item)
    {
        $data = $request->validate([
            'label'      => 'sometimes|string|max:60',
            'enabled'    => 'sometimes|boolean',
            'sort_order' => 'sometimes|integer|min:0',
            'parent_id'  => 'sometimes|nullable|exists:menu_items,id',
        ]);

        if (array_key_exists('parent_id', $data)) {
            abort_if($data['parent_id'] == $item->id, 422, 'An item cannot be inside itself.');
            if ($data['parent_id'] && MenuItem::find($data['parent_id'])?->parent_id) {
                abort(422, 'Submenus can only be one level deep.');
            }
            abort_if($data['parent_id'] && $item->children()->exists(), 422, 'Move or delete this item\'s sub-items first.');
        }

        $item->update($data);

        return $item->load('children');
    }

    /** POST /api/admin/menu/{item}/move — direction: up|down (within same parent). */
    public function move(Request $request, MenuItem $item)
    {
        $dir = $request->validate(['direction' => 'required|in:up,down'])['direction'];

        $siblings = MenuItem::where('parent_id', $item->parent_id)->orderBy('sort_order')->get()->values();
        $index = $siblings->search(fn ($s) => $s->id === $item->id);
        $swap = $dir === 'up' ? $index - 1 : $index + 1;

        if ($swap >= 0 && $swap < $siblings->count()) {
            $other = $siblings[$swap];
            [$a, $b] = [$item->sort_order, $other->sort_order];
            $item->update(['sort_order' => $b]);
            $other->update(['sort_order' => $a]);
        }

        return response()->json(['message' => 'ok']);
    }

    /** POST /api/admin/menu/reorder — bulk save after drag & drop. */
    public function reorder(Request $request)
    {
        $data = $request->validate([
            'items'              => 'required|array',
            'items.*.id'         => 'required|exists:menu_items,id',
            'items.*.sort_order' => 'required|integer|min:0',
            'items.*.parent_id'  => 'nullable|exists:menu_items,id',
        ]);

        foreach ($data['items'] as $row) {
            MenuItem::where('id', $row['id'])->update([
                'sort_order' => $row['sort_order'],
                'parent_id'  => $row['parent_id'] ?? null,
            ]);
        }

        return response()->json(['message' => 'Menu order saved.']);
    }

    /** DELETE /api/admin/menu/{item} */
    public function destroy(MenuItem $item)
    {
        $item->children()->update(['parent_id' => null]); // orphans become top-level, nothing is lost
        $item->delete();

        return response()->json(['message' => 'Menu item removed.']);
    }
}
