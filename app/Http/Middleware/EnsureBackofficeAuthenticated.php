<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureBackofficeAuthenticated
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (! Auth::check()) {
            return redirect()->guest(route('backoffice.login'));
        }

        if (! in_array(Auth::user()->role, ['admin', 'super_admin'], true)) {
            abort(403);
        }

        // Inactivity timeout: 2 hours (7200 seconds)
        $lastActivity = session('admin_last_activity');
        if ($lastActivity && (time() - $lastActivity > 7200)) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
            return redirect()->route('backoffice.login')->with('status', 'Sesi Anda telah berakhir karena tidak ada aktivitas.');
        }

        session(['admin_last_activity' => time()]);

        return $next($request);
    }
}
