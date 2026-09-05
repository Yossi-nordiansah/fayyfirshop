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
        $intendedRedirect = null;
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
            session()->save();
        }

        $params = ['prompt' => 'select_account'];
        if ($intendedRedirect) {
            $params['state'] = base64_encode(json_encode(['intended' => $intendedRedirect]));
        }

        return Socialite::driver('google')
            ->stateless()
            ->with($params)
            ->redirect();
    }

    /**
     * Handle callback dari Google OAuth.
     * Opsi B: Akun langsung aktif, profil bisa dilengkapi kemudian saat checkout.
     */
    public function callback(Request $request): RedirectResponse
    {
        try {
            $googleUser = Socialite::driver('google')->stateless()->user();
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Google OAuth callback failed: ' . $e->getMessage(), [
                'exception' => $e,
            ]);
            return redirect('/?login=1')->with('error', 'Login dengan Google gagal. Silakan coba lagi.');
        }

        $googleId = $googleUser->getId();
        $googleEmail = strtolower(trim($googleUser->getEmail() ?? ''));

        // 1. Cari user berdasarkan google_id terlebih dahulu
        $user = User::where('google_id', $googleId)->first();

        // 2. Jika tidak ditemukan berdasarkan google_id, cari berdasarkan email Google
        if (!$user && !empty($googleEmail)) {
            $user = User::where('email', $googleEmail)->first();
            if ($user) {
                // Tautkan google_id ke user yang sudah terdaftar dengan email ini
                $user->update(['google_id' => $googleId]);
            }
        }

        if ($user) {
            $updateData = [];
            // Update avatar dari Google jika ada perubahan
            $avatarUrl = $googleUser->getAvatar();
            if ($avatarUrl && $user->avatar !== $avatarUrl) {
                $updateData['avatar'] = $avatarUrl;
            }
            if (!empty($updateData)) {
                $user->update($updateData);
            }
        } else {
            // User baru — buat akun dengan data dari Google
            $avatarUrl = $googleUser->getAvatar() ?? '/images/default-profile.png';

            $user = User::create([
                'name'          => $googleUser->getName(),
                'email'         => $googleEmail,
                'google_id'     => $googleId,
                'avatar'        => $avatarUrl,
                'password'      => bcrypt(Str::random(32)),
                'country'       => 'ID',
                'phone'         => null,
                'address'       => null,
                'province'      => null,
                'city'          => null,
                'district'      => null,
                'postal_code'   => null,
                'receiver_name' => $googleUser->getName(),
            ]);
        }

        // Ambil URL intended SEBELUM session di-invalidate
        $intendedUrl = session()->pull('url.intended');
        if (!$intendedUrl && $request->has('state')) {
            try {
                $decoded = json_decode(base64_decode($request->input('state')), true);
                if (isset($decoded['intended']) && is_string($decoded['intended'])) {
                    $intendedUrl = $decoded['intended'];
                }
            } catch (\Throwable $t) {
                // Ignore parse errors
            }
        }
        $intendedUrl = $intendedUrl ?: '/';

        // Jika sebelumnya ada sesi user yang aktif, logout dan bersihkan
        if (Auth::check()) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
        }

        // Login user yang benar
        Auth::login($user, remember: true);

        // Regenerate session ID untuk keamanan dan membersihkan session stale
        $request->session()->regenerate();
        $request->session()->flash('login_status', 'success_customer');

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
