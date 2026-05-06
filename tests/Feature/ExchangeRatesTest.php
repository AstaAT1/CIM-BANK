<?php

namespace Tests\Feature;

use App\Models\CustomerProfile;
use App\Models\ExchangeRate;
use App\Models\User;
use App\Services\ExchangeRateService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class ExchangeRatesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        Role::firstOrCreate(['name' => 'admin']);
        Role::firstOrCreate(['name' => 'employee']);
        Role::firstOrCreate(['name' => 'customer']);

        config([
            'services.open_exchange_rates.app_id' => 'test-app-id',
            'services.open_exchange_rates.base' => 'USD',
            'services.open_exchange_rates.source' => 'open_exchange_rates',
        ]);
    }

    public function test_fetch_command_stores_latest_exchange_rates(): void
    {
        Http::fake([
            'https://openexchangerates.org/api/latest.json*' => Http::response([
                'base' => 'USD',
                'timestamp' => 1_767_225_600,
                'rates' => [
                    'USD' => 1,
                    'MAD' => 9.240144,
                    'EUR' => 0.86,
                    'GBP' => 0.75,
                    'CAD' => 1.37,
                    'AED' => 3.6725,
                    'SAR' => 3.75,
                    'CHF' => 0.8,
                    'CNY' => 7.12,
                    'JPY' => 151.2,
                ],
            ]),
        ]);

        $this->artisan('exchange-rates:fetch')
            ->expectsOutput('Stored 10 exchange rates.')
            ->assertSuccessful();

        $this->assertDatabaseHas('exchange_rates', [
            'base_currency' => 'USD',
            'target_currency' => 'MAD',
            'source' => 'open_exchange_rates',
        ]);
        $this->assertDatabaseHas('exchange_rates', ['target_currency' => 'USD']);
        $this->assertDatabaseHas('exchange_rates', ['target_currency' => 'EUR']);
    }

    public function test_fetch_command_keeps_existing_database_rates_when_api_fails(): void
    {
        ExchangeRate::create([
            'base_currency' => 'USD',
            'target_currency' => 'MAD',
            'rate' => 9.24,
            'source' => 'open_exchange_rates',
            'fetched_at' => now()->subHour(),
        ]);

        Http::fake([
            'https://openexchangerates.org/api/latest.json*' => Http::response([], 500),
        ]);

        $this->artisan('exchange-rates:fetch')
            ->expectsOutput('Existing database rates were kept.')
            ->assertFailed();

        $this->assertSame(9.24, (float) ExchangeRate::where('target_currency', 'MAD')->firstOrFail()->rate);
    }

    public function test_conversion_uses_usd_base_formula_for_any_supported_pair(): void
    {
        foreach ([
            'USD' => 1,
            'MAD' => 9.240144,
            'EUR' => 0.86,
            'AED' => 3.6725,
        ] as $currency => $rate) {
            ExchangeRate::create([
                'base_currency' => 'USD',
                'target_currency' => $currency,
                'rate' => $rate,
                'source' => 'open_exchange_rates',
                'fetched_at' => now(),
            ]);
        }

        $service = app(ExchangeRateService::class);

        $this->assertEqualsWithDelta(10.822343, $service->convert(100, 'MAD', 'USD'), 0.000001);
        $this->assertEqualsWithDelta(924.0144, $service->convert(100, 'USD', 'MAD'), 0.000001);
        $this->assertEqualsWithDelta(1074.435349, $service->convert(100, 'EUR', 'MAD'), 0.000001);
        $this->assertEqualsWithDelta(251.603649, $service->convert(100, 'AED', 'MAD'), 0.000001);
    }

    public function test_exchange_rates_page_is_customer_verified_only(): void
    {
        foreach ([
            'USD' => 1,
            'MAD' => 9.240144,
            'EUR' => 0.86,
        ] as $currency => $rate) {
            ExchangeRate::create([
                'base_currency' => 'USD',
                'target_currency' => $currency,
                'rate' => $rate,
                'source' => 'open_exchange_rates',
                'fetched_at' => now(),
            ]);
        }

        $verifiedCustomer = $this->customerWithProfile('verified');
        $pendingCustomer = $this->customerWithProfile('pending');
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $this->actingAs($verifiedCustomer)
            ->get('/customer/exchange-rates')
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('customer/exchange-rates/index')
                ->has('rates', 3)
                ->where('ratesMap.MAD', 9.240144)
            );

        $this->actingAs($pendingCustomer)
            ->get('/customer/exchange-rates')
            ->assertRedirect(route('account.pending'));

        $this->actingAs($admin)
            ->get('/customer/exchange-rates')
            ->assertForbidden();
    }

    private function customerWithProfile(string $status): User
    {
        $customer = User::factory()->create();
        $customer->assignRole('customer');

        CustomerProfile::create([
            'user_id' => $customer->id,
            'cin' => fake()->unique()->bothify('??######'),
            'first_name' => 'Test',
            'last_name' => 'Customer',
            'status' => $status,
            'verified_at' => $status === 'verified' ? now() : null,
        ]);

        return $customer->load('profile');
    }
}
