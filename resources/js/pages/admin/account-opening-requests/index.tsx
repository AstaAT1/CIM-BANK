import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowRight,
    BadgeCheck,
    CalendarClock,
    CheckCircle2,
    ClipboardCheck,
    FileSearch,
    Filter,
    Landmark,
    Search,
    ShieldCheck,
    Sparkles,
    TrendingUp,
    UserRoundCheck,
    XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { gsap } from 'gsap';

/* ── Types ── */
type CustomerProfile = {
    cin: string;
    employment_status: string;
    status: string;
};

type User = {
    id: number;
    name: string;
    email: string;
    phone: string;
    profile?: CustomerProfile | null;
};

type Branch = { id: number; name: string; city: string };
type Appointment = { id: number; scheduled_at: string; status: string } | null;
type Reviewer = { name: string } | null;

type AORItem = {
    id: number;
    request_number: string;
    account_type: string;
    status: string;
    submitted_at: string | null;
    reviewed_at: string | null;
    documents_count: number;
    user: User;
    customer_profile: CustomerProfile | null;
    branch: Branch | null;
    appointment: Appointment;
    reviewer: Reviewer;
};

type PaginatedData = {
    data: AORItem[];
    current_page: number;
    last_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
};

type PageProps = {
    requests: PaginatedData;
    branches: Branch[];
    filters: { status?: string; branch_id?: string; search?: string };
    statuses: string[];
    flash?: { success?: string; error?: string };
};

const pendingStatuses = ['submitted', 'appointment_scheduled', 'under_review'];
const approvedStatuses = ['approved', 'account_created'];

function titleCase(value: string | null | undefined) {
    return String(value || 'pending')
        .replaceAll('_', ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value: string | null | undefined) {
    if (!value) return 'Not scheduled';

    return new Intl.DateTimeFormat('en-MA', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(new Date(value));
}

function formatTime(value: string | null | undefined) {
    if (!value) return '—';

    return new Intl.DateTimeFormat('en-MA', {
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value));
}

function getStatusTone(value: string | null | undefined) {
    const tones: Record<string, string> = {
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
        rejected:
            'border-rose-400/25 bg-rose-500/10 text-rose-700 dark:border-rose-300/20 dark:bg-rose-300/10 dark:text-rose-200',
        draft:
            'border-slate-300 bg-slate-100 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300',
    };

    return (
        tones[String(value || 'pending')] ||
        'border-slate-300 bg-slate-100 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300'
    );
}

function getStatusIcon(value: string | null | undefined) {
    const status = String(value || 'pending');

    if (approvedStatuses.includes(status) || status === 'verified') {
        return CheckCircle2;
    }

    if (status === 'rejected') {
        return XCircle;
    }

    if (pendingStatuses.includes(status) || status === 'pending') {
        return CalendarClock;
    }

    return BadgeCheck;
}

export default function AccountOpeningRequestsIndex() {
    const { requests, branches, filters, statuses, flash } = usePage<{
        props: PageProps;
    }>().props as unknown as PageProps;

    const pageRef = useRef<HTMLElement | null>(null);
    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [branchFilter, setBranchFilter] = useState(filters.branch_id || '');

    const pageStats = useMemo(() => {
        const rows = requests.data || [];

        return {
            pending: rows.filter((request) =>
                pendingStatuses.includes(request.status),
            ).length,
            approved: rows.filter((request) =>
                approvedStatuses.includes(request.status),
            ).length,
            rejected: rows.filter((request) => request.status === 'rejected')
                .length,
            scheduled: rows.filter((request) => request.appointment).length,
            documents: rows.reduce(
                (total, request) => total + Number(request.documents_count || 0),
                0,
            ),
        };
    }, [requests.data]);

    const activeFilterCount = [search, statusFilter, branchFilter].filter(
        Boolean,
    ).length;

    const applyFilters = () => {
        router.get(
            '/admin/account-opening-requests',
            {
                ...(search && { search }),
                ...(statusFilter && { status: statusFilter }),
                ...(branchFilter && { branch_id: branchFilter }),
            },
            { preserveState: true },
        );
    };

    const resetFilters = () => {
        setSearch('');
        setStatusFilter('');
        setBranchFilter('');

        router.get(
            '/admin/account-opening-requests',
            {},
            { preserveState: true },
        );
    };

    useEffect(() => {
        if (!pageRef.current) return undefined;

        const context = gsap.context(() => {
            gsap.fromTo(
                '.aor-reveal',
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
                '.aor-row',
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

            gsap.to('.aor-orb', {
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
            <Head title="Account Opening Requests — CIM Admin" />

            <main
                ref={pageRef}
                className="relative min-h-screen overflow-hidden bg-[#F7F8FA] px-4 py-6 text-[#061F39] sm:px-6 lg:px-8 dark:bg-[#061F39]"
            >
                <div className="aor-orb pointer-events-none absolute -top-28 right-10 h-72 w-72 rounded-full bg-[#0A6474]/15 blur-3xl dark:bg-[#0A6474]/25" />
                <div className="aor-orb pointer-events-none absolute top-[42rem] -left-24 h-72 w-72 rounded-full bg-[#D4A23C]/10 blur-3xl dark:bg-[#D4A23C]/15" />

                <div className="relative mx-auto flex max-w-7xl flex-col gap-6">
                    <section className="aor-reveal relative overflow-hidden rounded-[2rem] border border-[#D1D9DA]/75 bg-white p-6 shadow-[0_24px_70px_rgba(6,31,57,0.08)] dark:border-white/10 dark:bg-white/[0.055] dark:shadow-[0_24px_80px_rgba(0,0,0,0.22)] lg:p-8">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_14%,rgba(212,162,60,0.18),transparent_30%),radial-gradient(circle_at_85%_18%,rgba(10,100,116,0.16),transparent_34%)] dark:bg-[radial-gradient(circle_at_16%_14%,rgba(212,162,60,0.16),transparent_30%),radial-gradient(circle_at_85%_18%,rgba(10,100,116,0.22),transparent_34%)]" />

                        <div className="relative grid gap-8 lg:grid-cols-[1fr_390px] lg:items-center">
                            <div>
                                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#D4A23C]/30 bg-[#D4A23C]/10 px-3 py-1 text-xs font-semibold tracking-[0.16em] text-[#082F54] uppercase dark:text-[#F5D58C]">
                                    <Landmark className="h-3.5 w-3.5" />
                                    CIM Admin Panel
                                </div>

                                <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-[#061F39] dark:text-white sm:text-4xl lg:text-5xl">
                                    Account opening command center.
                                </h1>

                                <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-300">
                                    Review client onboarding requests, verify
                                    documents, appointments, branches, and
                                    customer profile status from one clean
                                    operational workspace.
                                </p>

                                <div className="mt-6 flex flex-wrap gap-3">
                                    <span className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#0A6474]/20 bg-[#0A6474]/10 px-4 text-sm font-semibold text-[#0A6474] dark:border-cyan-200/10 dark:bg-cyan-200/10 dark:text-cyan-100">
                                        <FileSearch className="h-4 w-4" />
                                        {requests.total} total requests
                                    </span>
                                    <span className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#D4A23C]/30 bg-[#D4A23C]/10 px-4 text-sm font-semibold text-[#8A6418] dark:text-[#F5D58C]">
                                        <Sparkles className="h-4 w-4" />
                                        {activeFilterCount
                                            ? `${activeFilterCount} active filter${activeFilterCount === 1 ? '' : 's'}`
                                            : 'All queues visible'}
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
                                                Current page queue
                                            </p>
                                            <p className="mt-2 text-3xl font-semibold">
                                                {requests.data.length}
                                            </p>
                                            <p className="mt-1 text-sm text-white/55">
                                                visible applications
                                            </p>
                                        </div>
                                        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-[#D4A23C]">
                                            <ClipboardCheck className="h-5 w-5" />
                                        </span>
                                    </div>

                                    <div className="mt-6 grid grid-cols-2 gap-3">
                                        <MiniMetric
                                            label="Pending"
                                            value={pageStats.pending}
                                        />
                                        <MiniMetric
                                            label="Scheduled"
                                            value={pageStats.scheduled}
                                        />
                                        <MiniMetric
                                            label="Docs"
                                            value={pageStats.documents}
                                        />
                                        <MiniMetric
                                            label="Approved"
                                            value={pageStats.approved}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {flash?.success && (
                        <motion.div
                            className="aor-reveal rounded-2xl border border-emerald-300/30 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-700 dark:text-emerald-200"
                            initial={{ scale: 0.98 }}
                            animate={{ scale: 1 }}
                        >
                            {flash.success}
                        </motion.div>
                    )}

                    {flash?.error && (
                        <motion.div
                            className="aor-reveal rounded-2xl border border-rose-300/30 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-700 dark:text-rose-200"
                            initial={{ scale: 0.98 }}
                            animate={{ scale: 1 }}
                        >
                            {flash.error}
                        </motion.div>
                    )}

                    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                        <StatCard
                            icon={ClipboardCheck}
                            label="Total requests"
                            value={requests.total}
                            helper="all matching records"
                            variant="dark"
                        />
                        <StatCard
                            icon={CalendarClock}
                            label="Pending review"
                            value={pageStats.pending}
                            helper="submitted / scheduled / review"
                        />
                        <StatCard
                            icon={BadgeCheck}
                            label="Approved"
                            value={pageStats.approved}
                            helper="approved or account created"
                        />
                        <StatCard
                            icon={AlertCircle}
                            label="Rejected"
                            value={pageStats.rejected}
                            helper="declined requests"
                        />
                        <StatCard
                            icon={ShieldCheck}
                            label="Documents"
                            value={pageStats.documents}
                            helper="attached files on page"
                        />
                    </section>

                    <section className="aor-reveal rounded-[1.6rem] border border-[#D1D9DA]/75 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.055] lg:p-6">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <div className="flex items-center gap-2 text-sm font-semibold text-[#061F39] dark:text-white">
                                    <Filter className="h-4 w-4 text-[#0A6474] dark:text-cyan-200" />
                                    Filters
                                </div>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    Search by client identity, request number,
                                    status, or preferred branch.
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={resetFilters}
                                    className="inline-flex h-11 items-center justify-center rounded-xl border border-[#D1D9DA] bg-white px-4 text-sm font-semibold text-[#082F54] transition hover:border-[#D4A23C] dark:border-white/10 dark:bg-white/10 dark:text-white"
                                >
                                    Reset
                                </button>
                                <motion.button
                                    type="button"
                                    onClick={applyFilters}
                                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#082F54] px-5 text-sm font-semibold text-white shadow-lg shadow-[#082F54]/15 transition hover:bg-[#061F39] dark:bg-[#0A6474] dark:hover:bg-[#0b788d]"
                                    whileHover={{ y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    Apply filters
                                    <ArrowRight className="h-4 w-4" />
                                </motion.button>
                            </div>
                        </div>

                        <div className="mt-5 grid gap-3 lg:grid-cols-[1.45fr_1fr_1fr]">
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
                                    placeholder="Name, email, CIN, request number..."
                                    className="h-12 w-full rounded-xl border border-[#D1D9DA] bg-white pr-3 pl-10 text-sm font-semibold text-[#061F39] shadow-sm transition outline-none placeholder:text-slate-400 focus:border-[#D4A23C] focus:ring-4 focus:ring-[#D4A23C]/15 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:placeholder:text-slate-500"
                                />
                            </label>

                            <select
                                value={statusFilter}
                                onChange={(event) =>
                                    setStatusFilter(event.target.value)
                                }
                                className="h-12 rounded-xl border border-[#D1D9DA] bg-white px-3 text-sm font-semibold text-[#061F39] shadow-sm transition outline-none focus:border-[#D4A23C] focus:ring-4 focus:ring-[#D4A23C]/15 dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
                            >
                                <option value="">All statuses</option>
                                {statuses.map((status) => (
                                    <option key={status} value={status}>
                                        {titleCase(status)}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={branchFilter}
                                onChange={(event) =>
                                    setBranchFilter(event.target.value)
                                }
                                className="h-12 rounded-xl border border-[#D1D9DA] bg-white px-3 text-sm font-semibold text-[#061F39] shadow-sm transition outline-none focus:border-[#D4A23C] focus:ring-4 focus:ring-[#D4A23C]/15 dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
                            >
                                <option value="">All branches</option>
                                {branches.map((branch) => (
                                    <option key={branch.id} value={branch.id}>
                                        {branch.name} — {branch.city}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </section>

                    <section className="aor-reveal overflow-hidden rounded-[1.6rem] border border-[#D1D9DA]/75 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.055]">
                        <div className="flex flex-col gap-2 border-b border-[#D1D9DA] px-5 py-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="font-semibold text-[#061F39] dark:text-white">
                                    Verification queue
                                </h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Page {requests.current_page} of{' '}
                                    {requests.last_page} · {requests.total} total
                                    requests
                                </p>
                            </div>

                            <div className="inline-flex items-center gap-2 rounded-full border border-[#0A6474]/20 bg-[#0A6474]/10 px-3 py-1 text-xs font-semibold text-[#0A6474] dark:border-cyan-200/10 dark:bg-cyan-200/10 dark:text-cyan-100">
                                <UserRoundCheck className="h-3.5 w-3.5" />
                                Staff verification mode
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1180px] text-left text-sm">
                                <thead className="bg-[#F7F8FA] text-xs font-semibold tracking-[0.1em] text-slate-500 uppercase dark:bg-white/[0.035] dark:text-slate-400">
                                    <tr>
                                        <th className="px-5 py-4">
                                            Request
                                        </th>
                                        <th className="px-5 py-4">Client</th>
                                        <th className="px-5 py-4">Identity</th>
                                        <th className="px-5 py-4">Branch</th>
                                        <th className="px-5 py-4">
                                            Appointment
                                        </th>
                                        <th className="px-5 py-4">
                                            Request status
                                        </th>
                                        <th className="px-5 py-4">
                                            Verification
                                        </th>
                                        <th className="px-5 py-4">Docs</th>
                                        <th className="px-5 py-4"></th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-[#D1D9DA] dark:divide-white/10">
                                    {requests.data.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={9}
                                                className="px-5 py-14 text-center text-slate-500 dark:text-slate-400"
                                            >
                                                No account opening requests match
                                                these filters.
                                            </td>
                                        </tr>
                                    ) : (
                                        requests.data.map((request) => {
                                            const profile =
                                                request.customer_profile;
                                            const appointment =
                                                request.appointment;

                                            return (
                                                <motion.tr
                                                    key={request.id}
                                                    className="aor-row align-top transition hover:bg-[#F7F8FA] dark:hover:bg-white/[0.035]"
                                                    whileHover={{ x: 3 }}
                                                    transition={{
                                                        duration: 0.18,
                                                    }}
                                                >
                                                    <td className="px-5 py-4">
                                                        <p className="font-semibold text-[#0A6474] dark:text-cyan-100">
                                                            {
                                                                request.request_number
                                                            }
                                                        </p>
                                                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                            {titleCase(
                                                                request.account_type,
                                                            )}
                                                        </p>
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        <div className="flex items-start gap-3">
                                                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#082F54]/10 text-[#082F54] dark:bg-cyan-200/10 dark:text-cyan-100">
                                                                <UserRoundCheck className="h-5 w-5" />
                                                            </span>
                                                            <div>
                                                                <p className="font-semibold text-[#061F39] dark:text-white">
                                                                    {
                                                                        request
                                                                            .user
                                                                            ?.name
                                                                    }
                                                                </p>
                                                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                                    {
                                                                        request
                                                                            .user
                                                                            ?.email
                                                                    }
                                                                </p>
                                                                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                                                    {request
                                                                        .user
                                                                        ?.phone ||
                                                                        'No phone'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        <p className="font-semibold text-[#061F39] dark:text-white">
                                                            {profile?.cin ||
                                                                '—'}
                                                        </p>
                                                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                            {profile?.employment_status ||
                                                                'No profession'}
                                                        </p>
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        <p className="font-semibold text-[#061F39] dark:text-white">
                                                            {request.branch
                                                                ?.name || '—'}
                                                        </p>
                                                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                            {request.branch
                                                                ?.city || ''}
                                                        </p>
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        {appointment ? (
                                                            <div>
                                                                <p className="font-semibold text-[#061F39] dark:text-white">
                                                                    {formatDate(
                                                                        appointment.scheduled_at,
                                                                    )}
                                                                </p>
                                                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                                    {formatTime(
                                                                        appointment.scheduled_at,
                                                                    )}{' '}
                                                                    ·{' '}
                                                                    {titleCase(
                                                                        appointment.status,
                                                                    )}
                                                                </p>
                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-400">
                                                                —
                                                            </span>
                                                        )}
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        <StatusPill
                                                            value={
                                                                request.status
                                                            }
                                                        />
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
                                                        <span
                                                            className={`inline-flex h-9 min-w-9 items-center justify-center rounded-xl border px-3 text-sm font-semibold ${
                                                                request.documents_count >
                                                                0
                                                                    ? 'border-[#0A6474]/25 bg-[#0A6474]/10 text-[#0A6474] dark:border-cyan-200/15 dark:bg-cyan-200/10 dark:text-cyan-100'
                                                                    : 'border-slate-200 bg-slate-50 text-slate-400 dark:border-white/10 dark:bg-white/5'
                                                            }`}
                                                        >
                                                            {
                                                                request.documents_count
                                                            }
                                                        </span>
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        <Link
                                                            href={`/admin/account-opening-requests/${request.id}`}
                                                            className="inline-flex items-center gap-1 rounded-xl bg-[#082F54] px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#061F39] dark:bg-[#0A6474] dark:hover:bg-[#0b788d]"
                                                        >
                                                            Review
                                                            <ArrowRight className="h-3.5 w-3.5" />
                                                        </Link>
                                                    </td>
                                                </motion.tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {requests.last_page > 1 && (
                            <div className="flex flex-wrap justify-center gap-2 border-t border-[#D1D9DA] px-5 py-4 dark:border-white/10">
                                {requests.links.map((link, index) => (
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
        </>
    );
}

function MiniMetric({ label, value }: { label: string; value: number }) {
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
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: number;
    helper: string;
    variant?: 'light' | 'dark';
}) {
    const isDark = variant === 'dark';

    return (
        <motion.div
            className={`aor-reveal relative overflow-hidden rounded-2xl border p-5 ${
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
