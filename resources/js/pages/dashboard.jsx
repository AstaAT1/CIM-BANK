"use client"
import { Head, Link } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { gsap } from 'gsap';
import {
    ArrowDownLeft,
    ArrowRightLeft,
    ArrowUpRight,
    BellRing,
    BriefcaseBusiness,
    CalendarClock,
    CheckCircle2,
    ChevronRight,
    Copy,
    CreditCard,
    FileCheck2,
    Gauge,
    Landmark,
    LockKeyhole,
    MapPin,
    MessageCircle,
    PiggyBank,
    ReceiptText,
    Send,
    ShieldCheck,
    TrendingUp,
    WalletCards,
} from 'lucide-react';
import { FlippableCreditCard } from '@/components/FlippableCreditCard';
import AppLogo from '@/components/app-logo';
import CimChatbot from '@/components/customer/CimChatbot';
import { dashboard } from '@/routes';
import { atmMap, exchangeRates } from '@/routes/customer';

const CIM = {
    primary: '#082F54',
    secondary: '#0A6474',
    accent: '#D4A23C',
    dark: '#061F39',
    background: '#F7F8FA',
    white: '#FFFFFF',
    border: '#D1D9DA',
};

const cimVariables = {
    '--cim-primary': CIM.primary,
    '--cim-secondary': CIM.secondary,
    '--cim-accent': CIM.accent,
    '--cim-dark': CIM.dark,
    '--cim-background': CIM.background,
    '--cim-white': CIM.white,
    '--cim-border': CIM.border,
};

const statusTone = {
    active:
        'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/25 dark:bg-emerald-400/10 dark:text-emerald-200',
    verified:
        'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/25 dark:bg-emerald-400/10 dark:text-emerald-200',
    pending:
        'border-amber-200 bg-amber-50 text-amber-700 dark:border-[#D4A23C]/30 dark:bg-[#D4A23C]/10 dark:text-[#F8D98A]',
    processing:
        'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-400/25 dark:bg-sky-400/10 dark:text-sky-200',
    rejected:
        'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/25 dark:bg-rose-400/10 dark:text-rose-200',
    blocked:
        'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/25 dark:bg-rose-400/10 dark:text-rose-200',
    inactive:
        'border-slate-200 bg-slate-50 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300',
    submitted:
        'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-400/25 dark:bg-sky-400/10 dark:text-sky-200',
    under_review:
        'border-amber-200 bg-amber-50 text-amber-700 dark:border-[#D4A23C]/30 dark:bg-[#D4A23C]/10 dark:text-[#F8D98A]',
    need_more_documents:
        'border-amber-200 bg-amber-50 text-amber-700 dark:border-[#D4A23C]/30 dark:bg-[#D4A23C]/10 dark:text-[#F8D98A]',
    pre_approved:
        'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/25 dark:bg-emerald-400/10 dark:text-emerald-200',
    offer_sent:
        'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/25 dark:bg-emerald-400/10 dark:text-emerald-200',
    customer_accepted_offer:
        'border-[#0A6474]/30 bg-[#0A6474]/10 text-[#0A6474] dark:border-[#0A6474]/40 dark:bg-[#0A6474]/15 dark:text-cyan-100',
    cancelled:
        'border-slate-200 bg-slate-50 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300',
};

function formatCurrency(amount, currency = 'MAD') {
    return new Intl.NumberFormat('en-MA', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number(amount || 0));
}

function formatCompactCurrency(amount, currency = 'MAD') {
    return new Intl.NumberFormat('en-MA', {
        style: 'currency',
        currency,
        notation: 'compact',
        maximumFractionDigits: 1,
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
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function machrou3iNextStep(status, riskLevel) {
    const steps = {
        submitted: 'CIM review will begin',
        under_review: 'Advisor review in progress',
        need_more_documents: 'Upload requested documents',
        pre_approved: 'Review CIM pre-approval',
        offer_sent: 'Accept or decline the offer',
        customer_accepted_offer: 'Advisor will finalize next steps',
        rejected: 'Review decision note',
        cancelled: 'Application closed',
    };

    return (
        steps[String(status || '')] ||
        (riskLevel ? `${titleCase(riskLevel)} risk preview` : 'Start application')
    );
}

function StatusBadge({ status, compact = false }) {
    const normalized = String(status || 'unknown').toLowerCase();

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold shadow-sm ${
                statusTone[normalized] ??
                'border-slate-200 bg-white text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300'
            }`}
        >
            <CheckCircle2 className="h-3.5 w-3.5" />
            {compact ? titleCase(normalized).split(' ')[0] : titleCase(normalized)}
        </span>
    );
}

function SectionTitle({ eyebrow, title, description, action }) {
    return (
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
                {eyebrow ? (
                    <p className="text-xs font-bold tracking-[0.2em] text-[#0A6474] uppercase dark:text-[#7bd4df]">
                        {eyebrow}
                    </p>
                ) : null}
                <h2 className="mt-1 text-xl font-semibold tracking-tight text-[#061F39] dark:text-white">
                    {title}
                </h2>
                {description ? (
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {description}
                    </p>
                ) : null}
            </div>
            {action}
        </div>
    );
}

function EmptyPanel({ title, message }) {
    return (
        <div className="rounded-2xl border border-dashed border-[#D1D9DA] bg-white/75 px-6 py-10 text-center shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.04]">
            <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0A6474]/10 text-[#0A6474] dark:bg-[#0A6474]/20 dark:text-cyan-100">
                <ReceiptText className="h-6 w-6" />
            </span>
            <h3 className="font-semibold text-[#061F39] dark:text-white">{title}</h3>
            <p className="mx-auto mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">
                {message}
            </p>
        </div>
    );
}

function MetricCard({ icon: Icon, label, value, helper, trend }) {
    return (
        <motion.div
            className="dashboard-reveal group rounded-2xl border border-[#D1D9DA] bg-white/85 p-4 shadow-[0_18px_50px_rgba(6,31,57,0.06)] backdrop-blur transition dark:border-white/10 dark:bg-white/[0.055] dark:shadow-[0_18px_50px_rgba(0,0,0,0.18)]"
            whileHover={{ y: -4, scale: 1.01 }}
            transition={{ duration: 0.22 }}
        >
            <div className="flex items-start justify-between gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#082F54]/8 text-[#082F54] transition group-hover:bg-[#D4A23C] group-hover:text-[#061F39] dark:bg-white/10 dark:text-cyan-50 dark:group-hover:bg-[#D4A23C] dark:group-hover:text-[#061F39]">
                    <Icon className="h-5 w-5" />
                </span>
                {trend ? (
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200">
                        {trend}
                    </span>
                ) : null}
            </div>
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">{label}</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-[#061F39] dark:text-white">
                {value}
            </p>
            {helper ? (
                <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                    {helper}
                </p>
            ) : null}
        </motion.div>
    );
}

function GlassPanel({ children, className = '' }) {
    return (
        <div
            className={`rounded-3xl border border-[#D1D9DA] bg-white/85 shadow-[0_22px_70px_rgba(6,31,57,0.07)] backdrop-blur dark:border-white/10 dark:bg-white/[0.055] dark:shadow-[0_22px_70px_rgba(0,0,0,0.18)] ${className}`}
        >
            {children}
        </div>
    );
}

function BalanceActivityChart({
    data = [],
    currentBalance = 0,
    currency = 'MAD',
    hasAccount = false,
}) {
    const hasActivity = hasAccount && data.length > 0;
    const width = 640;
    const height = 230;
    const padding = 28;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const points = useMemo(() => {
        if (!hasActivity) {
            const y = padding + chartHeight / 2;

            return [
                { x: padding, y, balance: currentBalance, label: 'Current' },
                {
                    x: width - padding,
                    y,
                    balance: currentBalance,
                    label: 'Current',
                },
            ];
        }

        const balances = data.map((point) => Number(point.balance || 0));
        const min = Math.min(...balances);
        const max = Math.max(...balances);
        const spread = max - min || Math.max(Math.abs(max), 1);
        const lower = min - spread * 0.12;
        const upper = max + spread * 0.12;

        return data.map((point, index) => {
            const x =
                padding +
                (data.length === 1
                    ? chartWidth / 2
                    : (index / (data.length - 1)) * chartWidth);
            const y =
                padding +
                chartHeight -
                ((Number(point.balance || 0) - lower) / (upper - lower)) *
                    chartHeight;

            return {
                x,
                y,
                balance: Number(point.balance || 0),
                label: point.label || point.date,
                direction: point.direction,
                type: point.type,
            };
        });
    }, [chartHeight, chartWidth, currentBalance, data, hasActivity]);

    const linePath = points
        .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
        .join(' ');
    const lastSvgPoint = points[points.length - 1];
    const areaPath = `${linePath} L ${lastSvgPoint.x} ${height - padding} L ${points[0].x} ${height - padding} Z`;
    const firstPoint = data[0];
    const lastPoint = data[data.length - 1];

    return (
        <div className="relative overflow-hidden rounded-3xl border border-[#D1D9DA] bg-[#F7F8FA] p-4 dark:border-white/10 dark:bg-white/[0.035]">
            <svg
                viewBox={`0 0 ${width} ${height}`}
                role="img"
                aria-label="Running account balance chart"
                className="h-64 w-full"
                preserveAspectRatio="none"
            >
                <defs>
                    <linearGradient id="balanceArea" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#0A6474" stopOpacity="0.34" />
                        <stop offset="100%" stopColor="#0A6474" stopOpacity="0.02" />
                    </linearGradient>
                </defs>
                {[0, 1, 2, 3].map((line) => {
                    const y = padding + (line / 3) * chartHeight;

                    return (
                        <line
                            key={line}
                            x1={padding}
                            x2={width - padding}
                            y1={y}
                            y2={y}
                            stroke="currentColor"
                            className="text-[#D1D9DA] dark:text-white/10"
                            strokeDasharray="6 8"
                        />
                    );
                })}
                <path d={areaPath} fill="url(#balanceArea)" />
                <path
                    d={linePath}
                    fill="none"
                    stroke={hasActivity ? '#0A6474' : '#D4A23C'}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="4"
                    vectorEffect="non-scaling-stroke"
                />
                {hasActivity
                    ? points.map((point, index) => (
                          <circle
                              key={`${point.label}-${index}`}
                              cx={point.x}
                              cy={point.y}
                              r="4.5"
                              fill={
                                  point.direction === 'out'
                                      ? '#E11D48'
                                      : '#059669'
                              }
                              stroke="#FFFFFF"
                              strokeWidth="2"
                              vectorEffect="non-scaling-stroke"
                          />
                      ))
                    : null}
            </svg>

            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-sm font-semibold text-[#061F39] dark:text-white">
                        {hasActivity
                            ? 'Running balance from real account transactions'
                            : hasAccount
                              ? 'No activity yet'
                              : 'No bank account yet'}
                    </p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {hasActivity
                            ? `${firstPoint?.label || firstPoint?.date} to ${
                                  lastPoint?.label || lastPoint?.date
                              }`
                            : hasAccount
                              ? 'Current balance is shown as a flat baseline until your first completed transaction.'
                              : 'Your running balance chart will appear after CIM activates your account.'}
                    </p>
                </div>
                <div className="text-left sm:text-right">
                    <p className="text-xs font-bold tracking-[0.16em] text-slate-400 uppercase">
                        Current balance
                    </p>
                    <p className="mt-1 text-lg font-semibold text-[#061F39] dark:text-white">
                        {hasAccount
                            ? formatCurrency(currentBalance, currency)
                            : 'Pending'}
                    </p>
                </div>
            </div>
        </div>
    );
}


export default function Dashboard({
    customer = {},
    account: accountProp = null,
    accountSummary = null,
    card: cardProp = null,
    latestCard = null,
    transactions: transactionProp = [],
    recentTransactions = [],
    balanceChart = [],
    stats = {},
    summary = {},
}) {
    const dashboardRef = useRef(null);
    const balanceRef = useRef(null);
    const [copied, setCopied] = useState(false);
    const account = accountSummary ?? accountProp;
    const card = latestCard ?? cardProp;
    const transactions =
        recentTransactions.length > 0 ? recentTransactions : transactionProp;
    const chartPoints = Array.isArray(balanceChart) ? balanceChart : [];
    const monthlyActivity =
        stats?.monthlyActivity ?? summary?.monthly_activity ?? 0;
    const securityLevel = stats?.securityLevel ?? summary?.security_level;

    const firstName =
        customer.first_name || customer.name?.split(' ')?.[0] || 'Customer';
    const accountStatus = account?.status || 'inactive';
    const cardStatus = card?.status || 'inactive';
    const verificationStatus = customer.verification_status || 'none';
    const currency = account?.currency || 'MAD';
    const balance = Number(account?.balance || 0);

    const quickActions = useMemo(
        () => [
            {
                label: 'Transfers',
                description: 'Send MAD to active beneficiaries',
                href: '/customer/transfers',
                icon: Send,
                highlight: true,
            },
            {
                label: 'ATM Locator',
                description: 'Map nearby service points',
                href: atmMap(),
                icon: MapPin,
            },
            {
                label: 'Bills & AutoPay',
                description: summary?.upcoming_bill
                    ? `${summary.upcoming_bill.label} - ${formatCurrency(
                          summary.upcoming_bill.amount,
                          currency,
                      )}`
                    : 'Pay bills and manage AutoPay',
                href: '/customer/bills',
                icon: ReceiptText,
            },
            {
                label: 'Exchange Rates',
                description: 'Convert MAD and global currencies',
                href: exchangeRates(),
                icon: ArrowRightLeft,
            },
            {
                label: 'Machrou3i',
                description: summary?.machrou3i
                    ? `${summary.machrou3i.project_name} - ${titleCase(
                          summary.machrou3i.status,
                      )}`
                    : 'Start Machrou3i application',
                href: '/customer/machrou3i',
                icon: BriefcaseBusiness,
            },
            {
                label: 'Chatbot Assistant',
                description: 'Ask CIM Assistant for secure help',
                onClick: () => {
                    window.dispatchEvent(new CustomEvent('cim-chatbot:open'));
                },
                icon: MessageCircle,
            },
        ],
        [currency, summary?.machrou3i, summary?.upcoming_bill],
    );

    const metrics = useMemo(
        () => [
            {
                icon: Landmark,
                label: 'Active accounts',
                value:
                    stats?.activeAccounts ??
                    summary?.active_accounts ??
                    (account ? 1 : 0),
                helper: 'Connected CIM banking products.',
            },
            {
                icon: CreditCard,
                label: 'Active cards',
                value:
                    stats?.activeCards ??
                    summary?.active_cards ??
                    (card ? 1 : 0),
                helper: 'Debit card and future virtual cards.',
            },
            {
                icon: Gauge,
                label: 'Monthly activity',
                value: formatCompactCurrency(monthlyActivity, currency),
                helper: 'Completed account movements this month.',
                trend: monthlyActivity > 0 ? 'This month' : null,
            },
            {
                icon: ShieldCheck,
                label: 'Security level',
                value: titleCase(securityLevel || verificationStatus),
                helper: 'Profile and account verification status.',
            },
        ],
        [
            account,
            card,
            currency,
            monthlyActivity,
            securityLevel,
            stats,
            summary,
            verificationStatus,
        ],
    );

    useEffect(() => {
        if (!dashboardRef.current) {
            return undefined;
        }

        const context = gsap.context(() => {
            gsap.fromTo(
                '.dashboard-reveal',
                { autoAlpha: 0, y: 22, scale: 0.985 },
                {
                    autoAlpha: 1,
                    y: 0,
                    scale: 1,
                    duration: 0.78,
                    stagger: 0.075,
                    ease: 'power3.out',
                },
            );

            gsap.fromTo(
                '.transaction-row',
                { autoAlpha: 0, x: -14 },
                {
                    autoAlpha: 1,
                    x: 0,
                    duration: 0.48,
                    stagger: 0.055,
                    ease: 'power2.out',
                    delay: 0.28,
                },
            );

            gsap.to('.orb-motion', {
                x: 18,
                y: -12,
                duration: 5,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut',
                stagger: 0.8,
            });
        }, dashboardRef);

        return () => context.revert();
    }, []);

    useEffect(() => {
        if (!balanceRef.current) {
            return undefined;
        }

        if (!account) {
            balanceRef.current.textContent = 'No active account';

            return undefined;
        }

        const counter = { value: 0 };
        const tween = gsap.to(counter, {
            value: balance,
            duration: 1.15,
            ease: 'power3.out',
            onUpdate: () => {
                balanceRef.current.textContent = formatCurrency(
                    counter.value,
                    currency,
                );
            },
        });

        return () => tween.kill();
    }, [account, balance, currency]);

    const copyRib = async () => {
        if (!account?.rib) {
            return;
        }

        try {
            await navigator.clipboard.writeText(account.rib);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1800);
        } catch (error) {
            console.error('Unable to copy RIB:', error);
        }
    };

    return (
        <>
            <Head title="Home" />

            <main
                ref={dashboardRef}
                className="relative min-h-full overflow-hidden bg-[#F7F8FA] px-4 py-5 text-[#061F39] sm:px-6 lg:px-8 dark:bg-[#041526] dark:text-white"
                style={cimVariables}
            >
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="orb-motion absolute -top-28 right-[-7rem] h-72 w-72 rounded-full bg-[#0A6474]/16 blur-3xl dark:bg-[#0A6474]/24" />
                    <div className="orb-motion absolute top-44 left-[-10rem] h-80 w-80 rounded-full bg-[#D4A23C]/12 blur-3xl dark:bg-[#D4A23C]/14" />
                    <div className="absolute inset-x-0 top-0 h-64 bg-[linear-gradient(120deg,rgba(8,47,84,0.09),transparent_52%,rgba(212,162,60,0.09))] dark:bg-[linear-gradient(120deg,rgba(10,100,116,0.18),transparent_48%,rgba(212,162,60,0.12))]" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(8,47,84,0.08)_1px,transparent_0)] [background-size:28px_28px] dark:bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.055)_1px,transparent_0)]" />
                </div>

                <div className="relative mx-auto flex max-w-7xl flex-col gap-6">
                    <section className="dashboard-reveal overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 shadow-[0_30px_90px_rgba(6,31,57,0.08)] backdrop-blur dark:border-white/10 dark:bg-white/[0.055] dark:shadow-[0_30px_90px_rgba(0,0,0,0.24)]">
                        <div className="relative grid gap-6 p-5 sm:p-7 lg:grid-cols-[1fr_auto] lg:items-end">
                            <div className="absolute right-0 top-0 h-36 w-36 rounded-bl-full bg-[#0A6474]/10 dark:bg-[#0A6474]/20" />
                            <div className="relative z-10">
                                <div className="inline-flex items-center gap-2 rounded-full border border-[#D4A23C]/25 bg-[#D4A23C]/10 px-3 py-1.5 text-xs font-semibold text-[#082F54] shadow-sm dark:border-[#D4A23C]/30 dark:bg-[#D4A23C]/10 dark:text-[#F8D98A]">
                                    <AppLogo variant="mark" className="h-7 w-7" />
                                    <span>Banking Center</span>
                                </div>
                                <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[#061F39] sm:text-5xl dark:text-white">
                                    Welcome back, {firstName}
                                </h1>
                                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base dark:text-slate-300">
                                    A secure command center for your CIM account,
                                    transfers, card, Machrou3i dossier, and recent
                                    banking activity.
                                </p>
                                <div className="mt-5 flex flex-wrap gap-2">
                                    <StatusBadge status={verificationStatus} />
                                    <StatusBadge status={accountStatus} />
                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#0A6474]/20 bg-[#0A6474]/10 px-3 py-1 text-xs font-semibold text-[#0A6474] dark:border-[#0A6474]/35 dark:bg-[#0A6474]/15 dark:text-cyan-100">
                                        <LockKeyhole className="h-3.5 w-3.5" />
                                        Secure session
                                    </span>
                                </div>
                            </div>
                            <div className="relative z-10 flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
                                <Link
                                    href="/customer/transfers"
                                    className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-[#082F54] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_32px_rgba(8,47,84,0.22)] transition hover:-translate-y-0.5 hover:bg-[#061F39] dark:bg-[#D4A23C] dark:text-[#061F39] dark:hover:bg-[#e9bd5d]"
                                >
                                    <Send className="h-4 w-4" />
                                    Send transfer
                                    <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                </Link>
                                <Link
                                    href={atmMap()}
                                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#D1D9DA] bg-white px-5 py-3 text-sm font-semibold text-[#082F54] shadow-sm transition hover:-translate-y-0.5 hover:border-[#0A6474] dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:border-[#0A6474]/60"
                                >
                                    <MapPin className="h-4 w-4" />
                                    Find ATM
                                </Link>
                            </div>
                        </div>
                    </section>

                    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        {metrics.map((metric) => (
                            <MetricCard key={metric.label} {...metric} />
                        ))}
                    </section>

                    <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
                        <motion.div
                            className="dashboard-reveal relative overflow-hidden rounded-[2rem] border border-[#082F54]/10 bg-[#061F39] p-6 text-white shadow-[0_28px_90px_rgba(6,31,57,0.28)] dark:border-white/10"
                            whileHover={{ y: -4 }}
                            transition={{ duration: 0.25 }}
                        >
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(212,162,60,0.28),transparent_28%),radial-gradient(circle_at_88%_16%,rgba(10,100,116,0.5),transparent_34%),linear-gradient(135deg,rgba(8,47,84,0.3),rgba(6,31,57,1))]" />
                            <div className="absolute -right-16 -bottom-24 h-72 w-72 rounded-full border border-white/10" />
                            <div className="absolute right-8 bottom-8 h-24 w-24 rounded-full bg-[#D4A23C]/20 blur-2xl" />
                            <div className="relative z-10 grid gap-6 lg:grid-cols-[1fr_250px] lg:items-end">
                                <div>
                                    <div className="flex items-center gap-2 text-sm text-white/75">
                                        <WalletCards className="h-4 w-4 text-[#D4A23C]" />
                                        Current balance
                                    </div>
                                    <div
                                        ref={balanceRef}
                                        className="mt-4 text-4xl font-semibold tracking-tight sm:text-6xl"
                                    >
                                        {account
                                            ? formatCurrency(balance, currency)
                                            : 'No active account'}
                                    </div>
                                    <p className="mt-4 max-w-xl text-sm leading-6 text-white/70">
                                        Real-time account overview with protected
                                        identity, RIB access, and activity monitoring.
                                    </p>
                                </div>
                                <div className="rounded-3xl border border-white/15 bg-white/10 p-4 backdrop-blur-xl">
                                    <p className="text-xs font-semibold tracking-[0.16em] text-white/55 uppercase">
                                        Account package
                                    </p>
                                    <p className="mt-2 text-lg font-semibold text-white">
                                        {titleCase(
                                            account?.account_type ||
                                                'current account',
                                        )}
                                    </p>
                                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                                        <div className="h-full w-full rounded-full bg-gradient-to-r from-[#D4A23C] to-[#0A6474]" />
                                    </div>
                                    <p className="mt-3 text-xs text-white/55">
                                        Verification: {titleCase(verificationStatus)}
                                    </p>
                                </div>
                            </div>
                        </motion.div>

                        <GlassPanel className="dashboard-reveal p-5">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-xs font-bold tracking-[0.18em] text-[#0A6474] uppercase dark:text-[#7bd4df]">
                                        Account number / RIB
                                    </p>
                                    <h2 className="mt-2 break-all text-2xl font-semibold tracking-tight text-[#061F39] dark:text-white">
                                        {account?.account_number ||
                                            'Account pending'}
                                    </h2>
                                </div>
                                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#D4A23C]/15 text-[#D4A23C] dark:bg-[#D4A23C]/20">
                                    <Landmark className="h-6 w-6" />
                                </span>
                            </div>

                            <div className="mt-5 rounded-2xl border border-[#D1D9DA] bg-[#F7F8FA]/80 p-4 dark:border-white/10 dark:bg-white/[0.045]">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="min-w-0">
                                        <p className="text-xs font-semibold tracking-[0.16em] text-slate-500 uppercase dark:text-slate-400">
                                            RIB
                                        </p>
                                        <p className="mt-1 font-mono text-sm font-semibold break-all text-[#061F39] dark:text-white">
                                            {account?.rib ||
                                                'Not available yet'}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={copyRib}
                                        disabled={!account?.rib}
                                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#D1D9DA] bg-white px-3 py-2 text-sm font-semibold text-[#082F54] transition hover:-translate-y-0.5 hover:border-[#D4A23C] hover:text-[#061F39] disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:border-[#D4A23C]/60"
                                    >
                                        <Copy className="h-4 w-4" />
                                        {copied ? 'Copied' : 'Copy'}
                                    </button>
                                </div>
                            </div>

                            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                                <div className="rounded-2xl bg-[#F7F8FA] p-4 dark:bg-white/[0.045]">
                                    <p className="text-slate-500 dark:text-slate-400">
                                        Opened
                                    </p>
                                    <p className="mt-1 font-semibold text-[#061F39] dark:text-white">
                                        {formatDateTime(account?.opened_at)}
                                    </p>
                                </div>
                                <div className="rounded-2xl bg-[#F7F8FA] p-4 dark:bg-white/[0.045]">
                                    <p className="text-slate-500 dark:text-slate-400">
                                        Last activity
                                    </p>
                                    <p className="mt-1 font-semibold text-[#061F39] dark:text-white">
                                        {formatDateTime(
                                            summary?.last_activity_at,
                                        )}
                                    </p>
                                </div>
                            </div>
                        </GlassPanel>
                    </section>

                    <GlassPanel className="dashboard-reveal p-5 sm:p-6">
                        <SectionTitle
                            eyebrow="Balance movement"
                            title="Account activity chart"
                            description="Running balance calculated from completed account transactions."
                        />
                        <BalanceActivityChart
                            data={chartPoints}
                            currentBalance={balance}
                            currency={currency}
                            hasAccount={Boolean(account)}
                        />
                    </GlassPanel>

                    <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
                        <GlassPanel className="dashboard-reveal p-5 sm:p-6">
                            <SectionTitle
                                eyebrow="Cards"
                                title="Your Bank Card"
                                description="Debit card, status, and secure card details."
                            />
                            {card ? (
                                <div className="mt-5 flex flex-col items-center gap-5">
                                    <FlippableCreditCard
                                        className="max-w-full"
                                        cardholderName={(
                                            card.card_holder_name ||
                                            customer.name ||
                                            'Card holder'
                                        ).toUpperCase()}
                                        cardNumber={
                                            card.masked_card_number ||
                                            '**** **** **** ****'
                                        }
                                        expiryDate={card.expiry_date || '--/--'}
                                        cvv="***"
                                    />
                                    <div className="flex w-full items-center justify-between rounded-2xl border border-[#D1D9DA]/50 bg-[#F7F8FA] p-3.5 dark:border-[#0A6474]/15 dark:bg-[#041C30]/60">
                                        <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                                            Card Status
                                        </span>
                                        <StatusBadge status={cardStatus} />
                                    </div>
                                </div>
                            ) : (
                                <div className="mt-5 flex h-52 cursor-default flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#D1D9DA] bg-[#F7F8FA]/50 p-6 text-center transition-colors dark:border-[#0A6474]/25 dark:bg-[#041C30]/30">
                                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#D1D9DA] bg-white shadow-sm dark:border-[#0A6474]/20 dark:bg-[#07213A]">
                                        <LockKeyhole className="h-6 w-6 text-slate-300 dark:text-slate-600" />
                                    </div>
                                    <p className="text-sm font-bold text-[#082F54] dark:text-white">
                                        Card Not Issued
                                    </p>
                                    <p className="mt-1.5 max-w-[180px] text-xs leading-relaxed text-slate-400 dark:text-slate-500">
                                        Available after full account activation
                                    </p>
                                </div>
                            )}
                        </GlassPanel>

                        <GlassPanel className="dashboard-reveal p-6">
                            <SectionTitle
                                eyebrow="Status"
                                title="Account health"
                                description="Security, verification, account, and card readiness."
                            />
                            <div className="grid gap-3 sm:grid-cols-3">
                                <div className="rounded-2xl border border-[#D1D9DA] p-4 dark:border-white/10 dark:bg-white/[0.03]">
                                    <ShieldCheck className="mb-3 h-6 w-6 text-[#0A6474] dark:text-cyan-100" />
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        Verification
                                    </p>
                                    <div className="mt-3">
                                        <StatusBadge
                                            status={verificationStatus}
                                            compact
                                        />
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-[#D1D9DA] p-4 dark:border-white/10 dark:bg-white/[0.03]">
                                    <Landmark className="mb-3 h-6 w-6 text-[#0A6474] dark:text-cyan-100" />
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        Bank account
                                    </p>
                                    <div className="mt-3">
                                        <StatusBadge status={accountStatus} compact />
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-[#D1D9DA] p-4 dark:border-white/10 dark:bg-white/[0.03]">
                                    <CreditCard className="mb-3 h-6 w-6 text-[#0A6474] dark:text-cyan-100" />
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        Card
                                    </p>
                                    <div className="mt-3">
                                        <StatusBadge status={cardStatus} compact />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-5 rounded-2xl border border-[#0A6474]/20 bg-[#0A6474]/8 p-4 dark:border-[#0A6474]/30 dark:bg-[#0A6474]/10">
                                <div className="flex items-center gap-3">
                                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[#0A6474] dark:bg-white/10 dark:text-cyan-100">
                                        <BellRing className="h-5 w-5" />
                                    </span>
                                    <div>
                                        <p className="font-semibold text-[#061F39] dark:text-white">
                                            Banking alerts are active
                                        </p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            CIM will keep you notified about key account movements.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </GlassPanel>
                    </section>

                    <section className="dashboard-reveal">
                        <SectionTitle
                            eyebrow="Shortcuts"
                            title="Quick actions"
                            description="Fast access to the most used CIM banking operations."
                        />
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
                            {quickActions.map((action) => {
                                const Icon = action.icon;
                                const actionClass = `group relative flex h-full min-h-36 w-full flex-col justify-between overflow-hidden rounded-3xl border p-4 text-left shadow-[0_18px_45px_rgba(6,31,57,0.06)] transition hover:border-[#D4A23C] hover:shadow-[0_20px_60px_rgba(8,47,84,0.12)] dark:hover:border-[#D4A23C]/60 ${
                                    action.highlight
                                        ? 'border-[#082F54] bg-[#082F54] text-white dark:border-[#D4A23C]/30 dark:bg-[#D4A23C] dark:text-[#061F39]'
                                        : 'border-[#D1D9DA] bg-white/85 text-[#061F39] backdrop-blur dark:border-white/10 dark:bg-white/[0.055] dark:text-white'
                                }`;
                                const content = (
                                    <>
                                        <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-[#D4A23C]/10 transition group-hover:scale-125" />
                                        <span
                                            className={`relative flex h-11 w-11 items-center justify-center rounded-2xl transition ${
                                                action.highlight
                                                    ? 'bg-white/12 text-[#D4A23C] dark:bg-[#061F39]/10 dark:text-[#061F39]'
                                                    : 'bg-[#D4A23C]/15 text-[#D4A23C] group-hover:bg-[#D4A23C] group-hover:text-[#061F39]'
                                            }`}
                                        >
                                            <Icon className="h-5 w-5" />
                                        </span>
                                        <span className="relative">
                                            <span className="flex items-center justify-between gap-2 font-semibold">
                                                {action.label}
                                                <ChevronRight className="h-4 w-4 opacity-60 transition group-hover:translate-x-1" />
                                            </span>
                                            <span className="mt-1 block text-sm opacity-70">
                                                {action.description}
                                            </span>
                                        </span>
                                    </>
                                );

                                return (
                                    <motion.div
                                        key={action.label}
                                        whileHover={{ y: -5 }}
                                        whileTap={{ scale: 0.98 }}
                                        transition={{ duration: 0.18 }}
                                    >
                                        {action.onClick ? (
                                            <button
                                                type="button"
                                                onClick={action.onClick}
                                                className={actionClass}
                                            >
                                                {content}
                                            </button>
                                        ) : (
                                            <Link
                                                href={action.href}
                                                className={actionClass}
                                            >
                                                {content}
                                            </Link>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </div>
                    </section>

                    <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                        <GlassPanel className="dashboard-reveal p-6">
                            <SectionTitle
                                eyebrow="Project financing"
                                title="Machrou3i"
                                description="Turn your salaried profile into a project financing dossier."
                                action={
                                    <Link
                                        href="/customer/machrou3i"
                                        className="inline-flex items-center gap-2 rounded-2xl bg-[#082F54] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 dark:bg-[#D4A23C] dark:text-[#061F39]"
                                    >
                                        {summary?.machrou3i
                                            ? 'Open dossier'
                                            : 'Start application'}
                                        <ArrowUpRight className="h-4 w-4" />
                                    </Link>
                                }
                            />
                            {summary?.machrou3i ? (
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="rounded-2xl border border-[#D1D9DA] bg-[#F7F8FA] p-4 dark:border-white/10 dark:bg-white/[0.045]">
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            Project
                                        </p>
                                        <p className="mt-2 font-semibold text-[#061F39] dark:text-white">
                                            {summary.machrou3i.project_name}
                                        </p>
                                    </div>
                                    <div className="rounded-2xl border border-[#D1D9DA] bg-[#F7F8FA] p-4 dark:border-white/10 dark:bg-white/[0.045]">
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            Latest status
                                        </p>
                                        <div className="mt-2">
                                            <StatusBadge
                                                status={summary.machrou3i.status}
                                            />
                                        </div>
                                    </div>
                                    <div className="rounded-2xl border border-[#D1D9DA] bg-[#F7F8FA] p-4 dark:border-white/10 dark:bg-white/[0.045]">
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            Requested amount
                                        </p>
                                        <p className="mt-2 font-semibold text-[#061F39] dark:text-white">
                                            {formatCurrency(
                                                summary.machrou3i
                                                    .requested_amount,
                                                currency,
                                            )}
                                        </p>
                                    </div>
                                    <div className="rounded-2xl border border-[#D1D9DA] bg-[#F7F8FA] p-4 dark:border-white/10 dark:bg-white/[0.045]">
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            Next step
                                        </p>
                                        <p className="mt-2 font-semibold text-[#061F39] dark:text-white">
                                            {machrou3iNextStep(
                                                summary.machrou3i.status,
                                                summary.machrou3i.risk_level,
                                            )}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <EmptyPanel
                                    title="Start Machrou3i application"
                                    message="CIM can help salaried customers prepare a project financing request with a clear review path."
                                />
                            )}
                        </GlassPanel>

                        <GlassPanel className="dashboard-reveal p-6">
                            <SectionTitle
                                eyebrow="Activity"
                                title="Latest transactions"
                                description="Deposits, withdrawals, transfers, and ATM activity."
                                action={
                                    <div className="hidden items-center gap-2 rounded-full border border-[#D1D9DA] bg-white px-3 py-1.5 text-sm text-slate-500 sm:flex dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                                        <CalendarClock className="h-4 w-4" />
                                        Updated automatically
                                    </div>
                                }
                            />

                            {transactions.length ? (
                                <div className="divide-y divide-[#D1D9DA] dark:divide-white/10">
                                    {transactions.map((transaction) => {
                                        const isOut =
                                            transaction.direction === 'out';
                                        const amount = formatCurrency(
                                            transaction.amount,
                                            transaction.currency || 'MAD',
                                        );

                                        return (
                                            <motion.div
                                                key={transaction.id}
                                                className="transaction-row flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                                                whileHover={{ x: 4 }}
                                                transition={{ duration: 0.18 }}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                                                            isOut
                                                                ? 'bg-rose-50 text-rose-600 dark:bg-rose-400/10 dark:text-rose-200'
                                                                : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-200'
                                                        }`}
                                                    >
                                                        {isOut ? (
                                                            <ArrowDownLeft className="h-5 w-5" />
                                                        ) : (
                                                            <TrendingUp className="h-5 w-5" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-[#061F39] dark:text-white">
                                                            {transaction.label ||
                                                                titleCase(
                                                                    transaction.type,
                                                                )}
                                                        </p>
                                                        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
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
                                                                    ? 'text-rose-600 dark:text-rose-200'
                                                                    : 'text-emerald-600 dark:text-emerald-200'
                                                            }`}
                                                        >
                                                            {isOut ? '-' : '+'}
                                                            {amount}
                                                        </p>
                                                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                                            {formatDateTime(
                                                                transaction.occurred_at,
                                                            )}
                                                            {transaction.reference
                                                                ? ` - ${transaction.reference}`
                                                                : ''}
                                                        </p>
                                                    </div>
                                                    <StatusBadge
                                                        status={transaction.status}
                                                    />
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <EmptyPanel
                                    title="No recent transactions"
                                    message="Your latest deposits, withdrawals, transfers, and ATM activity will appear here."
                                />
                            )}
                        </GlassPanel>
                    </section>

                    <section className="dashboard-reveal grid gap-4 rounded-[2rem] border border-[#D1D9DA] bg-[#061F39] p-5 text-white shadow-[0_24px_70px_rgba(6,31,57,0.18)] sm:grid-cols-3 dark:border-white/10">
                        <div className="flex gap-3">
                            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-[#D4A23C]">
                                <FileCheck2 className="h-5 w-5" />
                            </span>
                            <div>
                                <p className="font-semibold">Documents</p>
                                <p className="mt-1 text-sm text-white/60">
                                    Keep your KYC files ready for CIM review.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-[#D4A23C]">
                                <PiggyBank className="h-5 w-5" />
                            </span>
                            <div>
                                <p className="font-semibold">Savings habits</p>
                                <p className="mt-1 text-sm text-white/60">
                                    Track future Snidiqa and saving programs.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-[#D4A23C]">
                                <ShieldCheck className="h-5 w-5" />
                            </span>
                            <div>
                                <p className="font-semibold">Protected banking</p>
                                <p className="mt-1 text-sm text-white/60">
                                    CIM keeps your profile and account activity monitored.
                                </p>
                            </div>
                        </div>
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
            title: 'Home',
            href: dashboard(),
        },
    ],
};
