<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetNoCacheHeaders
{
    /**
     * Handle an incoming request and set strict anti-cache headers
     * to prevent browsers from caching Inertia JSON responses.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $response->headers->set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0, post-check=0, pre-check=0');
        $response->headers->set('Pragma', 'no-cache');
        $response->headers->set('Expires', 'Sat, 01 Jan 1990 00:00:00 GMT');
        $response->headers->set('Vary', 'X-Inertia, Accept-Encoding');

        return $response;
    }
}
