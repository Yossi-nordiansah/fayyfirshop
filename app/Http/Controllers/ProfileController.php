<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

use App\Traits\ResolvesBiteshipArea;

class ProfileController extends Controller
{
    use ResolvesBiteshipArea;

    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('edit-profile/EditProfile', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => session('status'),
            'addresses' => $request->user()->addresses()->orderBy('is_default', 'desc')->get(),
        ]);
    }

    /**
     * Store a new shipping address.
     */
    public function storeAddress(Request $request)
    {
        $request->validate([
            'receiver_name' => 'required|string|max:255',
            'phone' => 'required|string|max:255',
            'country' => 'required|string|max:2',
            'province' => 'required_if:country,ID|nullable|string|max:255',
            'city' => 'required_if:country,ID|nullable|string|max:255',
            'district' => 'required_if:country,ID|nullable|string|max:255',
            'postal_code' => 'required|string|max:20',
            'address' => 'required|string|max:1000',
        ]);

        $user = $request->user();

        // Auto resolve Biteship Area ID if country is Indonesia
        $areaId = $this->resolveBiteshipAreaId(
            $request->country,
            $request->district,
            $request->city,
            $request->province,
            $request->postal_code
        );

        $user->addresses()->create([
            'receiver_name' => $request->receiver_name,
            'phone' => $request->phone,
            'country' => $request->country,
            'province' => $request->province ?: '',
            'city' => $request->city ?: '',
            'district' => $request->district ?: null,
            'postal_code' => $request->postal_code,
            'address' => $request->address,
            'area_id' => $areaId,
            'is_default' => $request->is_default ?? false,
        ]);

        return redirect()->back()->with('success', 'Alamat berhasil ditambahkan.');
    }

    /**
     * Update an existing shipping address.
     */
    public function updateAddress(Request $request, \App\Models\UserAddress $address)
    {
        if ($address->user_id !== $request->user()->id) {
            abort(403);
        }

        $request->validate([
            'receiver_name' => 'required|string|max:255',
            'phone' => 'required|string|max:255',
            'country' => 'required|string|max:2',
            'province' => 'required_if:country,ID|nullable|string|max:255',
            'city' => 'required_if:country,ID|nullable|string|max:255',
            'district' => 'required_if:country,ID|nullable|string|max:255',
            'postal_code' => 'required|string|max:20',
            'address' => 'required|string|max:1000',
        ]);

        // Auto resolve Biteship Area ID if country is Indonesia
        $areaId = $this->resolveBiteshipAreaId(
            $request->country,
            $request->district,
            $request->city,
            $request->province,
            $request->postal_code
        );

        $address->update([
            'receiver_name' => $request->receiver_name,
            'phone' => $request->phone,
            'country' => $request->country,
            'province' => $request->province ?: '',
            'city' => $request->city ?: '',
            'district' => $request->district ?: null,
            'postal_code' => $request->postal_code,
            'address' => $request->address,
            'area_id' => $areaId,
            'is_default' => $request->is_default ?? $address->is_default,
        ]);

        return redirect()->back()->with('success', 'Alamat berhasil diperbarui.');
    }

    /**
     * Delete a shipping address.
     */
    public function destroyAddress(Request $request, \App\Models\UserAddress $address)
    {
        if ($address->user_id !== $request->user()->id) {
            abort(403);
        }

        $address->delete();

        return redirect()->back()->with('success', 'Alamat berhasil dihapus.');
    }

    /**
     * Set a shipping address as default.
     */
    public function setDefaultAddress(Request $request, \App\Models\UserAddress $address)
    {
        if ($address->user_id !== $request->user()->id) {
            abort(403);
        }

        $address->update(['is_default' => true]);

        return redirect()->back()->with('success', 'Alamat utama berhasil diubah.');
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $user = $request->user();
        $data = $request->validated();

        // Handle avatar upload if present
        if ($request->hasFile('avatar')) {
            $avatarPath = $request->file('avatar')->store('avatars', 'public');
            $data['avatar'] = $avatarPath;
        }

        // Handle optional password update
        if (!empty($data['password'])) {
            $data['password'] = \Illuminate\Support\Facades\Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        // Auto resolve Biteship Area ID if country is Indonesia
        $country = $request->input('country', $user->country ?? 'ID');
        $areaId = $this->resolveBiteshipAreaId(
            $country,
            $data['district'] ?? null,
            $data['city'] ?? null,
            $data['province'] ?? null,
            $data['postal_code'] ?? null
        );
        if ($areaId) {
            $data['area_id'] = $areaId;
        }

        $user->fill($data);

        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }

        $user->save();

        return redirect()->intended(route('profile.edit'))->with('status', 'profile-updated');
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }
}
