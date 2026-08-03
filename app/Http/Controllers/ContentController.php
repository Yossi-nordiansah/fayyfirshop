<?php

namespace App\Http\Controllers;

use App\Models\HeroSlide;
use App\Models\HomeCategoryCard;
use App\Models\FeaturedProductItem;
use App\Models\UspItem;
use App\Models\AboutUsSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ContentController extends Controller
{
    /**
     * Display the content management dashboard page.
     */
    public function index()
    {
        $heroSlides = [];
        $homeCategoryCards = [];
        $featuredProducts = [];
        $uspItems = [];
        $aboutUsSettings = [];

        try {
            if (Schema::hasTable('hero_slides')) {
                if (HeroSlide::count() === 0) {
                    $this->seedDefaultHeroSlides();
                } else {
                    $first = HeroSlide::first();
                    if ($first && empty($first->title_translations)) {
                        HeroSlide::truncate();
                        $this->seedDefaultHeroSlides();
                    }
                }
                $heroSlides = HeroSlide::orderBy('sort_order', 'asc')->get();
            }

            if (Schema::hasTable('home_category_cards')) {
                if (HomeCategoryCard::count() === 0) {
                    $this->seedDefaultHomeCategoryCards();
                }
                $homeCategoryCards = HomeCategoryCard::orderBy('sort_order', 'asc')->get();
            }

            if (Schema::hasTable('featured_products')) {
                if (FeaturedProductItem::count() === 0) {
                    $this->seedDefaultFeaturedProducts();
                }
                $featuredProducts = FeaturedProductItem::orderBy('sort_order', 'asc')->get();
            }

            if (Schema::hasTable('usp_items')) {
                if (UspItem::count() === 0) {
                    $this->seedDefaultUspItems();
                }
                $uspItems = UspItem::orderBy('sort_order', 'asc')->get();
            }

            if (Schema::hasTable('about_us_settings')) {
                if (AboutUsSetting::count() === 0) {
                    $this->seedDefaultAboutUsSettings();
                }
                $aboutUsSettings = AboutUsSetting::all()->keyBy('key');
            }
        } catch (\Exception $e) {
            // Silently catch database exception
        }

        return Inertia::render('backoffice/menu/Content', [
            'heroSlides' => $heroSlides,
            'homeCategoryCards' => $homeCategoryCards,
            'featuredProducts' => $featuredProducts,
            'uspItems' => $uspItems,
            'aboutUsSettings' => $aboutUsSettings,
            'status' => session('status'),
            'statusAction' => session('statusAction'),
        ]);
    }

    /**
     * Store a new hero slide with 3-language translations.
     */
    public function storeHero(Request $request)
    {
        $request->validate([
            'title_id' => 'required|string|max:255',
            'title_en' => 'nullable|string|max:255',
            'title_ar' => 'nullable|string|max:255',
            'subtitle_id' => 'nullable|string|max:255',
            'subtitle_en' => 'nullable|string|max:255',
            'subtitle_ar' => 'nullable|string|max:255',
            'description_id' => 'nullable|string',
            'description_en' => 'nullable|string',
            'description_ar' => 'nullable|string',
            'category_id' => 'nullable|string|max:255',
            'category_en' => 'nullable|string|max:255',
            'category_ar' => 'nullable|string|max:255',
            'slug' => 'nullable|string|max:255',
            'theme' => 'nullable|string|max:255',
            'icon' => 'nullable|string|max:100',
            'product_image_file' => 'nullable|file|mimes:jpeg,png,jpg,webp,gif,svg|max:5120',
            'product_image_url' => 'nullable|string',
            'background_image_file' => 'nullable|file|mimes:jpeg,png,jpg,webp,gif,svg|max:5120',
            'background_image_url' => 'nullable|string',
            'sort_order' => 'nullable|integer',
            'is_active' => 'nullable|boolean',
        ]);

        $titleTranslations = [
            'id' => $request->title_id,
            'en' => $request->title_en ?: $request->title_id,
            'ar' => $request->title_ar ?: $request->title_id,
        ];

        $subtitleTranslations = [
            'id' => $request->subtitle_id ?: '',
            'en' => $request->subtitle_en ?: ($request->subtitle_id ?: ''),
            'ar' => $request->subtitle_ar ?: ($request->subtitle_id ?: ''),
        ];

        $descriptionTranslations = [
            'id' => $request->description_id ?: '',
            'en' => $request->description_en ?: ($request->description_id ?: ''),
            'ar' => $request->description_ar ?: ($request->description_id ?: ''),
        ];

        $categoryTranslations = [
            'id' => $request->category_id ?: '',
            'en' => $request->category_en ?: ($request->category_id ?: ''),
            'ar' => $request->category_ar ?: ($request->category_id ?: ''),
        ];

        $productImagePath = $request->product_image_url;
        if ($request->hasFile('product_image_file')) {
            $path = $request->file('product_image_file')->store('hero', 'public');
            $productImagePath = '/storage/' . $path;
        }

        $backgroundImagePath = $request->background_image_url;
        if ($request->hasFile('background_image_file')) {
            $path = $request->file('background_image_file')->store('hero', 'public');
            $backgroundImagePath = '/storage/' . $path;
        }

        HeroSlide::create([
            'title' => $request->title_id,
            'title_translations' => $titleTranslations,
            'subtitle' => $request->subtitle_id,
            'subtitle_translations' => $subtitleTranslations,
            'description' => $request->description_id,
            'description_translations' => $descriptionTranslations,
            'category' => $request->category_id,
            'category_translations' => $categoryTranslations,
            'slug' => $request->slug,
            'theme' => $request->theme ?: 'from-blue-900/60',
            'icon' => $request->icon ?: 'Sparkles',
            'product_image' => $productImagePath,
            'background_image' => $backgroundImagePath,
            'sort_order' => $request->sort_order ?? 0,
            'is_active' => $request->has('is_active') ? filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN) : true,
        ]);

        return redirect()->back()->with([
            'status' => 'Slide hero berhasil ditambahkan.',
            'statusAction' => 'created',
        ]);
    }

    /**
     * Update an existing hero slide with 3-language translations.
     */
    public function updateHero(Request $request, $id)
    {
        $slide = HeroSlide::findOrFail($id);

        $request->validate([
            'title_id' => 'required|string|max:255',
            'title_en' => 'nullable|string|max:255',
            'title_ar' => 'nullable|string|max:255',
            'subtitle_id' => 'nullable|string|max:255',
            'subtitle_en' => 'nullable|string|max:255',
            'subtitle_ar' => 'nullable|string|max:255',
            'description_id' => 'nullable|string',
            'description_en' => 'nullable|string',
            'description_ar' => 'nullable|string',
            'category_id' => 'nullable|string|max:255',
            'category_en' => 'nullable|string|max:255',
            'category_ar' => 'nullable|string|max:255',
            'slug' => 'nullable|string|max:255',
            'theme' => 'nullable|string|max:255',
            'icon' => 'nullable|string|max:100',
            'product_image_file' => 'nullable|file|mimes:jpeg,png,jpg,webp,gif,svg|max:5120',
            'product_image_url' => 'nullable|string',
            'background_image_file' => 'nullable|file|mimes:jpeg,png,jpg,webp,gif,svg|max:5120',
            'background_image_url' => 'nullable|string',
            'sort_order' => 'nullable|integer',
            'is_active' => 'nullable|boolean',
        ]);

        $titleTranslations = [
            'id' => $request->title_id,
            'en' => $request->title_en ?: $request->title_id,
            'ar' => $request->title_ar ?: $request->title_id,
        ];

        $subtitleTranslations = [
            'id' => $request->subtitle_id ?: '',
            'en' => $request->subtitle_en ?: ($request->subtitle_id ?: ''),
            'ar' => $request->subtitle_ar ?: ($request->subtitle_id ?: ''),
        ];

        $descriptionTranslations = [
            'id' => $request->description_id ?: '',
            'en' => $request->description_en ?: ($request->description_id ?: ''),
            'ar' => $request->description_ar ?: ($request->description_id ?: ''),
        ];

        $categoryTranslations = [
            'id' => $request->category_id ?: '',
            'en' => $request->category_en ?: ($request->category_id ?: ''),
            'ar' => $request->category_ar ?: ($request->category_id ?: ''),
        ];

        $productImagePath = $slide->product_image;
        if ($request->hasFile('product_image_file')) {
            if ($slide->product_image && str_starts_with($slide->product_image, '/storage/')) {
                $storagePath = str_replace('/storage/', '', $slide->product_image);
                if (Storage::disk('public')->exists($storagePath)) {
                    Storage::disk('public')->delete($storagePath);
                }
            }
            $path = $request->file('product_image_file')->store('hero', 'public');
            $productImagePath = '/storage/' . $path;
        } elseif ($request->filled('product_image_url')) {
            $productImagePath = $request->product_image_url;
        }

        $backgroundImagePath = $slide->background_image;
        if ($request->hasFile('background_image_file')) {
            if ($slide->background_image && str_starts_with($slide->background_image, '/storage/')) {
                $storagePath = str_replace('/storage/', '', $slide->background_image);
                if (Storage::disk('public')->exists($storagePath)) {
                    Storage::disk('public')->delete($storagePath);
                }
            }
            $path = $request->file('background_image_file')->store('hero', 'public');
            $backgroundImagePath = '/storage/' . $path;
        } elseif ($request->filled('background_image_url')) {
            $backgroundImagePath = $request->background_image_url;
        }

        $slide->update([
            'title' => $request->title_id,
            'title_translations' => $titleTranslations,
            'subtitle' => $request->subtitle_id,
            'subtitle_translations' => $subtitleTranslations,
            'description' => $request->description_id,
            'description_translations' => $descriptionTranslations,
            'category' => $request->category_id,
            'category_translations' => $categoryTranslations,
            'slug' => $request->slug,
            'theme' => $request->theme ?: $slide->theme,
            'icon' => $request->icon ?: $slide->icon,
            'product_image' => $productImagePath,
            'background_image' => $backgroundImagePath,
            'sort_order' => $request->sort_order ?? $slide->sort_order,
            'is_active' => $request->has('is_active') ? filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN) : $slide->is_active,
        ]);

        return redirect()->back()->with([
            'status' => 'Slide hero berhasil diperbarui.',
            'statusAction' => 'updated',
        ]);
    }

    /**
     * Delete a hero slide.
     */
    public function destroyHero($id)
    {
        $slide = HeroSlide::findOrFail($id);

        if ($slide->product_image && str_starts_with($slide->product_image, '/storage/')) {
            $storagePath = str_replace('/storage/', '', $slide->product_image);
            if (Storage::disk('public')->exists($storagePath)) {
                Storage::disk('public')->delete($storagePath);
            }
        }

        if ($slide->background_image && str_starts_with($slide->background_image, '/storage/')) {
            $storagePath = str_replace('/storage/', '', $slide->background_image);
            if (Storage::disk('public')->exists($storagePath)) {
                Storage::disk('public')->delete($storagePath);
            }
        }

        $slide->delete();

        return redirect()->back()->with([
            'status' => 'Slide hero berhasil dihapus.',
            'statusAction' => 'deleted',
        ]);
    }

    /**
     * Toggle status active of a hero slide.
     */
    public function toggleHeroActive($id)
    {
        $slide = HeroSlide::findOrFail($id);
        $slide->is_active = !$slide->is_active;
        $slide->save();

        return redirect()->back()->with([
            'status' => 'Status slide hero berhasil diubah.',
            'statusAction' => 'toggled',
        ]);
    }

    /**
     * Store a new Home Category Card with 3 languages.
     */
    public function storeHomeCategory(Request $request)
    {
        $request->validate([
            'title_id' => 'required|string|max:255',
            'title_en' => 'nullable|string|max:255',
            'title_ar' => 'nullable|string|max:255',
            'slug' => 'nullable|string|max:255',
            'image_file' => 'nullable|file|mimes:jpeg,png,jpg,webp,gif,svg|max:5120',
            'image_url' => 'nullable|string',
            'sort_order' => 'nullable|integer',
            'is_active' => 'nullable|boolean',
        ]);

        $titleTranslations = [
            'id' => $request->title_id,
            'en' => $request->title_en ?: $request->title_id,
            'ar' => $request->title_ar ?: $request->title_id,
        ];

        $imagePath = $request->image_url;
        if ($request->hasFile('image_file')) {
            $path = $request->file('image_file')->store('categories', 'public');
            $imagePath = '/storage/' . $path;
        }

        HomeCategoryCard::create([
            'title' => $request->title_id,
            'title_translations' => $titleTranslations,
            'image' => $imagePath,
            'slug' => $request->slug,
            'sort_order' => $request->sort_order ?? 0,
            'is_active' => $request->has('is_active') ? filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN) : true,
        ]);

        return redirect()->back()->with([
            'status' => 'Kartu kategori beranda berhasil ditambahkan.',
            'statusAction' => 'created',
        ]);
    }

    /**
     * Update an existing Home Category Card.
     */
    public function updateHomeCategory(Request $request, $id)
    {
        $card = HomeCategoryCard::findOrFail($id);

        $request->validate([
            'title_id' => 'required|string|max:255',
            'title_en' => 'nullable|string|max:255',
            'title_ar' => 'nullable|string|max:255',
            'slug' => 'nullable|string|max:255',
            'image_file' => 'nullable|file|mimes:jpeg,png,jpg,webp,gif,svg|max:5120',
            'image_url' => 'nullable|string',
            'sort_order' => 'nullable|integer',
            'is_active' => 'nullable|boolean',
        ]);

        $titleTranslations = [
            'id' => $request->title_id,
            'en' => $request->title_en ?: $request->title_id,
            'ar' => $request->title_ar ?: $request->title_id,
        ];

        $imagePath = $card->image;
        if ($request->hasFile('image_file')) {
            if ($card->image && str_starts_with($card->image, '/storage/')) {
                $storagePath = str_replace('/storage/', '', $card->image);
                if (Storage::disk('public')->exists($storagePath)) {
                    Storage::disk('public')->delete($storagePath);
                }
            }
            $path = $request->file('image_file')->store('categories', 'public');
            $imagePath = '/storage/' . $path;
        } elseif ($request->filled('image_url')) {
            $imagePath = $request->image_url;
        }

        $card->update([
            'title' => $request->title_id,
            'title_translations' => $titleTranslations,
            'image' => $imagePath,
            'slug' => $request->slug,
            'sort_order' => $request->sort_order ?? $card->sort_order,
            'is_active' => $request->has('is_active') ? filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN) : $card->is_active,
        ]);

        return redirect()->back()->with([
            'status' => 'Kartu kategori beranda berhasil diperbarui.',
            'statusAction' => 'updated',
        ]);
    }

    /**
     * Delete a Home Category Card.
     */
    public function destroyHomeCategory($id)
    {
        $card = HomeCategoryCard::findOrFail($id);

        if ($card->image && str_starts_with($card->image, '/storage/')) {
            $storagePath = str_replace('/storage/', '', $card->image);
            if (Storage::disk('public')->exists($storagePath)) {
                Storage::disk('public')->delete($storagePath);
            }
        }

        $card->delete();

        return redirect()->back()->with([
            'status' => 'Kartu kategori beranda berhasil dihapus.',
            'statusAction' => 'deleted',
        ]);
    }

    /**
     * Toggle status active of a Home Category Card.
     */
    public function toggleHomeCategoryActive($id)
    {
        $card = HomeCategoryCard::findOrFail($id);
        $card->is_active = !$card->is_active;
        $card->save();

        return redirect()->back()->with([
            'status' => 'Status kartu kategori beranda berhasil diubah.',
            'statusAction' => 'toggled',
        ]);
    }

    /**
     * Store a new Featured Product with 3 languages.
     */
    public function storeFeaturedProduct(Request $request)
    {
        $request->validate([
            'title_id' => 'required|string|max:255',
            'title_en' => 'nullable|string|max:255',
            'title_ar' => 'nullable|string|max:255',
            'badge_id' => 'nullable|string|max:255',
            'badge_en' => 'nullable|string|max:255',
            'badge_ar' => 'nullable|string|max:255',
            'description_id' => 'nullable|string',
            'description_en' => 'nullable|string',
            'description_ar' => 'nullable|string',
            'feature_1_icon' => 'nullable|string|max:100',
            'feature_1_title_id' => 'nullable|string|max:255',
            'feature_1_title_en' => 'nullable|string|max:255',
            'feature_1_title_ar' => 'nullable|string|max:255',
            'feature_1_desc_id' => 'nullable|string',
            'feature_1_desc_en' => 'nullable|string',
            'feature_1_desc_ar' => 'nullable|string',
            'feature_2_icon' => 'nullable|string|max:100',
            'feature_2_title_id' => 'nullable|string|max:255',
            'feature_2_title_en' => 'nullable|string|max:255',
            'feature_2_title_ar' => 'nullable|string|max:255',
            'feature_2_desc_id' => 'nullable|string',
            'feature_2_desc_en' => 'nullable|string',
            'feature_2_desc_ar' => 'nullable|string',
            'button_text_id' => 'nullable|string|max:255',
            'button_text_en' => 'nullable|string|max:255',
            'button_text_ar' => 'nullable|string|max:255',
            'button_url' => 'nullable|string',
            'background_image_file' => 'nullable|file|mimes:jpeg,png,jpg,webp,gif,svg|max:5120',
            'background_image_url' => 'nullable|string',
            'sort_order' => 'nullable|integer',
            'is_active' => 'nullable|boolean',
        ]);

        $titleTranslations = ['id' => $request->title_id, 'en' => $request->title_en ?: $request->title_id, 'ar' => $request->title_ar ?: $request->title_id];
        $badgeTranslations = ['id' => $request->badge_id ?: '', 'en' => $request->badge_en ?: ($request->badge_id ?: ''), 'ar' => $request->badge_ar ?: ($request->badge_id ?: '')];
        $descTranslations = ['id' => $request->description_id ?: '', 'en' => $request->description_en ?: ($request->description_id ?: ''), 'ar' => $request->description_ar ?: ($request->description_id ?: '')];
        
        $f1TitleTranslations = ['id' => $request->feature_1_title_id ?: '', 'en' => $request->feature_1_title_en ?: ($request->feature_1_title_id ?: ''), 'ar' => $request->feature_1_title_ar ?: ($request->feature_1_title_id ?: '')];
        $f1DescTranslations = ['id' => $request->feature_1_desc_id ?: '', 'en' => $request->feature_1_desc_en ?: ($request->feature_1_desc_id ?: ''), 'ar' => $request->feature_1_desc_ar ?: ($request->feature_1_desc_id ?: '')];
        
        $f2TitleTranslations = ['id' => $request->feature_2_title_id ?: '', 'en' => $request->feature_2_title_en ?: ($request->feature_2_title_id ?: ''), 'ar' => $request->feature_2_title_ar ?: ($request->feature_2_title_id ?: '')];
        $f2DescTranslations = ['id' => $request->feature_2_desc_id ?: '', 'en' => $request->feature_2_desc_en ?: ($request->feature_2_desc_id ?: ''), 'ar' => $request->feature_2_desc_ar ?: ($request->feature_2_desc_id ?: '')];

        $btnTextTranslations = ['id' => $request->button_text_id ?: '', 'en' => $request->button_text_en ?: ($request->button_text_id ?: ''), 'ar' => $request->button_text_ar ?: ($request->button_text_id ?: '')];

        $backgroundImagePath = $request->background_image_url;
        if ($request->hasFile('background_image_file')) {
            $path = $request->file('background_image_file')->store('featured', 'public');
            $backgroundImagePath = '/storage/' . $path;
        }

        FeaturedProductItem::create([
            'title' => $request->title_id,
            'title_translations' => $titleTranslations,
            'badge' => $request->badge_id,
            'badge_translations' => $badgeTranslations,
            'description' => $request->description_id,
            'description_translations' => $descTranslations,
            'background_image' => $backgroundImagePath,
            'feature_1_icon' => $request->feature_1_icon ?: 'ShieldCheck',
            'feature_1_title' => $request->feature_1_title_id,
            'feature_1_title_translations' => $f1TitleTranslations,
            'feature_1_desc' => $request->feature_1_desc_id,
            'feature_1_desc_translations' => $f1DescTranslations,
            'feature_2_icon' => $request->feature_2_icon ?: 'Award',
            'feature_2_title' => $request->feature_2_title_id,
            'feature_2_title_translations' => $f2TitleTranslations,
            'feature_2_desc' => $request->feature_2_desc_id,
            'feature_2_desc_translations' => $f2DescTranslations,
            'button_text' => $request->button_text_id,
            'button_text_translations' => $btnTextTranslations,
            'button_url' => $request->button_url,
            'sort_order' => $request->sort_order ?? 0,
            'is_active' => $request->has('is_active') ? filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN) : true,
        ]);

        return redirect()->back()->with([
            'status' => 'Featured Product berhasil ditambahkan.',
            'statusAction' => 'created',
        ]);
    }

    /**
     * Update an existing Featured Product.
     */
    public function updateFeaturedProduct(Request $request, $id)
    {
        $item = FeaturedProductItem::findOrFail($id);

        $request->validate([
            'title_id' => 'required|string|max:255',
            'title_en' => 'nullable|string|max:255',
            'title_ar' => 'nullable|string|max:255',
            'badge_id' => 'nullable|string|max:255',
            'badge_en' => 'nullable|string|max:255',
            'badge_ar' => 'nullable|string|max:255',
            'description_id' => 'nullable|string',
            'description_en' => 'nullable|string',
            'description_ar' => 'nullable|string',
            'feature_1_icon' => 'nullable|string|max:100',
            'feature_1_title_id' => 'nullable|string|max:255',
            'feature_1_title_en' => 'nullable|string|max:255',
            'feature_1_title_ar' => 'nullable|string|max:255',
            'feature_1_desc_id' => 'nullable|string',
            'feature_1_desc_en' => 'nullable|string',
            'feature_1_desc_ar' => 'nullable|string',
            'feature_2_icon' => 'nullable|string|max:100',
            'feature_2_title_id' => 'nullable|string|max:255',
            'feature_2_title_en' => 'nullable|string|max:255',
            'feature_2_title_ar' => 'nullable|string|max:255',
            'feature_2_desc_id' => 'nullable|string',
            'feature_2_desc_en' => 'nullable|string',
            'feature_2_desc_ar' => 'nullable|string',
            'button_text_id' => 'nullable|string|max:255',
            'button_text_en' => 'nullable|string|max:255',
            'button_text_ar' => 'nullable|string|max:255',
            'button_url' => 'nullable|string',
            'background_image_file' => 'nullable|file|mimes:jpeg,png,jpg,webp,gif,svg|max:5120',
            'background_image_url' => 'nullable|string',
            'sort_order' => 'nullable|integer',
            'is_active' => 'nullable|boolean',
        ]);

        $titleTranslations = ['id' => $request->title_id, 'en' => $request->title_en ?: $request->title_id, 'ar' => $request->title_ar ?: $request->title_id];
        $badgeTranslations = ['id' => $request->badge_id ?: '', 'en' => $request->badge_en ?: ($request->badge_id ?: ''), 'ar' => $request->badge_ar ?: ($request->badge_id ?: '')];
        $descTranslations = ['id' => $request->description_id ?: '', 'en' => $request->description_en ?: ($request->description_id ?: ''), 'ar' => $request->description_ar ?: ($request->description_id ?: '')];
        
        $f1TitleTranslations = ['id' => $request->feature_1_title_id ?: '', 'en' => $request->feature_1_title_en ?: ($request->feature_1_title_id ?: ''), 'ar' => $request->feature_1_title_ar ?: ($request->feature_1_title_id ?: '')];
        $f1DescTranslations = ['id' => $request->feature_1_desc_id ?: '', 'en' => $request->feature_1_desc_en ?: ($request->feature_1_desc_id ?: ''), 'ar' => $request->feature_1_desc_ar ?: ($request->feature_1_desc_id ?: '')];
        
        $f2TitleTranslations = ['id' => $request->feature_2_title_id ?: '', 'en' => $request->feature_2_title_en ?: ($request->feature_2_title_id ?: ''), 'ar' => $request->feature_2_title_ar ?: ($request->feature_2_title_id ?: '')];
        $f2DescTranslations = ['id' => $request->feature_2_desc_id ?: '', 'en' => $request->feature_2_desc_en ?: ($request->feature_2_desc_id ?: ''), 'ar' => $request->feature_2_desc_ar ?: ($request->feature_2_desc_id ?: '')];

        $btnTextTranslations = ['id' => $request->button_text_id ?: '', 'en' => $request->button_text_en ?: ($request->button_text_id ?: ''), 'ar' => $request->button_text_ar ?: ($request->button_text_id ?: '')];

        $backgroundImagePath = $item->background_image;
        if ($request->hasFile('background_image_file')) {
            if ($item->background_image && str_starts_with($item->background_image, '/storage/')) {
                $storagePath = str_replace('/storage/', '', $item->background_image);
                if (Storage::disk('public')->exists($storagePath)) {
                    Storage::disk('public')->delete($storagePath);
                }
            }
            $path = $request->file('background_image_file')->store('featured', 'public');
            $backgroundImagePath = '/storage/' . $path;
        } elseif ($request->filled('background_image_url')) {
            $backgroundImagePath = $request->background_image_url;
        }

        $item->update([
            'title' => $request->title_id,
            'title_translations' => $titleTranslations,
            'badge' => $request->badge_id,
            'badge_translations' => $badgeTranslations,
            'description' => $request->description_id,
            'description_translations' => $descTranslations,
            'background_image' => $backgroundImagePath,
            'feature_1_icon' => $request->feature_1_icon ?: $item->feature_1_icon,
            'feature_1_title' => $request->feature_1_title_id,
            'feature_1_title_translations' => $f1TitleTranslations,
            'feature_1_desc' => $request->feature_1_desc_id,
            'feature_1_desc_translations' => $f1DescTranslations,
            'feature_2_icon' => $request->feature_2_icon ?: $item->feature_2_icon,
            'feature_2_title' => $request->feature_2_title_id,
            'feature_2_title_translations' => $f2TitleTranslations,
            'feature_2_desc' => $request->feature_2_desc_id,
            'feature_2_desc_translations' => $f2DescTranslations,
            'button_text' => $request->button_text_id,
            'button_text_translations' => $btnTextTranslations,
            'button_url' => $request->button_url,
            'sort_order' => $request->sort_order ?? $item->sort_order,
            'is_active' => $request->has('is_active') ? filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN) : $item->is_active,
        ]);

        return redirect()->back()->with([
            'status' => 'Featured Product berhasil diperbarui.',
            'statusAction' => 'updated',
        ]);
    }

    /**
     * Delete a Featured Product.
     */
    public function destroyFeaturedProduct($id)
    {
        $item = FeaturedProductItem::findOrFail($id);

        if ($item->background_image && str_starts_with($item->background_image, '/storage/')) {
            $storagePath = str_replace('/storage/', '', $item->background_image);
            if (Storage::disk('public')->exists($storagePath)) {
                Storage::disk('public')->delete($storagePath);
            }
        }

        $item->delete();

        return redirect()->back()->with([
            'status' => 'Featured Product berhasil dihapus.',
            'statusAction' => 'deleted',
        ]);
    }

    /**
     * Toggle status active of a Featured Product.
     */
    public function toggleFeaturedProductActive($id)
    {
        $item = FeaturedProductItem::findOrFail($id);
        $item->is_active = !$item->is_active;
        $item->save();

        return redirect()->back()->with([
            'status' => 'Status Featured Product berhasil diubah.',
            'statusAction' => 'toggled',
        ]);
    }

    /**
     * Store a new USP Item with 3 languages.
     */
    public function storeUsp(Request $request)
    {
        $request->validate([
            'title_id' => 'required|string|max:255',
            'title_en' => 'nullable|string|max:255',
            'title_ar' => 'nullable|string|max:255',
            'description_id' => 'nullable|string',
            'description_en' => 'nullable|string',
            'description_ar' => 'nullable|string',
            'icon' => 'nullable|string|max:255',
            'color' => 'nullable|string|max:255',
            'background_image_file' => 'nullable|file|mimes:jpeg,png,jpg,webp,gif,svg|max:5120',
            'background_image_url' => 'nullable|string',
            'sort_order' => 'nullable|integer',
            'is_active' => 'nullable|boolean',
        ]);

        $titleTranslations = ['id' => $request->title_id, 'en' => $request->title_en ?: $request->title_id, 'ar' => $request->title_ar ?: $request->title_id];
        $descTranslations = ['id' => $request->description_id ?: '', 'en' => $request->description_en ?: ($request->description_id ?: ''), 'ar' => $request->description_ar ?: ($request->description_id ?: '')];

        $backgroundImagePath = $request->background_image_url;
        if ($request->hasFile('background_image_file')) {
            $path = $request->file('background_image_file')->store('usp', 'public');
            $backgroundImagePath = '/storage/' . $path;
        }

        UspItem::create([
            'title' => $request->title_id,
            'title_translations' => $titleTranslations,
            'description' => $request->description_id,
            'description_translations' => $descTranslations,
            'icon' => $request->icon ?: 'Leaf',
            'background_image' => $backgroundImagePath,
            'color' => $request->color ?: 'from-teal-400 to-teal-600',
            'sort_order' => $request->sort_order ?? 0,
            'is_active' => $request->has('is_active') ? filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN) : true,
        ]);

        return redirect()->back()->with([
            'status' => 'Kartu USP berhasil ditambahkan.',
            'statusAction' => 'created',
        ]);
    }

    /**
     * Update an existing USP Item.
     */
    public function updateUsp(Request $request, $id)
    {
        $item = UspItem::findOrFail($id);

        $request->validate([
            'title_id' => 'required|string|max:255',
            'title_en' => 'nullable|string|max:255',
            'title_ar' => 'nullable|string|max:255',
            'description_id' => 'nullable|string',
            'description_en' => 'nullable|string',
            'description_ar' => 'nullable|string',
            'icon' => 'nullable|string|max:255',
            'color' => 'nullable|string|max:255',
            'background_image_file' => 'nullable|file|mimes:jpeg,png,jpg,webp,gif,svg|max:5120',
            'background_image_url' => 'nullable|string',
            'sort_order' => 'nullable|integer',
            'is_active' => 'nullable|boolean',
        ]);

        $titleTranslations = ['id' => $request->title_id, 'en' => $request->title_en ?: $request->title_id, 'ar' => $request->title_ar ?: $request->title_id];
        $descTranslations = ['id' => $request->description_id ?: '', 'en' => $request->description_en ?: ($request->description_id ?: ''), 'ar' => $request->description_ar ?: ($request->description_id ?: '')];

        $backgroundImagePath = $item->background_image;
        if ($request->hasFile('background_image_file')) {
            if ($item->background_image && str_starts_with($item->background_image, '/storage/')) {
                $storagePath = str_replace('/storage/', '', $item->background_image);
                if (Storage::disk('public')->exists($storagePath)) {
                    Storage::disk('public')->delete($storagePath);
                }
            }
            $path = $request->file('background_image_file')->store('usp', 'public');
            $backgroundImagePath = '/storage/' . $path;
        } elseif ($request->filled('background_image_url')) {
            $backgroundImagePath = $request->background_image_url;
        }

        $item->update([
            'title' => $request->title_id,
            'title_translations' => $titleTranslations,
            'description' => $request->description_id,
            'description_translations' => $descTranslations,
            'icon' => $request->icon ?: $item->icon,
            'background_image' => $backgroundImagePath,
            'color' => $request->color ?: $item->color,
            'sort_order' => $request->sort_order ?? $item->sort_order,
            'is_active' => $request->has('is_active') ? filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN) : $item->is_active,
        ]);

        return redirect()->back()->with([
            'status' => 'Kartu USP berhasil diperbarui.',
            'statusAction' => 'updated',
        ]);
    }

    /**
     * Delete a USP Item.
     */
    public function destroyUsp($id)
    {
        $item = UspItem::findOrFail($id);

        if ($item->background_image && str_starts_with($item->background_image, '/storage/')) {
            $storagePath = str_replace('/storage/', '', $item->background_image);
            if (Storage::disk('public')->exists($storagePath)) {
                Storage::disk('public')->delete($storagePath);
            }
        }

        $item->delete();

        return redirect()->back()->with([
            'status' => 'Kartu USP berhasil dihapus.',
            'statusAction' => 'deleted',
        ]);
    }

    /**
     * Toggle status active of a USP Item.
     */
    public function toggleUspActive($id)
    {
        $item = UspItem::findOrFail($id);
        $item->is_active = !$item->is_active;
        $item->save();

        return redirect()->back()->with([
            'status' => 'Status kartu USP berhasil diubah.',
            'statusAction' => 'toggled',
        ]);
    }

    /**
     * Seed initial default hero slides with 3 languages.
     */
    private function seedDefaultHeroSlides()
    {
        $defaults = [
            [
                'category' => 'Parfum Mewah',
                'category_translations' => [
                    'id' => 'Parfum Mewah',
                    'en' => 'Luxury Perfume',
                    'ar' => 'عطور فاخرة',
                ],
                'title' => 'Simfoni Aroma',
                'title_translations' => [
                    'id' => 'Simfoni Aroma',
                    'en' => 'Scent of Luxury',
                    'ar' => 'عبير الفخامة',
                ],
                'subtitle' => 'Eau de Parfum & Fragrance Spray',
                'subtitle_translations' => [
                    'id' => 'Eau de Parfum & Fragrance Spray',
                    'en' => 'Eau de Parfum & Fragrance Spray',
                    'ar' => 'أو دو بارفان وبخاخات عطرية',
                ],
                'description' => 'Koleksi wewangian premium dengan konsentrasi tinggi yang memikat, dirancang untuk memancarkan pesona sepanjang hari.',
                'description_translations' => [
                    'id' => 'Koleksi wewangian premium dengan konsentrasi tinggi yang memikat, dirancang untuk memancarkan pesona sepanjang hari.',
                    'en' => 'Premium fragrance collection with high concentration that captivates, designed to radiate charm throughout your day.',
                    'ar' => 'مجموعة عطور متميزة بتركيز عالٍ تأسر الحواس، مصممة لتنشر الجاذبية طوال يومك.',
                ],
                'background_image' => '/images/hero/bg-perfume.webp',
                'product_image' => '/images/hero/Perfume-web-(1).webp',
                'icon' => 'Sparkles',
                'theme' => 'from-blue-900/60',
                'slug' => 'parfum',
                'sort_order' => 1,
                'is_active' => true,
            ],
            [
                'category' => 'Minyak Aromatik',
                'category_translations' => [
                    'id' => 'Minyak Aromatik',
                    'en' => 'Aromatic Oil',
                    'ar' => 'زيوت عطرية',
                ],
                'title' => 'Kemurnian Alam',
                'title_translations' => [
                    'id' => 'Kemurnian Alam',
                    'en' => 'Purity of Nature',
                    'ar' => 'نقاء الطبيعة',
                ],
                'subtitle' => 'Dehn Oud & Campuran Minyak Pilihan',
                'subtitle_translations' => [
                    'id' => 'Dehn Oud & Campuran Minyak Pilihan',
                    'en' => 'Dehn Oud & Essential Oil Blends',
                    'ar' => 'دهن العود ومزيج الزيوت المختارة',
                ],
                'description' => 'Tetesan kemurnian dari alam, memberikan ketenangan dan kepercayaan diri dengan aroma yang mendalam.',
                'description_translations' => [
                    'id' => 'Tetesan kemurnian dari alam, memberikan ketenangan dan kepercayaan diri dengan aroma yang mendalam.',
                    'en' => 'Pure drops from nature, providing tranquility and confidence with deep, resonant aromas.',
                    'ar' => 'قطرات نقية من الطبيعة، توفر الطمأنينة والثقة بالنفس مع روائح عميقة.',
                ],
                'background_image' => '/images/hero/aromatic-oil2.webp',
                'product_image' => '/images/hero/Aromatic-Oil-web.webp',
                'icon' => 'Droplets',
                'theme' => 'from-blue-800/60',
                'slug' => 'minyak-aromatik',
                'sort_order' => 2,
                'is_active' => true,
            ],
            [
                'category' => 'Bakhoor & Oud',
                'category_translations' => [
                    'id' => 'Bakhoor & Oud',
                    'en' => 'Bakhoor & Oud',
                    'ar' => 'بخور وعود',
                ],
                'title' => 'Warisan Tradisi',
                'title_translations' => [
                    'id' => 'Warisan Tradisi',
                    'en' => 'Heritage of Tradition',
                    'ar' => 'تراث التقاليد',
                ],
                'subtitle' => 'Dupa Arab Tradisional & Kayu Oud',
                'subtitle_translations' => [
                    'id' => 'Dupa Arab Tradisional & Kayu Oud',
                    'en' => 'Traditional Arabian Incense & Oud Wood',
                    'ar' => 'البخور العربي التقليدي وخشب العود',
                ],
                'description' => 'Ciptakan suasana hangat dan spiritual di rumah Anda dengan asap wangi dari tradisi Timur Tengah yang kaya.',
                'description_translations' => [
                    'id' => 'Ciptakan suasana hangat dan spiritual di rumah Anda dengan asap wangi dari tradisi Timur Tengah yang kaya.',
                    'en' => 'Create a warm and spiritual atmosphere in your home with fragrant smoke from rich Middle Eastern traditions.',
                    'ar' => 'خلق جو دافئ وروحي في منزلك مع الدخان العطري من تقاليد الشرق الأوسط الغنية.',
                ],
                'background_image' => '/images/hero/bakhoor.webp',
                'product_image' => '/images/hero/Bukhur-web.webp',
                'icon' => 'Flame',
                'theme' => 'from-amber-900/60',
                'slug' => 'bakhoor-dan-oud',
                'sort_order' => 3,
                'is_active' => true,
            ],
            [
                'category' => 'Kesehatan & Nutrisi',
                'category_translations' => [
                    'id' => 'Kesehatan & Nutrisi',
                    'en' => 'Health & Nutrition',
                    'ar' => 'صحة وتغذية',
                ],
                'title' => 'Kebaikan Terbaik',
                'title_translations' => [
                    'id' => 'Kebaikan Terbaik',
                    'en' => 'Ultimate Goodness',
                    'ar' => 'أفضل جودة',
                ],
                'subtitle' => 'Madu Sidr & Saffron Premium',
                'subtitle_translations' => [
                    'id' => 'Madu Sidr & Saffron Premium',
                    'en' => 'Sidr Honey & Premium Saffron',
                    'ar' => 'عسل السدر والزعفران الفاخر',
                ],
                'description' => 'Nutrisi alami berkualitas tinggi untuk gaya hidup sehat Anda, langsung dari sumber terbaik di tanah Arab.',
                'description_translations' => [
                    'id' => 'Nutrisi alami berkualitas tinggi untuk gaya hidup sehat Anda, langsung dari sumber terbaik di tanah Arab.',
                    'en' => 'High-quality natural nutrition for your healthy lifestyle, directly from the finest sources in Arab lands.',
                    'ar' => 'تغذية طبيعية عالية الجودة لنمط حياتك الصحي، مباشرة من أفضل المصادر في الأراضي العربية.',
                ],
                'background_image' => '/images/hero/bg-honey.webp',
                'product_image' => '/images/hero/honey.webp',
                'icon' => 'Leaf',
                'theme' => 'from-blue-900/60',
                'slug' => 'kesehatan-dan-nutrisi',
                'sort_order' => 4,
                'is_active' => true,
            ],
        ];

        foreach ($defaults as $slide) {
            HeroSlide::create($slide);
        }
    }

    /**
     * Seed initial default home category cards with 3 languages.
     */
    private function seedDefaultHomeCategoryCards()
    {
        $defaults = [
            [
                'title' => 'Parfum',
                'title_translations' => [
                    'id' => 'Parfum',
                    'en' => 'Perfume',
                    'ar' => 'عطور',
                ],
                'image' => '/images/category-background/perfume.webp',
                'slug' => 'parfum',
                'sort_order' => 1,
                'is_active' => true,
            ],
            [
                'title' => 'Minyak Aromatik',
                'title_translations' => [
                    'id' => 'Minyak Aromatik',
                    'en' => 'Aromatic Oil',
                    'ar' => 'زيوت عطرية',
                ],
                'image' => '/images/category-background/oudoil.webp',
                'slug' => 'minyak-aromatik',
                'sort_order' => 2,
                'is_active' => true,
            ],
            [
                'title' => 'Bakhoor & Oud',
                'title_translations' => [
                    'id' => 'Bakhoor & Oud',
                    'en' => 'Bakhoor & Oud',
                    'ar' => 'بخور وعود',
                ],
                'image' => '/images/category-background/oud.webp',
                'slug' => 'bakhoor-dan-oud',
                'sort_order' => 3,
                'is_active' => true,
            ],
            [
                'title' => 'Kesehatan & Nutrisi',
                'title_translations' => [
                    'id' => 'Kesehatan & Nutrisi',
                    'en' => 'Health & Nutrition',
                    'ar' => 'صحة وتغذية',
                ],
                'image' => '/images/category-background/healty.webp',
                'slug' => 'kesehatan-dan-nutrisi',
                'sort_order' => 4,
                'is_active' => true,
            ],
        ];

        foreach ($defaults as $card) {
            HomeCategoryCard::create($card);
        }
    }

    /**
     * Seed initial default featured product item with 3 languages.
     */
    private function seedDefaultFeaturedProducts()
    {
        $defaults = [
            [
                'badge' => 'Special Premium Product',
                'badge_translations' => [
                    'id' => 'Special Premium Product',
                    'en' => 'Special Premium Product',
                    'ar' => 'منتج فاخر خاص',
                ],
                'title' => 'Alsharif Pure Honey Marai',
                'title_translations' => [
                    'id' => 'Alsharif Pure Honey Marai',
                    'en' => 'Alsharif Pure Honey Marai',
                    'ar' => 'عسل الشريف المري الصافي',
                ],
                'description' => 'Rasakan kemurnian madu Marai otentik yang dipanen langsung dari nektar bunga pilihan di lembah subur Timur Tengah. Menghadirkan kualitas premium nan kaya manfaat untuk gaya hidup sehat keluarga Anda.',
                'description_translations' => [
                    'id' => 'Rasakan kemurnian madu Marai otentik yang dipanen langsung dari nektar bunga pilihan di lembah subur Timur Tengah. Menghadirkan kualitas premium nan kaya manfaat untuk gaya hidup sehat keluarga Anda.',
                    'en' => 'Experience the purity of authentic Marai honey harvested directly from select flower nectar in fertile Middle Eastern valleys. Delivering premium quality rich in benefits for your family\'s healthy lifestyle.',
                    'ar' => 'استمتع بنقاء عسل المري الأصيل المحصود مباشرة من رحيق الزهور المختارة في أودية الشرق الأوسط الخصبة. يقدم جودة فاخرة غنية بالفوائد لنمط حياة عائلتك الصحي.',
                ],
                'background_image' => '/images/featured-product/bg-featured-product.png',
                
                'feature_1_icon' => 'ShieldCheck',
                'feature_1_title' => '100% Organik & Murni',
                'feature_1_title_translations' => [
                    'id' => '100% Organik & Murni',
                    'en' => '100% Organic & Pure',
                    'ar' => '100٪ عضوي ونقي',
                ],
                'feature_1_desc' => 'Tanpa pemanis buatan maupun bahan pengawet.',
                'feature_1_desc_translations' => [
                    'id' => 'Tanpa pemanis buatan maupun bahan pengawet.',
                    'en' => 'No artificial sweeteners or preservatives.',
                    'ar' => 'بدون محليات صناعية أو مواد حافظة.',
                ],

                'feature_2_icon' => 'Award',
                'feature_2_title' => 'Kualitas Ekstra Premium',
                'feature_2_title_translations' => [
                    'id' => 'Kualitas Ekstra Premium',
                    'en' => 'Extra Premium Quality',
                    'ar' => 'جودة فاخرة إضافية',
                ],
                'feature_2_desc' => 'Melalui proses kurasi ketat standar ekspor.',
                'feature_2_desc_translations' => [
                    'id' => 'Melalui proses kurasi ketat standar ekspor.',
                    'en' => 'Through strict export standard curation process.',
                    'ar' => 'من خلال عملية تقييم صارمة بمعايير التصدير.',
                ],

                'button_text' => 'Beli Sekarang',
                'button_text_translations' => [
                    'id' => 'Beli Sekarang',
                    'en' => 'Buy Now',
                    'ar' => 'اشتر الآن',
                ],
                'button_url' => '/products/kesehatan-dan-nutrisi',
                'sort_order' => 1,
                'is_active' => true,
            ],
        ];

        foreach ($defaults as $item) {
            FeaturedProductItem::create($item);
        }
    }

    /**
     * Update About Us settings (all fields at once).
     */
    public function updateAboutUs(Request $request)
    {
        $request->validate([
            'hero_badge_label_id' => 'nullable|string|max:255',
            'hero_badge_label_en' => 'nullable|string|max:255',
            'hero_badge_label_ar' => 'nullable|string|max:255',
            'story_title_id'      => 'nullable|string|max:255',
            'story_title_en'      => 'nullable|string|max:255',
            'story_title_ar'      => 'nullable|string|max:255',
            'story_p1_id'         => 'nullable|string',
            'story_p1_en'         => 'nullable|string',
            'story_p1_ar'         => 'nullable|string',
            'story_p2_id'         => 'nullable|string',
            'story_p2_en'         => 'nullable|string',
            'story_p2_ar'         => 'nullable|string',
            'story_p3_id'         => 'nullable|string',
            'story_p3_en'         => 'nullable|string',
            'story_p3_ar'         => 'nullable|string',
        ]);

        $fields = [
            'hero_badge_label',
            'story_title',
            'story_p1',
            'story_p2',
            'story_p3',
        ];

        foreach ($fields as $field) {
            $idVal = $request->input("{$field}_id", '');
            $enVal = $request->input("{$field}_en", $idVal);
            $arVal = $request->input("{$field}_ar", $idVal);

            AboutUsSetting::updateOrCreate(
                ['key' => $field],
                [
                    'value' => $idVal,
                    'value_translations' => [
                        'id' => $idVal,
                        'en' => $enVal ?: $idVal,
                        'ar' => $arVal ?: $idVal,
                    ],
                ]
            );
        }

        return redirect()->back()->with([
            'status' => 'Konten Tentang Kami berhasil disimpan.',
            'statusAction' => 'updated',
        ]);
    }

    /**
     * Seed initial default USP items with 3 languages.
     */
    private function seedDefaultUspItems()
    {
        $defaults = [
            [
                'title' => 'Natural Product',
                'title_translations' => [
                    'id' => 'Produk Alami',
                    'en' => 'Natural Product',
                    'ar' => 'منتج طبيعي',
                ],
                'description' => 'Selected from pure, highest-quality natural ingredients.',
                'description_translations' => [
                    'id' => 'Dipilih langsung dari bahan alami murni berkualitas tertinggi.',
                    'en' => 'Selected from pure, highest-quality natural ingredients.',
                    'ar' => 'مختار من مكونات طبيعية نقية بأعلى جودة.',
                ],
                'icon' => 'Leaf',
                'background_image' => '/images/ups/natural.jpg',
                'color' => 'from-teal-400 to-teal-600',
                'sort_order' => 1,
                'is_active' => true,
            ],
            [
                'title' => 'Fast Delivery',
                'title_translations' => [
                    'id' => 'Pengiriman Cepat',
                    'en' => 'Fast Delivery',
                    'ar' => 'توصيل سريع',
                ],
                'description' => 'Priority logistics system ensuring your orders arrive swiftly.',
                'description_translations' => [
                    'id' => 'Sistem logistik prioritas memastikan pesanan Anda tiba dengan cepat.',
                    'en' => 'Priority logistics system ensuring your orders arrive swiftly.',
                    'ar' => 'نظام لوجستي ذو أولوية يضمن وصول طلباتك بسرعة.',
                ],
                'icon' => 'Truck',
                'background_image' => '/images/ups/delivery.jpg',
                'color' => 'from-blue-500 to-indigo-600',
                'sort_order' => 2,
                'is_active' => true,
            ],
            [
                'title' => 'WhatsApp Support',
                'title_translations' => [
                    'id' => 'Dukungan WhatsApp',
                    'en' => 'WhatsApp Support',
                    'ar' => 'دعم واتساب',
                ],
                'description' => 'Exclusive customer concierge ready to assist you anytime.',
                'description_translations' => [
                    'id' => 'Layanan pelanggan eksklusif yang siap membantu Anda kapan saja.',
                    'en' => 'Exclusive customer concierge ready to assist you anytime.',
                    'ar' => 'خدمة عملاء حصرية جاهزة لمساعدتك في أي وقت.',
                ],
                'icon' => '/images/icons/whatsappicon.svg',
                'background_image' => '/images/ups/chatting.jpg',
                'color' => 'from-emerald-400 to-emerald-600',
                'sort_order' => 3,
                'is_active' => true,
            ],
            [
                'title' => 'Secure Payment',
                'title_translations' => [
                    'id' => 'Pembayaran Aman',
                    'en' => 'Secure Payment',
                    'ar' => 'دفع آمن',
                ],
                'description' => 'Fully encrypted digital gateways for ultimate peace of mind.',
                'description_translations' => [
                    'id' => 'Gerbang pembayaran digital terenkripsi penuh untuk kenyamanan maksimal Anda.',
                    'en' => 'Fully encrypted digital gateways for ultimate peace of mind.',
                    'ar' => 'بوابات رقمية مشفرة بالكامل لراحتك التامة.',
                ],
                'icon' => 'CreditCard',
                'background_image' => '/images/ups/payment.jpg',
                'color' => 'from-cyan-500 to-blue-600',
                'sort_order' => 4,
                'is_active' => true,
            ],
        ];

        foreach ($defaults as $item) {
            UspItem::create($item);
        }
    }

    /**
     * Seed default About Us settings.
     */
    private function seedDefaultAboutUsSettings()
    {
        $defaults = [
            [
                'key'   => 'hero_badge_label',
                'value' => 'Alsharif Perfume Bandung',
                'value_translations' => [
                    'id' => 'Alsharif Perfume Bandung',
                    'en' => 'Alsharif Perfume Bandung',
                    'ar' => 'الشريف للعطور باندونغ',
                ],
            ],
            [
                'key'   => 'story_title',
                'value' => 'Kisah Alsharif Perfume',
                'value_translations' => [
                    'id' => 'Kisah Alsharif Perfume',
                    'en' => 'The Alsharif Perfume Story',
                    'ar' => 'قصة الشريف للعطور',
                ],
            ],
            [
                'key'   => 'story_p1',
                'value' => 'Alsharif Perfume Bandung lahir dari kecintaan yang mendalam terhadap seni pembuatan wewangian tradisional Timur Tengah yang dipadukan dengan kemewahan modern. Kami percaya bahwa setiap aroma memiliki kekuatan untuk menceritakan kisah, membangkitkan ingatan emosional, dan mengekspresikan karakter unik dari pemakainya.',
                'value_translations' => [
                    'id' => 'Alsharif Perfume Bandung lahir dari kecintaan yang mendalam terhadap seni pembuatan wewangian tradisional Timur Tengah yang dipadukan dengan kemewahan modern. Kami percaya bahwa setiap aroma memiliki kekuatan untuk menceritakan kisah, membangkitkan ingatan emosional, dan mengekspresikan karakter unik dari pemakainya.',
                    'en' => 'Alsharif Perfume Bandung was born from a deep-rooted passion for traditional Middle Eastern perfumery combined with modern luxury. We believe that a fragrance is more than a scent; it has the power to narrate stories, evoke emotions, and express the unique character of its wearer.',
                    'ar' => 'ولدت عطور الشريف باندونغ من شغف عميق بصناعة العطور الشرقية التقليدية الممزوجة بالرفاهية الحديثة. نحن نؤمن بأن العطور تمتلك القوة لرواية القصص، وإيقاظ المشاعر، وعكس الطابع الفريد لمن يرتديها.',
                ],
            ],
            [
                'key'   => 'story_p2',
                'value' => 'Berlandaskan komitmen tinggi terhadap kualitas kelas dunia, kami menyeleksi bahan baku pilihan secara ketat. Mulai dari minyak esensial oud yang pekat, kelembutan mawar Taif, hingga kehangatan amber murni. Setiap racikan wewangian kami diformulasikan dengan cermat untuk menghadirkan aroma yang kaya, tahan lama, dan memikat di kulit Anda.',
                'value_translations' => [
                    'id' => 'Berlandaskan komitmen tinggi terhadap kualitas kelas dunia, kami menyeleksi bahan baku pilihan secara ketat. Mulai dari minyak esensial oud yang pekat, kelembutan mawar Taif, hingga kehangatan amber murni. Setiap racikan wewangian kami diformulasikan dengan cermat untuk menghadirkan aroma yang kaya, tahan lama, dan memikat di kulit Anda.',
                    'en' => 'Grounded in a commitment to world-class quality, we carefully select and source premium raw materials. From rich oud essential oils and mystical Taif roses to pure warm amber. Each of our blends is meticulously formulated to deliver rich, long-lasting, and captivating scents.',
                    'ar' => 'تأسست على الالتزام بالجودة العالمية، ونحن نختار بعناية المواد الخام الممتازة. من زيوت العود الغنية وورد الطائف الغامض إلى العنبر الدافئ النقي. تمت صياغة كل من خلطاتنا بدقة لتقديم روائح غنية تدوم طويلاً وتأسر الحواس.',
                ],
            ],
            [
                'key'   => 'story_p3',
                'value' => 'Toko fisik kami di Bandung dirancang bukan sekadar sebagai tempat belanja wewangian, melainkan ruang eksplorasi sensorik di mana Anda dapat menemukan signature scent yang sejati. Staf konsultan parfum kami siap membantu memandu perjalanan aromatik Anda dengan layanan ramah dan profesional.',
                'value_translations' => [
                    'id' => 'Toko fisik kami di Bandung dirancang bukan sekadar sebagai tempat belanja wewangian, melainkan ruang eksplorasi sensorik di mana Anda dapat menemukan signature scent yang sejati. Staf konsultan parfum kami siap membantu memandu perjalanan aromatik Anda dengan layanan ramah dan profesional.',
                    'en' => 'Our physical store in Bandung is designed not just as a shop, but as a sensory exploration space where you can discover your true signature scent. Our expert perfume consultants are here to guide your olfactory journey with warm, personalized, and professional service.',
                    'ar' => 'متجرنا الفعلي في باندونغ ليس مجرد متجر تجزئة، بل هو مساحة للاستكشاف الحسي حيث يمكنك اكتشاف عطرك المميز الحقيقي. مستشارو العطور لدينا مستعدون لمساعدتك في رحلتك العطرية بكل ود وخبرة احترافية.',
                ],
            ],
        ];

        foreach ($defaults as $item) {
            AboutUsSetting::create($item);
        }
    }
}
