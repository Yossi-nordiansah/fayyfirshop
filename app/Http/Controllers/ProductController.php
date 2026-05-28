<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\StoreBranch;
use App\Models\Unit;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    /**
     * Display a listing of products.
     */
    public function index(): Response
    {
        $products = Product::query()
            ->with(['category', 'subCategory', 'variants.branchStocks', 'images'])
            ->latest('id')
            ->get();

        return Inertia::render('backoffice/menu/ProductManagement', [
            'products'     => $products,
            'status'       => session('status'),
            'statusAction' => session('statusAction'),
        ]);
    }

    /**
     * Show the form for creating a new product.
     */
    public function create(): Response
    {
        return Inertia::render('backoffice/menu/form/ProductForm', [
            'product'                 => null,
            'categories'              => ProductCategory::with('subCategories')->get(),
            'storeBranches'           => StoreBranch::where('is_active', 1)->get(),
            'units'                   => Unit::orderBy('name')->get(),
            'productNameTranslations' => ['indonesia' => '', 'english' => '', 'arabic' => ''],
            'productDescTranslations' => ['indonesia' => '', 'english' => '', 'arabic' => ''],
            'productVariants'         => [],
            'initialStocks'           => [],
            'productImages'           => [],
            'status'                  => session('status'),
            'statusAction'            => session('statusAction'),
        ]);
    }

    /**
     * Store a newly created product in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name_translations.indonesia' => 'required|string|max:255',
            'sku'                         => 'required|string|max:255|unique:products,sku',
            'price'                        => 'required|numeric|min:0',
            'product_category_id'         => 'required|exists:product_categories,id',
            'product_sub_category_id'     => 'nullable|exists:product_sub_categories,id',
            'images.*'                    => 'nullable|image|max:5120',
        ]);

        DB::transaction(function () use ($request) {
            $nameIndo = trim($request->name_translations['indonesia']);
            $hasVariants = $request->boolean('has_variants');

            // 1. Create primary Product record
            $product = Product::create([
                'title'                   => $nameIndo,
                'name_translations'       => $request->name_translations,
                'description'             => trim($request->description_translations['indonesia'] ?? ''),
                'description_translations'=> $request->description_translations,
                'sku'                     => trim($request->sku),
                'price'                   => $request->price,
                'stock'                   => 0,
                'product_category_id'     => $request->product_category_id,
                'product_sub_category_id' => $request->product_sub_category_id ?: null,
            ]);

            // 2. Upload product gallery images
            $primaryIdx = (int) $request->input('primary_image_index', 0);
            if ($request->hasFile('images')) {
                foreach ($request->file('images') as $idx => $imgFile) {
                    $path = $imgFile->store('products', 'public');
                    $product->images()->create([
                        'image_path' => $path,
                        'is_primary' => $idx === $primaryIdx,
                        'sort_order' => $idx,
                    ]);
                }
            }

            // 3. Handle stocks / variants
            if (!$hasVariants) {
                $totalStock = 0;
                foreach ((array) $request->branch_stocks as $bStock) {
                    $stockVal    = (int) ($bStock['stock'] ?? 0);
                    $totalStock += $stockVal;
                    $product->branchStocks()->create([
                        'store_branch_id' => $bStock['store_branch_id'],
                        'stock'           => $stockVal,
                        'reserved_stock'  => 0,
                        'is_available'    => $stockVal > 0,
                    ]);
                }
                $product->update(['stock' => $totalStock]);
            } else {
                $totalStock = 0;
                foreach ((array) $request->variants as $i => $varData) {
                    $varNameIndo  = trim($varData['name_translations']['indonesia'] ?? '');
                    $varImagePath = null;
                    $varImgFile   = $request->file("variants.{$i}.image");
                    if ($varImgFile) {
                        $varImagePath = $varImgFile->store('variants', 'public');
                    }

                    $variant = $product->variants()->create([
                        'type'             => $varData['type'] ?? null,
                        'name'             => $varNameIndo,
                        'name_translations'=> $varData['name_translations'],
                        'sku'              => trim($varData['sku']) ?: ($product->sku . '-' . strtoupper(str()->random(4))),
                        'price'            => $varData['price'] ?: $product->price,
                        'stock'            => 0,
                        'image'            => $varImagePath,
                        'unit_id'          => $varData['unit_id'] ?: null,
                    ]);

                    $varTotal = 0;
                    foreach ((array) ($varData['branch_stocks'] ?? []) as $bStock) {
                        $stockVal   = (int) ($bStock['stock'] ?? 0);
                        $varTotal  += $stockVal;
                        $variant->branchStocks()->create([
                            'store_branch_id' => $bStock['store_branch_id'],
                            'stock'           => $stockVal,
                            'reserved_stock'  => 0,
                            'is_available'    => $stockVal > 0,
                        ]);
                    }
                    $variant->update(['stock' => $varTotal]);
                    $totalStock += $varTotal;
                }
                $product->update(['stock' => $totalStock]);
            }
        });

        return redirect()
            ->route('backoffice.product-management')
            ->with('status', 'Produk berhasil ditambahkan.')
            ->with('statusAction', 'created');
    }

    /**
     * Show the form for editing the specified product.
     */
    public function edit(Product $product): Response
    {
        $product->load(['variants.branchStocks', 'branchStocks', 'images']);

        return Inertia::render('backoffice/menu/form/ProductForm', [
            'product'    => $product,
            'categories' => ProductCategory::with('subCategories')->get(),
            'storeBranches' => StoreBranch::where('is_active', 1)->get(),
            'units'      => Unit::orderBy('name')->get(),
            'productNameTranslations' => array_merge(
                ['indonesia' => '', 'english' => '', 'arabic' => ''],
                is_array($product->name_translations) ? $product->name_translations : []
            ),
            'productDescTranslations' => array_merge(
                ['indonesia' => '', 'english' => '', 'arabic' => ''],
                is_array($product->description_translations) ? $product->description_translations : []
            ),
            'productVariants' => $product->variants->map(fn ($v) => [
                'id'               => $v->id,
                'type'             => $v->type,
                'sku'              => $v->sku,
                'price'            => $v->price,
                'unit_id'          => $v->unit_id,
                'image'            => $v->image,
                'name_translations'=> array_merge(
                    ['indonesia' => '', 'english' => '', 'arabic' => ''],
                    is_array($v->name_translations) ? $v->name_translations : []
                ),
                'stocks' => $v->branchStocks,
            ]),
            'initialStocks'  => $product->branchStocks,
            'productImages'  => $product->images,
            'status'         => session('status'),
            'statusAction'   => session('statusAction'),
        ]);
    }

    /**
     * Update the specified product in storage.
     */
    public function update(Request $request, Product $product): RedirectResponse
    {
        $request->validate([
            'name_translations.indonesia' => 'required|string|max:255',
            'sku'                         => 'required|string|max:255|unique:products,sku,' . $product->id,
            'price'                        => 'required|numeric|min:0',
            'product_category_id'         => 'required|exists:product_categories,id',
            'product_sub_category_id'     => 'nullable|exists:product_sub_categories,id',
            'images.*'                    => 'nullable|image|max:5120',
        ]);

        DB::transaction(function () use ($request, $product) {
            $nameIndo    = trim($request->name_translations['indonesia']);
            $hasVariants = $request->boolean('has_variants');

            // 1. Update Product Details
            $product->update([
                'title'                   => $nameIndo,
                'name_translations'       => $request->name_translations,
                'description'             => trim($request->description_translations['indonesia'] ?? ''),
                'description_translations'=> $request->description_translations,
                'sku'                     => trim($request->sku),
                'price'                   => $request->price,
                'product_category_id'     => $request->product_category_id,
                'product_sub_category_id' => $request->product_sub_category_id ?: null,
            ]);

            // 2. Sync product gallery images
            $existingIds = array_map('intval', (array) $request->input('existing_image_ids', []));
            $primaryIdx  = (int) $request->input('primary_image_index', 0);
            $existingCount = count($existingIds);

            // Delete removed images from disk + DB
            $product->images()->whereNotIn('id', $existingIds)->each(function ($img) {
                Storage::disk('public')->delete($img->image_path);
                $img->delete();
            });

            // Update sort_order and is_primary for kept images
            foreach ($existingIds as $idx => $imageId) {
                $product->images()->where('id', $imageId)->update([
                    'is_primary' => $idx === $primaryIdx,
                    'sort_order' => $idx,
                ]);
            }

            // Upload new images
            if ($request->hasFile('images')) {
                foreach ($request->file('images') as $idx => $imgFile) {
                    $path   = $imgFile->store('products', 'public');
                    $newIdx = $existingCount + $idx;
                    $product->images()->create([
                        'image_path' => $path,
                        'is_primary' => $newIdx === $primaryIdx,
                        'sort_order' => $newIdx,
                    ]);
                }
            }

            // 3. Handle stocks / variants
            if (!$hasVariants) {
                $product->variants()->each(function ($v) {
                    if ($v->image) Storage::disk('public')->delete($v->image);
                });
                $product->variants()->delete();
                $product->branchStocks()->delete();
                $totalStock = 0;
                foreach ((array) $request->branch_stocks as $bStock) {
                    $stockVal    = (int) ($bStock['stock'] ?? 0);
                    $totalStock += $stockVal;
                    $product->branchStocks()->create([
                        'store_branch_id' => $bStock['store_branch_id'],
                        'stock'           => $stockVal,
                        'reserved_stock'  => 0,
                        'is_available'    => $stockVal > 0,
                    ]);
                }
                $product->update(['stock' => $totalStock]);
            } else {
                $product->branchStocks()->delete();
                $keepVariantIds = [];
                $totalStock = 0;

                foreach ((array) $request->variants as $i => $varData) {
                    $varNameIndo = trim($varData['name_translations']['indonesia'] ?? '');
                    $varId       = $varData['id'] ?? null;
                    $varImgFile  = $request->file("variants.{$i}.image");

                    if ($varId) {
                        $variant = $product->variants()->find($varId);
                        if ($variant) {
                            $updates = [
                                'type'             => $varData['type'] ?? $variant->type,
                                'name'             => $varNameIndo,
                                'name_translations'=> $varData['name_translations'],
                                'sku'              => trim($varData['sku']) ?: $variant->sku,
                                'price'            => $varData['price'] ?: $product->price,
                                'unit_id'          => $varData['unit_id'] ?: null,
                            ];
                            if ($varImgFile) {
                                if ($variant->image) Storage::disk('public')->delete($variant->image);
                                $updates['image'] = $varImgFile->store('variants', 'public');
                            }
                            $variant->update($updates);
                        }
                    } else {
                        $varImagePath = null;
                        if ($varImgFile) {
                            $varImagePath = $varImgFile->store('variants', 'public');
                        }
                        $variant = $product->variants()->create([
                            'type'             => $varData['type'] ?? null,
                            'name'             => $varNameIndo,
                            'name_translations'=> $varData['name_translations'],
                            'sku'              => trim($varData['sku']) ?: ($product->sku . '-' . strtoupper(str()->random(4))),
                            'price'            => $varData['price'] ?: $product->price,
                            'stock'            => 0,
                            'image'            => $varImagePath,
                            'unit_id'          => $varData['unit_id'] ?: null,
                        ]);
                    }

                    if ($variant) {
                        $keepVariantIds[] = $variant->id;
                        $variant->branchStocks()->delete();
                        $varTotal = 0;
                        foreach ((array) ($varData['branch_stocks'] ?? []) as $bStock) {
                            $stockVal   = (int) ($bStock['stock'] ?? 0);
                            $varTotal  += $stockVal;
                            $variant->branchStocks()->create([
                                'store_branch_id' => $bStock['store_branch_id'],
                                'stock'           => $stockVal,
                                'reserved_stock'  => 0,
                                'is_available'    => $stockVal > 0,
                            ]);
                        }
                        $variant->update(['stock' => $varTotal]);
                        $totalStock += $varTotal;
                    }
                }

                // Delete variants removed in frontend
                $product->variants()->whereNotIn('id', $keepVariantIds)->each(function ($v) {
                    if ($v->image) Storage::disk('public')->delete($v->image);
                    $v->delete();
                });
                $product->update(['stock' => $totalStock]);
            }
        });

        return redirect()
            ->route('backoffice.product-management')
            ->with('status', 'Produk berhasil diperbarui.')
            ->with('statusAction', 'updated');
    }

    /**
     * Remove the specified product from storage.
     */
    public function destroy(Product $product): RedirectResponse
    {
        // Delete all image files from storage
        foreach ($product->images as $img) {
            Storage::disk('public')->delete($img->image_path);
        }
        foreach ($product->variants as $v) {
            if ($v->image) Storage::disk('public')->delete($v->image);
        }

        $product->delete();

        return redirect()
            ->route('backoffice.product-management')
            ->with('status', 'Produk berhasil dihapus.')
            ->with('statusAction', 'deleted');
    }
}