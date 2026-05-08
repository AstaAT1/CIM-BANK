import type { DateSelectArg, EventInput } from '@fullcalendar/core';
import CimFeedbackModal from '@/components/cim-feedback-modal';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import { Head, router } from '@inertiajs/react';
import {
    ArrowLeft,
    BadgeCheck,
    Building2,
    CalendarCheck,
    CheckCircle2,
    Clock3,
    Eraser,
    Landmark,
    Mail,
    MapPin,
    MousePointerClick,
    Phone,
    RefreshCw,
    ShieldCheck,
    Sparkles,
    UserRound,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ComponentType, ReactNode } from 'react';
import { motion } from 'motion/react';
import gsap from 'gsap';
import ThemeToggle from '@/components/theme-toggle';
import background from '../customer/images/CIM.png';

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
        customer_profile: {
            cin: string;
            employment_status: string;
            phone: string;
        } | null;
    };
    bookedSlots: string[];
    branches: { id: number; name: string; city: string }[];
};

const journeySteps = [
    { label: 'Contact', done: true },
    { label: 'Personal', done: true },
    { label: 'Identity', done: true },
    { label: 'Appointment', done: false },
];

export default function AppointmentBooking({
    request: req,
    bookedSlots,
}: Props) {
    const pageRef = useRef<HTMLDivElement | null>(null);
    const [selectedSlot, setSelectedSlot] = useState<{
        start: string;
        end: string;
    } | null>(null);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState('');

    const bookedEvents = useMemo((): EventInput[] => {
        return (bookedSlots ?? []).map((iso, index) => {
            const start = new Date(iso);
            const end = new Date(start.getTime() + 30 * 60 * 1000);

            return {
                id: `booked-${index}`,
                title: 'Booked',
                start: start.toISOString(),
                end: end.toISOString(),
                display: 'background',
                backgroundColor: 'rgba(248, 113, 113, 0.25)',
                classNames: ['cim-booked-slot'],
            };
        });
    }, [bookedSlots]);

    const selectedEvent = useMemo((): EventInput[] => {
        if (!selectedSlot) {
            return [];
        }

        return [
            {
                id: 'user-selected',
                title: '✓ Your appointment',
                start: selectedSlot.start,
                end: selectedSlot.end,
                backgroundColor: CIM.accent,
                borderColor: CIM.accent,
                textColor: CIM.dark,
                classNames: ['cim-selected-event'],
            },
        ];
    }, [selectedSlot]);

    const allEvents = useMemo(
        () => [...bookedEvents, ...selectedEvent],
        [bookedEvents, selectedEvent],
    );

    const selectedDisplay = useMemo(() => {
        if (!selectedSlot) {
            return '';
        }

        return new Date(selectedSlot.start).toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    }, [selectedSlot]);

    const selectedShort = useMemo(() => {
        if (!selectedSlot) {
            return null;
        }

        const date = new Date(selectedSlot.start);

        return {
            day: date.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
            }),
            time: date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
            }),
        };
    }, [selectedSlot]);

    const isSlotBooked = useCallback(
        (startStr: string) => {
            const startMs = new Date(startStr).getTime();

            return (bookedSlots ?? []).some((iso) => {
                const bookedMs = new Date(iso).getTime();

                return Math.abs(startMs - bookedMs) < 30 * 60 * 1000;
            });
        },
        [bookedSlots],
    );

    const handleSelect = useCallback(
        (info: DateSelectArg) => {
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

            const end = new Date(start.getTime() + 30 * 60 * 1000);

            setSelectedSlot({ start: info.startStr, end: end.toISOString() });
            setError('');
        },
        [isSlotBooked],
    );

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

    useEffect(() => {
        if (!pageRef.current) {
            return undefined;
        }

        const ctx = gsap.context(() => {
            gsap.fromTo(
                '.appointment-reveal',
                { autoAlpha: 0, y: 24 },
                {
                    autoAlpha: 1,
                    y: 0,
                    duration: 0.72,
                    stagger: 0.06,
                    ease: 'power3.out',
                },
            );

            gsap.to('.appointment-orb', {
                x: 18,
                y: -14,
                scale: 1.06,
                duration: 5.2,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut',
            });
        }, pageRef);

        return () => ctx.revert();
    }, []);

    return (
        <>
            <Head title="Book an Appointment — CIM" />
            <CimFeedbackModal
                open={Boolean(error)}
                type="warning"
                title="Appointment needs attention"
                message={error}
                confirmLabel="Close"
                onClose={() => setError('')}
            />

            <main
                ref={pageRef}
                className="relative min-h-svh overflow-x-hidden bg-[#F7F8FA] text-[#061F39] dark:bg-[#061F39] dark:text-white"
            >
                <div className="fixed top-5 right-5 z-50">
                    <ThemeToggle />
                </div>

                <div className="fixed inset-0">
                    <img
                        src={background}
                        alt="CIM Bank"
                        className="h-full w-full object-cover opacity-[0.08] dark:opacity-100"
                    />
                    <div className="absolute inset-0 bg-[#F7F8FA]/84 dark:bg-[#061F39]/60" />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#F7F8FA]/96 via-white/84 to-[#F7F8FA]/70 dark:from-[#061F39]/94 dark:via-[#061F39]/68 dark:to-[#061F39]/34" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#F7F8FA]/86 via-transparent to-white/38 dark:from-[#061F39]/82 dark:via-transparent dark:to-[#061F39]/20" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(212,162,60,0.25),transparent_28%),radial-gradient(circle_at_88%_18%,rgba(10,100,116,0.22),transparent_34%)]" />
                </div>

                <div className="appointment-orb pointer-events-none fixed -top-24 right-10 h-80 w-80 rounded-full bg-[#D4A23C]/18 blur-3xl" />
                <div className="appointment-orb pointer-events-none fixed bottom-10 -left-28 h-96 w-96 rounded-full bg-[#0A6474]/24 blur-3xl" />

                <div className="relative z-10 mx-auto flex min-h-svh max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
                    <header className="appointment-reveal mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <img
                                src="/logo_twil.png"
                                alt="CIM Bank"
                                className="h-12 w-auto max-w-[230px] object-contain drop-shadow-2xl"
                            />

                            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#D4A23C]/35 bg-[#D4A23C]/12 px-4 py-2 text-xs font-bold tracking-[0.18em] text-[#F6D27B] uppercase backdrop-blur-xl">
                                <Sparkles className="h-4 w-4" />
                                Final onboarding step
                            </div>

                            <h1 className="mt-4 max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-[#061F39] dark:text-white sm:text-4xl lg:text-5xl">
                                Choose your branch appointment.
                            </h1>

                            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-white/68">
                                Select a future weekday slot for your in-branch
                                verification. Booked slots are blocked, and your
                                appointment will be attached to request{' '}
                                <span className="font-semibold text-[#F6D27B]">
                                    {req.request_number}
                                </span>
                                .
                            </p>
                        </div>

                        <JourneyCard />
                    </header>

                    <section className="grid flex-1 gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
                        <motion.div
                            className="appointment-reveal overflow-hidden rounded-[1.75rem] border border-[#D1D9DA]/80 bg-white/86 text-[#061F39] shadow-[0_30px_90px_rgba(6,31,57,0.12)] backdrop-blur-2xl dark:border-white/14 dark:bg-white/[0.13] dark:text-white dark:shadow-[0_30px_100px_rgba(0,0,0,0.32)]"
                            whileHover={{ y: -2 }}
                            transition={{ duration: 0.22 }}
                        >
                            <div className="flex flex-col gap-4 border-b border-[#D1D9DA]/70 px-5 py-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <div className="inline-flex items-center gap-2 rounded-full border border-[#0A6474]/30 bg-[#0A6474]/10 px-3 py-1 text-xs font-semibold text-[#0A6474] dark:bg-[#0A6474]/18 dark:text-cyan-100">
                                        <MousePointerClick className="h-3.5 w-3.5" />
                                        Click or drag a slot
                                    </div>
                                    <h2 className="mt-3 text-xl font-semibold text-[#061F39] dark:text-white">
                                        Appointment calendar
                                    </h2>
                                    <p className="mt-1 text-sm text-slate-500 dark:text-white/55">
                                        Available hours: Monday to Friday, 08:30
                                        — 16:30.
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-2 text-xs font-semibold">
                                    <span className="rounded-full border border-[#D4A23C]/35 bg-[#D4A23C]/12 px-3 py-1 text-[#F6D27B]">
                                        Gold = selected
                                    </span>
                                    <span className="rounded-full border border-rose-300/30 bg-rose-500/10 px-3 py-1 text-rose-700 dark:border-rose-300/20 dark:bg-rose-400/10 dark:text-rose-100">
                                        Red = booked
                                    </span>
                                </div>
                            </div>

                            <div className="p-3 sm:p-5">
                                <div className="cim-calendar overflow-hidden rounded-[1.4rem] border border-[#D1D9DA]/80 bg-white/[0.96] p-3 text-[#061F39] shadow-sm dark:border-white/10">
                                    <FullCalendar
                                        plugins={[
                                            dayGridPlugin,
                                            timeGridPlugin,
                                            interactionPlugin,
                                        ]}
                                        initialView="timeGridWeek"
                                        headerToolbar={{
                                            left: 'prev,next today',
                                            center: 'title',
                                            right: 'timeGridWeek,timeGridDay',
                                        }}
                                        selectable={true}
                                        selectMirror={true}
                                        select={handleSelect}
                                        unselectAuto={false}
                                        events={allEvents}
                                        slotMinTime="08:30:00"
                                        slotMaxTime="16:30:00"
                                        slotDuration="00:30:00"
                                        weekends={false}
                                        allDaySlot={false}
                                        height="auto"
                                        nowIndicator={true}
                                        validRange={{
                                            start: new Date()
                                                .toISOString()
                                                .split('T')[0],
                                        }}
                                        eventDisplay="auto"
                                        longPressDelay={0}
                                        selectLongPressDelay={0}
                                    />
                                </div>
                            </div>
                        </motion.div>

                        <aside className="space-y-5">
                            <motion.div
                                className="appointment-reveal overflow-hidden rounded-[1.75rem] border border-[#D1D9DA]/80 bg-white/86 text-[#061F39] shadow-[0_30px_90px_rgba(6,31,57,0.1)] backdrop-blur-2xl dark:border-white/14 dark:bg-white/[0.13] dark:text-white dark:shadow-[0_30px_100px_rgba(0,0,0,0.28)]"
                                whileHover={{ y: -2 }}
                                transition={{ duration: 0.22 }}
                            >
                                <div className="border-b border-[#D1D9DA]/70 px-5 py-4 dark:border-white/10">
                                    <div className="flex items-center gap-3">
                                        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#D4A23C]/14 text-[#F6D27B]">
                                            <UserRound className="h-5 w-5" />
                                        </span>
                                        <div>
                                            <h3 className="font-semibold text-[#061F39] dark:text-white">
                                                Request summary
                                            </h3>
                                            <p className="text-xs text-slate-500 dark:text-white/48">
                                                Verification dossier
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid gap-2 p-5">
                                    <SummaryRow
                                        icon={UserRound}
                                        label="Full name"
                                        value={req.user.name}
                                    />
                                    <SummaryRow
                                        icon={Mail}
                                        label="Email"
                                        value={req.user.email}
                                    />
                                    <SummaryRow
                                        icon={Phone}
                                        label="Phone"
                                        value={req.user.phone}
                                    />
                                    <SummaryRow
                                        icon={BadgeCheck}
                                        label="CIN"
                                        value={req.customer_profile?.cin || '—'}
                                    />
                                    <SummaryRow
                                        icon={Building2}
                                        label="Branch"
                                        value={
                                            req.branch
                                                ? `${req.branch.name}, ${req.branch.city}`
                                                : '—'
                                        }
                                    />
                                </div>
                            </motion.div>

                            <motion.div
                                className="appointment-reveal overflow-hidden rounded-[1.75rem] border border-[#D1D9DA]/80 bg-white/86 text-[#061F39] shadow-[0_30px_90px_rgba(6,31,57,0.1)] backdrop-blur-2xl dark:border-white/14 dark:bg-white/[0.13] dark:text-white dark:shadow-[0_30px_100px_rgba(0,0,0,0.28)]"
                                whileHover={{ y: -2 }}
                                transition={{ duration: 0.22 }}
                            >
                                <div className="border-b border-[#D1D9DA]/70 px-5 py-4 dark:border-white/10">
                                    <div className="flex items-center gap-3">
                                        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0A6474]/10 text-[#0A6474] dark:bg-[#0A6474]/20 dark:text-cyan-100">
                                            <CalendarCheck className="h-5 w-5" />
                                        </span>
                                        <div>
                                            <h3 className="font-semibold text-[#061F39] dark:text-white">
                                                Confirm booking
                                            </h3>
                                            <p className="text-xs text-slate-500 dark:text-white/48">
                                                30-minute verification slot
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-5">
                                    {selectedSlot && selectedShort ? (
                                        <div className="rounded-[1.35rem] border border-[#D4A23C]/45 bg-[#D4A23C]/12 p-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="text-xs font-bold tracking-[0.14em] text-[#F6D27B] uppercase">
                                                        Selected appointment
                                                    </p>
                                                    <p className="mt-2 text-2xl font-semibold text-[#061F39] dark:text-white">
                                                        {selectedShort.day}
                                                    </p>
                                                    <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-white/70">
                                                        <Clock3 className="h-4 w-4 text-[#F6D27B]" />
                                                        {selectedShort.time}
                                                    </p>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={clearSelection}
                                                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#D1D9DA]/80 bg-white text-slate-500 transition hover:border-rose-300/45 hover:bg-rose-500/10 hover:text-rose-700 dark:border-white/12 dark:bg-white/[0.08] dark:text-white/75 dark:hover:border-rose-300/35 dark:hover:bg-rose-400/12 dark:hover:text-rose-100"
                                                    title="Clear selection"
                                                >
                                                    <Eraser className="h-4 w-4" />
                                                </button>
                                            </div>

                                            <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-white/55">
                                                {selectedDisplay}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="rounded-[1.35rem] border border-dashed border-[#D1D9DA]/80 bg-[#F7F8FA]/80 p-5 text-center dark:border-white/16 dark:bg-white/[0.07]">
                                            <CalendarCheck className="mx-auto h-8 w-8 text-[#F6D27B]" />
                                            <p className="mt-3 text-sm font-semibold text-[#061F39] dark:text-white">
                                                No slot selected
                                            </p>
                                            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-white/52">
                                                Pick any available future time
                                                slot from the calendar.
                                            </p>
                                        </div>
                                    )}

                                    <button
                                        type="button"
                                        onClick={handleBook}
                                        disabled={!selectedSlot || processing}
                                        className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#D4A23C] px-5 text-sm font-bold text-[#061F39] shadow-lg shadow-[#D4A23C]/20 transition hover:-translate-y-0.5 hover:bg-[#e2b34a] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none dark:disabled:bg-white/18 dark:disabled:text-white/40"
                                    >
                                        {processing ? (
                                            <>
                                                <RefreshCw className="h-4 w-4 animate-spin" />
                                                Booking...
                                            </>
                                        ) : selectedSlot ? (
                                            <>
                                                Confirm appointment
                                                <CheckCircle2 className="h-4 w-4" />
                                            </>
                                        ) : (
                                            'Select a slot first'
                                        )}
                                    </button>
                                </div>
                            </motion.div>

                            <div className="appointment-reveal rounded-[1.4rem] border border-[#D1D9DA]/80 bg-white/80 p-4 backdrop-blur-xl dark:border-white/12 dark:bg-white/[0.08]">
                                <div className="flex gap-3">
                                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#F6D27B]" />
                                    <p className="text-xs leading-6 text-slate-500 dark:text-white/58">
                                        Your appointment only confirms the
                                        verification visit. Account activation is
                                        completed after staff review.
                                    </p>
                                </div>
                            </div>
                        </aside>
                    </section>
                </div>
            </main>

            <style>{`
                .cim-calendar .fc {
                    font-family: 'Inter', sans-serif;
                    --fc-border-color: rgba(209, 217, 218, 0.82);
                    --fc-button-bg-color: ${CIM.primary};
                    --fc-button-border-color: ${CIM.primary};
                    --fc-button-hover-bg-color: ${CIM.secondary};
                    --fc-button-hover-border-color: ${CIM.secondary};
                    --fc-button-active-bg-color: ${CIM.dark};
                    --fc-button-active-border-color: ${CIM.dark};
                    --fc-today-bg-color: rgba(212, 162, 60, 0.08);
                    --fc-now-indicator-color: ${CIM.accent};
                    --fc-highlight-color: rgba(212, 162, 60, 0.18);
                    color: ${CIM.dark};
                }

                .cim-calendar .fc .fc-toolbar {
                    gap: 0.75rem;
                    flex-wrap: wrap;
                    margin-bottom: 0.8rem;
                }

                .cim-calendar .fc .fc-button {
                    border-radius: 999px;
                    padding: 0.45rem 0.85rem;
                    font-size: 0.75rem;
                    font-weight: 700;
                    text-transform: capitalize;
                    box-shadow: none;
                }

                .cim-calendar .fc .fc-toolbar-title {
                    color: ${CIM.primary};
                    font-size: 1rem;
                    font-weight: 800;
                    letter-spacing: -0.02em;
                }

                .cim-calendar .fc .fc-col-header-cell-cushion {
                    color: ${CIM.primary};
                    font-size: 0.74rem;
                    font-weight: 800;
                    padding: 0.6rem 0.25rem;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                }

                .cim-calendar .fc .fc-timegrid-slot-label-cushion {
                    color: ${CIM.secondary};
                    font-size: 0.72rem;
                    font-weight: 700;
                }

                .cim-calendar .fc .fc-timegrid-slot {
                    cursor: pointer;
                    height: 2rem;
                }

                .cim-calendar .fc .fc-timegrid-slot:hover {
                    background: rgba(10, 100, 116, 0.055);
                }

                .cim-calendar .fc .fc-timegrid-axis,
                .cim-calendar .fc .fc-col-header-cell {
                    background: rgba(247, 248, 250, 0.72);
                }

                .cim-calendar .fc .cim-selected-event {
                    background: ${CIM.accent} !important;
                    border-color: ${CIM.accent} !important;
                    border-radius: 0.75rem !important;
                    box-shadow: 0 0 0 3px rgba(212, 162, 60, 0.3), 0 8px 20px rgba(212, 162, 60, 0.25) !important;
                    color: ${CIM.dark} !important;
                    font-size: 0.75rem !important;
                    font-weight: 900 !important;
                    z-index: 10 !important;
                }

                .cim-calendar .fc .cim-booked-slot {
                    opacity: 0.62;
                }

                .cim-calendar .fc .fc-highlight {
                    background: rgba(212, 162, 60, 0.18) !important;
                    border: 2px dashed ${CIM.accent} !important;
                    border-radius: 0.65rem;
                }

                @media (max-width: 900px) {
                    .cim-calendar .fc .fc-toolbar {
                        align-items: flex-start;
                        flex-direction: column;
                    }
                }
            `}</style>
        </>
    );
}

function JourneyCard() {
    return (
        <div className="appointment-reveal w-full rounded-[1.5rem] border border-[#D1D9DA]/80 bg-white/80 p-4 backdrop-blur-2xl dark:border-white/12 dark:bg-white/[0.1] lg:max-w-[420px]">
            <div className="mb-3 flex items-center gap-2">
                <Landmark className="h-4 w-4 text-[#F6D27B]" />
                <p className="text-xs font-bold tracking-[0.16em] text-[#F6D27B] uppercase">
                    Onboarding progress
                </p>
            </div>

            <div className="grid grid-cols-4 gap-2">
                {journeySteps.map((step, index) => {
                    const active = index === 3;

                    return (
                        <div
                            key={step.label}
                            className={`rounded-2xl border px-2 py-3 text-center ${
                                active
                                    ? 'border-[#D4A23C]/55 bg-[#D4A23C]/12'
                                    : 'border-emerald-300/20 bg-emerald-400/10'
                            }`}
                        >
                            <span
                                className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                                    active
                                        ? 'bg-[#D4A23C] text-[#061F39]'
                                        : 'bg-emerald-300 text-[#061F39]'
                                }`}
                            >
                                {step.done ? '✓' : '4'}
                            </span>
                            <p
                                className={`mt-2 text-[10px] font-bold ${
                                    active
                                        ? 'text-[#D4A23C] dark:text-[#F6D27B]'
                                        : 'text-emerald-700 dark:text-emerald-100'
                                }`}
                            >
                                {step.label}
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function SummaryRow({
    icon: Icon,
    label,
    value,
}: {
    icon: ComponentType<{ className?: string }>;
    label: string;
    value: ReactNode;
}) {
    return (
        <div className="rounded-2xl border border-[#D1D9DA]/80 bg-[#F7F8FA]/80 px-4 py-3 dark:border-white/12 dark:bg-white/[0.08]">
            <div className="flex items-start gap-3">
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#F6D27B]" />
                <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold tracking-[0.12em] text-slate-400 uppercase dark:text-white/42">
                        {label}
                    </p>
                    <p className="mt-1 break-words text-sm font-semibold text-[#061F39] dark:text-white/82">
                        {value}
                    </p>
                </div>
            </div>
        </div>
    );
}
