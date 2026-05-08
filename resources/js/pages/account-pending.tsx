import { Head, Link } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowRight,
    BadgeCheck,
    CalendarCheck,
    CheckCircle2,
    Clock3,
    FileSearch,
    Landmark,
    LogOut,
    ShieldCheck,
    Sparkles,
    UserRound,
    XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useRef } from 'react';
import type { ComponentType, ReactNode } from 'react';
import { motion } from 'motion/react';
import gsap from 'gsap';
import background from './customer/images/CIM.png';

type Props = {
    verificationStatus: string;
    requestStatus: string;
};

const statusCopy = {
    pending: {
        title: 'Your account is pending verification',
        subtitle:
            'CIM staff are reviewing your identity, documents, and account opening request before activating your banking dashboard.',
        badge: 'Review in progress',
    },
    rejected: {
        title: 'Your account verification was not approved',
        subtitle:
            'Your verification could not be completed. Please contact your branch for more details or to resubmit the required information.',
        badge: 'Action required',
    },
};

const pendingSteps = [
    {
        icon: FileSearch,
        title: 'Documents review',
        text: 'CIM verifies your submitted identity information.',
    },
    {
        icon: CalendarCheck,
        title: 'Branch verification',
        text: 'Your appointment confirms your identity in person.',
    },
    {
        icon: ShieldCheck,
        title: 'Staff approval',
        text: 'A bank employee validates the request securely.',
    },
    {
        icon: BadgeCheck,
        title: 'Account activation',
        text: 'After approval, your account and card become available.',
    },
];

export default function AccountPending({
    verificationStatus,
    requestStatus,
}: Props) {
    const pageRef = useRef<HTMLDivElement | null>(null);

    const isRejected =
        verificationStatus === 'rejected' || requestStatus === 'rejected';

    const copy = isRejected ? statusCopy.rejected : statusCopy.pending;

    const statusItems = useMemo(
        () => [
            {
                label: 'Verification',
                value: verificationStatus || 'pending',
            },
            {
                label: 'Request',
                value: requestStatus || 'pending',
            },
        ],
        [requestStatus, verificationStatus],
    );

    useEffect(() => {
        if (!pageRef.current) {
            return undefined;
        }

        const ctx = gsap.context(() => {
            gsap.fromTo(
                '.pending-reveal',
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
                '.pending-icon',
                { scale: 0.74, rotate: isRejected ? 12 : -12, autoAlpha: 0 },
                {
                    scale: 1,
                    rotate: 0,
                    autoAlpha: 1,
                    duration: 0.72,
                    delay: 0.12,
                    ease: 'back.out(1.7)',
                },
            );

            gsap.to('.pending-orb', {
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
    }, [isRejected]);

    return (
        <>
            <Head
                title={
                    isRejected
                        ? 'Account Rejected — CIM'
                        : 'Account Pending — CIM'
                }
            />

            <main
                ref={pageRef}
                className="relative min-h-svh overflow-x-hidden bg-[#061F39] text-white"
            >
                <div className="fixed inset-0">
                    <img
                        src={background}
                        alt="CIM Bank"
                        className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-[#061F39]/64" />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#061F39]/94 via-[#061F39]/70 to-[#061F39]/36" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#061F39]/84 via-transparent to-[#061F39]/24" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(212,162,60,0.25),transparent_28%),radial-gradient(circle_at_88%_18%,rgba(10,100,116,0.22),transparent_34%)]" />
                </div>

                <div className="pending-orb pointer-events-none fixed -top-24 right-10 h-80 w-80 rounded-full bg-[#D4A23C]/18 blur-3xl" />
                <div className="pending-orb pointer-events-none fixed bottom-10 -left-28 h-96 w-96 rounded-full bg-[#0A6474]/24 blur-3xl" />

                <div className="relative z-10 mx-auto flex min-h-svh max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
                    <header className="pending-reveal mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <img
                                src="/logo_twil.png"
                                alt="CIM Bank"
                                className="h-12 w-auto max-w-[230px] object-contain drop-shadow-2xl"
                            />

                            <div
                                className={`mt-5 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold tracking-[0.18em] uppercase backdrop-blur-xl ${
                                    isRejected
                                        ? 'border-rose-300/35 bg-rose-400/12 text-rose-100'
                                        : 'border-[#D4A23C]/35 bg-[#D4A23C]/12 text-[#F6D27B]'
                                }`}
                            >
                                {isRejected ? (
                                    <AlertTriangle className="h-4 w-4" />
                                ) : (
                                    <Sparkles className="h-4 w-4" />
                                )}
                                {copy.badge}
                            </div>

                            <h1 className="mt-4 max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
                                {copy.title}
                            </h1>

                            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/68">
                                {copy.subtitle}
                            </p>
                        </div>

                        <StatusOverview
                            isRejected={isRejected}
                            statusItems={statusItems}
                        />
                    </header>

                    <section className="grid flex-1 items-center gap-5 lg:grid-cols-[minmax(0,1fr)_390px]">
                        <motion.div
                            className="pending-reveal overflow-hidden rounded-[1.75rem] border border-white/14 bg-white/[0.13] shadow-[0_30px_100px_rgba(0,0,0,0.32)] backdrop-blur-2xl"
                            whileHover={{ y: -2 }}
                            transition={{ duration: 0.22 }}
                        >
                            <div className="relative overflow-hidden border-b border-white/10 px-5 py-8 text-center sm:px-8">
                                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(212,162,60,0.18),transparent_35%)]" />

                                <div
                                    className={`pending-icon relative mx-auto flex h-20 w-20 items-center justify-center rounded-full shadow-[0_18px_55px_rgba(212,162,60,0.24)] ${
                                        isRejected
                                            ? 'bg-rose-500 text-white shadow-rose-500/22'
                                            : 'bg-[#D4A23C] text-[#061F39]'
                                    }`}
                                >
                                    {isRejected ? (
                                        <XCircle className="h-10 w-10" />
                                    ) : (
                                        <Clock3 className="h-10 w-10" />
                                    )}
                                </div>

                                <h2 className="relative mt-5 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                                    {isRejected
                                        ? 'Verification needs attention'
                                        : 'Verification is in progress'}
                                </h2>

                                <p className="relative mx-auto mt-3 max-w-xl text-sm leading-7 text-white/62">
                                    {isRejected
                                        ? 'Your banking dashboard is temporarily locked until the issue is resolved with CIM staff.'
                                        : 'Your banking dashboard will unlock automatically once a bank employee verifies your request.'}
                                </p>

                                <div className="relative mx-auto mt-5 h-px max-w-xs bg-gradient-to-r from-transparent via-[#D4A23C] to-transparent" />
                            </div>

                            <div className="grid gap-5 p-5 lg:grid-cols-[0.9fr_1.1fr]">
                                <div className="rounded-[1.4rem] border border-white/12 bg-white/[0.08] p-5">
                                    <div className="flex items-center gap-3">
                                        <span
                                            className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                                                isRejected
                                                    ? 'bg-rose-400/12 text-rose-100'
                                                    : 'bg-[#D4A23C]/14 text-[#F6D27B]'
                                            }`}
                                        >
                                            {isRejected ? (
                                                <AlertTriangle className="h-6 w-6" />
                                            ) : (
                                                <ShieldCheck className="h-6 w-6" />
                                            )}
                                        </span>

                                        <div>
                                            <p className="text-xs font-bold tracking-[0.14em] text-white/42 uppercase">
                                                Current access
                                            </p>
                                            <p className="mt-1 text-xl font-semibold text-white">
                                                {isRejected
                                                    ? 'Dashboard locked'
                                                    : 'Awaiting approval'}
                                            </p>
                                        </div>
                                    </div>

                                    <p className="mt-4 text-sm leading-7 text-white/56">
                                        {isRejected
                                            ? 'Contact CIM or visit your selected branch to understand why the verification failed and what must be corrected.'
                                            : 'You can check this page later. After approval, your account, card, and banking services will become available.'}
                                    </p>

                                    <div className="mt-5 grid gap-2">
                                        {statusItems.map((item) => (
                                            <StatusPill
                                                key={item.label}
                                                label={item.label}
                                                value={item.value}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div className="grid gap-3">
                                    {pendingSteps.map(
                                        ({ icon: Icon, title, text }, index) => (
                                            <ProcessStep
                                                key={title}
                                                icon={Icon}
                                                title={title}
                                                text={text}
                                                index={index + 1}
                                                isRejected={isRejected}
                                            />
                                        ),
                                    )}
                                </div>
                            </div>
                        </motion.div>

                        <aside className="space-y-5">
                            <motion.div
                                className="pending-reveal overflow-hidden rounded-[1.75rem] border border-white/14 bg-white/[0.13] shadow-[0_30px_100px_rgba(0,0,0,0.28)] backdrop-blur-2xl"
                                whileHover={{ y: -2 }}
                                transition={{ duration: 0.22 }}
                            >
                                <div className="border-b border-white/10 px-5 py-4">
                                    <div className="flex items-center gap-3">
                                        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0A6474]/20 text-cyan-100">
                                            <UserRound className="h-5 w-5" />
                                        </span>
                                        <div>
                                            <h3 className="font-semibold text-white">
                                                What you can do now
                                            </h3>
                                            <p className="text-xs text-white/48">
                                                Recommended actions
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid gap-3 p-5">
                                    {isRejected ? (
                                        <>
                                            <AdviceCard
                                                title="Contact your branch"
                                                text="Ask CIM staff what information needs correction."
                                            />
                                            <AdviceCard
                                                title="Prepare documents"
                                                text="Keep your original CIN and supporting documents ready."
                                            />
                                            <AdviceCard
                                                title="Resubmit if needed"
                                                text="Follow staff instructions to complete verification."
                                            />
                                        </>
                                    ) : (
                                        <>
                                            <AdviceCard
                                                title="Wait for staff review"
                                                text="CIM will verify your submitted request and documents."
                                            />
                                            <AdviceCard
                                                title="Attend appointment"
                                                text="If an appointment is scheduled, arrive on time with your CIN."
                                            />
                                            <AdviceCard
                                                title="Return after approval"
                                                text="Your dashboard unlocks when your account becomes active."
                                            />
                                        </>
                                    )}
                                </div>
                            </motion.div>

                            <motion.div
                                className="pending-reveal rounded-[1.75rem] border border-white/14 bg-white/[0.13] p-5 shadow-[0_30px_100px_rgba(0,0,0,0.24)] backdrop-blur-2xl"
                                whileHover={{ y: -2 }}
                                transition={{ duration: 0.22 }}
                            >
                                <div className="flex gap-3">
                                    <Landmark className="mt-0.5 h-5 w-5 shrink-0 text-[#F6D27B]" />
                                    <div>
                                        <h3 className="font-semibold text-white">
                                            CIM secure onboarding
                                        </h3>
                                        <p className="mt-2 text-sm leading-6 text-white/58">
                                            Account access is protected until a
                                            bank employee confirms your identity
                                            and activates the request.
                                        </p>
                                    </div>
                                </div>
                            </motion.div>

                            <div className="pending-reveal grid gap-3">
                                <Link
                                    href="/settings/profile"
                                    className="inline-flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[#D4A23C] px-5 text-sm font-bold text-[#061F39] shadow-lg shadow-[#D4A23C]/20 transition hover:bg-[#e2b34a]"
                                >
                                    View profile
                                    <ArrowRight className="h-4 w-4" />
                                </Link>

                                <Link
                                    href="/logout"
                                    method="post"
                                    as="button"
                                    className="inline-flex h-13 w-full items-center justify-center gap-2 rounded-2xl border border-white/12 bg-white/[0.08] px-5 text-sm font-bold text-white/76 transition hover:border-rose-300/35 hover:bg-rose-400/12 hover:text-rose-100"
                                >
                                    Log out
                                </Link>
                            </div>
                        </aside>
                    </section>
                </div>
            </main>
        </>
    );
}

function StatusOverview({
    isRejected,
    statusItems,
}: {
    isRejected: boolean;
    statusItems: { label: string; value: string }[];
}) {
    return (
        <div className="pending-reveal w-full rounded-[1.5rem] border border-white/12 bg-white/[0.1] p-4 backdrop-blur-2xl lg:max-w-[420px]">
            <div className="mb-3 flex items-center gap-2">
                {isRejected ? (
                    <AlertTriangle className="h-4 w-4 text-rose-100" />
                ) : (
                    <Landmark className="h-4 w-4 text-[#F6D27B]" />
                )}
                <p
                    className={`text-xs font-bold tracking-[0.16em] uppercase ${
                        isRejected ? 'text-rose-100' : 'text-[#F6D27B]'
                    }`}
                >
                    Account state
                </p>
            </div>

            <div className="grid gap-2">
                {statusItems.map((item) => (
                    <StatusPill
                        key={item.label}
                        label={item.label}
                        value={item.value}
                    />
                ))}
            </div>
        </div>
    );
}

function ProcessStep({
    icon: Icon,
    title,
    text,
    index,
    isRejected,
}: {
    icon: ComponentType<{ className?: string }>;
    title: string;
    text: string;
    index: number;
    isRejected: boolean;
}) {
    return (
        <div className="rounded-2xl border border-white/12 bg-white/[0.08] p-4">
            <div className="flex gap-3">
                <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        isRejected
                            ? 'bg-white/10 text-white/54'
                            : index === 4
                              ? 'bg-[#D4A23C] text-[#061F39]'
                              : 'bg-cyan-200/10 text-cyan-100'
                    }`}
                >
                    <Icon className="h-4 w-4" />
                </span>
                <div>
                    <p className="text-sm font-semibold text-white">{title}</p>
                    <p className="mt-1 text-xs leading-5 text-white/50">
                        {text}
                    </p>
                </div>
            </div>
        </div>
    );
}

function AdviceCard({ title, text }: { title: string; text: string }) {
    return (
        <div className="rounded-2xl border border-white/12 bg-white/[0.08] p-4">
            <div className="flex gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#F6D27B]" />
                <div>
                    <p className="text-sm font-semibold text-white">{title}</p>
                    <p className="mt-1 text-xs leading-5 text-white/50">
                        {text}
                    </p>
                </div>
            </div>
        </div>
    );
}

function StatusPill({ label, value }: { label: string; value: string }) {
    const normalized = value || 'none';
    const rejected = normalized === 'rejected';
    const approved = ['verified', 'approved', 'account_created'].includes(
        normalized,
    );
    const scheduled = normalized === 'appointment_scheduled';

    const className = rejected
        ? 'border-rose-300/25 bg-rose-400/10 text-rose-100'
        : approved
          ? 'border-emerald-300/25 bg-emerald-400/10 text-emerald-100'
          : scheduled
            ? 'border-cyan-200/20 bg-cyan-200/10 text-cyan-100'
            : 'border-[#D4A23C]/35 bg-[#D4A23C]/12 text-[#F6D27B]';

    return (
        <div
            className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 ${className}`}
        >
            <span className="text-xs font-semibold tracking-[0.12em] uppercase">
                {label}
            </span>
            <span className="text-sm font-bold capitalize">
                {normalized.replace(/_/g, ' ')}
            </span>
        </div>
    );
}

/*
    Keep this page standalone if your Inertia resolver supports page.layout.
    This prevents the dashboard/sidebar layout from wrapping pending users.
*/
(AccountPending as any).layout = null;
