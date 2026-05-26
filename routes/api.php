<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\File;

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
