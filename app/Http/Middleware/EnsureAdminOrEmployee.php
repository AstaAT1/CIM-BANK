<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdminOrEmployee
{
    /**
     * Only admin and employee roles can access these routes.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user || !$user->hasRole(['admin', 'employee'])) {
            abort(403, 'Unauthorized. Admin or employee access only.');
        }

        return $next($request);
    }
}
