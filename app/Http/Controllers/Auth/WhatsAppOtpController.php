<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class WhatsAppOtpController extends Controller
{
    /**
     * Normalize nomor WA ke format internasional (628xxxxxxx)
     */
    private function normalizePhone(string $phone): string
    {
        $phone = preg_replace('/\D/', '', $phone);

        if (str_starts_with($phone, '0')) {
            $phone = '62' . substr($phone, 1);
        }

        return $phone;
    }

    /**
     * Endpoint A: Request OTP
     * POST /auth/whatsapp/request-otp
     */
    public function requestOtp(Request $request)
    {
        $request->validate([
            'phone' => ['required', 'string', 'min:9', 'max:20'],
        ]);

        $phone = $this->normalizePhone($request->phone);

        // Rate limit: max 3 requests per 10 menit untuk nomor yang sama
        $recentCount = DB::table('whatsapp_otps')
            ->where('phone', $phone)
            ->where('created_at', '>=', Carbon::now()->subMinutes(10))
            ->count();

        if ($recentCount >= 3) {
            return response()->json([
                'message' => 'Terlalu banyak permintaan. Coba lagi dalam beberapa menit.',
            ], 429);
        }

        // Hapus OTP lama untuk nomor ini
        DB::table('whatsapp_otps')->where('phone', $phone)->delete();

        // Generate OTP 6 digit
        $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $expiresAt = Carbon::now()->addMinutes(5);

        // Simpan OTP ke database
        DB::table('whatsapp_otps')->insert([
            'phone'      => $phone,
            'otp'        => $otp,
            'expires_at' => $expiresAt,
            'created_at' => Carbon::now(),
        ]);

        // Kirim OTP via WhatsApp
        $sent = $this->sendWhatsAppMessage($phone, $otp);

        if (!$sent) {
            // Rollback OTP jika pengiriman gagal
            DB::table('whatsapp_otps')->where('phone', $phone)->delete();

            return response()->json([
                'message' => 'Gagal mengirim kode OTP. Pastikan nomor WhatsApp Anda aktif dan coba lagi.',
            ], 500);
        }

        return response()->json([
            'message' => 'Kode OTP telah dikirim ke WhatsApp Anda.',
            'phone'   => '+' . substr($phone, 0, 2) . 'x-xxxx-' . substr($phone, -4),
        ]);
    }

    /**
     * Endpoint B: Verify OTP & Login
     * POST /auth/whatsapp/verify-otp
     */
    public function verifyOtp(Request $request)
    {
        $request->validate([
            'phone' => ['required', 'string'],
            'otp'   => ['required', 'string', 'size:6'],
        ]);

        $phone = $this->normalizePhone($request->phone);

        // Cari OTP yang valid
        $record = DB::table('whatsapp_otps')
            ->where('phone', $phone)
            ->where('otp', $request->otp)
            ->where('expires_at', '>=', Carbon::now())
            ->first();

        if (!$record) {
            // Cek apakah OTP ada tapi expired
            $expired = DB::table('whatsapp_otps')
                ->where('phone', $phone)
                ->where('otp', $request->otp)
                ->where('expires_at', '<', Carbon::now())
                ->exists();

            return response()->json([
                'message' => $expired
                    ? 'Kode OTP sudah kedaluwarsa. Silakan minta kode baru.'
                    : 'Kode OTP tidak valid. Periksa kode yang dikirim ke WhatsApp Anda.',
            ], 422);
        }

        // Hapus OTP agar tidak bisa dipakai ulang
        DB::table('whatsapp_otps')->where('phone', $phone)->delete();

        // Cari atau buat user berdasarkan nomor WA
        $user = User::where('phone', $phone)->first();

        if (!$user) {
            // Buat akun baru dengan data minimal
            $user = User::create([
                'name'     => 'Pengguna WA ' . substr($phone, -4),
                'email'    => $phone . '@wa.fayyfirshop.com', // email placeholder unik
                'phone'    => $phone,
                'password' => bcrypt(\Illuminate\Support\Str::random(32)),
                'role'     => 'customer',
                'country'  => 'ID',
            ]);
        }

        // Login user
        Auth::login($user, remember: true);
        $request->session()->regenerate();

        $redirectUrl = $request->input('redirect') ?: url()->previous() ?: '/';
        if (str_contains($redirectUrl, '/login') || str_contains($redirectUrl, '/register')) {
            $redirectUrl = '/';
        }

        return response()->json([
            'message'  => 'Login berhasil!',
            'redirect' => $redirectUrl,
        ]);
    }

    /**
     * Kirim pesan OTP via WhatsApp Business API
     * Menggunakan free-form text message (untuk testing / sandbox)
     */
    private function sendWhatsAppMessage(string $phone, string $otp): bool
    {
        $phoneNumberId = config('services.whatsapp.phone_number_id');
        $accessToken   = config('services.whatsapp.access_token');
        $apiVersion    = config('services.whatsapp.api_version', 'v25.0');
        $templateName  = config('services.whatsapp.template_name');

        $url = "https://graph.facebook.com/{$apiVersion}/{$phoneNumberId}/messages";

        try {
            if ($templateName) {
                // Mode template (production)
                $payload = [
                    'messaging_product' => 'whatsapp',
                    'to'                => $phone,
                    'type'              => 'template',
                    'template'          => [
                        'name'     => $templateName,
                        'language' => ['code' => config('services.whatsapp.template_lang', 'id')],
                        'components' => [
                            [
                                'type'       => 'body',
                                'parameters' => [
                                    ['type' => 'text', 'text' => $otp],
                                ],
                            ],
                        ],
                    ],
                ];
            } else {
                // Mode free-form text (testing/sandbox)
                $payload = [
                    'messaging_product' => 'whatsapp',
                    'to'                => $phone,
                    'type'              => 'text',
                    'text'              => [
                        'body' => "*Fayyfir Shop* — Kode verifikasi Anda: *{$otp}*\n\nKode berlaku selama 5 menit. Jangan bagikan kode ini kepada siapapun.",
                    ],
                ];
            }

            $response = Http::withToken($accessToken)
                ->timeout(10)
                ->post($url, $payload);

            if ($response->failed()) {
                Log::error('WhatsApp OTP send failed', [
                    'phone'    => $phone,
                    'status'   => $response->status(),
                    'response' => $response->json(),
                ]);
                return false;
            }

            Log::info('WhatsApp OTP sent', [
                'phone' => $phone,
                'otp_masked' => '***' . substr($otp, -2),
                'response' => $response->json(),
            ]);
            return true;
        } catch (\Exception $e) {
            Log::error('WhatsApp OTP exception', ['error' => $e->getMessage()]);
            return false;
        }
    }
}
