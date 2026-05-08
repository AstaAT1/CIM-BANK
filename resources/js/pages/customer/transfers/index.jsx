import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { gsap } from 'gsap';
import {
    ArrowDownLeft,
    ArrowRight,
    ArrowUpRight,
    Banknote,
    CheckCircle2,
    CircleAlert,
    Clock3,
    Landmark,
    LockKeyhole,
    ReceiptText,
    Send,
    ShieldCheck,
    Sparkles,
    UserRoundCheck,
    WalletCards,
    XCircle,
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

function formatCurrency(amount, currency = 'MAD') {
    return new Intl.NumberFormat('en-MA', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number(amount || 0));
}

function formatDate(value) {
    if (!value) return 'Pending';

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

function FieldError({ message }) {
    return message ? (
        <p className="mt-2 text-sm font-medium text-rose-500">{message}</p>
    ) : null;
}

function StatusBadge({ status }) {
    const normalized = String(status || 'unknown').toLowerCase();

    const styles = {
        completed:
            'border-emerald-400/25 bg-emerald-500/10 text-emerald-600 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300',
        active:
            'border-emerald-400/25 bg-emerald-500/10 text-emerald-600 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300',
        pending:
            'border-amber-400/30 bg-amber-500/10 text-amber-700 dark:border-amber-300/25 dark:bg-amber-300/10 dark:text-amber-200',
        rejected:
            'border-rose-400/25 bg-rose-500/10 text-rose-600 dark:border-rose-300/25 dark:bg-rose-400/10 dark:text-rose-200',
        failed:
            'border-rose-400/25 bg-rose-500/10 text-rose-600 dark:border-rose-300/25 dark:bg-rose-400/10 dark:text-rose-200',
    };

    const Icon =
        normalized === 'active' || normalized === 'completed'
            ? CheckCircle2
            : normalized === 'rejected' || normalized === 'failed'
              ? XCircle
              : Clock3;

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${styles[normalized] ?? 'border-slate-200 bg-white text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300'}`}
        >
            <Icon className="h-3.5 w-3.5" />
            {titleCase(normalized)}
        </span>
    );
}

function MetricCard({ icon: Icon, label, value, helper, variant = 'light' }) {
    const darkCard =
        variant === 'dark'
            ? 'border-white/10 bg-[#061F39] text-white shadow-[0_22px_65px_rgba(6,31,57,0.22)] dark:border-white/10 dark:bg-white/[0.06]'
            : 'border-[#D1D9DA]/75 bg-white text-[#061F39] shadow-sm dark:border-white/10 dark:bg-white/[0.055] dark:text-white';

    return (
        <motion.div
            className={`transfer-reveal relative overflow-hidden rounded-2xl border p-5 ${darkCard}`}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
        >
            {variant === 'dark' ? (
                <>
                    <div className="pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full bg-[#0A6474]/35 blur-2xl" />
                    <div className="pointer-events-none absolute right-8 -bottom-14 h-28 w-28 rounded-full bg-[#D4A23C]/20 blur-2xl" />
                </>
            ) : null}

            <div className="relative flex items-start gap-4">
                <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                        variant === 'dark'
                            ? 'bg-white/10 text-[#D4A23C]'
                            : 'bg-[#0A6474]/10 text-[#0A6474] dark:bg-[#0A6474]/20 dark:text-cyan-200'
                    }`}
                >
                    <Icon className="h-5 w-5" />
                </span>
                <div>
                    <p
                        className={`text-sm ${
                            variant === 'dark'
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
                                variant === 'dark'
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

function SelectField({ label, value, onChange, children, error, disabled = false }) {
    return (
        <label className="block">
            <span className="text-sm font-semibold text-[#061F39] dark:text-white">
                {label}
            </span>
            <select
                value={value}
                onChange={onChange}
                disabled={disabled}
                className="mt-2 h-12 w-full rounded-xl border border-[#D1D9DA] bg-white px-3 text-sm font-semibold text-[#061F39] shadow-sm transition outline-none focus:border-[#D4A23C] focus:ring-4 focus:ring-[#D4A23C]/15 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:focus:border-[#D4A23C]"
            >
                {children}
            </select>
            <FieldError message={error} />
        </label>
    );
}

function TextInput({ label, value, onChange, error, type = 'text', placeholder, ...props }) {
    return (
        <label className="block">
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

function EmptyState() {
    return (
        <div className="rounded-2xl border border-dashed border-[#D1D9DA] bg-[#F7F8FA] px-6 py-12 text-center dark:border-white/10 dark:bg-white/[0.035]">
            <ReceiptText className="mx-auto mb-3 h-9 w-9 text-[#0A6474] dark:text-cyan-200" />
            <h3 className="font-semibold text-[#061F39] dark:text-white">
                No transfers yet
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                Completed internal transfers will appear here with their amount,
                reference, and status.
            </p>
        </div>
    );
}

export default function Transfers({
    accounts = [],
    beneficiaries = [],
    recentTransfers = [],
}) {
    const pageRef = useRef(null);
    const { props } = usePage();
    const flash = props.flash || {};
    const activeBeneficiaries = beneficiaries.filter(
        (beneficiary) => beneficiary.transfers_available,
    );

    const queryPrefill = useMemo(() => {
        if (typeof window === 'undefined') {
            return { amount: '', beneficiaryId: '' };
        }

        const params = new URLSearchParams(window.location.search);
        const amount = params.get('amount') || '';
        const beneficiaryName = (params.get('beneficiary') || '')
            .toLowerCase()
            .trim();
        const matchedBeneficiary = beneficiaryName
            ? activeBeneficiaries.find((beneficiary) =>
                  String(beneficiary.full_name || '')
                      .toLowerCase()
                      .includes(beneficiaryName),
              )
            : null;

        return {
            amount: /^\d+(\.\d{1,2})?$/.test(amount) ? amount : '',
            beneficiaryId: matchedBeneficiary?.id
                ? String(matchedBeneficiary.id)
                : '',
        };
    }, [activeBeneficiaries]);

    const [confirming, setConfirming] = useState(false);

    const form = useForm({
        from_account_id: accounts[0]?.id ? String(accounts[0].id) : '',
        beneficiary_id:
            queryPrefill.beneficiaryId ||
            (activeBeneficiaries[0]?.id
                ? String(activeBeneficiaries[0].id)
                : ''),
        amount: queryPrefill.amount,
        note: '',
    });

    const selectedAccount = useMemo(
        () =>
            accounts.find(
                (account) =>
                    String(account.id) === String(form.data.from_account_id),
            ),
        [accounts, form.data.from_account_id],
    );

    const selectedBeneficiary = useMemo(
        () =>
            beneficiaries.find(
                (beneficiary) =>
                    String(beneficiary.id) === String(form.data.beneficiary_id),
            ),
        [beneficiaries, form.data.beneficiary_id],
    );

    const amount = Number(form.data.amount || 0);
    const balanceAfter = selectedAccount
        ? Number(selectedAccount.balance) - amount
        : 0;
    const insufficientBalance = selectedAccount && amount > Number(selectedAccount.balance);

    const completedTransfers = recentTransfers.filter(
        (transfer) => String(transfer.status).toLowerCase() === 'completed',
    ).length;

    const totalMoved = recentTransfers.reduce(
        (total, transfer) => total + Number(transfer.amount || 0),
        0,
    );

    useEffect(() => {
        if (!pageRef.current) {
            return undefined;
        }

        const context = gsap.context(() => {
            gsap.fromTo(
                '.transfer-reveal',
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
                '.transfer-row',
                { autoAlpha: 0, x: -14 },
                {
                    autoAlpha: 1,
                    x: 0,
                    duration: 0.48,
                    stagger: 0.05,
                    delay: 0.25,
                    ease: 'power2.out',
                },
            );

            gsap.to('.transfer-orb', {
                x: 18,
                y: -14,
                scale: 1.08,
                duration: 5,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut',
            });

            gsap.to('.transfer-path', {
                strokeDashoffset: 0,
                duration: 1.4,
                ease: 'power2.out',
                delay: 0.35,
            });
        }, pageRef);

        return () => context.revert();
    }, []);

    const submit = (event) => {
        event.preventDefault();

        if (!confirming) {
            setConfirming(true);
            return;
        }

        form.post('/backend/customer/transfers', {
            preserveScroll: true,
            onSuccess: () => {
                form.reset('amount', 'note');
                setConfirming(false);
            },
            onError: () => setConfirming(false),
        });
    };

    return (
        <>
            <Head title="Transfers" />

            <main
                ref={pageRef}
                className="relative min-h-full overflow-hidden bg-[#F7F8FA] px-4 py-6 text-[#061F39] sm:px-6 lg:px-8 dark:bg-[#061F39]"
            >
                <div className="transfer-orb pointer-events-none absolute -top-28 right-10 h-72 w-72 rounded-full bg-[#0A6474]/15 blur-3xl dark:bg-[#0A6474]/25" />
                <div className="transfer-orb pointer-events-none absolute top-80 -left-24 h-72 w-72 rounded-full bg-[#D4A23C]/10 blur-3xl dark:bg-[#D4A23C]/15" />

                <div className="relative mx-auto flex max-w-7xl flex-col gap-6">
                    <section className="transfer-reveal relative overflow-hidden rounded-[2rem] border border-[#D1D9DA]/75 bg-white p-6 shadow-[0_24px_70px_rgba(6,31,57,0.08)] dark:border-white/10 dark:bg-white/[0.055] dark:shadow-[0_24px_80px_rgba(0,0,0,0.22)] lg:p-8">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_14%,rgba(212,162,60,0.18),transparent_30%),radial-gradient(circle_at_85%_18%,rgba(10,100,116,0.16),transparent_34%)] dark:bg-[radial-gradient(circle_at_16%_14%,rgba(212,162,60,0.16),transparent_30%),radial-gradient(circle_at_85%_18%,rgba(10,100,116,0.22),transparent_34%)]" />

                        <div className="relative grid gap-8 lg:grid-cols-[1fr_420px] lg:items-center">
                            <div>
                                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#D4A23C]/30 bg-[#D4A23C]/10 px-3 py-1 text-xs font-semibold tracking-[0.16em] text-[#082F54] uppercase dark:text-[#F5D58C]">
                                    <LockKeyhole className="h-3.5 w-3.5" />
                                    Secure internal transfer
                                </div>

                                <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-[#061F39] dark:text-white sm:text-4xl lg:text-5xl">
                                    Move money with CIM-level confidence.
                                </h1>

                                <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-300">
                                    Send MAD instantly to verified CIM beneficiaries.
                                    Review account, recipient, amount, and estimated
                                    balance before confirming the transfer.
                                </p>

                                <div className="mt-6 flex flex-wrap gap-3">
                                    <Link
                                        href="/customer/beneficiaries"
                                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#D1D9DA] bg-white px-4 text-sm font-semibold text-[#082F54] shadow-sm transition hover:-translate-y-0.5 hover:border-[#D4A23C] hover:shadow-md dark:border-white/10 dark:bg-white/10 dark:text-white"
                                    >
                                        <ShieldCheck className="h-4 w-4" />
                                        Manage beneficiaries
                                    </Link>
                                    <span className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#0A6474]/20 bg-[#0A6474]/10 px-4 text-sm font-semibold text-[#0A6474] dark:border-cyan-200/10 dark:bg-cyan-200/10 dark:text-cyan-100">
                                        <Sparkles className="h-4 w-4" />
                                        {activeBeneficiaries.length} active destinations
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
                                                Transfer preview
                                            </p>
                                            <p className="mt-2 text-2xl font-semibold">
                                                {formatCurrency(amount)}
                                            </p>
                                        </div>
                                        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-[#D4A23C]">
                                            <Send className="h-5 w-5" />
                                        </span>
                                    </div>

                                    <div className="my-6">
                                        <svg
                                            className="h-16 w-full"
                                            viewBox="0 0 360 68"
                                            fill="none"
                                            aria-hidden="true"
                                        >
                                            <path
                                                d="M20 34 C95 8 123 60 184 34 C245 8 272 60 340 34"
                                                stroke="rgba(212,162,60,0.9)"
                                                strokeWidth="3"
                                                strokeLinecap="round"
                                                strokeDasharray="420"
                                                strokeDashoffset="420"
                                                className="transfer-path"
                                            />
                                            <circle cx="20" cy="34" r="7" fill="#0A6474" />
                                            <circle cx="340" cy="34" r="7" fill="#D4A23C" />
                                        </svg>
                                    </div>

                                    <div className="grid gap-3">
                                        <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                                            <p className="text-xs text-white/50">
                                                From account
                                            </p>
                                            <p className="mt-1 font-semibold">
                                                {selectedAccount?.account_number ||
                                                    'Select account'}
                                            </p>
                                        </div>
                                        <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                                            <p className="text-xs text-white/50">
                                                To beneficiary
                                            </p>
                                            <p className="mt-1 font-semibold">
                                                {selectedBeneficiary?.full_name ||
                                                    'Select beneficiary'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {flash.success ? (
                        <motion.div
                            className="transfer-reveal rounded-2xl border border-emerald-300/30 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-700 dark:text-emerald-200"
                            initial={{ scale: 0.98 }}
                            animate={{ scale: 1 }}
                        >
                            {flash.success}
                        </motion.div>
                    ) : null}

                    {queryPrefill.amount || queryPrefill.beneficiaryId ? (
                        <div className="transfer-reveal rounded-2xl border border-[#D4A23C]/40 bg-[#D4A23C]/10 px-4 py-3 text-sm font-semibold text-[#061F39] dark:text-[#F5D58C]">
                            This transfer was prefilled for review. It will not
                            be sent until you click Confirm transfer.
                        </div>
                    ) : null}

                    <section className="grid gap-5 lg:grid-cols-3">
                        <MetricCard
                            icon={Landmark}
                            label="Selected balance"
                            value={formatCurrency(
                                selectedAccount?.balance,
                                selectedAccount?.currency,
                            )}
                            helper={selectedAccount?.account_number || 'No account selected'}
                            variant="dark"
                        />
                        <MetricCard
                            icon={UserRoundCheck}
                            label="Transfer access"
                            value={activeBeneficiaries.length}
                            helper="active beneficiaries"
                        />
                        <MetricCard
                            icon={Banknote}
                            label="Recent volume"
                            value={formatCurrency(totalMoved)}
                            helper={`${completedTransfers} completed transfers`}
                        />
                    </section>

                    <section className="grid gap-5 xl:grid-cols-[0.88fr_1.12fr]">
                        <motion.form
                            onSubmit={submit}
                            className="transfer-reveal rounded-[1.6rem] border border-[#D1D9DA]/75 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.055] lg:p-6"
                            whileHover={{ y: -2 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div className="flex items-start gap-3">
                                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#082F54] text-white shadow-lg shadow-[#082F54]/15 dark:bg-[#0A6474]">
                                    <Send className="h-5 w-5" />
                                </span>
                                <div>
                                    <h2 className="text-xl font-semibold text-[#061F39] dark:text-white">
                                        Transfer form
                                    </h2>
                                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                        Active beneficiaries only. A second click
                                        is required to confirm the operation.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-6 grid gap-4">
                                <SelectField
                                    label="From account"
                                    value={form.data.from_account_id}
                                    onChange={(event) => {
                                        setConfirming(false);
                                        form.setData(
                                            'from_account_id',
                                            event.target.value,
                                        );
                                    }}
                                    error={form.errors.from_account_id}
                                    disabled={!accounts.length}
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
                                </SelectField>

                                <SelectField
                                    label="Active beneficiary"
                                    value={form.data.beneficiary_id}
                                    onChange={(event) => {
                                        setConfirming(false);
                                        form.setData(
                                            'beneficiary_id',
                                            event.target.value,
                                        );
                                    }}
                                    error={form.errors.beneficiary_id}
                                    disabled={!activeBeneficiaries.length}
                                >
                                    {activeBeneficiaries.length ? (
                                        activeBeneficiaries.map((beneficiary) => (
                                            <option
                                                key={beneficiary.id}
                                                value={beneficiary.id}
                                            >
                                                {beneficiary.full_name} -{' '}
                                                {beneficiary.account_number ||
                                                    beneficiary.rib}
                                            </option>
                                        ))
                                    ) : (
                                        <option value="">No active beneficiaries</option>
                                    )}
                                </SelectField>

                                {!activeBeneficiaries.length ? (
                                    <div className="rounded-2xl border border-amber-300/30 bg-amber-500/10 p-4 text-sm font-medium text-amber-700 dark:text-amber-200">
                                        Add a verified CIM beneficiary before
                                        transferring.
                                    </div>
                                ) : null}

                                <TextInput
                                    label="Amount"
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={form.data.amount}
                                    onChange={(event) => {
                                        setConfirming(false);
                                        form.setData('amount', event.target.value);
                                    }}
                                    error={form.errors.amount}
                                    placeholder="0.00"
                                />

                                <label className="block">
                                    <span className="text-sm font-semibold text-[#061F39] dark:text-white">
                                        Note
                                    </span>
                                    <textarea
                                        value={form.data.note}
                                        onChange={(event) =>
                                            form.setData('note', event.target.value)
                                        }
                                        className="mt-2 min-h-28 w-full resize-none rounded-xl border border-[#D1D9DA] bg-white px-3 py-3 text-sm text-[#061F39] shadow-sm transition outline-none placeholder:text-slate-400 focus:border-[#D4A23C] focus:ring-4 focus:ring-[#D4A23C]/15 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:placeholder:text-slate-500 dark:focus:border-[#D4A23C]"
                                        placeholder="Optional transfer description"
                                    />
                                    <FieldError message={form.errors.note} />
                                </label>
                            </div>

                            {insufficientBalance ? (
                                <div className="mt-5 rounded-2xl border border-rose-300/30 bg-rose-500/10 p-4 text-sm font-medium text-rose-600 dark:text-rose-200">
                                    The entered amount is higher than the selected
                                    account balance. The backend will still validate
                                    the transfer before processing.
                                </div>
                            ) : null}

                            {confirming ? (
                                <motion.div
                                    className="mt-5 rounded-2xl border border-[#D4A23C]/40 bg-[#D4A23C]/10 p-4"
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <div className="flex items-start gap-3">
                                        <CircleAlert className="mt-0.5 h-5 w-5 text-[#D4A23C]" />
                                        <div>
                                            <h3 className="font-semibold text-[#061F39] dark:text-white">
                                                Confirm transfer
                                            </h3>
                                            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                                Send {formatCurrency(amount)} to{' '}
                                                {selectedBeneficiary?.full_name ||
                                                    'beneficiary'}
                                                . Your estimated balance after transfer is{' '}
                                                {formatCurrency(balanceAfter)}.
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            ) : null}

                            <motion.button
                                type="submit"
                                disabled={
                                    form.processing ||
                                    !accounts.length ||
                                    !activeBeneficiaries.length
                                }
                                className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#082F54] px-4 text-sm font-semibold text-white shadow-lg shadow-[#082F54]/15 transition hover:bg-[#061F39] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#0A6474] dark:hover:bg-[#0b788d]"
                                whileHover={{ y: -2 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Send className="h-4 w-4" />
                                {form.processing
                                    ? 'Processing'
                                    : confirming
                                      ? 'Confirm transfer'
                                      : 'Review transfer'}
                            </motion.button>
                        </motion.form>

                        <section className="transfer-reveal rounded-[1.6rem] border border-[#D1D9DA]/75 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.055] lg:p-6">
                            <div className="mb-5 flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-xs font-semibold tracking-[0.18em] text-[#0A6474] uppercase dark:text-cyan-200">
                                        Activity
                                    </p>
                                    <h2 className="mt-1 text-xl font-semibold text-[#061F39] dark:text-white">
                                        Recent transfers
                                    </h2>
                                </div>
                                <ReceiptText className="h-5 w-5 text-[#D4A23C]" />
                            </div>

                            <div className="divide-y divide-[#D1D9DA] dark:divide-white/10">
                                {recentTransfers.length ? (
                                    recentTransfers.map((transfer) => {
                                        const isOut = transfer.direction === 'out';
                                        const Icon = isOut
                                            ? ArrowDownLeft
                                            : ArrowUpRight;

                                        return (
                                            <motion.article
                                                key={transfer.id}
                                                className="transfer-row group flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                                                whileHover={{ x: 4 }}
                                                transition={{ duration: 0.18 }}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span
                                                        className={`flex h-11 w-11 items-center justify-center rounded-2xl transition group-hover:scale-105 ${
                                                            isOut
                                                                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-200'
                                                                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-200'
                                                        }`}
                                                    >
                                                        <Icon className="h-5 w-5" />
                                                    </span>
                                                    <div>
                                                        <p className="font-semibold text-[#061F39] dark:text-white">
                                                            {transfer.beneficiary_name ||
                                                                'Internal CIM transfer'}
                                                        </p>
                                                        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                                                            {transfer.reference} ·{' '}
                                                            {formatDate(
                                                                transfer.completed_at ||
                                                                    transfer.created_at,
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between gap-4 sm:justify-end">
                                                    <p
                                                        className={`font-semibold ${
                                                            isOut
                                                                ? 'text-rose-600 dark:text-rose-200'
                                                                : 'text-emerald-600 dark:text-emerald-200'
                                                        }`}
                                                    >
                                                        {isOut ? '-' : '+'}
                                                        {formatCurrency(
                                                            transfer.amount,
                                                            transfer.currency,
                                                        )}
                                                    </p>
                                                    <StatusBadge status={transfer.status} />
                                                </div>
                                            </motion.article>
                                        );
                                    })
                                ) : (
                                    <EmptyState />
                                )}
                            </div>
                        </section>
                    </section>

                    <section className="transfer-reveal grid gap-4 rounded-[1.6rem] border border-[#D1D9DA]/75 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.055] md:grid-cols-3">
                        <div className="flex items-start gap-3">
                            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0A6474]/10 text-[#0A6474] dark:bg-cyan-200/10 dark:text-cyan-100">
                                <ShieldCheck className="h-5 w-5" />
                            </span>
                            <div>
                                <h3 className="font-semibold text-[#061F39] dark:text-white">
                                    Verified recipients
                                </h3>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    Transfers are limited to active CIM
                                    beneficiaries.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#D4A23C]/15 text-[#D4A23C]">
                                <CheckCircle2 className="h-5 w-5" />
                            </span>
                            <div>
                                <h3 className="font-semibold text-[#061F39] dark:text-white">
                                    Review before sending
                                </h3>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    The first click opens a confirmation summary.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#082F54]/10 text-[#082F54] dark:bg-white/10 dark:text-white">
                                <WalletCards className="h-5 w-5" />
                            </span>
                            <div>
                                <h3 className="font-semibold text-[#061F39] dark:text-white">
                                    Balance awareness
                                </h3>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    The UI previews your estimated balance after
                                    transfer.
                                </p>
                            </div>
                        </div>
                    </section>
                </div>
            </main>
        </>
    );
}