import { Head, Link } from '@inertiajs/react';

const CIM = {
    primary: '#082F54', secondary: '#0A6474', accent: '#D4A23C',
    dark: '#061F39', bg: '#F7F8FA', white: '#FFFFFF', border: '#D1D9DA',
};

type Props = {
    verificationStatus: string;
    requestStatus: string;
};

export default function AccountPending({ verificationStatus, requestStatus }: Props) {
    const isRejected = verificationStatus === 'rejected' || requestStatus === 'rejected';

    return (
        <>
            <Head title={isRejected ? 'Account Rejected — CIM' : 'Account Pending — CIM'} />
            <div style={{ minHeight: '100vh', background: CIM.bg, fontFamily: "'Inter', sans-serif", display: 'flex', flexDirection: 'column' }}>
                {/* Header */}
                <header style={{
                    background: `linear-gradient(135deg, ${CIM.dark} 0%, ${CIM.primary} 100%)`,
                    padding: '32px 24px', textAlign: 'center',
                }}>
                    <div style={{ fontSize: '0.65rem', color: CIM.accent, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 500 }}>
                        Credit Intelligence Mizan
                    </div>
                    <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', color: CIM.white, margin: '8px 0', fontWeight: 600 }}>
                        {isRejected ? 'Account Verification Failed' : 'Account Pending Verification'}
                    </h1>
                </header>

                {/* Content */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
                    <div style={{
                        maxWidth: 520, width: '100%', background: CIM.white,
                        borderRadius: 20, border: `1px solid ${CIM.border}`,
                        padding: '48px 36px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
                        textAlign: 'center',
                    }}>
                        {/* Icon */}
                        <div style={{
                            width: 80, height: 80, borderRadius: '50%', margin: '0 auto 24px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: isRejected
                                ? 'linear-gradient(135deg, #dc2626, #ef4444)'
                                : `linear-gradient(135deg, ${CIM.accent}, #e8b84a)`,
                            boxShadow: isRejected
                                ? '0 8px 32px rgba(220, 38, 38, 0.3)'
                                : `0 8px 32px ${CIM.accent}40`,
                        }}>
                            {isRejected ? (
                                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            ) : (
                                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                                </svg>
                            )}
                        </div>

                        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: CIM.primary, marginBottom: 12 }}>
                            {isRejected
                                ? 'Your Account Has Been Rejected'
                                : 'Your Account is Pending Verification'}
                        </h2>

                        <p style={{ fontSize: '0.92rem', color: CIM.secondary, lineHeight: 1.7, marginBottom: 28 }}>
                            {isRejected
                                ? 'Unfortunately, your identity verification was not successful. Please contact our branch for more information or to resubmit your application.'
                                : 'Thank you for registering with CIM. Your account is currently being reviewed by our verification team. You will be able to access your banking dashboard once a bank employee verifies your identity.'}
                        </p>

                        {/* Status badges */}
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
                            <StatusPill label="Verification" value={verificationStatus} />
                            <StatusPill label="Request" value={requestStatus} />
                        </div>

                        {/* Divider */}
                        <div style={{ height: 2, background: `linear-gradient(90deg, transparent, ${CIM.accent}, transparent)`, margin: '0 auto 28px', maxWidth: 180 }} />

                        {!isRejected && (
                            <div style={{
                                padding: '16px 20px', background: `${CIM.primary}08`,
                                borderRadius: 12, border: `1px solid ${CIM.border}`, marginBottom: 24,
                                textAlign: 'left',
                            }}>
                                <p style={{ fontSize: '0.82rem', color: CIM.secondary, margin: 0, lineHeight: 1.6 }}>
                                    <strong style={{ color: CIM.primary }}>What happens next?</strong><br />
                                    A CIM representative will review your documents and verify your identity at your scheduled appointment. Once approved, your bank account and card will be activated automatically.
                                </p>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                            <Link href="/settings/profile" style={{
                                padding: '12px 24px', fontSize: '0.88rem', fontWeight: 600, color: CIM.white,
                                background: `linear-gradient(135deg, ${CIM.primary}, ${CIM.secondary})`,
                                borderRadius: 12, textDecoration: 'none', border: `1.5px solid ${CIM.accent}40`,
                            }}>
                                View Profile
                            </Link>
                            <Link href="/logout" method="post" as="button" style={{
                                padding: '12px 24px', fontSize: '0.88rem', fontWeight: 600, color: CIM.secondary,
                                background: 'transparent', borderRadius: 12, textDecoration: 'none',
                                border: `1.5px solid ${CIM.border}`, cursor: 'pointer',
                            }}>
                                Log Out
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

function StatusPill({ label, value }: { label: string; value: string }) {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
        pending: { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' },
        submitted: { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' },
        verified: { bg: '#d1fae5', text: '#065f46', border: '#6ee7b7' },
        approved: { bg: '#d1fae5', text: '#065f46', border: '#6ee7b7' },
        rejected: { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' },
        appointment_scheduled: { bg: '#e0e7ff', text: '#3730a3', border: '#a5b4fc' },
        none: { bg: '#f3f4f6', text: '#6b7280', border: '#d1d5db' },
    };
    const c = colors[value] || colors.none;
    return (
        <span style={{
            fontSize: '0.75rem', fontWeight: 600, color: c.text,
            background: c.bg, padding: '5px 14px', borderRadius: 20,
            border: `1px solid ${c.border}`, textTransform: 'capitalize',
        }}>
            {label}: {value.replace(/_/g, ' ')}
        </span>
    );
}
