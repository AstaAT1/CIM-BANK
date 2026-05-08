import { Head, Link, useForm, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowLeft,
    BadgeCheck,
    Banknote,
    BriefcaseBusiness,
    Building2,
    CalendarDays,
    CheckCircle2,
    ChevronRight,
    ClipboardCheck,
    Download,
    FileQuestion,
    FileText,
    Landmark,
    MailCheck,
    ReceiptText,
    Send,
    ShieldCheck,
    Sparkles,
    TrendingUp,
    UserRoundCheck,
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

function titleCase(value) {
    return String(value || 'pending')
        .replaceAll('_', ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

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
        return 'Not available';
    }

    return new Intl.DateTimeFormat('en-MA', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value));
}

function fileSize(bytes) {
    if (!bytes) {
        return 'Unknown size';
    }

    if (bytes < 1024 * 1024) {
        return `${Math.round(bytes / 1024)} KB`;
    }

    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function accountAge(openedAt) {
    if (!openedAt) {
        return 'Not available';
    }

    const months = Math.max(
        0,
        Math.round(
            (Date.now() - new Date(openedAt).getTime()) /
                (1000 * 60 * 60 * 24 * 30),
        ),
    );

    return months < 1
        ? 'Less than 1 month'
        : `${months} month${months === 1 ? '' : 's'}`;
}

function sum(rows = [], key) {
    return rows.reduce((total, row) => total + Number(row[key] || 0), 0);
}

function riskTone(level) {
    const tones = {
        low: {
            color: '#0A6474',
            chip: 'border-emerald-400/25 bg-emerald-500/10 text-emerald-700 dark:border-emerald-300/20 dark:bg-emerald-300/10 dark:text-emerald-200',
        },
        medium: {
            color: '#D4A23C',
            chip: 'border-amber-400/30 bg-amber-500/10 text-amber-700 dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-200',
        },
        high: {
            color: '#B42318',
            chip: 'border-rose-400/25 bg-rose-500/10 text-rose-700 dark:border-rose-300/20 dark:bg-rose-300/10 dark:text-rose-200',
        },
    };

    return (
        tones[level] || {
            color: '#64748b',
            chip: 'border-slate-200 bg-slate-50 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300',
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

export default function AdminMachrou3iShow({ application = {} }) {
    const pageRef = useRef(null);
    const { props } = usePage();
    const flash = props.flash || {};
    const [activeAction, setActiveAction] = useState('full');

    const project = application.project || {};
    const employment = application.employment || {};
    const risk = application.risk || {};
    const account = application.bank_account || {};
    const customer = application.customer || {};
    const behavior = application.banking_behavior || {};
    const offer = application.offer || {};

    const lowerForm = useForm({
        offered_amount: risk.suggested_amount || project.requested_amount || '',
        offered_repayment_months: project.repayment_months || 24,
        decision_note: '',
    });
    const fullForm = useForm({ decision_note: '' });
    const rejectForm = useForm({ decision_note: '' });
    const docsForm = useForm({ required_documents_note: '' });

    const lowerInstallment = useMemo(() => {
        const amount = Number(lowerForm.data.offered_amount || 0);
        const months = Math.max(
            1,
            Number(lowerForm.data.offered_repayment_months || 1),
        );

        return amount / months;
    }, [
        lowerForm.data.offered_amount,
        lowerForm.data.offered_repayment_months,
    ]);

    function preApproveFull(event) {
        event.preventDefault();
        fullForm.patch(
            `/backend/admin/machrou3i/${application.id}/pre-approve`,
            { preserveScroll: true },
        );
    }

    function preApproveLower(event) {
        event.preventDefault();
        lowerForm.patch(
            `/backend/admin/machrou3i/${application.id}/pre-approve-lower`,
            { preserveScroll: true },
        );
    }

    function reject(event) {
        event.preventDefault();
        rejectForm.patch(`/backend/admin/machrou3i/${application.id}/reject`, {
            preserveScroll: true,
        });
    }

    function requestDocuments(event) {
        event.preventDefault();
        docsForm.patch(
            `/backend/admin/machrou3i/${application.id}/request-documents`,
            { preserveScroll: true },
        );
    }

    useEffect(() => {
        if (!pageRef.current) {
            return undefined;
        }

        const context = gsap.context(() => {
            gsap.fromTo(
                '.admin-show-reveal',
                { autoAlpha: 0, y: 22 },
                {
                    autoAlpha: 1,
                    y: 0,
                    duration: 0.72,
                    stagger: 0.06,
                    ease: 'power3.out',
                },
            );

            gsap.fromTo(
                '.admin-show-row',
                { autoAlpha: 0, x: -12 },
                {
                    autoAlpha: 1,
                    x: 0,
                    duration: 0.44,
                    stagger: 0.045,
                    delay: 0.2,
                    ease: 'power2.out',
                },
            );

            gsap.to('.admin-show-orb', {
                x: 18,
                y: -14,
                scale: 1.08,
                duration: 5.3,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut',
            });
        }, pageRef);

        return () => context.revert();
    }, []);

    return (
        <>
            <Head
                title={`Machrou3i Review · ${project.project_name || application.id}`}
            />
            <style>
                {`
                    .field {
                        width: 100%;
                        border-radius: 0.875rem;
                        border: 1px solid ${CIM.border};
                        background: #fff;
                        padding: 0.75rem 0.875rem;
                        font-size: 0.875rem;
                        font-weight: 600;
                        color: ${CIM.dark};
                        outline: none;
                        transition: border-color 150ms ease, box-shadow 150ms ease, background-color 150ms ease;
                    }
                    .field:focus {
                        border-color: ${CIM.accent};
                        box-shadow: 0 0 0 4px rgba(212, 162, 60, 0.15);
                    }
                    .dark .field {
                        border-color: rgba(255, 255, 255, 0.10);
                        background: rgba(255, 255, 255, 0.06);
                        color: #fff;
                    }
                    .dark .field:focus {
                        border-color: ${CIM.accent};
                    }
                `}
            </style>

            <main
                ref={pageRef}
                className="relative min-h-screen overflow-hidden bg-[#F7F8FA] px-4 py-6 text-[#061F39] sm:px-6 lg:px-8 dark:bg-[#061F39]"
            >
                <div className="admin-show-orb pointer-events-none absolute -top-28 right-10 h-72 w-72 rounded-full bg-[#0A6474]/15 blur-3xl dark:bg-[#0A6474]/25" />
                <div className="admin-show-orb pointer-events-none absolute top-[44rem] -left-24 h-72 w-72 rounded-full bg-[#D4A23C]/10 blur-3xl dark:bg-[#D4A23C]/15" />

                <div className="relative mx-auto flex max-w-7xl flex-col gap-6">
                    <Link
                        href="/admin/machrou3i"
                        className="admin-show-reveal inline-flex w-fit items-center gap-2 rounded-2xl border border-[#D1D9DA]/70 bg-white px-4 py-2 text-sm font-semibold text-[#082F54] shadow-sm transition hover:-translate-y-0.5 hover:border-[#D4A23C] dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Machrou3i Review
                    </Link>

                    <Header
                        application={application}
                        project={project}
                        customer={customer}
                        risk={risk}
                    />

                    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <MetricCard
                            icon={Banknote}
                            label="Requested amount"
                            value={formatCurrency(project.requested_amount)}
                            variant="dark"
                        />
                        <MetricCard
                            icon={TrendingUp}
                            label="Suggested amount"
                            value={
                                risk.suggested_amount
                                    ? formatCurrency(risk.suggested_amount)
                                    : 'Pending'
                            }
                        />
                        <MetricCard
                            icon={ShieldCheck}
                            label="Risk profile"
                            value={
                                risk.risk_level
                                    ? `${titleCase(risk.risk_level)} · ${risk.risk_score || 0}/100`
                                    : 'Pending'
                            }
                        />
                        <MetricCard
                            icon={Landmark}
                            label="Account balance"
                            value={formatCurrency(
                                account.balance,
                                account.currency || 'MAD',
                            )}
                        />
                    </section>

                    <div className="grid gap-6 xl:grid-cols-[1fr_0.42fr]">
                        <div className="space-y-6">
                            <section className="grid gap-6 lg:grid-cols-2">
                                <Panel icon={UserRoundCheck} title="Customer Profile">
                                    <InfoGrid
                                        items={[
                                            ['Name', customer.name],
                                            ['Email', customer.email],
                                            ['Phone', customer.phone],
                                            ['CIN', customer.cin],
                                            ['Address', customer.address],
                                            ['City', customer.city],
                                            [
                                                'Verification',
                                                titleCase(
                                                    customer.verification_status,
                                                ),
                                            ],
                                        ]}
                                    />
                                </Panel>

                                <Panel
                                    icon={BriefcaseBusiness}
                                    title="Employment & Salary"
                                >
                                    <InfoGrid
                                        items={[
                                            [
                                                'Monthly salary',
                                                formatCurrency(
                                                    employment.monthly_salary,
                                                ),
                                            ],
                                            [
                                                'Company',
                                                employment.company_name,
                                            ],
                                            ['Job title', employment.job_title],
                                            [
                                                'Employment type',
                                                employment.employment_type,
                                            ],
                                            [
                                                'Hiring date',
                                                formatDate(
                                                    employment.hiring_date,
                                                ),
                                            ],
                                        ]}
                                    />

                                    <div className="mt-5 rounded-2xl border border-[#D1D9DA] bg-[#F7F8FA] p-4 dark:border-white/10 dark:bg-white/[0.04]">
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                            <div>
                                                <p className="font-semibold text-[#061F39] dark:text-white">
                                                    {employment.salary_proof_original_name ||
                                                        'Salary proof'}
                                                </p>
                                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                    {employment.salary_proof_mime_type ||
                                                        'Private file'}{' '}
                                                    ·{' '}
                                                    {fileSize(
                                                        employment.salary_proof_size,
                                                    )}
                                                </p>
                                            </div>
                                            <a
                                                href={
                                                    employment.salary_proof_url
                                                }
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#082F54] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#061F39] dark:bg-[#0A6474]"
                                            >
                                                <Download className="h-4 w-4" />
                                                View proof
                                            </a>
                                        </div>
                                        <p className="mt-3 text-xs font-medium text-[#0A6474] dark:text-cyan-200">
                                            Protected route. No private storage
                                            path is exposed.
                                        </p>
                                    </div>
                                </Panel>
                            </section>

                            <section className="grid gap-6 lg:grid-cols-2">
                                <Panel icon={Landmark} title="Bank Account">
                                    <InfoGrid
                                        items={[
                                            [
                                                'Account',
                                                account.account_number_masked,
                                            ],
                                            ['RIB', account.rib_masked],
                                            [
                                                'Current balance',
                                                formatCurrency(
                                                    account.balance,
                                                    account.currency || 'MAD',
                                                ),
                                            ],
                                            ['Currency', account.currency],
                                            [
                                                'Status',
                                                titleCase(account.status),
                                            ],
                                            [
                                                'Account age',
                                                accountAge(account.opened_at),
                                            ],
                                        ]}
                                    />
                                </Panel>

                                <Panel
                                    icon={TrendingUp}
                                    title="Banking Behavior"
                                >
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <Metric
                                            label="AutoPay obligations"
                                            value={formatCurrency(
                                                sum(
                                                    behavior.autopay_obligations,
                                                    'amount',
                                                ),
                                            )}
                                        />
                                        <Metric
                                            label="Failed/skipped bills"
                                            value={
                                                (
                                                    behavior.failed_bill_payments ||
                                                    []
                                                ).length
                                            }
                                        />
                                        <Metric
                                            label="Completed transfers"
                                            value={
                                                behavior.transfer_summary
                                                    ?.completed_count || 0
                                            }
                                        />
                                        <Metric
                                            label="ATM withdrawals"
                                            value={
                                                behavior.atm_summary
                                                    ?.completed_count || 0
                                            }
                                        />
                                    </div>
                                </Panel>
                            </section>

                            <Panel icon={Building2} title="Project Details">
                                <div className="grid gap-4 lg:grid-cols-3">
                                    <InfoGrid
                                        items={[
                                            [
                                                'Project name',
                                                project.project_name,
                                            ],
                                            [
                                                'Project type',
                                                titleCase(project.project_type),
                                            ],
                                            [
                                                'Location',
                                                project.project_location,
                                            ],
                                            [
                                                'Experience',
                                                project.has_experience_in_field
                                                    ? 'Yes'
                                                    : 'No',
                                            ],
                                            [
                                                'Needs equipment',
                                                project.needs_equipment
                                                    ? 'Yes'
                                                    : 'No',
                                            ],
                                            [
                                                'Repayment',
                                                `${project.repayment_months || 0} months`,
                                            ],
                                        ]}
                                    />
                                    <InfoGrid
                                        items={[
                                            [
                                                'Requested amount',
                                                formatCurrency(
                                                    project.requested_amount,
                                                ),
                                            ],
                                            [
                                                'Expected revenue',
                                                formatCurrency(
                                                    project.expected_monthly_revenue,
                                                ),
                                            ],
                                            [
                                                'Expected expenses',
                                                formatCurrency(
                                                    project.expected_monthly_expenses,
                                                ),
                                            ],
                                            [
                                                'Expected profit',
                                                formatCurrency(
                                                    project.expected_monthly_profit,
                                                ),
                                            ],
                                        ]}
                                    />
                                    <div className="rounded-2xl border border-[#D1D9DA] bg-[#F7F8FA] p-4 dark:border-white/10 dark:bg-white/[0.04]">
                                        <p className="text-xs font-semibold tracking-[0.12em] text-[#0A6474] uppercase dark:text-cyan-200">
                                            Summary
                                        </p>
                                        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                                            {project.project_description ||
                                                'No description provided.'}
                                        </p>
                                        {project.why_this_project && (
                                            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                                                {project.why_this_project}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </Panel>

                            <Panel
                                icon={ReceiptText}
                                title="Recent Banking Activity"
                            >
                                <div className="grid gap-5 lg:grid-cols-2">
                                    <MiniList
                                        title="Latest transactions"
                                        empty="No transactions found."
                                        rows={(
                                            behavior.latest_transactions || []
                                        ).map((transaction) => ({
                                            title: `${titleCase(transaction.type)} · ${titleCase(transaction.direction)}`,
                                            meta: `${formatCurrency(transaction.amount)} · ${titleCase(transaction.status)} · ${formatDate(transaction.performed_at)}`,
                                        }))}
                                    />
                                    <MiniList
                                        title="AutoPay obligations"
                                        empty="No active AutoPay obligations."
                                        rows={(
                                            behavior.autopay_obligations || []
                                        ).map((bill) => ({
                                            title:
                                                bill.label ||
                                                bill.provider_name,
                                            meta: `${formatCurrency(bill.amount)} · ${titleCase(bill.frequency)} · due ${formatDate(bill.next_due_at)}`,
                                        }))}
                                    />
                                    <MiniList
                                        title="Failed/skipped bills"
                                        empty="No failed or skipped bill payments."
                                        rows={(
                                            behavior.failed_bill_payments || []
                                        ).map((payment) => ({
                                            title: titleCase(payment.status),
                                            meta: `${formatCurrency(payment.amount)} · ${payment.failure_reason || 'No reason'} · ${formatDate(payment.created_at)}`,
                                        }))}
                                    />
                                    <MiniList
                                        title="Additional documents"
                                        empty="No additional documents uploaded."
                                        rows={(application.documents || []).map(
                                            (document) => ({
                                                title: document.original_name,
                                                meta: `${titleCase(document.document_type)} · ${titleCase(document.status)} · ${fileSize(document.size)}`,
                                                href: document.view_url,
                                            }),
                                        )}
                                    />
                                </div>
                            </Panel>
                        </div>

                        <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
                            <RiskPanel risk={risk} />

                            <Panel icon={MailCheck} title="Decision Panel">
                                <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                                    Send the next step to the customer. This
                                    does not approve a final loan and does not
                                    disburse money.
                                </p>

                                <div className="mt-4 grid grid-cols-2 gap-2">
                                    <ActionTab
                                        active={activeAction === 'full'}
                                        onClick={() => setActiveAction('full')}
                                        label="Full"
                                    />
                                    <ActionTab
                                        active={activeAction === 'lower'}
                                        onClick={() => setActiveAction('lower')}
                                        label="Lower"
                                    />
                                    <ActionTab
                                        active={activeAction === 'reject'}
                                        onClick={() =>
                                            setActiveAction('reject')
                                        }
                                        label="Reject"
                                    />
                                    <ActionTab
                                        active={activeAction === 'docs'}
                                        onClick={() => setActiveAction('docs')}
                                        label="Documents"
                                    />
                                </div>

                                {activeAction === 'full' && (
                                    <form
                                        onSubmit={preApproveFull}
                                        className="mt-5 space-y-4"
                                    >
                                        <OfferSummary
                                            amount={project.requested_amount}
                                            months={project.repayment_months}
                                        />
                                        <Textarea
                                            label="Decision note"
                                            value={fullForm.data.decision_note}
                                            onChange={(value) =>
                                                fullForm.setData(
                                                    'decision_note',
                                                    value,
                                                )
                                            }
                                            error={
                                                fullForm.errors.decision_note
                                            }
                                        />
                                        <SubmitButton
                                            processing={fullForm.processing}
                                            icon={CheckCircle2}
                                            label="Pre-approve full amount"
                                        />
                                    </form>
                                )}

                                {activeAction === 'lower' && (
                                    <form
                                        onSubmit={preApproveLower}
                                        className="mt-5 space-y-4"
                                    >
                                        <Field
                                            label="Offered amount"
                                            error={
                                                lowerForm.errors.offered_amount
                                            }
                                        >
                                            <input
                                                className="field"
                                                type="number"
                                                min="1"
                                                max={
                                                    project.requested_amount ||
                                                    undefined
                                                }
                                                value={
                                                    lowerForm.data
                                                        .offered_amount
                                                }
                                                onChange={(event) =>
                                                    lowerForm.setData(
                                                        'offered_amount',
                                                        event.target.value,
                                                    )
                                                }
                                            />
                                        </Field>
                                        <Field
                                            label="Offered repayment months"
                                            error={
                                                lowerForm.errors
                                                    .offered_repayment_months
                                            }
                                        >
                                            <input
                                                className="field"
                                                type="number"
                                                min="1"
                                                max="120"
                                                value={
                                                    lowerForm.data
                                                        .offered_repayment_months
                                                }
                                                onChange={(event) =>
                                                    lowerForm.setData(
                                                        'offered_repayment_months',
                                                        event.target.value,
                                                    )
                                                }
                                            />
                                        </Field>
                                        <Metric
                                            label="Estimated monthly installment"
                                            value={`${formatCurrency(lowerInstallment)} / month`}
                                        />
                                        <Textarea
                                            label="Decision note"
                                            value={lowerForm.data.decision_note}
                                            onChange={(value) =>
                                                lowerForm.setData(
                                                    'decision_note',
                                                    value,
                                                )
                                            }
                                            error={
                                                lowerForm.errors.decision_note
                                            }
                                        />
                                        <SubmitButton
                                            processing={lowerForm.processing}
                                            icon={Send}
                                            label="Send lower offer"
                                        />
                                    </form>
                                )}

                                {activeAction === 'reject' && (
                                    <form
                                        onSubmit={reject}
                                        className="mt-5 space-y-4"
                                    >
                                        <Textarea
                                            required
                                            label="Decision note"
                                            value={
                                                rejectForm.data.decision_note
                                            }
                                            onChange={(value) =>
                                                rejectForm.setData(
                                                    'decision_note',
                                                    value,
                                                )
                                            }
                                            error={
                                                rejectForm.errors.decision_note
                                            }
                                        />
                                        <SubmitButton
                                            processing={rejectForm.processing}
                                            icon={XCircle}
                                            label="Reject application"
                                            tone="danger"
                                        />
                                    </form>
                                )}

                                {activeAction === 'docs' && (
                                    <form
                                        onSubmit={requestDocuments}
                                        className="mt-5 space-y-4"
                                    >
                                        <Textarea
                                            required
                                            label="Required documents note"
                                            value={
                                                docsForm.data
                                                    .required_documents_note
                                            }
                                            onChange={(value) =>
                                                docsForm.setData(
                                                    'required_documents_note',
                                                    value,
                                                )
                                            }
                                            error={
                                                docsForm.errors
                                                    .required_documents_note
                                            }
                                        />
                                        <SubmitButton
                                            processing={docsForm.processing}
                                            icon={FileQuestion}
                                            label="Request documents"
                                            tone="accent"
                                        />
                                    </form>
                                )}
                            </Panel>

                            {(offer.offered_amount ||
                                application.decision_note ||
                                application.required_documents_note) && (
                                <Panel
                                    icon={ClipboardCheck}
                                    title="Current Decision"
                                >
                                    <InfoGrid
                                        items={[
                                            [
                                                'Offered amount',
                                                offer.offered_amount
                                                    ? formatCurrency(
                                                          offer.offered_amount,
                                                      )
                                                    : 'Not sent',
                                            ],
                                            [
                                                'Repayment',
                                                offer.offered_repayment_months
                                                    ? `${offer.offered_repayment_months} months`
                                                    : 'Not sent',
                                            ],
                                            [
                                                'Installment',
                                                offer.offered_monthly_installment
                                                    ? `${formatCurrency(offer.offered_monthly_installment)} / month`
                                                    : 'Not sent',
                                            ],
                                            [
                                                'Reviewed at',
                                                formatDate(
                                                    application.reviewed_at,
                                                ),
                                            ],
                                        ]}
                                    />
                                    {application.decision_note && (
                                        <Note
                                            title="Decision note"
                                            text={application.decision_note}
                                        />
                                    )}
                                    {application.required_documents_note && (
                                        <Note
                                            title="Required documents"
                                            text={
                                                application.required_documents_note
                                            }
                                        />
                                    )}
                                </Panel>
                            )}
                        </aside>
                    </div>
                </div>
            </main>
        </>
    );
}

function Header({ application, project, customer, risk }) {
    return (
        <section className="admin-show-reveal relative overflow-hidden rounded-[2rem] border border-[#D1D9DA]/75 bg-white p-6 shadow-[0_24px_70px_rgba(6,31,57,0.08)] dark:border-white/10 dark:bg-white/[0.055] dark:shadow-[0_24px_80px_rgba(0,0,0,0.22)] lg:p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_12%,rgba(212,162,60,0.17),transparent_30%),radial-gradient(circle_at_88%_18%,rgba(10,100,116,0.18),transparent_34%)]" />

            <div className="relative grid gap-6 lg:grid-cols-[1fr_380px] lg:items-center">
                <div>
                    <div className="flex flex-wrap gap-2">
                        <StatusBadge status={application.status} />
                        <RiskBadge
                            level={risk.risk_level}
                            score={risk.risk_score}
                        />
                    </div>
                    <h1 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight text-[#061F39] dark:text-white sm:text-4xl">
                        {project.project_name || 'Machrou3i dossier'}
                    </h1>
                    <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                        {customer.name} · {customer.email}
                    </p>
                </div>

                <div className="rounded-[1.4rem] border border-white/10 bg-[#061F39] p-5 text-white shadow-[0_20px_65px_rgba(6,31,57,0.25)]">
                    <p className="text-xs tracking-[0.18em] text-white/50 uppercase">
                        Dossier review
                    </p>
                    <p className="mt-2 text-2xl font-semibold">
                        {formatCurrency(project.requested_amount)}
                    </p>
                    <p className="mt-1 text-sm text-white/55">
                        requested over {project.repayment_months || 0} months
                    </p>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
                            <p className="text-[11px] text-white/50">Risk</p>
                            <p className="mt-1 text-sm font-semibold">
                                {titleCase(risk.risk_level)}
                            </p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
                            <p className="text-[11px] text-white/50">Score</p>
                            <p className="mt-1 text-sm font-semibold">
                                {risk.risk_score ?? 0}/100
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

function MetricCard({ icon: Icon, label, value, variant = 'light' }) {
    const isDark = variant === 'dark';

    return (
        <motion.div
            className={`admin-show-reveal relative overflow-hidden rounded-2xl border p-5 ${
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
                    <p className="mt-2 text-xl font-semibold tracking-tight">
                        {value}
                    </p>
                </div>
            </div>
        </motion.div>
    );
}

function RiskPanel({ risk }) {
    const reasons = risk.reasons || [];

    return (
        <Panel icon={ShieldCheck} title="Risk Analysis">
            <div className="flex flex-col items-center rounded-2xl border border-[#D1D9DA] bg-[#F7F8FA] p-5 text-center dark:border-white/10 dark:bg-white/[0.04]">
                <RiskRing
                    score={risk.risk_score || 0}
                    level={risk.risk_level}
                />
                <p className="mt-4 text-sm font-semibold tracking-[0.12em] text-[#0A6474] uppercase dark:text-cyan-200">
                    Risk level
                </p>
                <p className="mt-1 text-2xl font-semibold text-[#061F39] dark:text-white">
                    {titleCase(risk.risk_level)}
                </p>
            </div>
            <div className="mt-4 grid gap-3">
                <Metric
                    label="Suggested amount"
                    value={
                        risk.suggested_amount
                            ? formatCurrency(risk.suggested_amount)
                            : 'Pending'
                    }
                />
                <Metric
                    label="Suggested installment"
                    value={
                        risk.suggested_monthly_installment
                            ? `${formatCurrency(risk.suggested_monthly_installment)} / month`
                            : 'Pending'
                    }
                />
                <Metric
                    label="Debt-to-income ratio"
                    value={
                        risk.debt_to_income_ratio !== null &&
                        risk.debt_to_income_ratio !== undefined
                            ? `${(Number(risk.debt_to_income_ratio) * 100).toFixed(1)}%`
                            : 'Pending'
                    }
                />
                <Metric
                    label="Safe remaining income"
                    value={
                        risk.safe_remaining_income
                            ? formatCurrency(risk.safe_remaining_income)
                            : 'Pending'
                    }
                />
            </div>
            <div className="mt-5 rounded-2xl border border-[#D1D9DA] bg-white p-4 dark:border-white/10 dark:bg-white/[0.04]">
                <h3 className="font-semibold text-[#061F39] dark:text-white">
                    Reasons
                </h3>
                <ul className="mt-3 space-y-2 text-sm">
                    {reasons.length ? (
                        reasons.map((reason) => (
                            <li
                                key={reason}
                                className="flex gap-2 text-slate-600 dark:text-slate-300"
                            >
                                {String(reason).startsWith('-') ? (
                                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                                ) : (
                                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#0A6474] dark:text-cyan-200" />
                                )}
                                <span>{reason}</span>
                            </li>
                        ))
                    ) : (
                        <li className="text-slate-500 dark:text-slate-400">
                            No risk reasons recorded yet.
                        </li>
                    )}
                </ul>
            </div>
        </Panel>
    );
}

function Panel({ icon: Icon, title, children }) {
    return (
        <motion.section
            className="admin-show-reveal rounded-[1.6rem] border border-[#D1D9DA]/75 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.055]"
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2 }}
        >
            <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#082F54]/10 text-[#082F54] dark:bg-cyan-200/10 dark:text-cyan-100">
                    <Icon className="h-5 w-5" />
                </div>
                <h2 className="font-semibold text-[#061F39] dark:text-white">
                    {title}
                </h2>
            </div>
            {children}
        </motion.section>
    );
}

function InfoGrid({ items }) {
    return (
        <dl className="grid gap-3">
            {items.map(([label, value]) => (
                <div
                    key={label}
                    className="admin-show-row rounded-2xl border border-[#D1D9DA] bg-[#F7F8FA] px-4 py-3 dark:border-white/10 dark:bg-white/[0.04]"
                >
                    <dt className="text-xs font-semibold tracking-[0.12em] text-[#0A6474] uppercase dark:text-cyan-200">
                        {label}
                    </dt>
                    <dd className="mt-1 text-sm font-semibold break-words text-[#061F39] dark:text-white">
                        {value || 'Not available'}
                    </dd>
                </div>
            ))}
        </dl>
    );
}

function Metric({ label, value }) {
    return (
        <div className="rounded-2xl border border-[#D1D9DA] bg-white px-4 py-3 dark:border-white/10 dark:bg-white/[0.04]">
            <p className="text-xs font-semibold tracking-[0.12em] text-[#0A6474] uppercase dark:text-cyan-200">
                {label}
            </p>
            <p className="mt-1 text-sm font-semibold text-[#061F39] dark:text-white">
                {value}
            </p>
        </div>
    );
}

function MiniList({ title, rows, empty }) {
    return (
        <div className="rounded-2xl border border-[#D1D9DA] bg-[#F7F8FA] p-4 dark:border-white/10 dark:bg-white/[0.04]">
            <h3 className="font-semibold text-[#061F39] dark:text-white">
                {title}
            </h3>
            <div className="mt-3 space-y-3">
                {rows.length ? (
                    rows.map((row, index) => (
                        <div
                            key={`${row.title}-${index}`}
                            className="rounded-2xl bg-white px-3 py-2 dark:bg-white/[0.05]"
                        >
                            {row.href ? (
                                <a
                                    href={row.href}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="font-semibold text-[#082F54] dark:text-cyan-100"
                                >
                                    {row.title}
                                </a>
                            ) : (
                                <p className="font-semibold text-[#061F39] dark:text-white">
                                    {row.title}
                                </p>
                            )}
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                {row.meta}
                            </p>
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        {empty}
                    </p>
                )}
            </div>
        </div>
    );
}

function RiskRing({ score, level }) {
    const color = riskTone(level).color;
    const normalizedScore = Math.max(0, Math.min(100, Number(score || 0)));

    return (
        <div
            className="flex h-36 w-36 items-center justify-center rounded-full"
            style={{
                background: `conic-gradient(${color} ${normalizedScore * 3.6}deg, rgba(209,217,218,0.55) 0deg)`,
            }}
        >
            <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-white dark:bg-[#061F39]">
                <span className="text-3xl font-semibold text-[#061F39] dark:text-white">
                    {normalizedScore}
                </span>
                <span className="text-xs font-semibold tracking-[0.12em] text-slate-500 uppercase dark:text-slate-400">
                    of 100
                </span>
            </div>
        </div>
    );
}

function ActionTab({ active, onClick, label }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                active
                    ? 'border-[#082F54] bg-[#082F54] text-white dark:border-[#0A6474] dark:bg-[#0A6474]'
                    : 'border-[#D1D9DA] bg-white text-[#082F54] hover:border-[#D4A23C] dark:border-white/10 dark:bg-white/10 dark:text-white'
            }`}
        >
            {label}
        </button>
    );
}

function Field({ label, error, children }) {
    return (
        <label className="block">
            <span className="text-sm font-semibold text-[#061F39] dark:text-white">
                {label}
            </span>
            <div className="mt-2">{children}</div>
            {error && (
                <span className="mt-1 block text-sm font-medium text-rose-600">
                    {error}
                </span>
            )}
        </label>
    );
}

function Textarea({ label, value, onChange, error, required = false }) {
    return (
        <label className="block">
            <span className="text-sm font-semibold text-[#061F39] dark:text-white">
                {label}
                {required ? ' *' : ''}
            </span>
            <textarea
                value={value}
                onChange={(event) => onChange(event.target.value)}
                required={required}
                className="field mt-2 min-h-28 resize-none"
                placeholder="Write concise customer-facing wording."
            />
            {error && (
                <span className="mt-1 block text-sm font-medium text-rose-600">
                    {error}
                </span>
            )}
        </label>
    );
}

function SubmitButton({ processing, icon: Icon, label, tone = 'primary' }) {
    const styles = {
        primary:
            'bg-[#082F54] text-white hover:bg-[#061F39] dark:bg-[#0A6474] dark:hover:bg-[#0b788d]',
        danger: 'bg-rose-700 text-white hover:bg-rose-800',
        accent: 'bg-[#D4A23C] text-[#061F39] hover:bg-[#c39333]',
    };

    return (
        <motion.button
            type="submit"
            disabled={processing}
            className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${styles[tone]}`}
            whileHover={{ y: processing ? 0 : -2 }}
            whileTap={{ scale: processing ? 1 : 0.98 }}
        >
            <Icon className="h-4 w-4" />
            {processing ? 'Sending...' : label}
        </motion.button>
    );
}

function OfferSummary({ amount, months }) {
    const installment = Number(amount || 0) / Math.max(1, Number(months || 1));

    return (
        <div className="rounded-2xl border border-[#D4A23C]/40 bg-[#D4A23C]/10 p-4">
            <p className="text-sm font-semibold text-[#061F39] dark:text-white">
                Pre-approve full requested amount
            </p>
            <div className="mt-3 grid gap-3">
                <Metric label="Amount" value={formatCurrency(amount)} />
                <Metric label="Repayment" value={`${months || 0} months`} />
                <Metric
                    label="Estimated installment"
                    value={`${formatCurrency(installment)} / month`}
                />
            </div>
        </div>
    );
}

function Note({ title, text }) {
    return (
        <div className="mt-4 rounded-2xl border border-[#D1D9DA] bg-[#F7F8FA] px-4 py-3 dark:border-white/10 dark:bg-white/[0.04]">
            <p className="text-xs font-semibold tracking-[0.12em] text-[#0A6474] uppercase dark:text-cyan-200">
                {title}
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {text}
            </p>
        </div>
    );
}

function RiskBadge({ level, score }) {
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${riskTone(level).chip}`}
        >
            <ShieldCheck className="h-3.5 w-3.5" />
            {level ? `${titleCase(level)} · ${score ?? 0}/100` : 'Risk pending'}
        </span>
    );
}

function StatusBadge({ status }) {
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${statusTone(status)}`}
        >
            <BadgeCheck className="h-3.5 w-3.5" />
            {titleCase(status)}
        </span>
    );
}
