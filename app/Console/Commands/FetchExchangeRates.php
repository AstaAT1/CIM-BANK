<?php

namespace App\Console\Commands;

use App\Services\ExchangeRateService;
use Illuminate\Console\Command;
use Throwable;

class FetchExchangeRates extends Command
{
    protected $signature = 'exchange-rates:fetch
        {--currencies= : Comma-separated currency codes to store. Defaults to all returned currencies.}';

    protected $description = 'Fetch latest exchange rates from Open Exchange Rates and store them in the database.';

    public function handle(ExchangeRateService $exchangeRates): int
    {
        $currencies = $this->currenciesOption();

        try {
            $storedRates = $exchangeRates->fetchLatest($currencies);
        } catch (Throwable $exception) {
            $this->error('Exchange rates were not updated: '.$exception->getMessage());
            $this->warn('Existing database rates were kept.');

            return self::FAILURE;
        }

        $requiredCurrencies = collect($this->minimumCurrencies());
        $storedCurrencies = $storedRates->pluck('target_currency');
        $missing = $requiredCurrencies->diff($storedCurrencies)->values();

        $this->info("Stored {$storedRates->count()} exchange rates.");

        if ($missing->isNotEmpty()) {
            $this->warn('Missing expected currencies: '.$missing->implode(', '));
        }

        $sample = $storedRates
            ->whereIn('target_currency', ['MAD', 'USD', 'EUR'])
            ->map(fn ($rate): string => "{$rate->target_currency}={$rate->rate}")
            ->implode(', ');

        if ($sample) {
            $this->line('Sample rates: '.$sample);
        }

        return self::SUCCESS;
    }

    /**
     * @return array<int, string>|null
     */
    private function currenciesOption(): ?array
    {
        $value = $this->option('currencies');

        if (! $value) {
            return null;
        }

        return collect(explode(',', (string) $value))
            ->map(fn (string $currency): string => strtoupper(trim($currency)))
            ->filter()
            ->merge($this->minimumCurrencies())
            ->unique()
            ->values()
            ->all();
    }

    /**
     * @return array<int, string>
     */
    private function minimumCurrencies(): array
    {
        return ['MAD', 'USD', 'EUR', 'GBP', 'CAD', 'AED', 'SAR', 'CHF', 'CNY', 'JPY'];
    }
}
