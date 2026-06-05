<?php

namespace App\Traits;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

trait ResolvesBiteshipArea
{
    /**
     * Resolve Biteship Area ID based on address components.
     *
     * @param string $countryCode
     * @param string|null $district
     * @param string|null $city
     * @param string|null $province
     * @param string|null $postalCode
     * @return string|null
     */
    protected function resolveBiteshipAreaId(
        string $countryCode,
        ?string $district = null,
        ?string $city = null,
        ?string $province = null,
        ?string $postalCode = null
    ): ?string {
        $countryCode = strtoupper(trim($countryCode));
        if ($countryCode !== 'ID') {
            return null; // Biteship is Indonesia only
        }

        // Construct search query
        $parts = array_filter([
            $district,
            $city,
            $province,
            $postalCode
        ]);

        $searchQuery = implode(' ', $parts);
        if (empty($searchQuery)) {
            return null;
        }

        $apiKey = env('BITESHIP_API_KEY');
        if (empty($apiKey)) {
            Log::warning('Biteship API Key is not set in the .env file.');
            return null;
        }

        try {
            $response = Http::withHeaders([
                'authorization' => $apiKey,
            ])->get('https://api.biteship.com/v1/maps/areas', [
                'countries' => 'ID',
                'input' => $searchQuery,
                'type' => 'single',
            ]);

            if ($response->successful()) {
                $data = $response->json();
                if (!empty($data['areas']) && is_array($data['areas'])) {
                    return $data['areas'][0]['id'] ?? null;
                }
            } else {
                Log::error('Biteship API error resolving area ID: ' . $response->body());
            }
        } catch (\Exception $e) {
            Log::error('Exception resolving Biteship area ID: ' . $e->getMessage());
        }

        return null;
    }
}
