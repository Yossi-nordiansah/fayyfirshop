<?php

namespace App\Http\Controllers;

use App\Models\StoreBranch;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AdminController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('backoffice/menu/Admin', [
            'admins' => User::query()
                ->where('role', 'admin')
                ->with('assignedBranch:id,name')
                ->latest('id')
                ->get(),
            'status' => session('status'),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('backoffice/menu/form/AdminForm', [
            'admin' => null,
            'countries' => $this->getCountries(),
            'storeBranches' => $this->getStoreBranches(),
        ]);
    }

    public function edit(User $admin): Response
    {
        abort_unless($admin->role === 'admin', 404);

        return Inertia::render('backoffice/menu/form/AdminForm', [
            'admin' => $admin->only([
                'id',
                'name',
                'avatar',
                'email',
                'phone',
                'country',
                'address',
                'assigned_branch_id',
            ]),
            'countries' => $this->getCountries(),
            'storeBranches' => $this->getStoreBranches(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validateData($request);

        if ($request->hasFile('avatar')) {
            $data['avatar'] = $request->file('avatar')->store('avatars', 'public');
        }

        $data['role'] = 'admin';

        User::create($data);

        return redirect()
            ->route('backoffice.admin')
            ->with('status', 'Admin created successfully.');
    }

    public function update(Request $request, User $admin): RedirectResponse
    {
        abort_unless($admin->role === 'admin', 404);

        $data = $this->validateData($request, $admin->id, false);

        if ($request->hasFile('avatar')) {
            $this->deleteStoredAvatar($admin->avatar);
            $data['avatar'] = $request->file('avatar')->store('avatars', 'public');
        }

        if (empty($data['password'])) {
            unset($data['password']);
        }

        $admin->update($data);

        return redirect()
            ->route('backoffice.admin')
            ->with('status', 'Admin updated successfully.');
    }

    public function destroy(User $admin): RedirectResponse
    {
        abort_unless($admin->role === 'admin', 404);

        if ((int) $admin->id === (int) auth()->id()) {
            return redirect()
                ->route('backoffice.admin')
                ->with('status', 'You cannot delete the currently signed-in admin.');
        }

        $this->deleteStoredAvatar($admin->avatar);
        $admin->delete();

        return redirect()
            ->route('backoffice.admin')
            ->with('status', 'Admin deleted successfully.');
    }

    /**
     * @return array<string, mixed>
     */
    protected function validateData(Request $request, ?int $ignoreId = null, bool $passwordRequired = true): array
    {
        $countryCodes = array_column($this->getCountries(), 'code');

        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'avatar' => ['nullable', 'image', 'mimes:jpeg,jpg,png,webp', 'max:2048'],
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($ignoreId),
            ],
            'password' => $passwordRequired
                ? ['required', 'string', 'min:8', 'max:255']
                : ['nullable', 'string', 'min:8', 'max:255'],
            'phone' => ['required', 'string', 'max:255'],
            'country' => ['required', 'string', Rule::in($countryCodes)],
            'address' => ['required', 'string'],
            'assigned_branch_id' => ['required', 'integer', Rule::exists('store_branches', 'id')],
        ]);
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

        $unique = [];

        foreach ($countries as $country) {
            if (! is_array($country) || ! isset($country['code'], $country['name'])) {
                continue;
            }

            if (! is_string($country['code']) || ! is_string($country['name'])) {
                continue;
            }

            $unique[$country['code']] = [
                'code' => $country['code'],
                'name' => $country['name'],
            ];
        }

        return array_values($unique);
    }

    /**
     * @return array<int, array{id: int, name: string}>
     */
    protected function getStoreBranches(): array
    {
        return StoreBranch::query()
            ->orderBy('name')
            ->get(['id', 'name'])
            ->toArray();
    }

    protected function deleteStoredAvatar(?string $avatarPath): void
    {
        if (! $avatarPath || str_starts_with($avatarPath, '/') || str_starts_with($avatarPath, 'http')) {
            return;
        }

        if (Storage::disk('public')->exists($avatarPath)) {
            Storage::disk('public')->delete($avatarPath);
        }
    }
}
