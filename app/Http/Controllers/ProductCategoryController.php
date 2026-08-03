<?php

namespace App\Http\Controllers;

use App\Models\ProductCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ProductCategoryController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('backoffice/menu/ProductCategories', [
            'categories' => ProductCategory::query()
                ->with(['subCategories:id,product_category_id,name,name_translations'])
                ->withCount('subCategories')
                ->latest('id')
                ->get(),
            'status' => session('status'),
            'statusAction' => session('statusAction'),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('backoffice/menu/form/ProductCategoryForm', [
            'category' => null,
            'categoryNameTranslations' => [
                'indonesia' => '',
                'english' => '',
                'arabic' => '',
            ],
            'subCategories' => [],
            'status' => session('status'),
            'statusAction' => session('statusAction'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validateRequest($request);

        $bannerImagePath = null;
        if ($request->hasFile('banner_image_file')) {
            $path = $request->file('banner_image_file')->store('category-banners', 'public');
            $bannerImagePath = '/storage/' . $path;
        } elseif (!empty($request->banner_image_url)) {
            $bannerImagePath = $request->banner_image_url;
        }

        $category = ProductCategory::create([
            'name' => $validated['name'],
            'name_translations' => $validated['name_translations'],
            'banner_image' => $bannerImagePath,
        ]);

        $this->syncSubCategories($category, $validated['sub_categories']);

        return redirect()
            ->route('backoffice.product-categories.edit', $category->slug)
            ->with('status', 'Category created successfully.')
            ->with('statusAction', 'created');
    }

    public function show(ProductCategory $productCategory): Response
    {
        $productCategory->load('subCategories');

        return Inertia::render('backoffice/menu/ProductCategoryShow', [
            'category' => $productCategory,
        ]);
    }

    public function edit(ProductCategory $productCategory): Response
    {
        $productCategory->load('subCategories');

        return Inertia::render('backoffice/menu/form/ProductCategoryForm', [
            'category' => $productCategory,
            'categoryNameTranslations' => array_merge(
                ['indonesia' => '', 'english' => '', 'arabic' => ''],
                is_array($productCategory->name_translations) ? $productCategory->name_translations : [],
            ),
            'subCategories' => $productCategory->subCategories
                ->map(function ($sub) {
                    return array_merge(
                        ['indonesia' => '', 'english' => '', 'arabic' => ''],
                        is_array($sub->name_translations) ? $sub->name_translations : [],
                    );
                })
                ->values()
                ->all(),
            'status' => session('status'),
            'statusAction' => session('statusAction'),
        ]);
    }

    public function update(Request $request, ProductCategory $productCategory): RedirectResponse
    {
        $validated = $this->validateRequest($request, $productCategory->id);

        $bannerImagePath = $productCategory->banner_image;

        if ($request->boolean('remove_banner_image')) {
            if ($bannerImagePath && str_starts_with($bannerImagePath, '/storage/')) {
                $storagePath = str_replace('/storage/', '', $bannerImagePath);
                Storage::disk('public')->delete($storagePath);
            }
            $bannerImagePath = null;
        } elseif ($request->hasFile('banner_image_file')) {
            if ($bannerImagePath && str_starts_with($bannerImagePath, '/storage/')) {
                $storagePath = str_replace('/storage/', '', $bannerImagePath);
                Storage::disk('public')->delete($storagePath);
            }
            $path = $request->file('banner_image_file')->store('category-banners', 'public');
            $bannerImagePath = '/storage/' . $path;
        } elseif (!empty($request->banner_image_url)) {
            $bannerImagePath = $request->banner_image_url;
        }

        $productCategory->update([
            'name' => $validated['name'],
            'name_translations' => $validated['name_translations'],
            'banner_image' => $bannerImagePath,
        ]);

        $this->syncSubCategories($productCategory, $validated['sub_categories']);

        return redirect()
            ->route('backoffice.product-categories.edit', $productCategory->slug)
            ->with('status', 'Category updated successfully.')
            ->with('statusAction', 'updated');
    }

    public function destroy(ProductCategory $productCategory): RedirectResponse
    {
        if ($productCategory->banner_image && str_starts_with($productCategory->banner_image, '/storage/')) {
            $storagePath = str_replace('/storage/', '', $productCategory->banner_image);
            Storage::disk('public')->delete($storagePath);
        }

        $productCategory->delete();

        return redirect()
            ->route('backoffice.product-categories.index')
            ->with('status', 'Category deleted successfully.')
            ->with('statusAction', 'deleted');
    }

    /**
     * Toggle the active status of a category.
     */
    public function toggleActive(ProductCategory $productCategory): RedirectResponse
    {
        $productCategory->update([
            'is_active' => !$productCategory->is_active,
        ]);

        $statusMessage = $productCategory->is_active
            ? "Kategori \"{$productCategory->name}\" berhasil diaktifkan."
            : "Kategori \"{$productCategory->name}\" berhasil dinonaktifkan.";

        return redirect()
            ->back()
            ->with('status', $statusMessage)
            ->with('statusAction', 'updated');
    }

    /**
     * @return array{name: string, name_translations: array{indonesia?: string, english?: string, arabic?: string}, sub_categories: array<int, array{indonesia?: string, english?: string, arabic?: string}>}
     */
    protected function validateRequest(Request $request, ?int $ignoreId = null): array
    {
        $validated = $request->validate([
            'name_translations' => ['required', 'array'],
            'name_translations.indonesia' => ['required', 'string', 'max:255'],
            'name_translations.english' => ['nullable', 'string', 'max:255'],
            'name_translations.arabic' => ['nullable', 'string', 'max:255'],
            'sub_categories' => ['nullable', 'array'],
            'sub_categories.*' => ['nullable', 'array'],
            'sub_categories.*.indonesia' => ['nullable', 'string', 'max:255'],
            'sub_categories.*.english' => ['nullable', 'string', 'max:255'],
            'sub_categories.*.arabic' => ['nullable', 'string', 'max:255'],
            'banner_image_file' => ['nullable', 'file', 'mimes:jpeg,png,jpg,webp,gif,svg', 'max:5120'],
            'banner_image_url' => ['nullable', 'string'],
            'remove_banner_image' => ['nullable', 'boolean'],
        ]);

        $nameTranslations = [
            'indonesia' => trim((string) ($validated['name_translations']['indonesia'] ?? '')),
            'english' => trim((string) ($validated['name_translations']['english'] ?? '')),
            'arabic' => trim((string) ($validated['name_translations']['arabic'] ?? '')),
        ];

        $canonicalName = $nameTranslations['indonesia']
            ?: ($nameTranslations['english'] ?: $nameTranslations['arabic']);

        if (! $canonicalName) {
            $canonicalName = trim((string) ($validated['name_translations']['indonesia'] ?? ''));
        }

        // NOTE: we keep `name` as canonical (for legacy queries / uniqueness),
        // and store all languages in `name_translations` (best-practice scalable approach).
        $subCategories = collect($validated['sub_categories'] ?? [])
            ->map(function ($row) {
                $row = is_array($row) ? $row : [];
                return [
                    'indonesia' => trim((string) ($row['indonesia'] ?? '')),
                    'english' => trim((string) ($row['english'] ?? '')),
                    'arabic' => trim((string) ($row['arabic'] ?? '')),
                ];
            })
            ->filter(function ($row) {
                return ($row['indonesia'] ?? '') !== ''
                    || ($row['english'] ?? '') !== ''
                    || ($row['arabic'] ?? '') !== '';
            })
            ->unique(function ($row) {
                return strtolower(($row['indonesia'] ?? '').'|'.($row['english'] ?? '').'|'.($row['arabic'] ?? ''));
            })
            ->values()
            ->all();

        return [
            'name' => $canonicalName,
            'name_translations' => $nameTranslations,
            'sub_categories' => $subCategories,
        ];
    }

    /**
     * @param  array<int, array{indonesia?: string, english?: string, arabic?: string}>  $subCategoryNames
     */
    protected function syncSubCategories(ProductCategory $category, array $subCategoryNames): void
    {
        $category->subCategories()->delete();

        foreach ($subCategoryNames as $row) {
            $row = is_array($row) ? $row : [];
            $translations = [
                'indonesia' => trim((string) ($row['indonesia'] ?? '')),
                'english' => trim((string) ($row['english'] ?? '')),
                'arabic' => trim((string) ($row['arabic'] ?? '')),
            ];

            $canonicalName = $translations['indonesia']
                ?: ($translations['english'] ?: $translations['arabic']);

            if (! $canonicalName) {
                continue;
            }

            $category->subCategories()->create([
                'name' => $canonicalName,
                'name_translations' => $translations,
            ]);
        }
    }
}
