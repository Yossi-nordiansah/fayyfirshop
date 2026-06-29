<?php

namespace App\Http\Middleware;

use App\Models\VisitorLog;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class LogVisitorLocation
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // 1. Get client IP (resolving Cloudflare or reverse proxy headers)
        $ip = $request->header('CF-Connecting-IP')
            ?: ($request->header('X-Forwarded-For')
                ? explode(',', $request->header('X-Forwarded-For'))[0]
                : $request->ip());

        $ip = trim($ip);

        // 2. Localhost fallback for development testing
        $lookupIp = $ip;
        if ($ip === '127.0.0.1' || $ip === '::1' || empty($ip)) {
            $lookupIp = '180.244.133.22'; // Surabaya / Mojokerto area IP
        }

        $cacheKey = 'visitor_location_' . str_replace([':', '.'], '_', $ip);
        $location = Cache::get($cacheKey);
        if (!$location) {
            try {
                $response = Http::timeout(3)->get("http://ip-api.com/json/{$lookupIp}");
                if ($response->successful()) {
                    $data = $response->json();
                    if (($data['status'] ?? '') === 'success') {
                        $location = [
                            'country' => $data['country'] ?? 'Unknown',
                            'countryCode' => $data['countryCode'] ?? 'Unknown',
                            'regionName' => $data['regionName'] ?? 'Unknown',
                            'city' => $data['city'] ?? 'Unknown',
                        ];
                        Cache::put($cacheKey, $location, now()->addDay());
                    }
                }
            } catch (\Exception $e) {
                Log::error("LogVisitorLocation error: " . $e->getMessage());
            }
        }

        // 4. Log the location (once per session to avoid spamming logs)
        if ($location && $request->hasSession()) {
            $sessionKey = 'logged_location_' . str_replace([':', '.'], '_', $ip);
            if (!$request->session()->has($sessionKey)) {
                $city = $location['city'] ?? 'Unknown';
                $region = $location['regionName'] ?? 'Unknown';
                $country = $location['country'] ?? 'Unknown';
                $countryCode = $location['countryCode'] ?? 'Unknown';

                // Save to database
                VisitorLog::create([
                    'ip_address' => $ip,
                    'city' => $city,
                    'region' => $region,
                    'country' => $country,
                    'country_code' => $countryCode,
                ]);

                Log::info("Visitor Access Log - IP: {$ip} | Location: {$city}, {$region}, {$country} ({$countryCode})");
                $request->session()->put($sessionKey, true);
            }
        }

        return $next($request);
    }
}
