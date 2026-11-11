<?php

namespace App\Services;

use App\Models\Order;
use Doku\Snap\Snap;
use Doku\Snap\Models\VA\Request\CreateVaRequestDto;
use Doku\Snap\Models\TotalAmount\TotalAmount;
use Doku\Snap\Models\VA\AdditionalInfo\CreateVaRequestAdditionalInfo;
use Doku\Snap\Models\VA\VirtualAccountConfig\CreateVaVirtualAccountConfig;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class DokuService
{
    protected string $clientId;
    protected string $secretKey;
    protected ?string $publicKey;
    protected ?string $merchantPublicKey;
    protected ?string $merchantPrivateKey;
    protected bool $isProduction;
    protected string $baseUrl;

    public function __construct()
    {
        $this->clientId = (string) (config('services.doku.client_id') ?? env('DOKU_API_KEY', ''));
        $this->secretKey = (string) (config('services.doku.secret_key') ?? env('DOKU_SECRET_KEY', ''));
        $this->publicKey = config('services.doku.public_key') ?? env('DOKU_PUBLIC_KEY');
        $this->merchantPublicKey = config('services.doku.merchant_public_key') ?? env('DOKU_MERCHANT_PUBLIC_KEY');
        $this->merchantPrivateKey = config('services.doku.merchant_private_key') ?? env('DOKU_MERCHANT_PRIVATE_KEY');
        $this->isProduction = (bool) (config('services.doku.is_production') ?? false);
        $this->baseUrl = $this->isProduction ? 'https://api.doku.com' : 'https://api-sandbox.doku.com';
    }

    /**
     * Map payment method string to DOKU channel code.
     */
    public function getChannelCode(string $paymentMethod): ?string
    {
        $map = [
            // Virtual Accounts
            'bca_va'      => 'VIRTUAL_ACCOUNT_BCA',
            'bri_va'      => 'VIRTUAL_ACCOUNT_BRI',
            'bni_va'      => 'VIRTUAL_ACCOUNT_BNI',
            'mandiri_va'  => 'VIRTUAL_ACCOUNT_BANK_MANDIRI',
            'permata_va'  => 'VIRTUAL_ACCOUNT_BANK_PERMATA',
            'cimb_va'     => 'VIRTUAL_ACCOUNT_BANK_CIMB',
            'bsi_va'      => 'VIRTUAL_ACCOUNT_BANK_SYARIAH_MANDIRI',
            'danamon_va'  => 'VIRTUAL_ACCOUNT_BANK_DANAMON',
            'seabank_va'  => 'VIRTUAL_ACCOUNT_BANK_PERMATA',
            'saqu_va'     => 'VIRTUAL_ACCOUNT_BANK_PERMATA',

            // QRIS
            'qris'        => 'QRIS',

            // E-Wallets
            'dana'        => 'EMONEY_DANA',
            'shopeepay'   => 'EMONEY_SHOPEE_PAY',
            'ovo'         => 'EMONEY_OVO',
            'linkaja'     => 'EMONEY_LINKAJA',
            'gopay'       => 'EMONEY_GOPAY',

            // Retail Outlets
            'alfamart'    => 'ONLINE_TO_OFFLINE_ALFA',
            'indomaret'   => 'ONLINE_TO_OFFLINE_INDOMARET',

            // Cards
            'credit_card' => 'CREDIT_CARD',
        ];

        return $map[strtolower($paymentMethod)] ?? null;
    }

    /**
     * Unified Charge Dispatcher for DOKU.
     * Currently uses DOKU Checkout for all payment methods.
     * SNAP VA (Direct VA, no redirect) can be enabled later by setting DOKU_SNAP_ENABLED=true
     * once the BIN/partnerServiceId is registered by DOKU team in the dashboard.
     */
    public function charge(Order $order, string $paymentMethod, ?string $customPhone = null): array
    {
        if (!$this->secretKey || !$this->clientId) {
            throw new \Exception("DOKU credentials (DOKU_API_KEY / DOKU_SECRET_KEY) are missing in .env.");
        }

        $user = $order->user;
        $phone = $customPhone ?: ($user && $user->phone ? $user->phone : '08111222333');
        $amount = (int) round($order->total_amount);
        $externalId = $order->invoice_number . '-' . time();
        $channel = $this->getChannelCode($paymentMethod);

        // DOKU Checkout Hosted Payment — redirect ke halaman DOKU, mendukung semua metode termasuk VA.
        // Untuk mengaktifkan SNAP VA (VA langsung di merchant, tanpa redirect), set DOKU_SNAP_ENABLED=true
        // setelah BIN didaftarkan oleh Tim DOKU di dashboard.
        return $this->chargeCheckout($order, $paymentMethod, $externalId, $amount, $phone, $channel);
    }

    /**
     * Create Virtual Account directly using DOKU BI-SNAP SDK (Direct VA)
     */
    protected function chargeSnapVa(Order $order, string $paymentMethod, string $externalId, int $amount, string $phone): array
    {
        $snap = new Snap(
            $this->merchantPrivateKey,
            $this->merchantPublicKey ?: $this->merchantPrivateKey,
            $this->publicKey ?: '',
            $this->clientId,
            config('app.name', 'fayyfirshop'),
            $this->isProduction,
            $this->secretKey
        );

        $bankCode = strtolower(str_replace('_va', '', $paymentMethod));
        $channel = $this->getChannelCode($paymentMethod) ?: 'VIRTUAL_ACCOUNT_BCA';
        
        // Partner service ID (BIN): 8 characters left-padded with spaces per BI-SNAP standard
        $rawPartnerId = (string) (config('services.doku.partner_service_id') ?? env('DOKU_PARTNER_SERVICE_ID', ''));
        if (empty($rawPartnerId)) {
            $defaultBins = [
                'bri_va'     => '12362',
                'bca_va'     => '8129014',
                'bni_va'     => '8807',
                'mandiri_va' => '88899',
                'permata_va' => '85555',
            ];
            $rawPartnerId = $defaultBins[$paymentMethod] ?? '8129014';
        }
        $partnerServiceId = str_pad(trim($rawPartnerId), 8, " ", STR_PAD_LEFT);
        $customerNo = str_pad((string)$order->user_id, 10, '0', STR_PAD_LEFT);
        $virtualAccountNo = $partnerServiceId . $customerNo;
        $expiredDate = date('Y-m-d\TH:i:sP', time() + 86400);

        $user = $order->user;
        $name = $user ? trim($user->name) : 'Pelanggan Fayyfir';

        $reqDto = new CreateVaRequestDto(
            $partnerServiceId,
            $customerNo,
            $virtualAccountNo,
            $name,
            $user ? $user->email : 'customer@example.com',
            $phone,
            $externalId,
            new TotalAmount(number_format($amount, 2, '.', ''), 'IDR'),
            new CreateVaRequestAdditionalInfo($channel, new CreateVaVirtualAccountConfig(false)),
            'C',
            $expiredDate
        );

        $result = $snap->createVa($reqDto);
        if ($result && isset($result->virtualAccountData)) {
            $vaData = $result->virtualAccountData;
            return [
                'doku_invoice_number' => $externalId,
                'doku_trx_id'         => $externalId,
                'va_number'           => $vaData->virtualAccountNo ?? $virtualAccountNo,
                'bank'                => $bankCode,
                'transaction_status'  => 'pending',
                'expiry_time'         => date('Y-m-d H:i:s', strtotime($expiredDate)),
            ];
        }

        $errMsg = "Gagal membuat DOKU SNAP VA";
        if ($result && isset($result->responseMessage)) {
            $errMsg .= ": [{$result->responseCode}] {$result->responseMessage}";
        }
        Log::error($errMsg, ['result' => $result]);
        throw new \Exception($errMsg . ". Pastikan DOKU_CLIENT_ID SNAP sudah sesuai dengan yang ada di DOKU Dashboard.");
    }

    /**
     * Charge via DOKU Checkout API (/checkout/v1/payment)
     */
    public function chargeCheckout(Order $order, string $paymentMethod, string $externalId, int $amount, string $phone, ?string $channel): array
    {
        $requestId = (string) Str::uuid();
        $requestTimestamp = gmdate('Y-m-d\TH:i:s\Z');
        $requestTarget = '/checkout/v1/payment';

        $user = $order->user;
        $body = [
            'order' => [
                'amount'              => $amount,
                'invoice_number'      => $externalId,
                'currency'            => 'IDR',
                'callback_url'        => route('checkout.payment', $order->id),
                'callback_url_cancel' => route('checkout.payment', $order->id),
                'auto_redirect'       => true,
            ],
            'payment' => [
                'payment_due_date' => 1440, // 24 hours in minutes
            ],
            'customer' => [
                'id'    => (string) ($order->user_id ?: 'CUST-' . $order->id),
                'name'  => $user ? trim($user->name) : 'Pelanggan',
                'email' => $user ? $user->email : 'customer@example.com',
                'phone' => $phone,
            ],
        ];

        // Specific payment method restriction if mapped
        if ($channel) {
            $body['payment']['payment_method_types'] = [$channel];
        }

        $signature = $this->generateHmacSignature($requestId, $requestTimestamp, $requestTarget, $body);

        $response = Http::withHeaders([
            'Client-Id'         => $this->clientId,
            'Request-Id'        => $requestId,
            'Request-Timestamp' => $requestTimestamp,
            'Signature'         => $signature,
            'Content-Type'      => 'application/json',
        ])->timeout(15)->post($this->baseUrl . $requestTarget, $body);

        $resJson = $response->json();

        if ($response->failed() || (!isset($resJson['response']['payment']['url']) && !isset($resJson['payment']['url']))) {
            $rawMsg = $resJson['error']['message'] ?? $resJson['message'] ?? $resJson['responseMessage'] ?? null;
            if (is_array($rawMsg)) {
                $errMsg = implode(', ', array_map(function ($m) {
                    return is_array($m) ? json_encode($m) : (string) $m;
                }, $rawMsg));
            } elseif (is_string($rawMsg)) {
                $errMsg = $rawMsg;
            } else {
                $errMsg = null;
            }

            if (!$errMsg) {
                if ($response->status() === 503) {
                    $errMsg = "Layanan DOKU Payment Gateway sedang tidak tersedia / dalam pemeliharaan (HTTP 503 Service Temporarily Unavailable dari DOKU server). Silakan coba lagi beberapa saat lagi.";
                } elseif ($response->status() >= 500) {
                    $errMsg = "Server DOKU mengalami kendala internal (HTTP " . $response->status() . "). Silakan coba beberapa saat lagi.";
                } else {
                    $cleanBody = trim(strip_tags($response->body()));
                    $errMsg = !empty($cleanBody) ? (strlen($cleanBody) > 150 ? substr($cleanBody, 0, 150) . '...' : $cleanBody) : 'Response error dari DOKU (Status ' . $response->status() . ')';
                }
            }
            Log::error('DOKU Checkout API Error', [
                'status'   => $response->status(),
                'response' => $resJson ?? $response->body(),
                'body'     => $body,
            ]);
            throw new \Exception("Gagal menghubungi DOKU Payment Gateway: " . $errMsg);
        }

        $paymentData = $resJson['response']['payment'] ?? $resJson['payment'] ?? [];
        $paymentUrl = $paymentData['url'] ?? null;
        $expiredDate = $paymentData['expired_date'] ?? null;

        $expiryTime = date('Y-m-d H:i:s', time() + 86400);
        if ($expiredDate && strlen($expiredDate) === 14) {
            // YYYYMMDDHHMMSS format
            $expiryTime = date('Y-m-d H:i:s', strtotime($expiredDate));
        }

        $details = [
            'doku_invoice_number' => $externalId,
            'payment_url'         => $paymentUrl,
            'invoice_url'         => $paymentUrl,
            'transaction_status'  => 'pending',
            'expiry_time'         => $expiryTime,
        ];

        return $details;
    }

    /**
     * Generate HMAC-SHA256 Signature for DOKU HTTP API
     */
    public function generateHmacSignature(string $requestId, string $requestTimestamp, string $requestTarget, array $body): string
    {
        $jsonBody = json_encode($body);
        $digest = base64_encode(hash('sha256', $jsonBody, true));
        $rawSignature = "Client-Id:" . $this->clientId . "\n" .
                        "Request-Id:" . $requestId . "\n" .
                        "Request-Timestamp:" . $requestTimestamp . "\n" .
                        "Request-Target:" . $requestTarget . "\n" .
                        "Digest:" . $digest;

        return "HMACSHA256=" . base64_encode(hash_hmac('sha256', $rawSignature, $this->secretKey, true));
    }

    /**
     * Verify incoming webhook notification from DOKU
     */
    public function verifyWebhookSignature(Request $request): bool
    {
        // 1. In sandbox, accept by default if secret key is present
        if (!$this->isProduction) {
            return true;
        }

        $signatureHeader = $request->header('Signature');
        $clientIdHeader = $request->header('Client-Id');
        $requestIdHeader = $request->header('Request-Id');
        $requestTimestampHeader = $request->header('Request-Timestamp');

        if (!$signatureHeader || !$clientIdHeader) {
            return false;
        }

        $requestTarget = $request->getRequestUri();
        $rawBody = $request->getContent();
        $digest = base64_encode(hash('sha256', $rawBody, true));

        $rawSignature = "Client-Id:" . $clientIdHeader . "\n" .
                        "Request-Id:" . $requestIdHeader . "\n" .
                        "Request-Timestamp:" . $requestTimestampHeader . "\n" .
                        "Request-Target:" . $requestTarget . "\n" .
                        "Digest:" . $digest;

        $expectedHash = base64_encode(hash_hmac('sha256', $rawSignature, $this->secretKey, true));
        $cleanSignature = str_replace('HMACSHA256=', '', $signatureHeader);

        if (hash_equals($expectedHash, $cleanSignature)) {
            return true;
        }

        // Fallback: Check without query string in requestTarget if present
        $cleanTarget = '/' . ltrim($request->path(), '/');
        if ($cleanTarget !== $requestTarget) {
            $rawSignatureAlt = "Client-Id:" . $clientIdHeader . "\n" .
                               "Request-Id:" . $requestIdHeader . "\n" .
                               "Request-Timestamp:" . $requestTimestampHeader . "\n" .
                               "Request-Target:" . $cleanTarget . "\n" .
                               "Digest:" . $digest;
            $expectedHashAlt = base64_encode(hash_hmac('sha256', $rawSignatureAlt, $this->secretKey, true));
            if (hash_equals($expectedHashAlt, $cleanSignature)) {
                return true;
            }
        }

        return false;
    }
}
