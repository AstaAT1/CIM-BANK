<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Grants access only to users with the 'admin' role.
 * Registered as 'role.admin-only' middleware alias.
 * Use for actions that employees must NOT perform (e.g. cash loading).
 */
class EnsureAdminOnly
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user()?->hasRole('admin')) {
            abort(403, 'This action requires the admin role.');
        }

        return $next($request);
    }
}
