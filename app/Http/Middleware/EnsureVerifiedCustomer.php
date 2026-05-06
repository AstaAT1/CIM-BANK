<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureVerifiedCustomer
{
    /**
     * Clients who are NOT verified get redirected to the pending status page.
     * Admin and employee roles always pass through.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return redirect()->route('login');
        }

        // Admin and employee can always access
        if ($user->hasRole(['admin', 'employee'])) {
            return $next($request);
        }

        // Check if this user has a verified customer profile
        $profile = $user->profile;

        if (!$profile || $profile->status !== 'verified') {
            // Allow access to onboarding routes, settings, logout
            $allowedPrefixes = ['onboarding', 'settings', 'logout'];
            $currentPath = $request->path();

            foreach ($allowedPrefixes as $prefix) {
                if (str_starts_with($currentPath, $prefix)) {
                    return $next($request);
                }
            }

            return redirect()->route('account.pending');
        }

        return $next($request);
    }
}
