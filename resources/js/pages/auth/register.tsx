import { Head, router } from '@inertiajs/react';
import { useCallback, useState } from 'react';
import TextLink from '@/components/text-link';
import { login } from '@/routes';

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

/* ── Step indicator labels ── */
const STEPS = [
    { label: 'Contact Information', icon: '📧' },
    { label: 'Personal Information', icon: '🔒' },
    { label: 'Identity Verification', icon: '🪪' },
    { label: 'Appointment Booking', icon: '📅' },
];

/* ── Types ── */
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

export default function Register({ branches }: { branches?: Branch[] }) {
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

    const updateField = useCallback((field: keyof FormData, value: string | File | null) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => {
            const next = { ...prev };
            delete next[field];
            return next;
        });
    }, []);

    /* ── Step validation (client-side) ── */
    const validateStep = (s: number): boolean => {
        const errs: ValidationErrors = {};
        if (s === 1) {
            if (!form.name.trim()) errs.name = 'Full name is required.';
            if (!form.email.trim()) errs.email = 'Email is required.';
            else if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'Invalid email address.';
            if (!form.phone.trim()) errs.phone = 'Phone number is required.';
        } else if (s === 2) {
            if (!form.password) errs.password = 'Password is required.';
            else if (form.password.length < 8) errs.password = 'Password must be at least 8 characters.';
            if (form.password !== form.password_confirmation) errs.password_confirmation = 'Passwords do not match.';
            if (!form.date_of_birth) errs.date_of_birth = 'Date of birth is required.';
            if (!form.address.trim()) errs.address = 'Address is required.';
        } else if (s === 3) {
            if (!form.cin.trim()) errs.cin = 'CIN number is required.';
            if (!form.cin_front) errs.cin_front = 'CIN front image is required.';
            if (!form.cin_back) errs.cin_back = 'CIN back image is required.';
            if (!form.profession.trim()) errs.profession = 'Profession is required.';
            if (!form.branch_id) errs.branch_id = 'Please select a branch.';
        }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const nextStep = () => {
        if (validateStep(step)) setStep((s) => Math.min(s + 1, 3));
    };

    const prevStep = () => setStep((s) => Math.max(s - 1, 1));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateStep(3)) return;

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
                // Navigate to the step containing the first error
                const step1Fields = ['name', 'email', 'phone'];
                const step2Fields = ['password', 'password_confirmation', 'date_of_birth', 'address'];
                const errorKeys = Object.keys(serverErrors);
                if (errorKeys.some((k) => step1Fields.includes(k))) setStep(1);
                else if (errorKeys.some((k) => step2Fields.includes(k))) setStep(2);
                else setStep(3);
            },
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <>
            <Head title="Open an Account — CIM" />
            <div className="cim-root" style={{ position: 'fixed', inset: 0, overflow: 'auto', background: CIM.dark }}>
                {/* Background gradient */}
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 0,
                        background: `radial-gradient(ellipse 80% 60% at 50% 30%, ${CIM.primary}40 0%, ${CIM.dark} 100%)`,
                    }}
                />

                <div
                    style={{
                        position: 'relative',
                        zIndex: 10,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        minHeight: '100vh',
                        padding: '32px 16px',
                    }}
                >
                    {/* Logo */}
                    <div style={{ textAlign: 'center', marginBottom: 24 }}>
                        <div
                            style={{
                                fontFamily: "'Playfair Display', serif",
                                fontSize: '1.5rem',
                                fontWeight: 600,
                                color: CIM.white,
                                letterSpacing: '0.12em',
                            }}
                        >
                            CIM
                        </div>
                        <div
                            style={{
                                fontSize: '0.65rem',
                                color: CIM.accent,
                                letterSpacing: '0.18em',
                                textTransform: 'uppercase' as const,
                                fontWeight: 500,
                            }}
                        >
                            Credit Intelligence Mizan
                        </div>
                    </div>

                    {/* Step Indicator */}
                    <StepIndicator current={step} />

                    {/* Card */}
                    <div
                        style={{
                            width: '100%',
                            maxWidth: 520,
                            background: 'rgba(6, 31, 57, 0.5)',
                            backdropFilter: 'blur(28px)',
                            border: `1px solid rgba(212, 162, 60, 0.18)`,
                            borderRadius: 24,
                            padding: '40px 36px 32px',
                            boxShadow: '0 32px 80px rgba(0,0,0,0.4)',
                            position: 'relative',
                            overflow: 'hidden',
                        }}
                    >
                        {/* Gold accent line */}
                        <div
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: '50%',
                                transform: 'translateX(-50%)',
                                width: '60%',
                                height: 2,
                                background: `linear-gradient(90deg, transparent, ${CIM.accent}, transparent)`,
                            }}
                        />

                        {/* Header */}
                        <div style={{ textAlign: 'center', marginBottom: 28 }}>
                            <h1
                                style={{
                                    fontFamily: "'Playfair Display', serif",
                                    fontSize: '1.35rem',
                                    fontWeight: 600,
                                    color: CIM.white,
                                    margin: '0 0 6px',
                                }}
                            >
                                {step === 1 && 'Contact Information'}
                                {step === 2 && 'Personal Information'}
                                {step === 3 && 'Identity Verification'}
                            </h1>
                            <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
                                {step === 1 && 'Enter your contact details to get started'}
                                {step === 2 && 'Set up your password and personal details'}
                                {step === 3 && 'Upload your identification documents'}
                            </p>
                        </div>

                        <form onSubmit={handleSubmit}>
                            {/* Step 1 */}
                            {step === 1 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    <CimField label="Full Name" error={errors.name}>
                                        <CimInput
                                            type="text"
                                            placeholder="Mohamed Amine"
                                            value={form.name}
                                            onChange={(e) => updateField('name', e.target.value)}
                                            autoFocus
                                        />
                                    </CimField>
                                    <CimField label="Email Address" error={errors.email}>
                                        <CimInput
                                            type="email"
                                            placeholder="email@example.com"
                                            value={form.email}
                                            onChange={(e) => updateField('email', e.target.value)}
                                        />
                                    </CimField>
                                    <CimField label="Phone Number" error={errors.phone}>
                                        <CimInput
                                            type="tel"
                                            placeholder="+212 6XX XXX XXX"
                                            value={form.phone}
                                            onChange={(e) => updateField('phone', e.target.value)}
                                        />
                                    </CimField>
                                </div>
                            )}

                            {/* Step 2 */}
                            {step === 2 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    <CimField label="Password" error={errors.password}>
                                        <CimInput
                                            type="password"
                                            placeholder="Min. 8 characters"
                                            value={form.password}
                                            onChange={(e) => updateField('password', e.target.value)}
                                            autoFocus
                                        />
                                    </CimField>
                                    <CimField label="Confirm Password" error={errors.password_confirmation}>
                                        <CimInput
                                            type="password"
                                            placeholder="Re-enter your password"
                                            value={form.password_confirmation}
                                            onChange={(e) => updateField('password_confirmation', e.target.value)}
                                        />
                                    </CimField>
                                    <CimField label="Date of Birth" error={errors.date_of_birth}>
                                        <CimInput
                                            type="date"
                                            value={form.date_of_birth}
                                            onChange={(e) => updateField('date_of_birth', e.target.value)}
                                        />
                                    </CimField>
                                    <CimField label="Address" error={errors.address}>
                                        <CimInput
                                            type="text"
                                            placeholder="Street, City, Morocco"
                                            value={form.address}
                                            onChange={(e) => updateField('address', e.target.value)}
                                        />
                                    </CimField>
                                </div>
                            )}

                            {/* Step 3 */}
                            {step === 3 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    <CimField label="CIN Number" error={errors.cin}>
                                        <CimInput
                                            type="text"
                                            placeholder="e.g. AB123456"
                                            value={form.cin}
                                            onChange={(e) => updateField('cin', e.target.value)}
                                            autoFocus
                                        />
                                    </CimField>
                                    <CimField label="CIN Front Image" error={errors.cin_front}>
                                        <CimFileInput
                                            accept="image/*"
                                            file={form.cin_front}
                                            onChange={(f) => updateField('cin_front', f)}
                                        />
                                    </CimField>
                                    <CimField label="CIN Back Image" error={errors.cin_back}>
                                        <CimFileInput
                                            accept="image/*"
                                            file={form.cin_back}
                                            onChange={(f) => updateField('cin_back', f)}
                                        />
                                    </CimField>
                                    <CimField label="Profession / Job" error={errors.profession}>
                                        <CimInput
                                            type="text"
                                            placeholder="e.g. Software Engineer"
                                            value={form.profession}
                                            onChange={(e) => updateField('profession', e.target.value)}
                                        />
                                    </CimField>
                                    <CimField label="Preferred Branch" error={errors.branch_id}>
                                        <CimSelect
                                            value={form.branch_id}
                                            onChange={(e) => updateField('branch_id', e.target.value)}
                                            options={(branches ?? []).map((b) => ({
                                                value: String(b.id),
                                                label: `${b.name} — ${b.city}`,
                                            }))}
                                            placeholder="Select a branch"
                                        />
                                    </CimField>
                                </div>
                            )}

                            {/* Navigation Buttons */}
                            <div
                                style={{
                                    display: 'flex',
                                    gap: 12,
                                    marginTop: 24,
                                    flexDirection: step === 1 ? 'column' : 'row',
                                }}
                            >
                                {step > 1 && (
                                    <button type="button" onClick={prevStep} className="cim-btn-secondary">
                                        Back
                                    </button>
                                )}
                                {step < 3 && (
                                    <button type="button" onClick={nextStep} className="cim-btn-primary" style={{ flex: 1 }}>
                                        Next
                                    </button>
                                )}
                                {step === 3 && (
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="cim-btn-primary"
                                        style={{ flex: 1, opacity: processing ? 0.6 : 1 }}
                                    >
                                        {processing ? 'Submitting...' : 'Submit Request'}
                                    </button>
                                )}
                            </div>
                        </form>

                        {/* Login link */}
                        <div
                            style={{
                                textAlign: 'center',
                                marginTop: 20,
                                fontSize: '0.8rem',
                                color: 'rgba(255,255,255,0.4)',
                            }}
                        >
                            Already have an account?{' '}
                            <TextLink href={login()} style={{ color: CIM.accent, fontWeight: 600 }}>
                                Log in
                            </TextLink>
                        </div>
                    </div>
                </div>
            </div>

            {/* Inline styles for buttons */}
            <style>{`
                .cim-btn-primary {
                    width: 100%;
                    padding: 14px 24px;
                    font-size: 0.92rem;
                    font-weight: 600;
                    font-family: 'Inter', sans-serif;
                    letter-spacing: 0.06em;
                    color: #ffffff;
                    background: linear-gradient(135deg, ${CIM.primary} 0%, ${CIM.secondary} 60%, #0d7a8c 100%);
                    border: 1.5px solid rgba(212, 162, 60, 0.25);
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 0 6px 24px rgba(0,0,0,0.3);
                }
                .cim-btn-primary:hover:not(:disabled) {
                    border-color: rgba(212, 162, 60, 0.6);
                    box-shadow: 0 8px 32px rgba(0,0,0,0.4), 0 0 30px rgba(212, 162, 60, 0.15);
                    transform: translateY(-1px);
                }
                .cim-btn-primary:disabled {
                    cursor: not-allowed;
                }
                .cim-btn-secondary {
                    padding: 14px 24px;
                    font-size: 0.88rem;
                    font-weight: 500;
                    font-family: 'Inter', sans-serif;
                    color: rgba(255,255,255,0.6);
                    background: rgba(255,255,255,0.06);
                    border: 1px solid rgba(209,217,218,0.15);
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.25s;
                }
                .cim-btn-secondary:hover {
                    border-color: rgba(10,100,116,0.4);
                    color: rgba(255,255,255,0.8);
                    background: rgba(255,255,255,0.1);
                }
            `}</style>
        </>
    );
}

/* ── Layout for Fortify ── */
Register.layout = {
    title: 'Open an Account',
    description: 'Complete the onboarding process to open your CIM bank account',
};

/* ── Step Indicator ── */
function StepIndicator({ current }: { current: number }) {
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 0,
                marginBottom: 28,
                width: '100%',
                maxWidth: 520,
            }}
        >
            {STEPS.map((s, i) => {
                const stepNum = i + 1;
                const isActive = stepNum === current;
                const isDone = stepNum < current;
                const isLast = i === STEPS.length - 1;
                return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', flex: isLast ? '0 0 auto' : 1 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                            <div
                                style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.8rem',
                                    fontWeight: 700,
                                    background: isDone
                                        ? CIM.accent
                                        : isActive
                                          ? `linear-gradient(135deg, ${CIM.primary}, ${CIM.secondary})`
                                          : 'rgba(255,255,255,0.08)',
                                    color: isDone || isActive ? CIM.white : 'rgba(255,255,255,0.35)',
                                    border: isActive ? `2px solid ${CIM.accent}` : '2px solid transparent',
                                    transition: 'all 0.3s',
                                }}
                            >
                                {isDone ? '✓' : stepNum}
                            </div>
                            <span
                                style={{
                                    fontSize: '0.6rem',
                                    color: isActive ? CIM.accent : isDone ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.3)',
                                    fontWeight: isActive ? 600 : 400,
                                    textAlign: 'center',
                                    whiteSpace: 'nowrap',
                                    letterSpacing: '0.02em',
                                }}
                            >
                                {s.label}
                            </span>
                        </div>
                        {!isLast && (
                            <div
                                style={{
                                    flex: 1,
                                    height: 2,
                                    margin: '0 8px',
                                    marginBottom: 20,
                                    background: isDone ? CIM.accent : 'rgba(255,255,255,0.1)',
                                    borderRadius: 1,
                                    transition: 'background 0.3s',
                                }}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

/* ── Reusable Field ── */
function CimField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
    return (
        <div>
            <label
                style={{
                    display: 'block',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    color: 'rgba(255,255,255,0.65)',
                    marginBottom: 6,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase' as const,
                }}
            >
                {label}
            </label>
            {children}
            {error && <p style={{ fontSize: '0.78rem', color: '#f0705a', marginTop: 5 }}>{error}</p>}
        </div>
    );
}

/* ── Reusable Input ── */
function CimInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            {...props}
            style={{
                width: '100%',
                padding: '13px 14px',
                fontSize: '0.9rem',
                fontFamily: "'Inter', sans-serif",
                color: '#ffffff',
                background: 'rgba(255,255,255,0.06)',
                border: '1.5px solid rgba(209,217,218,0.15)',
                borderRadius: 12,
                outline: 'none',
                transition: 'all 0.3s',
                boxSizing: 'border-box' as const,
                ...props.style,
            }}
            onFocus={(e) => {
                e.target.style.borderColor = CIM.accent;
                e.target.style.background = 'rgba(255,255,255,0.1)';
                e.target.style.boxShadow = `0 0 0 3px rgba(212,162,60,0.12)`;
                props.onFocus?.(e);
            }}
            onBlur={(e) => {
                e.target.style.borderColor = 'rgba(209,217,218,0.15)';
                e.target.style.background = 'rgba(255,255,255,0.06)';
                e.target.style.boxShadow = 'none';
                props.onBlur?.(e);
            }}
        />
    );
}

/* ── Select ── */
function CimSelect({
    value,
    onChange,
    options,
    placeholder,
}: {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    options: { value: string; label: string }[];
    placeholder: string;
}) {
    return (
        <select
            value={value}
            onChange={onChange}
            style={{
                width: '100%',
                padding: '13px 14px',
                fontSize: '0.9rem',
                fontFamily: "'Inter', sans-serif",
                color: value ? '#ffffff' : 'rgba(255,255,255,0.3)',
                background: 'rgba(255,255,255,0.06)',
                border: '1.5px solid rgba(209,217,218,0.15)',
                borderRadius: 12,
                outline: 'none',
                transition: 'all 0.3s',
                boxSizing: 'border-box' as const,
                cursor: 'pointer',
            }}
        >
            <option value="" disabled style={{ background: CIM.dark, color: 'rgba(255,255,255,0.5)' }}>
                {placeholder}
            </option>
            {options.map((o) => (
                <option key={o.value} value={o.value} style={{ background: CIM.dark, color: '#fff' }}>
                    {o.label}
                </option>
            ))}
        </select>
    );
}

/* ── File Upload ── */
function CimFileInput({
    accept,
    file,
    onChange,
}: {
    accept: string;
    file: File | null;
    onChange: (f: File | null) => void;
}) {
    return (
        <div
            style={{
                position: 'relative',
                border: '1.5px dashed rgba(209,217,218,0.2)',
                borderRadius: 12,
                padding: '18px 14px',
                textAlign: 'center',
                cursor: 'pointer',
                background: 'rgba(255,255,255,0.03)',
                transition: 'all 0.3s',
            }}
            onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = accept;
                input.onchange = (e) => {
                    const target = e.target as HTMLInputElement;
                    onChange(target.files?.[0] ?? null);
                };
                input.click();
            }}
        >
            {file ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <span style={{ color: CIM.accent, fontSize: '1.1rem' }}>✓</span>
                    <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>{file.name}</span>
                </div>
            ) : (
                <div>
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>
                        Click to upload image
                    </span>
                </div>
            )}
        </div>
    );
}
