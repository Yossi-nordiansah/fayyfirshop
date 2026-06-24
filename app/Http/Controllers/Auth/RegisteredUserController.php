<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

use App\Traits\ResolvesBiteshipArea;

class RegisteredUserController extends Controller
{
    use ResolvesBiteshipArea;

    public function create(): Response
    {
        $user = auth()->user();
        if ($user && $user->phone && $user->address && $user->city && $user->receiver_name) {
            return redirect('/');
        }
        return Inertia::render('register/Register');
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $user = auth()->user();

        if ($user) {
            // Logged in user completing their profile (e.g. from Google login)
            $request->validate([
                'avatar' => 'nullable|image|mimes:jpeg,jpg,png,webp|max:2048',
                'phone' => 'required|string|max:255',
                'addresses' => 'required|array|min:1',
                'addresses.*.receiver_name' => 'required|string|max:255',
                'addresses.*.phone' => 'required|string|max:255',
                'addresses.*.country' => 'required|string|max:2',
                'addresses.*.province' => 'nullable|string|max:255',
                'addresses.*.city' => 'nullable|string|max:255',
                'addresses.*.district' => 'nullable|string|max:255',
                'addresses.*.postal_code' => 'required|string|max:20',
                'addresses.*.address' => 'required|string|max:1000',
            ]);

            // Validate Indonesian addresses
            foreach ($request->addresses as $idx => $addr) {
                if (($addr['country'] ?? 'ID') === 'ID') {
                    if (empty($addr['province']) || empty($addr['city'])) {
                        throw ValidationException::withMessages([
                            "addresses.{$idx}.province" => 'Provinsi dan Kota wajib diisi untuk alamat Indonesia.',
                        ]);
                    }
                }
            }

            $updateData = [];
            if ($request->hasFile('avatar')) {
                $avatarPath = $request->file('avatar')->store('avatars', 'public');
                $updateData['avatar'] = $avatarPath;
            }

            $user->update(array_merge([
                'phone' => $request->phone,
            ], $updateData));

            // Clean up existing addresses to sync new ones
            $user->addresses()->delete();

            foreach ($request->addresses as $idx => $addr) {
                $areaId = $this->resolveBiteshipAreaId(
                    $addr['country'],
                    $addr['district'] ?? null,
                    $addr['city'] ?? null,
                    $addr['province'] ?? null,
                    $addr['postal_code'] ?? null
                );

                $user->addresses()->create([
                    'receiver_name' => $addr['receiver_name'],
                    'phone' => $addr['phone'],
                    'country' => $addr['country'],
                    'province' => $addr['province'] ?? '',
                    'city' => $addr['city'] ?? '',
                    'district' => $addr['district'] ?? null,
                    'postal_code' => $addr['postal_code'],
                    'address' => $addr['address'],
                    'area_id' => $areaId,
                    'is_default' => $idx === 0,
                ]);
            }

            return redirect()->intended('/')->with('success', 'Profil Anda telah berhasil dilengkapi.');
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'avatar' => 'nullable|image|mimes:jpeg,jpg,png,webp|max:2048',
            'addresses' => 'required|array|min:1',
            'addresses.*.receiver_name' => 'required|string|max:255',
            'addresses.*.phone' => 'required|string|max:255',
            'addresses.*.country' => 'required|string|max:2',
            'addresses.*.province' => 'nullable|string|max:255',
            'addresses.*.city' => 'nullable|string|max:255',
            'addresses.*.district' => 'nullable|string|max:255',
            'addresses.*.postal_code' => 'required|string|max:20',
            'addresses.*.address' => 'required|string|max:1000',
        ]);

        // Validate Indonesian addresses
        foreach ($request->addresses as $idx => $addr) {
            if (($addr['country'] ?? 'ID') === 'ID') {
                if (empty($addr['province']) || empty($addr['city'])) {
                    throw ValidationException::withMessages([
                        "addresses.{$idx}.province" => 'Provinsi dan Kota wajib diisi untuk alamat Indonesia.',
                    ]);
                }
            }
        }

        // Handle avatar upload or use default
        if ($request->hasFile('avatar')) {
            $avatarPath = $request->file('avatar')->store('avatars', 'public');
        } else {
            $avatarPath = '/images/default-profile.png';
        }

        $newUser = User::create([
            'name' => $request->name,
            'avatar' => $avatarPath,
            'email' => $request->email,
            'phone' => $request->addresses[0]['phone'],
            'password' => Hash::make($request->password),
        ]);

        foreach ($request->addresses as $idx => $addr) {
            $areaId = $this->resolveBiteshipAreaId(
                $addr['country'],
                $addr['district'] ?? null,
                $addr['city'] ?? null,
                $addr['province'] ?? null,
                $addr['postal_code'] ?? null
            );

            $newUser->addresses()->create([
                'receiver_name' => $addr['receiver_name'],
                'phone' => $addr['phone'],
                'country' => $addr['country'],
                'province' => $addr['province'] ?? '',
                'city' => $addr['city'] ?? '',
                'district' => $addr['district'] ?? null,
                'postal_code' => $addr['postal_code'],
                'address' => $addr['address'],
                'area_id' => $areaId,
                'is_default' => $idx === 0,
            ]);
        }

        event(new Registered($newUser));

        // Do not automatically log in the user, redirect to home page and trigger login modal
        return redirect('/?login=1')->with('status', 'registered');
    }
}
