<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $user = Auth::user();

        // 1. Jika login lewat Backoffice (backoffice.login.store)
        if ($request->routeIs('backoffice.login.store')) {
            if (!$user || !in_array($user->role, ['admin', 'super_admin'], true)) {
                Auth::guard('web')->logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'email' => 'Halaman ini hanya untuk Administrator.',
                ]);
            }

            $request->session()->regenerate();
            $request->session()->flash('login_status', 'success_admin');
            return redirect()->intended(route('backoffice.dashboard', absolute: false));
        }

        // 2. Jika login lewat customer frontend (route standar)
        if ($user && in_array($user->role, ['admin', 'super_admin'], true)) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
            throw \Illuminate\Validation\ValidationException::withMessages([
                'email' => 'Akun Administrator harus login melalui halaman Backoffice.',
            ]);
        }

        $request->session()->regenerate();
        $request->session()->flash('login_status', 'success_customer');

        if ($user && $user->role === 'customer') {
            return redirect()->intended(url()->previous());
        }

        return redirect()->intended(route('dashboard', absolute: false));
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $role = Auth::user()?->role;

        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        if (in_array($role, ['admin', 'super_admin'], true)) {
            $request->session()->flash('logout_status', 'success_admin');
            return redirect()->route('backoffice.login');
        }

        $request->session()->flash('logout_status', 'success_customer');
        return redirect('/');
    }
}
