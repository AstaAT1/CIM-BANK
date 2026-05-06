import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

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
type CustomerProfile = { cin: string; employment_status: string; status: string };
type User = { id: number; name: string; email: string; phone: string; profile?: CustomerProfile | null };
type Branch = { id: number; name: string; city: string };
type Appointment = { id: number; scheduled_at: string; status: string } | null;
type Reviewer = { name: string } | null;

type AORItem = {
    id: number;
    request_number: string;
    account_type: string;
    status: string;
    submitted_at: string | null;
    reviewed_at: string | null;
    documents_count: number;
    user: User;
    customer_profile: CustomerProfile | null;
    branch: Branch | null;
    appointment: Appointment;
    reviewer: Reviewer;
};

type PaginatedData = {
    data: AORItem[];
    current_page: number;
    last_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
};

type PageProps = {
    requests: PaginatedData;
    branches: Branch[];
    filters: { status?: string; branch_id?: string; search?: string };
    statuses: string[];
    flash?: { success?: string; error?: string };
};

export default function AccountOpeningRequestsIndex() {
    const { requests, branches, filters, statuses, flash } =
        usePage<{ props: PageProps }>().props as unknown as PageProps;

    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [branchFilter, setBranchFilter] = useState(filters.branch_id || '');

    const applyFilters = () => {
        router.get(
            '/admin/account-opening-requests',
            {
                ...(search && { search }),
                ...(statusFilter && { status: statusFilter }),
                ...(branchFilter && { branch_id: branchFilter }),
            },
            { preserveState: true },
        );
    };

    return (
        <>
            <Head title="Account Opening Requests — CIM Admin" />
            <div style={{ minHeight: '100vh', background: CIM.bg, fontFamily: "'Inter', sans-serif" }}>
                {/* Header */}
                <header
                    style={{
                        background: `linear-gradient(135deg, ${CIM.dark} 0%, ${CIM.primary} 100%)`,
                        padding: '28px 32px',
                    }}
                >
                    <div style={{ maxWidth: 1300, margin: '0 auto' }}>
                        <div style={{ fontSize: '0.6rem', color: CIM.accent, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 500 }}>
                            CIM Admin Panel
                        </div>
                        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.3rem', color: CIM.white, margin: '6px 0 0', fontWeight: 600 }}>
                            Account Opening Requests
                        </h1>
                        <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', margin: '4px 0 0' }}>
                            Review and verify client bank account applications
                        </p>
                    </div>
                </header>

                <div style={{ maxWidth: 1300, margin: '0 auto', padding: '24px 20px 48px' }}>
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

                    {/* Filters */}
                    <div style={{ background: CIM.white, borderRadius: 14, border: `1px solid ${CIM.border}`, padding: '16px 20px', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 20 }}>
                        <div style={{ flex: '1 1 200px' }}>
                            <label style={labelStyle}>Search</label>
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                                placeholder="Name, email, CIN, request number…"
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Status</label>
                            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={inputStyle}>
                                <option value="">All statuses</option>
                                {statuses.map((s) => (
                                    <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>Branch</label>
                            <select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)} style={inputStyle}>
                                <option value="">All branches</option>
                                {branches.map((b) => (
                                    <option key={b.id} value={b.id}>{b.name} — {b.city}</option>
                                ))}
                            </select>
                        </div>
                        <button onClick={applyFilters} style={primaryBtnStyle}>Filter</button>
                    </div>

                    {/* Stats */}
                    <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                        <StatCard label="Total" value={requests.total} color={CIM.primary} />
                        <StatCard label="Pending Review" value={requests.data.filter((r) => ['submitted', 'appointment_scheduled', 'under_review'].includes(r.status)).length} color={CIM.accent} />
                        <StatCard label="Approved" value={requests.data.filter((r) => ['approved', 'account_created'].includes(r.status)).length} color="#16a34a" />
                        <StatCard label="Rejected" value={requests.data.filter((r) => r.status === 'rejected').length} color="#dc2626" />
                    </div>

                    {/* Table */}
                    <div style={{ background: CIM.white, borderRadius: 14, border: `1px solid ${CIM.border}`, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                                <thead>
                                    <tr style={{ background: `${CIM.primary}08` }}>
                                        {['Request #', 'Full Name', 'Email', 'Phone', 'CIN', 'Profession', 'Branch', 'Appointment', 'Request Status', 'Verification', 'Docs', 'Action'].map((h) => (
                                            <th key={h} style={thStyle}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {requests.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={12} style={{ padding: 48, textAlign: 'center', color: CIM.secondary }}>
                                                No requests found.
                                            </td>
                                        </tr>
                                    ) : (
                                        requests.data.map((r) => {
                                            const profile = r.customer_profile;
                                            const appt = r.appointment;
                                            const apptDate = appt ? new Date(appt.scheduled_at) : null;
                                            return (
                                                <tr
                                                    key={r.id}
                                                    style={{ borderBottom: `1px solid ${CIM.border}40`, transition: 'background 0.15s' }}
                                                    onMouseEnter={(e) => (e.currentTarget.style.background = `${CIM.primary}04`)}
                                                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                                                >
                                                    <td style={{ padding: '11px 14px', fontWeight: 600, color: CIM.secondary, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                                                        {r.request_number}
                                                    </td>
                                                    <td style={{ padding: '11px 14px', fontWeight: 600, color: CIM.dark, whiteSpace: 'nowrap' }}>{r.user?.name}</td>
                                                    <td style={{ padding: '11px 14px', color: CIM.secondary }}>{r.user?.email}</td>
                                                    <td style={{ padding: '11px 14px', color: CIM.secondary, whiteSpace: 'nowrap' }}>{r.user?.phone || '—'}</td>
                                                    <td style={{ padding: '11px 14px', fontWeight: 500 }}>{profile?.cin || '—'}</td>
                                                    <td style={{ padding: '11px 14px', color: CIM.secondary }}>{profile?.employment_status || '—'}</td>
                                                    <td style={{ padding: '11px 14px', color: CIM.secondary, whiteSpace: 'nowrap' }}>{r.branch?.name || '—'}</td>
                                                    <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}>
                                                        {apptDate ? (
                                                            <>
                                                                <div style={{ fontWeight: 600, color: CIM.dark, fontSize: '0.78rem' }}>
                                                                    {apptDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                                </div>
                                                                <div style={{ fontSize: '0.72rem', color: CIM.secondary }}>
                                                                    {apptDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                                                </div>
                                                            </>
                                                        ) : <span style={{ color: '#9ca3af' }}>—</span>}
                                                    </td>
                                                    <td style={{ padding: '11px 14px' }}><StatusPill value={r.status} /></td>
                                                    <td style={{ padding: '11px 14px' }}><StatusPill value={profile?.status || 'pending'} /></td>
                                                    <td style={{ padding: '11px 14px', textAlign: 'center', fontWeight: 600, color: r.documents_count > 0 ? CIM.secondary : '#9ca3af' }}>
                                                        {r.documents_count}
                                                    </td>
                                                    <td style={{ padding: '11px 14px' }}>
                                                        <Link
                                                            href={`/admin/account-opening-requests/${r.id}`}
                                                            style={{
                                                                display: 'inline-block',
                                                                padding: '5px 14px',
                                                                fontSize: '0.75rem',
                                                                fontWeight: 600,
                                                                color: CIM.white,
                                                                background: `linear-gradient(135deg, ${CIM.primary}, ${CIM.secondary})`,
                                                                borderRadius: 8,
                                                                textDecoration: 'none',
                                                                whiteSpace: 'nowrap',
                                                            }}
                                                        >
                                                            Review →
                                                        </Link>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {requests.last_page > 1 && (
                            <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'center', gap: 4, borderTop: `1px solid ${CIM.border}` }}>
                                {requests.links.map((link, i) => (
                                    <button
                                        key={i}
                                        disabled={!link.url}
                                        onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                        style={{
                                            padding: '6px 12px',
                                            fontSize: '0.78rem',
                                            fontWeight: link.active ? 700 : 400,
                                            color: link.active ? CIM.white : CIM.primary,
                                            background: link.active ? CIM.primary : 'transparent',
                                            border: `1px solid ${link.active ? CIM.primary : CIM.border}`,
                                            borderRadius: 6,
                                            cursor: link.url ? 'pointer' : 'not-allowed',
                                            opacity: link.url ? 1 : 0.4,
                                        }}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

/* ── Shared styles ── */
const labelStyle: React.CSSProperties = {
    fontSize: '0.7rem', color: '#0A6474', fontWeight: 600,
    display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em',
};
const inputStyle: React.CSSProperties = {
    padding: '9px 14px', fontSize: '0.85rem',
    border: '1px solid #D1D9DA', borderRadius: 8, outline: 'none',
    fontFamily: 'Inter, sans-serif', background: '#F7F8FA', minWidth: 160,
    color: '#061F39',
    accentColor: '#0A6474',
};
const primaryBtnStyle: React.CSSProperties = {
    padding: '9px 24px', fontSize: '0.85rem', fontWeight: 600,
    color: '#fff', background: '#082F54', border: 'none',
    borderRadius: 8, cursor: 'pointer', height: 38,
};
const thStyle: React.CSSProperties = {
    padding: '12px 14px', textAlign: 'left', color: '#082F54',
    fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase',
    letterSpacing: '0.05em', borderBottom: '2px solid #D1D9DA', whiteSpace: 'nowrap',
};

/* ── Stat Card ── */
function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <div style={{ flex: '1 1 140px', background: '#fff', borderRadius: 12, border: '1px solid #D1D9DA', padding: '14px 18px', borderLeft: `4px solid ${color}` }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color }}>{value}</div>
            <div style={{ fontSize: '0.72rem', color: '#0A6474', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
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
        draft:                 { bg: '#f3f4f6', text: '#6b7280', border: '#d1d5db' },
    };
    const c = colors[value] || { bg: '#f3f4f6', text: '#374151', border: '#d1d5db' };
    return (
        <span style={{ fontSize: '0.68rem', fontWeight: 600, color: c.text, background: c.bg, padding: '3px 10px', borderRadius: 16, border: `1px solid ${c.border}`, whiteSpace: 'nowrap', textTransform: 'capitalize' }}>
            {value.replace(/_/g, ' ')}
        </span>
    );
}
