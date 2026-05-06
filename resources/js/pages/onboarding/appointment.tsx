import { Head, router, usePage } from '@inertiajs/react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useCallback, useMemo, useState } from 'react';
import type { DateSelectArg, EventInput } from '@fullcalendar/core';

const CIM = {
    primary: '#082F54',
    secondary: '#0A6474',
    accent: '#D4A23C',
    dark: '#061F39',
    bg: '#F7F8FA',
    white: '#FFFFFF',
    border: '#D1D9DA',
};

type Props = {
    request: {
        id: number;
        request_number: string;
        status: string;
        branch: { id: number; name: string; city: string } | null;
        user: { name: string; email: string; phone: string };
        customer_profile: { cin: string; employment_status: string; phone: string } | null;
    };
    bookedSlots: string[];
    branches: { id: number; name: string; city: string }[];
};

export default function AppointmentBooking({ request: req, bookedSlots }: Props) {
    const [selectedSlot, setSelectedSlot] = useState<{ start: string; end: string } | null>(null);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState('');
    const [hovering, setHovering] = useState(false);

    // Format the booked slots from the server as "unavailable" background events
    const bookedEvents = useMemo((): EventInput[] => {
        return (bookedSlots ?? []).map((iso, i) => {
            const d = new Date(iso);
            const end = new Date(d.getTime() + 30 * 60 * 1000);
            return {
                id: `booked-${i}`,
                title: 'Booked',
                start: d.toISOString(),
                end: end.toISOString(),
                display: 'background',
                backgroundColor: '#fee2e2',
                classNames: ['cim-booked-slot'],
            };
        });
    }, [bookedSlots]);

    // The selected slot rendered as a calendar event
    const selectedEvent = useMemo((): EventInput[] => {
        if (!selectedSlot) return [];
        return [{
            id: 'user-selected',
            title: '✓ Your Appointment',
            start: selectedSlot.start,
            end: selectedSlot.end,
            backgroundColor: CIM.accent,
            borderColor: CIM.accent,
            textColor: CIM.dark,
            classNames: ['cim-selected-event'],
        }];
    }, [selectedSlot]);

    const allEvents = useMemo(() => [...bookedEvents, ...selectedEvent], [bookedEvents, selectedEvent]);

    const selectedDisplay = useMemo(() => {
        if (!selectedSlot) return '';
        return new Date(selectedSlot.start).toLocaleString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    }, [selectedSlot]);

    // Check if a slot overlaps with any booked slot
    const isSlotBooked = useCallback((startStr: string) => {
        const startMs = new Date(startStr).getTime();
        return (bookedSlots ?? []).some((iso) => {
            const bookedMs = new Date(iso).getTime();
            return Math.abs(startMs - bookedMs) < 30 * 60 * 1000;
        });
    }, [bookedSlots]);

    // FullCalendar `select` callback — fires when user clicks/drags a time range
    const handleSelect = useCallback((info: DateSelectArg) => {
        const start = new Date(info.startStr);
        const now = new Date();

        if (start < now) {
            setError('Cannot select a past time slot.');
            return;
        }

        if (isSlotBooked(info.startStr)) {
            setError('This slot is already booked. Please choose another.');
            return;
        }

        // Snap to 30-minute slot
        const end = new Date(start.getTime() + 30 * 60 * 1000);

        setSelectedSlot({ start: info.startStr, end: end.toISOString() });
        setError('');
    }, [isSlotBooked]);

    const clearSelection = useCallback(() => {
        setSelectedSlot(null);
        setError('');
    }, []);

    const handleBook = useCallback(() => {
        if (!selectedSlot) {
            setError('Please select an appointment time from the calendar.');
            return;
        }
        setProcessing(true);
        router.post(
            `/onboarding/appointment/${req.id}`,
            { scheduled_at: selectedSlot.start },
            {
                onError: (errs) => setError(Object.values(errs).join(' ')),
                onFinish: () => setProcessing(false),
            },
        );
    }, [selectedSlot, req.id]);

    return (
        <>
            <Head title="Book an Appointment — CIM" />
            <div style={{ minHeight: '100vh', background: CIM.bg, fontFamily: "'Inter', sans-serif" }}>
                {/* Header */}
                <header style={{
                    background: `linear-gradient(135deg, ${CIM.dark} 0%, ${CIM.primary} 100%)`,
                    padding: '32px 24px 28px', textAlign: 'center',
                }}>
                    <div style={{ fontSize: '0.65rem', color: CIM.accent, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 500 }}>
                        Credit Intelligence Mizan
                    </div>
                    <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.4rem', color: CIM.white, margin: '8px 0 4px', fontWeight: 600 }}>
                        Book Your Appointment
                    </h1>
                    <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)' }}>
                        Click or drag on a future time slot to select your appointment
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 20 }}>
                        {['Contact', 'Personal', 'Identity', 'Appointment'].map((label, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div style={{
                                    width: 28, height: 28, borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '0.7rem', fontWeight: 700,
                                    background: i < 3 ? CIM.accent : `linear-gradient(135deg, ${CIM.primary}, ${CIM.secondary})`,
                                    color: CIM.white,
                                    border: i === 3 ? `2px solid ${CIM.accent}` : '2px solid transparent',
                                }}>
                                    {i < 3 ? '✓' : '4'}
                                </div>
                                <span style={{ fontSize: '0.65rem', color: i === 3 ? CIM.accent : 'rgba(255,255,255,0.5)', fontWeight: i === 3 ? 600 : 400 }}>
                                    {label}
                                </span>
                            </div>
                        ))}
                    </div>
                </header>

                <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px 48px' }}>
                    <div className="cim-appt-layout">
                        {/* Calendar Card */}
                        <div style={{
                            background: CIM.white, borderRadius: 16,
                            border: `1px solid ${CIM.border}`, padding: 24,
                            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                        }}>
                            <h2 style={{ color: CIM.primary, fontSize: '1.05rem', fontWeight: 600, marginBottom: 4 }}>
                                Select Your Appointment
                            </h2>
                            <p style={{ fontSize: '0.78rem', color: CIM.secondary, marginBottom: 16 }}>
                                Click on any future weekday time slot to select it. Red shaded areas are already booked.
                            </p>
                            <div className="cim-calendar">
                                <FullCalendar
                                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                                    initialView="timeGridWeek"
                                    headerToolbar={{
                                        left: 'prev,next today',
                                        center: 'title',
                                        right: 'timeGridWeek,timeGridDay',
                                    }}
                                    /* --- Selection config --- */
                                    selectable={true}
                                    selectMirror={true}
                                    select={handleSelect}
                                    unselectAuto={false}
                                    /* --- Events --- */
                                    events={allEvents}
                                    /* --- Time constraints --- */
                                    slotMinTime="08:30:00"
                                    slotMaxTime="16:30:00"
                                    slotDuration="00:30:00"
                                    weekends={false}
                                    allDaySlot={false}
                                    /* --- Display --- */
                                    height="auto"
                                    nowIndicator={true}
                                    validRange={{ start: new Date().toISOString().split('T')[0] }}
                                    eventDisplay="auto"
                                    longPressDelay={0}
                                    selectLongPressDelay={0}
                                />
                            </div>
                        </div>

                        {/* Right Sidebar */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            {/* Summary */}
                            <div style={{
                                background: CIM.white, borderRadius: 16,
                                border: `1px solid ${CIM.border}`, padding: 24,
                                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                            }}>
                                <h3 style={{ color: CIM.primary, fontSize: '0.95rem', fontWeight: 600, marginBottom: 16 }}>
                                    Request Summary
                                </h3>
                                <SummaryRow label="Full Name" value={req.user.name} />
                                <SummaryRow label="Email" value={req.user.email} />
                                <SummaryRow label="Phone" value={req.user.phone} />
                                <SummaryRow label="CIN" value={req.customer_profile?.cin || '—'} />
                                <SummaryRow label="Profession" value={req.customer_profile?.employment_status || '—'} />
                                <SummaryRow label="Branch" value={req.branch?.name || '—'} />
                                <SummaryRow label="Request #" value={req.request_number} />
                                <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.78rem', color: CIM.secondary, fontWeight: 500 }}>Status</span>
                                    <span style={{
                                        fontSize: '0.72rem', fontWeight: 600, color: CIM.accent,
                                        background: `${CIM.accent}15`, padding: '4px 12px',
                                        borderRadius: 20, border: `1px solid ${CIM.accent}30`,
                                    }}>Pending Verification</span>
                                </div>
                            </div>

                            {/* Booking Card */}
                            <div style={{
                                background: CIM.white, borderRadius: 16,
                                border: `1px solid ${CIM.border}`, padding: 24,
                                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                            }}>
                                <h3 style={{ color: CIM.primary, fontSize: '0.95rem', fontWeight: 600, marginBottom: 12 }}>
                                    Confirm Booking
                                </h3>

                                {selectedSlot ? (
                                    <div
                                        onMouseEnter={() => setHovering(true)}
                                        onMouseLeave={() => setHovering(false)}
                                        style={{
                                            position: 'relative', marginBottom: 16,
                                            padding: '14px 16px', borderRadius: 12,
                                            border: `2px solid ${CIM.accent}`,
                                            background: `${CIM.accent}0D`,
                                        }}
                                    >
                                        {/* Hover action icons */}
                                        <div style={{
                                            position: 'absolute', top: 8, right: 8,
                                            display: 'flex', gap: 6,
                                            opacity: hovering ? 1 : 0,
                                            transition: 'opacity 0.2s',
                                        }}>
                                            <ActionIcon
                                                title="Change slot"
                                                onClick={clearSelection}
                                                hoverBg={`${CIM.secondary}18`}
                                                hoverBorder={CIM.secondary}
                                                icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={CIM.secondary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>}
                                            />
                                            <ActionIcon
                                                title="Remove"
                                                onClick={clearSelection}
                                                hoverBg="#fee2e2"
                                                hoverBorder="#fca5a5"
                                                icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>}
                                            />
                                        </div>

                                        <p style={{ fontSize: '0.72rem', color: CIM.secondary, marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                            Selected Appointment
                                        </p>
                                        <p style={{ fontSize: '0.95rem', color: CIM.dark, fontWeight: 700, margin: 0, lineHeight: 1.4 }}>
                                            {selectedDisplay}
                                        </p>
                                        <p style={{ fontSize: '0.68rem', color: CIM.secondary, marginTop: 6 }}>
                                            Hover for edit / remove
                                        </p>
                                    </div>
                                ) : (
                                    <div style={{
                                        marginBottom: 16, padding: '20px 16px', borderRadius: 12,
                                        border: `2px dashed ${CIM.border}`, background: CIM.bg,
                                        textAlign: 'center',
                                    }}>
                                        <p style={{ fontSize: '0.82rem', color: 'rgba(0,0,0,0.4)', margin: 0 }}>
                                            Click on any future time slot on the calendar to select your appointment.
                                        </p>
                                    </div>
                                )}

                                {error && (
                                    <p style={{
                                        fontSize: '0.8rem', color: '#e53e3e', marginBottom: 12,
                                        padding: '8px 12px', background: '#fff5f5', borderRadius: 8,
                                        border: '1px solid #fecaca',
                                    }}>
                                        {error}
                                    </p>
                                )}

                                <button
                                    onClick={handleBook}
                                    disabled={!selectedSlot || processing}
                                    style={{
                                        width: '100%', padding: '13px 20px',
                                        fontSize: '0.9rem', fontWeight: 600,
                                        color: CIM.white,
                                        background: selectedSlot
                                            ? `linear-gradient(135deg, ${CIM.primary}, ${CIM.secondary})`
                                            : CIM.border,
                                        border: selectedSlot
                                            ? `1.5px solid ${CIM.accent}40`
                                            : `1.5px solid ${CIM.border}`,
                                        borderRadius: 12,
                                        cursor: selectedSlot && !processing ? 'pointer' : 'not-allowed',
                                        transition: 'all 0.3s',
                                        opacity: processing ? 0.6 : 1,
                                    }}
                                >
                                    {processing ? 'Booking...' : selectedSlot ? 'Confirm Appointment' : 'Select a Slot First'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .cim-appt-layout {
                    display: grid;
                    grid-template-columns: minmax(0, 1fr) 340px;
                    gap: 28px;
                    align-items: start;
                }
                @media (max-width: 900px) {
                    .cim-appt-layout { grid-template-columns: 1fr !important; }
                }
                .cim-calendar .fc {
                    font-family: 'Inter', sans-serif;
                    --fc-border-color: ${CIM.border};
                    --fc-button-bg-color: ${CIM.primary};
                    --fc-button-border-color: ${CIM.primary};
                    --fc-button-hover-bg-color: ${CIM.secondary};
                    --fc-button-hover-border-color: ${CIM.secondary};
                    --fc-button-active-bg-color: ${CIM.dark};
                    --fc-button-active-border-color: ${CIM.dark};
                    --fc-today-bg-color: rgba(212, 162, 60, 0.06);
                    --fc-now-indicator-color: ${CIM.accent};
                    --fc-highlight-color: rgba(212, 162, 60, 0.18);
                }
                .cim-calendar .fc .fc-button {
                    font-size: 0.78rem; font-weight: 500;
                    border-radius: 8px; padding: 6px 14px;
                }
                .cim-calendar .fc .fc-toolbar-title {
                    font-size: 1rem; font-weight: 600; color: ${CIM.primary};
                }
                .cim-calendar .fc .fc-col-header-cell-cushion {
                    color: ${CIM.primary}; font-weight: 600; font-size: 0.78rem;
                }
                .cim-calendar .fc .fc-timegrid-slot-label-cushion {
                    color: ${CIM.secondary}; font-size: 0.72rem;
                }
                .cim-calendar .fc .fc-timegrid-slot {
                    cursor: pointer;
                    height: 28px;
                }
                .cim-calendar .fc .fc-timegrid-slot:hover {
                    background: rgba(10, 100, 116, 0.05);
                }
                /* Selected event styling */
                .cim-calendar .fc .cim-selected-event {
                    background: ${CIM.accent} !important;
                    border-color: ${CIM.accent} !important;
                    box-shadow: 0 0 0 3px rgba(212, 162, 60, 0.3), 0 4px 12px rgba(212, 162, 60, 0.25) !important;
                    font-weight: 700 !important;
                    font-size: 0.78rem !important;
                    border-radius: 8px !important;
                    z-index: 10 !important;
                }
                /* Booked slot background */
                .cim-calendar .fc .cim-booked-slot {
                    opacity: 0.5;
                }
                /* Selection mirror highlight */
                .cim-calendar .fc .fc-highlight {
                    background: rgba(212, 162, 60, 0.18) !important;
                    border: 2px dashed ${CIM.accent} !important;
                    border-radius: 6px;
                }
            `}</style>
        </>
    );
}

/* Helper components */
function SummaryRow({ label, value }: { label: string; value: string }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${CIM.border}20` }}>
            <span style={{ fontSize: '0.78rem', color: CIM.secondary, fontWeight: 500 }}>{label}</span>
            <span style={{ fontSize: '0.78rem', color: CIM.dark, fontWeight: 600, textAlign: 'right', maxWidth: '60%', wordBreak: 'break-word' }}>{value}</span>
        </div>
    );
}

function ActionIcon({ title, onClick, hoverBg, hoverBorder, icon }: {
    title: string; onClick: () => void; hoverBg: string; hoverBorder: string; icon: React.ReactNode;
}) {
    return (
        <button
            onClick={onClick}
            title={title}
            style={{
                width: 30, height: 30, borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: CIM.white, border: `1px solid ${CIM.border}`,
                cursor: 'pointer', transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = hoverBg; e.currentTarget.style.borderColor = hoverBorder; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = CIM.white; e.currentTarget.style.borderColor = CIM.border; }}
        >
            {icon}
        </button>
    );
}
