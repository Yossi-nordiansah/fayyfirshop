<?php

namespace App\Http\Controllers;

use App\Models\AllProductSlide;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class AllProductSlideController extends Controller
{
    /**
     * List all slides — rendered inside ProductCategories page via shared prop.
     * We redirect to the product categories page so slides live there.
     */
    public function index(): Response
    {
        return Inertia::render('backoffice/menu/ProductCategories', [
            'categories'        => \App\Models\ProductCategory::query()
                ->with(['subCategories:id,product_category_id,name,name_translations'])
                ->withCount('subCategories')
                ->latest('id')
                ->get(),
            'allProductSlides'  => AllProductSlide::orderBy('sort_order')->orderBy('id')->get(),
            'status'            => session('status'),
            'statusAction'      => session('statusAction'),
        ]);
    }

    /**
     * Store a new slide with an uploaded image.
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'title'      => 'nullable|string|max:255',
            'image_file' => 'required|file|mimes:jpeg,png,jpg,webp,gif,svg|max:5120',
        ]);

        $path = $request->file('image_file')->store('all-product-slides', 'public');

        $maxOrder = AllProductSlide::max('sort_order') ?? 0;

        AllProductSlide::create([
            'title'      => $request->input('title'),
            'image'      => '/storage/' . $path,
            'sort_order' => $maxOrder + 1,
            'is_active'  => true,
        ]);

        return redirect()
            ->route('backoffice.product-categories.index')
            ->with('status', 'Slide carousel berhasil ditambahkan.')
            ->with('statusAction', 'created');
    }

    /**
     * Update an existing slide (title / replace image).
     */
    public function update(Request $request, int $id): RedirectResponse
    {
        $slide = AllProductSlide::findOrFail($id);

        $request->validate([
            'title'      => 'nullable|string|max:255',
            'image_file' => 'nullable|file|mimes:jpeg,png,jpg,webp,gif,svg|max:5120',
        ]);

        $imagePath = $slide->image;

        if ($request->hasFile('image_file')) {
            // Delete old file
            if ($imagePath && str_starts_with($imagePath, '/storage/')) {
                Storage::disk('public')->delete(str_replace('/storage/', '', $imagePath));
            }
            $path      = $request->file('image_file')->store('all-product-slides', 'public');
            $imagePath = '/storage/' . $path;
        }

        $slide->update([
            'title' => $request->input('title', $slide->title),
            'image' => $imagePath,
        ]);

        return redirect()
            ->route('backoffice.product-categories.index')
            ->with('status', 'Slide carousel berhasil diperbarui.')
            ->with('statusAction', 'updated');
    }

    /**
     * Delete a slide and its image file.
     */
    public function destroy(int $id): RedirectResponse
    {
        $slide = AllProductSlide::findOrFail($id);

        if ($slide->image && str_starts_with($slide->image, '/storage/')) {
            Storage::disk('public')->delete(str_replace('/storage/', '', $slide->image));
        }

        $slide->delete();

        return redirect()
            ->route('backoffice.product-categories.index')
            ->with('status', 'Slide carousel berhasil dihapus.')
            ->with('statusAction', 'deleted');
    }

    /**
     * Toggle is_active for a slide.
     */
    public function toggleActive(int $id): RedirectResponse
    {
        $slide = AllProductSlide::findOrFail($id);
        $slide->update(['is_active' => ! $slide->is_active]);

        $msg = $slide->is_active
            ? 'Slide diaktifkan.'
            : 'Slide dinonaktifkan.';

        return redirect()
            ->back()
            ->with('status', $msg)
            ->with('statusAction', 'updated');
    }
}
