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

        $rules = [
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
            'stock_type'                  => 'nullable|in:variant,parent',
            'unit'                        => 'nullable|string|max:50',
            'weight'                      => 'nullable|integer|min:0',
            'capacity'                    => 'nullable|integer|min:1',
        ];

        if ($request->has('variants')) {
            foreach ($request->input('variants') as $i => $varData) {
                $hasSub = filter_var($varData['has_sub_variants'] ?? false, FILTER_VALIDATE_BOOLEAN);
                if (!$hasSub) {
                    $rules["variants.{$i}.sku"] = 'nullable|string|max:255|distinct|unique:products,sku|unique:product_variants,sku';
                    $rules["variants.{$i}.name"] = 'required|string|max:255';
                    $rules["variants.{$i}.image"] = 'nullable|image|max:5120';
                    $rules["variants.{$i}.weight"] = 'nullable|integer|min:0';
                } else {
                    $rules["variants.{$i}.name"] = 'required|string|max:255';
                    $rules["variants.{$i}.image"] = 'nullable|image|max:5120';
                    if (isset($varData['sub_variants'])) {
                        foreach ($varData['sub_variants'] as $j => $subVarData) {
                            $rules["variants.{$i}.sub_variants.{$j}.sku"] = 'nullable|string|max:255|distinct|unique:products,sku|unique:product_variants,sku';
                            $rules["variants.{$i}.sub_variants.{$j}.name"] = 'required|string|max:255';
                            $rules["variants.{$i}.sub_variants.{$j}.image"] = 'nullable|image|max:5120';
                            $rules["variants.{$i}.sub_variants.{$j}.weight"] = 'nullable|integer|min:0';
                        }
                    }
                }
            }
        }

        $request->validate($rules, [
            'sku.unique'                  => 'SKU produk sudah digunakan.',
            'variants.*.sku.unique'       => 'SKU varian sudah digunakan.',
            'variants.*.sku.distinct'     => 'SKU varian tidak boleh sama dengan varian lainnya.',
            'variants.*.name.required'    => 'Nama varian wajib diisi.',
            'variants.*.image.image'      => 'Berkas harus berupa gambar.',
            'variants.*.image.max'        => 'Ukuran gambar varian tidak boleh lebih dari 5MB.',
            'variants.*.sub_variants.*.sku.unique'   => 'SKU sub-varian sudah digunakan.',
            'variants.*.sub_variants.*.sku.distinct' => 'SKU sub-varian tidak boleh sama.',
            'variants.*.sub_variants.*.name.required' => 'Nama sub-varian wajib diisi.',
            'variants.*.sub_variants.*.image.image'   => 'Berkas harus berupa gambar.',
            'variants.*.sub_variants.*.image.max'     => 'Ukuran gambar sub-varian tidak boleh lebih dari 5MB.',
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
                    $hasSub = filter_var($varData['has_sub_variants'] ?? false, FILTER_VALIDATE_BOOLEAN);
                    if ($hasSub && isset($varData['sub_variants'])) {
                        foreach ((array) $varData['sub_variants'] as $subVarData) {
                            $subPrice = $subVarData['price'];
                            if ($subPrice !== null && $subPrice !== '') {
                                $subPriceVal = (float) $subPrice;
                                if ($minPrice === null || $subPriceVal < $minPrice) {
                                    $minPrice = $subPriceVal;
                                }
                            }
                        }
                    } else {
                        $vPrice = $varData['price'];
                        if ($vPrice !== null && $vPrice !== '') {
                            $vPriceVal = (float) $vPrice;
                            if ($minPrice === null || $vPriceVal < $minPrice) {
                                $minPrice = $vPriceVal;
                            }
                        }
                    }
                }
                $price = $minPrice ?? 0;
            }

            $hasVariants = $request->boolean('has_variants');
            $unit = $request->input('unit');
            $capacity = 1;
            if (!$hasVariants && $unit && !in_array(strtolower($unit), ['pcs', 'pack', 'box'])) {
                $capacity = (int) $request->input('capacity', 1);
                if ($capacity < 1) {
                    $capacity = 1;
                }
            }

            // 1. Create primary Product record
            $product = Product::create([
                'title'                   => $primaryTitle,
                'name_translations'       => $request->name_translations,
                'description'             => $primaryDescription,
                'description_translations' => $request->description_translations,
                'sku'                     => trim($request->sku),
                'price'                   => $price,
                'stock'                   => 0,
                'product_category_id'     => $request->product_category_id,
                'product_sub_category_id' => $request->product_sub_category_id ?: null,
                'is_new'                  => $request->boolean('is_new'),
                'is_best_seller'          => $request->boolean('is_best_seller'),
                'stock_type'              => $request->input('stock_type', 'variant'),
                'unit'                    => $request->input('unit'),
                'weight'                  => $request->input('weight', 0),
                'capacity'                => $capacity,
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
            $productStockType = $request->input('stock_type', 'variant');
            if ($productStockType === 'parent' || !$hasVariants) {
                $totalStock = 0;
                foreach ((array) $request->branch_stocks as $bStock) {
                    $stockVal    = (int) ($bStock['stock'] ?? 0);
                    $totalStock += $stockVal;
                    $product->branchStocks()->create([
                        'store_branch_id' => $bStock['store_branch_id'],
                        'stock'           => $stockVal,
                        'reserved_stock'  => 0,
                        'low_stock_threshold' => (int) ($bStock['low_stock_threshold'] ?? 5),
                        'is_available'    => $stockVal > 0,
                    ]);
                }
                $product->update(['stock' => $totalStock]);
            }

            if ($hasVariants) {
                $totalStock = 0;
                $usedSkus = [];

                foreach ((array) $request->variants as $i => $varData) {
                    $hasSub = filter_var($varData['has_sub_variants'] ?? false, FILTER_VALIDATE_BOOLEAN);

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
                            $suffix = $hasSub ? 'PARENT-' . strtoupper(str()->random(4)) : strtoupper(str()->random(4));
                            $varSku = $product->sku . '-' . $suffix;
                        } while (
                            in_array($varSku, $usedSkus) ||
                            \App\Models\Product::where('sku', $varSku)->exists() ||
                            \App\Models\ProductVariant::where('sku', $varSku)->exists()
                        );
                    }
                    $usedSkus[] = $varSku;

                    $varPrice = ($varData['price'] === null || $varData['price'] === '') ? $product->price : $varData['price'];
                    $varStockType = $varData['stock_type'] ?? 'variant';
                    $varUnit = $varData['unit'] ?? null;
                    if (is_array($varUnit)) {
                        $varUnit = $varUnit['name'] ?? ($varUnit['indonesia'] ?? null);
                    }
                    $varUnitId = $varData['unit_id'] ?: null;

                    // Sanitization based on stock_type mode
                    if ($productStockType === 'parent') {
                        $varStockType = 'variant';
                        $varUnit = null;
                        if ($hasSub) {
                            $varUnitId = null;
                        }
                    } else {
                        if ($hasSub) {
                            $varUnitId = null;
                            if ($varStockType !== 'parent') {
                                $varUnit = null;
                            }
                        }
                    }

                    $parentVariant = $product->variants()->create([
                        'parent_id'        => null,
                        'type'             => $varData['type'] ?? null,
                        'type_translations' => $varData['type_translations'] ?? null,
                        'name'             => $varName,
                        'name_translations' => $varData['name_translations'],
                        'sku'              => $varSku,
                        'price'            => $varPrice,
                        'weight'           => $varData['weight'] ?? 0,
                        'stock'            => 0,
                        'image'            => $varImagePath,
                        'unit_id'          => $varUnitId,
                        'stock_type'       => $varStockType,
                        'unit'             => $varUnit,
                    ]);

                    if ($hasSub && isset($varData['sub_variants'])) {
                        $parentVarStockTotal = 0;
                        if ($productStockType !== 'parent' && $varStockType === 'parent') {
                            foreach ((array) ($varData['branch_stocks'] ?? []) as $bStock) {
                                $stockVal = (int) ($bStock['stock'] ?? 0);
                                $parentVarStockTotal += $stockVal;
                                $parentVariant->branchStocks()->create([
                                    'store_branch_id' => $bStock['store_branch_id'],
                                    'stock'           => $stockVal,
                                    'reserved_stock'  => 0,
                                    'low_stock_threshold' => (int) ($bStock['low_stock_threshold'] ?? 5),
                                    'is_available'    => $stockVal > 0,
                                ]);
                            }
                            $parentVariant->update(['stock' => $parentVarStockTotal]);
                            $totalStock += $parentVarStockTotal;
                        }

                        foreach ($varData['sub_variants'] as $j => $subVarData) {
                            $subName = trim($subVarData['name_translations']['indonesia'] ?? '')
                                ?: (trim($subVarData['name_translations']['english'] ?? '')
                                    ?: trim($subVarData['name_translations']['arabic'] ?? ''));

                            $subImagePath = null;
                            $subImgFile   = $request->file("variants.{$i}.sub_variants.{$j}.image");
                            if ($subImgFile) {
                                $subImagePath = $subImgFile->store('variants', 'public');
                            }

                            $subSku = trim($subVarData['sku'] ?? '');
                            if (!$subSku) {
                                do {
                                    $subSku = $product->sku . '-' . strtoupper(str()->random(4));
                                } while (
                                    in_array($subSku, $usedSkus) ||
                                    \App\Models\Product::where('sku', $subSku)->exists() ||
                                    \App\Models\ProductVariant::where('sku', $subSku)->exists()
                                );
                            }
                            $usedSkus[] = $subSku;

                            $subPrice = ($subVarData['price'] === null || $subVarData['price'] === '') ? $product->price : $subVarData['price'];

                            $childVariant = $product->variants()->create([
                                'parent_id'        => $parentVariant->id,
                                'type'             => $subVarData['type'] ?? null,
                                'type_translations' => $subVarData['type_translations'] ?? null,
                                'name'             => $subName,
                                'name_translations' => $subVarData['name_translations'],
                                'sku'              => $subSku,
                                'price'            => $subPrice,
                                'weight'           => $subVarData['weight'] ?? 0,
                                'stock'            => 0,
                                'image'            => $subImagePath,
                                'unit_id'          => ($varStockType === 'parent') ? null : ($subVarData['unit_id'] ?: null),
                                'stock_type'       => 'variant',
                                'unit'             => null,
                            ]);

                            if ($productStockType !== 'parent' && $varStockType !== 'parent') {
                                $childStockTotal = 0;
                                foreach ((array) ($subVarData['branch_stocks'] ?? []) as $bStock) {
                                    $stockVal = (int) ($bStock['stock'] ?? 0);
                                    $childStockTotal += $stockVal;
                                    $childVariant->branchStocks()->create([
                                        'store_branch_id' => $bStock['store_branch_id'],
                                        'stock'           => $stockVal,
                                        'reserved_stock'  => 0,
                                        'low_stock_threshold' => (int) ($bStock['low_stock_threshold'] ?? 5),
                                        'is_available'    => $stockVal > 0,
                                    ]);
                                }
                                $childVariant->update(['stock' => $childStockTotal]);
                                $totalStock += $childStockTotal;
                            }
                        }
                    } else {
                        if ($productStockType !== 'parent') {
                            $varStockTotal = 0;
                            foreach ((array) ($varData['branch_stocks'] ?? []) as $bStock) {
                                $stockVal = (int) ($bStock['stock'] ?? 0);
                                $varStockTotal += $stockVal;
                                $parentVariant->branchStocks()->create([
                                    'store_branch_id' => $bStock['store_branch_id'],
                                    'stock'           => $stockVal,
                                    'reserved_stock'  => 0,
                                    'low_stock_threshold' => (int) ($bStock['low_stock_threshold'] ?? 5),
                                    'is_available'    => $stockVal > 0,
                                ]);
                            }
                            $parentVariant->update(['stock' => $varStockTotal]);
                            $totalStock += $varStockTotal;
                        }
                    }
                }

                if ($productStockType !== 'parent') {
                    $product->update(['stock' => $totalStock]);
                }
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
            'productVariants' => $product->variants->map(fn($v) => [
                'id'               => $v->id,
                'parent_id'        => $v->parent_id,
                'type'             => $v->type,
                'type_translations' => array_merge(
                    ['indonesia' => $v->type, 'english' => $v->type, 'arabic' => $v->type],
                    is_array($v->type_translations) ? $v->type_translations : []
                ),
                'sku'              => $v->sku,
                'price'            => $v->price,
                'unit_id'          => $v->unit_id,
                'weight'           => $v->weight,
                'image'            => $v->image,
                'name_translations' => array_merge(
                    ['indonesia' => '', 'english' => '', 'arabic' => ''],
                    is_array($v->name_translations) ? $v->name_translations : []
                ),
                'stock_type'       => $v->stock_type,
                'unit'             => $v->unit,
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
            'stock_type'                  => 'nullable|in:variant,parent',
            'unit'                        => 'nullable|string|max:50',
            'weight'                      => 'nullable|integer|min:0',
            'capacity'                    => 'nullable|integer|min:1',
        ];

        if ($request->has('variants')) {
            foreach ($request->input('variants') as $i => $varData) {
                $hasSub = filter_var($varData['has_sub_variants'] ?? false, FILTER_VALIDATE_BOOLEAN);
                $varId = $varData['id'] ?? null;

                if (!$hasSub) {
                    $rules["variants.{$i}.sku"] = [
                        'nullable',
                        'string',
                        'max:255',
                        'distinct',
                        'unique:products,sku',
                        $varId ? "unique:product_variants,sku,{$varId}" : "unique:product_variants,sku"
                    ];
                    $rules["variants.{$i}.name"] = 'required|string|max:255';
                    $rules["variants.{$i}.image"] = 'nullable|image|max:5120';
                    $rules["variants.{$i}.weight"] = 'nullable|integer|min:0';
                } else {
                    $rules["variants.{$i}.name"] = 'required|string|max:255';
                    $rules["variants.{$i}.image"] = 'nullable|image|max:5120';
                    if (isset($varData['sub_variants'])) {
                        foreach ($varData['sub_variants'] as $j => $subVarData) {
                            $subVarId = $subVarData['id'] ?? null;
                            $rules["variants.{$i}.sub_variants.{$j}.sku"] = [
                                'nullable',
                                'string',
                                'max:255',
                                'distinct',
                                'unique:products,sku',
                                $subVarId ? "unique:product_variants,sku,{$subVarId}" : "unique:product_variants,sku"
                            ];
                            $rules["variants.{$i}.sub_variants.{$j}.name"] = 'required|string|max:255';
                            $rules["variants.{$i}.sub_variants.{$j}.image"] = 'nullable|image|max:5120';
                            $rules["variants.{$i}.sub_variants.{$j}.weight"] = 'nullable|integer|min:0';
                        }
                    }
                }
            }
        }

        $request->validate($rules, [
            'sku.unique'                  => 'SKU produk sudah digunakan.',
            'variants.*.sku.unique'       => 'SKU varian sudah digunakan.',
            'variants.*.sku.distinct'     => 'SKU varian tidak boleh sama dengan varian lainnya.',
            'variants.*.name.required'    => 'Nama varian wajib diisi.',
            'variants.*.image.image'      => 'Berkas harus berupa gambar.',
            'variants.*.image.max'        => 'Ukuran gambar varian tidak boleh lebih dari 5MB.',
            'variants.*.sub_variants.*.sku.unique'   => 'SKU sub-varian sudah digunakan.',
            'variants.*.sub_variants.*.sku.distinct' => 'SKU sub-varian tidak boleh sama.',
            'variants.*.sub_variants.*.name.required' => 'Nama sub-varian wajib diisi.',
            'variants.*.sub_variants.*.image.image'   => 'Berkas harus berupa gambar.',
            'variants.*.sub_variants.*.image.max'     => 'Ukuran gambar sub-varian tidak boleh lebih dari 5MB.',
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
                    $hasSub = filter_var($varData['has_sub_variants'] ?? false, FILTER_VALIDATE_BOOLEAN);
                    if ($hasSub && isset($varData['sub_variants'])) {
                        foreach ((array) $varData['sub_variants'] as $subVarData) {
                            $subPrice = $subVarData['price'];
                            if ($subPrice !== null && $subPrice !== '') {
                                $subPriceVal = (float) $subPrice;
                                if ($minPrice === null || $subPriceVal < $minPrice) {
                                    $minPrice = $subPriceVal;
                                }
                            }
                        }
                    } else {
                        $vPrice = $varData['price'];
                        if ($vPrice !== null && $vPrice !== '') {
                            $vPriceVal = (float) $vPrice;
                            if ($minPrice === null || $vPriceVal < $minPrice) {
                                $minPrice = $vPriceVal;
                            }
                        }
                    }
                }
                $price = $minPrice ?? 0;
            }

            $hasVariants = $request->boolean('has_variants');
            $unit = $request->input('unit');
            $capacity = 1;
            if (!$hasVariants && $unit && !in_array(strtolower($unit), ['pcs', 'pack', 'box'])) {
                $capacity = (int) $request->input('capacity', 1);
                if ($capacity < 1) {
                    $capacity = 1;
                }
            }

            // 1. Update Product Details
            $product->update([
                'title'                   => $primaryTitle,
                'name_translations'       => $request->name_translations,
                'description'             => $primaryDescription,
                'description_translations' => $request->description_translations,
                'sku'                     => trim($request->sku),
                'price'                   => $price,
                'product_category_id'     => $request->product_category_id,
                'product_sub_category_id' => $request->product_sub_category_id ?: null,
                'is_new'                  => $request->boolean('is_new'),
                'is_best_seller'          => $request->boolean('is_best_seller'),
                'stock_type'              => $request->input('stock_type', 'variant'),
                'unit'                    => $request->input('unit'),
                'weight'                  => $request->input('weight', 0),
                'capacity'                => $capacity,
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
            $productStockType = $request->input('stock_type', 'variant');
            $product->branchStocks()->delete();
            if ($productStockType === 'parent' || !$hasVariants) {
                // Clear variant stocks since product holds central stock
                $product->variants->each(function ($v) {
                    $v->branchStocks()->delete();
                    $v->update(['stock' => 0]);
                });

                $totalStock = 0;
                foreach ((array) $request->branch_stocks as $bStock) {
                    $stockVal    = (int) ($bStock['stock'] ?? 0);
                    $totalStock += $stockVal;
                    $product->branchStocks()->create([
                        'store_branch_id' => $bStock['store_branch_id'],
                        'stock'           => $stockVal,
                        'reserved_stock'  => 0,
                        'low_stock_threshold' => (int) ($bStock['low_stock_threshold'] ?? 5),
                        'is_available'    => $stockVal > 0,
                    ]);
                }
                $product->update(['stock' => $totalStock]);
            }

            // Sync variants
            if ($hasVariants) {
                // Collect and delete variants/sub-variants that are not in the request first to prevent duplicate SKU constraints
                $requestVariantIds = [];
                foreach ((array) $request->variants as $varData) {
                    if (!empty($varData['id'])) {
                        $requestVariantIds[] = (int) $varData['id'];
                    }
                    if (isset($varData['sub_variants'])) {
                        foreach ($varData['sub_variants'] as $subVarData) {
                            if (!empty($subVarData['id'])) {
                                $requestVariantIds[] = (int) $subVarData['id'];
                            }
                        }
                    }
                }
                $product->variants()->whereNotIn('id', $requestVariantIds)->each(function ($v) {
                    if ($v->image) Storage::disk('public')->delete($v->image);
                    $v->delete();
                });

                $keepVariantIds = $requestVariantIds;
                $usedSkus = [];
                $totalStock = 0;

                foreach ((array) $request->variants as $i => $varData) {
                    $hasSub = filter_var($varData['has_sub_variants'] ?? false, FILTER_VALIDATE_BOOLEAN);
                    $varId = $varData['id'] ?? null;
                    $varName = trim($varData['name_translations']['indonesia'] ?? '')
                        ?: (trim($varData['name_translations']['english'] ?? '')
                            ?: trim($varData['name_translations']['arabic'] ?? ''));

                    $varImgFile  = $request->file("variants.{$i}.image");
                    $varSku = trim($varData['sku'] ?? '');
                    $varPrice = ($varData['price'] === null || $varData['price'] === '') ? $product->price : $varData['price'];
                    $varStockType = $varData['stock_type'] ?? 'variant';
                    $varUnit = $varData['unit'] ?? null;
                    if (is_array($varUnit)) {
                        $varUnit = $varUnit['name'] ?? ($varUnit['indonesia'] ?? null);
                    }
                    $varUnitId = $varData['unit_id'] ?: null;

                    // Sanitization based on stock_type mode
                    if ($productStockType === 'parent') {
                        $varStockType = 'variant';
                        $varUnit = null;
                        if ($hasSub) {
                            $varUnitId = null;
                        }
                    } else {
                        if ($hasSub) {
                            $varUnitId = null;
                            if ($varStockType !== 'parent') {
                                $varUnit = null;
                            }
                        }
                    }

                    if ($varId) {
                        $variant = $product->variants()->find($varId);
                        if ($variant) {
                            if (!$varSku) {
                                $varSku = $variant->sku;
                            }
                            $updates = [
                                'parent_id'        => null,
                                'type'             => $varData['type'] ?? $variant->type,
                                'type_translations' => $varData['type_translations'] ?? null,
                                'name'             => $varName,
                                'name_translations' => $varData['name_translations'],
                                'sku'              => $varSku,
                                'price'            => $varPrice,
                                'weight'           => $varData['weight'] ?? 0,
                                'stock'            => 0,
                                'unit_id'          => $varUnitId,
                                'stock_type'       => $varStockType,
                                'unit'             => $varUnit,
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
                        if (!$varSku) {
                            do {
                                $suffix = $hasSub ? 'PARENT-' . strtoupper(str()->random(4)) : strtoupper(str()->random(4));
                                $varSku = $product->sku . '-' . $suffix;
                            } while (
                                in_array($varSku, $usedSkus) ||
                                \App\Models\Product::where('sku', $varSku)->exists() ||
                                \App\Models\ProductVariant::where('sku', $varSku)->exists()
                            );
                        }
                        $usedSkus[] = $varSku;

                        $variant = $product->variants()->create([
                            'parent_id'        => null,
                            'type'             => $varData['type'] ?? null,
                            'type_translations' => $varData['type_translations'] ?? null,
                            'name'             => $varName,
                            'name_translations' => $varData['name_translations'],
                            'sku'              => $varSku,
                            'price'            => $varPrice,
                            'weight'           => $varData['weight'] ?? 0,
                            'stock'            => 0,
                            'image'            => $varImagePath,
                            'unit_id'          => $varUnitId,
                            'stock_type'       => $varStockType,
                            'unit'             => $varUnit,
                        ]);
                    }

                    if ($variant) {
                        $keepVariantIds[] = $variant->id;
                        $variant->branchStocks()->delete();

                        if ($hasSub && isset($varData['sub_variants'])) {
                            $parentVarStockTotal = 0;
                            if ($productStockType !== 'parent' && $varStockType === 'parent') {
                                foreach ((array) ($varData['branch_stocks'] ?? []) as $bStock) {
                                    $stockVal = (int) ($bStock['stock'] ?? 0);
                                    $parentVarStockTotal += $stockVal;
                                    $variant->branchStocks()->create([
                                        'store_branch_id' => $bStock['store_branch_id'],
                                        'stock'           => $stockVal,
                                        'reserved_stock'  => 0,
                                        'low_stock_threshold' => (int) ($bStock['low_stock_threshold'] ?? 5),
                                        'is_available'    => $stockVal > 0,
                                    ]);
                                }
                                $variant->update(['stock' => $parentVarStockTotal]);
                                $totalStock += $parentVarStockTotal;
                            }

                            foreach ($varData['sub_variants'] as $j => $subVarData) {
                                $subVarId = $subVarData['id'] ?? null;
                                $subName = trim($subVarData['name_translations']['indonesia'] ?? '')
                                    ?: (trim($subVarData['name_translations']['english'] ?? '')
                                        ?: trim($subVarData['name_translations']['arabic'] ?? ''));

                                $subImgFile = $request->file("variants.{$i}.sub_variants.{$j}.image");
                                $subSku = trim($subVarData['sku'] ?? '');
                                $subPrice = ($subVarData['price'] === null || $subVarData['price'] === '') ? $product->price : $subVarData['price'];

                                if ($subVarId) {
                                    $childVariant = $product->variants()->find($subVarId);
                                    if ($childVariant) {
                                        if (!$subSku) {
                                            $subSku = $childVariant->sku;
                                        }
                                        $subUpdates = [
                                            'parent_id'        => $variant->id,
                                            'type'             => $subVarData['type'] ?? $childVariant->type,
                                            'type_translations' => $subVarData['type_translations'] ?? null,
                                            'name'             => $subName,
                                            'name_translations' => $subVarData['name_translations'],
                                            'sku'              => $subSku,
                                            'price'            => $subPrice,
                                            'weight'           => $subVarData['weight'] ?? 0,
                                            'stock'            => 0,
                                            'unit_id'          => ($varStockType === 'parent') ? null : ($subVarData['unit_id'] ?: null),
                                            'stock_type'       => 'variant',
                                            'unit'             => null,
                                        ];
                                        if ($subVarData['image_deleted'] ?? false) {
                                            if ($childVariant->image) Storage::disk('public')->delete($childVariant->image);
                                            $subUpdates['image'] = null;
                                        } elseif ($subImgFile) {
                                            if ($childVariant->image) Storage::disk('public')->delete($childVariant->image);
                                            $subUpdates['image'] = $subImgFile->store('variants', 'public');
                                        }
                                        $childVariant->update($subUpdates);
                                        $usedSkus[] = $subSku;
                                    }
                                } else {
                                    $subImagePath = null;
                                    if ($subImgFile) {
                                        $subImagePath = $subImgFile->store('variants', 'public');
                                    }
                                    if (!$subSku) {
                                        do {
                                            $subSku = $product->sku . '-' . strtoupper(str()->random(4));
                                        } while (
                                            in_array($subSku, $usedSkus) ||
                                            \App\Models\Product::where('sku', $subSku)->exists() ||
                                            \App\Models\ProductVariant::where('sku', $subSku)->exists()
                                        );
                                    }
                                    $usedSkus[] = $subSku;

                                    $childVariant = $product->variants()->create([
                                        'parent_id'        => $variant->id,
                                        'type'             => $subVarData['type'] ?? null,
                                        'type_translations' => $subVarData['type_translations'] ?? null,
                                        'name'             => $subName,
                                        'name_translations' => $subVarData['name_translations'],
                                        'sku'              => $subSku,
                                        'price'            => $subPrice,
                                        'weight'           => $subVarData['weight'] ?? 0,
                                        'stock'            => 0,
                                        'image'            => $subImagePath,
                                        'unit_id'          => ($varStockType === 'parent') ? null : ($subVarData['unit_id'] ?: null),
                                        'stock_type'       => 'variant',
                                        'unit'             => null,
                                    ]);
                                }

                                if ($childVariant) {
                                    $keepVariantIds[] = $childVariant->id;
                                    $childVariant->branchStocks()->delete();

                                    if ($productStockType !== 'parent' && $varStockType !== 'parent') {
                                        $childStockTotal = 0;
                                        foreach ((array) ($subVarData['branch_stocks'] ?? []) as $bStock) {
                                            $stockVal = (int) ($bStock['stock'] ?? 0);
                                            $childStockTotal += $stockVal;
                                            $childVariant->branchStocks()->create([
                                                'store_branch_id' => $bStock['store_branch_id'],
                                                'stock'           => $stockVal,
                                                'reserved_stock'  => 0,
                                                'low_stock_threshold' => (int) ($bStock['low_stock_threshold'] ?? 5),
                                                'is_available'    => $stockVal > 0,
                                            ]);
                                        }
                                        $childVariant->update(['stock' => $childStockTotal]);
                                        $totalStock += $childStockTotal;
                                    }
                                }
                            }
                        } else {
                            if ($productStockType !== 'parent') {
                                $varStockTotal = 0;
                                foreach ((array) ($varData['branch_stocks'] ?? []) as $bStock) {
                                    $stockVal = (int) ($bStock['stock'] ?? 0);
                                    $varStockTotal += $stockVal;
                                    $variant->branchStocks()->create([
                                        'store_branch_id' => $bStock['store_branch_id'],
                                        'stock'           => $stockVal,
                                        'reserved_stock'  => 0,
                                        'low_stock_threshold' => (int) ($bStock['low_stock_threshold'] ?? 5),
                                        'is_available'    => $stockVal > 0,
                                    ]);
                                }
                                $variant->update(['stock' => $varStockTotal]);
                                $totalStock += $varStockTotal;
                            }
                        }
                    }
                }

                // Deletions already handled at the beginning of the block

                if ($productStockType !== 'parent') {
                    $product->update(['stock' => $totalStock]);
                }
            } else {
                $product->variants()->each(function ($v) {
                    if ($v->image) Storage::disk('public')->delete($v->image);
                });
                $product->variants()->delete();
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
     * Check if any SKU in the list is already used by another product or variant.
     */
    public function checkSku(Request $request): \Illuminate\Http\JsonResponse
    {
        $productId = $request->input('product_id');
        $skus = $request->input('skus', []);

        if (empty($skus)) {
            return response()->json(['duplicates' => []]);
        }

        // Clean and lowercase SKUs
        $skus = array_map(function ($sku) {
            return strtolower(trim($sku));
        }, $skus);

        $duplicates = [];

        // Check products table
        $productQuery = DB::table('products')
            ->whereIn(DB::raw('LOWER(sku)'), $skus);
        if ($productId) {
            $productQuery->where('id', '!=', $productId);
        }
        $dupProducts = $productQuery->select('sku', 'title')->get();

        foreach ($dupProducts as $p) {
            $duplicates[] = [
                'sku'          => $p->sku,
                'source'       => 'product',
                'product_name' => $p->title,
            ];
        }

        // Check product_variants table
        $variantQuery = DB::table('product_variants')
            ->join('products', 'product_variants.product_id', '=', 'products.id')
            ->whereIn(DB::raw('LOWER(product_variants.sku)'), $skus);
        if ($productId) {
            $variantQuery->where('product_variants.product_id', '!=', $productId);
        }
        $dupVariants = $variantQuery->select('product_variants.sku', 'products.title as product_title')->get();

        foreach ($dupVariants as $v) {
            $duplicates[] = [
                'sku'          => $v->sku,
                'source'       => 'variant',
                'product_name' => $v->product_title,
            ];
        }

        return response()->json([
            'duplicates' => $duplicates,
        ]);
    }

    /**
     * Recursively convert "null" and "undefined" strings to actual null values, and trim all string inputs.
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
            return $trimmed;
        }

        return $data;
    }
}
