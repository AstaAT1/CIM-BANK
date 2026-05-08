import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    BadgeCheck,
    Building2,
    CheckCircle2,
    Clock3,
    Filter,
    Landmark,
    Phone,
    Search,
    Send,
    ShieldCheck,
    Sparkles,
    UserPlus,
    Users,
    XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { gsap } from 'gsap';

const CIM = {
    primary: '#082F54',
    secondary: '#0A6474',
    accent: '#D4A23C',
    dark: '#061F39',
    background: '#F7F8FA',
    white: '#FFFFFF',
    border: '#D1D9DA',
};

const statusStyles = {
    active:
        'border-emerald-300/70 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300',
    pending:
        'border-amber-300/70 bg-amber-50 text-amber-700 dark:border-[#D4A23C]/30 dark:bg-[#D4A23C]/10 dark:text-[#F3D28A]',
    rejected:
        'border-rose-300/70 bg-rose-50 text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-300',
};

function titleCase(value) {
    return String(value || 'unknown')
        .replaceAll('_', ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value) {
    if (!value) return 'Recently';

    return new Intl.DateTimeFormat('en-MA', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(new Date(value));
}

function StatusBadge({ status }) {
    const normalized = String(status || 'pending').toLowerCase();
    const Icon =
        normalized === 'active'
            ? CheckCircle2
            : normalized === 'rejected'
              ? XCircle
              : Clock3;

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold shadow-sm ${
                statusStyles[normalized] ??
                'border-slate-200 bg-white text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300'
            }`}
        >
            <Icon className="h-3.5 w-3.5" />
            {titleCase(normalized)}
        </span>
    );
}

function FieldError({ message }) {
    return message ? (
        <p className="mt-1.5 flex items-center gap-1.5 text-sm font-medium text-rose-600 dark:text-rose-300">
            <AlertCircle className="h-3.5 w-3.5" />
            {message}
        </p>
    ) : null;
}

function MetricCard({ label, value, icon: Icon, tone }) {
    return (
        <motion.div
            whileHover={{ y: -4 }}
            transition={{ duration: 0.22 }}
            className="beneficiary-reveal relative overflow-hidden rounded-2xl border border-[#D1D9DA] bg-white p-4 shadow-[0_18px_45px_rgba(6,31,57,0.06)] dark:border-white/10 dark:bg-white/[0.055] dark:shadow-none"
        >
            <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-[#D4A23C]/10 blur-xl" />
            <div className="relative flex items-center justify-between gap-3">
                <div>
                    <p className="text-xs font-semibold tracking-[0.16em] text-slate-500 uppercase dark:text-slate-400">
                        {label}
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-[#061F39] dark:text-white">
                        {value}
                    </p>
                </div>
                <span
                    className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                        tone ||
                        'bg-[#0A6474]/10 text-[#0A6474] dark:bg-[#0A6474]/20 dark:text-cyan-200'
                    }`}
                >
                    <Icon className="h-5 w-5" />
                </span>
            </div>
        </motion.div>
    );
}

function PremiumInput({ label, error, icon: Icon, className = '', ...props }) {
    return (
        <label className="block">
            <span className="mb-2 block text-sm font-semibold text-[#061F39] dark:text-slate-100">
                {label}
            </span>
            <div className="relative">
                {Icon ? (
                    <Icon className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#0A6474] dark:text-cyan-300" />
                ) : null}
                <input
                    {...props}
                    className={`h-12 w-full rounded-2xl border border-[#D1D9DA] bg-white px-4 text-sm font-medium text-[#061F39] outline-none transition placeholder:text-slate-400 focus:border-[#D4A23C] focus:ring-4 focus:ring-[#D4A23C]/15 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:placeholder:text-slate-500 dark:focus:border-[#D4A23C]/80 ${
                        Icon ? 'pl-10' : ''
                    } ${className}`}
                />
            </div>
            <FieldError message={error} />
        </label>
    );
}

export default function Beneficiaries({ beneficiaries = [], filters = {} }) {
    const pageRef = useRef(null);
    const { props } = usePage();
    const flash = props.flash || {};
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');

    const form = useForm({
        full_name: '',
        identifier: '',
        bank_name: 'CIM Bank',
        phone: '',
    });

    const summary = useMemo(
        () => ({
            total: beneficiaries.length,
            active: beneficiaries.filter(
                (beneficiary) => beneficiary.status === 'active',
            ).length,
            pending: beneficiaries.filter(
                (beneficiary) => beneficiary.status === 'pending',
            ).length,
            rejected: beneficiaries.filter(
                (beneficiary) => beneficiary.status === 'rejected',
            ).length,
        }),
        [beneficiaries],
    );

    useEffect(() => {
        if (!pageRef.current) return undefined;

        const context = gsap.context(() => {
            gsap.fromTo(
                '.beneficiary-reveal',
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
                '.beneficiary-row',
                { autoAlpha: 0, x: 14 },
                {
                    autoAlpha: 1,
                    x: 0,
                    duration: 0.48,
                    stagger: 0.045,
                    delay: 0.25,
                    ease: 'power2.out',
                },
            );

            gsap.to('.trust-orb', {
                y: -10,
                x: 8,
                duration: 5,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut',
            });
        }, pageRef);

        return () => context.revert();
    }, [beneficiaries.length]);

    const applyFilters = (event) => {
        event.preventDefault();

        router.get(
            '/customer/beneficiaries',
            { search, status },
            { preserveState: true, replace: true },
        );
    };

    const addBeneficiary = (event) => {
        event.preventDefault();

        form.post('/backend/customer/beneficiaries', {
            preserveScroll: true,
            onSuccess: () => form.reset('full_name', 'identifier', 'phone'),
        });
    };

    return (
        <>
            <Head title="Beneficiaries" />

            <main
                ref={pageRef}
                className="relative min-h-full overflow-hidden bg-[#F7F8FA] px-4 py-6 text-[#061F39] sm:px-6 lg:px-8 dark:bg-[#031827] dark:text-white"
            >
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="trust-orb absolute -top-24 right-10 h-72 w-72 rounded-full bg-[#0A6474]/20 blur-3xl dark:bg-[#0A6474]/30" />
                    <div className="absolute top-48 -left-28 h-80 w-80 rounded-full bg-[#D4A23C]/10 blur-3xl dark:bg-[#D4A23C]/15" />
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(8,47,84,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(8,47,84,0.04)_1px,transparent_1px)] bg-[size:42px_42px] dark:bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)]" />
                </div>

                <div className="relative z-10 mx-auto flex max-w-7xl flex-col gap-6">
                    <section className="beneficiary-reveal relative overflow-hidden rounded-[2rem] border border-[#D1D9DA] bg-white p-6 shadow-[0_24px_70px_rgba(6,31,57,0.08)] dark:border-white/10 dark:bg-[#061F39]/90 dark:shadow-none sm:p-7">
                        <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_75%_25%,rgba(212,162,60,0.24),transparent_30%),radial-gradient(circle_at_85%_80%,rgba(10,100,116,0.24),transparent_34%)]" />
                        <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
                            <div>
                                <div className="inline-flex items-center gap-2 rounded-full border border-[#0A6474]/20 bg-[#0A6474]/10 px-3 py-1 text-xs font-semibold tracking-[0.14em] text-[#0A6474] uppercase dark:border-cyan-300/15 dark:bg-cyan-300/10 dark:text-cyan-200">
                                    <ShieldCheck className="h-3.5 w-3.5" />
                                    Trusted transfer network
                                </div>
                                <h1 className="mt-5 text-3xl font-semibold tracking-tight text-[#061F39] dark:text-white sm:text-5xl">
                                    Beneficiaries
                                </h1>
                                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-300">
                                    Add verified CIM customers, protect transfer destinations, and keep every recipient ready for secure internal payments.
                                </p>
                            </div>

                            <div className="grid min-w-full grid-cols-3 gap-3 sm:min-w-[420px]">
                                <MetricCard
                                    label="Total"
                                    value={summary.total}
                                    icon={Users}
                                    tone="bg-[#082F54] text-white dark:bg-white/10 dark:text-white"
                                />
                                <MetricCard
                                    label="Ready"
                                    value={summary.active}
                                    icon={BadgeCheck}
                                    tone="bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300"
                                />
                                <MetricCard
                                    label="Pending"
                                    value={summary.pending}
                                    icon={Clock3}
                                    tone="bg-[#D4A23C]/15 text-[#9C6B05] dark:bg-[#D4A23C]/15 dark:text-[#F3D28A]"
                                />
                            </div>
                        </div>
                    </section>

                    <section className="grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
                        <motion.form
                            onSubmit={addBeneficiary}
                            whileHover={{ y: -3 }}
                            transition={{ duration: 0.24 }}
                            className="beneficiary-reveal relative overflow-hidden rounded-[1.75rem] border border-[#D1D9DA] bg-white p-5 shadow-[0_20px_55px_rgba(6,31,57,0.07)] dark:border-white/10 dark:bg-white/[0.055] dark:shadow-none sm:p-6"
                        >
                            <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-[#D4A23C]/10 blur-2xl" />
                            <div className="relative flex items-center gap-4">
                                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#082F54] text-white shadow-[0_18px_35px_rgba(8,47,84,0.20)] dark:bg-[#0A6474]">
                                    <UserPlus className="h-6 w-6" />
                                </span>
                                <div>
                                    <h2 className="text-xl font-semibold text-[#061F39] dark:text-white">
                                        Add beneficiary
                                    </h2>
                                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                        CIM checks the account details before transfers become available.
                                    </p>
                                </div>
                            </div>

                            <div className="relative mt-6 grid gap-4">
                                <PremiumInput
                                    label="Full name"
                                    value={form.data.full_name}
                                    onChange={(event) =>
                                        form.setData(
                                            'full_name',
                                            event.target.value,
                                        )
                                    }
                                    icon={Users}
                                    error={form.errors.full_name}
                                    placeholder="Receiver full name"
                                />

                                <PremiumInput
                                    label="RIB or account number"
                                    value={form.data.identifier}
                                    onChange={(event) =>
                                        form.setData(
                                            'identifier',
                                            event.target.value,
                                        )
                                    }
                                    icon={Landmark}
                                    error={
                                        form.errors.identifier ||
                                        form.errors.rib ||
                                        form.errors.account_number
                                    }
                                    className="font-mono"
                                    placeholder="RIB or CIM account number"
                                />

                                <PremiumInput
                                    label="Bank name"
                                    value={form.data.bank_name}
                                    onChange={(event) =>
                                        form.setData(
                                            'bank_name',
                                            event.target.value,
                                        )
                                    }
                                    icon={Building2}
                                    error={form.errors.bank_name}
                                />

                                <PremiumInput
                                    label="Phone"
                                    value={form.data.phone}
                                    onChange={(event) =>
                                        form.setData('phone', event.target.value)
                                    }
                                    icon={Phone}
                                    error={form.errors.phone}
                                    placeholder="Optional"
                                />
                            </div>

                            <motion.button
                                type="submit"
                                disabled={form.processing}
                                whileTap={{ scale: 0.98 }}
                                className="relative mt-6 inline-flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-[#082F54] px-4 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(8,47,84,0.18)] transition hover:bg-[#061F39] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#D4A23C] dark:text-[#061F39] dark:hover:bg-[#F0C56A]"
                            >
                                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition duration-700 hover:translate-x-full" />
                                <ShieldCheck className="h-4 w-4" />
                                {form.processing
                                    ? 'Verifying account...'
                                    : 'Add verified beneficiary'}
                            </motion.button>
                        </motion.form>

                        <section className="beneficiary-reveal rounded-[1.75rem] border border-[#D1D9DA] bg-white p-5 shadow-[0_20px_55px_rgba(6,31,57,0.07)] dark:border-white/10 dark:bg-white/[0.055] dark:shadow-none sm:p-6">
                            <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                <div>
                                    <p className="text-xs font-semibold tracking-[0.18em] text-[#0A6474] uppercase dark:text-cyan-200">
                                        Saved recipients
                                    </p>
                                    <h2 className="mt-1 text-xl font-semibold text-[#061F39] dark:text-white">
                                        Transfer directory
                                    </h2>
                                </div>
                                <div className="inline-flex items-center gap-2 rounded-full border border-[#D1D9DA] px-3 py-1.5 text-xs font-semibold text-slate-500 dark:border-white/10 dark:text-slate-300">
                                    <Sparkles className="h-3.5 w-3.5 text-[#D4A23C]" />
                                    {summary.active} ready for transfers
                                </div>
                            </div>

                            <form
                                onSubmit={applyFilters}
                                className="grid gap-3 rounded-2xl border border-[#D1D9DA] bg-[#F7F8FA] p-3 dark:border-white/10 dark:bg-[#031827]/70 md:grid-cols-[1fr_180px_auto] md:items-center"
                            >
                                <div className="relative">
                                    <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#0A6474] dark:text-cyan-300" />
                                    <input
                                        value={search}
                                        onChange={(event) =>
                                            setSearch(event.target.value)
                                        }
                                        className="h-12 w-full rounded-2xl border border-[#D1D9DA] bg-white pr-3 pl-10 text-sm font-medium text-[#061F39] outline-none transition placeholder:text-slate-400 focus:border-[#D4A23C] focus:ring-4 focus:ring-[#D4A23C]/15 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:placeholder:text-slate-500"
                                        placeholder="Search by name, RIB, account, phone"
                                    />
                                </div>
                                <select
                                    value={status}
                                    onChange={(event) =>
                                        setStatus(event.target.value)
                                    }
                                    className="h-12 rounded-2xl border border-[#D1D9DA] bg-white px-3 text-sm font-semibold text-[#061F39] outline-none transition focus:border-[#D4A23C] focus:ring-4 focus:ring-[#D4A23C]/15 dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
                                >
                                    <option value="">All statuses</option>
                                    <option value="active">Active</option>
                                    <option value="pending">Pending</option>
                                    <option value="rejected">Rejected</option>
                                </select>
                                <button
                                    type="submit"
                                    className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-[#D1D9DA] bg-white px-4 text-sm font-semibold text-[#082F54] transition hover:border-[#D4A23C] hover:bg-[#D4A23C]/10 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:hover:border-[#D4A23C]/60"
                                >
                                    <Filter className="h-4 w-4" />
                                    Filter
                                </button>
                            </form>

                            <div className="mt-5 grid gap-3">
                                {beneficiaries.length ? (
                                    beneficiaries.map((beneficiary) => (
                                        <motion.article
                                            key={beneficiary.id}
                                            whileHover={{ y: -3, scale: 1.005 }}
                                            transition={{ duration: 0.18 }}
                                            className="beneficiary-row group relative overflow-hidden rounded-2xl border border-[#D1D9DA] bg-white p-4 shadow-sm transition hover:border-[#D4A23C]/70 hover:shadow-[0_16px_40px_rgba(6,31,57,0.08)] dark:border-white/10 dark:bg-white/[0.045] dark:hover:border-[#D4A23C]/40 dark:hover:shadow-none"
                                        >
                                            <div className="absolute inset-y-0 left-0 w-1 bg-[#0A6474] opacity-0 transition group-hover:opacity-100" />
                                            <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
                                                <div className="min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#082F54]/10 text-[#082F54] dark:bg-cyan-300/10 dark:text-cyan-200">
                                                            <Users className="h-5 w-5" />
                                                        </span>
                                                        <div>
                                                            <h3 className="font-semibold text-[#061F39] dark:text-white">
                                                                {beneficiary.full_name}
                                                            </h3>
                                                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                                                Added {formatDate(beneficiary.created_at)}
                                                            </p>
                                                        </div>
                                                        <StatusBadge
                                                            status={
                                                                beneficiary.status
                                                            }
                                                        />
                                                    </div>

                                                    <p className="mt-4 rounded-xl border border-[#D1D9DA] bg-[#F7F8FA] px-3 py-2 font-mono text-sm font-semibold break-all text-[#061F39] dark:border-white/10 dark:bg-[#031827]/70 dark:text-slate-100">
                                                        {beneficiary.rib ||
                                                            beneficiary.account_number ||
                                                            'Account unavailable'}
                                                    </p>

                                                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-[#0A6474]/10 px-2.5 py-1 text-[#0A6474] dark:bg-cyan-300/10 dark:text-cyan-200">
                                                            <Building2 className="h-3.5 w-3.5" />
                                                            {beneficiary.bank_name || 'CIM Bank'}
                                                        </span>
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-[#D4A23C]/10 px-2.5 py-1 text-[#8B650B] dark:bg-[#D4A23C]/15 dark:text-[#F3D28A]">
                                                            <Send className="h-3.5 w-3.5" />
                                                            {beneficiary.transfers_available
                                                                ? 'Transfers available'
                                                                : 'Transfers unavailable'}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="rounded-2xl border border-[#D1D9DA] bg-[#F7F8FA] px-4 py-3 text-sm dark:border-white/10 dark:bg-[#031827]/70 lg:min-w-52">
                                                    <p className="text-xs font-semibold tracking-[0.14em] text-slate-500 uppercase dark:text-slate-400">
                                                        Linked CIM account
                                                    </p>
                                                    <p className="mt-2 font-semibold text-[#061F39] dark:text-white">
                                                        {beneficiary.linked_bank_account_id
                                                            ? titleCase(
                                                                  beneficiary.linked_account_status,
                                                              )
                                                            : 'Not linked'}
                                                    </p>
                                                </div>
                                            </div>
                                        </motion.article>
                                    ))
                                ) : (
                                    <div className="beneficiary-reveal rounded-2xl border border-dashed border-[#D1D9DA] bg-[#F7F8FA] px-6 py-12 text-center dark:border-white/10 dark:bg-white/[0.035]">
                                        <UserPlus className="mx-auto mb-4 h-10 w-10 text-[#0A6474] dark:text-cyan-200" />
                                        <h3 className="text-lg font-semibold text-[#061F39] dark:text-white">
                                            No beneficiaries found
                                        </h3>
                                        <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
                                            Add an active CIM account to make transfers available immediately.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </section>
                    </section>
                </div>
            </main>
        </>
    );
}
