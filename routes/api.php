<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\File;

use App\Http\Controllers\DokuSnapController;

Route::get('/countries', function () {
    // SINKRONISASI: Mengarah langsung ke storage/app/countries.json sesuai lokasi file Anda
    $filePath = storage_path('app/countries_sorted.json');

    if (!File::exists($filePath)) {
        return response()->json([
            'message' => 'Data negara tidak ditemukan di folder storage/app.'
        ], 404);
    }

    $countries = json_decode(File::get($filePath), true);

    return response()->json(
        collect($countries)
            // Tetap kecualikan Indonesia karena punya form register tersendiri
            ->filter(fn($country) => $country['code'] !== 'ID')
            ->sortBy('name')
            ->values()
    );
})->name('api.countries');

// ==========================================
// DOKU / ASPI SNAP Virtual Account Endpoints
// ==========================================
// Resolves to: /api/v1.1/transfer-va/payment (or /api/v1.1/transfer-va/payment/{scenario})
Route::match(['get', 'post'], '/v1.1/transfer-va/payment/{scenario?}', [DokuSnapController::class, 'paymentVa'])->name('api.snap.payment-va.v11');
Route::match(['get', 'post'], '/v1.0/transfer-va/payment/{scenario?}', [DokuSnapController::class, 'paymentVa'])->name('api.snap.payment-va.v10');
Route::match(['get', 'post'], '/transfer-va/payment/{scenario?}', [DokuSnapController::class, 'paymentVa'])->name('api.snap.payment-va');

// Inquiry VA routes
Route::match(['get', 'post'], '/v1.1/transfer-va/inquiry-va/{scenario?}', [DokuSnapController::class, 'inquiryVa'])->name('api.snap.inquiry-va.v11');
Route::match(['get', 'post'], '/v1.1/transfer-va/inquiry/{scenario?}', [DokuSnapController::class, 'inquiryVa']);
Route::match(['get', 'post'], '/v1.0/transfer-va/inquiry-va/{scenario?}', [DokuSnapController::class, 'inquiryVa']);
Route::match(['get', 'post'], '/transfer-va/inquiry-va/{scenario?}', [DokuSnapController::class, 'inquiryVa']);

// DOKU Checkout Notification Webhook
Route::match(['get', 'post'], '/doku/callback', [\App\Http\Controllers\CheckoutController::class, 'dokuCallback'])->name('api.doku.callback');


