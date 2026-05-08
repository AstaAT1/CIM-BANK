import { Form, Head } from '@inertiajs/react';
import {
    ArrowRight,
    BadgeCheck,
    Landmark,
    LockKeyhole,
    Mail,
    ShieldCheck,
    Sparkles,
} from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { ComponentType } from 'react';
import { motion } from 'motion/react';
import gsap from 'gsap';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';
import background from '../customer/images/CIM.png';

type Props = {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
};

const highlights = [
    'ATM Locator',
    'Machrou3i',
    'Exchange Rates',
    'Bills & AutoPay',
    'Transfers',
    'Chatbot',
];

export default function Login({
    status,
    canResetPassword,
    canRegister,
}: Props) {
    const pageRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!pageRef.current) {
            return undefined;
        }

        const ctx = gsap.context(() => {
            gsap.fromTo(
                '.login-reveal',
                { autoAlpha: 0, y: 22 },
                {
                    autoAlpha: 1,
                    y: 0,
                    duration: 0.68,
                    stagger: 0.065,
                    ease: 'power3.out',
                },
            );

            gsap.to('.login-orb', {
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
            <Head title="Log in" />

            <main
                ref={pageRef}
                className="relative h-svh overflow-hidden bg-[#061F39] text-white"
            >
                {/* Real full-screen background image */}
                <div className="absolute inset-0">
                    <img
                        src={background}
                        alt="CIM Bank"
                        className="h-full w-full object-cover"
                    />

                    <div className="absolute inset-0 bg-[#061F39]/58" />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#061F39]/92 via-[#061F39]/62 to-[#061F39]/28" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#061F39]/76 via-transparent to-[#061F39]/22" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(212,162,60,0.26),transparent_28%),radial-gradient(circle_at_88%_18%,rgba(10,100,116,0.22),transparent_34%)]" />
                </div>

                <div className="login-orb pointer-events-none absolute -top-24 right-10 h-80 w-80 rounded-full bg-[#D4A23C]/18 blur-3xl" />
                <div className="login-orb pointer-events-none absolute bottom-10 -left-28 h-96 w-96 rounded-full bg-[#0A6474]/24 blur-3xl" />

                <div className="relative z-10 grid h-full w-full items-center px-4 py-5 sm:px-6 lg:grid-cols-[1fr_480px] lg:px-10 xl:px-16">
                    <section className="login-reveal hidden max-w-3xl lg:block">
                        <img
                            src="/logo_twil.png"
                            alt="CIM Bank"
                            className="h-16 w-auto max-w-[270px] object-contain drop-shadow-2xl"
                        />

                        <div className="mt-10 inline-flex items-center gap-2 rounded-full border border-[#D4A23C]/35 bg-[#D4A23C]/12 px-4 py-2 text-xs font-bold tracking-[0.18em] text-[#F6D27B] uppercase backdrop-blur-xl">
                            <Sparkles className="h-4 w-4" />
                            Credit Intelligence Mizan
                        </div>

                        <h1 className="mt-6 max-w-3xl text-5xl font-semibold leading-[0.95] tracking-tight text-white xl:text-6xl">
                            Secure access to your CIM banking space.
                        </h1>

                        <p className="mt-5 max-w-xl text-base leading-8 text-white/72">
                            Manage your account, transfers, bills, exchange
                            rates, ATM locator, Machrou3i and CIM assistant from
                            one protected dashboard.
                        </p>

                        <div className="mt-8 flex flex-wrap gap-2">
                            {highlights.map((item) => (
                                <span
                                    key={item}
                                    className="rounded-full border border-white/12 bg-white/10 px-4 py-2 text-xs font-semibold text-white/82 backdrop-blur-xl"
                                >
                                    {item}
                                </span>
                            ))}
                        </div>

                        <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
                            <TrustCard
                                icon={ShieldCheck}
                                title="Secure"
                                text="Protected session"
                            />
                            <TrustCard
                                icon={BadgeCheck}
                                title="Verified"
                                text="Bank access"
                            />
                            <TrustCard
                                icon={Landmark}
                                title="CIM"
                                text="Digital banking"
                            />
                        </div>
                    </section>

                    <section className="login-reveal mx-auto w-full max-w-[460px]">
                        <div className="mb-4 flex justify-center lg:hidden">
                            <img
                                src="/logo_twil.png"
                                alt="CIM Bank"
                                className="h-12 w-auto max-w-[230px] object-contain drop-shadow-2xl"
                            />
                        </div>

                        <motion.div
                            className="overflow-hidden rounded-[1.75rem] border border-white/14 bg-white/[0.13] shadow-[0_30px_100px_rgba(0,0,0,0.32)] backdrop-blur-2xl"
                            whileHover={{ y: -2 }}
                            transition={{ duration: 0.22 }}
                        >
                            <div className="border-b border-white/10 px-6 py-5 sm:px-8">
                                <div className="hidden lg:block">
                                    <img
                                        src="/logo_twil.png"
                                        alt="CIM Bank"
                                        className="h-11 w-auto max-w-[210px] object-contain"
                                    />
                                </div>

                                <div className="mt-5">
                                    <div className="inline-flex items-center gap-2 rounded-full border border-[#D4A23C]/35 bg-[#D4A23C]/12 px-3 py-1 text-xs font-semibold text-[#F6D27B]">
                                        <LockKeyhole className="h-3.5 w-3.5" />
                                        Secure login
                                    </div>

                                    <h2 className="mt-4 text-2xl font-semibold tracking-tight text-white">
                                        Log in to your account
                                    </h2>

                                    <p className="mt-2 text-sm leading-6 text-white/62">
                                        Enter your credentials to continue to
                                        your CIM dashboard.
                                    </p>
                                </div>

                                {status && (
                                    <div className="mt-4 rounded-2xl border border-emerald-300/25 bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-100">
                                        {status}
                                    </div>
                                )}
                            </div>

                            <div className="px-6 py-5 sm:px-8">
                                <Form
                                    {...store.form()}
                                    resetOnSuccess={['password']}
                                    className="flex flex-col gap-5"
                                >
                                    {({ processing, errors }) => (
                                        <>
                                            <div className="grid gap-4">
                                                <div className="grid gap-2">
                                                    <Label
                                                        htmlFor="email"
                                                        className="text-sm font-semibold text-white"
                                                    >
                                                        Email address
                                                    </Label>

                                                    <div className="relative">
                                                        <Mail className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-white/45" />
                                                        <Input
                                                            id="email"
                                                            type="email"
                                                            name="email"
                                                            required
                                                            autoFocus
                                                            tabIndex={1}
                                                            autoComplete="email"
                                                            placeholder="email@example.com"
                                                            className="h-12 rounded-2xl border-white/14 bg-white/12 pl-10 text-white shadow-none outline-none transition placeholder:text-white/42 focus-visible:ring-[#D4A23C]/35"
                                                        />
                                                    </div>
                                                    <InputError message={errors.email} />
                                                </div>

                                                <div className="grid gap-2">
                                                    <div className="flex items-center">
                                                        <Label
                                                            htmlFor="password"
                                                            className="text-sm font-semibold text-white"
                                                        >
                                                            Password
                                                        </Label>


                                                    </div>

                                                    <PasswordInput
                                                        id="password"
                                                        name="password"
                                                        required
                                                        tabIndex={2}
                                                        autoComplete="current-password"
                                                        placeholder="Password"
                                                        className="h-12 rounded-2xl border-white/14 bg-white/12 text-white shadow-none outline-none transition placeholder:text-white/42 focus-visible:ring-[#D4A23C]/35"
                                                    />
                                                    <InputError message={errors.password} />
                                                </div>

                                            

                                                <Button
                                                    type="submit"
                                                    className="mt-1 h-12 w-full rounded-2xl bg-[#D4A23C] text-sm font-bold text-[#061F39] shadow-lg shadow-[#D4A23C]/20 transition hover:-translate-y-0.5 hover:bg-[#e2b34a]"
                                                    tabIndex={4}
                                                    disabled={processing}
                                                    data-test="login-button"
                                                >
                                                    {processing && <Spinner />}
                                                    <span>Log in</span>
                                                    {!processing && (
                                                        <ArrowRight className="ml-1 h-4 w-4" />
                                                    )}
                                                </Button>
                                            </div>

                                            {canRegister && (
                                                <div className="rounded-2xl border border-white/12 bg-white/[0.08] px-4 py-3 text-center text-sm text-white/65">
                                                    Don't have an account?{' '}
                                                    <TextLink
                                                        href={register()}
                                                        tabIndex={5}
                                                        className="font-bold text-[#F6D27B] hover:text-white"
                                                    >
                                                        Sign up
                                                    </TextLink>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </Form>
                            </div>
                        </motion.div>

                        <p className="login-reveal mt-4 text-center text-xs leading-6 text-white/58">
                            Protected by CIM secure access. Never share your
                            password or verification details.
                        </p>
                    </section>
                </div>
            </main>
        </>
    );
}

function TrustCard({
    icon: Icon,
    title,
    text,
}: {
    icon: ComponentType<{ className?: string }>;
    title: string;
    text: string;
}) {
    return (
        <div className="rounded-2xl border border-white/12 bg-white/10 p-4 backdrop-blur-xl">
            <Icon className="mb-3 h-5 w-5 text-[#F6D27B]" />
            <p className="text-sm font-semibold text-white">{title}</p>
            <p className="mt-1 text-xs text-white/55">{text}</p>
        </div>
    );
}
