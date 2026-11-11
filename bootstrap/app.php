<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->trustProxies(at: '*');

        $middleware->redirectTo(
            guests: '/?login=1',
        );

        $middleware->web(prepend: [
            \App\Http\Middleware\SetNoCacheHeaders::class,
        ]);

        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
            \App\Http\Middleware\RestrictCustomerToProfile::class,
            \App\Http\Middleware\RestrictAdminToBackoffice::class,
            \App\Http\Middleware\LogVisitorLocation::class,
        ]);

        $middleware->alias([
            'backoffice.auth' => \App\Http\Middleware\EnsureBackofficeAuthenticated::class,
        ]);

        $middleware->validateCsrfTokens(except: [
            'checkout/midtrans-callback',
            'checkout/xendit-callback',
            'checkout/doku-callback',
            'checkout/doku-snap-callback',
            'biteship/webhook',
            'api/*',
            'v1.1/*',
            'v1.0/*',
            'transfer-va/*',
        ]);

        $middleware->trimStrings(except: [
            'partnerServiceId',
            'virtualAccountNo',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create()
    ->usePublicPath(env('PUBLIC_PATH', dirname(__DIR__) . '/public'));
