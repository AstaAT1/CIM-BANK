import { Head, Link } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { gsap } from 'gsap';
import {
    ArrowDownLeft,
    ArrowRightLeft,
    CalendarClock,
    CheckCircle2,
    Copy,
    CreditCard,
    Landmark,
    MapPin,
    ReceiptText,
    Send,
    ShieldCheck,
    Sparkles,
    User,
    WalletCards,
} from 'lucide-react';
import CimChatbot from '@/components/customer/CimChatbot';
import { dashboard } from '@/routes';
import { atmMap, exchangeRates } from '@/routes/customer';
import { edit as editProfile } from '@/routes/profile';

const CIM = {
    primary: '#082F54',
    secondary: '#0A6474',
    accent: '#D4A23C',
    dark: '#061F39',
    background: '#F7F8FA',
    white: '#FFFFFF',
    border: '#D1D9DA',
};

const statusTone = {
    active: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    verified: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    pending: 'border-amber-200 bg-amber-50 text-amber-700',
    processing: 'border-sky-200 bg-sky-50 text-sky-700',
    rejected: 'border-rose-200 bg-rose-50 text-rose-700',
    blocked: 'border-rose-200 bg-rose-50 text-rose-700',
    inactive: 'border-slate-200 bg-slate-50 text-slate-600',
};

function formatCurrency(amount, currency = 'MAD') {
    return new Intl.NumberFormat('en-MA', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number(amount || 0));
}

function formatDateTime(value) {
    if (!value) {
        return 'No activity yet';
    }

    return new Intl.DateTimeFormat('en-MA', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value));
}

function titleCase(value) {
    return String(value || 'unknown')
        .replaceAll('_', ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function StatusBadge({ status }) {
    const normalized = String(status || 'unknown').toLowerCase();

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${statusTone[normalized] ?? 'border-slate-200 bg-white text-slate-600'}`}
        >
            <CheckCircle2 className="h-3.5 w-3.5" />
            {titleCase(normalized)}
        </span>
    );
}

function SectionTitle({ eyebrow, title, action }) {
    return (
        <div className="mb-4 flex items-end justify-between gap-4">
            <div>
                {eyebrow ? (
                    <p className="text-xs font-semibold tracking-[0.18em] text-[#0A6474] uppercase">
                        {eyebrow}
                    </p>
                ) : null}
                <h2 className="text-xl font-semibold text-[#061F39]">
                    {title}
                </h2>
            </div>
            {action}
        </div>
    );
}

function EmptyPanel({ title, message }) {
    return (
        <div className="rounded-lg border border-dashed border-[#D1D9DA] bg-white px-6 py-8 text-center">
            <ReceiptText className="mx-auto mb-3 h-8 w-8 text-[#0A6474]" />
            <h3 className="font-semibold text-[#061F39]">{title}</h3>
            <p className="mt-1 text-sm text-slate-500">{message}</p>
        </div>
    );
}

export default function Dashboard({
    customer = {},
    account = null,
    card = null,
    transactions = [],
    summary = {},
}) {
    const dashboardRef = useRef(null);
    const [copied, setCopied] = useState(false);

    const firstName =
        customer.first_name || customer.name?.split(' ')?.[0] || 'Customer';
    const accountStatus = account?.status || 'inactive';
    const cardStatus = card?.status || 'inactive';
    const verificationStatus = customer.verification_status || 'verified';
    const currency = account?.currency || 'MAD';

    const quickActions = useMemo(
        () => [
            {
                label: 'Transfer Money',
                description: 'Send MAD to active beneficiaries',
                href: '/customer/transfers',
                icon: Send,
                tone: 'bg-[#082F54] text-white',
            },
            {
                label: 'Find ATM',
                description: 'Map nearby service points',
                href: atmMap(),
                icon: MapPin,
                tone: 'bg-white text-[#061F39]',
            },
            {
                label: 'Exchange Rates',
                description: 'Convert MAD and global currencies',
                href: exchangeRates(),
                icon: ArrowRightLeft,
                tone: 'bg-white text-[#061F39]',
            },
            {
                label: 'Bills & AutoPay',
                description: summary?.upcoming_bill
                    ? `${summary.upcoming_bill.label} - ${formatCurrency(summary.upcoming_bill.amount, currency)}`
                    : 'Pay bills and manage AutoPay',
                href: '/customer/bills',
                icon: ReceiptText,
                tone: 'bg-white text-[#061F39]',
            },
            {
                label: 'View Profile',
                description: 'Manage your customer details',
                href: editProfile(),
                icon: User,
                tone: 'bg-white text-[#061F39]',
            },
        ],
        [currency, summary?.upcoming_bill],
    );

    useEffect(() => {
        if (!dashboardRef.current) {
            return undefined;
        }

        const context = gsap.context(() => {
            gsap.fromTo(
                '.dashboard-reveal',
                { autoAlpha: 0, y: 18 },
                {
                    autoAlpha: 1,
                    y: 0,
                    duration: 0.72,
                    stagger: 0.08,
                    ease: 'power3.out',
                },
            );

            gsap.fromTo(
                '.transaction-row',
                { autoAlpha: 0, x: -10 },
                {
                    autoAlpha: 1,
                    x: 0,
                    duration: 0.45,
                    stagger: 0.05,
                    ease: 'power2.out',
                    delay: 0.25,
                },
            );

            gsap.to('.bank-card-float', {
                y: -6,
                duration: 2.8,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut',
            });
        }, dashboardRef);

        return () => context.revert();
    }, []);

    const copyRib = async () => {
        if (!account?.rib) {
            return;
        }

        await navigator.clipboard.writeText(account.rib);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
    };

    return (
        <>
            <Head title="My Banking" />

            <main
                ref={dashboardRef}
                className="min-h-full overflow-hidden bg-[#F7F8FA] px-4 py-5 sm:px-6 lg:px-8"
                style={{ color: CIM.dark }}
            >
                <div className="mx-auto flex max-w-7xl flex-col gap-6">
                    <section className="dashboard-reveal flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
                        <div>
                            <p className="text-sm font-medium text-[#0A6474]">
                                Welcome back, {firstName}
                            </p>
                            <h1 className="mt-1 text-3xl font-semibold text-[#061F39] sm:text-4xl">
                                My Banking
                            </h1>
                            <p className="mt-2 max-w-2xl text-sm text-slate-500">
                                Your CIM accounts, card, and recent banking
                                activity in one secure place.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <StatusBadge status={verificationStatus} />
                            <StatusBadge status={accountStatus} />
                        </div>
                    </section>

                    <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
                        <motion.div
                            className="dashboard-reveal relative overflow-hidden rounded-xl border border-[#D1D9DA] bg-[#061F39] p-6 text-white shadow-[0_24px_70px_rgba(6,31,57,0.18)]"
                            whileHover={{ y: -3 }}
                            transition={{ duration: 0.25 }}
                        >
                            <div className="absolute top-0 right-0 h-44 w-44 rounded-bl-full bg-[#0A6474]/35" />
                            <div className="absolute right-16 bottom-0 h-24 w-24 rounded-full bg-[#D4A23C]/25 blur-2xl" />
                            <div className="relative z-10 grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
                                <div>
                                    <div className="flex items-center gap-2 text-sm text-white/75">
                                        <WalletCards className="h-4 w-4 text-[#D4A23C]" />
                                        Current balance
                                    </div>
                                    <div className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
                                        {formatCurrency(
                                            account?.balance,
                                            currency,
                                        )}
                                    </div>
                                    <p className="mt-3 max-w-md text-sm text-white/70">
                                        Main active account balance in Moroccan
                                        dirham.
                                    </p>
                                </div>
                                <div className="rounded-lg border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
                                    <p className="text-xs tracking-[0.16em] text-white/60 uppercase">
                                        Account type
                                    </p>
                                    <p className="mt-1 font-semibold text-white">
                                        {titleCase(
                                            account?.account_type ||
                                                'current account',
                                        )}
                                    </p>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            className="dashboard-reveal rounded-xl border border-[#D1D9DA] bg-white p-6 shadow-sm"
                            whileHover={{ y: -3 }}
                            transition={{ duration: 0.25 }}
                        >
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-xs font-semibold tracking-[0.18em] text-[#0A6474] uppercase">
                                        Account number / RIB
                                    </p>
                                    <h2 className="mt-2 text-2xl font-semibold text-[#061F39]">
                                        {account?.account_number ||
                                            'Account pending'}
                                    </h2>
                                </div>
                                <Landmark className="h-10 w-10 text-[#D4A23C]" />
                            </div>

                            <div className="mt-6 rounded-lg border border-[#D1D9DA] bg-[#F7F8FA] p-4">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="min-w-0">
                                        <p className="text-xs font-semibold tracking-[0.16em] text-slate-500 uppercase">
                                            RIB
                                        </p>
                                        <p className="mt-1 font-mono text-sm font-semibold break-all text-[#061F39]">
                                            {account?.rib ||
                                                'Not available yet'}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={copyRib}
                                        disabled={!account?.rib}
                                        className="inline-flex items-center justify-center gap-2 rounded-md border border-[#D1D9DA] bg-white px-3 py-2 text-sm font-semibold text-[#082F54] transition hover:border-[#D4A23C] hover:text-[#061F39] disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <Copy className="h-4 w-4" />
                                        {copied ? 'Copied' : 'Copy'}
                                    </button>
                                </div>
                            </div>

                            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                                <div className="rounded-lg bg-[#F7F8FA] p-3">
                                    <p className="text-slate-500">Opened</p>
                                    <p className="mt-1 font-semibold text-[#061F39]">
                                        {formatDateTime(account?.opened_at)}
                                    </p>
                                </div>
                                <div className="rounded-lg bg-[#F7F8FA] p-3">
                                    <p className="text-slate-500">
                                        Last activity
                                    </p>
                                    <p className="mt-1 font-semibold text-[#061F39]">
                                        {formatDateTime(
                                            summary?.last_activity_at,
                                        )}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </section>

                    <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
                        <motion.div
                            className="dashboard-reveal bank-card-float relative overflow-hidden rounded-xl bg-[#082F54] p-6 text-white shadow-[0_24px_60px_rgba(8,47,84,0.22)]"
                            whileHover={{ rotateX: 1.5, rotateY: -1.5 }}
                            transition={{ duration: 0.25 }}
                        >
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(212,162,60,0.35),transparent_28%),radial-gradient(circle_at_88%_12%,rgba(10,100,116,0.45),transparent_32%)]" />
                            <div className="relative z-10 min-h-64">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-xs tracking-[0.2em] text-white/65 uppercase">
                                            CIM debit card
                                        </p>
                                        <p className="mt-2 text-lg font-semibold">
                                            Credit Intelligence Mizan
                                        </p>
                                    </div>
                                    <CreditCard className="h-9 w-9 text-[#D4A23C]" />
                                </div>

                                <div className="mt-14 font-mono text-2xl font-semibold tracking-[0.16em]">
                                    {card?.masked_card_number ||
                                        '**** **** **** ****'}
                                </div>

                                <div className="mt-8 grid grid-cols-[1fr_auto] gap-4">
                                    <div>
                                        <p className="text-xs tracking-[0.16em] text-white/55 uppercase">
                                            Card holder
                                        </p>
                                        <p className="mt-1 font-semibold">
                                            {card?.card_holder_name ||
                                                customer.name ||
                                                'Card pending'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs tracking-[0.16em] text-white/55 uppercase">
                                            Expires
                                        </p>
                                        <p className="mt-1 font-semibold">
                                            {card?.expiry_date || '--/--'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        <div className="dashboard-reveal rounded-xl border border-[#D1D9DA] bg-white p-6 shadow-sm">
                            <SectionTitle
                                eyebrow="Status"
                                title="Account health"
                            />
                            <div className="grid gap-3 sm:grid-cols-3">
                                <div className="rounded-lg border border-[#D1D9DA] p-4">
                                    <ShieldCheck className="mb-3 h-6 w-6 text-[#0A6474]" />
                                    <p className="text-sm text-slate-500">
                                        Verification
                                    </p>
                                    <div className="mt-2">
                                        <StatusBadge
                                            status={verificationStatus}
                                        />
                                    </div>
                                </div>
                                <div className="rounded-lg border border-[#D1D9DA] p-4">
                                    <Landmark className="mb-3 h-6 w-6 text-[#0A6474]" />
                                    <p className="text-sm text-slate-500">
                                        Bank account
                                    </p>
                                    <div className="mt-2">
                                        <StatusBadge status={accountStatus} />
                                    </div>
                                </div>
                                <div className="rounded-lg border border-[#D1D9DA] p-4">
                                    <CreditCard className="mb-3 h-6 w-6 text-[#0A6474]" />
                                    <p className="text-sm text-slate-500">
                                        Card
                                    </p>
                                    <div className="mt-2">
                                        <StatusBadge status={cardStatus} />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                <div className="rounded-lg bg-[#F7F8FA] p-4">
                                    <p className="text-sm text-slate-500">
                                        Active accounts
                                    </p>
                                    <p className="mt-2 text-2xl font-semibold text-[#061F39]">
                                        {summary?.active_accounts ??
                                            (account ? 1 : 0)}
                                    </p>
                                </div>
                                <div className="rounded-lg bg-[#F7F8FA] p-4">
                                    <p className="text-sm text-slate-500">
                                        Active cards
                                    </p>
                                    <p className="mt-2 text-2xl font-semibold text-[#061F39]">
                                        {summary?.active_cards ??
                                            (card ? 1 : 0)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="dashboard-reveal rounded-xl border border-[#D1D9DA] bg-white p-6 shadow-sm">
                        <SectionTitle
                            eyebrow="Shortcuts"
                            title="Quick actions"
                        />
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                            {quickActions.map((action) => {
                                const Icon = action.icon;

                                return (
                                    <motion.div
                                        key={action.label}
                                        whileHover={{ y: -4 }}
                                        whileTap={{ scale: 0.98 }}
                                        transition={{ duration: 0.18 }}
                                    >
                                        <Link
                                            href={action.href}
                                            className={`group flex h-full min-h-32 flex-col justify-between rounded-lg border border-[#D1D9DA] p-4 shadow-sm transition hover:border-[#D4A23C] hover:shadow-md ${action.tone}`}
                                        >
                                            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#D4A23C]/15 text-[#D4A23C] transition group-hover:bg-[#D4A23C] group-hover:text-[#061F39]">
                                                <Icon className="h-5 w-5" />
                                            </span>
                                            <span>
                                                <span className="block font-semibold">
                                                    {action.label}
                                                </span>
                                                <span className="mt-1 block text-sm opacity-70">
                                                    {action.description}
                                                </span>
                                            </span>
                                        </Link>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </section>

                    <section className="dashboard-reveal rounded-xl border border-[#D1D9DA] bg-white p-6 shadow-sm">
                        <SectionTitle
                            eyebrow="Activity"
                            title="Latest transactions"
                            action={
                                <div className="hidden items-center gap-2 text-sm text-slate-500 sm:flex">
                                    <CalendarClock className="h-4 w-4" />
                                    Updated automatically
                                </div>
                            }
                        />

                        {transactions.length ? (
                            <div className="divide-y divide-[#D1D9DA]">
                                {transactions.map((transaction) => {
                                    const isOut =
                                        transaction.direction === 'out';
                                    const amount = formatCurrency(
                                        transaction.amount,
                                        transaction.currency || 'MAD',
                                    );

                                    return (
                                        <div
                                            key={transaction.id}
                                            className="transaction-row flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`flex h-11 w-11 items-center justify-center rounded-lg ${
                                                        isOut
                                                            ? 'bg-rose-50 text-rose-600'
                                                            : 'bg-emerald-50 text-emerald-600'
                                                    }`}
                                                >
                                                    {isOut ? (
                                                        <ArrowDownLeft className="h-5 w-5" />
                                                    ) : (
                                                        <Sparkles className="h-5 w-5" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-[#061F39]">
                                                        {transaction.label ||
                                                            titleCase(
                                                                transaction.type,
                                                            )}
                                                    </p>
                                                    <p className="mt-0.5 text-sm text-slate-500">
                                                        {transaction.description ||
                                                            'CIM banking activity'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between gap-4 sm:min-w-64 sm:justify-end">
                                                <div className="text-left sm:text-right">
                                                    <p
                                                        className={`font-semibold ${
                                                            isOut
                                                                ? 'text-rose-600'
                                                                : 'text-emerald-600'
                                                        }`}
                                                    >
                                                        {isOut ? '-' : '+'}
                                                        {amount}
                                                    </p>
                                                    <p className="mt-0.5 text-xs text-slate-500">
                                                        {formatDateTime(
                                                            transaction.occurred_at,
                                                        )}
                                                    </p>
                                                </div>
                                                <StatusBadge
                                                    status={transaction.status}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <EmptyPanel
                                title="No recent transactions"
                                message="Your latest deposits, withdrawals, transfers, and ATM activity will appear here."
                            />
                        )}
                    </section>
                </div>
            </main>

            <CimChatbot />
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'My Banking',
            href: dashboard(),
        },
    ],
};
