import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

/* ── CIM Palette ── */
const CIM = {
    primary: '#082F54', secondary: '#0A6474', accent: '#D4A23C',
    dark: '#061F39', bg: '#F7F8FA', white: '#FFFFFF', border: '#D1D9DA',
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
    cin: string; first_name: string; last_name: string; phone: string;
    birth_date: string | null; address: string | null; city: string | null;
    employment_status: string; status: string; verified_at: string | null;
};
type Branch = { name: string; city: string };
type Appointment = { id: number; scheduled_at: string; status: string; notes: string | null } | null;
type User = { id: number; name: string; email: string; phone: string };
type AOR = {
    id: number; request_number: string; account_type: string; status: string;
    rejection_reason: string | null; submitted_at: string | null; reviewed_at: string | null;
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

export default function AccountOpeningRequestShow() {
    const { request: aor, user, profile, branch, appointment, documents, flash } =
        usePage<{ props: PageProps }>().props as unknown as PageProps;

    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [rejectBusy, setRejectBusy] = useState(false);
    const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

    const handleApprove = () => {
        if (!confirm('Approve this request? This will verify the client, create their bank account and card.')) return;
        router.post(`/admin/account-opening-requests/${aor.id}/approve`, {}, { preserveScroll: true });
    };

    const handleMarkUnderReview = () => {
        if (!confirm('Mark this request as under review?')) return;
        router.post(`/admin/account-opening-requests/${aor.id}/under-review`, {}, { preserveScroll: true });
    };

    const handleReject = () => {
        if (!rejectionReason.trim()) { alert('Please enter a rejection reason.'); return; }
        setRejectBusy(true);
        router.post(
            `/admin/account-opening-requests/${aor.id}/reject`,
            { rejection_reason: rejectionReason },
            {
                preserveScroll: true,
                onFinish: () => { setRejectBusy(false); setShowRejectModal(false); setRejectionReason(''); },
            },
        );
    };

    const cinFront = documents.find((d) => d.document_type === 'cin_front');
    const cinBack  = documents.find((d) => d.document_type === 'cin_back');
    const otherDocs = documents.filter((d) => !['cin_front', 'cin_back'].includes(d.document_type));

    const isApproved  = ['approved', 'account_created'].includes(aor.status);
    const isRejected  = aor.status === 'rejected';
    const isPending   = !isApproved && !isRejected;
    const apptDate    = appointment ? new Date(appointment.scheduled_at) : null;

    return (
        <>
            <Head title={`Request ${aor.request_number} — CIM Admin`} />

            {/* Lightbox */}
            {lightboxSrc && (
                <div
                    onClick={() => setLightboxSrc(null)}
                    style={{
                        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 9999, cursor: 'zoom-out',
                    }}
                >
                    <img
                        src={lightboxSrc}
                        alt="Document preview"
                        style={{ maxWidth: '92vw', maxHeight: '90vh', borderRadius: 12, boxShadow: '0 24px 80px rgba(0,0,0,0.5)' }}
                    />
                    <button
                        onClick={() => setLightboxSrc(null)}
                        style={{
                            position: 'absolute', top: 20, right: 24,
                            background: 'rgba(255,255,255,0.15)', border: 'none',
                            borderRadius: '50%', width: 40, height: 40,
                            color: '#fff', fontSize: '1.2rem', cursor: 'pointer',
                        }}
                    >✕</button>
                </div>
            )}

            {/* Reject Modal */}
            {showRejectModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(6,31,57,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
                    <div style={{ background: CIM.white, borderRadius: 16, padding: '32px 28px', maxWidth: 480, width: '92%', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
                        <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: CIM.primary, marginBottom: 8 }}>Reject Request</h2>
                        <p style={{ fontSize: '0.82rem', color: CIM.secondary, marginBottom: 16 }}>
                            Please provide a reason. This will be recorded and the client's profile will be marked as rejected.
                        </p>
                        <textarea
                            rows={4}
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="e.g. CIN document unclear, information mismatch…"
                            style={{ ...formFieldStyle, width: '100%', padding: '10px 14px', fontSize: '0.85rem', resize: 'vertical', boxSizing: 'border-box' }}
                        />
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
                            <button
                                onClick={() => { setShowRejectModal(false); setRejectionReason(''); }}
                                style={{ padding: '9px 22px', fontSize: '0.85rem', fontWeight: 600, border: `1px solid ${CIM.border}`, borderRadius: 8, background: 'transparent', color: CIM.secondary, cursor: 'pointer' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={rejectBusy || !rejectionReason.trim()}
                                style={{
                                    padding: '9px 22px', fontSize: '0.85rem', fontWeight: 600,
                                    background: rejectBusy ? '#fca5a5' : '#dc2626', color: '#fff',
                                    border: 'none', borderRadius: 8, cursor: rejectBusy ? 'not-allowed' : 'pointer',
                                }}
                            >
                                {rejectBusy ? 'Rejecting…' : 'Confirm Reject'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ minHeight: '100vh', background: CIM.bg, fontFamily: "'Inter', sans-serif" }}>
                {/* Header */}
                <header style={{ background: `linear-gradient(135deg, ${CIM.dark} 0%, ${CIM.primary} 100%)`, padding: '28px 32px' }}>
                    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
                        <div style={{ fontSize: '0.6rem', color: CIM.accent, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 500 }}>CIM Admin Panel</div>
                        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.25rem', color: CIM.white, margin: '6px 0 2px', fontWeight: 600 }}>
                            Request Review — {aor.request_number}
                        </h1>
                        <Link href="/admin/account-opening-requests" style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>
                            ← Back to all requests
                        </Link>
                    </div>
                </header>

                <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 20px 60px' }}>
                    {/* Flash */}
                    {flash?.success && (
                        <div style={{ padding: '12px 20px', background: '#d1fae510', border: '1px solid #6ee7b730', borderRadius: 10, marginBottom: 20, fontSize: '0.85rem', color: '#065f46', fontWeight: 500 }}>
                            ✓ {flash.success}
                        </div>
                    )}
                    {flash?.error && (
                        <div style={{ padding: '12px 20px', background: '#fee2e210', border: '1px solid #fca5a530', borderRadius: 10, marginBottom: 20, fontSize: '0.85rem', color: '#991b1b', fontWeight: 500 }}>
                            ✕ {flash.error}
                        </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>

                        {/* ── LEFT COLUMN ── */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                            {/* User Details */}
                            <Section title="Client Information">
                                <Grid2>
                                    <Field label="Full Name" value={user?.name} />
                                    <Field label="Email" value={user?.email} />
                                    <Field label="Phone" value={user?.phone || profile?.phone || '—'} />
                                    <Field label="Date of Birth" value={profile?.birth_date ? new Date(profile.birth_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'} />
                                    <Field label="Address" value={profile?.address || '—'} />
                                    <Field label="City" value={profile?.city || '—'} />
                                    <Field label="CIN Number" value={profile?.cin || '—'} bold />
                                    <Field label="Profession / Job" value={profile?.employment_status || '—'} />
                                </Grid2>
                            </Section>

                            {/* Appointment */}
                            <Section title="Appointment Details">
                                {appointment && apptDate ? (
                                    <Grid2>
                                        <Field label="Date" value={apptDate.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} />
                                        <Field label="Time" value={apptDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} />
                                        <Field label="Branch" value={branch ? `${branch.name} — ${branch.city}` : '—'} />
                                        <Field label="Appointment Status" value={<StatusPill value={appointment.status} />} />
                                        {appointment.notes && <Field label="Notes" value={appointment.notes} />}
                                    </Grid2>
                                ) : (
                                    <p style={{ color: '#9ca3af', fontSize: '0.85rem' }}>No appointment booked yet.</p>
                                )}
                            </Section>

                            {/* CIN Images */}
                            <Section title="Identity Documents (CIN)">
                                {(cinFront || cinBack) ? (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                        {[{ doc: cinFront, label: 'CIN Front' }, { doc: cinBack, label: 'CIN Back' }].map(({ doc, label }) => (
                                            <div key={label}>
                                                <div style={{ fontSize: '0.72rem', color: CIM.secondary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                                                    {label}
                                                </div>
                                                {doc ? (
                                                    <DocumentPreview
                                                        doc={doc}
                                                        label={label}
                                                        onPreview={setLightboxSrc}
                                                    />
                                                ) : (
                                                    <div style={{ border: `2px dashed ${CIM.border}`, borderRadius: 12, padding: 32, textAlign: 'center', color: '#9ca3af', fontSize: '0.82rem' }}>
                                                        Not uploaded
                                                    </div>
                                                )}
                                                {doc && (
                                                    <a
                                                        href={`/admin/documents/${doc.id}/view`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        style={{ display: 'inline-block', marginTop: 6, fontSize: '0.72rem', color: CIM.secondary, textDecoration: 'none', fontWeight: 600 }}
                                                    >
                                                        Open in new tab ↗
                                                    </a>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p style={{ color: '#9ca3af', fontSize: '0.85rem' }}>No identity documents uploaded.</p>
                                )}

                                {otherDocs.length > 0 && (
                                    <div style={{ marginTop: 16 }}>
                                        <div style={{ fontSize: '0.72rem', color: CIM.secondary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Other Documents</div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                            {otherDocs.map((d) => (
                                                <a
                                                    key={d.id}
                                                    href={`/admin/documents/${d.id}/view`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    style={{ fontSize: '0.82rem', color: CIM.secondary, textDecoration: 'none', fontWeight: 500 }}
                                                >
                                                    📄 {d.original_name || d.document_type} ↗
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </Section>

                            {/* Rejection reason (if rejected) */}
                            {isRejected && aor.rejection_reason && (
                                <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 12, padding: '16px 20px' }}>
                                    <div style={{ fontSize: '0.72rem', color: '#991b1b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Rejection Reason</div>
                                    <p style={{ fontSize: '0.87rem', color: '#7f1d1d', lineHeight: 1.6, margin: 0 }}>{aor.rejection_reason}</p>
                                </div>
                            )}
                        </div>

                        {/* ── RIGHT COLUMN ── */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                            {/* Status card */}
                            <div style={{ background: CIM.white, borderRadius: 14, border: `1px solid ${CIM.border}`, padding: '20px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                                <div style={{ fontSize: '0.7rem', color: CIM.secondary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>Request Status</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    <StatusRow label="Request" value={aor.status} />
                                    <StatusRow label="Verification" value={profile?.status || 'pending'} />
                                    {appointment && <StatusRow label="Appointment" value={appointment.status} />}
                                </div>
                                {aor.reviewed_at && (
                                    <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${CIM.border}`, fontSize: '0.72rem', color: '#9ca3af' }}>
                                        Last reviewed: {new Date(aor.reviewed_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </div>
                                )}
                            </div>

                            {/* Request info */}
                            <div style={{ background: CIM.white, borderRadius: 14, border: `1px solid ${CIM.border}`, padding: '20px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                                <div style={{ fontSize: '0.7rem', color: CIM.secondary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>Request Info</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <InfoRow label="Request #" value={aor.request_number} mono />
                                    <InfoRow label="Account Type" value={aor.account_type} />
                                    <InfoRow label="Branch" value={branch ? `${branch.name}` : '—'} />
                                    <InfoRow label="Submitted" value={aor.submitted_at ? new Date(aor.submitted_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'} />
                                    <InfoRow label="Documents" value={`${documents.length} uploaded`} />
                                </div>
                            </div>

                            {/* Actions */}
                            <div style={{ background: CIM.white, borderRadius: 14, border: `1px solid ${CIM.border}`, padding: '20px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                                <div style={{ fontSize: '0.7rem', color: CIM.secondary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>Actions</div>

                                {isApproved && (
                                    <div style={{ background: '#d1fae5', border: '1px solid #6ee7b7', borderRadius: 10, padding: '12px 14px', fontSize: '0.82rem', color: '#065f46', fontWeight: 500 }}>
                                        ✓ Client verified and bank account created.
                                    </div>
                                )}

                                {isRejected && (
                                    <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 10, padding: '12px 14px', fontSize: '0.82rem', color: '#991b1b', fontWeight: 500 }}>
                                        ✕ This request has been rejected.
                                    </div>
                                )}

                                {isPending && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        {aor.status === 'submitted' || aor.status === 'appointment_scheduled' ? (
                                            <button
                                                onClick={handleMarkUnderReview}
                                                style={{ padding: '11px 0', fontWeight: 600, fontSize: '0.85rem', color: CIM.primary, background: `${CIM.accent}20`, border: `1.5px solid ${CIM.accent}60`, borderRadius: 10, cursor: 'pointer' }}
                                            >
                                                Mark Under Review
                                            </button>
                                        ) : null}

                                        <button
                                            onClick={handleApprove}
                                            style={{ padding: '11px 0', fontWeight: 700, fontSize: '0.9rem', color: '#fff', background: 'linear-gradient(135deg, #16a34a, #15803d)', border: 'none', borderRadius: 10, cursor: 'pointer', boxShadow: '0 4px 12px rgba(22,163,74,0.25)' }}
                                        >
                                            ✓ Approve & Verify Client
                                        </button>

                                        <button
                                            onClick={() => setShowRejectModal(true)}
                                            style={{ padding: '11px 0', fontWeight: 600, fontSize: '0.85rem', color: '#dc2626', background: '#fee2e2', border: '1.5px solid #fca5a530', borderRadius: 10, cursor: 'pointer' }}
                                        >
                                            ✕ Reject Request
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

const imageMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

function documentUrl(doc: Doc): string {
    return `/admin/documents/${doc.id}/view`;
}

function isPreviewableImage(doc: Doc): boolean {
    const mimeType = doc.mime_type?.toLowerCase() ?? '';
    const fileName = doc.original_name?.toLowerCase() ?? '';

    return imageMimeTypes.includes(mimeType) || /\.(jpe?g|png|webp)$/.test(fileName);
}

function DocumentPreview({ doc, label, onPreview }: { doc: Doc; label: string; onPreview: (src: string) => void }) {
    const [previewFailed, setPreviewFailed] = useState(false);
    const url = documentUrl(doc);
    const canPreview = isPreviewableImage(doc) && !previewFailed;

    if (!canPreview) {
        return (
            <div style={{ border: `2px dashed ${CIM.border}`, borderRadius: 12, padding: 32, textAlign: 'center', color: '#64748b', fontSize: '0.82rem', background: CIM.bg }}>
                Preview unavailable for this file type.
                <br />
                <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: CIM.secondary, fontWeight: 700, textDecoration: 'none' }}
                >
                    Open file ↗
                </a>
            </div>
        );
    }

    return (
        <button
            type="button"
            onClick={() => onPreview(url)}
            style={{
                border: `2px solid ${CIM.border}`, borderRadius: 12, overflow: 'hidden',
                cursor: 'zoom-in', transition: 'border-color 0.2s', background: CIM.bg,
                aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative', padding: 0, width: '100%',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = CIM.accent)}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = CIM.border)}
        >
            <img
                src={url}
                alt={label}
                style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', background: '#fff' }}
                onError={() => setPreviewFailed(true)}
            />
            <span style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.55)', color: '#fff', borderRadius: 6, padding: '2px 8px', fontSize: '0.68rem', fontWeight: 600 }}>
                Click to enlarge
            </span>
        </button>
    );
}

/* ── Section wrapper ── */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div style={{ background: CIM.white, borderRadius: 14, border: `1px solid ${CIM.border}`, padding: '20px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <h2 style={{ fontSize: '0.72rem', color: CIM.secondary, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 16px', paddingBottom: 10, borderBottom: `1px solid ${CIM.border}` }}>
                {title}
            </h2>
            {children}
        </div>
    );
}

const formFieldStyle: React.CSSProperties = {
    background: CIM.bg,
    border: `1px solid ${CIM.border}`,
    borderRadius: 8,
    color: CIM.dark,
    fontFamily: 'Inter, sans-serif',
    outlineColor: CIM.secondary,
};

/* ── 2-col grid ── */
function Grid2({ children }: { children: React.ReactNode }) {
    return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px' }}>{children}</div>;
}

/* ── Field ── */
function Field({ label, value, bold }: { label: string; value: React.ReactNode; bold?: boolean }) {
    return (
        <div>
            <div style={{ fontSize: '0.68rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{label}</div>
            <div style={{ fontSize: '0.87rem', color: bold ? CIM.primary : CIM.dark, fontWeight: bold ? 700 : 400 }}>{value ?? '—'}</div>
        </div>
    );
}

/* ── Status Row ── */
function StatusRow({ label, value }: { label: string; value: string }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: CIM.secondary }}>{label}</span>
            <StatusPill value={value} />
        </div>
    );
}

/* ── Info Row ── */
function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
            <span style={{ fontSize: '0.75rem', color: '#9ca3af', flexShrink: 0 }}>{label}</span>
            <span style={{ fontSize: '0.78rem', color: CIM.dark, fontWeight: 500, fontFamily: mono ? 'monospace' : undefined, textAlign: 'right' }}>{value}</span>
        </div>
    );
}

/* ── Status Pill ── */
function StatusPill({ value }: { value: string }) {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
        pending:               { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' },
        submitted:             { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' },
        appointment_scheduled: { bg: '#e0e7ff', text: '#3730a3', border: '#a5b4fc' },
        under_review:          { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' },
        approved:              { bg: '#d1fae5', text: '#065f46', border: '#6ee7b7' },
        account_created:       { bg: '#d1fae5', text: '#065f46', border: '#6ee7b7' },
        rejected:              { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' },
        verified:              { bg: '#d1fae5', text: '#065f46', border: '#6ee7b7' },
        scheduled:             { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' },
        completed:             { bg: '#d1fae5', text: '#065f46', border: '#6ee7b7' },
        missed:                { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' },
        cancelled:             { bg: '#f3f4f6', text: '#6b7280', border: '#d1d5db' },
    };
    const c = colors[value] || { bg: '#f3f4f6', text: '#374151', border: '#d1d5db' };
    return (
        <span style={{ fontSize: '0.68rem', fontWeight: 600, color: c.text, background: c.bg, padding: '3px 10px', borderRadius: 16, border: `1px solid ${c.border}`, whiteSpace: 'nowrap', textTransform: 'capitalize' }}>
            {value.replace(/_/g, ' ')}
        </span>
    );
}
