import { Head, router } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    BadgeCheck,
    BriefcaseBusiness,
    Building2,
    CalendarCheck,
    CheckCircle2,
    FileImage,
    IdCard,
    Landmark,
    LockKeyhole,
    Mail,
    MapPin,
    Phone,
    ShieldCheck,
    Sparkles,
    UploadCloud,
    UserRound,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ComponentType, ReactNode } from 'react';
import { motion } from 'motion/react';
import gsap from 'gsap';
import TextLink from '@/components/text-link';
import { login } from '@/routes';
import background from '../customer/images/CIM.png';

type FormData = {
    name: string;
    email: string;
    phone: string;
    password: string;
    password_confirmation: string;
    date_of_birth: string;
    address: string;
    cin: string;
    cin_front: File | null;
    cin_back: File | null;
    profession: string;
    branch_id: string;
};

type ValidationErrors = Record<string, string>;

type Branch = {
    id: number;
    name: string;
    city: string;
};

const steps = [
    {
        number: 1,
        label: 'Contact',
        title: 'Contact information',
        description: 'Start with your name, email and phone number.',
        icon: Mail,
    },
    {
        number: 2,
        label: 'Security',
        title: 'Personal information',
        description: 'Create your password and add your address details.',
        icon: LockKeyhole,
    },
    {
        number: 3,
        label: 'Identity',
        title: 'Identity verification',
        description: 'Upload your CIN and choose your preferred branch.',
        icon: IdCard,
    },
];

const benefits = [
    'Secure onboarding',
    'Branch appointment ready',
    'CIN verification',
    'Digital banking access',
    'Machrou3i support',
    'ATM locator services',
];

export default function Register({ branches }: { branches?: Branch[] }) {
    const pageRef = useRef<HTMLDivElement | null>(null);
    const [step, setStep] = useState(1);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<ValidationErrors>({});
    const [form, setForm] = useState<FormData>({
        name: '',
        email: '',
        phone: '',
        password: '',
        password_confirmation: '',
        date_of_birth: '',
        address: '',
        cin: '',
        cin_front: null,
        cin_back: null,
        profession: '',
        branch_id: '',
    });

    const currentStep = steps[step - 1];

    useEffect(() => {
        if (!pageRef.current) {
            return undefined;
        }

        const ctx = gsap.context(() => {
            gsap.fromTo(
                '.register-reveal',
                { autoAlpha: 0, y: 22 },
                {
                    autoAlpha: 1,
                    y: 0,
                    duration: 0.68,
                    stagger: 0.065,
                    ease: 'power3.out',
                },
            );

            gsap.to('.register-orb', {
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

    const updateField = useCallback(
        (field: keyof FormData, value: string | File | null) => {
            setForm((prev) => ({ ...prev, [field]: value }));
            setErrors((prev) => {
                const next = { ...prev };
                delete next[field];

                return next;
            });
        },
        [],
    );

    const validateStep = (s: number): boolean => {
        const nextErrors: ValidationErrors = {};

        if (s === 1) {
            if (!form.name.trim()) {
                nextErrors.name = 'Full name is required.';
            }

            if (!form.email.trim()) {
                nextErrors.email = 'Email is required.';
            } else if (!/^\S+@\S+\.\S+$/.test(form.email)) {
                nextErrors.email = 'Invalid email address.';
            }

            if (!form.phone.trim()) {
                nextErrors.phone = 'Phone number is required.';
            }
        }

        if (s === 2) {
            if (!form.password) {
                nextErrors.password = 'Password is required.';
            } else if (form.password.length < 8) {
                nextErrors.password = 'Password must be at least 8 characters.';
            }

            if (form.password !== form.password_confirmation) {
                nextErrors.password_confirmation = 'Passwords do not match.';
            }

            if (!form.date_of_birth) {
                nextErrors.date_of_birth = 'Date of birth is required.';
            }

            if (!form.address.trim()) {
                nextErrors.address = 'Address is required.';
            }
        }

        if (s === 3) {
            if (!form.cin.trim()) {
                nextErrors.cin = 'CIN number is required.';
            }

            if (!form.cin_front) {
                nextErrors.cin_front = 'CIN front image is required.';
            }

            if (!form.cin_back) {
                nextErrors.cin_back = 'CIN back image is required.';
            }

            if (!form.profession.trim()) {
                nextErrors.profession = 'Profession is required.';
            }

            if (!form.branch_id) {
                nextErrors.branch_id = 'Please select a branch.';
            }
        }

        setErrors(nextErrors);

        return Object.keys(nextErrors).length === 0;
    };

    const nextStep = () => {
        if (validateStep(step)) {
            setStep((value) => Math.min(value + 1, 3));
        }
    };

    const prevStep = () => setStep((value) => Math.max(value - 1, 1));

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();

        if (!validateStep(3)) {
            return;
        }

        setProcessing(true);

        const data = new FormData();

        Object.entries(form).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
                data.append(key, value as string | Blob);
            }
        });

        router.post('/onboarding/register', data, {
            forceFormData: true,
            onError: (serverErrors) => {
                setErrors(serverErrors as ValidationErrors);

                const step1Fields = ['name', 'email', 'phone'];
                const step2Fields = [
                    'password',
                    'password_confirmation',
                    'date_of_birth',
                    'address',
                ];
                const errorKeys = Object.keys(serverErrors);

                if (errorKeys.some((key) => step1Fields.includes(key))) {
                    setStep(1);
                } else if (errorKeys.some((key) => step2Fields.includes(key))) {
                    setStep(2);
                } else {
                    setStep(3);
                }
            },
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <>
            <Head title="Open an Account — CIM" />

            <main
                ref={pageRef}
                className="relative h-svh overflow-hidden bg-[#061F39] text-white"
            >
                <div className="absolute inset-0">
                    <img
                        src={background}
                        alt="CIM Bank"
                        className="h-full w-full object-cover"
                    />

                    <div className="absolute inset-0 bg-[#061F39]/60" />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#061F39]/94 via-[#061F39]/66 to-[#061F39]/30" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#061F39]/78 via-transparent to-[#061F39]/20" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(212,162,60,0.25),transparent_28%),radial-gradient(circle_at_88%_18%,rgba(10,100,116,0.22),transparent_34%)]" />
                </div>

                <div className="register-orb pointer-events-none absolute -top-24 right-10 h-80 w-80 rounded-full bg-[#D4A23C]/18 blur-3xl" />
                <div className="register-orb pointer-events-none absolute bottom-10 -left-28 h-96 w-96 rounded-full bg-[#0A6474]/24 blur-3xl" />

                <div className="relative z-10 grid h-full w-full items-center px-4 py-4 sm:px-6 lg:grid-cols-[1fr_520px] lg:px-10 xl:px-16">
                    <section className="register-reveal hidden max-w-3xl lg:block">
                        <img
                            src="/logo_twil.png"
                            alt="CIM Bank"
                            className="h-16 w-auto max-w-[270px] object-contain drop-shadow-2xl"
                        />

                        <div className="mt-10 inline-flex items-center gap-2 rounded-full border border-[#D4A23C]/35 bg-[#D4A23C]/12 px-4 py-2 text-xs font-bold tracking-[0.18em] text-[#F6D27B] uppercase backdrop-blur-xl">
                            <Sparkles className="h-4 w-4" />
                            Digital onboarding
                        </div>

                        <h1 className="mt-6 max-w-3xl text-5xl font-semibold leading-[0.95] tracking-tight text-white xl:text-6xl">
                            Open your CIM account with confidence.
                        </h1>

                        <p className="mt-5 max-w-xl text-base leading-8 text-white/72">
                            Submit your contact details, verify your identity,
                            choose a branch, and start your secure CIM banking
                            journey.
                        </p>

                        <div className="mt-8 flex flex-wrap gap-2">
                            {benefits.map((item) => (
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
                                text="Protected submission"
                            />
                            <TrustCard
                                icon={CalendarCheck}
                                title="Branch"
                                text="Appointment ready"
                            />
                            <TrustCard
                                icon={Landmark}
                                title="CIM"
                                text="Bank review"
                            />
                        </div>
                    </section>

                    <section className="register-reveal mx-auto w-full max-w-[520px]">
                        <div className="mb-3 flex justify-center lg:hidden">
                            <img
                                src="/logo_twil.png"
                                alt="CIM Bank"
                                className="h-11 w-auto max-w-[220px] object-contain drop-shadow-2xl"
                            />
                        </div>

                        <motion.div
                            className="overflow-hidden rounded-[1.75rem] border border-white/14 bg-white/[0.13] shadow-[0_30px_100px_rgba(0,0,0,0.32)] backdrop-blur-2xl"
                            whileHover={{ y: -2 }}
                            transition={{ duration: 0.22 }}
                        >
                            <div className="border-b border-white/10 px-5 py-4 sm:px-7">
                                <div className="hidden lg:block">
                                    <img
                                        src="/logo_twil.png"
                                        alt="CIM Bank"
                                        className="h-10 w-auto max-w-[205px] object-contain"
                                    />
                                </div>

                                <div className="mt-4 flex items-start justify-between gap-4">
                                    <div>
                                        <div className="inline-flex items-center gap-2 rounded-full border border-[#D4A23C]/35 bg-[#D4A23C]/12 px-3 py-1 text-xs font-semibold text-[#F6D27B]">
                                            <currentStep.icon className="h-3.5 w-3.5" />
                                            Step {step} of 3
                                        </div>

                                        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">
                                            {currentStep.title}
                                        </h2>

                                        <p className="mt-1 text-sm leading-6 text-white/62">
                                            {currentStep.description}
                                        </p>
                                    </div>
                                </div>

                                <StepIndicator current={step} />
                            </div>

                            <form
                                onSubmit={handleSubmit}
                                className="px-5 py-4 sm:px-7"
                            >
                                {step === 1 && (
                                    <div className="grid gap-3">
                                        <CimField
                                            label="Full name"
                                            error={errors.name}
                                            icon={UserRound}
                                        >
                                            <CimInput
                                                type="text"
                                                value={form.name}
                                                onChange={(event) =>
                                                    updateField(
                                                        'name',
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="Mohamed Amine"
                                                autoFocus
                                            />
                                        </CimField>

                                        <CimField
                                            label="Email address"
                                            error={errors.email}
                                            icon={Mail}
                                        >
                                            <CimInput
                                                type="email"
                                                value={form.email}
                                                onChange={(event) =>
                                                    updateField(
                                                        'email',
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="email@example.com"
                                            />
                                        </CimField>

                                        <CimField
                                            label="Phone number"
                                            error={errors.phone}
                                            icon={Phone}
                                        >
                                            <CimInput
                                                type="tel"
                                                value={form.phone}
                                                onChange={(event) =>
                                                    updateField(
                                                        'phone',
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="+212 6XX XXX XXX"
                                            />
                                        </CimField>
                                    </div>
                                )}

                                {step === 2 && (
                                    <div className="grid gap-3">
                                        <CimField
                                            label="Password"
                                            error={errors.password}
                                            icon={LockKeyhole}
                                        >
                                            <CimInput
                                                type="password"
                                                value={form.password}
                                                onChange={(event) =>
                                                    updateField(
                                                        'password',
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="Min. 8 characters"
                                                autoFocus
                                            />
                                        </CimField>

                                        <CimField
                                            label="Confirm password"
                                            error={
                                                errors.password_confirmation
                                            }
                                            icon={LockKeyhole}
                                        >
                                            <CimInput
                                                type="password"
                                                value={
                                                    form.password_confirmation
                                                }
                                                onChange={(event) =>
                                                    updateField(
                                                        'password_confirmation',
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="Re-enter password"
                                            />
                                        </CimField>

                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <CimField
                                                label="Date of birth"
                                                error={errors.date_of_birth}
                                            >
                                                <CimInput
                                                    type="date"
                                                    value={form.date_of_birth}
                                                    onChange={(event) =>
                                                        updateField(
                                                            'date_of_birth',
                                                            event.target.value,
                                                        )
                                                    }
                                                />
                                            </CimField>

                                            <CimField
                                                label="Address"
                                                error={errors.address}
                                                icon={MapPin}
                                            >
                                                <CimInput
                                                    type="text"
                                                    value={form.address}
                                                    onChange={(event) =>
                                                        updateField(
                                                            'address',
                                                            event.target.value,
                                                        )
                                                    }
                                                    placeholder="Street, city"
                                                />
                                            </CimField>
                                        </div>
                                    </div>
                                )}

                                {step === 3 && (
                                    <div className="grid gap-3">
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <CimField
                                                label="CIN number"
                                                error={errors.cin}
                                                icon={IdCard}
                                            >
                                                <CimInput
                                                    type="text"
                                                    value={form.cin}
                                                    onChange={(event) =>
                                                        updateField(
                                                            'cin',
                                                            event.target.value,
                                                        )
                                                    }
                                                    placeholder="AB123456"
                                                    autoFocus
                                                />
                                            </CimField>

                                            <CimField
                                                label="Profession"
                                                error={errors.profession}
                                                icon={BriefcaseBusiness}
                                            >
                                                <CimInput
                                                    type="text"
                                                    value={form.profession}
                                                    onChange={(event) =>
                                                        updateField(
                                                            'profession',
                                                            event.target.value,
                                                        )
                                                    }
                                                    placeholder="Software Engineer"
                                                />
                                            </CimField>
                                        </div>

                                        <CimField
                                            label="Preferred branch"
                                            error={errors.branch_id}
                                            icon={Building2}
                                        >
                                            <CimSelect
                                                value={form.branch_id}
                                                onChange={(event) =>
                                                    updateField(
                                                        'branch_id',
                                                        event.target.value,
                                                    )
                                                }
                                                options={(branches ?? []).map(
                                                    (branch) => ({
                                                        value: String(branch.id),
                                                        label: `${branch.name} — ${branch.city}`,
                                                    }),
                                                )}
                                                placeholder="Select a branch"
                                            />
                                        </CimField>

                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <CimField
                                                label="CIN front image"
                                                error={errors.cin_front}
                                            >
                                                <CimFileInput
                                                    file={form.cin_front}
                                                    onChange={(file) =>
                                                        updateField(
                                                            'cin_front',
                                                            file,
                                                        )
                                                    }
                                                />
                                            </CimField>

                                            <CimField
                                                label="CIN back image"
                                                error={errors.cin_back}
                                            >
                                                <CimFileInput
                                                    file={form.cin_back}
                                                    onChange={(file) =>
                                                        updateField(
                                                            'cin_back',
                                                            file,
                                                        )
                                                    }
                                                />
                                            </CimField>
                                        </div>
                                    </div>
                                )}

                                <div className="mt-4 flex gap-3">
                                    {step > 1 && (
                                        <button
                                            type="button"
                                            onClick={prevStep}
                                            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-white/12 bg-white/[0.08] px-5 text-sm font-semibold text-white/78 transition hover:bg-white/[0.12]"
                                        >
                                            <ArrowLeft className="h-4 w-4" />
                                            Back
                                        </button>
                                    )}

                                    {step < 3 ? (
                                        <button
                                            type="button"
                                            onClick={nextStep}
                                            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#D4A23C] px-5 text-sm font-bold text-[#061F39] shadow-lg shadow-[#D4A23C]/20 transition hover:-translate-y-0.5 hover:bg-[#e2b34a]"
                                        >
                                            Next
                                            <ArrowRight className="h-4 w-4" />
                                        </button>
                                    ) : (
                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#D4A23C] px-5 text-sm font-bold text-[#061F39] shadow-lg shadow-[#D4A23C]/20 transition hover:-translate-y-0.5 hover:bg-[#e2b34a] disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            {processing
                                                ? 'Submitting...'
                                                : 'Submit request'}
                                            {!processing && (
                                                <ArrowRight className="h-4 w-4" />
                                            )}
                                        </button>
                                    )}
                                </div>

                                <div className="mt-4 rounded-2xl border border-white/12 bg-white/[0.08] px-4 py-3 text-center text-sm text-white/65">
                                    Already have an account?{' '}
                                    <TextLink
                                        href={login()}
                                        className="font-bold text-[#F6D27B] hover:text-white"
                                    >
                                        Log in
                                    </TextLink>
                                </div>
                            </form>
                        </motion.div>

                        <p className="register-reveal mt-3 text-center text-xs leading-6 text-white/58">
                            Your request is reviewed by CIM staff before account
                            activation.
                        </p>
                    </section>
                </div>
            </main>
        </>
    );
}

function StepIndicator({ current }: { current: number }) {
    return (
        <div className="mt-4 grid grid-cols-3 gap-2">
            {steps.map(({ number, label }) => {
                const active = number === current;
                const done = number < current;

                return (
                    <div
                        key={label}
                        className={`rounded-2xl border px-3 py-2 transition ${
                            active
                                ? 'border-[#D4A23C]/60 bg-[#D4A23C]/12'
                                : done
                                  ? 'border-emerald-300/25 bg-emerald-400/10'
                                  : 'border-white/12 bg-white/[0.06]'
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            <span
                                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                                    active
                                        ? 'bg-[#D4A23C] text-[#061F39]'
                                        : done
                                          ? 'bg-emerald-400 text-[#061F39]'
                                          : 'bg-white/10 text-white/50'
                                }`}
                            >
                                {done ? '✓' : number}
                            </span>
                            <span
                                className={`text-xs font-semibold ${
                                    active
                                        ? 'text-[#F6D27B]'
                                        : done
                                          ? 'text-emerald-100'
                                          : 'text-white/42'
                                }`}
                            >
                                {label}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function CimField({
    label,
    error,
    icon: Icon,
    children,
}: {
    label: string;
    error?: string;
    icon?: ComponentType<{ className?: string }>;
    children: ReactNode;
}) {
    return (
        <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold tracking-[0.12em] text-white/64 uppercase">
                {Icon ? <Icon className="h-3.5 w-3.5 text-[#F6D27B]" /> : null}
                {label}
            </span>
            {children}
            {error && (
                <span className="mt-1 block text-xs font-medium text-rose-200">
                    {error}
                </span>
            )}
        </label>
    );
}

function CimInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            {...props}
            className={`h-10 w-full rounded-2xl border border-white/14 bg-white/12 px-3 text-sm font-semibold text-white outline-none transition placeholder:text-white/36 focus:border-[#D4A23C]/70 focus:bg-white/[0.16] focus:ring-4 focus:ring-[#D4A23C]/15 ${props.className ?? ''}`}
        />
    );
}

function CimSelect({
    value,
    onChange,
    options,
    placeholder,
}: {
    value: string;
    onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
    options: { value: string; label: string }[];
    placeholder: string;
}) {
    return (
        <select
            value={value}
            onChange={onChange}
            className="h-10 w-full rounded-2xl border border-white/14 bg-white/12 px-3 text-sm font-semibold text-white outline-none transition focus:border-[#D4A23C]/70 focus:bg-white/[0.16] focus:ring-4 focus:ring-[#D4A23C]/15"
        >
            <option value="" disabled className="bg-[#061F39] text-white/60">
                {placeholder}
            </option>
            {options.map((option) => (
                <option
                    key={option.value}
                    value={option.value}
                    className="bg-[#061F39] text-white"
                >
                    {option.label}
                </option>
            ))}
        </select>
    );
}

function CimFileInput({
    file,
    onChange,
}: {
    file: File | null;
    onChange: (file: File | null) => void;
}) {
    return (
        <label className="flex h-20 cursor-pointer items-center justify-center rounded-2xl border border-dashed border-white/18 bg-white/[0.08] px-3 text-center transition hover:border-[#D4A23C]/60 hover:bg-white/[0.12]">
            <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => onChange(event.target.files?.[0] ?? null)}
            />

            {file ? (
                <div>
                    <CheckCircle2 className="mx-auto mb-1 h-5 w-5 text-[#F6D27B]" />
                    <p className="max-w-[170px] truncate text-xs font-semibold text-white/80">
                        {file.name}
                    </p>
                </div>
            ) : (
                <div>
                    <UploadCloud className="mx-auto mb-1 h-5 w-5 text-[#F6D27B]" />
                    <p className="text-xs font-semibold text-white/58">
                        Upload image
                    </p>
                </div>
            )}
        </label>
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
