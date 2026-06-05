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
        return Inertia::render('register/Register');
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'country' => 'required|string|max:2',
            'phone' => 'required|string|max:255',
            'address' => 'required|string|max:1000',
            'city' => 'required|string|max:255',
            'province' => 'required_if:country,ID|nullable|string|max:255',
            'district' => 'required_if:country,ID|nullable|string|max:255',
            'postal_code' => 'required|string|max:20',
            'receiver_name' => 'required|string|max:255',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'avatar' => 'nullable|image|mimes:jpeg,jpg,png,webp|max:2048',
        ]);

        // Handle avatar upload or use default
        if ($request->hasFile('avatar')) {
            $avatarPath = $request->file('avatar')->store('avatars', 'public');
        } else {
            $avatarPath = '/images/default-profile.png';
        }

        // Auto resolve Biteship Area ID if country is Indonesia
        $areaId = $this->resolveBiteshipAreaId(
            $request->country,
            $request->district,
            $request->city,
            $request->province,
            $request->postal_code
        );

        $user = User::create([
            'name' => $request->name,
            'avatar' => $avatarPath,
            'email' => $request->email,
            'country' => $request->country,
            'phone' => $request->phone,
            'address' => $request->address,
            'city' => $request->city,
            'district' => $request->district,
            'province' => $request->province,
            'receiver_name' => $request->receiver_name,
            'postal_code' => $request->postal_code,
            'password' => Hash::make($request->password),
            'area_id' => $areaId,
        ]);

        event(new Registered($user));

        // Do not automatically log in the user, redirect to home page and trigger login modal
        return redirect('/?login=1')->with('status', 'registered');
    }
}
