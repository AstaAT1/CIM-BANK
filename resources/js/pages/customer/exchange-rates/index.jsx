import { Head } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { gsap } from 'gsap';
import {
    ArrowLeftRight,
    ArrowUpRight,
    BadgeCheck,
    Calculator,
    ChevronDown,
    CircleDollarSign,
    Clock3,
    Coins,
    Globe2,
    Landmark,
    Layers3,
    RefreshCw,
    SearchX,
    ShieldCheck,
    Sparkles,
    TrendingUp,
    WalletCards,
} from 'lucide-react';

const CIM = {
    primary: '#082F54',
    secondary: '#0A6474',
    accent: '#D4A23C',
    dark: '#061F39',
    background: '#F7F8FA',
    white: '#FFFFFF',
    border: '#D1D9DA',
};

function toFiniteNumber(value) {
    if (value === null || value === undefined || value === '') {
        return null;
    }

    const parsed = Number(String(value).replaceAll(',', '').trim());

    return Number.isFinite(parsed) ? parsed : null;
}

function asNumber(value) {
    return toFiniteNumber(value) ?? 0;
}

function formatRate(value) {
    const number = toFiniteNumber(value);

    if (number === null) {
        return '-';
    }

    return number.toLocaleString('en-US', {
        maximumFractionDigits: number >= 100 ? 4 : 6,
        minimumFractionDigits: number < 10 ? 4 : 2,
    });
}

function formatResult(value) {
    const number = toFiniteNumber(value);

    if (number === null) {
        return '-';
    }

    return number.toLocaleString('en-US', {
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

function convertAmount(amount, fromCurrency, toCurrency, ratesMap = {}) {
    const fromRate = toFiniteNumber(ratesMap?.[fromCurrency]);
    const toRate = toFiniteNumber(ratesMap?.[toCurrency]);

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

function getRateMovement(rate) {
    const number = toFiniteNumber(rate);

    if (number === null) {
        return 'Market watch';
    }

    if (number >= 10) {
        return 'High liquidity';
    }

    if (number >= 1) {
        return 'Stable market';
    }

    return 'Low spread';
}

function MiniStat({ icon: Icon, label, value }) {
    return (
        <motion.div
            className="exchange-reveal rounded-2xl border border-white/10 bg-white/[0.08] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.12)] backdrop-blur"
            whileHover={{ y: -3 }}
            transition={{ duration: 0.22 }}
        >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#D4A23C]/15 text-[#D4A23C] ring-1 ring-[#D4A23C]/20">
                <Icon className="size-5" />
            </div>
            <p className="text-xs font-semibold tracking-[0.18em] text-white/45 uppercase">
                {label}
            </p>
            <p className="mt-1 text-sm font-semibold text-white">{value}</p>
        </motion.div>
    );
}

function SectionTitle({ eyebrow, title, description, action }) {
    return (
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
                {eyebrow ? (
                    <p className="text-xs font-semibold tracking-[0.2em] text-[#0A6474] uppercase dark:text-[#28c7d1]">
                        {eyebrow}
                    </p>
                ) : null}
                <h2 className="mt-1 text-xl font-semibold tracking-[-0.02em] text-[#061F39] dark:text-white">
                    {title}
                </h2>
                {description ? (
                    <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-white/55">
                        {description}
                    </p>
                ) : null}
            </div>
            {action}
        </div>
    );
}

function EmptyRates() {
    return (
        <section className="exchange-reveal relative overflow-hidden rounded-3xl border border-[#D1D9DA] bg-white px-6 py-16 text-center shadow-[0_24px_70px_rgba(8,47,84,0.08)] dark:border-white/10 dark:bg-white/[0.06]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(212,162,60,0.14),transparent_38%)]" />
            <div className="relative z-10 mx-auto max-w-md">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#D4A23C]/15 text-[#D4A23C] ring-1 ring-[#D4A23C]/25">
                    <SearchX className="size-8" />
                </div>
                <h2 className="text-xl font-semibold text-[#061F39] dark:text-white">
                    Exchange rates are not available yet
                </h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-white/55">
                    CIM Currency Desk could not load market rates. Please try again later.
                </p>
            </div>
        </section>
    );
}

function RatePill({ pair }) {
    return (
        <motion.div
            className="rate-chip group relative overflow-hidden rounded-2xl border border-[#D1D9DA] bg-white p-4 shadow-sm transition hover:border-[#D4A23C]/60 dark:border-white/10 dark:bg-white/[0.06]"
            whileHover={{ y: -4, scale: 1.01 }}
            transition={{ duration: 0.18 }}
        >
            <div className="absolute top-0 right-0 h-20 w-20 rounded-bl-full bg-[#0A6474]/10 transition group-hover:bg-[#D4A23C]/15" />
            <div className="relative z-10 flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-semibold tracking-[0.16em] text-slate-500 uppercase dark:text-white/45">
                        1 {pair.from} to {pair.to}
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-[#061F39] dark:text-white">
                        {formatRate(pair.rate)}
                    </p>
                    <p className="mt-1 text-sm font-medium text-[#0A6474] dark:text-[#28c7d1]">
                        {pair.to}
                    </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D4A23C]/15 text-[#D4A23C]">
                    <ArrowUpRight className="size-5" />
                </div>
            </div>
        </motion.div>
    );
}

export default function ExchangeRates({
    baseCurrency = 'USD',
    rates = [],
    ratesMap = {},
    popularPairs = [],
    lastUpdated,
}) {
    const pageRef = useRef(null);
    const safeRates = Array.isArray(rates) ? rates : [];
    const safePopularPairs = Array.isArray(popularPairs) ? popularPairs : [];

    const currencies = useMemo(
        () => safeRates.map((rate) => rate.currency).filter(Boolean).sort(),
        [safeRates],
    );

    const prefill = readPrefill(currencies, baseCurrency);
    const defaultCurrency =
        prefill.fallback ||
        (currencies.includes(baseCurrency) ? baseCurrency : currencies[0]) ||
        'MAD';

    const [amount, setAmount] = useState(prefill.amount || '100');
    const [fromCurrency, setFromCurrency] = useState(
        prefill.from || (currencies.includes('MAD') ? 'MAD' : defaultCurrency),
    );
    const [toCurrency, setToCurrency] = useState(
        prefill.to ||
            (currencies.includes('USD')
                ? 'USD'
                : currencies.find((currency) => currency !== defaultCurrency) ||
                  defaultCurrency),
    );

    const amountNumber = asNumber(amount);

    const conversion = useMemo(
        () => convertAmount(amountNumber, fromCurrency, toCurrency, ratesMap),
        [amountNumber, fromCurrency, ratesMap, toCurrency],
    );

    const hasRates = currencies.length > 0;

    const displayPairs = useMemo(() => {
        if (safePopularPairs.length) {
            return safePopularPairs;
        }

        return currencies
            .filter((currency) => currency !== fromCurrency)
            .slice(0, 4)
            .map((currency) => ({
                from: fromCurrency,
                to: currency,
                rate: convertAmount(1, fromCurrency, currency, ratesMap),
            }))
            .filter((pair) => pair.rate !== null);
    }, [currencies, fromCurrency, ratesMap, safePopularPairs]);

    const baseRate = ratesMap?.[baseCurrency] ?? ratesMap?.USD ?? 1;
    const madRate = ratesMap?.MAD ?? null;

    useEffect(() => {
        if (!pageRef.current) {
            return undefined;
        }

        const context = gsap.context(() => {
            gsap.fromTo(
                '.exchange-reveal',
                { autoAlpha: 0, y: 22 },
                {
                    autoAlpha: 1,
                    y: 0,
                    duration: 0.72,
                    stagger: 0.075,
                    ease: 'power3.out',
                },
            );

            gsap.fromTo(
                '.rate-row',
                { autoAlpha: 0, x: -12 },
                {
                    autoAlpha: 1,
                    x: 0,
                    duration: 0.42,
                    stagger: 0.035,
                    ease: 'power2.out',
                    delay: 0.28,
                },
            );

            gsap.to('.currency-orb', {
                y: -10,
                x: 8,
                duration: 4.2,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut',
            });

            gsap.to('.gold-pulse', {
                scale: 1.05,
                opacity: 0.72,
                duration: 2.8,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut',
            });
        }, pageRef);

        return () => context.revert();
    }, []);

    function swapCurrencies() {
        setFromCurrency(toCurrency);
        setToCurrency(fromCurrency);
    }

    return (
        <>
            <Head title="Exchange Rates" />

            <main
                ref={pageRef}
                className="relative min-h-full overflow-hidden bg-[#F7F8FA] px-4 py-5 text-[#061F39] sm:px-6 lg:px-8 dark:bg-[#041a2e] dark:text-white"
            >
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="currency-orb absolute -top-24 right-10 h-72 w-72 rounded-full bg-[#0A6474]/18 blur-3xl dark:bg-[#0A6474]/30" />
                    <div className="gold-pulse absolute top-36 -left-24 h-80 w-80 rounded-full bg-[#D4A23C]/12 blur-3xl dark:bg-[#D4A23C]/18" />
                    <div className="absolute right-0 bottom-0 h-96 w-96 rounded-full bg-[#082F54]/8 blur-3xl dark:bg-[#082F54]/45" />
                </div>

                <div className="relative z-10 mx-auto flex max-w-7xl flex-col gap-6">
                    <section className="exchange-reveal relative overflow-hidden rounded-[2rem] border border-[#D1D9DA] bg-[#061F39] p-5 text-white shadow-[0_30px_90px_rgba(6,31,57,0.22)] sm:p-7 lg:p-8 dark:border-white/10">
                        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(8,47,84,0.98),rgba(6,31,57,0.96)_45%,rgba(10,100,116,0.75))]" />
                        <div className="absolute inset-0 opacity-[0.18] [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.55)_1px,transparent_0)] [background-size:28px_28px]" />
                        <div className="absolute top-0 right-0 h-60 w-60 rounded-bl-full bg-[#0A6474]/25" />
                        <div className="absolute -right-10 bottom-0 h-48 w-48 rounded-full bg-[#D4A23C]/20 blur-2xl" />

                        <div className="relative z-10 grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
                            <div>
                                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold tracking-[0.18em] text-[#D4A23C] uppercase backdrop-blur">
                                    <Coins className="size-4" />
                                    CIM Currency Desk
                                </div>

                                <h1 className="max-w-3xl text-3xl font-semibold tracking-[-0.04em] sm:text-5xl lg:text-6xl">
                                    Exchange rates for smarter banking decisions.
                                </h1>

                                <p className="mt-4 max-w-2xl text-sm leading-6 text-white/68 sm:text-base">
                                    Convert currencies, monitor popular pairs, and review CIM market rates in one secure banking workspace.
                                </p>

                                <div className="mt-6 flex flex-wrap gap-3">
                                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-2 text-sm text-white/75 backdrop-blur">
                                        <RefreshCw className="size-4 text-[#D4A23C]" />
                                        Updated {formatDateTime(lastUpdated)}
                                    </div>
                                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-2 text-sm text-white/75 backdrop-blur">
                                        <ShieldCheck className="size-4 text-[#28c7d1]" />
                                        Secure CIM rate engine
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                                <MiniStat
                                    icon={Globe2}
                                    label="Currencies"
                                    value={hasRates ? currencies.length : 'Pending'}
                                />
                                <MiniStat
                                    icon={Landmark}
                                    label="Base"
                                    value={`${baseCurrency || 'USD'} / ${formatRate(baseRate)}`}
                                />
                                <MiniStat
                                    icon={Clock3}
                                    label="MAD rate"
                                    value={madRate ? formatRate(madRate) : 'Market sync'}
                                />
                            </div>
                        </div>
                    </section>

                    {!hasRates ? (
                        <EmptyRates />
                    ) : (
                        <>
                            <section className="grid gap-5 xl:grid-cols-[minmax(0,1.08fr)_minmax(340px,0.92fr)]">
                                <motion.div
                                    className="exchange-reveal relative overflow-hidden rounded-[1.7rem] border border-[#D1D9DA] bg-white p-5 shadow-[0_24px_70px_rgba(8,47,84,0.08)] sm:p-6 dark:border-white/10 dark:bg-white/[0.06] dark:shadow-[0_24px_70px_rgba(0,0,0,0.22)]"
                                    whileHover={{ y: -3 }}
                                    transition={{ duration: 0.22 }}
                                >
                                    <div className="absolute top-0 right-0 h-40 w-40 rounded-bl-full bg-[#0A6474]/8 dark:bg-[#0A6474]/20" />
                                    <div className="relative z-10">
                                        <SectionTitle
                                            eyebrow="Converter"
                                            title="Currency Converter"
                                            description={`${baseCurrency} base market rates with fast CIM conversion preview.`}
                                            action={
                                                <div className="hidden h-12 w-12 items-center justify-center rounded-2xl bg-[#D4A23C]/15 text-[#D4A23C] ring-1 ring-[#D4A23C]/20 sm:flex">
                                                    <Calculator className="size-6" />
                                                </div>
                                            }
                                        />

                                        {(prefill.amount || prefill.from || prefill.to) && (
                                            <div className="mb-5 rounded-2xl border border-[#D4A23C]/45 bg-[#D4A23C]/10 px-4 py-3 text-sm font-semibold text-[#061F39] dark:text-white">
                                                This converter was opened with prefilled values.
                                            </div>
                                        )}

                                        <div className="grid gap-4 md:grid-cols-[1fr_190px_auto_190px] md:items-end">
                                            <label className="block">
                                                <span className="mb-1.5 block text-sm font-semibold text-slate-600 dark:text-white/65">
                                                    Amount
                                                </span>
                                                <div className="relative">
                                                    <CircleDollarSign className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-[#0A6474] dark:text-[#28c7d1]" />
                                                    <input
                                                        className="h-12 w-full rounded-2xl border border-[#D1D9DA] bg-[#F7F8FA] pr-3 pl-11 text-base font-semibold text-[#061F39] transition outline-none placeholder:text-slate-400 focus:border-[#D4A23C] focus:ring-4 focus:ring-[#D4A23C]/15 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:placeholder:text-white/35"
                                                        inputMode="decimal"
                                                        min="0"
                                                        onChange={(event) => setAmount(event.target.value)}
                                                        type="number"
                                                        value={amount}
                                                    />
                                                </div>
                                            </label>

                                            <CurrencySelect
                                                currencies={currencies}
                                                label="From"
                                                onChange={setFromCurrency}
                                                value={fromCurrency}
                                            />

                                            <motion.button
                                                aria-label="Swap currencies"
                                                className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#D4A23C]/45 bg-[#061F39] text-[#D4A23C] shadow-[0_16px_35px_rgba(6,31,57,0.18)] transition hover:bg-[#082F54] focus:ring-4 focus:ring-[#D4A23C]/20 dark:border-[#D4A23C]/35 dark:bg-[#D4A23C] dark:text-[#061F39]"
                                                onClick={swapCurrencies}
                                                title="Swap currencies"
                                                type="button"
                                                whileHover={{ rotate: 180, scale: 1.04 }}
                                                whileTap={{ scale: 0.94 }}
                                                transition={{ duration: 0.28 }}
                                            >
                                                <ArrowLeftRight className="size-5" />
                                            </motion.button>

                                            <CurrencySelect
                                                currencies={currencies}
                                                label="To"
                                                onChange={setToCurrency}
                                                value={toCurrency}
                                            />
                                        </div>

                                        <motion.div
                                            key={`${amount}-${fromCurrency}-${toCurrency}`}
                                            className="mt-6 overflow-hidden rounded-[1.5rem] border border-[#082F54]/10 bg-[#061F39] p-5 text-white shadow-[0_24px_70px_rgba(6,31,57,0.16)]"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.28 }}
                                        >
                                            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                                                <div>
                                                    <p className="text-xs font-semibold tracking-[0.18em] text-white/45 uppercase">
                                                        Converted amount
                                                    </p>
                                                    <div className="mt-2 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
                                                        {formatResult(conversion)}{' '}
                                                        <span className="text-2xl text-[#D4A23C] sm:text-3xl">
                                                            {toCurrency}
                                                        </span>
                                                    </div>
                                                    <p className="mt-2 text-sm text-white/60">
                                                        {formatResult(amountNumber)} {fromCurrency} at live CIM market preview.
                                                    </p>
                                                </div>

                                                <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                                                    <p className="text-xs font-semibold tracking-[0.16em] text-white/45 uppercase">
                                                        Pair quality
                                                    </p>
                                                    <p className="mt-1 font-semibold text-[#28c7d1]">
                                                        {getRateMovement(conversion)}
                                                    </p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    </div>
                                </motion.div>

                                <motion.div
                                    className="exchange-reveal rounded-[1.7rem] border border-[#D1D9DA] bg-white p-5 shadow-[0_24px_70px_rgba(8,47,84,0.08)] sm:p-6 dark:border-white/10 dark:bg-white/[0.06]"
                                    whileHover={{ y: -3 }}
                                    transition={{ duration: 0.22 }}
                                >
                                    <SectionTitle
                                        eyebrow="Market watch"
                                        title="Popular Rates"
                                        description="Quick pairs used often by CIM customers."
                                        action={
                                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0A6474]/10 text-[#0A6474] dark:bg-[#28c7d1]/10 dark:text-[#28c7d1]">
                                                <TrendingUp className="size-5" />
                                            </div>
                                        }
                                    />

                                    <div className="grid gap-3 sm:grid-cols-2">
                                        {displayPairs.map((pair) => (
                                            <RatePill
                                                key={`${pair.from}-${pair.to}`}
                                                pair={pair}
                                            />
                                        ))}
                                    </div>

                                    <div className="mt-5 rounded-2xl border border-[#D1D9DA] bg-[#F7F8FA] p-4 dark:border-white/10 dark:bg-white/[0.05]">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D4A23C]/15 text-[#D4A23C]">
                                                <BadgeCheck className="size-5" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-[#061F39] dark:text-white">
                                                    CIM protected conversion preview
                                                </p>
                                                <p className="text-sm text-slate-500 dark:text-white/55">
                                                    Final branch rates may include CIM service policy and timing rules.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            </section>

                            <section className="exchange-reveal overflow-hidden rounded-[1.7rem] border border-[#D1D9DA] bg-white shadow-[0_24px_70px_rgba(8,47,84,0.08)] dark:border-white/10 dark:bg-white/[0.06]">
                                <div className="flex flex-col gap-3 border-b border-[#D1D9DA] px-5 py-5 sm:flex-row sm:items-center sm:justify-between dark:border-white/10">
                                    <SectionTitle
                                        eyebrow="Desk table"
                                        title="Rates Table"
                                        description="Latest currency rates synchronized with CIM market data."
                                    />
                                    <div className="inline-flex items-center gap-2 rounded-full border border-[#D1D9DA] bg-[#F7F8FA] px-3 py-2 text-sm font-semibold text-[#082F54] dark:border-white/10 dark:bg-white/[0.06] dark:text-white">
                                        <Layers3 className="size-4 text-[#D4A23C]" />
                                        {safeRates.length} records
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-[#E5E9EA] text-left text-sm dark:divide-white/10">
                                        <thead className="bg-[#F7F8FA] dark:bg-white/[0.04]">
                                            <tr>
                                                <th className="px-5 py-4 font-semibold text-slate-600 dark:text-white/60">
                                                    Currency code
                                                </th>
                                                <th className="px-5 py-4 font-semibold text-slate-600 dark:text-white/60">
                                                    Rate vs USD
                                                </th>
                                                <th className="px-5 py-4 font-semibold text-slate-600 dark:text-white/60">
                                                    Rate vs MAD
                                                </th>
                                                <th className="px-5 py-4 font-semibold text-slate-600 dark:text-white/60">
                                                    Last updated
                                                </th>
                                                <th className="px-5 py-4 font-semibold text-slate-600 dark:text-white/60">
                                                    Status
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#EEF1F2] dark:divide-white/10">
                                            {safeRates.map((rate) => (
                                                <tr
                                                    className="rate-row transition hover:bg-[#F7F8FA] dark:hover:bg-white/[0.05]"
                                                    key={rate.currency}
                                                >
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0A6474]/10 text-[#0A6474] dark:bg-[#28c7d1]/10 dark:text-[#28c7d1]">
                                                                <WalletCards className="size-5" />
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-[#061F39] dark:text-white">
                                                                    {rate.currency}
                                                                </p>
                                                                <p className="text-xs text-slate-500 dark:text-white/45">
                                                                    CIM currency
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4 font-medium text-slate-700 dark:text-white/72">
                                                        1 USD = {formatRate(rate.rate_vs_usd)} {rate.currency}
                                                    </td>
                                                    <td className="px-5 py-4 font-medium text-slate-700 dark:text-white/72">
                                                        1 {rate.currency} = {formatRate(rate.rate_vs_mad)} MAD
                                                    </td>
                                                    <td className="px-5 py-4 text-slate-600 dark:text-white/55">
                                                        {formatDateTime(rate.fetched_at)}
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300">
                                                            <Sparkles className="size-3.5" />
                                                            Live
                                                        </span>
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

function CurrencySelect({ currencies, label, onChange, value }) {
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
            <label className="mb-1.5 block text-sm font-semibold text-slate-600 dark:text-white/65">
                {label}
            </label>
            <button
                aria-expanded={open}
                aria-haspopup="listbox"
                className="flex h-12 w-full items-center justify-between rounded-2xl border border-[#D1D9DA] bg-[#F7F8FA] px-3 text-left text-base font-semibold text-[#061F39] transition outline-none focus:border-[#D4A23C] focus:ring-4 focus:ring-[#D4A23C]/15 dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
                onClick={() => setOpen((isOpen) => !isOpen)}
                type="button"
            >
                <span>{value}</span>
                <ChevronDown
                    className={`size-4 text-[#0A6474] transition dark:text-[#28c7d1] ${open ? 'rotate-180' : ''}`}
                />
            </button>

            {open && (
                <motion.div
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="absolute top-[calc(100%+8px)] right-0 left-0 z-50 max-h-64 overflow-y-auto rounded-2xl border border-[#D1D9DA] bg-white py-1 shadow-2xl dark:border-white/10 dark:bg-[#082F54]"
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    role="listbox"
                    transition={{ duration: 0.16 }}
                >
                    {currencies.map((currency) => {
                        const selected = currency === value;

                        return (
                            <button
                                aria-selected={selected}
                                className={`block w-full px-3 py-2.5 text-left text-sm font-semibold transition ${
                                    selected
                                        ? 'bg-[#F7F8FA] text-[#082F54] dark:bg-white/10 dark:text-white'
                                        : 'text-[#061F39] hover:bg-[#F7F8FA] dark:text-white/80 dark:hover:bg-white/10'
                                }`}
                                key={currency}
                                onClick={() => selectCurrency(currency)}
                                role="option"
                                type="button"
                            >
                                {currency}
                            </button>
                        );
                    })}
                </motion.div>
            )}

            <select
                aria-hidden="true"
                className="hidden"
                onChange={(event) => onChange(event.target.value)}
                tabIndex={-1}
                value={value}
            >
                {currencies.map((currency) => (
                    <option key={currency} value={currency}>
                        {currency}
                    </option>
                ))}
            </select>
        </div>
    );
}