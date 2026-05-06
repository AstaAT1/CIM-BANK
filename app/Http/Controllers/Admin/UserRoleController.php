<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\AuditLogService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class UserRoleController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/users/index', [
            'users' => User::with('roles')->latest()->paginate(20),
            'roles' => ['customer', 'employee', 'admin'],
        ]);
    }

    public function updateRole(Request $request, User $user, AuditLogService $auditLogService): RedirectResponse
    {
        $validated = $request->validate([
            'role' => ['required', Rule::in(['customer', 'employee', 'admin'])],
        ]);

        if ($user->hasRole('admin') && $validated['role'] !== 'admin' && User::role('admin')->count() <= 1) {
            return back()->with('error', 'You cannot remove the last admin user.');
        }

        $oldRoles = $user->getRoleNames()->values()->all();
        $user->syncRoles([$validated['role']]);

        $auditLogService->log($request, 'user_role_updated', $user, 'User role updated by admin.', [
            'old_roles' => $oldRoles,
            'new_role' => $validated['role'],
        ]);

        return back()->with('success', 'User role updated successfully.');
    }
}
