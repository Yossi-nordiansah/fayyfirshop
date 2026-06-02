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
        $request->merge($this->cleanNullStrings($request->all()));

        $nameTranslations = $request->input('name_translations', []);
        $hasName = !empty(trim($nameTranslations['indonesia'] ?? '')) ||
                   !empty(trim($nameTranslations['english'] ?? '')) ||
                   !empty(trim($nameTranslations['arabic'] ?? ''));

        if (!$hasName) {
            return back()->withErrors([
                'name_translations.indonesia' => 'Nama produk wajib diisi pada salah satu bahasa (Indonesia, English, atau Arab).'
            ])->withInput();
        }

        $request->validate([
            'name_translations.indonesia' => 'nullable|string|max:255',
            'name_translations.english'   => 'nullable|string|max:255',
            'name_translations.arabic'    => 'nullable|string|max:255',
            'sku'                         => 'required|string|max:255|unique:products,sku',
            'price'                       => $request->boolean('has_variants') ? 'nullable|numeric|min:0' : 'required|numeric|min:0',
            'product_category_id'         => 'required|exists:product_categories,id',
            'product_sub_category_id'     => 'nullable|exists:product_sub_categories,id',
            'is_new'                      => 'nullable|boolean',
            'is_best_seller'              => 'nullable|boolean',
            'images.*'                    => 'nullable|image|max:5120',
            'variants.*.sku'              => 'nullable|string|max:255|distinct|unique:products,sku|unique:product_variants,sku',
            'variants.*.name'             => 'required|string|max:255',
            'variants.*.image'            => 'nullable|image|max:5120',
        ], [
            'sku.unique'                  => 'SKU produk sudah digunakan.',
            'variants.*.sku.unique'       => 'SKU varian sudah digunakan.',
            'variants.*.sku.distinct'     => 'SKU varian tidak boleh sama dengan varian lainnya.',
            'variants.*.name.required'    => 'Nama varian/sub-varian wajib diisi.',
            'variants.*.image.image'      => 'Berkas harus berupa gambar.',
            'variants.*.image.max'        => 'Ukuran gambar varian tidak boleh lebih dari 5MB.',
        ]);

        DB::transaction(function () use ($request) {
            $nameTranslations = $request->input('name_translations', []);
            $descTranslations = $request->input('description_translations', []);

            $primaryTitle = trim($nameTranslations['indonesia'] ?? '')
                ?: (trim($nameTranslations['english'] ?? '')
                ?: trim($nameTranslations['arabic'] ?? ''));

            $primaryDescription = trim($descTranslations['indonesia'] ?? '')
                ?: (trim($descTranslations['english'] ?? '')
                ?: trim($descTranslations['arabic'] ?? ''));

            $hasVariants = $request->boolean('has_variants');
            $price = $request->price;

            if ($hasVariants && ($price === null || $price === '')) {
                $minPrice = null;
                foreach ((array) $request->variants as $varData) {
                    $vPrice = $varData['price'];
                    if ($vPrice !== null && $vPrice !== '') {
                        $vPriceVal = (float) $vPrice;
                        if ($minPrice === null || $vPriceVal < $minPrice) {
                            $minPrice = $vPriceVal;
                        }
                    }
                }
                $price = $minPrice ?? 0;
            }

            // 1. Create primary Product record
            $product = Product::create([
                'title'                   => $primaryTitle,
                'name_translations'       => $request->name_translations,
                'description'             => $primaryDescription,
                'description_translations'=> $request->description_translations,
                'sku'                     => trim($request->sku),
                'price'                   => $price,
                'stock'                   => 0,
                'product_category_id'     => $request->product_category_id,
                'product_sub_category_id' => $request->product_sub_category_id ?: null,
                'is_new'                  => $request->boolean('is_new'),
                'is_best_seller'          => $request->boolean('is_best_seller'),
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
                $usedSkus = [];
                foreach ((array) $request->variants as $i => $varData) {
                    $varName = trim($varData['name_translations']['indonesia'] ?? '')
                        ?: (trim($varData['name_translations']['english'] ?? '')
                        ?: trim($varData['name_translations']['arabic'] ?? ''));
                    $varImagePath = null;
                    $varImgFile   = $request->file("variants.{$i}.image");
                    if ($varImgFile) {
                        $varImagePath = $varImgFile->store('variants', 'public');
                    }

                    $varSku = trim($varData['sku'] ?? '');
                    if (!$varSku) {
                        do {
                            $varSku = $product->sku . '-' . strtoupper(str()->random(4));
                        } while (
                            in_array($varSku, $usedSkus) ||
                            \App\Models\Product::where('sku', $varSku)->exists() ||
                            \App\Models\ProductVariant::where('sku', $varSku)->exists()
                        );
                    }
                    $usedSkus[] = $varSku;

                    $variant = $product->variants()->create([
                        'type'             => $varData['type'] ?? null,
                        'type_translations'=> $varData['type_translations'] ?? null,
                        'name'             => $varName,
                        'name_translations'=> $varData['name_translations'],
                        'sku'              => $varSku,
                        'price'            => ($varData['price'] === null || $varData['price'] === '') ? $product->price : $varData['price'],
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
     * Display the specified product.
     */
    public function show(Product $product): Response
    {
        $product->load([
            'category',
            'subCategory',
            'variants.branchStocks',
            'branchStocks',
            'images'
        ]);

        return Inertia::render('backoffice/menu/ProductDetail', [
            'product'       => $product,
            'storeBranches' => StoreBranch::where('is_active', 1)->get(),
            'units'         => Unit::orderBy('name')->get(),
        ]);
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
                'type_translations'=> array_merge(
                    ['indonesia' => $v->type, 'english' => $v->type, 'arabic' => $v->type],
                    is_array($v->type_translations) ? $v->type_translations : []
                ),
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
        $request->merge($this->cleanNullStrings($request->all()));

        $nameTranslations = $request->input('name_translations', []);
        $hasName = !empty(trim($nameTranslations['indonesia'] ?? '')) ||
                   !empty(trim($nameTranslations['english'] ?? '')) ||
                   !empty(trim($nameTranslations['arabic'] ?? ''));

        if (!$hasName) {
            return back()->withErrors([
                'name_translations.indonesia' => 'Nama produk wajib diisi pada salah satu bahasa (Indonesia, English, atau Arab).'
            ])->withInput();
        }

        $rules = [
            'name_translations.indonesia' => 'nullable|string|max:255',
            'name_translations.english'   => 'nullable|string|max:255',
            'name_translations.arabic'    => 'nullable|string|max:255',
            'sku'                         => 'required|string|max:255|unique:products,sku,' . $product->id,
            'price'                       => $request->boolean('has_variants') ? 'nullable|numeric|min:0' : 'required|numeric|min:0',
            'product_category_id'         => 'required|exists:product_categories,id',
            'product_sub_category_id'     => 'nullable|exists:product_sub_categories,id',
            'is_new'                      => 'nullable|boolean',
            'is_best_seller'              => 'nullable|boolean',
            'images.*'                    => 'nullable|image|max:5120',
        ];

        if ($request->has('variants')) {
            foreach ($request->input('variants') as $index => $varData) {
                $varId = $varData['id'] ?? null;
                $rules["variants.{$index}.sku"] = [
                    'nullable',
                    'string',
                    'max:255',
                    'distinct',
                    'unique:products,sku',
                    $varId ? "unique:product_variants,sku,{$varId}" : 'unique:product_variants,sku',
                ];
                $rules["variants.{$index}.name"] = 'required|string|max:255';
                $rules["variants.{$index}.image"] = 'nullable|image|max:5120';
            }
        }

        $request->validate($rules, [
            'sku.unique'                  => 'SKU produk sudah digunakan.',
            'variants.*.sku.unique'       => 'SKU varian sudah digunakan.',
            'variants.*.sku.distinct'     => 'SKU varian tidak boleh sama dengan varian lainnya.',
            'variants.*.name.required'    => 'Nama varian/sub-varian wajib diisi.',
            'variants.*.image.image'      => 'Berkas harus berupa gambar.',
            'variants.*.image.max'        => 'Ukuran gambar varian tidak boleh lebih dari 5MB.',
        ]);

        DB::transaction(function () use ($request, $product) {
            $nameTranslations = $request->input('name_translations', []);
            $descTranslations = $request->input('description_translations', []);

            $primaryTitle = trim($nameTranslations['indonesia'] ?? '')
                ?: (trim($nameTranslations['english'] ?? '')
                ?: trim($nameTranslations['arabic'] ?? ''));

            $primaryDescription = trim($descTranslations['indonesia'] ?? '')
                ?: (trim($descTranslations['english'] ?? '')
                ?: trim($descTranslations['arabic'] ?? ''));

            $hasVariants = $request->boolean('has_variants');
            $price = $request->price;

            if ($hasVariants && ($price === null || $price === '')) {
                $minPrice = null;
                foreach ((array) $request->variants as $varData) {
                    $vPrice = $varData['price'];
                    if ($vPrice !== null && $vPrice !== '') {
                        $vPriceVal = (float) $vPrice;
                        if ($minPrice === null || $vPriceVal < $minPrice) {
                            $minPrice = $vPriceVal;
                        }
                    }
                }
                $price = $minPrice ?? 0;
            }

            // 1. Update Product Details
            $product->update([
                'title'                   => $primaryTitle,
                'name_translations'       => $request->name_translations,
                'description'             => $primaryDescription,
                'description_translations'=> $request->description_translations,
                'sku'                     => trim($request->sku),
                'price'                   => $price,
                'product_category_id'     => $request->product_category_id,
                'product_sub_category_id' => $request->product_sub_category_id ?: null,
                'is_new'                  => $request->boolean('is_new'),
                'is_best_seller'          => $request->boolean('is_best_seller'),
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
                $usedSkus = [];

                foreach ((array) $request->variants as $i => $varData) {
                    $varName = trim($varData['name_translations']['indonesia'] ?? '')
                        ?: (trim($varData['name_translations']['english'] ?? '')
                        ?: trim($varData['name_translations']['arabic'] ?? ''));
                    $varId       = $varData['id'] ?? null;
                    $varImgFile  = $request->file("variants.{$i}.image");

                    if ($varId) {
                        $variant = $product->variants()->find($varId);
                        if ($variant) {
                            $varSku = trim($varData['sku'] ?? '') ?: $variant->sku;
                            $updates = [
                                'type'             => $varData['type'] ?? $variant->type,
                                'type_translations'=> $varData['type_translations'] ?? null,
                                'name'             => $varName,
                                'name_translations'=> $varData['name_translations'],
                                'sku'              => $varSku,
                                'price'            => ($varData['price'] === null || $varData['price'] === '') ? $product->price : $varData['price'],
                                'unit_id'          => $varData['unit_id'] ?: null,
                            ];
                            if ($varData['image_deleted'] ?? false) {
                                if ($variant->image) Storage::disk('public')->delete($variant->image);
                                $updates['image'] = null;
                            } elseif ($varImgFile) {
                                if ($variant->image) Storage::disk('public')->delete($variant->image);
                                $updates['image'] = $varImgFile->store('variants', 'public');
                            }
                            $variant->update($updates);
                            $usedSkus[] = $varSku;
                        }
                    } else {
                        $varImagePath = null;
                        if ($varImgFile) {
                            $varImagePath = $varImgFile->store('variants', 'public');
                        }

                        $varSku = trim($varData['sku'] ?? '');
                        if (!$varSku) {
                            do {
                                $varSku = $product->sku . '-' . strtoupper(str()->random(4));
                            } while (
                                in_array($varSku, $usedSkus) ||
                                \App\Models\Product::where('sku', $varSku)->exists() ||
                                \App\Models\ProductVariant::where('sku', $varSku)->exists()
                            );
                        }
                        $usedSkus[] = $varSku;

                        $variant = $product->variants()->create([
                            'type'             => $varData['type'] ?? null,
                            'type_translations'=> $varData['type_translations'] ?? null,
                            'name'             => $varName,
                            'name_translations'=> $varData['name_translations'],
                            'sku'              => $varSku,
                            'price'            => ($varData['price'] === null || $varData['price'] === '') ? $product->price : $varData['price'],
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

    /**
     * Recursively convert "null" and "undefined" strings to actual null values.
     */
    private function cleanNullStrings($data)
    {
        if (is_array($data)) {
            foreach ($data as $key => $value) {
                $data[$key] = $this->cleanNullStrings($value);
            }
            return $data;
        }

        if (is_string($data)) {
            $trimmed = trim($data);
            if ($trimmed === 'null' || $trimmed === 'undefined') {
                return null;
            }
        }

        return $data;
    }
}