import { Head } from '@inertiajs/react';
import {
    ArrowLeftRight,
    Calculator,
    ChevronDown,
    Coins,
    RefreshCw,
    SearchX,
    TrendingUp,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

const CIM = {
    primary: '#082F54',
    secondary: '#0A6474',
    accent: '#D4A23C',
    dark: '#061F39',
    background: '#F7F8FA',
    white: '#FFFFFF',
    border: '#D1D9DA',
};

function asNumber(value) {
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : 0;
}

function formatRate(value) {
    if (value == null || !Number.isFinite(value)) {
        return '-';
    }

    return value.toLocaleString('en-US', {
        maximumFractionDigits: value >= 100 ? 4 : 6,
        minimumFractionDigits: value < 10 ? 4 : 2,
    });
}

function formatResult(value) {
    if (value == null || !Number.isFinite(value)) {
        return '-';
    }

    return value.toLocaleString('en-US', {
        maximumFractionDigits: 4,
        minimumFractionDigits: 2,
    });
}

function formatDateTime(value) {
    if (!value) {
        return '-';
    }

    return new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}

function convertAmount(amount, fromCurrency, toCurrency, ratesMap) {
    const fromRate = ratesMap[fromCurrency];
    const toRate = ratesMap[toCurrency];

    if (!fromRate || !toRate || amount < 0) {
        return null;
    }

    return (amount / fromRate) * toRate;
}

function readPrefill(currencies, baseCurrency) {
    if (typeof window === 'undefined') {
        return {};
    }

    const params = new URLSearchParams(window.location.search);
    const amount = params.get('amount') || '';
    const from = String(params.get('from') || '').toUpperCase();
    const to = String(params.get('to') || '').toUpperCase();

    return {
        amount: /^\d+(\.\d{1,4})?$/.test(amount) ? amount : '',
        from: currencies.includes(from) ? from : '',
        to: currencies.includes(to) ? to : '',
        fallback: currencies.includes(baseCurrency) ? baseCurrency : currencies[0],
    };
}

export default function ExchangeRates({
    baseCurrency,
    rates,
    ratesMap,
    popularPairs,
    lastUpdated,
}) {
    const currencies = useMemo(
        () => rates.map((rate) => rate.currency).sort(),
        [rates],
    );
    const prefill = readPrefill(currencies, baseCurrency);
    const [amount, setAmount] = useState(prefill.amount || '100');
    const [fromCurrency, setFromCurrency] = useState(
        prefill.from || (currencies.includes('MAD') ? 'MAD' : prefill.fallback || baseCurrency),
    );
    const [toCurrency, setToCurrency] = useState(
        prefill.to || (currencies.includes('USD') ? 'USD' : currencies[1] || prefill.fallback || baseCurrency),
    );

    const conversion = useMemo(
        () =>
            convertAmount(
                asNumber(amount),
                fromCurrency,
                toCurrency,
                ratesMap,
            ),
        [amount, fromCurrency, ratesMap, toCurrency],
    );

    const hasRates = currencies.length > 0;

    function swapCurrencies() {
        setFromCurrency(toCurrency);
        setToCurrency(fromCurrency);
    }

    return (
        <>
            <Head title="Exchange Rates" />

            <main
                className="min-h-full px-4 py-6 sm:px-6 lg:px-8"
                style={{ background: CIM.background }}
            >
                <div className="mx-auto flex max-w-7xl flex-col gap-6">
                    <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div>
                            <div
                                className="mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold"
                                style={{
                                    borderColor: CIM.border,
                                    color: CIM.secondary,
                                    background: CIM.white,
                                }}
                            >
                                <Coins className="size-4" />
                                CIM Currency Desk
                            </div>
                            <h1
                                className="text-2xl font-semibold tracking-normal sm:text-3xl"
                                style={{ color: CIM.dark }}
                            >
                                Exchange Rates
                            </h1>
                        </div>

                        <div
                            className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
                            style={{
                                borderColor: CIM.border,
                                background: CIM.white,
                                color: CIM.primary,
                            }}
                        >
                            <RefreshCw className="size-4" />
                            <span>Updated {formatDateTime(lastUpdated)}</span>
                        </div>
                    </section>

                    {!hasRates ? (
                        <section
                            className="flex min-h-[360px] flex-col items-center justify-center rounded-lg border px-6 text-center"
                            style={{
                                borderColor: CIM.border,
                                background: CIM.white,
                                color: CIM.primary,
                            }}
                        >
                            <SearchX
                                className="mb-4 size-10"
                                style={{ color: CIM.accent }}
                            />
                            <p className="text-lg font-semibold">
                                Exchange rates are not available yet. Please
                                try again later.
                            </p>
                        </section>
                    ) : (
                        <>
                            <section className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
                                <div
                                    className="rounded-lg border p-5 shadow-sm"
                                    style={{
                                        borderColor: CIM.border,
                                        background: CIM.white,
                                    }}
                                >
                                    <div className="mb-5 flex items-center justify-between gap-3">
                                        <div>
                                            <h2
                                                className="text-lg font-semibold"
                                                style={{ color: CIM.dark }}
                                            >
                                                Currency Converter
                                            </h2>
                                            <p
                                                className="text-sm"
                                                style={{ color: CIM.secondary }}
                                            >
                                                {baseCurrency} base market rates
                                            </p>
                                        </div>
                                        <Calculator
                                            className="size-6"
                                            style={{ color: CIM.accent }}
                                        />
                                    </div>

                                    {(prefill.amount || prefill.from || prefill.to) && (
                                        <div className="mb-4 rounded-lg border border-[#D4A23C]/50 bg-[#D4A23C]/10 px-4 py-3 text-sm font-semibold text-[#061F39]">
                                            This converter was opened with prefilled values.
                                        </div>
                                    )}

                                    <div className="grid gap-4 md:grid-cols-[1fr_180px_auto_180px] md:items-end">
                                        <label className="block">
                                            <span className="mb-1.5 block text-sm font-medium text-slate-700">
                                                Amount
                                            </span>
                                            <input
                                                className="h-11 w-full rounded-md border px-3 text-base font-semibold placeholder:text-slate-500 outline-none transition focus:ring-2"
                                                min="0"
                                                onChange={(event) =>
                                                    setAmount(event.target.value)
                                                }
                                                style={{
                                                    borderColor: CIM.border,
                                                    backgroundColor:
                                                        CIM.white,
                                                    color: CIM.dark,
                                                    WebkitTextFillColor:
                                                        CIM.dark,
                                                    caretColor: CIM.accent,
                                                    '--tw-ring-color':
                                                        CIM.accent,
                                                }}
                                                type="number"
                                                value={amount}
                                            />
                                        </label>

                                        <CurrencySelect
                                            currencies={currencies}
                                            label="From"
                                            onChange={setFromCurrency}
                                            value={fromCurrency}
                                        />

                                        <button
                                            aria-label="Swap currencies"
                                            className="flex h-11 w-11 items-center justify-center rounded-md border transition hover:shadow-sm"
                                            onClick={swapCurrencies}
                                            style={{
                                                borderColor: CIM.border,
                                                background: CIM.primary,
                                                color: CIM.white,
                                            }}
                                            title="Swap currencies"
                                            type="button"
                                        >
                                            <ArrowLeftRight className="size-5" />
                                        </button>

                                        <CurrencySelect
                                            currencies={currencies}
                                            label="To"
                                            onChange={setToCurrency}
                                            value={toCurrency}
                                        />
                                    </div>

                                    <div
                                        className="mt-5 rounded-lg border p-4"
                                        style={{
                                            borderColor: '#E5E9EA',
                                            background: '#FAFBFC',
                                        }}
                                    >
                                        <div className="text-sm font-medium text-slate-500">
                                            Converted amount
                                        </div>
                                        <div
                                            className="mt-1 text-3xl font-semibold"
                                            style={{ color: CIM.primary }}
                                        >
                                            {formatResult(conversion)}{' '}
                                            {toCurrency}
                                        </div>
                                        <div className="mt-2 text-sm text-slate-500">
                                            {formatResult(asNumber(amount))}{' '}
                                            {fromCurrency}
                                        </div>
                                    </div>
                                </div>

                                <div
                                    className="rounded-lg border p-5 shadow-sm"
                                    style={{
                                        borderColor: CIM.border,
                                        background: CIM.white,
                                    }}
                                >
                                    <div className="mb-4 flex items-center justify-between">
                                        <h2
                                            className="text-lg font-semibold"
                                            style={{ color: CIM.dark }}
                                        >
                                            Popular Rates
                                        </h2>
                                        <TrendingUp
                                            className="size-5"
                                            style={{ color: CIM.secondary }}
                                        />
                                    </div>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        {popularPairs.map((pair) => (
                                            <div
                                                className="rounded-lg border p-4"
                                                key={`${pair.from}-${pair.to}`}
                                                style={{
                                                    borderColor: '#E5E9EA',
                                                    background: '#FAFBFC',
                                                }}
                                            >
                                                <div className="text-sm font-medium text-slate-500">
                                                    1 {pair.from} to {pair.to}
                                                </div>
                                                <div
                                                    className="mt-2 text-xl font-semibold"
                                                    style={{ color: CIM.dark }}
                                                >
                                                    {formatRate(pair.rate)}{' '}
                                                    {pair.to}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </section>

                            <section
                                className="overflow-hidden rounded-lg border shadow-sm"
                                style={{
                                    borderColor: CIM.border,
                                    background: CIM.white,
                                }}
                            >
                                <div className="border-b border-[#D1D9DA] px-5 py-4">
                                    <h2
                                        className="text-lg font-semibold"
                                        style={{ color: CIM.dark }}
                                    >
                                        Rates Table
                                    </h2>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-[#E5E9EA] text-left text-sm">
                                        <thead style={{ background: '#FAFBFC' }}>
                                            <tr>
                                                <th className="px-5 py-3 font-semibold text-slate-600">
                                                    Currency code
                                                </th>
                                                <th className="px-5 py-3 font-semibold text-slate-600">
                                                    Rate vs USD
                                                </th>
                                                <th className="px-5 py-3 font-semibold text-slate-600">
                                                    Rate vs MAD
                                                </th>
                                                <th className="px-5 py-3 font-semibold text-slate-600">
                                                    Last updated
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#EEF1F2]">
                                            {rates.map((rate) => (
                                                <tr
                                                    className="transition hover:bg-[#F7F8FA]"
                                                    key={rate.currency}
                                                >
                                                    <td className="px-5 py-3 font-semibold text-slate-900">
                                                        {rate.currency}
                                                    </td>
                                                    <td className="px-5 py-3 text-slate-700">
                                                        1 USD ={' '}
                                                        {formatRate(
                                                            rate.rate_vs_usd,
                                                        )}{' '}
                                                        {rate.currency}
                                                    </td>
                                                    <td className="px-5 py-3 text-slate-700">
                                                        1 {rate.currency} ={' '}
                                                        {formatRate(
                                                            rate.rate_vs_mad,
                                                        )}{' '}
                                                        MAD
                                                    </td>
                                                    <td className="px-5 py-3 text-slate-600">
                                                        {formatDateTime(
                                                            rate.fetched_at,
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                        </>
                    )}
                </div>
            </main>
        </>
    );
}

function CurrencySelect({
    currencies,
    label,
    onChange,
    value,
}) {
    const [open, setOpen] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        function handlePointerDown(event) {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target)
            ) {
                setOpen(false);
            }
        }

        function handleKeyDown(event) {
            if (event.key === 'Escape') {
                setOpen(false);
            }
        }

        document.addEventListener('pointerdown', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('pointerdown', handlePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    function selectCurrency(currency) {
        onChange(currency);
        setOpen(false);
    }

    return (
        <div className="relative block" ref={containerRef}>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
                {label}
            </label>
            <button
                aria-expanded={open}
                aria-haspopup="listbox"
                className="flex h-11 w-full items-center justify-between rounded-md border px-3 text-left text-base font-semibold outline-none transition focus:ring-2"
                onClick={() => setOpen((isOpen) => !isOpen)}
                style={{
                    borderColor: open ? CIM.accent : CIM.border,
                    backgroundColor: CIM.white,
                    color: CIM.dark,
                    WebkitTextFillColor: CIM.dark,
                    '--tw-ring-color': 'rgba(212,162,60,0.20)',
                }}
                type="button"
            >
                <span>{value}</span>
                <ChevronDown
                    className={`size-4 transition ${open ? 'rotate-180' : ''}`}
                    style={{ color: CIM.secondary }}
                />
            </button>

            {open && (
                <div
                    className="absolute right-0 left-0 top-[calc(100%+6px)] z-50 max-h-64 overflow-y-auto rounded-md border py-1 shadow-xl"
                    role="listbox"
                    style={{
                        backgroundColor: CIM.white,
                        borderColor: CIM.border,
                        color: CIM.dark,
                    }}
                >
                    {currencies.map((currency) => {
                        const selected = currency === value;

                        return (
                            <button
                                aria-selected={selected}
                                className="block w-full px-3 py-2 text-left text-sm font-semibold transition hover:bg-[#F7F8FA]"
                                key={currency}
                                onClick={() => selectCurrency(currency)}
                                role="option"
                                style={{
                                    color: CIM.dark,
                                    backgroundColor: selected
                                        ? '#F7F8FA'
                                        : CIM.white,
                                }}
                                type="button"
                            >
                                {currency}
                            </button>
                        );
                    })}
                </div>
            )}

            <select
                aria-hidden="true"
                className="hidden"
                onChange={(event) => onChange(event.target.value)}
                tabIndex={-1}
                value={value}
            >
                {currencies.map((currency) => (
                    <option
                        key={currency}
                        style={{
                            color: CIM.dark,
                            backgroundColor: CIM.white,
                        }}
                        value={currency}
                    >
                        {currency}
                    </option>
                ))}
            </select>
        </div>
    );
}
