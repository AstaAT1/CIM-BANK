<?php

namespace Database\Seeders;

use App\Models\Branch;
use Illuminate\Database\Seeder;

class BranchSeeder extends Seeder
{
    public function run(): void
    {
        $branches = [
            [
                'name' => 'Casablanca Maarif',
                'code' => 'CAS-MAA',
                'city' => 'Casablanca',
                'address' => 'Boulevard Al Massira Al Khadra, Maarif',
                'phone' => '+212522440101',
            ],
            [
                'name' => 'Rabat Agdal',
                'code' => 'RBA-AGD',
                'city' => 'Rabat',
                'address' => 'Avenue Fal Ould Oumeir, Agdal',
                'phone' => '+212537770202',
            ],
            [
                'name' => 'Marrakech Gueliz',
                'code' => 'RAK-GUE',
                'city' => 'Marrakech',
                'address' => 'Avenue Mohammed V, Gueliz',
                'phone' => '+212524430303',
            ],
            [
                'name' => 'Fes Centre',
                'code' => 'FEZ-CTR',
                'city' => 'Fes',
                'address' => 'Avenue Hassan II, Centre Ville',
                'phone' => '+212535620404',
            ],
            [
                'name' => 'Tanger Centre',
                'code' => 'TNG-CTR',
                'city' => 'Tanger',
                'address' => 'Boulevard Pasteur, Centre Ville',
                'phone' => '+212539940505',
            ],
        ];

        foreach ($branches as $branch) {
            Branch::updateOrCreate([
                'code' => $branch['code'],
            ], [
                ...$branch,
                'opening_time' => '08:30',
                'closing_time' => '16:30',
                'is_active' => true,
            ]);
        }
    }
}
