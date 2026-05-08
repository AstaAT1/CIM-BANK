import { Head, Link } from '@inertiajs/react';
import {
    AlertTriangle,
    BadgeCheck,
    BriefcaseBusiness,
    ChevronRight,
    ClipboardList,
    FileSearch,
    Filter,
    Landmark,
    Search,
    ShieldAlert,
    Sparkles,
    TrendingUp,
    UserRoundCheck,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { gsap } from 'gsap';

const statuses = [
    'all',
    'submitted',
    'under_review',
    'need_more_documents',
    'pre_approved',
    'offer_sent',
    'customer_accepted_offer',
    'rejected',
    'cancelled',
];

const riskLevels = ['all', 'low', 'medium', 'high'];

const projectTypes = [
    'all',
    'food',
    'ecommerce',
    'service',
    'transport',
    'agriculture',
    'education',
    'technology',
    'other',
];

function titleCase(value) {
    return String(value || 'pending')
        .replaceAll('_', ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatCurrency(value) {
    return new Intl.NumberFormat('en-MA', {
        style: 'currency',
        currency: 'MAD',
        maximumFractionDigits: 0,
    }).format(Number(value || 0));
}

function formatDate(value) {
    if (!value) {
        return 'Not submitted';
    }

    return new Intl.DateTimeFormat('en-MA', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(new Date(value));
}

function riskTone(level) {
    const tones = {
        low: {
            chip: 'border-emerald-400/25 bg-emerald-500/10 text-emerald-700 dark:border-emerald-300/20 dark:bg-emerald-300/10 dark:text-emerald-200',
            dot: 'bg-emerald-500 dark:bg-emerald-300',
        },
        medium: {
            chip: 'border-amber-400/30 bg-amber-500/10 text-amber-700 dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-200',
            dot: 'bg-amber-500 dark:bg-amber-300',
        },
        high: {
            chip: 'border-rose-400/25 bg-rose-500/10 text-rose-700 dark:border-rose-300/20 dark:bg-rose-300/10 dark:text-rose-200',
            dot: 'bg-rose-500 dark:bg-rose-300',
        },
    };

    return (
        tones[level] || {
            chip: 'border-slate-200 bg-slate-50 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300',
            dot: 'bg-slate-400',
        }
    );
}

function statusTone(status) {
    const tones = {
        submitted:
            'border-sky-400/25 bg-sky-500/10 text-sky-700 dark:border-sky-300/20 dark:bg-sky-300/10 dark:text-sky-200',
        under_review:
            'border-amber-400/30 bg-amber-500/10 text-amber-700 dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-200',
        need_more_documents:
            'border-amber-400/30 bg-amber-500/10 text-amber-700 dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-200',
        pre_approved:
            'border-emerald-400/25 bg-emerald-500/10 text-emerald-700 dark:border-emerald-300/20 dark:bg-emerald-300/10 dark:text-emerald-200',
        offer_sent:
            'border-emerald-400/25 bg-emerald-500/10 text-emerald-700 dark:border-emerald-300/20 dark:bg-emerald-300/10 dark:text-emerald-200',
        customer_accepted_offer:
            'border-[#0A6474]/30 bg-[#0A6474]/10 text-[#0A6474] dark:border-cyan-200/20 dark:bg-cyan-200/10 dark:text-cyan-100',
        rejected:
            'border-rose-400/25 bg-rose-500/10 text-rose-700 dark:border-rose-300/20 dark:bg-rose-300/10 dark:text-rose-200',
        cancelled:
            'border-slate-300 bg-slate-100 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300',
    };

    return tones[status] || tones.submitted;
}

export default function AdminMachrou3iIndex({ applications = [], stats = {} }) {
    const pageRef = useRef(null);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('all');
    const [riskLevel, setRiskLevel] = useState('all');
    const [projectType, setProjectType] = useState('all');

    const filteredApplications = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase();

        return applications.filter((application) => {
            const haystack = [
                application.applicant_name,
                application.applicant_email,
                application.project_name,
                application.company_name,
            ]
                .join(' ')
                .toLowerCase();

            return (
                (!normalizedSearch || haystack.includes(normalizedSearch)) &&
                (status === 'all' || application.status === status) &&
                (riskLevel === 'all' || application.risk_level === riskLevel) &&
                (projectType === 'all' ||
                    application.project_type === projectType)
            );
        });
    }, [applications, projectType, riskLevel, search, status]);

    const totalRequested = useMemo(
        () =>
            filteredApplications.reduce(
                (total, application) =>
                    total + Number(application.requested_amount || 0),
                0,
            ),
        [filteredApplications],
    );

    const highRiskCount = filteredApplications.filter(
        (application) => application.risk_level === 'high',
    ).length;

    useEffect(() => {
        if (!pageRef.current) {
            return undefined;
        }

        const context = gsap.context(() => {
            gsap.fromTo(
                '.admin-mach-reveal',
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
                '.admin-mach-row',
                { autoAlpha: 0, y: 12 },
                {
                    autoAlpha: 1,
                    y: 0,
                    duration: 0.45,
                    stagger: 0.035,
                    delay: 0.22,
                    ease: 'power2.out',
                },
            );

            gsap.to('.admin-mach-orb', {
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
            <Head title="Machrou3i Review" />

            <main
                ref={pageRef}
                className="relative min-h-screen overflow-hidden bg-[#F7F8FA] px-4 py-6 text-[#061F39] sm:px-6 lg:px-8 dark:bg-[#061F39]"
            >
                <div className="admin-mach-orb pointer-events-none absolute -top-28 right-10 h-72 w-72 rounded-full bg-[#0A6474]/15 blur-3xl dark:bg-[#0A6474]/25" />
                <div className="admin-mach-orb pointer-events-none absolute top-[36rem] -left-24 h-72 w-72 rounded-full bg-[#D4A23C]/10 blur-3xl dark:bg-[#D4A23C]/15" />

                <div className="relative mx-auto flex max-w-7xl flex-col gap-6">
                    <section className="admin-mach-reveal relative overflow-hidden rounded-[2rem] border border-[#D1D9DA]/75 bg-white p-6 shadow-[0_24px_70px_rgba(6,31,57,0.08)] dark:border-white/10 dark:bg-white/[0.055] dark:shadow-[0_24px_80px_rgba(0,0,0,0.22)] lg:p-8">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_14%,rgba(212,162,60,0.18),transparent_30%),radial-gradient(circle_at_85%_18%,rgba(10,100,116,0.16),transparent_34%)] dark:bg-[radial-gradient(circle_at_16%_14%,rgba(212,162,60,0.16),transparent_30%),radial-gradient(circle_at_85%_18%,rgba(10,100,116,0.22),transparent_34%)]" />

                        <div className="relative grid gap-8 lg:grid-cols-[1fr_390px] lg:items-center">
                            <div>
                                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#D4A23C]/30 bg-[#D4A23C]/10 px-3 py-1 text-xs font-semibold tracking-[0.16em] text-[#082F54] uppercase dark:text-[#F5D58C]">
                                    <BriefcaseBusiness className="h-3.5 w-3.5" />
                                    Analyst workspace
                                </div>

                                <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-[#061F39] dark:text-white sm:text-4xl lg:text-5xl">
                                    Machrou3i review command center.
                                </h1>

                                <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-300">
                                    Review salary-based project financing
                                    dossiers, inspect risk signals, and prepare
                                    advisor decisions without triggering final
                                    loan approval or disbursement.
                                </p>

                                <div className="mt-6 flex flex-wrap gap-3">
                                    <span className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#0A6474]/20 bg-[#0A6474]/10 px-4 text-sm font-semibold text-[#0A6474] dark:border-cyan-200/10 dark:bg-cyan-200/10 dark:text-cyan-100">
                                        <FileSearch className="h-4 w-4" />
                                        {filteredApplications.length} dossiers shown
                                    </span>
                                    <span className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#D4A23C]/30 bg-[#D4A23C]/10 px-4 text-sm font-semibold text-[#8A6418] dark:text-[#F5D58C]">
                                        <Sparkles className="h-4 w-4" />
                                        {formatCurrency(totalRequested)} requested
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
                                                Review queue
                                            </p>
                                            <p className="mt-2 text-3xl font-semibold">
                                                {stats.pending_review || 0}
                                            </p>
                                            <p className="mt-1 text-sm text-white/55">
                                                pending advisor review
                                            </p>
                                        </div>
                                        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-[#D4A23C]">
                                            <Landmark className="h-5 w-5" />
                                        </span>
                                    </div>

                                    <div className="mt-6 grid gap-3">
                                        <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                                            <p className="text-xs text-white/50">
                                                High risk in current filter
                                            </p>
                                            <p className="mt-1 text-xl font-semibold">
                                                {highRiskCount}
                                            </p>
                                        </div>
                                        <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                                            <p className="text-xs text-white/50">
                                                Governance note
                                            </p>
                                            <p className="mt-1 text-sm font-semibold text-white/85">
                                                No final approval or disbursement
                                                happens here.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                        <StatCard
                            icon={ClipboardList}
                            label="Total applications"
                            value={stats.total || 0}
                            variant="dark"
                        />
                        <StatCard
                            icon={FileSearch}
                            label="Pending review"
                            value={stats.pending_review || 0}
                        />
                        <StatCard
                            icon={BadgeCheck}
                            label="Pre-approved / offers"
                            value={stats.pre_approved_offers || 0}
                        />
                        <StatCard
                            icon={AlertTriangle}
                            label="Rejected"
                            value={stats.rejected || 0}
                        />
                        <StatCard
                            icon={ShieldAlert}
                            label="High risk"
                            value={stats.high_risk || 0}
                        />
                    </section>

                    <section className="admin-mach-reveal rounded-[1.6rem] border border-[#D1D9DA]/75 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.055] lg:p-6">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <div className="flex items-center gap-2 text-sm font-semibold text-[#061F39] dark:text-white">
                                    <Filter className="h-4 w-4 text-[#0A6474] dark:text-cyan-200" />
                                    Filters
                                </div>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    Find dossiers by applicant, project,
                                    employer, status, risk, or project category.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setSearch('');
                                    setStatus('all');
                                    setRiskLevel('all');
                                    setProjectType('all');
                                }}
                                className="inline-flex h-10 items-center justify-center rounded-xl border border-[#D1D9DA] bg-white px-4 text-sm font-semibold text-[#082F54] transition hover:border-[#D4A23C] dark:border-white/10 dark:bg-white/10 dark:text-white"
                            >
                                Reset filters
                            </button>
                        </div>

                        <div className="mt-5 grid gap-3 lg:grid-cols-[1.45fr_1fr_1fr_1fr]">
                            <label className="relative">
                                <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    className="h-12 w-full rounded-xl border border-[#D1D9DA] bg-white pr-3 pl-10 text-sm font-semibold text-[#061F39] shadow-sm transition outline-none placeholder:text-slate-400 focus:border-[#D4A23C] focus:ring-4 focus:ring-[#D4A23C]/15 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:placeholder:text-slate-500"
                                    placeholder="Search applicant, email, project, company"
                                />
                            </label>
                            <SelectFilter
                                value={status}
                                onChange={setStatus}
                                options={statuses}
                            />
                            <SelectFilter
                                value={riskLevel}
                                onChange={setRiskLevel}
                                options={riskLevels}
                            />
                            <SelectFilter
                                value={projectType}
                                onChange={setProjectType}
                                options={projectTypes}
                            />
                        </div>
                    </section>

                    <section className="admin-mach-reveal overflow-hidden rounded-[1.6rem] border border-[#D1D9DA]/75 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.055]">
                        <div className="flex flex-col gap-2 border-b border-[#D1D9DA] px-5 py-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="font-semibold text-[#061F39] dark:text-white">
                                    Applications
                                </h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    {filteredApplications.length} dossier
                                    {filteredApplications.length === 1
                                        ? ''
                                        : 's'}{' '}
                                    shown
                                </p>
                            </div>
                            <div className="inline-flex items-center gap-2 rounded-full border border-[#0A6474]/20 bg-[#0A6474]/10 px-3 py-1 text-xs font-semibold text-[#0A6474] dark:border-cyan-200/10 dark:bg-cyan-200/10 dark:text-cyan-100">
                                <UserRoundCheck className="h-3.5 w-3.5" />
                                Staff review mode
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1120px] text-left text-sm">
                                <thead className="bg-[#F7F8FA] text-xs font-semibold tracking-[0.1em] text-slate-500 uppercase dark:bg-white/[0.035] dark:text-slate-400">
                                    <tr>
                                        <th className="px-5 py-4">Applicant</th>
                                        <th className="px-5 py-4">
                                            Employment
                                        </th>
                                        <th className="px-5 py-4">Project</th>
                                        <th className="px-5 py-4">Requested</th>
                                        <th className="px-5 py-4">Risk</th>
                                        <th className="px-5 py-4">Status</th>
                                        <th className="px-5 py-4">Submitted</th>
                                        <th className="px-5 py-4"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#D1D9DA] dark:divide-white/10">
                                    {filteredApplications.length ? (
                                        filteredApplications.map(
                                            (application) => (
                                                <motion.tr
                                                    key={application.id}
                                                    className="admin-mach-row align-top transition hover:bg-[#F7F8FA] dark:hover:bg-white/[0.035]"
                                                    whileHover={{ x: 3 }}
                                                    transition={{
                                                        duration: 0.18,
                                                    }}
                                                >
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-start gap-3">
                                                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#082F54]/10 text-[#082F54] dark:bg-cyan-200/10 dark:text-cyan-100">
                                                                <UserRoundCheck className="h-5 w-5" />
                                                            </span>
                                                            <div>
                                                                <p className="font-semibold text-[#061F39] dark:text-white">
                                                                    {
                                                                        application.applicant_name
                                                                    }
                                                                </p>
                                                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                                    {
                                                                        application.applicant_email
                                                                    }
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <p className="font-semibold text-[#061F39] dark:text-white">
                                                            {formatCurrency(
                                                                application.monthly_salary,
                                                            )}
                                                        </p>
                                                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                            {
                                                                application.company_name
                                                            }
                                                        </p>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <p className="font-semibold text-[#061F39] dark:text-white">
                                                            {
                                                                application.project_name
                                                            }
                                                        </p>
                                                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                            {titleCase(
                                                                application.project_type,
                                                            )}
                                                        </p>
                                                    </td>
                                                    <td className="px-5 py-4 font-semibold text-[#061F39] dark:text-white">
                                                        {formatCurrency(
                                                            application.requested_amount,
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <RiskBadge
                                                            level={
                                                                application.risk_level
                                                            }
                                                            score={
                                                                application.risk_score
                                                            }
                                                        />
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <StatusBadge
                                                            status={
                                                                application.status
                                                            }
                                                        />
                                                    </td>
                                                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                                                        {formatDate(
                                                            application.submitted_at,
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <Link
                                                            href={`/admin/machrou3i/${application.id}`}
                                                            className="inline-flex items-center gap-1 rounded-xl bg-[#082F54] px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#061F39] dark:bg-[#0A6474] dark:hover:bg-[#0b788d]"
                                                        >
                                                            Review
                                                            <ChevronRight className="h-3.5 w-3.5" />
                                                        </Link>
                                                    </td>
                                                </motion.tr>
                                            ),
                                        )
                                    ) : (
                                        <tr>
                                            <td
                                                className="px-5 py-12 text-center text-slate-500 dark:text-slate-400"
                                                colSpan="8"
                                            >
                                                No Machrou3i applications match
                                                these filters.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </main>
        </>
    );
}

function StatCard({ icon: Icon, label, value, variant = 'light' }) {
    const isDark = variant === 'dark';

    return (
        <motion.div
            className={`admin-mach-reveal relative overflow-hidden rounded-2xl border p-5 ${
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
        </motion.div>
    );
}

function SelectFilter({ value, onChange, options }) {
    return (
        <select
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="h-12 rounded-xl border border-[#D1D9DA] bg-white px-3 text-sm font-semibold text-[#061F39] shadow-sm transition outline-none focus:border-[#D4A23C] focus:ring-4 focus:ring-[#D4A23C]/15 dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
        >
            {options.map((option) => (
                <option key={option} value={option}>
                    {option === 'all' ? 'All' : titleCase(option)}
                </option>
            ))}
        </select>
    );
}

function RiskBadge({ level, score }) {
    const tone = riskTone(level);

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${tone.chip}`}
        >
            <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
            {level ? `${titleCase(level)} · ${score ?? 0}/100` : 'Pending'}
        </span>
    );
}

function StatusBadge({ status }) {
    return (
        <span
            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${statusTone(status)}`}
        >
            {titleCase(status)}
        </span>
    );
}
