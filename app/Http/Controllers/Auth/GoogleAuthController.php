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
     * Dapatkan Google Redirect URI yang konsisten antara redirect dan callback.
     * Otomatis disesuaikan dengan domain yang sedang aktif sesuai Authorized redirect URIs Google Console.
     */
    protected function getGoogleRedirectUrl(Request $request): string
    {
        $host = strtolower($request->getHost());

        // 1. Cocokkan dengan 5 Authorized redirect URIs yang didaftarkan di Google Cloud Console
        if ($host === 'rc.fayyfirshop.com') {
            return 'https://rc.fayyfirshop.com/auth/google/callback';
        }

        if ($host === 'fayyfirstaging.my.id') {
            return 'https://fayyfirstaging.my.id/auth/google/callback';
        }

        if ($host === 'fayyfirshop.com' || $host === 'www.fayyfirshop.com') {
            return 'https://fayyfirshop.com/auth/google/callback';
        }

        if ($host === '127.0.0.1') {
            $port = $request->getPort();
            $portStr = ($port && $port != 80 && $port != 443) ? ':' . $port : ':8000';
            return 'http://127.0.0.1' . $portStr . '/auth/google/callback';
        }

        if ($host === 'localhost') {
            $port = $request->getPort();
            $portStr = ($port && $port != 80 && $port != 443) ? ':' . $port : ':8000';
            return 'http://localhost' . $portStr . '/auth/google/callback';
        }

        // 2. Gunakan config services.google.redirect jika ada dan host cocok
        $redirectUrl = config('services.google.redirect');
        if ($redirectUrl) {
            return $redirectUrl;
        }

        // 3. Fallback dinamis dengan deteksi scheme HTTPS yang aman
        $scheme = ($request->isSecure() || $request->header('X-Forwarded-Proto') === 'https') ? 'https' : $request->getScheme();
        return $scheme . '://' . $request->getHttpHost() . '/auth/google/callback';
    }

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
                if (!empty($parsedUrl['host'])) {
                    $intendedRedirect = ($parsedUrl['scheme'] ?? 'https') . '://' . $parsedUrl['host'] .
                        (isset($parsedUrl['port']) ? ':' . $parsedUrl['port'] : '') .
                        ($parsedUrl['path'] ?? '/') .
                        ($cleanQuery ? '?' . $cleanQuery : '') .
                        (isset($parsedUrl['fragment']) ? '#' . $parsedUrl['fragment'] : '');
                } else {
                    $intendedRedirect = ($parsedUrl['path'] ?? '/') .
                        ($cleanQuery ? '?' . $cleanQuery : '') .
                        (isset($parsedUrl['fragment']) ? '#' . $parsedUrl['fragment'] : '');
                }
            }
            session(['url.intended' => $intendedRedirect]);
            session()->save();
        }

        $params = ['prompt' => 'select_account'];
        if ($intendedRedirect) {
            $params['state'] = base64_encode(json_encode(['intended' => $intendedRedirect]));
        }

        $redirectUrl = $this->getGoogleRedirectUrl($request);

        \Illuminate\Support\Facades\Log::info('Google OAuth Redirect URI sent to Google: ' . $redirectUrl, [
            'request_host' => $request->getHost(),
            'config_redirect' => config('services.google.redirect'),
        ]);

        return Socialite::driver('google')
            ->redirectUrl($redirectUrl)
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
        $redirectUrl = $this->getGoogleRedirectUrl($request);

        try {
            $googleUser = Socialite::driver('google')
                ->redirectUrl($redirectUrl)
                ->stateless()
                ->user();

        $googleId = $googleUser->getId();
        $googleEmail = strtolower(trim($googleUser->getEmail() ?? ''));

        // 1. Cari user berdasarkan google_id terlebih dahulu
        $user = User::where('google_id', $googleId)->first();

        // 2. Jika tidak ditemukan berdasarkan google_id, cari berdasarkan email Google
        if (!$user && !empty($googleEmail)) {
            $user = User::where('email', $googleEmail)->first();
            if ($user) {
                // Tautkan google_id ke user yang sudah terdaftar dengan email ini
                $user->update([
                    'google_id' => $googleId,
                    'email_verified_at' => $user->email_verified_at ?: now(),
                ]);
            }
        }

        if ($user) {
            $updateData = [];
            if (!$user->email_verified_at) {
                $updateData['email_verified_at'] = now();
            }
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
                'name'              => $googleUser->getName() ?: 'Pelanggan',
                'email'             => $googleEmail,
                'email_verified_at' => now(),
                'google_id'         => $googleId,
                'avatar'            => $avatarUrl,
                'password'          => bcrypt(Str::random(32)),
                'country'           => 'ID',
                'role'              => 'customer',
                'phone'             => null,
                'address'           => null,
                'province'          => null,
                'city'              => null,
                'district'          => null,
                'postal_code'       => null,
                'receiver_name'     => $googleUser->getName() ?: 'Pelanggan',
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

        // Pastikan session tersimpan ke storage/database sebelum redirect ke browser
        $request->session()->save();

        // Jika url intended mengarah ke halaman login atau register, ubah ke halaman utama
        if (str_contains($intendedUrl, '/login') || str_contains($intendedUrl, '/register')) {
            $intendedUrl = '/';
        }

        // Bersihkan parameter ?login=1 dari URL agar tidak memicu modal login kembali terbuka di frontend
        $parsedIntended = parse_url($intendedUrl);
        if (isset($parsedIntended['query'])) {
            parse_str($parsedIntended['query'], $intendedParams);
            unset($intendedParams['login']);
            $cleanIntendedQuery = http_build_query($intendedParams);
            if (!empty($parsedIntended['host'])) {
                $intendedUrl = ($parsedIntended['scheme'] ?? 'https') . '://' .
                    $parsedIntended['host'] .
                    (isset($parsedIntended['port']) ? ':' . $parsedIntended['port'] : '') .
                    ($parsedIntended['path'] ?? '/') .
                    ($cleanIntendedQuery ? '?' . $cleanIntendedQuery : '') .
                    (isset($parsedIntended['fragment']) ? '#' . $parsedIntended['fragment'] : '');
            } else {
                $intendedUrl = ($parsedIntended['path'] ?? '/') .
                    ($cleanIntendedQuery ? '?' . $cleanIntendedQuery : '') .
                    (isset($parsedIntended['fragment']) ? '#' . $parsedIntended['fragment'] : '');
            }
        }

        // Jaga konsistensi domain intendedUrl dengan host callback saat ini
            // agar session cookie tidak hilang karena perbedaan www vs non-www
            $intendedHost = parse_url($intendedUrl, PHP_URL_HOST);
            $currentHost = $request->getHost();
            if ($intendedHost && strtolower($intendedHost) !== strtolower($currentHost)) {
                $intendedScheme = parse_url($intendedUrl, PHP_URL_SCHEME) ?? 'https';
                $intendedPath = parse_url($intendedUrl, PHP_URL_PATH) ?? '/';
                $intendedQuery = parse_url($intendedUrl, PHP_URL_QUERY);
                $intendedUrl = $intendedScheme . '://' . $currentHost . $intendedPath . ($intendedQuery ? '?' . $intendedQuery : '');
            }

            return redirect()->to($intendedUrl);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Google OAuth callback failed: ' . $e->getMessage(), [
                'exception' => $e,
                'redirect_url' => $redirectUrl,
                'request_host' => $request->getHost(),
            ]);
            return redirect('/?login=1')->with('error', 'Login dengan Google gagal: ' . $e->getMessage());
        }
    }
}
