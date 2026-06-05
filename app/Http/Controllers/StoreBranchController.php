<?php

namespace App\Http\Controllers;

use App\Models\StoreBranch;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

use App\Traits\ResolvesBiteshipArea;

class StoreBranchController extends Controller
{
    use ResolvesBiteshipArea;

    public function searchArea(Request $request)
    {
        $input = $request->query('input');
        $countries = $request->query('countries', 'ID');

        if (empty($input)) {
            return response()->json([
                'success' => false,
                'areas' => []
            ]);
        }

        $apiKey = env('BITESHIP_API_KEY');

        try {
            $response = Http::withHeaders([
                'authorization' => $apiKey,
            ])->get('https://api.biteship.com/v1/maps/areas', [
                'countries' => $countries,
                'input' => $input,
                'type' => 'single',
            ]);

            if ($response->successful()) {
                return response()->json($response->json());
            }

            return response()->json([
                'success' => false,
                'message' => 'Biteship API error: ' . $response->body(),
                'areas' => []
            ], $response->status());

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Exception: ' . $e->getMessage(),
                'areas' => []
            ], 500);
        }
    }
    public function index(): Response
    {
        return Inertia::render('backoffice/menu/StoreBranches', [
            'storeBranches' => StoreBranch::query()
                ->latest('id')
                ->get(),
            'status' => session('status'),
            'statusAction' => session('statusAction'),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('backoffice/menu/form/StoreBranchForm', [
            'storeBranch' => null,
            'countries' => $this->getCountries(),
            'status' => session('status'),
            'statusAction' => session('statusAction'),
        ]);
    }

    public function edit(StoreBranch $storeBranch): Response
    {
        return Inertia::render('backoffice/menu/form/StoreBranchForm', [
            'storeBranch' => $storeBranch,
            'countries' => $this->getCountries(),
            'status' => session('status'),
            'statusAction' => session('statusAction'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validateRequest($request);

        // Auto resolve Biteship Area ID if country is Indonesia
        $areaId = $this->resolveBiteshipAreaId(
            $validated['code'],
            $validated['district'] ?? null,
            $validated['city'] ?? null,
            $validated['province'] ?? null,
            $validated['postal_code'] ?? null
        );
        if ($areaId) {
            $validated['area_id'] = $areaId;
        }

        StoreBranch::create($validated);

        return redirect()
            ->route('backoffice.store-branches.index')
            ->with('status', 'Store branch created successfully.')
            ->with('statusAction', 'created');
    }

    public function update(Request $request, StoreBranch $storeBranch): RedirectResponse
    {
        $validated = $this->validateRequest($request, $storeBranch->id);

        // Auto resolve Biteship Area ID if country is Indonesia
        $areaId = $this->resolveBiteshipAreaId(
            $validated['code'],
            $validated['district'] ?? null,
            $validated['city'] ?? null,
            $validated['province'] ?? null,
            $validated['postal_code'] ?? null
        );
        if ($areaId) {
            $validated['area_id'] = $areaId;
        }

        $storeBranch->update($validated);

        return redirect()
            ->route('backoffice.store-branches.index')
            ->with('status', 'Store branch updated successfully.')
            ->with('statusAction', 'updated');
    }

    public function destroy(StoreBranch $storeBranch): RedirectResponse
    {
        $storeBranch->delete();

        return redirect()
            ->route('backoffice.store-branches.index')
            ->with('status', 'Store branch deleted successfully.')
            ->with('statusAction', 'deleted');
    }

    /**
     * @return array<string, mixed>
     */
    protected function validateRequest(Request $request, ?int $ignoreId = null): array
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => [
                'required',
                'string',
                'max:20',
                Rule::unique('store_branches', 'code')->ignore($ignoreId),
            ],
            'country_name' => ['required', 'string', 'max:255'],
            'currency_code' => ['required', 'string', 'max:3'],
            'currency_symbol' => ['required', 'string', 'max:10'],
            'postal_code' => ['required', 'string', 'max:255'],
            'is_active' => ['required', 'boolean'],
            'timezone' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:255'],
            'street' => ['nullable', 'string', 'max:255'],
            'district' => ['nullable', 'string', 'max:255'],
            'province' => ['nullable', 'string', 'max:255'],
            'detail_address' => ['nullable', 'string'],
            'area_id' => ['nullable', 'string', 'max:255'],
        ]);

        $validated['code'] = strtoupper(trim((string) $validated['code']));
        $validated['country_code'] = $validated['code'];
        $validated['currency_code'] = strtoupper(trim((string) $validated['currency_code']));

        if (empty($validated['timezone'])) {
            $validated['timezone'] = 'Asia/Jakarta';
        }

        return $validated;
    }

    /**
     * @return array<int, array{code: string, name: string}>
     */
    protected function getCountries(): array
    {
        $path = storage_path('app/countries_sorted.json');

        if (! File::exists($path)) {
            return [];
        }

        $countries = json_decode((string) File::get($path), true);

        if (! is_array($countries)) {
            return [];
        }

        return array_values(array_filter($countries, function ($country) {
            return is_array($country)
                && isset($country['code'], $country['name'])
                && is_string($country['code'])
                && is_string($country['name']);
        }));
    }
}
