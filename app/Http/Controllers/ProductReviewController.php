<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\ProductReview;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProductReviewController extends Controller
{
    /**
     * Store reviews for the items of a completed order.
     */
    public function store(Request $request, Order $order)
    {
        // Ensure user owns this order
        if ($order->user_id !== auth()->id()) {
            abort(403);
        }

        // Ensure order is completed
        if ($order->status !== 'completed') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya pesanan yang sudah selesai yang dapat dinilai.'
            ], 400);
        }

        // Validate the request data
        $request->validate([
            'reviews' => 'required|array',
            'reviews.*.product_id' => 'required|exists:products,id',
            'reviews.*.product_variant_id' => 'nullable|exists:product_variants,id',
            'reviews.*.rating' => 'required|integer|min:1|max:5',
            'reviews.*.comment' => 'nullable|string|max:1000',
        ]);

        foreach ($request->reviews as $reviewData) {
            ProductReview::updateOrCreate([
                'user_id' => auth()->id(),
                'order_id' => $order->id,
                'product_id' => $reviewData['product_id'],
                'product_variant_id' => $reviewData['product_variant_id'] ?? null,
            ], [
                'rating' => $reviewData['rating'],
                'comment' => $reviewData['comment'] ?? null,
                'is_visible' => true, // default to true, admin can toggle
            ]);
        }

        return redirect()->back()->with('status', 'Terima kasih atas penilaian Anda!');
    }

    /**
     * Display reviews in the backoffice.
     */
    public function index(Request $request)
    {
        // Check backoffice permission
        if (!auth()->check() || !in_array(auth()->user()->role, ['admin', 'super_admin'])) {
            abort(403);
        }

        $reviews = ProductReview::with(['user', 'product.images', 'productVariant'])
            ->latest('id')
            ->get();

        return Inertia::render('backoffice/menu/Reviews', [
            'reviews' => $reviews,
            'status' => session('status'),
        ]);
    }

    /**
     * Toggle visibility of a review in backoffice.
     */
    public function toggleVisibility(ProductReview $review)
    {
        // Check backoffice permission
        if (!auth()->check() || !in_array(auth()->user()->role, ['admin', 'super_admin'])) {
            abort(403);
        }

        $review->update([
            'is_visible' => !$review->is_visible
        ]);

        return redirect()->back()->with('status', 'Visibilitas ulasan berhasil diperbarui.');
    }

    /**
     * Delete a review in backoffice.
     */
    public function destroy(ProductReview $review)
    {
        // Check backoffice permission
        if (!auth()->check() || !in_array(auth()->user()->role, ['admin', 'super_admin'])) {
            abort(403);
        }

        $review->delete();

        return redirect()->back()->with('status', 'Ulasan berhasil dihapus.');
    }
}
