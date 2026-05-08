import { Form, Head, Link, router, usePage } from '@inertiajs/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
    CreditCard,
    User,
    FileText,
    Calendar,
    MapPin,
    Briefcase,
    Mail,
    Phone,
    Clock,
    Shield,
    AlertCircle,
    Edit3,
    X,
    Lock,
    ChevronRight,
    CheckCircle2,
    Circle,
    Zap,
    Building2,
    Star,
    Activity,
    ArrowUpRight,
    Fingerprint,
    Bell,
    Settings,
} from 'lucide-react';
import { motion, AnimatePresence  } from 'motion/react';
import type {Variants} from 'motion/react';
import { useState, useEffect, useRef, useCallback } from 'react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import DeleteUser from '@/components/delete-user';
import { FlippableCreditCard } from '@/components/FlippableCreditCard';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { edit } from '@/routes/profile';
import { send } from '@/routes/verification';

gsap.registerPlugin(ScrollTrigger);

const CIM = {
    primary: '#082F54',
    secondary: '#0A6474',
    accent: '#D4A23C',
    dark: '#061F39',
    bg: '#F7F8FA',
    white: '#FFFFFF',
    border: '#D1D9DA',
};

type ProfileProps = {
    mustVerifyEmail: boolean;
    status?: string;
    profileData: {
        phone: string | null;
        date_of_birth: string | null;
        address: string | null;
        cin: string | null;
        profession: string | null;
        verification_status: string;
    };
    requestData: {
        request_number: string;
        status: string;
        branch_name: string | null;
        submitted_at: string | null;
    } | null;
    appointmentData: { scheduled_at: string | null; status: string } | null;
    bankAccountData: { account_number: string; status: string } | null;
    cardData: {
        card_holder_name: string;
        masked_card_number: string;
        expiry_date: string;
        status: string;
    } | null;
};

/* ─────────────────────────────────────────
   Animated Grid Background
───────────────────────────────────────── */
function GridBackground() {
    return (
        <div
            className="pointer-events-none absolute inset-0 overflow-hidden"
            aria-hidden="true"
        >
            <svg
                className="absolute inset-0 h-full w-full opacity-[0.03] dark:opacity-[0.06]"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <pattern
                        id="cim-grid"
                        width="40"
                        height="40"
                        patternUnits="userSpaceOnUse"
                    >
                        <path
                            d="M 40 0 L 0 0 0 40"
                            fill="none"
                            stroke="#082F54"
                            strokeWidth="0.5"
                        />
                    </pattern>
                    <pattern
                        id="cim-grid-dark"
                        width="40"
                        height="40"
                        patternUnits="userSpaceOnUse"
                    >
                        <path
                            d="M 40 0 L 0 0 0 40"
                            fill="none"
                            stroke="#0A6474"
                            strokeWidth="0.5"
                        />
                    </pattern>
                </defs>
                <rect
                    width="100%"
                    height="100%"
                    fill="url(#cim-grid)"
                    className="dark:hidden"
                />
                <rect
                    width="100%"
                    height="100%"
                    fill="url(#cim-grid-dark)"
                    className="hidden dark:block"
                />
            </svg>
            {/* Orbs */}
            <div className="absolute -top-32 -right-32 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-[#082F54]/8 to-[#0A6474]/12 blur-3xl dark:from-[#0A6474]/15 dark:to-[#082F54]/20" />
            <div className="absolute -bottom-32 -left-32 h-[400px] w-[400px] rounded-full bg-gradient-to-tr from-[#D4A23C]/5 to-transparent blur-3xl dark:from-[#D4A23C]/8" />
        </div>
    );
}

/* ─────────────────────────────────────────
   Onboarding Timeline
───────────────────────────────────────── */
type TimelineStep = {
    id: string;
    label: string;
    sublabel?: string;
    status: 'done' | 'active' | 'pending';
};

function OnboardingTimeline({ steps }: { steps: TimelineStep[] }) {
    const lineRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!lineRef.current) {
return;
}

        const doneCount = steps.filter((s) => s.status === 'done').length;
        const pct =
            steps.length > 1 ? (doneCount / (steps.length - 1)) * 100 : 0;
        gsap.fromTo(
            lineRef.current,
            { height: '0%' },
            {
                height: `${pct}%`,
                duration: 1.4,
                ease: 'power3.out',
                delay: 0.3,
            },
        );
    }, [steps]);

    return (
        <div className="relative pl-6">
            {/* Track */}
            <div className="absolute top-3 bottom-3 left-[11px] w-[2px] rounded-full bg-[#D1D9DA] dark:bg-[#0A6474]/20" />
            {/* Filled */}
            <div
                ref={lineRef}
                className="absolute top-3 left-[11px] w-[2px] rounded-full bg-gradient-to-b from-[#D4A23C] to-[#0A6474]"
                style={{ height: '0%' }}
            />

            <div className="space-y-6">
                {steps.map((step, i) => (
                    <motion.div
                        key={step.id}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                            delay: 0.15 * i,
                            type: 'spring',
                            stiffness: 280,
                            damping: 22,
                        }}
                        className="relative flex items-start gap-4"
                    >
                        {/* Node */}
                        <div
                            className={`relative z-10 -ml-[19px] flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all duration-500 ${
                                step.status === 'done'
                                    ? 'border-[#D4A23C] bg-[#D4A23C] shadow-[0_0_10px_#D4A23C55]'
                                    : step.status === 'active'
                                      ? 'border-[#0A6474] bg-[#0A6474]/20 dark:bg-[#0A6474]/30'
                                      : 'border-[#D1D9DA] bg-white dark:border-[#0A6474]/30 dark:bg-[#07213A]'
                            }`}
                        >
                            {step.status === 'done' ? (
                                <CheckCircle2 className="h-3 w-3 text-white" />
                            ) : step.status === 'active' ? (
                                <div className="h-2 w-2 animate-pulse rounded-full bg-[#0A6474]" />
                            ) : (
                                <Circle className="h-2.5 w-2.5 text-gray-300 dark:text-gray-600" />
                            )}
                        </div>
                        {/* Text */}
                        <div
                            className={`pb-1 ${step.status === 'pending' ? 'opacity-40' : ''}`}
                        >
                            <p
                                className={`text-sm font-semibold ${
                                    step.status === 'done'
                                        ? 'text-[#082F54] dark:text-white'
                                        : step.status === 'active'
                                          ? 'text-[#0A6474] dark:text-teal-400'
                                          : 'text-gray-400 dark:text-gray-500'
                                }`}
                            >
                                {step.label}
                            </p>
                            {step.sublabel && (
                                <p className="mt-0.5 text-xs font-medium text-gray-400 dark:text-gray-500">
                                    {step.sublabel}
                                </p>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────
   Stat Pill
───────────────────────────────────────── */
function StatPill({
    label,
    value,
    icon,
    accent = false,
}: {
    label: string;
    value: string;
    icon: React.ReactNode;
    accent?: boolean;
}) {
    return (
        <motion.div
            whileHover={{ y: -2, scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all duration-200 ${
                accent
                    ? 'border-[#D4A23C]/30 bg-[#D4A23C]/10 dark:border-[#D4A23C]/20 dark:bg-[#D4A23C]/10'
                    : 'border-[#D1D9DA]/60 bg-[#F7F8FA] dark:border-[#0A6474]/20 dark:bg-[#07213A]'
            }`}
        >
            <span
                className={`[&>svg]:h-4 [&>svg]:w-4 ${accent ? 'text-[#D4A23C]' : 'text-[#0A6474] dark:text-teal-400'}`}
            >
                {icon}
            </span>
            <div>
                <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase dark:text-gray-500">
                    {label}
                </p>
                <p
                    className={`text-sm font-bold ${accent ? 'text-[#D4A23C]' : 'text-[#082F54] dark:text-white'} font-mono`}
                >
                    {value}
                </p>
            </div>
        </motion.div>
    );
}

/* ─────────────────────────────────────────
   Glass Card
───────────────────────────────────────── */
function GlassCard({
    children,
    className = '',
    noPad = false,
}: {
    children: React.ReactNode;
    className?: string;
    noPad?: boolean;
}) {
    return (
        <div
            className={`overflow-hidden rounded-3xl border border-[#D1D9DA]/80 bg-white/90 shadow-sm backdrop-blur-xl dark:border-[#0A6474]/20 dark:bg-[#07213A]/80 dark:shadow-[0_1px_40px_#00000040] ${noPad ? '' : 'p-6 sm:p-8'} ${className}`}
        >
            {children}
        </div>
    );
}

/* ─────────────────────────────────────────
   Section Header
───────────────────────────────────────── */
function SectionHeader({
    icon,
    title,
    subtitle,
    action,
}: {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    action?: React.ReactNode;
}) {
    return (
        <div className="flex items-center justify-between gap-4 border-b border-[#D1D9DA]/50 px-6 pt-6 pb-5 sm:px-8 sm:pt-8 dark:border-[#0A6474]/15">
            <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-[#082F54]/8 bg-gradient-to-br from-[#082F54]/8 to-[#0A6474]/12 text-[#082F54] dark:border-[#0A6474]/20 dark:from-[#0A6474]/20 dark:to-[#082F54]/30 dark:text-[#D4A23C]">
                    {icon}
                </div>
                <div>
                    <h2 className="text-base leading-none font-bold tracking-tight text-[#082F54] dark:text-white">
                        {title}
                    </h2>
                    <p className="mt-1 text-xs font-medium text-[#0A6474] dark:text-teal-400/70">
                        {subtitle}
                    </p>
                </div>
            </div>
            {action}
        </div>
    );
}

/* ─────────────────────────────────────────
   Info Item
───────────────────────────────────────── */
function InfoItem({
    icon,
    label,
    value,
    isStatus,
    mono = false,
}: {
    icon?: React.ReactNode;
    label: string;
    value: string | undefined | null;
    isStatus?: boolean;
    mono?: boolean;
}) {
    return (
        <motion.div
            whileHover={{ scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="group flex flex-col gap-2 rounded-2xl border border-[#D1D9DA]/50 bg-[#F7F8FA] p-4 transition-colors hover:border-[#0A6474]/40 dark:border-[#0A6474]/15 dark:bg-[#041C30]/60 dark:hover:border-[#0A6474]/35"
        >
            <div className="flex items-center gap-2">
                {icon && (
                    <span className="text-[#0A6474] transition-transform group-hover:scale-110 dark:text-teal-500/70 [&>svg]:h-3.5 [&>svg]:w-3.5">
                        {icon}
                    </span>
                )}
                <span className="text-[10px] font-bold tracking-widest text-gray-400 uppercase dark:text-gray-500">
                    {label}
                </span>
            </div>
            {isStatus ? (
                <StatusBadge status={value || 'none'} />
            ) : (
                <p
                    className={`text-sm font-semibold text-[#082F54] dark:text-gray-200 ${mono ? 'font-mono tracking-wider' : ''}`}
                >
                    {value || (
                        <span className="font-normal text-gray-300 dark:text-gray-600">
                            —
                        </span>
                    )}
                </p>
            )}
        </motion.div>
    );
}

/* ─────────────────────────────────────────
   Status Badge
───────────────────────────────────────── */
function StatusBadge({ status }: { status: string }) {
    const s = status?.toLowerCase() || 'none';

    let cls =
        'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800/60 dark:text-gray-400 dark:border-gray-700/50';
    let dot = 'bg-gray-400';

    if (
        [
            'active',
            'verified',
            'approved',
            'account_created',
            'completed',
        ].includes(s)
    ) {
        cls =
            'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
        dot = 'bg-emerald-500 shadow-[0_0_4px_#10b981]';
    } else if (['pending', 'under_review'].includes(s)) {
        cls =
            'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';
        dot = 'bg-amber-400';
    } else if (
        ['submitted', 'appointment_scheduled', 'scheduled'].includes(s)
    ) {
        cls =
            'bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20';
        dot = 'bg-blue-500';
    } else if (['rejected', 'blocked'].includes(s)) {
        cls =
            'bg-red-50 text-red-700 border-red-200/80 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20';
        dot = 'bg-red-500';
    }

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase ${cls}`}
        >
            <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${dot}`} />
            {s.replace(/_/g, ' ')}
        </span>
    );
}

/* ─────────────────────────────────────────
   Avatar Ring Component
───────────────────────────────────────── */
function AvatarRing({
    name,
    size = 'lg',
}: {
    name: string;
    size?: 'sm' | 'lg';
}) {
    const dim = size === 'lg' ? 'h-24 w-24 text-3xl' : 'h-12 w-12 text-base';

    return (
        <div
            className={`relative flex-shrink-0 ${size === 'lg' ? 'p-1' : 'p-0.5'} rounded-full bg-gradient-to-br from-[#D4A23C] via-[#082F54] to-[#0A6474]`}
        >
            <div
                className={`${dim} flex items-center justify-center rounded-full border-2 border-white/10 bg-gradient-to-br from-[#082F54] to-[#0A6474] font-bold text-white`}
            >
                {name.charAt(0).toUpperCase()}
            </div>
            <span
                className={`absolute right-1 bottom-1 ${size === 'lg' ? 'h-4 w-4' : 'h-2.5 w-2.5'} rounded-full border-2 border-white bg-emerald-400 shadow-sm dark:border-[#07213A]`}
            />
        </div>
    );
}

/* ═══════════════════════════════════════════
   MAIN PROFILE PAGE
═══════════════════════════════════════════ */
export default function Profile({
    mustVerifyEmail,
    status,
    profileData,
    requestData,
    appointmentData,
    bankAccountData,
    cardData,
}: ProfileProps) {
    const { auth } = usePage().props;
    const user = (
        auth as {
            user: {
                name: string;
                email: string;
                email_verified_at: string | null;
            };
        }
    ).user;

    const [editMode, setEditMode] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [password, setPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [confirmProcessing, setConfirmProcessing] = useState(false);
    const [activeSection, setActiveSection] = useState('personal');

    const pageRef = useRef<HTMLDivElement>(null);
    const headerRef = useRef<HTMLDivElement>(null);
    const avatarRingRef = useRef<HTMLDivElement>(null);

    // GSAP - Avatar ring border animation
    useEffect(() => {
        if (!avatarRingRef.current) {
return;
}

        gsap.to(avatarRingRef.current, {
            rotation: 360,
            duration: 12,
            repeat: -1,
            ease: 'none',
        });
    }, []);

    // GSAP - Scroll-triggered card reveals
    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.utils
                .toArray<HTMLElement>('.cim-card-reveal')
                .forEach((el, i) => {
                    gsap.fromTo(
                        el,
                        { opacity: 0, y: 32 },
                        {
                            opacity: 1,
                            y: 0,
                            duration: 0.7,
                            delay: i * 0.06,
                            ease: 'power3.out',
                            scrollTrigger: {
                                trigger: el,
                                start: 'top 90%',
                                toggleActions: 'play none none none',
                            },
                        },
                    );
                });
        }, pageRef);

        return () => ctx.revert();
    }, []);

    // GSAP - Magnetic CTA button
    const magnetRef = useRef<HTMLButtonElement>(null);
    const handleMagnet = useCallback(
        (e: React.MouseEvent<HTMLButtonElement>) => {
            const btn = magnetRef.current;

            if (!btn) {
return;
}

            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            gsap.to(btn, {
                x: x * 0.25,
                y: y * 0.25,
                duration: 0.3,
                ease: 'power2.out',
            });
        },
        [],
    );
    const handleMagnetLeave = useCallback(() => {
        gsap.to(magnetRef.current, {
            x: 0,
            y: 0,
            duration: 0.6,
            ease: 'elastic.out(1,0.4)',
        });
    }, []);

    const handleConfirmPassword = (e: React.FormEvent) => {
        e.preventDefault();
        setConfirmProcessing(true);
        router.post(
            '/settings/profile/confirm-password',
            { password },
            {
                onSuccess: () => {
                    setEditMode(true);
                    setShowPasswordModal(false);
                    setPassword('');
                    setPasswordError('');
                },
                onError: (errs) =>
                    setPasswordError(
                        (errs as Record<string, string>).password ||
                            'Incorrect password.',
                    ),
                onFinish: () => setConfirmProcessing(false),
            },
        );
    };

    const formatDate = (iso: string | null) =>
        iso
            ? new Date(iso).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
              })
            : null;
    const formatDateTime = (iso: string | null) =>
        iso
            ? new Date(iso).toLocaleString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
              })
            : null;

    // Build timeline steps from existing data
    const timelineSteps: TimelineStep[] = [
        {
            id: 'signup',
            label: 'Account Created',
            sublabel: 'Registration complete',
            status: 'done',
        },
        {
            id: 'request',
            label: 'Account Request',
            sublabel: requestData?.submitted_at
                ? `Submitted ${formatDate(requestData.submitted_at)}`
                : 'Not submitted yet',
            status: requestData
                ? ['approved', 'account_created', 'completed'].includes(
                      requestData.status?.toLowerCase(),
                  )
                    ? 'done'
                    : 'active'
                : 'pending',
        },
        {
            id: 'appointment',
            label: 'Branch Appointment',
            sublabel: appointmentData?.scheduled_at
                ? `Scheduled ${formatDateTime(appointmentData.scheduled_at)}`
                : 'Not scheduled yet',
            status: appointmentData
                ? ['completed', 'done'].includes(
                      appointmentData.status?.toLowerCase(),
                  )
                    ? 'done'
                    : 'active'
                : 'pending',
        },
        {
            id: 'kyc',
            label: 'KYC Verification',
            sublabel:
                profileData?.verification_status?.replace(/_/g, ' ') ||
                'Pending',
            status: ['verified', 'approved'].includes(
                profileData?.verification_status?.toLowerCase() || '',
            )
                ? 'done'
                : profileData?.verification_status
                  ? 'active'
                  : 'pending',
        },
        {
            id: 'account',
            label: 'Bank Account Activated',
            sublabel: bankAccountData?.account_number
                ? `••• ${bankAccountData.account_number.slice(-4)}`
                : 'Pending activation',
            status: bankAccountData ? 'done' : 'pending',
        },
    ];

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.08 } },
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 24 },
        show: {
            opacity: 1,
            y: 0,
            transition: { type: 'spring', stiffness: 280, damping: 22 },
        },
    };

    const navItems = [
        {
            id: 'personal',
            label: 'Personal',
            icon: <User className="h-4 w-4" />,
        },
        {
            id: 'onboarding',
            label: 'Onboarding',
            icon: <Activity className="h-4 w-4" />,
        },
        {
            id: 'settings',
            label: 'Settings',
            icon: <Settings className="h-4 w-4" />,
        },
        {
            id: 'security',
            label: 'Security',
            icon: <Shield className="h-4 w-4" />,
        },
    ];

    return (
        <div
            ref={pageRef}
            className="relative min-h-full overflow-visible bg-[#F7F8FA] text-[#082F54] transition-colors duration-300 dark:bg-[#041426] dark:text-white"
        >
            {/* Google Font import via style tag */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=DM+Mono:wght@300;400;500&display=swap');
                .cim-sora { font-family: 'Sora', system-ui, sans-serif; }
                .cim-mono { font-family: 'DM Mono', 'Courier New', monospace; }

                .cim-glow-gold { box-shadow: 0 0 20px 2px rgba(212,162,60,0.15); }
                .cim-glow-teal { box-shadow: 0 0 20px 2px rgba(10,100,116,0.2); }

                @keyframes cim-shimmer {
                    0%   { background-position: -400px 0; }
                    100% { background-position: 400px 0; }
                }
                .cim-shimmer {
                    background: linear-gradient(90deg, transparent 25%, rgba(212,162,60,0.08) 50%, transparent 75%);
                    background-size: 400px 100%;
                    animation: cim-shimmer 3s infinite linear;
                }

                @keyframes cim-pulse-ring {
                    0%, 100% { opacity: 0.4; transform: scale(1); }
                    50%       { opacity: 0.9; transform: scale(1.05); }
                }
                .cim-pulse-ring { animation: cim-pulse-ring 2.5s ease-in-out infinite; }
            `}</style>

            <Head title="Profile — CIM Bank" />

            <GridBackground />

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="relative z-10 mx-auto max-w-7xl space-y-6 px-4 py-5 sm:px-6 lg:px-8"
            >
                {/* ── HERO HEADER ── */}
                <motion.div
                    ref={headerRef}
                    variants={itemVariants}
                    className="relative overflow-hidden rounded-[2rem] border border-[#0A6474]/30 bg-gradient-to-br from-[#082F54] via-[#0A2A46] to-[#061F39] shadow-2xl shadow-[#082F54]/30"
                >
                    {/* Layered background effects */}
                    <div className="cim-shimmer absolute inset-0" />
                    <div className="pointer-events-none absolute top-0 right-0 h-[400px] w-[400px] rounded-full bg-gradient-to-bl from-[#0A6474]/25 to-transparent blur-3xl" />
                    <div className="pointer-events-none absolute bottom-0 left-0 h-[300px] w-[300px] rounded-full bg-gradient-to-tr from-[#D4A23C]/10 to-transparent blur-3xl" />
                    <div
                        className="absolute inset-0 opacity-[0.04]"
                        style={{
                            backgroundImage:
                                "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
                        }}
                    />

                    <div className="relative z-10 p-6 sm:p-8 lg:p-10">
                        <div className="flex flex-col items-start gap-6 lg:flex-row lg:items-center">
                            {/* Avatar */}
                            <div className="relative flex-shrink-0">
                                <div
                                    ref={avatarRingRef}
                                    className="absolute inset-[-6px] rounded-full bg-gradient-to-br from-[#D4A23C] via-transparent to-[#0A6474] opacity-60"
                                />
                                <div className="cim-sora relative flex h-24 w-24 items-center justify-center rounded-full border-[3px] border-white/10 bg-gradient-to-br from-[#0A6474] to-[#082F54] text-4xl font-bold text-white shadow-xl">
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="cim-pulse-ring absolute right-1 bottom-1 h-4 w-4 rounded-full border-2 border-[#061F39] bg-emerald-400 shadow-sm" />
                            </div>

                            {/* Identity */}
                            <div className="min-w-0 flex-1">
                                <div className="mb-1 flex flex-wrap items-center gap-3">
                                    <h1 className="cim-sora text-2xl leading-none font-bold tracking-tight text-white sm:text-3xl">
                                        {user.name}
                                    </h1>
                                    <StatusBadge
                                        status={
                                            profileData?.verification_status ||
                                            'none'
                                        }
                                    />
                                </div>
                                <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
                                    <span className="flex items-center gap-2 text-sm font-medium text-white/60">
                                        <Mail className="h-3.5 w-3.5 text-[#D4A23C]" />{' '}
                                        {user.email}
                                    </span>
                                    {profileData?.phone && (
                                        <span className="flex items-center gap-2 text-sm font-medium text-white/60">
                                            <Phone className="h-3.5 w-3.5 text-[#D4A23C]" />{' '}
                                            {profileData.phone}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Stats pills */}
                            <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 lg:flex lg:w-auto">
                                <StatPill
                                    label="CIN"
                                    value={profileData?.cin || 'Pending'}
                                    icon={<Fingerprint />}
                                    accent
                                />
                                <StatPill
                                    label="Branch"
                                    value={requestData?.branch_name || '—'}
                                    icon={<Building2 />}
                                />
                                <StatPill
                                    label="Account"
                                    value={
                                        bankAccountData?.account_number
                                            ? `••${bankAccountData.account_number.slice(-4)}`
                                            : '—'
                                    }
                                    icon={<CreditCard />}
                                />
                            </div>
                        </div>

                        {/* Section nav tabs */}
                        <div className="scrollbar-none mt-8 flex items-center gap-1 overflow-x-auto border-t border-white/10 pt-5">
                            {navItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveSection(item.id)}
                                    className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                                        activeSection === item.id
                                            ? 'bg-[#D4A23C] text-[#061F39] shadow-lg shadow-[#D4A23C]/25'
                                            : 'text-white/50 hover:bg-white/5 hover:text-white/80'
                                    }`}
                                >
                                    {item.icon}
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* ── MAIN GRID ── */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                    {/* Left: Main content */}
                    <div className="space-y-6 lg:col-span-8">
                        {/* Personal Information */}
                        <motion.div
                            variants={itemVariants}
                            className="cim-card-reveal"
                        >
                            <GlassCard noPad>
                                <SectionHeader
                                    icon={<User className="h-5 w-5" />}
                                    title="Personal Information"
                                    subtitle="Your registered details with CIM Bank"
                                />
                                <div className="p-6 sm:p-8">
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <InfoItem
                                            icon={<Phone />}
                                            label="Phone Number"
                                            value={profileData?.phone}
                                        />
                                        <InfoItem
                                            icon={<Calendar />}
                                            label="Date of Birth"
                                            value={formatDate(
                                                profileData?.date_of_birth ??
                                                    null,
                                            )}
                                        />
                                        <InfoItem
                                            icon={<MapPin />}
                                            label="Address"
                                            value={profileData?.address}
                                        />
                                        <InfoItem
                                            icon={<Briefcase />}
                                            label="Profession"
                                            value={profileData?.profession}
                                        />
                                        <InfoItem
                                            icon={<FileText />}
                                            label="CIN Number"
                                            value={profileData?.cin}
                                            mono
                                        />
                                    </div>
                                </div>
                            </GlassCard>
                        </motion.div>

                        {/* Account Request & Appointment */}
                        <motion.div
                            variants={itemVariants}
                            className="cim-card-reveal"
                        >
                            <GlassCard noPad>
                                <SectionHeader
                                    icon={<FileText className="h-5 w-5" />}
                                    title="Account Request & Appointment"
                                    subtitle="Track your onboarding progress with CIM Bank"
                                />
                                <div className="p-6 sm:p-8">
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <InfoItem
                                            label="Request Number"
                                            value={requestData?.request_number}
                                            mono
                                        />
                                        <InfoItem
                                            label="Request Status"
                                            value={requestData?.status}
                                            isStatus
                                        />
                                        <InfoItem
                                            label="Branch"
                                            value={requestData?.branch_name}
                                        />
                                        <InfoItem
                                            label="Submitted At"
                                            value={formatDateTime(
                                                requestData?.submitted_at ??
                                                    null,
                                            )}
                                        />
                                        <InfoItem
                                            icon={<Clock />}
                                            label="Appointment"
                                            value={formatDateTime(
                                                appointmentData?.scheduled_at ??
                                                    null,
                                            )}
                                        />
                                        <InfoItem
                                            label="Appointment Status"
                                            value={appointmentData?.status}
                                            isStatus
                                        />
                                        <InfoItem
                                            icon={<CreditCard />}
                                            label="Account Number"
                                            value={
                                                bankAccountData?.account_number ||
                                                'Not yet created'
                                            }
                                            mono
                                        />
                                        <InfoItem
                                            label="Account Status"
                                            value={bankAccountData?.status}
                                            isStatus
                                        />
                                    </div>
                                </div>
                            </GlassCard>
                        </motion.div>

                        {/* Profile Settings */}
                        <motion.div
                            variants={itemVariants}
                            className="cim-card-reveal"
                        >
                            <GlassCard noPad>
                                <SectionHeader
                                    icon={<Edit3 className="h-5 w-5" />}
                                    title="Profile Settings"
                                    subtitle={
                                        editMode
                                            ? 'Update your name and email address'
                                            : 'Identity-locked — confirm password to edit'
                                    }
                                    action={
                                        editMode ? (
                                            <button
                                                onClick={() =>
                                                    setEditMode(false)
                                                }
                                                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/5 dark:hover:text-gray-200"
                                            >
                                                <X className="h-3.5 w-3.5" />{' '}
                                                Cancel
                                            </button>
                                        ) : null
                                    }
                                />
                                <div className="p-6 sm:p-8">
                                    <AnimatePresence mode="wait">
                                        {!editMode ? (
                                            <motion.div
                                                key="locked"
                                                initial={{
                                                    opacity: 0,
                                                    scale: 0.97,
                                                }}
                                                animate={{
                                                    opacity: 1,
                                                    scale: 1,
                                                }}
                                                exit={{
                                                    opacity: 0,
                                                    scale: 0.97,
                                                }}
                                                className="flex flex-col items-center justify-center py-10 text-center"
                                            >
                                                <div className="relative mb-6">
                                                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-[#D1D9DA] bg-[#F7F8FA] shadow-inner dark:border-[#0A6474]/20 dark:bg-[#041C30]/80">
                                                        <Lock className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                                                    </div>
                                                    <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#D4A23C]/90">
                                                        <span className="text-[8px] font-black text-white">
                                                            !
                                                        </span>
                                                    </div>
                                                </div>
                                                <h3 className="cim-sora mb-1 text-lg font-bold text-[#082F54] dark:text-white">
                                                    Secure Section
                                                </h3>
                                                <p className="mb-8 max-w-xs text-sm leading-relaxed text-gray-400 dark:text-gray-500">
                                                    Confirm your identity with
                                                    your password before editing
                                                    sensitive account details.
                                                </p>
                                                <button
                                                    ref={magnetRef}
                                                    onClick={() =>
                                                        setShowPasswordModal(
                                                            true,
                                                        )
                                                    }
                                                    onMouseMove={handleMagnet}
                                                    onMouseLeave={
                                                        handleMagnetLeave
                                                    }
                                                    className="cim-glow-gold inline-flex items-center gap-3 rounded-2xl bg-[#D4A23C] px-8 py-3.5 text-sm font-bold text-[#061F39] shadow-xl shadow-[#D4A23C]/20 transition-colors will-change-transform hover:bg-[#c29230]"
                                                >
                                                    <Lock className="h-4 w-4" />
                                                    Unlock to Edit Profile
                                                    <ArrowUpRight className="h-4 w-4" />
                                                </button>
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key="edit"
                                                initial={{ opacity: 0, y: 12 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0 }}
                                                transition={{
                                                    type: 'spring',
                                                    stiffness: 280,
                                                    damping: 22,
                                                }}
                                            >
                                                <Form
                                                    {...ProfileController.update.form()}
                                                    options={{
                                                        preserveScroll: true,
                                                    }}
                                                    className="space-y-5"
                                                >
                                                    {({
                                                        processing,
                                                        errors,
                                                    }) => (
                                                        <>
                                                            <div className="grid gap-2">
                                                                <Label
                                                                    htmlFor="name"
                                                                    className="text-xs font-bold tracking-widest text-gray-400 uppercase dark:text-gray-500"
                                                                >
                                                                    Full Name
                                                                </Label>
                                                                <Input
                                                                    id="name"
                                                                    name="name"
                                                                    required
                                                                    autoComplete="name"
                                                                    defaultValue={
                                                                        user.name
                                                                    }
                                                                    placeholder="Full name"
                                                                    className="cim-sora h-12 rounded-xl border border-[#D1D9DA] bg-[#F7F8FA] font-medium focus-visible:border-[#0A6474] focus-visible:ring-[#0A6474] dark:border-[#0A6474]/30 dark:bg-[#041C30]/60 dark:text-white"
                                                                />
                                                                <InputError
                                                                    className="mt-1"
                                                                    message={
                                                                        errors.name
                                                                    }
                                                                />
                                                            </div>
                                                            <div className="grid gap-2">
                                                                <Label
                                                                    htmlFor="email"
                                                                    className="text-xs font-bold tracking-widest text-gray-400 uppercase dark:text-gray-500"
                                                                >
                                                                    Email
                                                                    Address
                                                                </Label>
                                                                <Input
                                                                    id="email"
                                                                    name="email"
                                                                    type="email"
                                                                    required
                                                                    autoComplete="username"
                                                                    defaultValue={
                                                                        user.email
                                                                    }
                                                                    placeholder="Email address"
                                                                    className="cim-sora h-12 rounded-xl border border-[#D1D9DA] bg-[#F7F8FA] font-medium focus-visible:border-[#0A6474] focus-visible:ring-[#0A6474] dark:border-[#0A6474]/30 dark:bg-[#041C30]/60 dark:text-white"
                                                                />
                                                                <InputError
                                                                    className="mt-1"
                                                                    message={
                                                                        errors.email
                                                                    }
                                                                />
                                                            </div>

                                                            {mustVerifyEmail &&
                                                                user.email_verified_at ===
                                                                    null && (
                                                                    <motion.div
                                                                        initial={{
                                                                            opacity: 0,
                                                                            height: 0,
                                                                        }}
                                                                        animate={{
                                                                            opacity: 1,
                                                                            height: 'auto',
                                                                        }}
                                                                        className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/20 dark:bg-amber-500/10"
                                                                    >
                                                                        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-500" />
                                                                        <div>
                                                                            <p className="text-sm font-semibold text-amber-800 dark:text-amber-400">
                                                                                Email
                                                                                address
                                                                                is
                                                                                unverified.
                                                                            </p>
                                                                            <Link
                                                                                href={send()}
                                                                                as="button"
                                                                                className="mt-1 text-sm font-bold text-[#0A6474] hover:underline"
                                                                            >
                                                                                Resend
                                                                                verification
                                                                                email
                                                                                →
                                                                            </Link>
                                                                            {status ===
                                                                                'verification-link-sent' && (
                                                                                <p className="mt-1 text-sm font-semibold text-emerald-600">
                                                                                    Verification
                                                                                    link
                                                                                    sent!
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                    </motion.div>
                                                                )}
                                                            {errors.password && (
                                                                <InputError
                                                                    message={
                                                                        errors.password
                                                                    }
                                                                />
                                                            )}

                                                            <div className="flex flex-col items-center gap-3 border-t border-[#D1D9DA]/50 pt-4 sm:flex-row dark:border-[#0A6474]/15">
                                                                <Button
                                                                    disabled={
                                                                        processing
                                                                    }
                                                                    data-test="update-profile-button"
                                                                    className="cim-sora h-12 w-full rounded-xl px-8 text-sm font-bold text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl sm:w-auto"
                                                                    style={{
                                                                        background: `linear-gradient(135deg, ${CIM.primary}, ${CIM.secondary})`,
                                                                    }}
                                                                >
                                                                    {processing
                                                                        ? 'Saving…'
                                                                        : 'Save Changes'}
                                                                </Button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        setEditMode(
                                                                            false,
                                                                        )
                                                                    }
                                                                    className="w-full px-5 py-3 text-sm font-semibold text-gray-400 transition-colors hover:text-gray-700 sm:w-auto dark:hover:text-gray-200"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        </>
                                                    )}
                                                </Form>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </GlassCard>
                        </motion.div>

                        {/* Delete Account */}
                        <motion.div
                            variants={itemVariants}
                            className="cim-card-reveal"
                        >
                            <GlassCard>
                                <DeleteUser />
                            </GlassCard>
                        </motion.div>
                    </div>

                    {/* Right: Sidebar widgets */}
                    <div className="space-y-6 lg:col-span-4">
                        {/* Onboarding Timeline Card */}
                        <motion.div
                            variants={itemVariants}
                            className="cim-card-reveal"
                        >
                            <GlassCard noPad>
                                <SectionHeader
                                    icon={<Activity className="h-5 w-5" />}
                                    title="Onboarding Progress"
                                    subtitle="Your journey to full activation"
                                />
                                <div className="p-6 sm:p-8">
                                    <OnboardingTimeline steps={timelineSteps} />
                                    {/* Completion bar */}
                                    <div className="mt-8">
                                        <div className="mb-2 flex items-center justify-between">
                                            <span className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                                                Completion
                                            </span>
                                            <span className="cim-mono text-xs font-bold text-[#D4A23C]">
                                                {Math.round(
                                                    (timelineSteps.filter(
                                                        (s) =>
                                                            s.status === 'done',
                                                    ).length /
                                                        timelineSteps.length) *
                                                        100,
                                                )}
                                                %
                                            </span>
                                        </div>
                                        <div className="h-1.5 overflow-hidden rounded-full bg-[#D1D9DA]/50 dark:bg-[#0A6474]/15">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{
                                                    width: `${(timelineSteps.filter((s) => s.status === 'done').length / timelineSteps.length) * 100}%`,
                                                }}
                                                transition={{
                                                    duration: 1.2,
                                                    ease: [0.16, 1, 0.3, 1],
                                                    delay: 0.4,
                                                }}
                                                className="h-full rounded-full bg-gradient-to-r from-[#D4A23C] to-[#0A6474]"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </GlassCard>
                        </motion.div>

                        {/* Bank Card Widget */}
                        <motion.div
                            variants={itemVariants}
                            className="cim-card-reveal"
                        >
                            <GlassCard noPad>
                                <SectionHeader
                                    icon={<CreditCard className="h-5 w-5" />}
                                    title="Your Bank Card"
                                    subtitle="Hover to see card details"
                                />
                                <div className="p-6 sm:p-8">
                                    {cardData ? (
                                        <div className="flex flex-col items-center gap-5">
                                            <FlippableCreditCard
                                                cardholderName={cardData.card_holder_name.toUpperCase()}
                                                cardNumber={
                                                    cardData.masked_card_number
                                                }
                                                expiryDate={
                                                    cardData.expiry_date
                                                }
                                                cvv="***"
                                            />
                                            <div className="flex w-full items-center justify-between rounded-2xl border border-[#D1D9DA]/50 bg-[#F7F8FA] p-3.5 dark:border-[#0A6474]/15 dark:bg-[#041C30]/60">
                                                <span className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                                                    Card Status
                                                </span>
                                                <StatusBadge
                                                    status={cardData.status}
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <motion.div
                                            whileHover={{ scale: 1.01 }}
                                            className="flex h-52 cursor-default flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#D1D9DA] bg-[#F7F8FA]/50 p-6 text-center transition-colors dark:border-[#0A6474]/25 dark:bg-[#041C30]/30"
                                        >
                                            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#D1D9DA] bg-white shadow-sm dark:border-[#0A6474]/20 dark:bg-[#07213A]">
                                                <Lock className="h-6 w-6 text-gray-300 dark:text-gray-600" />
                                            </div>
                                            <p className="text-sm font-bold text-[#082F54] dark:text-white">
                                                Card Not Issued
                                            </p>
                                            <p className="mt-1.5 max-w-[180px] text-xs leading-relaxed text-gray-400 dark:text-gray-500">
                                                Available after full account
                                                activation
                                            </p>
                                        </motion.div>
                                    )}
                                </div>
                            </GlassCard>
                        </motion.div>

                        {/* Security Banner */}
                        <motion.div
                            variants={itemVariants}
                            className="cim-card-reveal"
                        >
                            <div className="relative overflow-hidden rounded-3xl border border-[#0A6474]/25 bg-gradient-to-br from-[#082F54] via-[#071E3C] to-[#061F39] p-7 shadow-2xl shadow-[#082F54]/25">
                                {/* Decorative circles */}
                                <div className="pointer-events-none absolute -top-8 -right-8 h-36 w-36 rounded-full bg-[#0A6474]/20 blur-2xl" />
                                <div className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-[#D4A23C]/15 blur-2xl" />
                                <div className="absolute top-0 right-0 opacity-[0.04]">
                                    <Shield className="h-40 w-40 text-white" />
                                </div>

                                <div className="relative z-10">
                                    <div className="mb-5 flex items-center gap-3">
                                        <div className="cim-glow-gold flex h-10 w-10 items-center justify-center rounded-xl border border-[#D4A23C]/30 bg-[#D4A23C]/20">
                                            <Shield className="h-5 w-5 text-[#D4A23C]" />
                                        </div>
                                        <div>
                                            <h3 className="cim-sora text-sm leading-none font-bold text-white">
                                                CIM Secure Banking
                                            </h3>
                                            <p className="mt-0.5 text-[10px] tracking-widest text-white/40 uppercase">
                                                Military-grade encryption
                                            </p>
                                        </div>
                                    </div>
                                    <p className="mb-6 text-sm leading-relaxed text-white/60">
                                        Your data is protected by 256-bit AES
                                        encryption and multi-factor
                                        authentication protocols.
                                    </p>
                                    <Link
                                        href={edit()}
                                        className="group cim-sora inline-flex items-center gap-2 text-sm font-bold text-[#D4A23C] transition-colors hover:text-white"
                                    >
                                        Review Security Settings
                                        <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                    </Link>
                                </div>
                            </div>
                        </motion.div>

                        {/* Quick KYC Status */}
                        <motion.div
                            variants={itemVariants}
                            className="cim-card-reveal"
                        >
                            <GlassCard noPad>
                                <div className="p-5 sm:p-6">
                                    <div className="mb-4 flex items-center justify-between">
                                        <div className="flex items-center gap-2.5">
                                            <Zap className="h-4 w-4 text-[#D4A23C]" />
                                            <span className="text-xs font-bold tracking-widest text-gray-400 uppercase">
                                                KYC Verification
                                            </span>
                                        </div>
                                        <StatusBadge
                                            status={
                                                profileData?.verification_status ||
                                                'none'
                                            }
                                        />
                                    </div>
                                    <div className="space-y-2.5">
                                        {[
                                            {
                                                label: 'Identity Documents',
                                                done: !!profileData?.cin,
                                            },
                                            {
                                                label: 'Phone Verified',
                                                done: !!profileData?.phone,
                                            },
                                            {
                                                label: 'Address Confirmed',
                                                done: !!profileData?.address,
                                            },
                                            {
                                                label: 'Branch Appointment',
                                                done: !!appointmentData,
                                            },
                                        ].map((item, i) => (
                                            <motion.div
                                                key={item.label}
                                                initial={{ opacity: 0, x: -8 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{
                                                    delay: 0.5 + i * 0.07,
                                                }}
                                                className="flex items-center justify-between"
                                            >
                                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                                    {item.label}
                                                </span>
                                                <span
                                                    className={`text-xs font-bold ${item.done ? 'text-emerald-500' : 'text-gray-300 dark:text-gray-600'}`}
                                                >
                                                    {item.done
                                                        ? '✓ Done'
                                                        : '○ Pending'}
                                                </span>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </GlassCard>
                        </motion.div>
                    </div>
                </div>
            </motion.div>

            {/* ── PASSWORD CONFIRMATION MODAL ── */}
            <AnimatePresence>
                {showPasswordModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-[#082F54]/50 p-4 backdrop-blur-md dark:bg-black/70"
                        onClick={() => setShowPasswordModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.92, opacity: 0, y: 24 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.92, opacity: 0, y: 24 }}
                            transition={{
                                type: 'spring',
                                duration: 0.5,
                                bounce: 0.25,
                            }}
                            className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-[#D1D9DA] bg-white shadow-2xl dark:border-[#0A6474]/30 dark:bg-[#07213A]"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal gradient top bar */}
                            <div className="h-1 w-full bg-gradient-to-r from-[#D4A23C] via-[#082F54] to-[#0A6474]" />

                            <div className="p-8">
                                <button
                                    onClick={() => setShowPasswordModal(false)}
                                    className="absolute top-5 right-5 rounded-full bg-gray-100 p-2 text-gray-400 transition-colors hover:text-gray-600 dark:bg-[#041426]/80 dark:hover:text-white"
                                >
                                    <X className="h-4 w-4" />
                                </button>

                                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#082F54]/10 bg-[#082F54]/5 dark:border-[#0A6474]/25 dark:bg-[#0A6474]/15">
                                    <Lock className="h-7 w-7 text-[#082F54] dark:text-[#D4A23C]" />
                                </div>

                                <h3 className="cim-sora mb-1 text-center text-2xl font-bold text-[#082F54] dark:text-white">
                                    Confirm Identity
                                </h3>
                                <p className="mb-7 text-center text-sm font-medium text-gray-400 dark:text-gray-500">
                                    Enter your current password to unlock
                                    profile editing.
                                </p>

                                <form
                                    onSubmit={handleConfirmPassword}
                                    className="space-y-4"
                                >
                                    <div>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => {
                                                setPassword(e.target.value);
                                                setPasswordError('');
                                            }}
                                            placeholder="Current password"
                                            autoFocus
                                            className={`cim-sora w-full rounded-xl border bg-[#F7F8FA] px-5 py-4 text-sm font-medium transition-all outline-none focus:border-[#0A6474] focus:ring-2 focus:ring-[#0A6474]/40 dark:bg-[#041426]/80 dark:text-white dark:placeholder-gray-600 ${
                                                passwordError
                                                    ? 'border-red-400 dark:border-red-500/60'
                                                    : 'border-[#D1D9DA] dark:border-[#0A6474]/25'
                                            }`}
                                        />
                                        <AnimatePresence>
                                            {passwordError && (
                                                <motion.p
                                                    initial={{
                                                        opacity: 0,
                                                        y: -4,
                                                    }}
                                                    animate={{
                                                        opacity: 1,
                                                        y: 0,
                                                    }}
                                                    exit={{ opacity: 0 }}
                                                    className="mt-2 flex items-center gap-1.5 text-sm font-medium text-red-500"
                                                >
                                                    <AlertCircle className="h-3.5 w-3.5" />{' '}
                                                    {passwordError}
                                                </motion.p>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    <div className="flex gap-3 pt-1">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowPasswordModal(false)
                                            }
                                            className="flex-1 rounded-xl border border-[#D1D9DA] bg-transparent px-4 py-3.5 text-sm font-bold text-gray-500 transition-colors hover:bg-gray-50 dark:border-[#0A6474]/25 dark:text-gray-400 dark:hover:bg-white/5"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={
                                                confirmProcessing || !password
                                            }
                                            className="cim-sora flex-1 rounded-xl px-4 py-3.5 text-sm font-bold text-white transition-all hover:scale-[1.01] hover:shadow-lg hover:shadow-[#082F54]/30 disabled:scale-100 disabled:cursor-not-allowed disabled:opacity-50"
                                            style={{
                                                background: `linear-gradient(135deg, ${CIM.primary}, ${CIM.secondary})`,
                                            }}
                                        >
                                            {confirmProcessing
                                                ? 'Verifying…'
                                                : 'Unlock Profile'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

Profile.layout = { breadcrumbs: [{ title: 'Profile settings', href: edit() }] };
