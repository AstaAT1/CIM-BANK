<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoUsersSeeder extends Seeder
{
    public function run(): void
    {
        $users = [
            [
                'name' => 'Mizan Admin',
                'email' => 'admin@example.com',
                'password' => 'password',
                'role' => 'admin',
            ],
            [
                'name' => 'Youssef El Fassi',
                'email' => 'employee@example.com',
                'password' => 'password',
                'role' => 'employee',
            ],
            [
                'name' => 'Sara Bennani',
                'email' => 'customer@example.com',
                'role' => 'customer',
            ],
        ];

        foreach ($users as $demoUser) {
            $user = User::updateOrCreate([
                'email' => $demoUser['email'],
            ], [
                'name' => $demoUser['name'],
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]);

            $user->syncRoles([$demoUser['role']]);
        }
    }
}
