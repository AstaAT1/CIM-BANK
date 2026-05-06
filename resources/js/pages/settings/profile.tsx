import { Form, Head, Link, router, usePage } from '@inertiajs/react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import DeleteUser from '@/components/delete-user';
import { FlippableCreditCard } from '@/components/FlippableCreditCard';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { edit } from '@/routes/profile';
import { send } from '@/routes/verification';
import { useState } from 'react';

const CIM = { primary: '#082F54', secondary: '#0A6474', accent: '#D4A23C', dark: '#061F39', bg: '#F7F8FA', white: '#FFFFFF', border: '#D1D9DA' };

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
    requestData: { request_number: string; status: string; branch_name: string | null; submitted_at: string | null } | null;
    appointmentData: { scheduled_at: string | null; status: string } | null;
    bankAccountData: { account_number: string; status: string } | null;
    cardData: { card_holder_name: string; masked_card_number: string; expiry_date: string; status: string } | null;
};

export default function Profile({ mustVerifyEmail, status, profileData, requestData, appointmentData, bankAccountData, cardData }: ProfileProps) {
    const { auth } = usePage().props;
    const [editMode, setEditMode] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [password, setPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [confirmProcessing, setConfirmProcessing] = useState(false);

    const handleConfirmPassword = (e: React.FormEvent) => {
        e.preventDefault();
        setConfirmProcessing(true);
        router.post('/settings/profile/confirm-password', { password }, {
            onSuccess: () => {
                setEditMode(true);
                setShowPasswordModal(false);
                setPassword('');
                setPasswordError('');
            },
            onError: (errs) => setPasswordError((errs as Record<string, string>).password || 'Incorrect password.'),
            onFinish: () => setConfirmProcessing(false),
        });
    };

    const formatDate = (iso: string | null) => {
        if (!iso) return '—';
        return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };
    const formatDateTime = (iso: string | null) => {
        if (!iso) return '—';
        return new Date(iso).toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <>
            <Head title="Profile settings" />
            <h1 className="sr-only">Profile settings</h1>

            {/* ── Bank Card Section ── */}
            <Section icon={<CardIcon />} title="Your Card" subtitle={cardData ? 'Hover to reveal the back side' : 'No card issued yet'}>
                {cardData ? (
                    <div className="flex justify-center sm:justify-start">
                        <FlippableCreditCard
                            cardholderName={cardData.card_holder_name.toUpperCase()}
                            cardNumber={cardData.masked_card_number}
                            expiryDate={cardData.expiry_date}
                            cvv="***"
                        />
                    </div>
                ) : (
                    <div className="rounded-lg border p-6 text-center" style={{ borderColor: CIM.border, background: CIM.bg }}>
                        <p className="text-sm" style={{ color: CIM.secondary }}>
                            Your bank card will be generated after your account is verified and activated.
                        </p>
                    </div>
                )}
                {cardData && (
                    <div className="mt-4 flex flex-wrap gap-3">
                        <StatusPill label="Card Status" value={cardData.status} />
                    </div>
                )}
            </Section>

            {/* ── Personal Details (read-only) ── */}
            <Section icon={<UserIcon />} title="Personal Details" subtitle="Information from your onboarding application">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <DetailRow label="Full Name" value={(auth as { user: { name: string } }).user.name} />
                    <DetailRow label="Email" value={(auth as { user: { email: string } }).user.email} />
                    <DetailRow label="Phone" value={profileData?.phone || '—'} />
                    <DetailRow label="Date of Birth" value={formatDate(profileData?.date_of_birth ?? null)} />
                    <DetailRow label="Address" value={profileData?.address || '—'} />
                    <DetailRow label="CIN Number" value={profileData?.cin || '—'} />
                    <DetailRow label="Profession" value={profileData?.profession || '—'} />
                    <DetailRow label="Verification Status" value={profileData?.verification_status || 'none'} isStatus />
                </div>
            </Section>

            {/* ── Request & Appointment Status ── */}
            <Section icon={<ClipboardIcon />} title="Request & Appointment" subtitle="Status of your account opening request">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <DetailRow label="Request #" value={requestData?.request_number || '—'} />
                    <DetailRow label="Request Status" value={requestData?.status || '—'} isStatus />
                    <DetailRow label="Branch" value={requestData?.branch_name || '—'} />
                    <DetailRow label="Submitted" value={formatDateTime(requestData?.submitted_at ?? null)} />
                    <DetailRow label="Appointment" value={formatDateTime(appointmentData?.scheduled_at ?? null)} />
                    <DetailRow label="Appointment Status" value={appointmentData?.status || '—'} isStatus />
                    <DetailRow label="Bank Account" value={bankAccountData?.account_number || 'Not yet created'} />
                    <DetailRow label="Account Status" value={bankAccountData?.status || '—'} isStatus />
                </div>
            </Section>

            {/* ── Editable Profile (password-protected) ── */}
            <Section icon={<EditIcon />} title="Edit Profile" subtitle={editMode ? 'Edit your name and email' : 'Confirm your password to make changes'}>
                {!editMode ? (
                    <div className="text-center">
                        <button
                            onClick={() => setShowPasswordModal(true)}
                            className="rounded-lg px-6 py-3 text-sm font-semibold text-white transition-all hover:opacity-90"
                            style={{ background: `linear-gradient(135deg, ${CIM.primary}, ${CIM.secondary})` }}
                        >
                            🔒 Unlock Edit Mode
                        </button>
                    </div>
                ) : (
                    <Form {...ProfileController.update.form()} options={{ preserveScroll: true }} className="space-y-5">
                        {({ processing, errors }) => (
                            <>
                                <div className="grid gap-2">
                                    <Label htmlFor="name" className="font-medium" style={{ color: CIM.dark }}>Name</Label>
                                    <Input id="name" className="mt-1 block w-full rounded-lg border" style={{ borderColor: CIM.border }}
                                        defaultValue={(auth as { user: { name: string } }).user.name} name="name" required autoComplete="name" placeholder="Full name" />
                                    <InputError className="mt-2" message={errors.name} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="email" className="font-medium" style={{ color: CIM.dark }}>Email address</Label>
                                    <Input id="email" type="email" className="mt-1 block w-full rounded-lg border" style={{ borderColor: CIM.border }}
                                        defaultValue={(auth as { user: { email: string } }).user.email} name="email" required autoComplete="username" placeholder="Email address" />
                                    <InputError className="mt-2" message={errors.email} />
                                </div>
                                {mustVerifyEmail && (auth as { user: { email_verified_at: string | null } }).user.email_verified_at === null && (
                                    <div>
                                        <p className="text-sm" style={{ color: CIM.secondary }}>
                                            Your email address is unverified.{' '}
                                            <Link href={send()} as="button" className="underline" style={{ color: CIM.primary }}>Resend verification email.</Link>
                                        </p>
                                        {status === 'verification-link-sent' && <div className="mt-2 text-sm font-medium text-green-600">A new verification link has been sent.</div>}
                                    </div>
                                )}
                                {errors.password && <InputError message={errors.password} />}
                                <div className="flex items-center gap-4">
                                    <Button disabled={processing} data-test="update-profile-button" className="rounded-lg px-6 font-medium text-white" style={{ backgroundColor: CIM.primary }}>
                                        Save Changes
                                    </Button>
                                    <button type="button" onClick={() => setEditMode(false)} className="text-sm" style={{ color: CIM.secondary }}>Cancel</button>
                                </div>
                            </>
                        )}
                    </Form>
                )}
            </Section>

            <DeleteUser />

            {/* ── Password Confirmation Modal ── */}
            {showPasswordModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowPasswordModal(false)}>
                    <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <h3 className="mb-2 text-lg font-semibold" style={{ color: CIM.primary }}>Confirm Your Password</h3>
                        <p className="mb-6 text-sm" style={{ color: CIM.secondary }}>Enter your current password to unlock profile editing.</p>
                        <form onSubmit={handleConfirmPassword}>
                            <input type="password" value={password} onChange={(e) => { setPassword(e.target.value); setPasswordError(''); }}
                                placeholder="Current password" autoFocus
                                className="mb-2 w-full rounded-lg border px-4 py-3 text-sm outline-none transition-colors focus:ring-2"
                                style={{ borderColor: passwordError ? '#e53e3e' : CIM.border }} />
                            {passwordError && <p className="mb-3 text-sm text-red-600">{passwordError}</p>}
                            <div className="flex gap-3 mt-4">
                                <button type="submit" disabled={confirmProcessing || !password}
                                    className="flex-1 rounded-lg px-4 py-3 text-sm font-semibold text-white transition-all"
                                    style={{ background: `linear-gradient(135deg, ${CIM.primary}, ${CIM.secondary})`, opacity: confirmProcessing ? 0.6 : 1 }}>
                                    {confirmProcessing ? 'Verifying...' : 'Confirm'}
                                </button>
                                <button type="button" onClick={() => setShowPasswordModal(false)}
                                    className="rounded-lg border px-4 py-3 text-sm" style={{ borderColor: CIM.border, color: CIM.secondary }}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

Profile.layout = { breadcrumbs: [{ title: 'Profile settings', href: edit() }] };

/* ── Helper Components ── */
function Section({ icon, title, subtitle, children }: { icon: React.ReactNode; title: string; subtitle: string; children: React.ReactNode }) {
    return (
        <div className="rounded-xl border p-6 shadow-sm" style={{ backgroundColor: CIM.white, borderColor: CIM.border }}>
            <div className="mb-5 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: `${CIM.primary}14` }}>{icon}</div>
                <div>
                    <h2 className="text-base font-semibold" style={{ color: CIM.primary }}>{title}</h2>
                    <p className="text-sm" style={{ color: CIM.secondary }}>{subtitle}</p>
                </div>
            </div>
            {children}
        </div>
    );
}

function DetailRow({ label, value, isStatus }: { label: string; value: string; isStatus?: boolean }) {
    return (
        <div className="rounded-lg border px-4 py-3" style={{ borderColor: `${CIM.border}80`, background: CIM.bg }}>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: CIM.secondary, letterSpacing: '0.06em' }}>{label}</p>
            {isStatus ? <StatusPill label="" value={value} /> : <p className="mt-1 text-sm font-medium" style={{ color: CIM.dark }}>{value}</p>}
        </div>
    );
}

function StatusPill({ label, value }: { label: string; value: string }) {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
        active: { bg: '#d1fae5', text: '#065f46', border: '#6ee7b7' },
        verified: { bg: '#d1fae5', text: '#065f46', border: '#6ee7b7' },
        approved: { bg: '#d1fae5', text: '#065f46', border: '#6ee7b7' },
        account_created: { bg: '#d1fae5', text: '#065f46', border: '#6ee7b7' },
        completed: { bg: '#d1fae5', text: '#065f46', border: '#6ee7b7' },
        pending: { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' },
        submitted: { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' },
        appointment_scheduled: { bg: '#e0e7ff', text: '#3730a3', border: '#a5b4fc' },
        scheduled: { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' },
        under_review: { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' },
        rejected: { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' },
        blocked: { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' },
        none: { bg: '#f3f4f6', text: '#6b7280', border: '#d1d5db' },
    };
    const c = colors[value] || colors.none;
    return (
        <span className="mt-1 inline-block rounded-full px-3 py-1 text-xs font-semibold capitalize"
            style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
            {label ? `${label}: ` : ''}{value.replace(/_/g, ' ')}
        </span>
    );
}

function CardIcon() { return <svg className="h-5 w-5" style={{ color: CIM.primary }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6.75v10.5a2.25 2.25 0 002.25 2.25z" /></svg>; }
function UserIcon() { return <svg className="h-5 w-5" style={{ color: CIM.primary }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>; }
function ClipboardIcon() { return <svg className="h-5 w-5" style={{ color: CIM.primary }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>; }
function EditIcon() { return <svg className="h-5 w-5" style={{ color: CIM.primary }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zM16.862 4.487L19.5 7.125" /></svg>; }
