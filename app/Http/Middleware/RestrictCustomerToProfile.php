<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RestrictCustomerToProfile
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (auth()->check() && auth()->user()->role === 'customer') {
            $currentRouteName = $request->route()?->getName();

            // Rute yang dilarang untuk role customer (hanya admin yang boleh ke dashboard)
            $blockedRouteNames = [
                'dashboard',
            ];

            if (in_array($currentRouteName, $blockedRouteNames)) {
                return redirect()->route('profile.edit');
            }
        }

        return $next($request);
    }
}
