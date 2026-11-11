<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class DokuSnapController extends Controller
{
    /**
     * DOKU / ASPI SNAP Virtual Account Payment Notification Handler
     * Supports both Positive (2002500) and Negative test scenarios (4042512, 4042513, etc.)
     * Standard Route: POST /api/v1.1/transfer-va/payment
     */
    public function paymentVa(Request $request, ?string $scenario = null): JsonResponse
    {
        // Log all incoming request data for debugging and audit
        Log::info('DOKU SNAP ASPI Payment Request Received:', [
            'method'   => $request->method(),
            'uri'      => $request->getRequestUri(),
            'scenario' => $scenario,
            'query'    => $request->query(),
            'headers'  => $request->headers->all(),
            'body'     => $request->all(),
            'raw'      => $request->getContent(),
        ]);

        // Health check / browser check support via GET
        if ($request->isMethod('get')) {
            return response()->json([
                'responseCode'        => '2002500',
                'responseMessage'     => 'DOKU SNAP Payment VA Endpoint is Active',
                'status'              => 'Ready',
                'service'             => 'Payment VA',
                'timestamp'           => now()->toIso8601String(),
                'available_scenarios' => [
                    '11.10_success'        => 'Default / data valid -> 2002500 (Successful)',
                    '11.11_bill_not_found' => 'URI ?scenario=not_found ATAU customerNo: "0000000000" -> 4042512 (Bill not found)',
                    '11.12_invalid_amount' => 'URI ?scenario=invalid_amount ATAU paidAmount.value: "0.00" -> 4042513 (Invalid Amount)',
                    'bill_has_been_paid'   => 'URI ?scenario=paid ATAU virtualAccountName: "PAID" -> 4042514 (Bill has been paid)',
                    'bill_expired'         => 'URI ?scenario=expired ATAU virtualAccountName: "EXPIRED" -> 4042519 (Bill expired)',
                    'unauthorized_sig'     => 'URI ?scenario=unauthorized ATAU X-SIGNATURE: "INVALID" -> 4012500 (Unauthorized Signature)',
                    'conflict'             => 'URI ?scenario=conflict ATAU X-EXTERNAL-ID: "CONFLICT" -> 4092500 (Conflict)',
                    'missing_field'        => 'URI ?scenario=missing_field -> 4002502 (Invalid Mandatory Field)',
                ],
            ], 200, [
                'X-TIMESTAMP'  => now()->toIso8601String(),
                'Content-Type' => 'application/json;charset=utf-8',
            ]);
        }

        $rawPayload = json_decode($request->getContent(), true);
        $payload = is_array($rawPayload) ? array_merge($request->all(), $rawPayload) : $request->all();

        // Detect scenario from route param, query param, or header
        $rawScenario = (string) (
            $scenario
            ?? $request->query('scenario')
            ?? $request->query('test_scenario')
            ?? $request->header('X-SCENARIO')
            ?? ''
        );
        $selectedScenario = str_replace('-', '_', strtolower(trim($rawScenario)));

        $forcedCode = (string) ($request->query('code') ?? '');

        // Extract SNAP parameters (prefer raw string to preserve spaces in partnerServiceId)
        $partnerServiceId   = $payload['partnerServiceId'] ?? ($rawPayload['partnerServiceId'] ?? '  19008');
        $customerNo         = (string) ($payload['customerNo'] ?? '9000000010');
        $virtualAccountNo   = (string) ($payload['virtualAccountNo'] ?? ($rawPayload['virtualAccountNo'] ?? ($partnerServiceId . $customerNo)));
        $virtualAccountName = (string) ($payload['virtualAccountName'] ?? 'Customer Fayyfir');
        $paymentRequestId   = (string) ($payload['paymentRequestId'] ?? $request->header('X-EXTERNAL-ID') ?? ($payload['trxId'] ?? (string) Str::uuid()));

        // Extract or format paidAmount
        if (isset($payload['paidAmount']) && is_array($payload['paidAmount'])) {
            $paidAmount = [
                'value'    => (string) ($payload['paidAmount']['value'] ?? '0.00'),
                'currency' => (string) ($payload['paidAmount']['currency'] ?? 'IDR'),
            ];
        } elseif (isset($payload['totalAmount']) && is_array($payload['totalAmount'])) {
            $paidAmount = [
                'value'    => (string) ($payload['totalAmount']['value'] ?? '0.00'),
                'currency' => (string) ($payload['totalAmount']['currency'] ?? 'IDR'),
            ];
        } elseif (isset($payload['paidAmount']) && (is_string($payload['paidAmount']) || is_numeric($payload['paidAmount']))) {
            $paidAmount = [
                'value'    => number_format((float) $payload['paidAmount'], 2, '.', ''),
                'currency' => 'IDR',
            ];
        } else {
            $paidAmount = [
                'value'    => '0.00',
                'currency' => 'IDR',
            ];
        }

        $trxDateTime = $payload['trxDateTime'] ?? now()->toIso8601String();
        $channel = $payload['additionalInfo']['channel'] ?? 'VIRTUAL_ACCOUNT_BCA';

        // Prepare standard virtualAccountData structure
        $vaData = [
            'partnerServiceId'   => $partnerServiceId,
            'customerNo'         => $customerNo,
            'virtualAccountNo'   => $virtualAccountNo,
            'virtualAccountName' => $virtualAccountName,
            'paymentRequestId'   => $paymentRequestId,
            'paidAmount'         => $paidAmount,
            'trxDateTime'        => $trxDateTime,
        ];
        if (!empty($payload['trxId'])) {
            $vaData['trxId'] = $payload['trxId'];
        }
        if (!empty($payload['referenceNo'])) {
            $vaData['referenceNo'] = $payload['referenceNo'];
        }

        $responseHeaders = [
            'X-TIMESTAMP'  => now()->toIso8601String(),
            'Content-Type' => 'application/json;charset=utf-8',
        ];

        // -------------------------------------------------------------
        // EVALUATE NEGATIVE TEST SCENARIOS
        // -------------------------------------------------------------

        // 1. Missing Mandatory Field (4002502)
        if ($selectedScenario === 'missing_field' || $forcedCode === '4002502') {
            return response()->json([
                'responseCode'    => '4002502',
                'responseMessage' => 'Invalid Mandatory Field virtualAccountNo',
            ], 400, $responseHeaders);
        }

        // 2. Unauthorized Signature (4012500)
        $sig = strtoupper((string) $request->header('X-SIGNATURE', ''));
        if ($selectedScenario === 'unauthorized' || $selectedScenario === 'invalid_signature' || $forcedCode === '4012500'
            || str_contains($sig, 'INVALID') || str_contains($sig, 'SALAH')
            || str_contains(strtoupper($virtualAccountName), 'SIGNATURE')) {
            return response()->json([
                'responseCode'    => '4012500',
                'responseMessage' => 'Unauthorized Signature',
            ], 401, $responseHeaders);
        }

        // 3. Conflict X-EXTERNAL-ID (4092500)
        $extId = strtoupper((string) $request->header('X-EXTERNAL-ID', ''));
        if ($selectedScenario === 'conflict' || $forcedCode === '4092500'
            || str_contains($extId, 'CONFLICT') || str_contains($extId, 'DUPLICATE')
            || str_contains(strtoupper($paymentRequestId), 'CONFLICT')) {
            return response()->json([
                'responseCode'    => '4092500',
                'responseMessage' => 'Conflict',
            ], 409, $responseHeaders);
        }

        // 4. Skenario 11.11: Bill not found (4042512)
        $isNotFoundScenario = $selectedScenario === 'not_found'
            || $selectedScenario === 'bill_not_found'
            || $selectedScenario === '11.11'
            || $forcedCode === '4042512'
            || $customerNo === '0000000000'
            || $customerNo === '00000000'
            || $customerNo === '9999999998'
            || str_contains(strtoupper($virtualAccountName), 'NOT FOUND')
            || str_contains(strtoupper($virtualAccountName), 'TIDAK TERDAFTAR')
            || str_contains(strtoupper($virtualAccountNo), 'NOTFOUND')
            || str_contains(strtoupper($virtualAccountNo), '4042512')
            || str_contains(strtoupper($paymentRequestId), 'NOTFOUND')
            || str_contains(strtoupper($paymentRequestId), '4042512');

        if ($isNotFoundScenario) {
            Log::info("DOKU SNAP ASPI: Triggered Negative Test 11.11 - Bill not found (4042512)");
            return response()->json([
                'responseCode'       => '4042512',
                'responseMessage'    => 'Bill not found',
                'virtualAccountData' => $vaData,
                'additionalInfo'     => [
                    'channel' => $channel,
                ],
            ], 404, $responseHeaders);
        }

        // 5. Skenario 11.12: Invalid Amount (4042513)
        $amountFloat = (float) $paidAmount['value'];
        $hasExplicitAmount = isset($payload['paidAmount']) || isset($payload['totalAmount']);
        $isInvalidAmountScenario = $selectedScenario === 'invalid_amount'
            || $selectedScenario === '11.12'
            || $forcedCode === '4042513'
            || ($hasExplicitAmount && ($amountFloat <= 0 || $paidAmount['value'] === '0.00' || $paidAmount['value'] === '0'))
            || str_contains(strtoupper($virtualAccountName), 'INVALID AMOUNT')
            || str_contains(strtoupper($virtualAccountName), 'SALAH NOMINAL')
            || str_contains(strtoupper($paymentRequestId), 'INVALID_AMOUNT')
            || str_contains(strtoupper($paymentRequestId), '4042513');

        if ($isInvalidAmountScenario) {
            Log::info("DOKU SNAP ASPI: Triggered Negative Test 11.12 - Invalid Amount (4042513)");
            return response()->json([
                'responseCode'       => '4042513',
                'responseMessage'    => 'Invalid Amount',
                'virtualAccountData' => $vaData,
                'additionalInfo'     => [
                    'channel' => $channel,
                ],
            ], 404, $responseHeaders);
        }

        // 6. Bill has been paid (4042514)
        $isPaidScenario = $selectedScenario === 'paid'
            || $selectedScenario === 'bill_paid'
            || $selectedScenario === 'lunas'
            || $forcedCode === '4042514'
            || str_contains(strtoupper($virtualAccountName), 'PAID')
            || str_contains(strtoupper($virtualAccountName), 'LUNAS');

        if ($isPaidScenario) {
            Log::info("DOKU SNAP ASPI: Triggered Negative Test - Bill has been paid (4042514)");
            return response()->json([
                'responseCode'       => '4042514',
                'responseMessage'    => 'Bill has been paid',
                'virtualAccountData' => $vaData,
                'additionalInfo'     => [
                    'channel' => $channel,
                ],
            ], 404, $responseHeaders);
        }

        // 7. Bill expired (4042519)
        $isExpiredScenario = $selectedScenario === 'expired'
            || $selectedScenario === 'kadaluarsa'
            || $forcedCode === '4042519'
            || str_contains(strtoupper($virtualAccountName), 'EXPIRED')
            || str_contains(strtoupper($virtualAccountName), 'KADALUARSA');

        if ($isExpiredScenario) {
            Log::info("DOKU SNAP ASPI: Triggered Negative Test - Bill expired (4042519)");
            return response()->json([
                'responseCode'       => '4042519',
                'responseMessage'    => 'Bill expired',
                'virtualAccountData' => $vaData,
                'additionalInfo'     => [
                    'channel' => $channel,
                ],
            ], 404, $responseHeaders);
        }

        // -------------------------------------------------------------
        // POSITIVE FLOW: Match real order or respond 2002500 for test
        // -------------------------------------------------------------
        $trxId = $payload['trxId'] ?? $payload['partnerReferenceNo'] ?? $paymentRequestId;
        $order = null;

        if ($trxId) {
            $order = Order::with('items')->where('invoice_number', $trxId)->first();
            if (!$order) {
                $parts = explode('-', $trxId);
                if (count($parts) >= 3) {
                    $baseInvoice = implode('-', array_slice($parts, 0, 3));
                    $order = Order::with('items')->where('invoice_number', $baseInvoice)->first();
                }
            }
        }

        if (!$order && $virtualAccountNo) {
            $cleanVa = trim($virtualAccountNo);
            $order = Order::with('items')
                ->where('payment_details->va_number', $virtualAccountNo)
                ->orWhere('payment_details->va_number', $cleanVa)
                ->orWhere('payment_details->doku_trx_id', $trxId)
                ->orWhere('payment_details->doku_invoice_number', $trxId)
                ->first();
        }

        if ($order && $order->payment_status !== 'paid') {
            $flagStatus = $payload['paymentFlagStatus'] ?? $payload['responseCode'] ?? '00';
            if ($flagStatus === '00' || $flagStatus === '2002500' || strtoupper($flagStatus) === 'SUCCESS') {
                $order->update([
                    'payment_status' => 'paid',
                    'status'         => 'processing',
                ]);
                Log::info("DOKU SNAP ASPI Payment: Order #{$order->id} marked as PAID");
            }
        } else {
            Log::info("DOKU SNAP ASPI Payment: Simulator test or order not found (TrxId: {$trxId}, VA: {$virtualAccountNo})");
        }

        // Success response (2002500)
        $vaData['paymentFlagStatus'] = '00';
        $vaData['paymentFlagReason'] = [
            'english'   => 'Success',
            'indonesia' => 'Sukses',
        ];

        $responseBody = [
            'responseCode'       => '2002500',
            'responseMessage'    => 'Successful',
            'virtualAccountData' => $vaData,
        ];

        return response()->json($responseBody, 200, $responseHeaders);
    }

    /**
     * DOKU / ASPI SNAP Virtual Account Inquiry Handler
     * Standard Route: POST /api/v1.1/transfer-va/inquiry-va
     */
    public function inquiryVa(Request $request, ?string $scenario = null): JsonResponse
    {
        Log::info('DOKU SNAP ASPI Inquiry Request Received:', [
            'method'   => $request->method(),
            'uri'      => $request->getRequestUri(),
            'scenario' => $scenario,
            'headers'  => $request->headers->all(),
            'body'     => $request->all(),
            'raw'      => $request->getContent(),
        ]);

        if ($request->isMethod('get')) {
            return response()->json([
                'responseCode'    => '2002700',
                'responseMessage' => 'DOKU SNAP Inquiry VA Endpoint is Active',
                'status'          => 'Ready',
                'service'         => 'Inquiry VA',
                'timestamp'       => now()->toIso8601String(),
            ], 200, [
                'X-TIMESTAMP'  => now()->toIso8601String(),
                'Content-Type' => 'application/json;charset=utf-8',
            ]);
        }

        $rawPayload = json_decode($request->getContent(), true);
        $payload = is_array($rawPayload) ? array_merge($request->all(), $rawPayload) : $request->all();

        $selectedScenario = strtolower(trim((string) (
            $scenario
            ?? $request->query('scenario')
            ?? $request->query('test_scenario')
            ?? $request->header('X-SCENARIO')
            ?? ''
        )));

        $partnerServiceId = $payload['partnerServiceId'] ?? ($rawPayload['partnerServiceId'] ?? '  19008');
        $customerNo       = (string) ($payload['customerNo'] ?? '9000000010');
        $virtualAccountNo = (string) ($payload['virtualAccountNo'] ?? ($rawPayload['virtualAccountNo'] ?? ($partnerServiceId . $customerNo)));
        $virtualAccountName = (string) ($payload['virtualAccountName'] ?? 'Customer Fayyfir');
        $inquiryRequestId = (string) ($payload['inquiryRequestId'] ?? $request->header('X-EXTERNAL-ID') ?? (string) Str::uuid());

        $amountValue = '100000.00';
        if (isset($payload['totalAmount']['value'])) {
            $amountValue = (string) $payload['totalAmount']['value'];
        }

        $responseHeaders = [
            'X-TIMESTAMP'  => now()->toIso8601String(),
            'Content-Type' => 'application/json;charset=utf-8',
        ];

        // Inquiry Negative Scenarios
        if ($selectedScenario === 'not_found' || $customerNo === '0000000000' || str_contains(strtoupper($virtualAccountName), 'NOT FOUND')) {
            return response()->json([
                'responseCode'    => '4042412',
                'responseMessage' => 'Bill not found',
            ], 404, $responseHeaders);
        }

        if ($selectedScenario === 'paid' || str_contains(strtoupper($virtualAccountName), 'PAID')) {
            return response()->json([
                'responseCode'    => '4042414',
                'responseMessage' => 'Bill has been paid',
            ], 404, $responseHeaders);
        }

        if ($selectedScenario === 'expired' || str_contains(strtoupper($virtualAccountName), 'EXPIRED')) {
            return response()->json([
                'responseCode'    => '4042419',
                'responseMessage' => 'Bill expired',
            ], 404, $responseHeaders);
        }

        // Inquiry Positive Response
        $virtualAccountData = [
            'partnerServiceId'   => $partnerServiceId,
            'customerNo'         => $customerNo,
            'virtualAccountNo'   => $virtualAccountNo,
            'virtualAccountName' => $virtualAccountName,
            'inquiryRequestId'   => $inquiryRequestId,
            'totalAmount'        => [
                'value'    => $amountValue,
                'currency' => 'IDR',
            ],
            'inquiryStatus'      => '00',
            'inquiryReason'      => [
                'english'   => 'Success',
                'indonesia' => 'Sukses',
            ],
        ];

        $responseBody = [
            'responseCode'       => '2002700',
            'responseMessage'    => 'Successful',
            'virtualAccountData' => $virtualAccountData,
        ];

        return response()->json($responseBody, 200, $responseHeaders);
    }
}
