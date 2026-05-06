<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = [
            'view dashboard',
            'manage customers',
            'manage account requests',
            'manage appointments',
            'manage documents',
            'manage bank accounts',
            'manage transfers',
            'manage beneficiaries',
            'manage branches',
            'manage users',
            'manage employees',
            'manage roles',
            'manage permissions',

            'view audit logs',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        $admin = Role::firstOrCreate(['name' => 'admin']);
        $employee = Role::firstOrCreate(['name' => 'employee']);
        Role::firstOrCreate(['name' => 'customer']);

        $admin->syncPermissions($permissions);
        $employee->syncPermissions([
            'view dashboard',
            'manage customers',
            'manage account requests',
            'manage appointments',
            'manage documents',
            'manage bank accounts',
            'manage transfers',
            'manage beneficiaries',
            'manage branches',
            'view audit logs',
        ]);

        Role::findByName('customer')->syncPermissions([]);
    }
}
