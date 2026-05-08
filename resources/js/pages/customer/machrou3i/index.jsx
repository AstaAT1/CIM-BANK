import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { gsap } from 'gsap';
import {
    BadgeCheck,
    Banknote,
    BriefcaseBusiness,
    Building2,
    Check,
    ChevronLeft,
    ChevronRight,
    CircleDollarSign,
    ClipboardCheck,
    FileCheck2,
    FileText,
    Landmark,
    LockKeyhole,
    Send,
    ShieldCheck,
    Sparkles,
    UploadCloud,
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

const employmentTypes = ['CDI', 'CDD', 'Freelance', 'Other'];
const projectTypes = [
    'food',
    'ecommerce',
    'service',
    'transport',
    'agriculture',
    'education',
    'technology',
    'other',
];
const repaymentOptions = [12, 24, 36, 48];
const steps = ['Intro', 'Employment', 'Project', 'Preview', 'Submit'];
const today = new Date().toISOString().slice(0, 10);
const timelineStatuses = [
    'submitted',
    'under_review',
    'need_more_documents',
    'pre_approved',
    'offer_sent',
    'customer_accepted_offer',
    'rejected',
    'cancelled',
];

function formatCurrency(value, currency = 'MAD') {
    return new Intl.NumberFormat('en-MA', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(Number(value || 0));
}

function formatDate(value) {
    if (!value) {
        return 'Not submitted yet';
    }

    return new Intl.DateTimeFormat('en-MA', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value));
}

function titleCase(value) {
    return String(value || 'pending')
        .replaceAll('_', ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function numberValue(value) {
    return Number(value || 0);
}

function estimateRisk(data, account) {
    const salary = numberValue(data.monthly_salary);
    const requested = numberValue(data.requested_amount);
    const profit = numberValue(data.expected_monthly_profit);
    const months = Math.max(1, numberValue(data.repayment_months));
    const balance = numberValue(account?.balance);
    const estimatedInstallment = requested / months;
    let score = 50;
    const reasons = [];

    function add(condition, points, reason) {
        if (condition) {
            score += points;
            reasons.push(`+${points}: ${reason}`);
        }
    }

    function subtract(condition, points, reason) {
        if (condition) {
            score -= points;
            reasons.push(`-${points}: ${reason}`);
        }
    }

    add(
        Boolean(data.salary_proof),
        10,
        'Salary proof is selected for private CIM review.',
    );
    add(salary >= 5000, 10, 'Declared monthly salary is at least 5000 MAD.');
    add(
        profit >= estimatedInstallment && requested > 0,
        10,
        'Expected profit covers the estimated installment.',
    );
    add(balance >= 1000, 5, 'Selected account balance is at least 1000 MAD.');
    add(
        Boolean(data.has_experience_in_field),
        5,
        'You declared experience in this project field.',
    );
    subtract(
        salary > 0 && requested > salary * 8,
        15,
        'Requested amount is above eight months of salary.',
    );
    subtract(
        balance > 0 && balance < 500,
        10,
        'Selected account balance is below 500 MAD.',
    );
    subtract(
        requested > 0 && profit < estimatedInstallment,
        10,
        'Expected profit is below the estimated installment.',
    );
    subtract(
        !data.has_experience_in_field,
        5,
        'No project field experience was selected.',
    );

    score = Math.max(0, Math.min(100, score));
    const riskLevel = score >= 75 ? 'low' : score >= 50 ? 'medium' : 'high';
    const safeIncome = Math.max(0, salary * 0.6);
    const byIncome = safeIncome * months;
    const byProfit = Math.max(0, profit * 0.8 * months);
    const salaryCap = salary * (riskLevel === 'high' ? 4 : 8);
    let suggestedAmount = Math.min(
        requested || 0,
        byIncome,
        byProfit,
        salaryCap,
    );

    if (riskLevel === 'high') {
        suggestedAmount = Math.min(suggestedAmount, requested * 0.6);
    }

    suggestedAmount = Math.max(0, Math.round(suggestedAmount));

    return {
        score,
        riskLevel,
        suggestedAmount,
        estimatedInstallment: Math.round(suggestedAmount / months),
        requested,
        salary,
        profit,
        months,
        reasons: reasons.length
            ? reasons
            : [
                  'Complete the dossier fields to generate a stronger preliminary estimate.',
              ],
    };
}

export default function CustomerMachrou3i({
    applications = [],
    bankAccounts = [],
    customer = {},
}) {
    const pageRef = useRef(null);
    const { props } = usePage();
    const flash = props.flash || {};
    const [step, setStep] = useState(0);
    const [localMessage, setLocalMessage] = useState('');
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef(null);

    const firstAccount = bankAccounts[0] || null;
    const form = useForm({
        bank_account_id: firstAccount?.id || '',
        monthly_salary: '',
        company_name: '',
        job_title: '',
        employment_type: 'CDI',
        hiring_date: '',
        salary_proof: null,
        project_name: '',
        project_type: 'service',
        project_location: '',
        has_experience_in_field: false,
        needs_equipment: false,
        project_description: '',
        why_this_project: '',
        requested_amount: '',
        expected_monthly_revenue: '',
        expected_monthly_expenses: '',
        expected_monthly_profit: '',
        repayment_months: 24,
    });

    const selectedAccount = useMemo(
        () =>
            bankAccounts.find(
                (account) =>
                    String(account.id) === String(form.data.bank_account_id),
            ) || firstAccount,
        [bankAccounts, firstAccount, form.data.bank_account_id],
    );

    const risk = useMemo(
        () => estimateRisk(form.data, selectedAccount),
        [form.data, selectedAccount],
    );

    const submitDisabled =
        form.processing ||
        !form.data.salary_proof ||
        !form.data.bank_account_id;

    const totalRequested = applications.reduce(
        (total, application) =>
            total + Number(application.requested_amount || 0),
        0,
    );
    const activeApplications = applications.filter(
        (application) =>
            !['rejected', 'cancelled'].includes(
                String(application.status).toLowerCase(),
            ),
    ).length;

    const latestApplication = applications[0];

    const setField = (field, value) => form.setData(field, value);
    const next = () => setStep((current) => Math.min(4, current + 1));
    const previous = () => setStep((current) => Math.max(0, current - 1));

    function handleFile(file) {
        if (!file) {
            return;
        }

        setField('salary_proof', file);
    }

    function submitApplication(event) {
        event.preventDefault();
        setLocalMessage('');

        form.post('/backend/customer/machrou3i', {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setLocalMessage(
                    'Application submitted to CIM. No funds were disbursed; a CIM advisor will review your dossier.',
                );
                setStep(0);
                form.reset();
            },
        });
    }

    function acceptOffer(application) {
        router.patch(
            `/backend/customer/machrou3i/${application.id}/accept-offer`,
            {},
            {
                preserveScroll: true,
                onSuccess: () =>
                    setLocalMessage(
                        'A CIM advisor will contact you to finalize the financing process. No funds were disbursed.',
                    ),
            },
        );
    }

    function declineOffer(application) {
        router.patch(
            `/backend/customer/machrou3i/${application.id}/decline-offer`,
            {},
            {
                preserveScroll: true,
                onSuccess: () =>
                    setLocalMessage(
                        'Offer declined. No financing was disbursed.',
                    ),
            },
        );
    }

    useEffect(() => {
        if (!pageRef.current) {
            return undefined;
        }

        const context = gsap.context(() => {
            gsap.fromTo(
                '.mach-reveal',
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
                '.mach-card-row',
                { autoAlpha: 0, x: -14 },
                {
                    autoAlpha: 1,
                    x: 0,
                    duration: 0.5,
                    stagger: 0.06,
                    delay: 0.22,
                    ease: 'power2.out',
                },
            );

            gsap.to('.mach-orb', {
                x: 18,
                y: -16,
                scale: 1.08,
                duration: 5.5,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut',
            });

            gsap.to('.mach-path', {
                strokeDashoffset: 0,
                duration: 1.5,
                ease: 'power2.out',
                delay: 0.4,
            });
        }, pageRef);

        return () => context.revert();
    }, []);

    return (
        <>
            <Head title="Machrou3i by CIM" />

            <style>
                {`
                    .cim-field {
                        width: 100%;
                        height: 3rem;
                        border-radius: 0.75rem;
                        border: 1px solid ${CIM.border};
                        background: #fff;
                        padding: 0 0.875rem;
                        font-size: 0.875rem;
                        font-weight: 600;
                        color: ${CIM.dark};
                        outline: none;
                        box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
                        transition: border-color 150ms ease, box-shadow 150ms ease, background-color 150ms ease;
                    }
                    .cim-field:focus {
                        border-color: ${CIM.accent};
                        box-shadow: 0 0 0 4px rgba(212, 162, 60, 0.15);
                    }
                    .cim-field::placeholder {
                        color: #94a3b8;
                        font-weight: 500;
                    }
                    .dark .cim-field {
                        border-color: rgba(255, 255, 255, 0.10);
                        background: rgba(255, 255, 255, 0.06);
                        color: #fff;
                    }
                    .dark .cim-field:focus {
                        border-color: ${CIM.accent};
                    }
                    .dark .cim-field option {
                        color: #fff;
                        background: ${CIM.dark};
                    }
                    .dark .cim-field option:checked {
                        color: ${CIM.dark};
                        background: ${CIM.accent};
                    }
                `}
            </style>

            <main
                ref={pageRef}
                className="relative min-h-screen overflow-hidden bg-[#F7F8FA] px-4 py-6 text-[#061F39] sm:px-6 lg:px-8 dark:bg-[#061F39]"
            >
                <div className="mach-orb pointer-events-none absolute -top-28 right-10 h-72 w-72 rounded-full bg-[#0A6474]/15 blur-3xl dark:bg-[#0A6474]/25" />
                <div className="mach-orb pointer-events-none absolute top-[42rem] -left-24 h-72 w-72 rounded-full bg-[#D4A23C]/10 blur-3xl dark:bg-[#D4A23C]/15" />

                <div className="relative mx-auto flex max-w-7xl flex-col gap-6">
                    <Hero
                        onStart={() => setStep(1)}
                        applicationsCount={applications.length}
                        activeApplications={activeApplications}
                        totalRequested={totalRequested}
                        latestApplication={latestApplication}
                    />

                    {(flash.success || localMessage) && (
                        <motion.div
                            className="mach-reveal rounded-2xl border border-emerald-300/30 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-700 dark:text-emerald-200"
                            initial={{ scale: 0.98 }}
                            animate={{ scale: 1 }}
                        >
                            {localMessage || flash.success}
                        </motion.div>
                    )}

                    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <MetricCard
                            icon={Banknote}
                            label="Requested portfolio"
                            value={formatCurrency(totalRequested)}
                            helper={`${applications.length} total dossiers`}
                            variant="dark"
                        />
                        <MetricCard
                            icon={ClipboardCheck}
                            label="Active reviews"
                            value={activeApplications}
                            helper="not rejected/cancelled"
                        />
                        <MetricCard
                            icon={WalletCards}
                            label="Selected account"
                            value={selectedAccount?.label || 'No account'}
                            helper={selectedAccount?.balance ? formatCurrency(selectedAccount.balance) : 'Connect CIM account'}
                        />
                        <MetricCard
                            icon={Sparkles}
                            label="Preview risk"
                            value={`${risk.score}/100`}
                            helper={`${titleCase(risk.riskLevel)} preliminary level`}
                        />
                    </section>

                    <section className="mach-reveal overflow-hidden rounded-[1.6rem] border border-[#D1D9DA]/75 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.055]">
                        <Stepper current={step} />
                        <form
                            onSubmit={submitApplication}
                            className="p-5 sm:p-7"
                        >
                            {step === 0 && (
                                <IntroStep
                                    customer={customer}
                                    account={selectedAccount}
                                    onStart={() => setStep(1)}
                                />
                            )}
                            {step === 1 && (
                                <EmploymentStep
                                    data={form.data}
                                    errors={form.errors}
                                    bankAccounts={bankAccounts}
                                    setField={setField}
                                    fileInputRef={fileInputRef}
                                    dragActive={dragActive}
                                    setDragActive={setDragActive}
                                    handleFile={handleFile}
                                />
                            )}
                            {step === 2 && (
                                <ProjectStep
                                    data={form.data}
                                    errors={form.errors}
                                    setField={setField}
                                />
                            )}
                            {step === 3 && <RiskPreview risk={risk} />}
                            {step === 4 && (
                                <SubmitStep
                                    data={form.data}
                                    errors={form.errors}
                                    risk={risk}
                                    account={selectedAccount}
                                    processing={form.processing}
                                    submitDisabled={submitDisabled}
                                />
                            )}

                            <div className="mt-8 flex flex-col gap-3 border-t border-[#D1D9DA] pt-5 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
                                <button
                                    type="button"
                                    onClick={previous}
                                    disabled={step === 0 || form.processing}
                                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#D1D9DA] bg-white px-4 text-sm font-semibold text-[#082F54] transition hover:border-[#D4A23C] disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-white/10 dark:text-white"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    Back
                                </button>
                                {step < 4 ? (
                                    <motion.button
                                        type="button"
                                        onClick={next}
                                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#082F54] px-5 text-sm font-semibold text-white shadow-lg shadow-[#082F54]/15 transition hover:bg-[#061F39] dark:bg-[#0A6474]"
                                        whileHover={{ y: -2 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        Continue
                                        <ChevronRight className="h-4 w-4" />
                                    </motion.button>
                                ) : (
                                    <motion.button
                                        type="submit"
                                        disabled={submitDisabled}
                                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#082F54] px-5 text-sm font-semibold text-white shadow-lg shadow-[#082F54]/15 transition hover:bg-[#061F39] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#0A6474]"
                                        whileHover={{ y: submitDisabled ? 0 : -2 }}
                                        whileTap={{ scale: submitDisabled ? 1 : 0.98 }}
                                    >
                                        <Send className="h-4 w-4" />
                                        {form.processing
                                            ? 'Submitting...'
                                            : 'Submit to CIM'}
                                    </motion.button>
                                )}
                            </div>
                        </form>
                    </section>

                    <ApplicationsList
                        applications={applications}
                        onAccept={acceptOffer}
                        onDecline={declineOffer}
                    />
                </div>
            </main>
        </>
    );
}

function Hero({
    onStart,
    applicationsCount,
    activeApplications,
    totalRequested,
    latestApplication,
}) {
    const values = [
        {
            icon: Banknote,
            title: 'Salary-based project financing',
            text: 'Start from your verified salary and active CIM account.',
        },
        {
            icon: Sparkles,
            title: 'Smart risk preview',
            text: 'See a preliminary estimate before CIM review.',
        },
        {
            icon: ShieldCheck,
            title: 'CIM advisor review',
            text: 'Staff review your proof, project idea, and banking behavior.',
        },
        {
            icon: LockKeyhole,
            title: 'No instant disbursement',
            text: 'This version collects and reviews applications only.',
        },
    ];

    return (
        <section className="mach-reveal relative overflow-hidden rounded-[2rem] border border-[#D1D9DA]/75 bg-white p-6 shadow-[0_24px_70px_rgba(6,31,57,0.08)] dark:border-white/10 dark:bg-white/[0.055] dark:shadow-[0_24px_80px_rgba(0,0,0,0.22)] lg:p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_14%,rgba(212,162,60,0.18),transparent_30%),radial-gradient(circle_at_85%_18%,rgba(10,100,116,0.16),transparent_34%)] dark:bg-[radial-gradient(circle_at_16%_14%,rgba(212,162,60,0.16),transparent_30%),radial-gradient(circle_at_85%_18%,rgba(10,100,116,0.22),transparent_34%)]" />

            <div className="relative grid gap-8 lg:grid-cols-[1fr_410px] lg:items-center">
                <div>
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#D4A23C]/30 bg-[#D4A23C]/10 px-3 py-1 text-xs font-semibold tracking-[0.16em] text-[#082F54] uppercase dark:text-[#F5D58C]">
                        <BriefcaseBusiness className="h-3.5 w-3.5" />
                        Project financing workspace
                    </div>

                    <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-[#061F39] dark:text-white sm:text-4xl lg:text-5xl">
                        Machrou3i turns salary stability into project momentum.
                    </h1>

                    <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-300">
                        Build a structured financing dossier, upload salary
                        proof, preview risk, and let CIM advisors review the
                        project before any final decision.
                    </p>

                    <div className="mt-6 flex flex-wrap gap-3">
                        <motion.button
                            type="button"
                            onClick={onStart}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#082F54] px-5 text-sm font-semibold text-white shadow-lg shadow-[#082F54]/15 transition hover:bg-[#061F39] dark:bg-[#0A6474]"
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            Start application
                            <ChevronRight className="h-4 w-4" />
                        </motion.button>
                        <span className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#0A6474]/20 bg-[#0A6474]/10 px-4 text-sm font-semibold text-[#0A6474] dark:border-cyan-200/10 dark:bg-cyan-200/10 dark:text-cyan-100">
                            <ClipboardCheck className="h-4 w-4" />
                            {activeApplications} active review
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
                                    Dossier overview
                                </p>
                                <p className="mt-2 text-3xl font-semibold">
                                    {formatCurrency(totalRequested)}
                                </p>
                                <p className="mt-1 text-sm text-white/55">
                                    requested across {applicationsCount} applications
                                </p>
                            </div>
                            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-[#D4A23C]">
                                <Landmark className="h-5 w-5" />
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
                                    d="M20 38 C95 8 126 62 184 34 C245 6 274 58 340 28"
                                    stroke="rgba(212,162,60,0.9)"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeDasharray="420"
                                    strokeDashoffset="420"
                                    className="mach-path"
                                />
                                <circle cx="20" cy="38" r="7" fill="#0A6474" />
                                <circle cx="340" cy="28" r="7" fill="#D4A23C" />
                            </svg>
                        </div>

                        <div className="grid gap-3">
                            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                                <p className="text-xs text-white/50">
                                    Latest dossier
                                </p>
                                <p className="mt-1 font-semibold">
                                    {latestApplication?.project_name ||
                                        'No project submitted yet'}
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {values.slice(1, 3).map((item) => {
                                    const Icon = item.icon;

                                    return (
                                        <div
                                            key={item.title}
                                            className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur"
                                        >
                                            <Icon className="mb-3 h-5 w-5 text-[#D4A23C]" />
                                            <p className="text-xs font-semibold text-white/80">
                                                {item.title}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

function MetricCard({ icon: Icon, label, value, helper, variant = 'light' }) {
    const isDark = variant === 'dark';

    return (
        <motion.div
            className={`mach-reveal relative overflow-hidden rounded-2xl border p-5 ${
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
                <div className="min-w-0">
                    <p
                        className={`text-sm ${
                            isDark
                                ? 'text-white/65'
                                : 'text-slate-500 dark:text-slate-400'
                        }`}
                    >
                        {label}
                    </p>
                    <p className="mt-2 truncate text-2xl font-semibold tracking-tight">
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

function Stepper({ current }) {
    return (
        <div className="border-b border-[#D1D9DA] px-4 py-4 dark:border-white/10 sm:px-7">
            <div className="grid gap-3 sm:grid-cols-5">
                {steps.map((label, index) => {
                    const active = index === current;
                    const done = index < current;

                    return (
                        <div key={label} className="flex items-center gap-2">
                            <div
                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold transition ${
                                    done || active
                                        ? 'bg-[#082F54] text-white shadow-lg shadow-[#082F54]/15 dark:bg-[#0A6474]'
                                        : 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400'
                                }`}
                            >
                                {done ? (
                                    <Check className="h-4 w-4" />
                                ) : (
                                    index + 1
                                )}
                            </div>
                            <span
                                className={`text-sm font-semibold ${
                                    active
                                        ? 'text-[#082F54] dark:text-white'
                                        : 'text-slate-500 dark:text-slate-400'
                                }`}
                            >
                                {label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function IntroStep({ customer, account, onStart }) {
    return (
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <motion.div
                className="rounded-[1.4rem] border border-[#D1D9DA] bg-[#F7F8FA] p-5 dark:border-white/10 dark:bg-white/[0.04]"
                whileHover={{ y: -2 }}
            >
                <p className="text-sm font-semibold tracking-[0.12em] text-[#0A6474] uppercase dark:text-cyan-200">
                    Before you begin
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-[#061F39] dark:text-white">
                    Build a complete project dossier in a few focused steps.
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    We will use your existing CIM identity and verified account
                    context. You only need to add employment proof, your project
                    story, and financial expectations.
                </p>
                <button
                    type="button"
                    onClick={onStart}
                    className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-[#D4A23C] px-5 text-sm font-semibold text-[#061F39] shadow-lg shadow-[#D4A23C]/20"
                >
                    Begin wizard
                    <ChevronRight className="h-4 w-4" />
                </button>
            </motion.div>
            <div className="grid gap-3 sm:grid-cols-2">
                <InfoTile
                    label="Customer"
                    value={customer.name || 'CIM customer'}
                />
                <InfoTile
                    label="Email"
                    value={customer.email || 'Verified email'}
                />
                <InfoTile label="CIN" value={customer.cin || 'On file'} />
                <InfoTile
                    label="Active account"
                    value={account?.label || 'No active account found'}
                />
            </div>
        </div>
    );
}

function EmploymentStep({
    data,
    errors,
    bankAccounts,
    setField,
    fileInputRef,
    dragActive,
    setDragActive,
    handleFile,
}) {
    return (
        <div className="grid gap-7 lg:grid-cols-[1fr_0.9fr]">
            <section>
                <SectionHeading
                    icon={BriefcaseBusiness}
                    title="Employment and salary"
                    text="Use your current salaried activity and choose the CIM account linked to this application."
                />
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <Field label="Monthly salary" error={errors.monthly_salary}>
                        <input
                            value={data.monthly_salary}
                            onChange={(e) =>
                                setField('monthly_salary', e.target.value)
                            }
                            type="number"
                            min="1"
                            className="cim-field"
                            placeholder="7000"
                        />
                    </Field>
                    <Field
                        label="Active CIM account"
                        error={errors.bank_account_id}
                    >
                        <select
                            value={data.bank_account_id}
                            onChange={(e) =>
                                setField('bank_account_id', e.target.value)
                            }
                            className="cim-field"
                        >
                            {bankAccounts.length ? (
                                bankAccounts.map((account) => (
                                    <option key={account.id} value={account.id}>
                                        {account.label}
                                    </option>
                                ))
                            ) : (
                                <option value="">No account available</option>
                            )}
                        </select>
                    </Field>
                    <Field label="Company name" error={errors.company_name}>
                        <input
                            value={data.company_name}
                            onChange={(e) =>
                                setField('company_name', e.target.value)
                            }
                            className="cim-field"
                            placeholder="Company or employer"
                        />
                    </Field>
                    <Field label="Job title" error={errors.job_title}>
                        <input
                            value={data.job_title}
                            onChange={(e) =>
                                setField('job_title', e.target.value)
                            }
                            className="cim-field"
                            placeholder="Operations coordinator"
                        />
                    </Field>
                    <Field
                        label="Employment type"
                        error={errors.employment_type}
                    >
                        <select
                            value={data.employment_type}
                            onChange={(e) =>
                                setField('employment_type', e.target.value)
                            }
                            className="cim-field"
                        >
                            {employmentTypes.map((type) => (
                                <option key={type} value={type}>
                                    {type}
                                </option>
                            ))}
                        </select>
                    </Field>
                    <Field label="Hiring date" error={errors.hiring_date}>
                        <input
                            value={data.hiring_date}
                            onChange={(e) =>
                                setField('hiring_date', e.target.value)
                            }
                            type="date"
                            max={today}
                            className="cim-field"
                        />
                    </Field>
                </div>
            </section>

            <section>
                <SectionHeading
                    icon={UploadCloud}
                    title="Private salary proof"
                    text="Salary certificate, pay slip, work certificate, or employment proof."
                />
                <motion.button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => {
                        e.preventDefault();
                        setDragActive(true);
                    }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={(e) => {
                        e.preventDefault();
                        setDragActive(false);
                        handleFile(e.dataTransfer.files?.[0]);
                    }}
                    className={`mt-5 block w-full rounded-[1.4rem] border border-dashed p-6 text-left transition ${
                        dragActive
                            ? 'border-[#0A6474] bg-[#0A6474]/10 dark:border-cyan-200/40 dark:bg-cyan-200/10'
                            : 'border-[#D1D9DA] bg-[#F7F8FA] dark:border-white/10 dark:bg-white/[0.04]'
                    }`}
                    whileHover={{ y: -2 }}
                >
                    <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[#082F54] shadow-sm dark:bg-white/10 dark:text-[#D4A23C]">
                            <FileCheck2 className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="font-semibold text-[#061F39] dark:text-white">
                                {data.salary_proof?.name ||
                                    'Select or drop your proof'}
                            </p>
                            <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                                Accepted: PDF or image. Your proof will be
                                stored privately and reviewed only by CIM staff.
                            </p>
                        </div>
                    </div>
                </motion.button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf,image/*"
                    className="hidden"
                    onChange={(e) => handleFile(e.target.files?.[0])}
                />
                {errors.salary_proof && (
                    <p className="mt-2 text-sm font-medium text-rose-600">
                        {errors.salary_proof}
                    </p>
                )}
                {!data.salary_proof && (
                    <p className="mt-2 text-sm font-medium text-amber-700 dark:text-amber-200">
                        Salary proof is required before submission.
                    </p>
                )}
            </section>
        </div>
    );
}

function ProjectStep({ data, errors, setField }) {
    return (
        <div className="space-y-7">
            <section>
                <SectionHeading
                    icon={Building2}
                    title="Project dossier"
                    text="Describe the business opportunity CIM staff will review."
                />
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <Field label="Project name" error={errors.project_name}>
                        <input
                            value={data.project_name}
                            onChange={(e) =>
                                setField('project_name', e.target.value)
                            }
                            className="cim-field"
                            placeholder="Neighborhood Delivery"
                        />
                    </Field>
                    <Field label="Project type" error={errors.project_type}>
                        <select
                            value={data.project_type}
                            onChange={(e) =>
                                setField('project_type', e.target.value)
                            }
                            className="cim-field"
                        >
                            {projectTypes.map((type) => (
                                <option key={type} value={type}>
                                    {titleCase(type)}
                                </option>
                            ))}
                        </select>
                    </Field>
                    <Field
                        label="Project location"
                        error={errors.project_location}
                    >
                        <input
                            value={data.project_location}
                            onChange={(e) =>
                                setField('project_location', e.target.value)
                            }
                            className="cim-field"
                            placeholder="Casablanca"
                        />
                    </Field>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <Toggle
                            label="Experience in field"
                            checked={data.has_experience_in_field}
                            onChange={(value) =>
                                setField('has_experience_in_field', value)
                            }
                        />
                        <Toggle
                            label="Needs equipment"
                            checked={data.needs_equipment}
                            onChange={(value) =>
                                setField('needs_equipment', value)
                            }
                        />
                    </div>
                </div>
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    <Field
                        label="Project description"
                        error={errors.project_description}
                    >
                        <textarea
                            value={data.project_description}
                            onChange={(e) =>
                                setField('project_description', e.target.value)
                            }
                            className="cim-field min-h-32 resize-none py-3"
                            placeholder="What will the project do, who will it serve, and how will it operate?"
                        />
                    </Field>
                    <Field
                        label="Why this project?"
                        error={errors.why_this_project}
                    >
                        <textarea
                            value={data.why_this_project}
                            onChange={(e) =>
                                setField('why_this_project', e.target.value)
                            }
                            className="cim-field min-h-32 resize-none py-3"
                            placeholder="Explain the demand, your motivation, or your advantage."
                        />
                    </Field>
                </div>
            </section>

            <section>
                <SectionHeading
                    icon={CircleDollarSign}
                    title="Financial expectations"
                    text="These figures power the preliminary risk preview and help CIM prepare a suitable proposal."
                />
                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Field
                        label="Requested amount"
                        helper="Maximum financing you want."
                        error={errors.requested_amount}
                    >
                        <input
                            value={data.requested_amount}
                            onChange={(e) =>
                                setField('requested_amount', e.target.value)
                            }
                            type="number"
                            min="1"
                            className="cim-field"
                            placeholder="40000"
                        />
                    </Field>
                    <Field
                        label="Monthly revenue"
                        helper="Expected sales before expenses."
                        error={errors.expected_monthly_revenue}
                    >
                        <input
                            value={data.expected_monthly_revenue}
                            onChange={(e) =>
                                setField(
                                    'expected_monthly_revenue',
                                    e.target.value,
                                )
                            }
                            type="number"
                            min="0"
                            className="cim-field"
                            placeholder="15000"
                        />
                    </Field>
                    <Field
                        label="Monthly expenses"
                        helper="Rent, stock, transport, wages."
                        error={errors.expected_monthly_expenses}
                    >
                        <input
                            value={data.expected_monthly_expenses}
                            onChange={(e) =>
                                setField(
                                    'expected_monthly_expenses',
                                    e.target.value,
                                )
                            }
                            type="number"
                            min="0"
                            className="cim-field"
                            placeholder="9000"
                        />
                    </Field>
                    <Field
                        label="Monthly profit"
                        helper="Revenue minus expenses."
                        error={errors.expected_monthly_profit}
                    >
                        <input
                            value={data.expected_monthly_profit}
                            onChange={(e) =>
                                setField(
                                    'expected_monthly_profit',
                                    e.target.value,
                                )
                            }
                            type="number"
                            min="0"
                            className="cim-field"
                            placeholder="6000"
                        />
                    </Field>
                </div>
                <div className="mt-5">
                    <p className="text-sm font-semibold text-[#061F39] dark:text-white">
                        Repayment months
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {repaymentOptions.map((months) => (
                            <motion.button
                                key={months}
                                type="button"
                                onClick={() =>
                                    setField('repayment_months', months)
                                }
                                className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                                    Number(data.repayment_months) === months
                                        ? 'border-[#082F54] bg-[#082F54] text-white dark:border-[#0A6474] dark:bg-[#0A6474]'
                                        : 'border-[#D1D9DA] bg-white text-[#082F54] hover:border-[#D4A23C] dark:border-white/10 dark:bg-white/10 dark:text-white'
                                }`}
                                whileHover={{ y: -2 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                {months} months
                            </motion.button>
                        ))}
                    </div>
                    {errors.repayment_months && (
                        <p className="mt-2 text-sm font-medium text-rose-600">
                            {errors.repayment_months}
                        </p>
                    )}
                </div>
            </section>
        </div>
    );
}

function RiskPreview({ risk }) {
    return (
        <div className="grid gap-7 lg:grid-cols-[0.85fr_1.15fr]">
            <section>
                <SectionHeading
                    icon={ClipboardCheck}
                    title="Preliminary estimate"
                    text="This is only a preliminary estimate. CIM staff will review your application and salary proof."
                />
                <div className="mt-6 flex flex-col items-center rounded-[1.4rem] border border-[#D1D9DA] bg-[#F7F8FA] p-6 text-center dark:border-white/10 dark:bg-white/[0.04]">
                    <RiskRing score={risk.score} level={risk.riskLevel} />
                    <p className="mt-4 text-sm font-semibold tracking-[0.12em] text-[#0A6474] uppercase dark:text-cyan-200">
                        Estimated risk level
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-[#061F39] dark:text-white">
                        {titleCase(risk.riskLevel)}
                    </p>
                </div>
            </section>
            <section>
                <div className="grid gap-3 sm:grid-cols-2">
                    <InfoTile
                        label="Suggested amount"
                        value={formatCurrency(risk.suggestedAmount)}
                    />
                    <InfoTile
                        label="Estimated installment"
                        value={`${formatCurrency(risk.estimatedInstallment)} / month`}
                    />
                    <InfoTile
                        label="Declared salary"
                        value={formatCurrency(risk.salary)}
                    />
                    <InfoTile
                        label="Expected profit"
                        value={formatCurrency(risk.profit)}
                    />
                    <InfoTile
                        label="Requested amount"
                        value={formatCurrency(risk.requested)}
                    />
                    <InfoTile
                        label="Repayment months"
                        value={`${risk.months} months`}
                    />
                </div>
                <div className="mt-5 rounded-[1.4rem] border border-[#D1D9DA] bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]">
                    <h3 className="font-semibold text-[#061F39] dark:text-white">
                        Preview reasons
                    </h3>
                    <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                        {risk.reasons.map((reason) => (
                            <li key={reason} className="flex gap-2">
                                <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#0A6474] dark:text-cyan-200" />
                                <span>{reason}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>
        </div>
    );
}

function SubmitStep({
    data,
    errors,
    risk,
    account,
    processing,
    submitDisabled,
}) {
    return (
        <div className="space-y-6">
            <SectionHeading
                icon={FileText}
                title="Submit summary"
                text="Review the dossier before sending it to CIM. Submitting does not disburse money."
            />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <InfoTile
                    label="Salary and company"
                    value={`${formatCurrency(data.monthly_salary)} at ${data.company_name || 'company'}`}
                />
                <InfoTile
                    label="Selected account"
                    value={account?.label || 'No account selected'}
                />
                <InfoTile
                    label="Project"
                    value={`${data.project_name || 'Project'} · ${titleCase(data.project_type)}`}
                />
                <InfoTile
                    label="Requested amount"
                    value={formatCurrency(data.requested_amount)}
                />
                <InfoTile
                    label="Expected profit"
                    value={formatCurrency(data.expected_monthly_profit)}
                />
                <InfoTile
                    label="Repayment"
                    value={`${data.repayment_months} months`}
                />
                <InfoTile
                    label="Salary proof"
                    value={data.salary_proof?.name || 'Missing'}
                />
                <InfoTile
                    label="Preliminary risk"
                    value={`${titleCase(risk.riskLevel)} · ${risk.score}/100`}
                />
                <InfoTile
                    label="Preliminary suggestion"
                    value={formatCurrency(risk.suggestedAmount)}
                />
            </div>
            {Object.keys(errors).length > 0 && (
                <div className="rounded-2xl border border-rose-300/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-200">
                    Please review the highlighted fields. Salary proof is
                    required before submitting to CIM.
                </div>
            )}
            {submitDisabled && !processing && (
                <div className="rounded-2xl border border-amber-300/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
                    Select an active CIM account and upload salary proof to
                    submit.
                </div>
            )}
        </div>
    );
}

function ApplicationsList({ applications, onAccept, onDecline }) {
    return (
        <section className="mach-reveal">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-sm font-semibold tracking-[0.12em] text-[#0A6474] uppercase dark:text-cyan-200">
                        Application status
                    </p>
                    <h2 className="text-2xl font-semibold text-[#061F39] dark:text-white">
                        Existing Machrou3i applications
                    </h2>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    Offers are advisory in this version; no funds are disbursed
                    here.
                </p>
            </div>
            <div className="mt-5 grid gap-5">
                {applications.length ? (
                    applications.map((application) => (
                        <ApplicationCard
                            key={application.id}
                            application={application}
                            onAccept={onAccept}
                            onDecline={onDecline}
                        />
                    ))
                ) : (
                    <div className="rounded-[1.6rem] border border-dashed border-[#D1D9DA] bg-white px-6 py-12 text-center dark:border-white/10 dark:bg-white/[0.055]">
                        <Landmark className="mx-auto h-8 w-8 text-[#0A6474] dark:text-cyan-200" />
                        <h3 className="mt-3 font-semibold text-[#061F39] dark:text-white">
                            No applications yet
                        </h3>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Start the wizard above to prepare your first
                            Machrou3i dossier.
                        </p>
                    </div>
                )}
            </div>
        </section>
    );
}

function ApplicationCard({ application, onAccept, onDecline }) {
    const canRespond = ['pre_approved', 'offer_sent'].includes(
        application.status,
    );

    return (
        <motion.article
            className="mach-card-row rounded-[1.6rem] border border-[#D1D9DA]/75 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.055]"
            whileHover={{ y: -3 }}
            transition={{ duration: 0.2 }}
        >
            <div className="grid gap-5 lg:grid-cols-[1fr_0.85fr]">
                <div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <h3 className="text-xl font-semibold text-[#061F39] dark:text-white">
                                {application.project_name}
                            </h3>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                {titleCase(application.project_type)} ·
                                submitted {formatDate(application.submitted_at)}
                            </p>
                        </div>
                        <StatusBadge status={application.status} />
                    </div>
                    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <InfoTile
                            label="Requested"
                            value={formatCurrency(application.requested_amount)}
                        />
                        <InfoTile
                            label="Suggested"
                            value={
                                application.suggested_amount
                                    ? formatCurrency(
                                          application.suggested_amount,
                                      )
                                    : 'Pending'
                            }
                        />
                        <InfoTile
                            label="Installment"
                            value={
                                application.suggested_monthly_installment
                                    ? `${formatCurrency(application.suggested_monthly_installment)} / mo`
                                    : 'Pending'
                            }
                        />
                        <InfoTile
                            label="Risk"
                            value={
                                application.risk_level
                                    ? `${titleCase(application.risk_level)} · ${application.risk_score}/100`
                                    : 'Pending'
                            }
                        />
                    </div>
                    {(application.decision_note ||
                        application.required_documents_note) && (
                        <div className="mt-5 space-y-3 text-sm">
                            {application.decision_note && (
                                <Note
                                    title="Decision note"
                                    text={application.decision_note}
                                />
                            )}
                            {application.required_documents_note && (
                                <Note
                                    title="Required documents"
                                    text={application.required_documents_note}
                                />
                            )}
                        </div>
                    )}
                    {canRespond && (
                        <div className="mt-5 rounded-[1.4rem] border border-[#D4A23C]/40 bg-[#D4A23C]/10 p-4">
                            <h4 className="font-semibold text-[#061F39] dark:text-white">
                                CIM offer
                            </h4>
                            <div className="mt-3 grid gap-3 sm:grid-cols-3">
                                <InfoTile
                                    label="Offered amount"
                                    value={formatCurrency(
                                        application.offered_amount,
                                    )}
                                />
                                <InfoTile
                                    label="Repayment"
                                    value={`${application.offered_repayment_months || application.repayment_months} months`}
                                />
                                <InfoTile
                                    label="Installment"
                                    value={`${formatCurrency(application.offered_monthly_installment)} / mo`}
                                />
                            </div>
                            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                                <button
                                    type="button"
                                    onClick={() => onAccept(application)}
                                    className="rounded-xl bg-[#082F54] px-4 py-2.5 text-sm font-semibold text-white dark:bg-[#0A6474]"
                                >
                                    Accept offer
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onDecline(application)}
                                    className="rounded-xl border border-[#D1D9DA] bg-white px-4 py-2.5 text-sm font-semibold text-[#082F54] dark:border-white/10 dark:bg-white/10 dark:text-white"
                                >
                                    Decline offer
                                </button>
                            </div>
                            <p className="mt-3 text-xs font-medium text-[#0A6474] dark:text-cyan-200">
                                Accepting starts advisor follow-up only. No
                                funds are added to your balance.
                            </p>
                        </div>
                    )}
                    {application.status === 'need_more_documents' && (
                        <div className="mt-5 rounded-2xl border border-amber-300/30 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-200">
                            Uploading additional documents is prepared in the
                            backend and can be added in the next UI phase.
                        </div>
                    )}
                </div>
                <StatusTimeline activeStatus={application.status} />
            </div>
        </motion.article>
    );
}

function StatusTimeline({ activeStatus }) {
    const activeIndex = timelineStatuses.indexOf(activeStatus);

    return (
        <div className="rounded-[1.4rem] border border-[#D1D9DA] bg-[#F7F8FA] p-4 dark:border-white/10 dark:bg-white/[0.04]">
            <h4 className="font-semibold text-[#061F39] dark:text-white">
                Status timeline
            </h4>
            <div className="mt-4 space-y-3">
                {timelineStatuses.map((status, index) => {
                    const reached = index <= activeIndex;
                    const current = status === activeStatus;

                    return (
                        <div key={status} className="flex items-center gap-3">
                            <span
                                className={`h-3 w-3 rounded-full ${
                                    current
                                        ? 'bg-[#D4A23C]'
                                        : reached
                                          ? 'bg-[#0A6474]'
                                          : 'bg-slate-300 dark:bg-white/20'
                                }`}
                            />
                            <span
                                className={`text-sm ${
                                    current
                                        ? 'font-semibold text-[#061F39] dark:text-white'
                                        : reached
                                          ? 'text-slate-700 dark:text-slate-300'
                                          : 'text-slate-400'
                                }`}
                            >
                                {titleCase(status)}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function SectionHeading({ icon: Icon, title, text }) {
    return (
        <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#082F54]/10 text-[#082F54] dark:bg-cyan-200/10 dark:text-cyan-100">
                <Icon className="h-5 w-5" />
            </div>
            <div>
                <h2 className="text-xl font-semibold text-[#061F39] dark:text-white">
                    {title}
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                    {text}
                </p>
            </div>
        </div>
    );
}

function Field({ label, helper, error, children }) {
    return (
        <label className="block">
            <span className="text-sm font-semibold text-[#061F39] dark:text-white">
                {label}
            </span>
            {helper && (
                <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                    {helper}
                </span>
            )}
            <div className="mt-2">{children}</div>
            {error && (
                <span className="mt-2 block text-sm font-medium text-rose-600">
                    {error}
                </span>
            )}
        </label>
    );
}

function Toggle({ label, checked, onChange }) {
    return (
        <button
            type="button"
            onClick={() => onChange(!checked)}
            className={`flex min-h-16 items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                checked
                    ? 'border-[#082F54] bg-[#082F54]/5 dark:border-[#0A6474] dark:bg-[#0A6474]/15'
                    : 'border-[#D1D9DA] bg-white hover:border-[#D4A23C] dark:border-white/10 dark:bg-white/10'
            }`}
        >
            <span className="text-sm font-semibold text-[#061F39] dark:text-white">
                {label}
            </span>
            <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    checked
                        ? 'bg-[#082F54] text-white dark:bg-[#0A6474]'
                        : 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-300'
                }`}
            >
                {checked ? 'Yes' : 'No'}
            </span>
        </button>
    );
}

function RiskRing({ score, level }) {
    const color =
        level === 'low'
            ? '#0A6474'
            : level === 'medium'
              ? '#D4A23C'
              : '#B42318';

    return (
        <div
            className="flex h-36 w-36 items-center justify-center rounded-full shadow-inner"
            style={{
                background: `conic-gradient(${color} ${score * 3.6}deg, rgba(209,217,218,0.55) 0deg)`,
            }}
        >
            <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-white dark:bg-[#061F39]">
                <span className="text-3xl font-semibold text-[#061F39] dark:text-white">
                    {score}
                </span>
                <span className="text-xs font-semibold tracking-[0.12em] text-slate-500 uppercase dark:text-slate-400">
                    of 100
                </span>
            </div>
        </div>
    );
}

function InfoTile({ label, value }) {
    return (
        <div className="rounded-2xl border border-[#D1D9DA] bg-white px-4 py-3 dark:border-white/10 dark:bg-white/[0.04]">
            <p className="text-xs font-semibold tracking-[0.1em] text-[#0A6474] uppercase dark:text-cyan-200">
                {label}
            </p>
            <p className="mt-1 text-sm font-semibold break-words text-[#061F39] dark:text-white">
                {value || 'Pending'}
            </p>
        </div>
    );
}

function StatusBadge({ status }) {
    const tones = {
        submitted:
            'border-sky-400/25 bg-sky-500/10 text-sky-700 dark:text-sky-200',
        under_review:
            'border-amber-400/30 bg-amber-500/10 text-amber-700 dark:text-amber-200',
        need_more_documents:
            'border-amber-400/30 bg-amber-500/10 text-amber-700 dark:text-amber-200',
        pre_approved:
            'border-emerald-400/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200',
        offer_sent:
            'border-emerald-400/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200',
        customer_accepted_offer:
            'border-[#0A6474]/30 bg-[#0A6474]/10 text-[#0A6474] dark:text-cyan-200',
        rejected:
            'border-rose-400/25 bg-rose-500/10 text-rose-700 dark:text-rose-200',
        cancelled:
            'border-slate-300 bg-slate-100 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300',
    };

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${tones[status] || tones.submitted}`}
        >
            <BadgeCheck className="h-3.5 w-3.5" />
            {titleCase(status)}
        </span>
    );
}

function Note({ title, text }) {
    return (
        <div className="rounded-2xl border border-[#D1D9DA] bg-[#F7F8FA] px-4 py-3 dark:border-white/10 dark:bg-white/[0.04]">
            <p className="text-xs font-semibold tracking-[0.1em] text-[#0A6474] uppercase dark:text-cyan-200">
                {title}
            </p>
            <p className="mt-1 text-slate-600 dark:text-slate-300">{text}</p>
        </div>
    );
}
