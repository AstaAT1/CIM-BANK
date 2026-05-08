import { Head, Link } from '@inertiajs/react';
import {
    ArrowRight,
    BadgeCheck,
    Building2,
    CalendarCheck,
    CheckCircle2,
    FileCheck2,
    Landmark,
    Mail,
    MapPin,
    Phone,
    ShieldCheck,
    Sparkles,
    UserRound,
} from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { ComponentType, ReactNode } from 'react';
import { motion } from 'motion/react';
import gsap from 'gsap';
import ThemeToggle from '@/components/theme-toggle';
import background from '../customer/images/CIM.png';

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

const journeySteps = [
    'Contact',
    'Personal',
    'Identity',
    'Appointment',
];

export default function Confirmation({ request: req }: ConfirmationProps) {
    const pageRef = useRef<HTMLDivElement | null>(null);

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

    const appointmentShort = req.appointment
        ? {
              day: new Date(req.appointment.scheduled_at).toLocaleDateString(
                  'en-US',
                  {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                  },
              ),
              time: new Date(req.appointment.scheduled_at).toLocaleTimeString(
                  'en-US',
                  {
                      hour: '2-digit',
                      minute: '2-digit',
                  },
              ),
          }
        : null;

    useEffect(() => {
        if (!pageRef.current) {
            return undefined;
        }

        const ctx = gsap.context(() => {
            gsap.fromTo(
                '.confirmation-reveal',
                { autoAlpha: 0, y: 24 },
                {
                    autoAlpha: 1,
                    y: 0,
                    duration: 0.72,
                    stagger: 0.065,
                    ease: 'power3.out',
                },
            );

            gsap.fromTo(
                '.success-check',
                { scale: 0.7, rotate: -12, autoAlpha: 0 },
                {
                    scale: 1,
                    rotate: 0,
                    autoAlpha: 1,
                    duration: 0.7,
                    delay: 0.15,
                    ease: 'back.out(1.8)',
                },
            );

            gsap.to('.confirmation-orb', {
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
            <Head title="Request Confirmed — CIM" />

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
                    <div className="absolute inset-0 bg-[#F7F8FA]/84 dark:bg-[#061F39]/62" />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#F7F8FA]/96 via-white/84 to-[#F7F8FA]/70 dark:from-[#061F39]/94 dark:via-[#061F39]/68 dark:to-[#061F39]/34" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#F7F8FA]/86 via-transparent to-white/38 dark:from-[#061F39]/84 dark:via-transparent dark:to-[#061F39]/22" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(212,162,60,0.25),transparent_28%),radial-gradient(circle_at_88%_18%,rgba(10,100,116,0.22),transparent_34%)]" />
                </div>

                <div className="confirmation-orb pointer-events-none fixed -top-24 right-10 h-80 w-80 rounded-full bg-[#D4A23C]/18 blur-3xl" />
                <div className="confirmation-orb pointer-events-none fixed bottom-10 -left-28 h-96 w-96 rounded-full bg-[#0A6474]/24 blur-3xl" />

                <div className="relative z-10 mx-auto flex min-h-svh max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
                    <header className="confirmation-reveal mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <img
                                src="/logo_twil.png"
                                alt="CIM Bank"
                                className="h-12 w-auto max-w-[230px] object-contain drop-shadow-2xl"
                            />

                            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#D4A23C]/35 bg-[#D4A23C]/12 px-4 py-2 text-xs font-bold tracking-[0.18em] text-[#F6D27B] uppercase backdrop-blur-xl">
                                <Sparkles className="h-4 w-4" />
                                Onboarding completed
                            </div>

                            <h1 className="mt-4 max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-[#061F39] dark:text-white sm:text-4xl lg:text-5xl">
                                Your account request is recorded.
                            </h1>

                            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-white/68">
                                CIM received your account opening request. Visit
                                the selected branch at your appointment time for
                                identity verification and account activation.
                            </p>
                        </div>

                        <JourneyCard />
                    </header>

                    <section className="grid flex-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
                        <motion.div
                            className="confirmation-reveal overflow-hidden rounded-[1.75rem] border border-[#D1D9DA]/80 bg-white/86 text-[#061F39] shadow-[0_30px_90px_rgba(6,31,57,0.12)] backdrop-blur-2xl dark:border-white/14 dark:bg-white/[0.13] dark:text-white dark:shadow-[0_30px_100px_rgba(0,0,0,0.32)]"
                            whileHover={{ y: -2 }}
                            transition={{ duration: 0.22 }}
                        >
                            <div className="relative overflow-hidden border-b border-[#D1D9DA]/70 px-5 py-6 text-center dark:border-white/10 sm:px-8">
                                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(212,162,60,0.18),transparent_35%)]" />

                                <div className="success-check relative mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#D4A23C] text-[#061F39] shadow-[0_18px_55px_rgba(212,162,60,0.28)]">
                                    <CheckCircle2 className="h-10 w-10" />
                                </div>

                                <h2 className="relative mt-5 text-2xl font-semibold tracking-tight text-[#061F39] dark:text-white sm:text-3xl">
                                    Request recorded successfully
                                </h2>

                                <p className="relative mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500 dark:text-white/62">
                                    Your request is now pending CIM staff
                                    verification. Keep your appointment details
                                    and bring the required documents to the
                                    branch.
                                </p>

                                <div className="relative mx-auto mt-5 h-px max-w-xs bg-gradient-to-r from-transparent via-[#D4A23C] to-transparent" />
                            </div>

                            <div className="grid gap-5 p-5 lg:grid-cols-[1fr_0.82fr]">
                                <div>
                                    <div className="mb-4 flex items-center gap-3">
                                        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#D4A23C]/14 text-[#F6D27B]">
                                            <FileCheck2 className="h-5 w-5" />
                                        </span>
                                        <div>
                                            <h3 className="font-semibold text-[#061F39] dark:text-white">
                                                Request details
                                            </h3>
                                            <p className="text-xs text-slate-500 dark:text-white/48">
                                                Summary of your onboarding file
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid gap-2 sm:grid-cols-2">
                                        <InfoTile
                                            icon={UserRound}
                                            label="Full name"
                                            value={req.user.name}
                                        />
                                        <InfoTile
                                            icon={Mail}
                                            label="Email"
                                            value={req.user.email}
                                        />
                                        <InfoTile
                                            icon={Phone}
                                            label="Phone"
                                            value={req.user.phone}
                                        />
                                        <InfoTile
                                            icon={BadgeCheck}
                                            label="CIN"
                                            value={
                                                req.customer_profile?.cin || '—'
                                            }
                                        />
                                        <InfoTile
                                            icon={Building2}
                                            label="Profession"
                                            value={
                                                req.customer_profile
                                                    ?.employment_status || '—'
                                            }
                                        />
                                        <InfoTile
                                            icon={Landmark}
                                            label="Request #"
                                            value={req.request_number}
                                        />
                                        <InfoTile
                                            icon={MapPin}
                                            label="Branch"
                                            value={
                                                req.branch
                                                    ? `${req.branch.name}, ${req.branch.city}`
                                                    : '—'
                                            }
                                        />
                                        <InfoTile
                                            icon={CalendarCheck}
                                            label="Appointment"
                                            value={appointmentDate}
                                            highlight
                                        />
                                    </div>
                                </div>

                                <aside className="space-y-4">
                                    <div className="rounded-[1.4rem] border border-[#D4A23C]/35 bg-[#D4A23C]/12 p-5">
                                        <p className="text-xs font-bold tracking-[0.14em] text-[#F6D27B] uppercase">
                                            Appointment
                                        </p>

                                        {appointmentShort ? (
                                            <>
                                                <p className="mt-3 text-3xl font-semibold text-[#061F39] dark:text-white">
                                                    {appointmentShort.day}
                                                </p>
                                                <p className="mt-1 text-lg font-semibold text-slate-600 dark:text-white/72">
                                                    {appointmentShort.time}
                                                </p>
                                            </>
                                        ) : (
                                            <p className="mt-3 text-xl font-semibold text-[#061F39] dark:text-white">
                                                Not scheduled
                                            </p>
                                        )}

                                        <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-white/55">
                                            Please arrive 10 minutes early and
                                            bring your original CIN document.
                                        </p>
                                    </div>

                                    <div className="grid gap-2">
                                        <StatusBadge
                                            label="Request"
                                            value="Pending"
                                            tone="gold"
                                        />
                                        <StatusBadge
                                            label="Appointment"
                                            value="Booked"
                                            tone="teal"
                                        />
                                        <StatusBadge
                                            label="Verification"
                                            value="Pending"
                                            tone="navy"
                                        />
                                    </div>
                                </aside>
                            </div>
                        </motion.div>

                        <aside className="space-y-5">
                            <motion.div
                                className="confirmation-reveal overflow-hidden rounded-[1.75rem] border border-[#D1D9DA]/80 bg-white/86 text-[#061F39] shadow-[0_30px_90px_rgba(6,31,57,0.1)] backdrop-blur-2xl dark:border-white/14 dark:bg-white/[0.13] dark:text-white dark:shadow-[0_30px_100px_rgba(0,0,0,0.28)]"
                                whileHover={{ y: -2 }}
                                transition={{ duration: 0.22 }}
                            >
                                <div className="border-b border-[#D1D9DA]/70 px-5 py-4 dark:border-white/10">
                                    <div className="flex items-center gap-3">
                                        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0A6474]/10 text-[#0A6474] dark:bg-[#0A6474]/20 dark:text-cyan-100">
                                            <ShieldCheck className="h-5 w-5" />
                                        </span>
                                        <div>
                                            <h3 className="font-semibold text-[#061F39] dark:text-white">
                                                What happens next?
                                            </h3>
                                            <p className="text-xs text-slate-500 dark:text-white/48">
                                                Before account activation
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid gap-3 p-5">
                                    <NextStep
                                        number="01"
                                        title="Visit the branch"
                                        text="Go to your selected branch on the appointment date."
                                    />
                                    <NextStep
                                        number="02"
                                        title="Bring your documents"
                                        text="Bring the original CIN and any additional requested documents."
                                    />
                                    <NextStep
                                        number="03"
                                        title="CIM staff review"
                                        text="A bank representative verifies your identity and request."
                                    />
                                    <NextStep
                                        number="04"
                                        title="Account activation"
                                        text="After approval, your banking access becomes available."
                                    />
                                </div>
                            </motion.div>

                            <motion.div
                                className="confirmation-reveal rounded-[1.75rem] border border-[#D1D9DA]/80 bg-white/86 p-5 text-[#061F39] shadow-[0_30px_90px_rgba(6,31,57,0.1)] backdrop-blur-2xl dark:border-white/14 dark:bg-white/[0.13] dark:text-white dark:shadow-[0_30px_100px_rgba(0,0,0,0.24)]"
                                whileHover={{ y: -2 }}
                                transition={{ duration: 0.22 }}
                            >
                                <div className="flex gap-3">
                                    <Landmark className="mt-0.5 h-5 w-5 shrink-0 text-[#F6D27B]" />
                                    <div>
                                        <h3 className="font-semibold text-[#061F39] dark:text-white">
                                            Branch information
                                        </h3>
                                        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-white/58">
                                            {req.branch
                                                ? `${req.branch.name}, ${req.branch.city}`
                                                : 'No branch selected'}
                                        </p>
                                        {req.branch?.address && (
                                            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-white/45">
                                                {req.branch.address}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div
                                className="confirmation-reveal"
                                whileHover={{ y: -2 }}
                                transition={{ duration: 0.22 }}
                            >
                                <Link
                                    href="/dashboard"
                                    className="inline-flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[#D4A23C] px-5 text-sm font-bold text-[#061F39] shadow-lg shadow-[#D4A23C]/20 transition hover:bg-[#e2b34a]"
                                >
                                    Go to home
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </motion.div>
                        </aside>
                    </section>
                </div>
            </main>
        </>
    );
}

function JourneyCard() {
    return (
        <div className="confirmation-reveal w-full rounded-[1.5rem] border border-[#D1D9DA]/80 bg-white/80 p-4 backdrop-blur-2xl dark:border-white/12 dark:bg-white/[0.1] lg:max-w-[420px]">
            <div className="mb-3 flex items-center gap-2">
                <Landmark className="h-4 w-4 text-[#F6D27B]" />
                <p className="text-xs font-bold tracking-[0.16em] text-[#F6D27B] uppercase">
                    Onboarding completed
                </p>
            </div>

            <div className="grid grid-cols-4 gap-2">
                {journeySteps.map((label) => (
                    <div
                        key={label}
                        className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-2 py-3 text-center"
                    >
                        <span className="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-emerald-300 text-xs font-bold text-[#061F39]">
                            ✓
                        </span>
                        <p className="mt-2 text-[10px] font-bold text-emerald-700 dark:text-emerald-100">
                            {label}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}

function InfoTile({
    icon: Icon,
    label,
    value,
    highlight = false,
}: {
    icon: ComponentType<{ className?: string }>;
    label: string;
    value: ReactNode;
    highlight?: boolean;
}) {
    return (
        <div
            className={`rounded-2xl border px-4 py-3 ${
                highlight
                    ? 'border-[#D4A23C]/35 bg-[#D4A23C]/10'
                    : 'border-[#D1D9DA]/80 bg-[#F7F8FA]/80 dark:border-white/12 dark:bg-white/[0.08]'
            }`}
        >
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

function StatusBadge({
    label,
    value,
    tone,
}: {
    label: string;
    value: string;
    tone: 'gold' | 'teal' | 'navy';
}) {
    const tones = {
        gold: 'border-[#D4A23C]/35 bg-[#D4A23C]/12 text-[#F6D27B]',
        teal: 'border-cyan-500/20 bg-cyan-500/10 text-[#0A6474] dark:border-cyan-200/20 dark:bg-cyan-200/10 dark:text-cyan-100',
        navy: 'border-[#D1D9DA]/80 bg-[#F7F8FA]/80 text-slate-600 dark:border-white/12 dark:bg-white/[0.08] dark:text-white/70',
    };

    return (
        <div
            className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 ${tones[tone]}`}
        >
            <span className="text-xs font-semibold tracking-[0.12em] uppercase">
                {label}
            </span>
            <span className="text-sm font-bold">{value}</span>
        </div>
    );
}

function NextStep({
    number,
    title,
    text,
}: {
    number: string;
    title: string;
    text: string;
}) {
    return (
        <div className="rounded-2xl border border-[#D1D9DA]/80 bg-[#F7F8FA]/80 p-4 dark:border-white/12 dark:bg-white/[0.08]">
            <div className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#D4A23C] text-xs font-bold text-[#061F39]">
                    {number}
                </span>
                <div>
                    <p className="text-sm font-semibold text-[#061F39] dark:text-white">{title}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-white/50">
                        {text}
                    </p>
                </div>
            </div>
        </div>
    );
}
