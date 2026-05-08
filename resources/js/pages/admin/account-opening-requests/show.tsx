import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowLeft,
    BadgeCheck,
    Building2,
    CalendarClock,
    CheckCircle2,
    ClipboardCheck,
    Download,
    Eye,
    FileCheck2,
    FileText,
    ImageIcon,
    Landmark,
    Mail,
    MapPin,
    Phone,
    Send,
    ShieldCheck,
    Sparkles,
    UserRoundCheck,
    X,
    XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ComponentType, ReactNode } from 'react';
import { motion } from 'motion/react';
import { gsap } from 'gsap';

/* ── CIM Palette ── */
const CIM = {
    primary: '#082F54',
    secondary: '#0A6474',
    accent: '#D4A23C',
    dark: '#061F39',
    bg: '#F7F8FA',
    white: '#FFFFFF',
    border: '#D1D9DA',
};

/* ── Types ── */
type Doc = {
    id: number;
    document_type: string;
    original_name: string | null;
    mime_type: string | null;
    status: string;
};

type Profile = {
    cin: string;
    first_name: string;
    last_name: string;
    phone: string;
    birth_date: string | null;
    address: string | null;
    city: string | null;
    employment_status: string;
    status: string;
    verified_at: string | null;
};

type Branch = { name: string; city: string };

type Appointment = {
    id: number;
    scheduled_at: string;
    status: string;
    notes: string | null;
} | null;

type User = { id: number; name: string; email: string; phone: string };

type AOR = {
    id: number;
    request_number: string;
    account_type: string;
    status: string;
    rejection_reason: string | null;
    submitted_at: string | null;
    reviewed_at: string | null;
};

type PageProps = {
    request: AOR;
    user: User;
    profile: Profile | null;
    branch: Branch | null;
    appointment: Appointment;
    documents: Doc[];
    flash?: { success?: string; error?: string };
};

const imageMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

function titleCase(value: string | null | undefined) {
    return String(value || 'pending')
        .replaceAll('_', ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value: string | null | undefined, withTime = false) {
    if (!value) {
        return 'Not available';
    }

    return new Intl.DateTimeFormat('en-MA', {
        weekday: withTime ? 'short' : undefined,
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: withTime ? '2-digit' : undefined,
        minute: withTime ? '2-digit' : undefined,
    }).format(new Date(value));
}

function formatTime(value: string | null | undefined) {
    if (!value) {
        return '—';
    }

    return new Intl.DateTimeFormat('en-MA', {
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value));
}

function documentUrl(doc: Doc): string {
    return `/admin/documents/${doc.id}/view`;
}

function isPreviewableImage(doc: Doc): boolean {
    const mimeType = doc.mime_type?.toLowerCase() ?? '';
    const fileName = doc.original_name?.toLowerCase() ?? '';

    return (
        imageMimeTypes.includes(mimeType) ||
        /\.(jpe?g|png|webp)$/.test(fileName)
    );
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
        scheduled:
            'border-sky-400/25 bg-sky-500/10 text-sky-700 dark:border-sky-300/20 dark:bg-sky-300/10 dark:text-sky-200',
        completed:
            'border-emerald-400/25 bg-emerald-500/10 text-emerald-700 dark:border-emerald-300/20 dark:bg-emerald-300/10 dark:text-emerald-200',
        missed:
            'border-rose-400/25 bg-rose-500/10 text-rose-700 dark:border-rose-300/20 dark:bg-rose-300/10 dark:text-rose-200',
        cancelled:
            'border-slate-300 bg-slate-100 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300',
        rejected:
            'border-rose-400/25 bg-rose-500/10 text-rose-700 dark:border-rose-300/20 dark:bg-rose-300/10 dark:text-rose-200',
    };

    return (
        tones[String(value || 'pending')] ||
        'border-slate-300 bg-slate-100 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300'
    );
}

function getStatusIcon(value: string | null | undefined) {
    const status = String(value || 'pending');

    if (['approved', 'account_created', 'verified', 'completed'].includes(status)) {
        return CheckCircle2;
    }

    if (['rejected', 'missed', 'cancelled'].includes(status)) {
        return XCircle;
    }

    if (['appointment_scheduled', 'scheduled', 'under_review'].includes(status)) {
        return CalendarClock;
    }

    return BadgeCheck;
}

export default function AccountOpeningRequestShow() {
    const {
        request: aor,
        user,
        profile,
        branch,
        appointment,
        documents,
        flash,
    } = usePage<{ props: PageProps }>().props as unknown as PageProps;

    const pageRef = useRef<HTMLElement | null>(null);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [rejectBusy, setRejectBusy] = useState(false);
    const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

    const cinFront = documents.find((document) => document.document_type === 'cin_front');
    const cinBack = documents.find((document) => document.document_type === 'cin_back');
    const otherDocs = documents.filter(
        (document) => !['cin_front', 'cin_back'].includes(document.document_type),
    );

    const isApproved = ['approved', 'account_created'].includes(aor.status);
    const isRejected = aor.status === 'rejected';
    const isPending = !isApproved && !isRejected;
    const apptDate = appointment ? new Date(appointment.scheduled_at) : null;

    const stats = useMemo(
        () => ({
            documents: documents.length,
            hasAppointment: Boolean(appointment),
            hasCinFront: Boolean(cinFront),
            hasCinBack: Boolean(cinBack),
        }),
        [appointment, cinBack, cinFront, documents.length],
    );

    const handleApprove = () => {
        if (
            !confirm(
                'Approve this request? This will verify the client, create their bank account and card.',
            )
        ) {
            return;
        }

        router.post(
            `/admin/account-opening-requests/${aor.id}/approve`,
            {},
            { preserveScroll: true },
        );
    };

    const handleMarkUnderReview = () => {
        if (!confirm('Mark this request as under review?')) {
            return;
        }

        router.post(
            `/admin/account-opening-requests/${aor.id}/under-review`,
            {},
            { preserveScroll: true },
        );
    };

    const handleReject = () => {
        if (!rejectionReason.trim()) {
            alert('Please enter a rejection reason.');

            return;
        }

        setRejectBusy(true);
        router.post(
            `/admin/account-opening-requests/${aor.id}/reject`,
            { rejection_reason: rejectionReason },
            {
                preserveScroll: true,
                onFinish: () => {
                    setRejectBusy(false);
                    setShowRejectModal(false);
                    setRejectionReason('');
                },
            },
        );
    };

    useEffect(() => {
        if (!pageRef.current) {
            return undefined;
        }

        const context = gsap.context(() => {
            gsap.fromTo(
                '.aor-show-reveal',
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
                '.aor-show-row',
                { autoAlpha: 0, x: -12 },
                {
                    autoAlpha: 1,
                    x: 0,
                    duration: 0.44,
                    stagger: 0.045,
                    delay: 0.22,
                    ease: 'power2.out',
                },
            );

            gsap.to('.aor-show-orb', {
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
            <Head title={`Request ${aor.request_number} — CIM Admin`} />

            {lightboxSrc && (
                <motion.div
                    className="fixed inset-0 z-[9999] flex cursor-zoom-out items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
                    onClick={() => setLightboxSrc(null)}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    <motion.img
                        src={lightboxSrc}
                        alt="Document preview"
                        className="max-h-[90vh] max-w-[92vw] rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.5)]"
                        initial={{ scale: 0.94, y: 12 }}
                        animate={{ scale: 1, y: 0 }}
                        onClick={(event) => event.stopPropagation()}
                    />
                    <button
                        type="button"
                        onClick={() => setLightboxSrc(null)}
                        className="absolute top-5 right-6 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </motion.div>
            )}

            {showRejectModal && (
                <motion.div
                    className="fixed inset-0 z-[999] flex items-center justify-center bg-[#061F39]/70 p-4 backdrop-blur-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    <motion.div
                        className="w-full max-w-lg rounded-[1.6rem] border border-[#D1D9DA] bg-white p-6 shadow-[0_24px_80px_rgba(0,0,0,0.24)] dark:border-white/10 dark:bg-[#061F39]"
                        initial={{ scale: 0.96, y: 14 }}
                        animate={{ scale: 1, y: 0 }}
                    >
                        <div className="flex items-start gap-3">
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600">
                                <XCircle className="h-5 w-5" />
                            </span>
                            <div>
                                <h2 className="text-xl font-semibold text-[#061F39] dark:text-white">
                                    Reject request
                                </h2>
                                <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                                    Please provide a clear reason. This will be recorded and the client's profile will be marked as rejected.
                                </p>
                            </div>
                        </div>

                        <textarea
                            rows={5}
                            value={rejectionReason}
                            onChange={(event) => setRejectionReason(event.target.value)}
                            placeholder="e.g. CIN document unclear, information mismatch..."
                            className="mt-5 min-h-32 w-full resize-none rounded-2xl border border-[#D1D9DA] bg-[#F7F8FA] px-4 py-3 text-sm font-medium text-[#061F39] outline-none transition focus:border-[#D4A23C] focus:ring-4 focus:ring-[#D4A23C]/15 dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
                        />

                        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowRejectModal(false);
                                    setRejectionReason('');
                                }}
                                className="h-11 rounded-xl border border-[#D1D9DA] bg-white px-5 text-sm font-semibold text-[#082F54] transition hover:border-[#D4A23C] dark:border-white/10 dark:bg-white/10 dark:text-white"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleReject}
                                disabled={rejectBusy || !rejectionReason.trim()}
                                className="h-11 rounded-xl bg-rose-700 px-5 text-sm font-semibold text-white transition hover:bg-rose-800 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {rejectBusy ? 'Rejecting...' : 'Confirm reject'}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}

            <main
                ref={pageRef}
                className="relative min-h-screen overflow-hidden bg-[#F7F8FA] px-4 py-6 text-[#061F39] sm:px-6 lg:px-8 dark:bg-[#061F39]"
            >
                <div className="aor-show-orb pointer-events-none absolute -top-28 right-10 h-72 w-72 rounded-full bg-[#0A6474]/15 blur-3xl dark:bg-[#0A6474]/25" />
                <div className="aor-show-orb pointer-events-none absolute top-[44rem] -left-24 h-72 w-72 rounded-full bg-[#D4A23C]/10 blur-3xl dark:bg-[#D4A23C]/15" />

                <div className="relative mx-auto flex max-w-7xl flex-col gap-6">
                    <Link
                        href="/admin/account-opening-requests"
                        className="aor-show-reveal inline-flex w-fit items-center gap-2 rounded-2xl border border-[#D1D9DA]/70 bg-white px-4 py-2 text-sm font-semibold text-[#082F54] shadow-sm transition hover:-translate-y-0.5 hover:border-[#D4A23C] dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to all requests
                    </Link>

                    {flash?.success && (
                        <motion.div
                            className="aor-show-reveal rounded-2xl border border-emerald-300/30 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-700 dark:text-emerald-200"
                            initial={{ scale: 0.98 }}
                            animate={{ scale: 1 }}
                        >
                            {flash.success}
                        </motion.div>
                    )}

                    {flash?.error && (
                        <motion.div
                            className="aor-show-reveal rounded-2xl border border-rose-300/30 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-700 dark:text-rose-200"
                            initial={{ scale: 0.98 }}
                            animate={{ scale: 1 }}
                        >
                            {flash.error}
                        </motion.div>
                    )}

                    <Hero
                        aor={aor}
                        user={user}
                        profile={profile}
                        branch={branch}
                        appointment={appointment}
                        stats={stats}
                    />

                    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <StatCard
                            icon={ClipboardCheck}
                            label="Request status"
                            value={titleCase(aor.status)}
                            variant="dark"
                        />
                        <StatCard
                            icon={ShieldCheck}
                            label="Verification"
                            value={titleCase(profile?.status || 'pending')}
                        />
                        <StatCard
                            icon={FileCheck2}
                            label="Documents"
                            value={`${documents.length} uploaded`}
                        />
                        <StatCard
                            icon={CalendarClock}
                            label="Appointment"
                            value={appointment ? titleCase(appointment.status) : 'Not booked'}
                        />
                    </section>

                    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
                        <div className="space-y-6">
                            <section className="grid gap-6 lg:grid-cols-2">
                                <Panel icon={UserRoundCheck} title="Client Information">
                                    <InfoGrid>
                                        <InfoTile label="Full Name" value={user?.name} />
                                        <InfoTile label="Email" value={user?.email} icon={Mail} />
                                        <InfoTile label="Phone" value={user?.phone || profile?.phone || '—'} icon={Phone} />
                                        <InfoTile
                                            label="Date of Birth"
                                            value={
                                                profile?.birth_date
                                                    ? formatDate(profile.birth_date)
                                                    : '—'
                                            }
                                        />
                                        <InfoTile label="Address" value={profile?.address || '—'} />
                                        <InfoTile label="City" value={profile?.city || '—'} />
                                        <InfoTile label="CIN Number" value={profile?.cin || '—'} strong />
                                        <InfoTile label="Profession / Job" value={profile?.employment_status || '—'} />
                                    </InfoGrid>
                                </Panel>

                                <Panel icon={CalendarClock} title="Appointment Details">
                                    {appointment && apptDate ? (
                                        <InfoGrid>
                                            <InfoTile label="Date" value={formatDate(appointment.scheduled_at)} />
                                            <InfoTile label="Time" value={formatTime(appointment.scheduled_at)} />
                                            <InfoTile
                                                label="Branch"
                                                value={branch ? `${branch.name} — ${branch.city}` : '—'}
                                                icon={MapPin}
                                            />
                                            <div className="rounded-2xl border border-[#D1D9DA] bg-[#F7F8FA] px-4 py-3 dark:border-white/10 dark:bg-white/[0.04]">
                                                <p className="text-xs font-semibold tracking-[0.12em] text-[#0A6474] uppercase dark:text-cyan-200">
                                                    Appointment Status
                                                </p>
                                                <div className="mt-2">
                                                    <StatusPill value={appointment.status} />
                                                </div>
                                            </div>
                                            {appointment.notes && (
                                                <InfoTile label="Notes" value={appointment.notes} />
                                            )}
                                        </InfoGrid>
                                    ) : (
                                        <EmptyState
                                            icon={CalendarClock}
                                            title="No appointment booked yet"
                                            text="The customer has not scheduled an in-branch verification appointment."
                                        />
                                    )}
                                </Panel>
                            </section>

                            <Panel icon={FileText} title="Identity Documents">
                                {cinFront || cinBack ? (
                                    <div className="grid gap-4 lg:grid-cols-2">
                                        {[
                                            {
                                                doc: cinFront,
                                                label: 'CIN Front',
                                            },
                                            { doc: cinBack, label: 'CIN Back' },
                                        ].map(({ doc, label }) => (
                                            <DocumentSlot
                                                key={label}
                                                doc={doc}
                                                label={label}
                                                onPreview={setLightboxSrc}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <EmptyState
                                        icon={ImageIcon}
                                        title="No CIN documents uploaded"
                                        text="Front and back identity document previews will appear here."
                                    />
                                )}

                                {otherDocs.length > 0 && (
                                    <div className="mt-5">
                                        <p className="mb-3 text-xs font-semibold tracking-[0.12em] text-[#0A6474] uppercase dark:text-cyan-200">
                                            Other Documents
                                        </p>
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            {otherDocs.map((document) => (
                                                <a
                                                    key={document.id}
                                                    href={documentUrl(document)}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="flex items-center justify-between gap-3 rounded-2xl border border-[#D1D9DA] bg-[#F7F8FA] px-4 py-3 text-sm font-semibold text-[#082F54] transition hover:border-[#D4A23C] dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
                                                >
                                                    <span className="truncate">
                                                        {document.original_name || titleCase(document.document_type)}
                                                    </span>
                                                    <Download className="h-4 w-4 shrink-0 text-[#D4A23C]" />
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </Panel>

                            {isRejected && aor.rejection_reason && (
                                <motion.div
                                    className="aor-show-reveal rounded-[1.6rem] border border-rose-300/30 bg-rose-500/10 p-5"
                                    whileHover={{ y: -2 }}
                                >
                                    <div className="flex items-start gap-3">
                                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-200">
                                            <AlertTriangle className="h-5 w-5" />
                                        </span>
                                        <div>
                                            <p className="text-xs font-semibold tracking-[0.12em] text-rose-700 uppercase dark:text-rose-200">
                                                Rejection Reason
                                            </p>
                                            <p className="mt-2 text-sm leading-6 text-rose-800 dark:text-rose-100">
                                                {aor.rejection_reason}
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
                            <StatusPanel
                                aor={aor}
                                profile={profile}
                                appointment={appointment}
                            />

                            <RequestInfoPanel
                                aor={aor}
                                branch={branch}
                                documentsCount={documents.length}
                            />

                            <ActionsPanel
                                aor={aor}
                                isApproved={isApproved}
                                isRejected={isRejected}
                                isPending={isPending}
                                onApprove={handleApprove}
                                onMarkUnderReview={handleMarkUnderReview}
                                onReject={() => setShowRejectModal(true)}
                            />
                        </aside>
                    </div>
                </div>
            </main>
        </>
    );
}

function Hero({
    aor,
    user,
    profile,
    branch,
    appointment,
    stats,
}: {
    aor: AOR;
    user: User;
    profile: Profile | null;
    branch: Branch | null;
    appointment: Appointment;
    stats: {
        documents: number;
        hasAppointment: boolean;
        hasCinFront: boolean;
        hasCinBack: boolean;
    };
}) {
    return (
        <section className="aor-show-reveal relative overflow-hidden rounded-[2rem] border border-[#D1D9DA]/75 bg-white p-6 shadow-[0_24px_70px_rgba(6,31,57,0.08)] dark:border-white/10 dark:bg-white/[0.055] dark:shadow-[0_24px_80px_rgba(0,0,0,0.22)] lg:p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_14%,rgba(212,162,60,0.18),transparent_30%),radial-gradient(circle_at_85%_18%,rgba(10,100,116,0.16),transparent_34%)] dark:bg-[radial-gradient(circle_at_16%_14%,rgba(212,162,60,0.16),transparent_30%),radial-gradient(circle_at_85%_18%,rgba(10,100,116,0.22),transparent_34%)]" />

            <div className="relative grid gap-8 lg:grid-cols-[1fr_390px] lg:items-center">
                <div>
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#D4A23C]/30 bg-[#D4A23C]/10 px-3 py-1 text-xs font-semibold tracking-[0.16em] text-[#082F54] uppercase dark:text-[#F5D58C]">
                        <Landmark className="h-3.5 w-3.5" />
                        Request Review
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <StatusPill value={aor.status} />
                        <StatusPill value={profile?.status || 'pending'} />
                    </div>

                    <h1 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight text-[#061F39] dark:text-white sm:text-4xl lg:text-5xl">
                        {aor.request_number}
                    </h1>

                    <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-300">
                        Review {user?.name || 'client'}’s onboarding dossier,
                        appointment, CIN documents, branch selection, and final
                        decision actions from one premium CIM workspace.
                    </p>

                    <div className="mt-6 flex flex-wrap gap-3">
                        <span className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#0A6474]/20 bg-[#0A6474]/10 px-4 text-sm font-semibold text-[#0A6474] dark:border-cyan-200/10 dark:bg-cyan-200/10 dark:text-cyan-100">
                            <Building2 className="h-4 w-4" />
                            {branch ? `${branch.name} · ${branch.city}` : 'No branch selected'}
                        </span>
                        <span className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#D4A23C]/30 bg-[#D4A23C]/10 px-4 text-sm font-semibold text-[#8A6418] dark:text-[#F5D58C]">
                            <Sparkles className="h-4 w-4" />
                            {stats.documents} uploaded document{stats.documents === 1 ? '' : 's'}
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
                                    Client dossier
                                </p>
                                <p className="mt-2 text-2xl font-semibold">
                                    {user?.name || 'CIM client'}
                                </p>
                                <p className="mt-1 text-sm text-white/55">
                                    {user?.email}
                                </p>
                            </div>
                            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-[#D4A23C]">
                                <UserRoundCheck className="h-5 w-5" />
                            </span>
                        </div>

                        <div className="mt-6 grid grid-cols-2 gap-3">
                            <HeroMetric
                                label="CIN Front"
                                value={stats.hasCinFront ? 'Ready' : 'Missing'}
                            />
                            <HeroMetric
                                label="CIN Back"
                                value={stats.hasCinBack ? 'Ready' : 'Missing'}
                            />
                            <HeroMetric
                                label="Appointment"
                                value={appointment ? titleCase(appointment.status) : 'None'}
                            />
                            <HeroMetric
                                label="Submitted"
                                value={formatDate(aor.submitted_at)}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

function HeroMetric({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
            <p className="text-xs text-white/50">{label}</p>
            <p className="mt-1 text-sm font-semibold">{value}</p>
        </div>
    );
}

function StatCard({
    icon: Icon,
    label,
    value,
    variant = 'light',
}: {
    icon: ComponentType<{ className?: string }>;
    label: string;
    value: string;
    variant?: 'light' | 'dark';
}) {
    const isDark = variant === 'dark';

    return (
        <motion.div
            className={`aor-show-reveal relative overflow-hidden rounded-2xl border p-5 ${
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
                    <p className={`text-sm ${isDark ? 'text-white/65' : 'text-slate-500 dark:text-slate-400'}`}>
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

function Panel({
    icon: Icon,
    title,
    children,
}: {
    icon: ComponentType<{ className?: string }>;
    title: string;
    children: ReactNode;
}) {
    return (
        <motion.section
            className="aor-show-reveal rounded-[1.6rem] border border-[#D1D9DA]/75 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.055]"
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

function InfoGrid({ children }: { children: ReactNode }) {
    return <div className="grid gap-3 sm:grid-cols-2">{children}</div>;
}

function InfoTile({
    label,
    value,
    icon: Icon,
    strong = false,
}: {
    label: string;
    value: ReactNode;
    icon?: ComponentType<{ className?: string }>;
    strong?: boolean;
}) {
    return (
        <div className="aor-show-row rounded-2xl border border-[#D1D9DA] bg-[#F7F8FA] px-4 py-3 dark:border-white/10 dark:bg-white/[0.04]">
            <p className="flex items-center gap-1.5 text-xs font-semibold tracking-[0.12em] text-[#0A6474] uppercase dark:text-cyan-200">
                {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
                {label}
            </p>
            <div
                className={`mt-1 text-sm break-words ${
                    strong
                        ? 'font-bold text-[#082F54] dark:text-[#D4A23C]'
                        : 'font-semibold text-[#061F39] dark:text-white'
                }`}
            >
                {value || '—'}
            </div>
        </div>
    );
}

function DocumentSlot({
    doc,
    label,
    onPreview,
}: {
    doc?: Doc;
    label: string;
    onPreview: (src: string) => void;
}) {
    if (!doc) {
        return (
            <div className="rounded-2xl border border-dashed border-[#D1D9DA] bg-[#F7F8FA] p-8 text-center dark:border-white/10 dark:bg-white/[0.04]">
                <ImageIcon className="mx-auto h-8 w-8 text-slate-400" />
                <p className="mt-3 text-sm font-semibold text-slate-500">
                    {label} not uploaded
                </p>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold tracking-[0.12em] text-[#0A6474] uppercase dark:text-cyan-200">
                    {label}
                </p>
                <StatusPill value={doc.status} />
            </div>
            <DocumentPreview doc={doc} label={label} onPreview={onPreview} />
            <a
                href={documentUrl(doc)}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[#0A6474] dark:text-cyan-200"
            >
                Open in new tab
                <Download className="h-3.5 w-3.5" />
            </a>
        </div>
    );
}

function DocumentPreview({
    doc,
    label,
    onPreview,
}: {
    doc: Doc;
    label: string;
    onPreview: (src: string) => void;
}) {
    const [previewFailed, setPreviewFailed] = useState(false);
    const url = documentUrl(doc);
    const canPreview = isPreviewableImage(doc) && !previewFailed;

    if (!canPreview) {
        return (
            <div className="rounded-2xl border border-dashed border-[#D1D9DA] bg-[#F7F8FA] p-8 text-center text-sm text-slate-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400">
                <FileText className="mx-auto mb-3 h-8 w-8 text-[#0A6474] dark:text-cyan-200" />
                Preview unavailable for this file type.
                <br />
                <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex font-bold text-[#0A6474] dark:text-cyan-200"
                >
                    Open file
                </a>
            </div>
        );
    }

    return (
        <motion.button
            type="button"
            onClick={() => onPreview(url)}
            className="group relative flex aspect-video w-full cursor-zoom-in items-center justify-center overflow-hidden rounded-2xl border border-[#D1D9DA] bg-[#F7F8FA] transition hover:border-[#D4A23C] dark:border-white/10 dark:bg-white/[0.04]"
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.98 }}
        >
            <img
                src={url}
                alt={label}
                className="h-full w-full bg-white object-contain"
                onError={() => setPreviewFailed(true)}
            />
            <span className="absolute right-3 bottom-3 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                <Eye className="h-3.5 w-3.5" />
                Enlarge
            </span>
        </motion.button>
    );
}

function EmptyState({
    icon: Icon,
    title,
    text,
}: {
    icon: ComponentType<{ className?: string }>;
    title: string;
    text: string;
}) {
    return (
        <div className="rounded-2xl border border-dashed border-[#D1D9DA] bg-[#F7F8FA] px-6 py-10 text-center dark:border-white/10 dark:bg-white/[0.04]">
            <Icon className="mx-auto mb-3 h-8 w-8 text-[#0A6474] dark:text-cyan-200" />
            <h3 className="font-semibold text-[#061F39] dark:text-white">
                {title}
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
                {text}
            </p>
        </div>
    );
}

function StatusPanel({
    aor,
    profile,
    appointment,
}: {
    aor: AOR;
    profile: Profile | null;
    appointment: Appointment;
}) {
    return (
        <Panel icon={ShieldCheck} title="Request Status">
            <div className="space-y-3">
                <StatusRow label="Request" value={aor.status} />
                <StatusRow label="Verification" value={profile?.status || 'pending'} />
                {appointment && (
                    <StatusRow label="Appointment" value={appointment.status} />
                )}
            </div>

            {aor.reviewed_at && (
                <div className="mt-4 border-t border-[#D1D9DA] pt-4 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
                    Last reviewed: {formatDate(aor.reviewed_at)}
                </div>
            )}
        </Panel>
    );
}

function RequestInfoPanel({
    aor,
    branch,
    documentsCount,
}: {
    aor: AOR;
    branch: Branch | null;
    documentsCount: number;
}) {
    return (
        <Panel icon={ClipboardCheck} title="Request Info">
            <div className="space-y-3">
                <InfoLine label="Request #" value={aor.request_number} mono />
                <InfoLine label="Account Type" value={titleCase(aor.account_type)} />
                <InfoLine label="Branch" value={branch ? branch.name : '—'} />
                <InfoLine label="Submitted" value={formatDate(aor.submitted_at)} />
                <InfoLine label="Documents" value={`${documentsCount} uploaded`} />
            </div>
        </Panel>
    );
}

function ActionsPanel({
    aor,
    isApproved,
    isRejected,
    isPending,
    onApprove,
    onMarkUnderReview,
    onReject,
}: {
    aor: AOR;
    isApproved: boolean;
    isRejected: boolean;
    isPending: boolean;
    onApprove: () => void;
    onMarkUnderReview: () => void;
    onReject: () => void;
}) {
    return (
        <Panel icon={Send} title="Actions">
            {isApproved && (
                <div className="rounded-2xl border border-emerald-300/30 bg-emerald-500/10 p-4 text-sm font-semibold text-emerald-700 dark:text-emerald-200">
                    Client verified and bank account created.
                </div>
            )}

            {isRejected && (
                <div className="rounded-2xl border border-rose-300/30 bg-rose-500/10 p-4 text-sm font-semibold text-rose-700 dark:text-rose-200">
                    This request has been rejected.
                </div>
            )}

            {isPending && (
                <div className="space-y-3">
                    {(aor.status === 'submitted' ||
                        aor.status === 'appointment_scheduled') && (
                        <motion.button
                            type="button"
                            onClick={onMarkUnderReview}
                            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#D4A23C]/40 bg-[#D4A23C]/10 px-4 text-sm font-semibold text-[#082F54] transition hover:border-[#D4A23C] dark:text-[#F5D58C]"
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <CalendarClock className="h-4 w-4" />
                            Mark Under Review
                        </motion.button>
                    )}

                    <motion.button
                        type="button"
                        onClick={onApprove}
                        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white shadow-lg shadow-emerald-600/15 transition hover:bg-emerald-700"
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <CheckCircle2 className="h-4 w-4" />
                        Approve & Verify Client
                    </motion.button>

                    <motion.button
                        type="button"
                        onClick={onReject}
                        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-rose-300/40 bg-rose-500/10 px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-500/15 dark:text-rose-200"
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <XCircle className="h-4 w-4" />
                        Reject Request
                    </motion.button>
                </div>
            )}
        </Panel>
    );
}

function StatusRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#D1D9DA] bg-[#F7F8FA] px-4 py-3 dark:border-white/10 dark:bg-white/[0.04]">
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                {label}
            </span>
            <StatusPill value={value} />
        </div>
    );
}

function InfoLine({
    label,
    value,
    mono = false,
}: {
    label: string;
    value: string;
    mono?: boolean;
}) {
    return (
        <div className="flex items-start justify-between gap-3 rounded-2xl border border-[#D1D9DA] bg-[#F7F8FA] px-4 py-3 dark:border-white/10 dark:bg-white/[0.04]">
            <span className="text-sm text-slate-500 dark:text-slate-400">
                {label}
            </span>
            <span
                className={`text-right text-sm font-semibold text-[#061F39] dark:text-white ${
                    mono ? 'font-mono' : ''
                }`}
            >
                {value}
            </span>
        </div>
    );
}

function StatusPill({ value }: { value: string }) {
    const Icon = getStatusIcon(value);

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${getStatusTone(value)}`}
        >
            <Icon className="h-3.5 w-3.5" />
            {titleCase(value)}
        </span>
    );
}
