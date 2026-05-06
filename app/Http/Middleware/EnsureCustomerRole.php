<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Ensures the authenticated user has the 'customer' role.
 * Registered as 'role.customer' middleware alias.
 */
class EnsureCustomerRole
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user?->hasRole('customer') || $user->hasRole(['admin', 'employee'])) {
            abort(403, 'Access restricted to customers.');
        }

        return $next($request);
    }
}
