import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState, type CSSProperties, type ReactNode } from 'react';

const CIM = {
    primary: '#082F54',
    secondary: '#0A6474',
    accent: '#D4A23C',
    dark: '#061F39',
    bg: '#F7F8FA',
    white: '#FFFFFF',
    border: '#D1D9DA',
};

type CustomerProfile = {
    cin: string;
    employment_status: string;
    status: string;
    verified_at: string | null;
    phone?: string | null;
    address?: string | null;
    city?: string | null;
    birth_date?: string | null;
    monthly_income?: string | number | null;
};

type Branch = { name: string; city: string } | null;
type AppointmentData = {
    id: number;
    scheduled_at: string;
    status: string;
    notes: string | null;
    branch: Branch;
} | null;
type AccountOpeningRequest = {
    id: number;
    request_number: string;
    account_type: string;
    status: string;
    submitted_at: string | null;
    reviewed_at: string | null;
    branch: Branch;
} | null;
type BankAccountSummary = {
    id: number;
    account_type: string;
    status: string;
    currency: string;
    balance: string | number;
    opened_at: string | null;
    account_number_last4: string;
} | null;
type CardSummary = {
    id: number;
    masked_card_number: string;
    card_number_last4: string;
    expiry_month: number;
    expiry_year: number;
    status: string;
} | null;
type TransactionSummary = {
    id: number;
    reference: string;
    type: string;
    direction: string;
    amount: string | number;
    status: string;
    performed_at: string | null;
};
type AtmWithdrawalSummary = {
    id: number;
    amount: string | number;
    status: string;
    created_at: string | null;
    atm?: { name: string; city: string } | null;
};

type CustomerData = {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    created_at: string;
    profile: CustomerProfile | null;
    latest_appointment: AppointmentData;
    latest_account_opening_request: AccountOpeningRequest;
    bank_account_summary: BankAccountSummary;
    card_summary: CardSummary;
    bank_accounts: NonNullable<BankAccountSummary>[];
    bank_cards: NonNullable<CardSummary>[];
    latest_transactions: TransactionSummary[];
    latest_atm_withdrawals: AtmWithdrawalSummary[];
};

type PaginatedData = {
    data: CustomerData[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
};

type PageProps = {
    attendees: PaginatedData;
    filters: { status?: string; date?: string; search?: string };
    statuses: string[];
    flash?: { success?: string };
};

const statusLabels: Record<string, string> = {
    all_customers: 'All customers',
    pending_verification: 'Pending verification',
    verified_customers: 'Verified customers',
    rejected_customers: 'Rejected customers',
    appointment_booked: 'Appointment booked',
    appointment_finished: 'Appointment missed/completed',
};

const pendingRequestStatuses = [
    'submitted',
    'appointment_scheduled',
    'under_review',
];

export default function AppointmentAttendees() {
    const { attendees, filters, statuses, flash } = usePage<{
        props: PageProps;
    }>().props as unknown as PageProps;
    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [dateFilter, setDateFilter] = useState(filters.date || '');
    const [selectedCustomer, setSelectedCustomer] =
        useState<CustomerData | null>(null);

    const applyFilters = (nextStatus = statusFilter) => {
        router.get(
            '/admin/appointment-attendees',
            {
                ...(search && { search }),
                ...(nextStatus &&
                    nextStatus !== 'all_customers' && { status: nextStatus }),
                ...(dateFilter && { date: dateFilter }),
            },
            { preserveState: true },
        );
    };

    const selectStatus = (status: string) => {
        const normalized = status === 'all_customers' ? '' : status;
        setStatusFilter(normalized);
        applyFilters(normalized);
    };

    const clearFilters = () => {
        setSearch('');
        setStatusFilter('');
        setDateFilter('');
        router.get('/admin/appointment-attendees', {}, { preserveState: true });
    };

    const activeStatus = statusFilter || 'all_customers';

    return (
        <>
            <Head title="Customers Dashboard - CIM Admin" />
            <div
                style={{
                    minHeight: '100vh',
                    background: CIM.bg,
                    fontFamily: "'Inter', sans-serif",
                }}
            >
                <header
                    style={{
                        background: `linear-gradient(135deg, ${CIM.dark} 0%, ${CIM.primary} 100%)`,
                        padding: '28px 32px',
                    }}
                >
                    <div style={{ maxWidth: 1320, margin: '0 auto' }}>
                        <div style={eyebrowStyle}>CIM Admin Panel</div>
                        <h1
                            style={{
                                fontFamily: "'Playfair Display', serif",
                                fontSize: '1.35rem',
                                color: CIM.white,
                                margin: '6px 0 0',
                                fontWeight: 600,
                            }}
                        >
                            Customers Dashboard
                        </h1>
                        <p
                            style={{
                                fontSize: '0.78rem',
                                color: 'rgba(255,255,255,0.56)',
                                margin: '4px 0 0',
                            }}
                        >
                            Monitor customer profiles, appointments,
                            verification state, bank accounts, and cards.
                        </p>
                    </div>
                </header>

                <main
                    style={{
                        maxWidth: 1320,
                        margin: '0 auto',
                        padding: '24px 20px 48px',
                    }}
                >
                    {flash?.success && (
                        <div style={successStyle}>{flash.success}</div>
                    )}

                    <div style={filterShellStyle}>
                        <div style={{ flex: '1 1 260px' }}>
                            <label style={labelStyle}>Search customers</label>
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) =>
                                    e.key === 'Enter' && applyFilters()
                                }
                                placeholder="Name, email, phone, CIN"
                                style={{ ...inputStyle, width: '100%' }}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Appointment date</label>
                            <input
                                type="date"
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                                style={inputStyle}
                            />
                        </div>
                        <button
                            onClick={() => applyFilters()}
                            style={primaryBtnStyle}
                        >
                            Filter
                        </button>
                        <button
                            onClick={clearFilters}
                            style={secondaryBtnStyle}
                        >
                            Reset
                        </button>
                    </div>

                    <div style={segmentShellStyle}>
                        {statuses.map((status) => (
                            <button
                                key={status}
                                onClick={() => selectStatus(status)}
                                style={{
                                    ...segmentBtnStyle,
                                    ...(activeStatus === status
                                        ? activeSegmentStyle
                                        : {}),
                                }}
                            >
                                {statusLabels[status] || titleCase(status)}
                            </button>
                        ))}
                    </div>

                    <div
                        style={{
                            display: 'flex',
                            gap: 12,
                            marginBottom: 20,
                            flexWrap: 'wrap',
                        }}
                    >
                        <StatCard
                            label="Customers"
                            value={attendees.total}
                            color={CIM.primary}
                        />
                        <StatCard
                            label="Pending on page"
                            value={
                                attendees.data.filter(
                                    (c) =>
                                        (c.profile?.status || 'pending') ===
                                        'pending',
                                ).length
                            }
                            color={CIM.accent}
                        />
                        <StatCard
                            label="Verified on page"
                            value={
                                attendees.data.filter(
                                    (c) => c.profile?.status === 'verified',
                                ).length
                            }
                            color="#16a34a"
                        />
                        <StatCard
                            label="With accounts on page"
                            value={
                                attendees.data.filter(
                                    (c) => c.bank_account_summary,
                                ).length
                            }
                            color={CIM.secondary}
                        />
                    </div>

                    <div style={tableCardStyle}>
                        <div style={{ overflowX: 'auto' }}>
                            <table
                                style={{
                                    width: '100%',
                                    borderCollapse: 'collapse',
                                    fontSize: '0.8rem',
                                }}
                            >
                                <thead>
                                    <tr
                                        style={{
                                            background: `${CIM.primary}08`,
                                        }}
                                    >
                                        {[
                                            'Full name',
                                            'Email',
                                            'Phone',
                                            'CIN',
                                            'Profession',
                                            'Appointment',
                                            'Verification',
                                            'Request',
                                            'Bank account',
                                            'Card',
                                            'Created',
                                            'Actions',
                                        ].map((heading) => (
                                            <th key={heading} style={thStyle}>
                                                {heading}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {attendees.data.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={12}
                                                style={{
                                                    padding: 44,
                                                    textAlign: 'center',
                                                    color: CIM.secondary,
                                                }}
                                            >
                                                No customers match the current
                                                filters.
                                            </td>
                                        </tr>
                                    ) : (
                                        attendees.data.map((customer) => {
                                            const profile = customer.profile;
                                            const request =
                                                customer.latest_account_opening_request;
                                            const appointment =
                                                customer.latest_appointment;
                                            const account =
                                                customer.bank_account_summary;
                                            const card = customer.card_summary;
                                            const isPendingRequest =
                                                request &&
                                                pendingRequestStatuses.includes(
                                                    request.status,
                                                );

                                            return (
                                                <tr
                                                    key={customer.id}
                                                    onClick={() =>
                                                        setSelectedCustomer(
                                                            customer,
                                                        )
                                                    }
                                                    style={{
                                                        borderBottom: `1px solid ${CIM.border}55`,
                                                        cursor: 'pointer',
                                                        transition:
                                                            'background 0.15s',
                                                    }}
                                                    onMouseEnter={(e) =>
                                                        (e.currentTarget.style.background = `${CIM.primary}04`)
                                                    }
                                                    onMouseLeave={(e) =>
                                                        (e.currentTarget.style.background =
                                                            'transparent')
                                                    }
                                                >
                                                    <td style={nameCellStyle}>
                                                        {customer.name}
                                                    </td>
                                                    <td style={mutedCellStyle}>
                                                        {customer.email}
                                                    </td>
                                                    <td style={mutedCellStyle}>
                                                        {customer.phone || '—'}
                                                    </td>
                                                    <td
                                                        style={{
                                                            ...cellStyle,
                                                            fontWeight: 600,
                                                        }}
                                                    >
                                                        {profile?.cin || '—'}
                                                    </td>
                                                    <td style={mutedCellStyle}>
                                                        {profile?.employment_status ||
                                                            '—'}
                                                    </td>
                                                    <td style={cellStyle}>
                                                        {appointment ? (
                                                            <DateStack
                                                                value={
                                                                    appointment.scheduled_at
                                                                }
                                                                sub={titleCase(
                                                                    appointment.status,
                                                                )}
                                                            />
                                                        ) : (
                                                            '—'
                                                        )}
                                                    </td>
                                                    <td style={cellStyle}>
                                                        <StatusPill
                                                            value={
                                                                profile?.status ||
                                                                'pending'
                                                            }
                                                        />
                                                    </td>
                                                    <td style={cellStyle}>
                                                        <StatusPill
                                                            value={
                                                                request?.status ||
                                                                'none'
                                                            }
                                                        />
                                                    </td>
                                                    <td style={cellStyle}>
                                                        <StatusPill
                                                            value={
                                                                account?.status ||
                                                                'none'
                                                            }
                                                        />
                                                    </td>
                                                    <td style={cellStyle}>
                                                        <StatusPill
                                                            value={
                                                                card?.status ||
                                                                'none'
                                                            }
                                                        />
                                                    </td>
                                                    <td style={cellStyle}>
                                                        <DateStack
                                                            value={
                                                                customer.created_at
                                                            }
                                                        />
                                                    </td>
                                                    <td style={cellStyle}>
                                                        <div
                                                            style={{
                                                                display: 'flex',
                                                                gap: 6,
                                                                flexWrap:
                                                                    'wrap',
                                                            }}
                                                        >
                                                            <button
                                                                onClick={(
                                                                    e,
                                                                ) => {
                                                                    e.stopPropagation();
                                                                    setSelectedCustomer(
                                                                        customer,
                                                                    );
                                                                }}
                                                                style={
                                                                    actionBtnStyle
                                                                }
                                                            >
                                                                View details
                                                            </button>

                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {attendees.last_page > 1 && (
                            <div style={paginationStyle}>
                                {attendees.links.map((link, i) => (
                                    <button
                                        key={i}
                                        disabled={!link.url}
                                        onClick={() =>
                                            link.url &&
                                            router.get(
                                                link.url,
                                                {},
                                                { preserveState: true },
                                            )
                                        }
                                        style={{
                                            padding: '6px 12px',
                                            fontSize: '0.78rem',
                                            fontWeight: link.active ? 700 : 400,
                                            color: link.active
                                                ? CIM.white
                                                : CIM.primary,
                                            background: link.active
                                                ? CIM.primary
                                                : 'transparent',
                                            border: `1px solid ${link.active ? CIM.primary : CIM.border}`,
                                            borderRadius: 6,
                                            cursor: link.url
                                                ? 'pointer'
                                                : 'not-allowed',
                                            opacity: link.url ? 1 : 0.4,
                                        }}
                                        dangerouslySetInnerHTML={{
                                            __html: link.label,
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {selectedCustomer && (
                <CustomerDetailsModal
                    customer={selectedCustomer}
                    onClose={() => setSelectedCustomer(null)}
                />
            )}
        </>
    );
}

function CustomerDetailsModal({
    customer,
    onClose,
}: {
    customer: CustomerData;
    onClose: () => void;
}) {
    const profile = customer.profile;
    const request = customer.latest_account_opening_request;
    const appointment = customer.latest_appointment;
    const isPendingRequest =
        request && pendingRequestStatuses.includes(request.status);

    return (
        <div style={modalBackdropStyle} onClick={onClose}>
            <section style={modalStyle} onClick={(e) => e.stopPropagation()}>
                <div style={modalHeaderStyle}>
                    <div>
                        <div style={eyebrowStyle}>Customer Overview</div>
                        <h2
                            style={{
                                margin: '3px 0 0',
                                color: CIM.dark,
                                fontSize: '1.18rem',
                            }}
                        >
                            {customer.name}
                        </h2>
                        <p
                            style={{
                                margin: '4px 0 0',
                                color: CIM.secondary,
                                fontSize: '0.8rem',
                            }}
                        >
                            {customer.email}
                        </p>
                    </div>
                    <button onClick={onClose} style={closeBtnStyle}>
                        Close
                    </button>
                </div>

                <div style={modalGridStyle}>
                    <DetailSection title="Personal info">
                        <DetailRow label="Full name" value={customer.name} />
                        <DetailRow label="CIN" value={profile?.cin} />
                        <DetailRow
                            label="Profession/job"
                            value={profile?.employment_status}
                        />
                        <DetailRow
                            label="Birth date"
                            value={formatDate(profile?.birth_date)}
                        />
                        <DetailRow
                            label="Monthly income"
                            value={
                                profile?.monthly_income
                                    ? `${profile.monthly_income} MAD`
                                    : undefined
                            }
                        />
                    </DetailSection>

                    <DetailSection title="Contact info">
                        <DetailRow label="Email" value={customer.email} />
                        <DetailRow
                            label="Phone"
                            value={customer.phone || profile?.phone}
                        />
                        <DetailRow label="City" value={profile?.city} />
                        <DetailRow label="Address" value={profile?.address} />
                        <DetailRow
                            label="Created"
                            value={formatDateTime(customer.created_at)}
                        />
                    </DetailSection>

                    <DetailSection title="Verification and request">
                        <DetailRow
                            label="Verification"
                            value={
                                <StatusPill
                                    value={profile?.status || 'pending'}
                                />
                            }
                        />
                        <DetailRow
                            label="Verified at"
                            value={formatDateTime(profile?.verified_at)}
                        />
                        <DetailRow
                            label="Request"
                            value={request?.request_number}
                        />
                        <DetailRow
                            label="Request status"
                            value={
                                <StatusPill value={request?.status || 'none'} />
                            }
                        />
                        <DetailRow
                            label="Account type"
                            value={request?.account_type}
                        />
                        {isPendingRequest && (
                            <Link
                                href={`/admin/account-opening-requests/${request.id}`}
                                style={{
                                    ...reviewBtnStyle,
                                    display: 'inline-block',
                                    marginTop: 10,
                                }}
                            >
                                Review in Verification Users
                            </Link>
                        )}
                    </DetailSection>

                    <DetailSection title="Appointment details">
                        <DetailRow
                            label="Date/time"
                            value={formatDateTime(appointment?.scheduled_at)}
                        />
                        <DetailRow
                            label="Status"
                            value={
                                appointment ? (
                                    <StatusPill value={appointment.status} />
                                ) : undefined
                            }
                        />
                        <DetailRow
                            label="Branch"
                            value={
                                appointment?.branch
                                    ? `${appointment.branch.name}, ${appointment.branch.city}`
                                    : undefined
                            }
                        />
                        <DetailRow label="Notes" value={appointment?.notes} />
                    </DetailSection>

                    <DetailSection title="Bank accounts">
                        {customer.bank_accounts.length === 0 ? (
                            <EmptyLine label="No bank account found." />
                        ) : (
                            customer.bank_accounts.map((account) => (
                                <CompactRecord key={account.id}>
                                    <DetailRow
                                        label="Account"
                                        value={`${titleCase(account.account_type)} ending ${account.account_number_last4 || '—'}`}
                                    />
                                    <DetailRow
                                        label="Status"
                                        value={
                                            <StatusPill
                                                value={account.status}
                                            />
                                        }
                                    />
                                    <DetailRow
                                        label="Balance"
                                        value={`${account.balance} ${account.currency}`}
                                    />
                                    <DetailRow
                                        label="Opened"
                                        value={formatDate(account.opened_at)}
                                    />
                                </CompactRecord>
                            ))
                        )}
                    </DetailSection>

                    <DetailSection title="Card info">
                        {customer.bank_cards.length === 0 ? (
                            <EmptyLine label="No bank card found." />
                        ) : (
                            customer.bank_cards.map((card) => (
                                <CompactRecord key={card.id}>
                                    <DetailRow
                                        label="Card"
                                        value={
                                            card.masked_card_number ||
                                            `•••• ${card.card_number_last4}`
                                        }
                                    />
                                    <DetailRow
                                        label="Status"
                                        value={
                                            <StatusPill value={card.status} />
                                        }
                                    />
                                    <DetailRow
                                        label="Expiry"
                                        value={`${String(card.expiry_month).padStart(2, '0')}/${String(card.expiry_year).slice(-2)}`}
                                    />
                                </CompactRecord>
                            ))
                        )}
                    </DetailSection>

                    <DetailSection title="Latest transactions">
                        {customer.latest_transactions.length === 0 ? (
                            <EmptyLine label="No transactions found." />
                        ) : (
                            customer.latest_transactions.map((transaction) => (
                                <CompactRecord key={transaction.id}>
                                    <DetailRow
                                        label={transaction.reference}
                                        value={`${titleCase(transaction.direction)} ${transaction.amount} MAD`}
                                    />
                                    <DetailRow
                                        label="Type/status"
                                        value={`${titleCase(transaction.type)} · ${titleCase(transaction.status)}`}
                                    />
                                    <DetailRow
                                        label="Performed"
                                        value={formatDateTime(
                                            transaction.performed_at,
                                        )}
                                    />
                                </CompactRecord>
                            ))
                        )}
                    </DetailSection>

                    <DetailSection title="ATM withdrawals">
                        {customer.latest_atm_withdrawals.length === 0 ? (
                            <EmptyLine label="No ATM withdrawals found." />
                        ) : (
                            customer.latest_atm_withdrawals.map(
                                (withdrawal) => (
                                    <CompactRecord key={withdrawal.id}>
                                        <DetailRow
                                            label={
                                                withdrawal.atm
                                                    ? `${withdrawal.atm.name}, ${withdrawal.atm.city}`
                                                    : 'ATM'
                                            }
                                            value={`${withdrawal.amount} MAD`}
                                        />
                                        <DetailRow
                                            label="Status"
                                            value={
                                                <StatusPill
                                                    value={withdrawal.status}
                                                />
                                            }
                                        />
                                        <DetailRow
                                            label="Created"
                                            value={formatDateTime(
                                                withdrawal.created_at,
                                            )}
                                        />
                                    </CompactRecord>
                                ),
                            )
                        )}
                    </DetailSection>
                </div>
            </section>
        </div>
    );
}

function DateStack({ value, sub }: { value?: string | null; sub?: string }) {
    if (!value) return <span style={{ color: '#9ca3af' }}>—</span>;
    const date = new Date(value);

    return (
        <>
            <div
                style={{
                    fontWeight: 600,
                    color: CIM.dark,
                    whiteSpace: 'nowrap',
                }}
            >
                {date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                })}
            </div>
            <div
                style={{
                    fontSize: '0.72rem',
                    color: CIM.secondary,
                    whiteSpace: 'nowrap',
                }}
            >
                {sub ||
                    date.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                    })}
            </div>
        </>
    );
}

function DetailSection({
    title,
    children,
}: {
    title: string;
    children: ReactNode;
}) {
    return (
        <section style={detailSectionStyle}>
            <h3 style={detailTitleStyle}>{title}</h3>
            <div style={{ display: 'grid', gap: 8 }}>{children}</div>
        </section>
    );
}

function DetailRow({ label, value }: { label: string; value?: ReactNode }) {
    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: '120px minmax(0, 1fr)',
                gap: 10,
                alignItems: 'start',
            }}
        >
            <span
                style={{
                    color: CIM.secondary,
                    fontSize: '0.72rem',
                    fontWeight: 600,
                }}
            >
                {label}
            </span>
            <span
                style={{
                    color: CIM.dark,
                    fontSize: '0.78rem',
                    overflowWrap: 'anywhere',
                }}
            >
                {value || '—'}
            </span>
        </div>
    );
}

function EmptyLine({ label }: { label: string }) {
    return <div style={{ color: '#8a969d', fontSize: '0.78rem' }}>{label}</div>;
}

function CompactRecord({ children }: { children: ReactNode }) {
    return (
        <div
            style={{
                border: `1px solid ${CIM.border}`,
                borderRadius: 8,
                padding: 10,
                background: '#fbfcfd',
            }}
        >
            {children}
        </div>
    );
}

function StatCard({
    label,
    value,
    color,
}: {
    label: string;
    value: number;
    color: string;
}) {
    return (
        <div
            style={{
                flex: '1 1 150px',
                background: CIM.white,
                borderRadius: 8,
                border: `1px solid ${CIM.border}`,
                padding: '14px 18px',
                borderLeft: `4px solid ${color}`,
            }}
        >
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color }}>
                {value}
            </div>
            <div
                style={{
                    fontSize: '0.72rem',
                    color: CIM.secondary,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                }}
            >
                {label}
            </div>
        </div>
    );
}

function StatusPill({ value }: { value: string }) {
    const colors: Record<string, { bg: string; text: string; border: string }> =
        {
            none: { bg: '#f3f4f6', text: '#6b7280', border: '#d1d5db' },
            pending: { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' },
            submitted: { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' },
            appointment_scheduled: {
                bg: '#e0e7ff',
                text: '#3730a3',
                border: '#a5b4fc',
            },
            under_review: { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' },
            approved: { bg: '#d1fae5', text: '#065f46', border: '#6ee7b7' },
            account_created: {
                bg: '#d1fae5',
                text: '#065f46',
                border: '#6ee7b7',
            },
            rejected: { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' },
            verified: { bg: '#d1fae5', text: '#065f46', border: '#6ee7b7' },
            scheduled: { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' },
            completed: { bg: '#d1fae5', text: '#065f46', border: '#6ee7b7' },
            active: { bg: '#d1fae5', text: '#065f46', border: '#6ee7b7' },
            cancelled: { bg: '#f3f4f6', text: '#6b7280', border: '#d1d5db' },
            missed: { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' },
            rescheduled: { bg: '#e0e7ff', text: '#3730a3', border: '#a5b4fc' },
            blocked: { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' },
            failed: { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' },
        };
    const color = colors[value] || colors.none;

    return (
        <span
            style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                color: color.text,
                background: color.bg,
                padding: '3px 10px',
                borderRadius: 16,
                border: `1px solid ${color.border}`,
                whiteSpace: 'nowrap',
                textTransform: 'capitalize',
            }}
        >
            {value.replace(/_/g, ' ')}
        </span>
    );
}

function titleCase(value: string) {
    return value
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value?: string | null) {
    return value
        ? new Date(value).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
          })
        : undefined;
}

function formatDateTime(value?: string | null) {
    return value
        ? new Date(value).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
          })
        : undefined;
}

const eyebrowStyle: CSSProperties = {
    fontSize: '0.6rem',
    color: CIM.accent,
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    fontWeight: 600,
};
const successStyle: CSSProperties = {
    padding: '12px 20px',
    background: `${CIM.secondary}10`,
    border: `1px solid ${CIM.secondary}30`,
    borderRadius: 8,
    marginBottom: 20,
    fontSize: '0.85rem',
    color: CIM.secondary,
    fontWeight: 600,
};
const filterShellStyle: CSSProperties = {
    background: CIM.white,
    borderRadius: 8,
    border: `1px solid ${CIM.border}`,
    padding: '16px 20px',
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    marginBottom: 14,
};
const segmentShellStyle: CSSProperties = {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 20,
};
const segmentBtnStyle: CSSProperties = {
    border: `1px solid ${CIM.border}`,
    background: CIM.white,
    color: CIM.secondary,
    borderRadius: 8,
    padding: '8px 12px',
    fontSize: '0.76rem',
    fontWeight: 700,
    cursor: 'pointer',
};
const activeSegmentStyle: CSSProperties = {
    background: CIM.primary,
    borderColor: CIM.primary,
    color: CIM.white,
};
const labelStyle: CSSProperties = {
    fontSize: '0.7rem',
    color: CIM.secondary,
    fontWeight: 700,
    display: 'block',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
};
const inputStyle: CSSProperties = {
    padding: '9px 14px',
    fontSize: '0.85rem',
    border: `1px solid ${CIM.border}`,
    borderRadius: 8,
    outline: 'none',
    fontFamily: 'Inter, sans-serif',
    background: CIM.bg,
    minWidth: 160,
    color: CIM.dark,
    accentColor: CIM.secondary,
};
const primaryBtnStyle: CSSProperties = {
    padding: '9px 22px',
    fontSize: '0.85rem',
    fontWeight: 700,
    color: CIM.white,
    background: CIM.primary,
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    height: 38,
};
const secondaryBtnStyle: CSSProperties = {
    ...primaryBtnStyle,
    color: CIM.primary,
    background: CIM.white,
    border: `1px solid ${CIM.border}`,
};
const tableCardStyle: CSSProperties = {
    background: CIM.white,
    borderRadius: 8,
    border: `1px solid ${CIM.border}`,
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
};
const thStyle: CSSProperties = {
    padding: '12px 14px',
    textAlign: 'left',
    color: CIM.primary,
    fontWeight: 700,
    fontSize: '0.7rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderBottom: `2px solid ${CIM.border}`,
    whiteSpace: 'nowrap',
};
const cellStyle: CSSProperties = {
    padding: '12px 14px',
    color: CIM.dark,
    verticalAlign: 'top',
};
const mutedCellStyle: CSSProperties = { ...cellStyle, color: CIM.secondary };
const nameCellStyle: CSSProperties = {
    ...cellStyle,
    fontWeight: 700,
    whiteSpace: 'nowrap',
};
const actionBtnStyle: CSSProperties = {
    padding: '5px 10px',
    fontSize: '0.7rem',
    fontWeight: 700,
    color: CIM.white,
    background: CIM.primary,
    border: 'none',
    borderRadius: 7,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
};
const outlineBtnStyle: CSSProperties = {
    ...actionBtnStyle,
    color: CIM.primary,
    background: `${CIM.primary}10`,
    border: `1px solid ${CIM.primary}22`,
};
const reviewBtnStyle: CSSProperties = {
    ...actionBtnStyle,
    background: CIM.secondary,
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
};
const paginationStyle: CSSProperties = {
    padding: '14px 20px',
    display: 'flex',
    justifyContent: 'center',
    gap: 4,
    borderTop: `1px solid ${CIM.border}`,
};
const modalBackdropStyle: CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(6, 31, 57, 0.5)',
    zIndex: 50,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
};
const modalStyle: CSSProperties = {
    width: 'min(980px, 100%)',
    maxHeight: '90vh',
    overflow: 'auto',
    background: CIM.white,
    borderRadius: 8,
    border: `1px solid ${CIM.border}`,
    boxShadow: '0 24px 60px rgba(6,31,57,0.24)',
};
const modalHeaderStyle: CSSProperties = {
    position: 'sticky',
    top: 0,
    zIndex: 1,
    background: CIM.white,
    display: 'flex',
    justifyContent: 'space-between',
    gap: 16,
    alignItems: 'flex-start',
    padding: '18px 20px',
    borderBottom: `1px solid ${CIM.border}`,
};
const modalGridStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
    gap: 14,
    padding: 20,
};
const detailSectionStyle: CSSProperties = {
    border: `1px solid ${CIM.border}`,
    borderRadius: 8,
    padding: 14,
    background: CIM.white,
};
const detailTitleStyle: CSSProperties = {
    margin: '0 0 12px',
    color: CIM.primary,
    fontSize: '0.86rem',
    fontWeight: 800,
};
const closeBtnStyle: CSSProperties = {
    border: `1px solid ${CIM.border}`,
    color: CIM.primary,
    background: CIM.bg,
    borderRadius: 7,
    padding: '7px 12px',
    fontSize: '0.76rem',
    fontWeight: 800,
    cursor: 'pointer',
};
