import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    BadgeCheck,
    Banknote,
    CalendarClock,
    CheckCircle2,
    ChevronRight,
    CircleDollarSign,
    CreditCard,
    Eye,
    Filter,
    Landmark,
    Mail,
    MapPin,
    Phone,
    RefreshCw,
    Search,
    ShieldCheck,
    Sparkles,
    TrendingUp,
    UserRoundCheck,
    Users,
    WalletCards,
    X,
    XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ComponentType, ReactNode } from 'react';
import { motion } from 'motion/react';
import { gsap } from 'gsap';

const pendingRequestStatuses = [
    'submitted',
    'appointment_scheduled',
    'under_review',
];

const statusLabels: Record<string, string> = {
    all_customers: 'All customers',
    pending_verification: 'Pending verification',
    verified_customers: 'Verified customers',
    rejected_customers: 'Rejected customers',
    appointment_booked: 'Appointment booked',
    appointment_finished: 'Appointment missed/completed',
};

type CustomerProfile = {
    cin: string;
    employment_status: string;
    status: string;
    verified_at: string | null;
    phone?: string | null;
    address?: string | null;
    city?: string | null;
    birth_date?: string | null;
    monthly_income?: string | number | null;
};

type Branch = { name: string; city: string } | null;

type AppointmentData = {
    id: number;
    scheduled_at: string;
    status: string;
    notes: string | null;
    branch: Branch;
} | null;

type AccountOpeningRequest = {
    id: number;
    request_number: string;
    account_type: string;
    status: string;
    submitted_at: string | null;
    reviewed_at: string | null;
    branch: Branch;
} | null;

type BankAccountSummary = {
    id: number;
    account_type: string;
    status: string;
    currency: string;
    balance: string | number;
    opened_at: string | null;
    account_number_last4: string;
} | null;

type CardSummary = {
    id: number;
    masked_card_number: string;
    card_number_last4: string;
    expiry_month: number;
    expiry_year: number;
    status: string;
} | null;

type TransactionSummary = {
    id: number;
    reference: string;
    type: string;
    direction: string;
    amount: string | number;
    status: string;
    performed_at: string | null;
};

type AtmWithdrawalSummary = {
    id: number;
    amount: string | number;
    status: string;
    created_at: string | null;
    atm?: { name: string; city: string } | null;
};

type CustomerData = {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    created_at: string;
    profile: CustomerProfile | null;
    latest_appointment: AppointmentData;
    latest_account_opening_request: AccountOpeningRequest;
    bank_account_summary: BankAccountSummary;
    card_summary: CardSummary;
    bank_accounts: NonNullable<BankAccountSummary>[];
    bank_cards: NonNullable<CardSummary>[];
    latest_transactions: TransactionSummary[];
    latest_atm_withdrawals: AtmWithdrawalSummary[];
};

type PaginatedData = {
    data: CustomerData[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
};

type PageProps = {
    attendees: PaginatedData;
    filters: { status?: string; date?: string; search?: string };
    statuses: string[];
    flash?: { success?: string };
};

function titleCase(value?: string | null) {
    return String(value || 'none')
        .replaceAll('_', ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value?: string | null) {
    if (!value) {
        return '—';
    }

    return new Intl.DateTimeFormat('en-MA', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(new Date(value));
}

function formatDateTime(value?: string | null) {
    if (!value) {
        return '—';
    }

    return new Intl.DateTimeFormat('en-MA', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value));
}

function formatMoney(value?: string | number | null, currency = 'MAD') {
    return new Intl.NumberFormat('en-MA', {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
    }).format(Number(value || 0));
}

function getStatusTone(value?: string | null) {
    const tones: Record<string, string> = {
        none: 'border-slate-300 bg-slate-100 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300',
        pending:
            'border-amber-400/30 bg-amber-500/10 text-amber-700 dark:border-amber-300/25 dark:bg-amber-300/10 dark:text-amber-200',
        submitted:
            'border-sky-400/25 bg-sky-500/10 text-sky-700 dark:border-sky-300/20 dark:bg-sky-300/10 dark:text-sky-200',
        appointment_scheduled:
            'border-indigo-400/25 bg-indigo-500/10 text-indigo-700 dark:border-indigo-300/20 dark:bg-indigo-300/10 dark:text-indigo-200',
        under_review:
            'border-amber-400/30 bg-amber-500/10 text-amber-700 dark:border-amber-300/25 dark:bg-amber-300/10 dark:text-amber-200',
        approved:
            'border-emerald-400/25 bg-emerald-500/10 text-emerald-700 dark:border-emerald-300/20 dark:bg-emerald-300/10 dark:text-emerald-200',
        account_created:
            'border-emerald-400/25 bg-emerald-500/10 text-emerald-700 dark:border-emerald-300/20 dark:bg-emerald-300/10 dark:text-emerald-200',
        verified:
            'border-emerald-400/25 bg-emerald-500/10 text-emerald-700 dark:border-emerald-300/20 dark:bg-emerald-300/10 dark:text-emerald-200',
        scheduled:
            'border-sky-400/25 bg-sky-500/10 text-sky-700 dark:border-sky-300/20 dark:bg-sky-300/10 dark:text-sky-200',
        completed:
            'border-emerald-400/25 bg-emerald-500/10 text-emerald-700 dark:border-emerald-300/20 dark:bg-emerald-300/10 dark:text-emerald-200',
        active:
            'border-emerald-400/25 bg-emerald-500/10 text-emerald-700 dark:border-emerald-300/20 dark:bg-emerald-300/10 dark:text-emerald-200',
        cancelled:
            'border-slate-300 bg-slate-100 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300',
        missed:
            'border-rose-400/25 bg-rose-500/10 text-rose-700 dark:border-rose-300/20 dark:bg-rose-300/10 dark:text-rose-200',
        rejected:
            'border-rose-400/25 bg-rose-500/10 text-rose-700 dark:border-rose-300/20 dark:bg-rose-300/10 dark:text-rose-200',
        failed:
            'border-rose-400/25 bg-rose-500/10 text-rose-700 dark:border-rose-300/20 dark:bg-rose-300/10 dark:text-rose-200',
        blocked:
            'border-rose-400/25 bg-rose-500/10 text-rose-700 dark:border-rose-300/20 dark:bg-rose-300/10 dark:text-rose-200',
        rescheduled:
            'border-indigo-400/25 bg-indigo-500/10 text-indigo-700 dark:border-indigo-300/20 dark:bg-indigo-300/10 dark:text-indigo-200',
    };

    return tones[String(value || 'none')] || tones.none;
}

function getStatusIcon(value?: string | null) {
    const status = String(value || 'none');

    if (
        ['approved', 'account_created', 'verified', 'completed', 'active'].includes(
            status,
        )
    ) {
        return CheckCircle2;
    }

    if (['rejected', 'missed', 'blocked', 'failed'].includes(status)) {
        return XCircle;
    }

    if (
        ['pending', 'submitted', 'appointment_scheduled', 'under_review'].includes(
            status,
        )
    ) {
        return CalendarClock;
    }

    return BadgeCheck;
}

export default function AppointmentAttendees() {
    const { attendees, filters, statuses, flash } = usePage<{
        props: PageProps;
    }>().props as unknown as PageProps;

    const pageRef = useRef<HTMLElement | null>(null);
    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [dateFilter, setDateFilter] = useState(filters.date || '');
    const [selectedCustomer, setSelectedCustomer] =
        useState<CustomerData | null>(null);

    const activeStatus = statusFilter || 'all_customers';

    const pageStats = useMemo(() => {
        const rows = attendees.data || [];

        return {
            pending: rows.filter(
                (customer) => (customer.profile?.status || 'pending') === 'pending',
            ).length,
            verified: rows.filter((customer) => customer.profile?.status === 'verified')
                .length,
            accounts: rows.filter((customer) => customer.bank_account_summary).length,
            cards: rows.filter((customer) => customer.card_summary).length,
            appointments: rows.filter((customer) => customer.latest_appointment).length,
        };
    }, [attendees.data]);

    const activeFilterCount = [search, statusFilter, dateFilter].filter(Boolean).length;

    const applyFilters = (nextStatus = statusFilter) => {
        router.get(
            '/admin/appointment-attendees',
            {
                ...(search && { search }),
                ...(nextStatus &&
                    nextStatus !== 'all_customers' && { status: nextStatus }),
                ...(dateFilter && { date: dateFilter }),
            },
            { preserveState: true },
        );
    };

    const selectStatus = (status: string) => {
        const normalized = status === 'all_customers' ? '' : status;
        setStatusFilter(normalized);
        applyFilters(normalized);
    };

    const clearFilters = () => {
        setSearch('');
        setStatusFilter('');
        setDateFilter('');
        router.get('/admin/appointment-attendees', {}, { preserveState: true });
    };

    useEffect(() => {
        if (!pageRef.current) {
            return undefined;
        }

        const context = gsap.context(() => {
            gsap.fromTo(
                '.customers-reveal',
                { autoAlpha: 0, y: 22 },
                {
                    autoAlpha: 1,
                    y: 0,
                    duration: 0.72,
                    stagger: 0.07,
                    ease: 'power3.out',
                },
            );

            gsap.fromTo(
                '.customers-row',
                { autoAlpha: 0, x: -12 },
                {
                    autoAlpha: 1,
                    x: 0,
                    duration: 0.44,
                    stagger: 0.035,
                    delay: 0.22,
                    ease: 'power2.out',
                },
            );

            gsap.to('.customers-orb', {
                x: 18,
                y: -14,
                scale: 1.08,
                duration: 5.2,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut',
            });
        }, pageRef);

        return () => context.revert();
    }, []);

    return (
        <>
            <Head title="Customers Dashboard - CIM Admin" />

            <main
                ref={pageRef}
                className="relative min-h-screen overflow-hidden bg-[#F7F8FA] px-4 py-6 text-[#061F39] sm:px-6 lg:px-8 dark:bg-[#061F39]"
            >
                <div className="customers-orb pointer-events-none absolute -top-28 right-10 h-72 w-72 rounded-full bg-[#0A6474]/15 blur-3xl dark:bg-[#0A6474]/25" />
                <div className="customers-orb pointer-events-none absolute top-[42rem] -left-24 h-72 w-72 rounded-full bg-[#D4A23C]/10 blur-3xl dark:bg-[#D4A23C]/15" />

                <div className="relative mx-auto flex max-w-7xl flex-col gap-6">
                    <section className="customers-reveal relative overflow-hidden rounded-[2rem] border border-[#D1D9DA]/75 bg-white p-6 shadow-[0_24px_70px_rgba(6,31,57,0.08)] dark:border-white/10 dark:bg-white/[0.055] dark:shadow-[0_24px_80px_rgba(0,0,0,0.22)] lg:p-8">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_14%,rgba(212,162,60,0.18),transparent_30%),radial-gradient(circle_at_85%_18%,rgba(10,100,116,0.16),transparent_34%)] dark:bg-[radial-gradient(circle_at_16%_14%,rgba(212,162,60,0.16),transparent_30%),radial-gradient(circle_at_85%_18%,rgba(10,100,116,0.22),transparent_34%)]" />

                        <div className="relative grid gap-8 lg:grid-cols-[1fr_390px] lg:items-center">
                            <div>
                                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#D4A23C]/30 bg-[#D4A23C]/10 px-3 py-1 text-xs font-semibold tracking-[0.16em] text-[#082F54] uppercase dark:text-[#F5D58C]">
                                    <Landmark className="h-3.5 w-3.5" />
                                    CIM Admin Panel
                                </div>

                                <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-[#061F39] dark:text-white sm:text-4xl lg:text-5xl">
                                    Customers command center.
                                </h1>

                                <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-300">
                                    Monitor customers, appointments, verification
                                    status, bank accounts, cards, transactions,
                                    and ATM activity from one premium operational
                                    dashboard.
                                </p>

                                <div className="mt-6 flex flex-wrap gap-3">
                                    <span className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#0A6474]/20 bg-[#0A6474]/10 px-4 text-sm font-semibold text-[#0A6474] dark:border-cyan-200/10 dark:bg-cyan-200/10 dark:text-cyan-100">
                                        <Users className="h-4 w-4" />
                                        {attendees.total} total customers
                                    </span>
                                    <span className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#D4A23C]/30 bg-[#D4A23C]/10 px-4 text-sm font-semibold text-[#8A6418] dark:text-[#F5D58C]">
                                        <Sparkles className="h-4 w-4" />
                                        {activeFilterCount
                                            ? `${activeFilterCount} active filter${activeFilterCount === 1 ? '' : 's'}`
                                            : 'All customer queues'}
                                    </span>
                                </div>
                            </div>

                            <div className="relative rounded-[1.6rem] border border-white/10 bg-[#061F39] p-5 text-white shadow-[0_24px_80px_rgba(6,31,57,0.28)]">
                                <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-[#0A6474]/40 blur-2xl" />
                                <div className="absolute -bottom-10 left-6 h-28 w-28 rounded-full bg-[#D4A23C]/25 blur-2xl" />

                                <div className="relative">
                                    <div className="flex items-center justify-between gap-4">
                                        <div>
                                            <p className="text-xs tracking-[0.18em] text-white/50 uppercase">
                                                Current page overview
                                            </p>
                                            <p className="mt-2 text-3xl font-semibold">
                                                {attendees.data.length}
                                            </p>
                                            <p className="mt-1 text-sm text-white/55">
                                                customers visible now
                                            </p>
                                        </div>
                                        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-[#D4A23C]">
                                            <UserRoundCheck className="h-5 w-5" />
                                        </span>
                                    </div>

                                    <div className="mt-6 grid grid-cols-2 gap-3">
                                        <HeroMetric
                                            label="Verified"
                                            value={pageStats.verified}
                                        />
                                        <HeroMetric
                                            label="Pending"
                                            value={pageStats.pending}
                                        />
                                        <HeroMetric
                                            label="Accounts"
                                            value={pageStats.accounts}
                                        />
                                        <HeroMetric
                                            label="Cards"
                                            value={pageStats.cards}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                        <StatCard
                            icon={Users}
                            label="Customers"
                            value={attendees.total}
                            helper="all matching customers"
                            variant="dark"
                        />
                        <StatCard
                            icon={CalendarClock}
                            label="Appointments"
                            value={pageStats.appointments}
                            helper="booked on current page"
                        />
                        <StatCard
                            icon={BadgeCheck}
                            label="Verified"
                            value={pageStats.verified}
                            helper="verified on current page"
                        />
                        <StatCard
                            icon={WalletCards}
                            label="With accounts"
                            value={pageStats.accounts}
                            helper="active summaries on page"
                        />
                        <StatCard
                            icon={CreditCard}
                            label="With cards"
                            value={pageStats.cards}
                            helper="cards available on page"
                        />
                    </section>

                    <section className="customers-reveal rounded-[1.6rem] border border-[#D1D9DA]/75 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.055] lg:p-6">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <div className="flex items-center gap-2 text-sm font-semibold text-[#061F39] dark:text-white">
                                    <Filter className="h-4 w-4 text-[#0A6474] dark:text-cyan-200" />
                                    Filters
                                </div>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    Search customer identity, appointment date,
                                    or operational verification state.
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#D1D9DA] bg-white px-4 text-sm font-semibold text-[#082F54] transition hover:border-[#D4A23C] dark:border-white/10 dark:bg-white/10 dark:text-white"
                                >
                                    <RefreshCw className="h-4 w-4" />
                                    Reset
                                </button>
                                <motion.button
                                    type="button"
                                    onClick={() => applyFilters()}
                                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#082F54] px-5 text-sm font-semibold text-white shadow-lg shadow-[#082F54]/15 transition hover:bg-[#061F39] dark:bg-[#0A6474] dark:hover:bg-[#0b788d]"
                                    whileHover={{ y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    Apply filters
                                    <ArrowRight className="h-4 w-4" />
                                </motion.button>
                            </div>
                        </div>

                        <div className="mt-5 grid gap-3 lg:grid-cols-[1.4fr_0.8fr]">
                            <label className="relative">
                                <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    onKeyDown={(event) =>
                                        event.key === 'Enter' && applyFilters()
                                    }
                                    placeholder="Name, email, phone, CIN"
                                    className="h-12 w-full rounded-xl border border-[#D1D9DA] bg-white pr-3 pl-10 text-sm font-semibold text-[#061F39] shadow-sm transition outline-none placeholder:text-slate-400 focus:border-[#D4A23C] focus:ring-4 focus:ring-[#D4A23C]/15 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:placeholder:text-slate-500"
                                />
                            </label>

                            <input
                                type="date"
                                value={dateFilter}
                                onChange={(event) =>
                                    setDateFilter(event.target.value)
                                }
                                className="h-12 rounded-xl border border-[#D1D9DA] bg-white px-3 text-sm font-semibold text-[#061F39] shadow-sm transition outline-none focus:border-[#D4A23C] focus:ring-4 focus:ring-[#D4A23C]/15 dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
                            />
                        </div>

                        <div className="mt-5 flex flex-wrap gap-2">
                            {statuses.map((status) => {
                                const active = activeStatus === status;

                                return (
                                    <motion.button
                                        key={status}
                                        type="button"
                                        onClick={() => selectStatus(status)}
                                        className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                                            active
                                                ? 'border-[#082F54] bg-[#082F54] text-white shadow-lg shadow-[#082F54]/10 dark:border-[#0A6474] dark:bg-[#0A6474]'
                                                : 'border-[#D1D9DA] bg-white text-[#0A6474] hover:border-[#D4A23C] dark:border-white/10 dark:bg-white/10 dark:text-cyan-100'
                                        }`}
                                        whileHover={{ y: -2 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        {statusLabels[status] || titleCase(status)}
                                    </motion.button>
                                );
                            })}
                        </div>
                    </section>

                    <section className="customers-reveal overflow-hidden rounded-[1.6rem] border border-[#D1D9DA]/75 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.055]">
                        <div className="flex flex-col gap-2 border-b border-[#D1D9DA] px-5 py-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="font-semibold text-[#061F39] dark:text-white">
                                    Customers overview
                                </h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Page {attendees.current_page} of{' '}
                                    {attendees.last_page} · {attendees.total} total
                                    customers
                                </p>
                            </div>

                            <div className="inline-flex items-center gap-2 rounded-full border border-[#0A6474]/20 bg-[#0A6474]/10 px-3 py-1 text-xs font-semibold text-[#0A6474] dark:border-cyan-200/10 dark:bg-cyan-200/10 dark:text-cyan-100">
                                <ShieldCheck className="h-3.5 w-3.5" />
                                Customer intelligence mode
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1240px] text-left text-sm">
                                <thead className="bg-[#F7F8FA] text-xs font-semibold tracking-[0.1em] text-slate-500 uppercase dark:bg-white/[0.035] dark:text-slate-400">
                                    <tr>
                                        <th className="px-5 py-4">Customer</th>
                                        <th className="px-5 py-4">Contact</th>
                                        <th className="px-5 py-4">Identity</th>
                                        <th className="px-5 py-4">Appointment</th>
                                        <th className="px-5 py-4">Verification</th>
                                        <th className="px-5 py-4">Request</th>
                                        <th className="px-5 py-4">Account</th>
                                        <th className="px-5 py-4">Card</th>
                                        <th className="px-5 py-4">Created</th>
                                        <th className="px-5 py-4"></th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-[#D1D9DA] dark:divide-white/10">
                                    {attendees.data.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={10}
                                                className="px-5 py-14 text-center text-slate-500 dark:text-slate-400"
                                            >
                                                No customers match the current filters.
                                            </td>
                                        </tr>
                                    ) : (
                                        attendees.data.map((customer) => {
                                            const profile = customer.profile;
                                            const request =
                                                customer.latest_account_opening_request;
                                            const appointment =
                                                customer.latest_appointment;
                                            const account =
                                                customer.bank_account_summary;
                                            const card = customer.card_summary;

                                            return (
                                                <motion.tr
                                                    key={customer.id}
                                                    onClick={() =>
                                                        setSelectedCustomer(customer)
                                                    }
                                                    className="customers-row cursor-pointer align-top transition hover:bg-[#F7F8FA] dark:hover:bg-white/[0.035]"
                                                    whileHover={{ x: 3 }}
                                                    transition={{ duration: 0.18 }}
                                                >
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-start gap-3">
                                                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#082F54]/10 text-[#082F54] dark:bg-cyan-200/10 dark:text-cyan-100">
                                                                <UserRoundCheck className="h-5 w-5" />
                                                            </span>
                                                            <div>
                                                                <p className="font-semibold text-[#061F39] dark:text-white">
                                                                    {customer.name}
                                                                </p>
                                                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                                    ID #{customer.id}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        <p className="font-medium text-[#061F39] dark:text-white">
                                                            {customer.email}
                                                        </p>
                                                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                            {customer.phone || 'No phone'}
                                                        </p>
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        <p className="font-semibold text-[#061F39] dark:text-white">
                                                            {profile?.cin || '—'}
                                                        </p>
                                                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                            {profile?.employment_status ||
                                                                'No profession'}
                                                        </p>
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        {appointment ? (
                                                            <DateStack
                                                                value={
                                                                    appointment.scheduled_at
                                                                }
                                                                sub={titleCase(
                                                                    appointment.status,
                                                                )}
                                                            />
                                                        ) : (
                                                            <span className="text-slate-400">
                                                                —
                                                            </span>
                                                        )}
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        <StatusPill
                                                            value={
                                                                profile?.status ||
                                                                'pending'
                                                            }
                                                        />
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        <StatusPill
                                                            value={
                                                                request?.status ||
                                                                'none'
                                                            }
                                                        />
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        <StatusPill
                                                            value={
                                                                account?.status ||
                                                                'none'
                                                            }
                                                        />
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        <StatusPill
                                                            value={
                                                                card?.status ||
                                                                'none'
                                                            }
                                                        />
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        <DateStack
                                                            value={
                                                                customer.created_at
                                                            }
                                                        />
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        <button
                                                            type="button"
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                setSelectedCustomer(
                                                                    customer,
                                                                );
                                                            }}
                                                            className="inline-flex items-center gap-1 rounded-xl bg-[#082F54] px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#061F39] dark:bg-[#0A6474] dark:hover:bg-[#0b788d]"
                                                        >
                                                            View
                                                            <Eye className="h-3.5 w-3.5" />
                                                        </button>
                                                    </td>
                                                </motion.tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {attendees.last_page > 1 && (
                            <div className="flex flex-wrap justify-center gap-2 border-t border-[#D1D9DA] px-5 py-4 dark:border-white/10">
                                {attendees.links.map((link, index) => (
                                    <button
                                        key={`${link.label}-${index}`}
                                        type="button"
                                        disabled={!link.url}
                                        onClick={() =>
                                            link.url &&
                                            router.get(
                                                link.url,
                                                {},
                                                { preserveState: true },
                                            )
                                        }
                                        className={`min-w-10 rounded-xl border px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                                            link.active
                                                ? 'border-[#082F54] bg-[#082F54] text-white dark:border-[#0A6474] dark:bg-[#0A6474]'
                                                : 'border-[#D1D9DA] bg-white text-[#082F54] hover:border-[#D4A23C] dark:border-white/10 dark:bg-white/10 dark:text-white'
                                        }`}
                                        dangerouslySetInnerHTML={{
                                            __html: link.label,
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </main>

            {selectedCustomer && (
                <CustomerDetailsModal
                    customer={selectedCustomer}
                    onClose={() => setSelectedCustomer(null)}
                />
            )}
        </>
    );
}

function CustomerDetailsModal({
    customer,
    onClose,
}: {
    customer: CustomerData;
    onClose: () => void;
}) {
    const profile = customer.profile;
    const request = customer.latest_account_opening_request;
    const appointment = customer.latest_appointment;
    const isPendingRequest =
        request && pendingRequestStatuses.includes(request.status);

    return (
        <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#061F39]/70 p-4 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <motion.section
                className="max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-[1.8rem] border border-[#D1D9DA] bg-white shadow-[0_24px_90px_rgba(6,31,57,0.28)] dark:border-white/10 dark:bg-[#061F39]"
                onClick={(event) => event.stopPropagation()}
                initial={{ scale: 0.96, y: 20 }}
                animate={{ scale: 1, y: 0 }}
            >
                <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#D1D9DA] bg-white/90 px-5 py-4 backdrop-blur-xl dark:border-white/10 dark:bg-[#061F39]/90">
                    <div>
                        <p className="text-xs font-semibold tracking-[0.18em] text-[#0A6474] uppercase dark:text-cyan-200">
                            Customer Overview
                        </p>
                        <h2 className="mt-1 text-2xl font-semibold text-[#061F39] dark:text-white">
                            {customer.name}
                        </h2>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            {customer.email}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-[#D1D9DA] bg-[#F7F8FA] text-[#082F54] transition hover:border-[#D4A23C] dark:border-white/10 dark:bg-white/10 dark:text-white"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="max-h-[calc(90vh-82px)] overflow-y-auto p-5">
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        <DetailSection title="Personal info" icon={UserRoundCheck}>
                            <DetailRow label="Full name" value={customer.name} />
                            <DetailRow label="CIN" value={profile?.cin} />
                            <DetailRow
                                label="Profession/job"
                                value={profile?.employment_status}
                            />
                            <DetailRow
                                label="Birth date"
                                value={formatDate(profile?.birth_date)}
                            />
                            <DetailRow
                                label="Monthly income"
                                value={
                                    profile?.monthly_income
                                        ? formatMoney(profile.monthly_income)
                                        : undefined
                                }
                            />
                        </DetailSection>

                        <DetailSection title="Contact info" icon={Mail}>
                            <DetailRow label="Email" value={customer.email} />
                            <DetailRow
                                label="Phone"
                                value={customer.phone || profile?.phone}
                            />
                            <DetailRow label="City" value={profile?.city} />
                            <DetailRow label="Address" value={profile?.address} />
                            <DetailRow
                                label="Created"
                                value={formatDateTime(customer.created_at)}
                            />
                        </DetailSection>

                        <DetailSection title="Verification and request" icon={ShieldCheck}>
                            <DetailRow
                                label="Verification"
                                value={
                                    <StatusPill
                                        value={profile?.status || 'pending'}
                                    />
                                }
                            />
                            <DetailRow
                                label="Verified at"
                                value={formatDateTime(profile?.verified_at)}
                            />
                            <DetailRow
                                label="Request"
                                value={request?.request_number}
                            />
                            <DetailRow
                                label="Request status"
                                value={
                                    <StatusPill value={request?.status || 'none'} />
                                }
                            />
                            <DetailRow
                                label="Account type"
                                value={titleCase(request?.account_type)}
                            />
                            {isPendingRequest && (
                                <Link
                                    href={`/admin/account-opening-requests/${request.id}`}
                                    className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#0A6474] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#082F54]"
                                >
                                    Review in Verification Users
                                    <ChevronRight className="h-3.5 w-3.5" />
                                </Link>
                            )}
                        </DetailSection>

                        <DetailSection title="Appointment details" icon={CalendarClock}>
                            <DetailRow
                                label="Date/time"
                                value={formatDateTime(appointment?.scheduled_at)}
                            />
                            <DetailRow
                                label="Status"
                                value={
                                    appointment ? (
                                        <StatusPill value={appointment.status} />
                                    ) : undefined
                                }
                            />
                            <DetailRow
                                label="Branch"
                                value={
                                    appointment?.branch
                                        ? `${appointment.branch.name}, ${appointment.branch.city}`
                                        : undefined
                                }
                            />
                            <DetailRow label="Notes" value={appointment?.notes} />
                        </DetailSection>

                        <DetailSection title="Bank accounts" icon={WalletCards}>
                            {customer.bank_accounts.length === 0 ? (
                                <EmptyLine label="No bank account found." />
                            ) : (
                                customer.bank_accounts.map((account) => (
                                    <CompactRecord key={account.id}>
                                        <DetailRow
                                            label="Account"
                                            value={`${titleCase(account.account_type)} ending ${account.account_number_last4 || '—'}`}
                                        />
                                        <DetailRow
                                            label="Status"
                                            value={
                                                <StatusPill
                                                    value={account.status}
                                                />
                                            }
                                        />
                                        <DetailRow
                                            label="Balance"
                                            value={formatMoney(
                                                account.balance,
                                                account.currency,
                                            )}
                                        />
                                        <DetailRow
                                            label="Opened"
                                            value={formatDate(account.opened_at)}
                                        />
                                    </CompactRecord>
                                ))
                            )}
                        </DetailSection>

                        <DetailSection title="Card info" icon={CreditCard}>
                            {customer.bank_cards.length === 0 ? (
                                <EmptyLine label="No bank card found." />
                            ) : (
                                customer.bank_cards.map((card) => (
                                    <CompactRecord key={card.id}>
                                        <DetailRow
                                            label="Card"
                                            value={
                                                card.masked_card_number ||
                                                `•••• ${card.card_number_last4}`
                                            }
                                        />
                                        <DetailRow
                                            label="Status"
                                            value={
                                                <StatusPill value={card.status} />
                                            }
                                        />
                                        <DetailRow
                                            label="Expiry"
                                            value={`${String(card.expiry_month).padStart(2, '0')}/${String(card.expiry_year).slice(-2)}`}
                                        />
                                    </CompactRecord>
                                ))
                            )}
                        </DetailSection>

                        <DetailSection title="Latest transactions" icon={CircleDollarSign}>
                            {customer.latest_transactions.length === 0 ? (
                                <EmptyLine label="No transactions found." />
                            ) : (
                                customer.latest_transactions.map((transaction) => (
                                    <CompactRecord key={transaction.id}>
                                        <DetailRow
                                            label={transaction.reference}
                                            value={`${titleCase(transaction.direction)} ${formatMoney(transaction.amount)}`}
                                        />
                                        <DetailRow
                                            label="Type/status"
                                            value={`${titleCase(transaction.type)} · ${titleCase(transaction.status)}`}
                                        />
                                        <DetailRow
                                            label="Performed"
                                            value={formatDateTime(
                                                transaction.performed_at,
                                            )}
                                        />
                                    </CompactRecord>
                                ))
                            )}
                        </DetailSection>

                        <DetailSection title="ATM withdrawals" icon={MapPin}>
                            {customer.latest_atm_withdrawals.length === 0 ? (
                                <EmptyLine label="No ATM withdrawals found." />
                            ) : (
                                customer.latest_atm_withdrawals.map(
                                    (withdrawal) => (
                                        <CompactRecord key={withdrawal.id}>
                                            <DetailRow
                                                label={
                                                    withdrawal.atm
                                                        ? `${withdrawal.atm.name}, ${withdrawal.atm.city}`
                                                        : 'ATM'
                                                }
                                                value={formatMoney(
                                                    withdrawal.amount,
                                                )}
                                            />
                                            <DetailRow
                                                label="Status"
                                                value={
                                                    <StatusPill
                                                        value={withdrawal.status}
                                                    />
                                                }
                                            />
                                            <DetailRow
                                                label="Created"
                                                value={formatDateTime(
                                                    withdrawal.created_at,
                                                )}
                                            />
                                        </CompactRecord>
                                    ),
                                )
                            )}
                        </DetailSection>
                    </div>
                </div>
            </motion.section>
        </motion.div>
    );
}

function HeroMetric({ label, value }: { label: string; value: number }) {
    return (
        <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
            <p className="text-xs text-white/50">{label}</p>
            <p className="mt-1 text-xl font-semibold">{value}</p>
        </div>
    );
}

function StatCard({
    icon: Icon,
    label,
    value,
    helper,
    variant = 'light',
}: {
    icon: ComponentType<{ className?: string }>;
    label: string;
    value: number;
    helper: string;
    variant?: 'light' | 'dark';
}) {
    const isDark = variant === 'dark';

    return (
        <motion.div
            className={`customers-reveal relative overflow-hidden rounded-2xl border p-5 ${
                isDark
                    ? 'border-white/10 bg-[#061F39] text-white shadow-[0_22px_70px_rgba(6,31,57,0.24)] dark:bg-white/[0.065]'
                    : 'border-[#D1D9DA]/75 bg-white text-[#061F39] shadow-sm dark:border-white/10 dark:bg-white/[0.055] dark:text-white'
            }`}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
        >
            {isDark ? (
                <>
                    <div className="pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full bg-[#0A6474]/35 blur-2xl" />
                    <div className="pointer-events-none absolute right-8 -bottom-14 h-28 w-28 rounded-full bg-[#D4A23C]/20 blur-2xl" />
                </>
            ) : null}

            <div className="relative flex items-start justify-between gap-3">
                <span
                    className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                        isDark
                            ? 'bg-white/10 text-[#D4A23C]'
                            : 'bg-[#0A6474]/10 text-[#0A6474] dark:bg-[#0A6474]/20 dark:text-cyan-200'
                    }`}
                >
                    <Icon className="h-5 w-5" />
                </span>
                <TrendingUp
                    className={`h-4 w-4 ${
                        isDark
                            ? 'text-white/35'
                            : 'text-[#0A6474] dark:text-cyan-200'
                    }`}
                />
            </div>

            <p className="relative mt-5 text-2xl font-semibold">{value}</p>
            <p
                className={`relative mt-1 text-sm ${
                    isDark
                        ? 'text-white/55'
                        : 'text-slate-500 dark:text-slate-400'
                }`}
            >
                {label}
            </p>
            <p
                className={`relative mt-1 text-xs ${
                    isDark
                        ? 'text-white/40'
                        : 'text-slate-400 dark:text-slate-500'
                }`}
            >
                {helper}
            </p>
        </motion.div>
    );
}

function DateStack({ value, sub }: { value?: string | null; sub?: string }) {
    if (!value) {
        return <span className="text-slate-400">—</span>;
    }

    return (
        <>
            <div className="font-semibold whitespace-nowrap text-[#061F39] dark:text-white">
                {formatDate(value)}
            </div>
            <div className="mt-1 text-xs whitespace-nowrap text-slate-500 dark:text-slate-400">
                {sub || formatDateTime(value).split(',').slice(-1).join(',')}
            </div>
        </>
    );
}

function DetailSection({
    title,
    icon: Icon,
    children,
}: {
    title: string;
    icon: ComponentType<{ className?: string }>;
    children: ReactNode;
}) {
    return (
        <section className="rounded-[1.4rem] border border-[#D1D9DA] bg-[#F7F8FA] p-4 dark:border-white/10 dark:bg-white/[0.04]">
            <div className="mb-4 flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#082F54]/10 text-[#082F54] dark:bg-cyan-200/10 dark:text-cyan-100">
                    <Icon className="h-5 w-5" />
                </span>
                <h3 className="font-semibold text-[#061F39] dark:text-white">
                    {title}
                </h3>
            </div>
            <div className="grid gap-3">{children}</div>
        </section>
    );
}

function DetailRow({ label, value }: { label: string; value?: ReactNode }) {
    return (
        <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-3 rounded-2xl bg-white px-3 py-2 dark:bg-white/[0.05]">
            <span className="text-xs font-semibold text-[#0A6474] dark:text-cyan-200">
                {label}
            </span>
            <span className="text-sm break-words text-[#061F39] dark:text-white">
                {value || '—'}
            </span>
        </div>
    );
}

function EmptyLine({ label }: { label: string }) {
    return <div className="text-sm text-slate-500 dark:text-slate-400">{label}</div>;
}

function CompactRecord({ children }: { children: ReactNode }) {
    return (
        <div className="grid gap-2 rounded-2xl border border-[#D1D9DA] bg-white p-3 dark:border-white/10 dark:bg-white/[0.05]">
            {children}
        </div>
    );
}

function StatusPill({ value }: { value: string }) {
    const Icon = getStatusIcon(value);

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusTone(value)}`}
        >
            <Icon className="h-3.5 w-3.5" />
            {titleCase(value)}
        </span>
    );
}
