<?php

namespace App\Services;

use App\Models\ExchangeRate;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;
use Throwable;

class ExchangeRateService
{
    /**
     * @return Collection<int, ExchangeRate>
     */
    public function fetchLatest(?array $targetCurrencies = null): Collection
    {
        $appId = config('services.open_exchange_rates.app_id');

        if (! $appId) {
            throw new RuntimeException('Open Exchange Rates App ID is not configured.');
        }

        try {
            $response = Http::timeout(15)
                ->retry(2, 500)
                ->get((string) config('services.open_exchange_rates.latest_url'), [
                    'app_id' => $appId,
                ]);

            if (! $response->successful()) {
                Log::warning('Open Exchange Rates request failed.', [
                    'status' => $response->status(),
                    'source' => $this->source(),
                ]);

                throw new RuntimeException('Open Exchange Rates request failed with status '.$response->status().'.');
            }

            $payload = $response->json();

            if (! is_array($payload) || ! isset($payload['rates']) || ! is_array($payload['rates'])) {
                throw new RuntimeException('Open Exchange Rates returned an invalid rates payload.');
            }

            $baseCurrency = strtoupper((string) ($payload['base'] ?? $this->baseCurrency()));
            $fetchedAt = isset($payload['timestamp']) && is_numeric($payload['timestamp'])
                ? Carbon::createFromTimestamp((int) $payload['timestamp'])
                : now();

            $rates = collect($payload['rates']);
            $rates->put($baseCurrency, $rates->get($baseCurrency, 1));

            if ($targetCurrencies) {
                $allowed = collect($targetCurrencies)
                    ->map(fn (string $currency): string => strtoupper($currency))
                    ->flip();

                $rates = $rates->filter(fn (mixed $rate, string $currency): bool => $allowed->has(strtoupper($currency)));
            }

            return $this->storeRates($baseCurrency, $rates, $fetchedAt);
        } catch (Throwable $exception) {
            $message = $this->safeExceptionMessage($exception);

            Log::error('Unable to fetch exchange rates.', [
                'message' => $message,
                'source' => $this->source(),
            ]);

            throw new RuntimeException($message, 0, $exception);
        }
    }

    /**
     * @return Collection<string, float>
     */
    public function ratesMap(?string $source = null): Collection
    {
        return ExchangeRate::query()
            ->where('base_currency', $this->baseCurrency())
            ->where('source', $source ?? $this->source())
            ->pluck('rate', 'target_currency')
            ->map(fn (string $rate): float => (float) $rate);
    }

    public function convert(float $amount, string $fromCurrency, string $toCurrency): float
    {
        $rates = $this->ratesMap();
        $from = strtoupper($fromCurrency);
        $to = strtoupper($toCurrency);

        if (! $rates->has($from) || ! $rates->has($to)) {
            throw new RuntimeException('Exchange rate is unavailable for the requested currency pair.');
        }

        return ($amount / $rates->get($from)) * $rates->get($to);
    }

    public function baseCurrency(): string
    {
        return strtoupper((string) config('services.open_exchange_rates.base', 'USD'));
    }

    public function source(): string
    {
        return (string) config('services.open_exchange_rates.source', 'open_exchange_rates');
    }

    /**
     * @param  Collection<string, mixed>  $rates
     * @return Collection<int, ExchangeRate>
     */
    private function storeRates(string $baseCurrency, Collection $rates, Carbon $fetchedAt): Collection
    {
        return $rates
            ->filter(fn (mixed $rate): bool => is_numeric($rate) && (float) $rate > 0)
            ->map(function (mixed $rate, string $targetCurrency) use ($baseCurrency, $fetchedAt): ExchangeRate {
                return ExchangeRate::updateOrCreate(
                    [
                        'base_currency' => $baseCurrency,
                        'target_currency' => strtoupper($targetCurrency),
                        'source' => $this->source(),
                    ],
                    [
                        'rate' => (string) $rate,
                        'fetched_at' => $fetchedAt,
                    ]
                );
            })
            ->values();
    }

    private function safeExceptionMessage(Throwable $exception): string
    {
        $message = $exception->getMessage();
        $appId = config('services.open_exchange_rates.app_id');

        if (is_string($appId) && $appId !== '') {
            $message = str_replace($appId, '[redacted]', $message);
        }

        return (string) preg_replace('/([?&]app_id=)[^&\s]+/', '$1[redacted]', $message);
    }
}
