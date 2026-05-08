import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import CimFeedbackModal from '@/components/cim-feedback-modal';
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { gsap } from 'gsap';
import {
    AlertTriangle,
    ArrowRight,
    Banknote,
    BellRing,
    CalendarClock,
    CheckCircle2,
    Clock3,
    CreditCard,
    History,
    Landmark,
    Pencil,
    Plus,
    ReceiptText,
    ShieldCheck,
    Sparkles,
    Trash2,
    WalletCards,
    XCircle,
    Zap,
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

const categoryLabels = {
    electricity: 'Electricity',
    internet: 'Internet',
    other: 'Other',
    phone: 'Phone',
    school: 'School',
    subscription: 'Subscription',
    water: 'Water',
};

const frequencyLabels = {
    monthly: 'Monthly',
    one_time: 'One time',
    weekly: 'Weekly',
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
        return 'Not scheduled';
    }

    return new Intl.DateTimeFormat('en-MA', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value));
}

function fieldDateValue(value) {
    if (!value) {
        return '';
    }

    const date = new Date(value);
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());

    return date.toISOString().slice(0, 16);
}

function titleCase(value) {
    return String(value || 'unknown')
        .replaceAll('_', ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function StatusBadge({ status }) {
    const normalized = String(status || 'unknown').toLowerCase();

    const styles = {
        active:
            'border-emerald-400/25 bg-emerald-500/10 text-emerald-700 dark:border-emerald-300/20 dark:bg-emerald-300/10 dark:text-emerald-200',
        cancelled:
            'border-slate-300 bg-slate-100 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300',
        completed:
            'border-emerald-400/25 bg-emerald-500/10 text-emerald-700 dark:border-emerald-300/20 dark:bg-emerald-300/10 dark:text-emerald-200',
        failed:
            'border-rose-400/25 bg-rose-500/10 text-rose-700 dark:border-rose-300/20 dark:bg-rose-300/10 dark:text-rose-200',
        paid:
            'border-emerald-400/25 bg-emerald-500/10 text-emerald-700 dark:border-emerald-300/20 dark:bg-emerald-300/10 dark:text-emerald-200',
        paused:
            'border-amber-400/30 bg-amber-500/10 text-amber-700 dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-200',
        skipped:
            'border-amber-400/30 bg-amber-500/10 text-amber-700 dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-200',
    };

    const Icon =
        normalized === 'failed' || normalized === 'cancelled'
            ? XCircle
            : normalized === 'paused' || normalized === 'skipped'
              ? Clock3
              : CheckCircle2;

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[normalized] ?? 'border-slate-200 bg-white text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300'}`}
        >
            <Icon className="h-3.5 w-3.5" />
            {titleCase(normalized)}
        </span>
    );
}

function FieldError({ message }) {
    return message ? (
        <p className="mt-2 text-sm font-medium text-rose-500">{message}</p>
    ) : null;
}

function SectionHeader({ eyebrow, title, description, icon: Icon }) {
    return (
        <div className="mb-5 flex items-start justify-between gap-4">
            <div>
                {eyebrow ? (
                    <p className="text-xs font-semibold tracking-[0.18em] text-[#0A6474] uppercase dark:text-cyan-200">
                        {eyebrow}
                    </p>
                ) : null}
                <h2 className="mt-1 text-xl font-semibold text-[#061F39] dark:text-white">
                    {title}
                </h2>
                {description ? (
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {description}
                    </p>
                ) : null}
            </div>
            {Icon ? (
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#0A6474]/10 text-[#0A6474] dark:bg-cyan-200/10 dark:text-cyan-100">
                    <Icon className="h-5 w-5" />
                </span>
            ) : null}
        </div>
    );
}

function MetricCard({ icon: Icon, label, value, helper, variant = 'light' }) {
    const isDark = variant === 'dark';

    return (
        <motion.div
            className={`bills-reveal relative overflow-hidden rounded-2xl border p-5 ${
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

            <div className="relative flex items-start gap-4">
                <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                        isDark
                            ? 'bg-white/10 text-[#D4A23C]'
                            : 'bg-[#0A6474]/10 text-[#0A6474] dark:bg-[#0A6474]/20 dark:text-cyan-200'
                    }`}
                >
                    <Icon className="h-5 w-5" />
                </span>
                <div>
                    <p
                        className={`text-sm ${
                            isDark
                                ? 'text-white/65'
                                : 'text-slate-500 dark:text-slate-400'
                        }`}
                    >
                        {label}
                    </p>
                    <p className="mt-2 text-2xl font-semibold tracking-tight">
                        {value}
                    </p>
                    {helper ? (
                        <p
                            className={`mt-1 text-sm ${
                                isDark
                                    ? 'text-white/55'
                                    : 'text-slate-500 dark:text-slate-400'
                            }`}
                        >
                            {helper}
                        </p>
                    ) : null}
                </div>
            </div>
        </motion.div>
    );
}

function TextInput({
    label,
    value,
    onChange,
    error,
    type = 'text',
    placeholder,
    className = '',
    ...props
}) {
    return (
        <label className={`block ${className}`}>
            <span className="text-sm font-semibold text-[#061F39] dark:text-white">
                {label}
            </span>
            <input
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="mt-2 h-12 w-full rounded-xl border border-[#D1D9DA] bg-white px-3 text-sm font-semibold text-[#061F39] shadow-sm transition outline-none placeholder:text-slate-400 focus:border-[#D4A23C] focus:ring-4 focus:ring-[#D4A23C]/15 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:placeholder:text-slate-500 dark:focus:border-[#D4A23C]"
                {...props}
            />
            <FieldError message={error} />
        </label>
    );
}

function SelectInput({ label, value, onChange, error, children, className = '' }) {
    return (
        <label className={`block ${className}`}>
            <span className="text-sm font-semibold text-[#061F39] dark:text-white">
                {label}
            </span>
            <select
                value={value}
                onChange={onChange}
                className="mt-2 h-12 w-full rounded-xl border border-[#D1D9DA] bg-white px-3 text-sm font-semibold text-[#061F39] shadow-sm transition outline-none focus:border-[#D4A23C] focus:ring-4 focus:ring-[#D4A23C]/15 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:focus:border-[#D4A23C]"
            >
                {children}
            </select>
            <FieldError message={error} />
        </label>
    );
}

function EmptyPanel({ title, message, icon: Icon = ReceiptText }) {
    return (
        <div className="rounded-2xl border border-dashed border-[#D1D9DA] bg-[#F7F8FA] px-6 py-12 text-center dark:border-white/10 dark:bg-white/[0.035]">
            <Icon className="mx-auto mb-3 h-9 w-9 text-[#0A6474] dark:text-cyan-200" />
            <h3 className="font-semibold text-[#061F39] dark:text-white">
                {title}
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                {message}
            </p>
        </div>
    );
}

export default function BillsCenter({
    accounts = [],
    bills = [],
    overview = {},
    paymentHistory = [],
    categories = [],
    frequencies = [],
}) {
    const pageRef = useRef(null);
    const { props } = usePage();
    const flash = props.flash || {};
    const [editingBill, setEditingBill] = useState(null);
    const [historyBill, setHistoryBill] = useState(null);
    const [billError, setBillError] = useState('');

    const defaultAccountId = accounts[0]?.id ? String(accounts[0].id) : '';
    const form = useForm({
        bank_account_id: defaultAccountId,
        label: '',
        category: 'internet',
        provider_name: '',
        reference_number: '',
        amount: '',
        frequency: 'monthly',
        next_due_at: fieldDateValue(new Date()),
        autopay_enabled: false,
        minimum_balance_after_payment: '300',
    });

    const upcomingBills = useMemo(
        () =>
            bills
                .filter((bill) => bill.status === 'active')
                .sort(
                    (a, b) => new Date(a.next_due_at) - new Date(b.next_due_at),
                )
                .slice(0, 4),
        [bills],
    );

    const selectedAccount = accounts.find(
        (account) => String(account.id) === String(form.data.bank_account_id),
    );

    const totalUpcomingAmount = upcomingBills.reduce(
        (total, bill) => total + Number(bill.amount || 0),
        0,
    );

    const autopayBills = bills.filter((bill) => bill.autopay_enabled).length;

    const riskBills = bills.filter((bill) => {
        const account = accounts.find(
            (item) => String(item.id) === String(bill.bank_account_id),
        );

        return (
            Number(bill.amount) +
                Number(bill.minimum_balance_after_payment || 0) >
            Number(account?.balance ?? 0)
        );
    });

    useEffect(() => {
        if (props.errors?.bill) {
            setBillError(props.errors.bill);
        }
    }, [props.errors?.bill]);

    const resetForm = () => {
        setEditingBill(null);
        form.setData({
            bank_account_id: defaultAccountId,
            label: '',
            category: 'internet',
            provider_name: '',
            reference_number: '',
            amount: '',
            frequency: 'monthly',
            next_due_at: fieldDateValue(new Date()),
            autopay_enabled: false,
            minimum_balance_after_payment: '300',
        });
        form.clearErrors();
    };

    const editBill = (bill) => {
        setEditingBill(bill);
        form.setData({
            bank_account_id: String(bill.bank_account_id),
            label: bill.label,
            category: bill.category,
            provider_name: bill.provider_name,
            reference_number: bill.reference_number,
            amount: String(bill.amount),
            frequency: bill.frequency,
            next_due_at: fieldDateValue(bill.next_due_at),
            autopay_enabled: Boolean(bill.autopay_enabled),
            minimum_balance_after_payment: String(
                bill.minimum_balance_after_payment ?? 0,
            ),
        });
        form.clearErrors();

        if (typeof window !== 'undefined') {
            window.setTimeout(() => {
                document
                    .getElementById('bill-editor')
                    ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 60);
        }
    };

    const submit = (event) => {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: resetForm,
        };

        if (editingBill) {
            form.patch(`/backend/customer/bills/${editingBill.id}`, options);
            return;
        }

        form.post('/backend/customer/bills', options);
    };

    const payNow = (bill) => {
        router.post(
            `/backend/customer/bills/${bill.id}/pay-now`,
            {},
            { preserveScroll: true },
        );
    };

    const toggleAutopay = (bill) => {
        router.patch(
            `/backend/customer/bills/${bill.id}/toggle-autopay`,
            {},
            { preserveScroll: true },
        );
    };

    const deleteBill = (bill) => {
        router.delete(`/backend/customer/bills/${bill.id}`, {
            preserveScroll: true,
        });
    };

    useEffect(() => {
        if (!pageRef.current) {
            return undefined;
        }

        const context = gsap.context(() => {
            gsap.fromTo(
                '.bills-reveal',
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
                '.bill-row',
                { autoAlpha: 0, y: 12 },
                {
                    autoAlpha: 1,
                    y: 0,
                    duration: 0.45,
                    stagger: 0.045,
                    delay: 0.2,
                    ease: 'power2.out',
                },
            );

            gsap.to('.bills-orb', {
                x: 18,
                y: -12,
                scale: 1.08,
                duration: 5.2,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut',
            });

            gsap.to('.autopay-pulse', {
                boxShadow:
                    '0 0 0 8px rgba(212,162,60,0.02), 0 0 38px rgba(212,162,60,0.24)',
                duration: 1.8,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut',
            });
        }, pageRef);

        return () => context.revert();
    }, []);

    return (
        <>
            <Head title="Bills & AutoPay" />
            <CimFeedbackModal
                open={Boolean(billError)}
                type="error"
                title="Payment could not be completed"
                message={billError}
                confirmLabel="Close"
                onClose={() => setBillError('')}
            />

            <main
                ref={pageRef}
                className="relative min-h-full overflow-hidden bg-[#F7F8FA] px-4 py-6 text-[#061F39] sm:px-6 lg:px-8 dark:bg-[#061F39]"
            >
                <div className="bills-orb pointer-events-none absolute -top-28 right-10 h-72 w-72 rounded-full bg-[#0A6474]/15 blur-3xl dark:bg-[#0A6474]/25" />
                <div className="bills-orb pointer-events-none absolute top-96 -left-24 h-72 w-72 rounded-full bg-[#D4A23C]/10 blur-3xl dark:bg-[#D4A23C]/15" />

                <div className="relative mx-auto flex max-w-7xl flex-col gap-6">
                    <section className="bills-reveal relative overflow-hidden rounded-[2rem] border border-[#D1D9DA]/75 bg-white p-6 shadow-[0_24px_70px_rgba(6,31,57,0.08)] dark:border-white/10 dark:bg-white/[0.055] dark:shadow-[0_24px_80px_rgba(0,0,0,0.22)] lg:p-8">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_14%,rgba(212,162,60,0.18),transparent_30%),radial-gradient(circle_at_85%_18%,rgba(10,100,116,0.16),transparent_34%)] dark:bg-[radial-gradient(circle_at_16%_14%,rgba(212,162,60,0.16),transparent_30%),radial-gradient(circle_at_85%_18%,rgba(10,100,116,0.22),transparent_34%)]" />

                        <div className="relative grid gap-8 lg:grid-cols-[1fr_400px] lg:items-center">
                            <div>
                                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#D4A23C]/30 bg-[#D4A23C]/10 px-3 py-1 text-xs font-semibold tracking-[0.16em] text-[#082F54] uppercase dark:text-[#F5D58C]">
                                    <Zap className="h-3.5 w-3.5" />
                                    Mizan AutoPay
                                </div>

                                <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-[#061F39] dark:text-white sm:text-4xl lg:text-5xl">
                                    Bills protected before they become problems.
                                </h1>

                                <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-300">
                                    Manage demo providers, track upcoming due
                                    dates, pay bills manually, and protect your
                                    minimum balance before AutoPay runs.
                                </p>

                                <div className="mt-6 flex flex-wrap gap-3">
                                    <Link
                                        href="/dashboard"
                                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#D1D9DA] bg-white px-4 text-sm font-semibold text-[#082F54] shadow-sm transition hover:-translate-y-0.5 hover:border-[#D4A23C] hover:shadow-md dark:border-white/10 dark:bg-white/10 dark:text-white"
                                    >
                                        <ReceiptText className="h-4 w-4" />
                                        Back to dashboard
                                    </Link>
                                    <span className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#0A6474]/20 bg-[#0A6474]/10 px-4 text-sm font-semibold text-[#0A6474] dark:border-cyan-200/10 dark:bg-cyan-200/10 dark:text-cyan-100">
                                        <Sparkles className="h-4 w-4" />
                                        {autopayBills} AutoPay active
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
                                                Upcoming amount
                                            </p>
                                            <p className="mt-2 text-3xl font-semibold">
                                                {formatCurrency(totalUpcomingAmount)}
                                            </p>
                                        </div>
                                        <span className="autopay-pulse flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-[#D4A23C]">
                                            <BellRing className="h-5 w-5" />
                                        </span>
                                    </div>

                                    <div className="mt-6 space-y-3">
                                        {upcomingBills.length ? (
                                            upcomingBills.slice(0, 3).map((bill) => (
                                                <div
                                                    key={bill.id}
                                                    className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur"
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div>
                                                            <p className="font-semibold">
                                                                {bill.label}
                                                            </p>
                                                            <p className="mt-1 text-xs text-white/55">
                                                                {formatDateTime(
                                                                    bill.next_due_at,
                                                                )}
                                                            </p>
                                                        </div>
                                                        <p className="font-semibold text-[#D4A23C]">
                                                            {formatCurrency(
                                                                bill.amount,
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm text-white/70 backdrop-blur">
                                                No upcoming active bills yet.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                        <MetricCard
                            icon={ReceiptText}
                            label="Total bills"
                            value={overview.total_bills ?? 0}
                            helper="tracked services"
                            variant="dark"
                        />
                        <MetricCard
                            icon={CalendarClock}
                            label="Upcoming"
                            value={overview.upcoming_bills ?? 0}
                            helper={formatCurrency(totalUpcomingAmount)}
                        />
                        <MetricCard
                            icon={ShieldCheck}
                            label="AutoPay active"
                            value={overview.autopay_active ?? 0}
                            helper="protected payments"
                        />
                        <MetricCard
                            icon={CheckCircle2}
                            label="Paid this month"
                            value={overview.paid_this_month ?? 0}
                            helper="successful payments"
                        />
                        <MetricCard
                            icon={AlertTriangle}
                            label="Failed / skipped"
                            value={overview.failed_or_skipped ?? 0}
                            helper={`${riskBills.length} balance alerts`}
                        />
                    </section>

                    <section className="grid gap-5 xl:grid-cols-[0.96fr_1.04fr]">
                        <motion.form
                            id="bill-editor"
                            onSubmit={submit}
                            className="bills-reveal rounded-[1.6rem] border border-[#D1D9DA]/75 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.055] lg:p-6"
                            whileHover={{ y: -2 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-xs font-semibold tracking-[0.18em] text-[#0A6474] uppercase dark:text-cyan-200">
                                        Bill manager
                                    </p>
                                    <h2 className="mt-1 text-xl font-semibold text-[#061F39] dark:text-white">
                                        {editingBill
                                            ? 'Edit bill'
                                            : 'Add bill / subscription'}
                                    </h2>
                                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                        Demo providers only. No external provider
                                        API is called.
                                    </p>
                                </div>
                                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#082F54] text-white shadow-lg shadow-[#082F54]/15 dark:bg-[#0A6474]">
                                    <Plus className="h-5 w-5" />
                                </span>
                            </div>

                            <div className="mt-6 grid gap-4 sm:grid-cols-2">
                                <TextInput
                                    label="Bill label"
                                    value={form.data.label}
                                    onChange={(event) =>
                                        form.setData('label', event.target.value)
                                    }
                                    placeholder="Home WiFi"
                                    error={form.errors.label}
                                />

                                <TextInput
                                    label="Provider name"
                                    value={form.data.provider_name}
                                    onChange={(event) =>
                                        form.setData(
                                            'provider_name',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Inwi, Orange, Lydec, School"
                                    error={form.errors.provider_name}
                                />

                                <SelectInput
                                    label="Category"
                                    value={form.data.category}
                                    onChange={(event) =>
                                        form.setData('category', event.target.value)
                                    }
                                    error={form.errors.category}
                                >
                                    {categories.map((category) => (
                                        <option key={category} value={category}>
                                            {categoryLabels[category] ||
                                                titleCase(category)}
                                        </option>
                                    ))}
                                </SelectInput>

                                <TextInput
                                    label="Reference number"
                                    value={form.data.reference_number}
                                    onChange={(event) =>
                                        form.setData(
                                            'reference_number',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="INV-2026-001"
                                    error={form.errors.reference_number}
                                />

                                <SelectInput
                                    label="Account"
                                    value={form.data.bank_account_id}
                                    onChange={(event) =>
                                        form.setData(
                                            'bank_account_id',
                                            event.target.value,
                                        )
                                    }
                                    error={form.errors.bank_account_id}
                                >
                                    {accounts.length ? (
                                        accounts.map((account) => (
                                            <option
                                                key={account.id}
                                                value={account.id}
                                            >
                                                {account.account_number} -{' '}
                                                {formatCurrency(
                                                    account.balance,
                                                    account.currency,
                                                )}
                                            </option>
                                        ))
                                    ) : (
                                        <option value="">No account available</option>
                                    )}
                                </SelectInput>

                                <TextInput
                                    label="Amount"
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={form.data.amount}
                                    onChange={(event) =>
                                        form.setData('amount', event.target.value)
                                    }
                                    placeholder="0.00"
                                    error={form.errors.amount}
                                />

                                <SelectInput
                                    label="Frequency"
                                    value={form.data.frequency}
                                    onChange={(event) =>
                                        form.setData(
                                            'frequency',
                                            event.target.value,
                                        )
                                    }
                                    error={form.errors.frequency}
                                >
                                    {frequencies.map((frequency) => (
                                        <option key={frequency} value={frequency}>
                                            {frequencyLabels[frequency] ||
                                                titleCase(frequency)}
                                        </option>
                                    ))}
                                </SelectInput>

                                <TextInput
                                    label="Next due date"
                                    type="datetime-local"
                                    value={form.data.next_due_at}
                                    onChange={(event) =>
                                        form.setData(
                                            'next_due_at',
                                            event.target.value,
                                        )
                                    }
                                    error={form.errors.next_due_at}
                                />

                                <TextInput
                                    label="Minimum balance after payment"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={form.data.minimum_balance_after_payment}
                                    onChange={(event) =>
                                        form.setData(
                                            'minimum_balance_after_payment',
                                            event.target.value,
                                        )
                                    }
                                    error={
                                        form.errors
                                            .minimum_balance_after_payment
                                    }
                                />

                                <label className="flex items-center justify-between gap-3 rounded-2xl border border-[#D1D9DA] bg-[#F7F8FA] px-4 py-3 dark:border-white/10 dark:bg-white/[0.04] sm:mt-7">
                                    <span>
                                        <span className="block text-sm font-semibold text-[#061F39] dark:text-white">
                                            AutoPay enabled
                                        </span>
                                        <span className="text-xs text-slate-500 dark:text-slate-400">
                                            Reminder is sent before automatic
                                            payment.
                                        </span>
                                    </span>
                                    <input
                                        type="checkbox"
                                        checked={form.data.autopay_enabled}
                                        onChange={(event) =>
                                            form.setData(
                                                'autopay_enabled',
                                                event.target.checked,
                                            )
                                        }
                                        className="h-5 w-5 rounded border-[#D1D9DA] text-[#082F54] focus:ring-[#0A6474] dark:border-white/10"
                                    />
                                </label>
                            </div>

                            {selectedAccount ? (
                                <div className="mt-5 rounded-2xl border border-[#D4A23C]/40 bg-[#D4A23C]/10 p-4 text-sm text-[#061F39] dark:text-[#F5D58C]">
                                    Selected balance:{' '}
                                    <strong>
                                        {formatCurrency(
                                            selectedAccount.balance,
                                            selectedAccount.currency,
                                        )}
                                    </strong>
                                    . AutoPay will skip if the protected minimum
                                    would be breached.
                                </div>
                            ) : null}

                            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                                <motion.button
                                    type="submit"
                                    disabled={form.processing || !accounts.length}
                                    className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#082F54] px-4 text-sm font-semibold text-white shadow-lg shadow-[#082F54]/15 transition hover:bg-[#061F39] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#0A6474] dark:hover:bg-[#0b788d]"
                                    whileHover={{ y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <ReceiptText className="h-4 w-4" />
                                    {form.processing
                                        ? 'Saving'
                                        : editingBill
                                          ? 'Save bill'
                                          : 'Add bill'}
                                </motion.button>
                                {editingBill ? (
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="inline-flex h-12 items-center justify-center rounded-xl border border-[#D1D9DA] bg-white px-4 text-sm font-semibold text-[#082F54] transition hover:border-[#D4A23C] dark:border-white/10 dark:bg-white/10 dark:text-white"
                                    >
                                        Cancel edit
                                    </button>
                                ) : null}
                            </div>
                        </motion.form>

                        <section className="bills-reveal rounded-[1.6rem] border border-[#D1D9DA]/75 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.055] lg:p-6">
                            <SectionHeader
                                eyebrow="Timeline"
                                title="Upcoming payment timeline"
                                description="Next active bills by due date."
                                icon={Clock3}
                            />
                            <div className="space-y-3">
                                {upcomingBills.length ? (
                                    upcomingBills.map((bill) => (
                                        <motion.article
                                            key={bill.id}
                                            className="bill-row rounded-2xl border border-[#D1D9DA] bg-[#F7F8FA] p-4 transition dark:border-white/10 dark:bg-white/[0.04]"
                                            whileHover={{ x: 4 }}
                                            transition={{ duration: 0.18 }}
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <p className="font-semibold text-[#061F39] dark:text-white">
                                                        {bill.label}
                                                    </p>
                                                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                                        {bill.provider_name} ·{' '}
                                                        {formatDateTime(
                                                            bill.next_due_at,
                                                        )}
                                                    </p>
                                                </div>
                                                <p className="font-semibold text-[#082F54] dark:text-[#D4A23C]">
                                                    {formatCurrency(bill.amount)}
                                                </p>
                                            </div>
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                <StatusBadge
                                                    status={
                                                        bill.autopay_enabled
                                                            ? 'active'
                                                            : 'paused'
                                                    }
                                                />
                                                <span className="rounded-full border border-[#D1D9DA] bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-slate-300">
                                                    {frequencyLabels[
                                                        bill.frequency
                                                    ] ||
                                                        titleCase(
                                                            bill.frequency,
                                                        )}
                                                </span>
                                            </div>
                                        </motion.article>
                                    ))
                                ) : (
                                    <EmptyPanel
                                        title="No upcoming bills"
                                        message="Add a bill to start tracking due dates."
                                    />
                                )}
                            </div>
                        </section>
                    </section>

                    <section className="grid gap-4 xl:grid-cols-2">
                        {bills.length ? (
                            bills.map((bill) => {
                                const account = accounts.find(
                                    (item) =>
                                        String(item.id) ===
                                        String(bill.bank_account_id),
                                );
                                const hasBalanceRisk =
                                    Number(bill.amount) +
                                        Number(
                                            bill.minimum_balance_after_payment,
                                        ) >
                                    Number(account?.balance ?? 0);

                                return (
                                    <motion.article
                                        key={bill.id}
                                        className="bills-reveal rounded-[1.6rem] border border-[#D1D9DA]/75 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.055]"
                                        whileHover={{ y: -3 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h2 className="text-lg font-semibold text-[#061F39] dark:text-white">
                                                        {bill.label}
                                                    </h2>
                                                    <StatusBadge
                                                        status={bill.status}
                                                    />
                                                </div>
                                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                                    {bill.provider_name} ·{' '}
                                                    {categoryLabels[
                                                        bill.category
                                                    ] || titleCase(bill.category)}{' '}
                                                    · Ref {bill.reference_number}
                                                </p>
                                            </div>
                                            <div className="text-left sm:text-right">
                                                <p className="text-2xl font-semibold text-[#082F54] dark:text-[#D4A23C]">
                                                    {formatCurrency(bill.amount)}
                                                </p>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                                    Due{' '}
                                                    {formatDateTime(
                                                        bill.next_due_at,
                                                    )}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-4 grid gap-3 sm:grid-cols-4">
                                            {[
                                                [
                                                    'Frequency',
                                                    frequencyLabels[
                                                        bill.frequency
                                                    ] ||
                                                        titleCase(
                                                            bill.frequency,
                                                        ),
                                                ],
                                                [
                                                    'AutoPay',
                                                    bill.autopay_enabled
                                                        ? 'On'
                                                        : 'Off',
                                                ],
                                                [
                                                    'Reminder',
                                                    bill.reminder_sent_at
                                                        ? 'Sent'
                                                        : 'Pending',
                                                ],
                                                [
                                                    'Last payment',
                                                    bill.last_payment_status
                                                        ? titleCase(
                                                              bill.last_payment_status,
                                                          )
                                                        : 'None',
                                                ],
                                            ].map(([label, value]) => (
                                                <div
                                                    key={label}
                                                    className="rounded-2xl bg-[#F7F8FA] p-3 dark:bg-white/[0.04]"
                                                >
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                                        {label}
                                                    </p>
                                                    <p className="mt-1 text-sm font-semibold text-[#061F39] dark:text-white">
                                                        {value}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>

                                        {hasBalanceRisk ? (
                                            <div className="mt-4 flex items-start gap-2 rounded-2xl border border-amber-300/30 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-200">
                                                <AlertTriangle className="mt-0.5 h-4 w-4" />
                                                <span>
                                                    Balance may be too low after
                                                    applying the protected minimum.
                                                </span>
                                            </div>
                                        ) : null}

                                        <div className="mt-4 flex flex-wrap gap-2">
                                            <button
                                                type="button"
                                                onClick={() => payNow(bill)}
                                                disabled={bill.status !== 'active'}
                                                className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#082F54] px-3 text-sm font-semibold text-white transition hover:bg-[#061F39] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#0A6474]"
                                            >
                                                <CreditCard className="h-4 w-4" />
                                                Pay now
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => toggleAutopay(bill)}
                                                disabled={bill.status !== 'active'}
                                                className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#D1D9DA] bg-white px-3 text-sm font-semibold text-[#082F54] transition hover:border-[#D4A23C] disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/10 dark:text-white"
                                            >
                                                <Zap className="h-4 w-4" />
                                                {bill.autopay_enabled
                                                    ? 'Disable AutoPay'
                                                    : 'Enable AutoPay'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => editBill(bill)}
                                                className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#D1D9DA] bg-white px-3 text-sm font-semibold text-[#082F54] transition hover:border-[#D4A23C] dark:border-white/10 dark:bg-white/10 dark:text-white"
                                            >
                                                <Pencil className="h-4 w-4" />
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setHistoryBill(
                                                        historyBill?.id === bill.id
                                                            ? null
                                                            : bill,
                                                    )
                                                }
                                                className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#D1D9DA] bg-white px-3 text-sm font-semibold text-[#082F54] transition hover:border-[#D4A23C] dark:border-white/10 dark:bg-white/10 dark:text-white"
                                            >
                                                <History className="h-4 w-4" />
                                                History
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => deleteBill(bill)}
                                                className="inline-flex h-10 items-center gap-2 rounded-xl border border-rose-200 bg-white px-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 dark:border-rose-300/20 dark:bg-rose-300/10 dark:text-rose-200"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                Delete / cancel
                                            </button>
                                        </div>

                                        {historyBill?.id === bill.id ? (
                                            <motion.div
                                                className="mt-4 divide-y divide-[#D1D9DA] rounded-2xl border border-[#D1D9DA] dark:divide-white/10 dark:border-white/10"
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                            >
                                                {bill.payments?.length ? (
                                                    bill.payments.map((payment) => (
                                                        <div
                                                            key={payment.id}
                                                            className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between"
                                                        >
                                                            <div>
                                                                <p className="font-semibold text-[#061F39] dark:text-white">
                                                                    {
                                                                        payment.reference
                                                                    }
                                                                </p>
                                                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                                                    {payment.failure_reason ||
                                                                        formatDateTime(
                                                                            payment.paid_at ||
                                                                                payment.created_at,
                                                                        )}
                                                                </p>
                                                            </div>
                                                            <div className="flex items-center justify-between gap-3 sm:justify-end">
                                                                <p className="font-semibold text-[#061F39] dark:text-white">
                                                                    {formatCurrency(
                                                                        payment.amount,
                                                                    )}
                                                                </p>
                                                                <StatusBadge
                                                                    status={
                                                                        payment.status
                                                                    }
                                                                />
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="p-3 text-sm text-slate-500 dark:text-slate-400">
                                                        No payments yet.
                                                    </p>
                                                )}
                                            </motion.div>
                                        ) : null}
                                    </motion.article>
                                );
                            })
                        ) : (
                            <div className="bills-reveal xl:col-span-2">
                                <EmptyPanel
                                    title="No bills configured"
                                    message="Create your first bill to track due dates and AutoPay protection."
                                    icon={Plus}
                                />
                            </div>
                        )}
                    </section>

                    <section className="bills-reveal rounded-[1.6rem] border border-[#D1D9DA]/75 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.055] lg:p-6">
                        <SectionHeader
                            eyebrow="Receipts"
                            title="Payment history"
                            description="Manual and AutoPay receipts appear here."
                            icon={History}
                        />

                        <div className="divide-y divide-[#D1D9DA] dark:divide-white/10">
                            {paymentHistory.length ? (
                                paymentHistory.map((payment) => (
                                    <motion.div
                                        key={payment.id}
                                        className="bill-row flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                                        whileHover={{ x: 4 }}
                                        transition={{ duration: 0.18 }}
                                    >
                                        <div className="flex items-start gap-3">
                                            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0A6474]/10 text-[#0A6474] dark:bg-cyan-200/10 dark:text-cyan-100">
                                                <ReceiptText className="h-5 w-5" />
                                            </span>
                                            <div>
                                                <p className="font-semibold text-[#061F39] dark:text-white">
                                                    {payment.bill_label}
                                                </p>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                                    {payment.provider_name} ·{' '}
                                                    {payment.reference}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between gap-4 sm:justify-end">
                                            <p className="font-semibold text-[#061F39] dark:text-white">
                                                {formatCurrency(payment.amount)}
                                            </p>
                                            <StatusBadge status={payment.status} />
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <EmptyPanel
                                    title="No bill payments yet"
                                    message="Manual and AutoPay receipts will appear here."
                                />
                            )}
                        </div>
                    </section>

                    <section className="bills-reveal grid gap-4 rounded-[1.6rem] border border-[#D1D9DA]/75 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.055] md:grid-cols-3">
                        <div className="flex items-start gap-3">
                            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0A6474]/10 text-[#0A6474] dark:bg-cyan-200/10 dark:text-cyan-100">
                                <ShieldCheck className="h-5 w-5" />
                            </span>
                            <div>
                                <h3 className="font-semibold text-[#061F39] dark:text-white">
                                    Protected balance
                                </h3>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    AutoPay skips when minimum balance rules are
                                    at risk.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#D4A23C]/15 text-[#D4A23C]">
                                <BellRing className="h-5 w-5" />
                            </span>
                            <div>
                                <h3 className="font-semibold text-[#061F39] dark:text-white">
                                    Reminder-first flow
                                </h3>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    The experience feels safe before automatic
                                    payments happen.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#082F54]/10 text-[#082F54] dark:bg-white/10 dark:text-white">
                                <ArrowRight className="h-5 w-5" />
                            </span>
                            <div>
                                <h3 className="font-semibold text-[#061F39] dark:text-white">
                                    Quick actions
                                </h3>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    Pay, edit, pause AutoPay, and inspect payment
                                    history from one place.
                                </p>
                            </div>
                        </div>
                    </section>
                </div>
            </main>
        </>
    );
}
