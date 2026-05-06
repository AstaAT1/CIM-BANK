<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\ExchangeRate;
use App\Services\ExchangeRateService;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class ExchangeRateController extends Controller
{
    public function __construct(
        private readonly ExchangeRateService $exchangeRates
    ) {}

    public function index(): Response
    {
        $baseCurrency = $this->exchangeRates->baseCurrency();
        $source = $this->exchangeRates->source();

        $rates = ExchangeRate::query()
            ->where('base_currency', $baseCurrency)
            ->where('source', $source)
            ->orderBy('target_currency')
            ->get(['target_currency', 'rate', 'fetched_at']);

        $ratesMap = $rates
            ->pluck('rate', 'target_currency')
            ->map(fn (string $rate): float => (float) $rate);

        $madRate = $ratesMap->get('MAD');
        $popularPairs = collect([
            ['from' => 'USD', 'to' => 'MAD'],
            ['from' => 'EUR', 'to' => 'MAD'],
            ['from' => 'GBP', 'to' => 'MAD'],
            ['from' => 'AED', 'to' => 'MAD'],
            ['from' => 'MAD', 'to' => 'USD'],
            ['from' => 'MAD', 'to' => 'EUR'],
        ])->map(function (array $pair) use ($ratesMap): array {
            $rate = $this->convertWithRates(1, $pair['from'], $pair['to'], $ratesMap);

            return [
                ...$pair,
                'rate' => $rate,
            ];
        })->filter(fn (array $pair): bool => $pair['rate'] !== null)->values();

        return Inertia::render('customer/exchange-rates/index', [
            'baseCurrency' => $baseCurrency,
            'rates' => $rates->map(fn (ExchangeRate $rate): array => [
                'currency' => $rate->target_currency,
                'rate_vs_usd' => (float) $rate->rate,
                'rate_vs_mad' => $madRate && (float) $rate->rate > 0
                    ? $madRate / (float) $rate->rate
                    : null,
                'fetched_at' => $rate->fetched_at?->toIso8601String(),
            ])->values(),
            'ratesMap' => $ratesMap->all(),
            'popularPairs' => $popularPairs->all(),
            'lastUpdated' => $rates->max('fetched_at')?->toIso8601String(),
        ]);
    }

    /**
     * @param  Collection<string, float>  $rates
     */
    private function convertWithRates(float $amount, string $fromCurrency, string $toCurrency, Collection $rates): ?float
    {
        $from = strtoupper($fromCurrency);
        $to = strtoupper($toCurrency);

        if (! $rates->has($from) || ! $rates->has($to)) {
            return null;
        }

        return ($amount / $rates->get($from)) * $rates->get($to);
    }
}
