<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class RestrictAdminToBackoffice
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (Auth::check() && in_array(Auth::user()->role, ['admin', 'super_admin'], true)) {
            // Exclude backoffice routes, logout route, and api routes
            if (! $request->is('backoffice*', 'logout', 'api/*')) {
                return redirect()->route('backoffice.dashboard');
            }
        }

        return $next($request);
    }
}
