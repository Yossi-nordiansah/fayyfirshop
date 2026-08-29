<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use Laravel\Socialite\Facades\Socialite;

class GoogleAuthController extends Controller
{
    /**
     * Redirect ke halaman login Google.
     */
    public function redirect(Request $request): RedirectResponse
    {
        if ($request->has('redirect') && $request->input('redirect')) {
            // Bersihkan ?login=1 dari URL intended agar modal login tidak terbuka kembali setelah berhasil login
            $intendedRedirect = $request->input('redirect');
            $parsedUrl = parse_url($intendedRedirect);
            if (isset($parsedUrl['query'])) {
                parse_str($parsedUrl['query'], $queryParams);
                unset($queryParams['login']);
                $cleanQuery = http_build_query($queryParams);
                $intendedRedirect = ($parsedUrl['scheme'] ?? 'https') . '://' . ($parsedUrl['host'] ?? '') .
                    (isset($parsedUrl['port']) ? ':' . $parsedUrl['port'] : '') .
                    ($parsedUrl['path'] ?? '/') .
                    ($cleanQuery ? '?' . $cleanQuery : '') .
                    (isset($parsedUrl['fragment']) ? '#' . $parsedUrl['fragment'] : '');
            }
            session(['url.intended' => $intendedRedirect]);
        }
        return Socialite::driver('google')->redirect();
    }

    /**
     * Handle callback dari Google OAuth.
     * Opsi B: Akun langsung aktif, profil bisa dilengkapi kemudian saat checkout.
     */
    public function callback(): RedirectResponse
    {
        try {
            $googleUser = Socialite::driver('google')->user();
        } catch (\Exception $e) {
            return redirect('/?login=1')->with('error', 'Login dengan Google gagal. Silakan coba lagi.');
        }

        // Cek apakah user dengan email ini sudah ada
        $user = User::where('email', $googleUser->getEmail())->first();

        if ($user) {
            $updateData = [];
            // User sudah ada — perbarui google_id jika belum terisi
            if (!$user->google_id) {
                $updateData['google_id'] = $googleUser->getId();
            }
            // Selalu perbarui avatar dengan gambar dari email Google
            $avatarUrl = $googleUser->getAvatar();
            if ($avatarUrl) {
                $updateData['avatar'] = $avatarUrl;
            }
            if (!empty($updateData)) {
                $user->update($updateData);
            }
        } else {
            // User baru — buat akun dengan data parsial dari Google
            // Avatar dari Google disimpan sebagai URL langsung
            $avatarUrl = $googleUser->getAvatar() ?? '/images/default-profile.png';

            $user = User::create([
                'name'       => $googleUser->getName(),
                'email'      => $googleUser->getEmail(),
                'google_id'  => $googleUser->getId(),
                'avatar'     => $avatarUrl,
                'password'   => bcrypt(Str::random(32)), // password random, tidak dipakai
                // Field alamat dibiarkan null — user bisa isi saat checkout atau di EditProfile
                'country'    => 'ID', // default Indonesia
                'phone'      => null,
                'address'    => null,
                'province'   => null,
                'city'       => null,
                'district'   => null,
                'postal_code'=> null,
                'receiver_name' => $googleUser->getName(),
            ]);
        }

        // Login user
        Auth::login($user, remember: true);

        // Ambil URL intended dari session
        $intendedUrl = session()->pull('url.intended', '/');

        // Jika url intended mengarah ke halaman login, ubah ke halaman utama
        if (str_contains($intendedUrl, '/login')) {
            $intendedUrl = '/';
        }

        // Bersihkan parameter ?login=1 dari URL agar tidak memicu modal login kembali terbuka di frontend
        $parsedIntended = parse_url($intendedUrl);
        if (isset($parsedIntended['query'])) {
            parse_str($parsedIntended['query'], $intendedParams);
            unset($intendedParams['login']);
            $cleanIntendedQuery = http_build_query($intendedParams);
            $intendedUrl = ($parsedIntended['scheme'] ?? '') .
                (isset($parsedIntended['scheme']) ? '://' : '') .
                ($parsedIntended['host'] ?? '') .
                (isset($parsedIntended['port']) ? ':' . $parsedIntended['port'] : '') .
                ($parsedIntended['path'] ?? '/') .
                ($cleanIntendedQuery ? '?' . $cleanIntendedQuery : '') .
                (isset($parsedIntended['fragment']) ? '#' . $parsedIntended['fragment'] : '');
        }

        return redirect()->to($intendedUrl);
    }
}
