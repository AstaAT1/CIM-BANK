import { Head, Link } from '@inertiajs/react';

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

type ConfirmationProps = {
    request: {
        id: number;
        request_number: string;
        status: string;
        branch: { name: string; city: string; address: string } | null;
        user: { name: string; email: string; phone: string };
        customer_profile: {
            cin: string;
            employment_status: string;
            status: string;
        } | null;
        appointment: {
            scheduled_at: string;
            status: string;
        } | null;
    };
};

export default function Confirmation({ request: req }: ConfirmationProps) {
    const appointmentDate = req.appointment
        ? new Date(req.appointment.scheduled_at).toLocaleString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
          })
        : '—';

    return (
        <>
            <Head title="Request Confirmed — CIM" />
            <div style={{ minHeight: '100vh', background: CIM.bg, fontFamily: "'Inter', sans-serif" }}>
                {/* Header */}
                <header
                    style={{
                        background: `linear-gradient(135deg, ${CIM.dark} 0%, ${CIM.primary} 100%)`,
                        padding: '40px 24px 36px',
                        textAlign: 'center',
                    }}
                >
                    <div style={{ fontSize: '0.65rem', color: CIM.accent, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 500 }}>
                        Credit Intelligence Mizan
                    </div>

                    {/* Step indicator - all done */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 24, margin: '20px 0' }}>
                        {['Contact', 'Personal', 'Identity', 'Appointment'].map((label, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div
                                    style={{
                                        width: 28,
                                        height: 28,
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '0.7rem',
                                        fontWeight: 700,
                                        background: CIM.accent,
                                        color: CIM.white,
                                    }}
                                >
                                    ✓
                                </div>
                                <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)', fontWeight: 400 }}>
                                    {label}
                                </span>
                            </div>
                        ))}
                    </div>
                </header>

                <div
                    style={{
                        maxWidth: 640,
                        margin: '-24px auto 0',
                        padding: '0 20px 48px',
                    }}
                >
                    {/* Success Card */}
                    <div
                        style={{
                            background: CIM.white,
                            borderRadius: 20,
                            border: `1px solid ${CIM.border}`,
                            padding: '40px 32px',
                            boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
                            textAlign: 'center',
                        }}
                    >
                        {/* Success icon */}
                        <div
                            style={{
                                width: 72,
                                height: 72,
                                borderRadius: '50%',
                                background: `linear-gradient(135deg, ${CIM.primary}, ${CIM.secondary})`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 20px',
                                boxShadow: `0 8px 32px ${CIM.primary}40`,
                            }}
                        >
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 6L9 17l-5-5" />
                            </svg>
                        </div>

                        <h1
                            style={{
                                fontFamily: "'Playfair Display', serif",
                                fontSize: '1.4rem',
                                fontWeight: 600,
                                color: CIM.primary,
                                margin: '0 0 8px',
                            }}
                        >
                            Request Recorded Successfully
                        </h1>
                        <p style={{ fontSize: '0.88rem', color: CIM.secondary, lineHeight: 1.6, maxWidth: 440, margin: '0 auto 28px' }}>
                            Your account opening request has been submitted. Please visit the branch on your appointment date for identity verification and account activation.
                        </p>

                        {/* Gold divider */}
                        <div
                            style={{
                                height: 2,
                                background: `linear-gradient(90deg, transparent, ${CIM.accent}, transparent)`,
                                margin: '0 auto 28px',
                                maxWidth: 200,
                            }}
                        />

                        {/* Summary details */}
                        <div style={{ textAlign: 'left' }}>
                            <h3 style={{ color: CIM.primary, fontSize: '0.9rem', fontWeight: 600, marginBottom: 16 }}>Your Details</h3>
                            <InfoRow label="Full Name" value={req.user.name} />
                            <InfoRow label="Email" value={req.user.email} />
                            <InfoRow label="Phone" value={req.user.phone} />
                            <InfoRow label="CIN" value={req.customer_profile?.cin || '—'} />
                            <InfoRow label="Profession" value={req.customer_profile?.employment_status || '—'} />
                            <InfoRow label="Request #" value={req.request_number} />
                            <InfoRow label="Branch" value={req.branch ? `${req.branch.name}, ${req.branch.city}` : '—'} />
                            <InfoRow
                                label="Appointment"
                                value={appointmentDate}
                                highlight
                            />

                            {/* Status badges */}
                            <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
                                <Badge label="Request" value="Pending" color={CIM.accent} />
                                <Badge label="Appointment" value="Booked" color={CIM.secondary} />
                                <Badge label="Verification" value="Pending" color={CIM.primary} />
                            </div>
                        </div>

                        {/* Info box */}
                        <div
                            style={{
                                marginTop: 28,
                                padding: '16px 20px',
                                background: `${CIM.primary}08`,
                                borderRadius: 12,
                                border: `1px solid ${CIM.border}`,
                                textAlign: 'left',
                            }}
                        >
                            <p style={{ fontSize: '0.8rem', color: CIM.secondary, margin: 0, lineHeight: 1.6 }}>
                                <strong style={{ color: CIM.primary }}>What's next?</strong>
                                <br />
                                Please bring your original CIN document and a recent passport-size photo to your appointment. A CIM representative will verify your identity and activate your account.
                            </p>
                        </div>

                        {/* Action button */}
                        <Link
                            href="/dashboard"
                            style={{
                                display: 'inline-block',
                                marginTop: 24,
                                padding: '13px 32px',
                                fontSize: '0.88rem',
                                fontWeight: 600,
                                color: CIM.white,
                                background: `linear-gradient(135deg, ${CIM.primary}, ${CIM.secondary})`,
                                border: `1.5px solid ${CIM.accent}40`,
                                borderRadius: 12,
                                textDecoration: 'none',
                                transition: 'all 0.3s',
                            }}
                        >
                            Go to Dashboard
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}

/* ── Info Row ── */
function InfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
    return (
        <div
            style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px 0',
                borderBottom: `1px solid ${CIM.border}30`,
            }}
        >
            <span style={{ fontSize: '0.8rem', color: CIM.secondary, fontWeight: 500 }}>{label}</span>
            <span
                style={{
                    fontSize: '0.8rem',
                    color: highlight ? CIM.accent : CIM.dark,
                    fontWeight: highlight ? 700 : 600,
                    textAlign: 'right',
                    maxWidth: '60%',
                    wordBreak: 'break-word',
                }}
            >
                {value}
            </span>
        </div>
    );
}

/* ── Badge ── */
function Badge({ label, value, color }: { label: string; value: string; color: string }) {
    return (
        <div
            style={{
                fontSize: '0.7rem',
                fontWeight: 600,
                color,
                background: `${color}10`,
                padding: '5px 14px',
                borderRadius: 20,
                border: `1px solid ${color}25`,
            }}
        >
            {label}: {value}
        </div>
    );
}
