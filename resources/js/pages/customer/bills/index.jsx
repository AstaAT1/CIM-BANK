import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    CalendarClock,
    CheckCircle2,
    Clock3,
    CreditCard,
    History,
    Pencil,
    Plus,
    ReceiptText,
    ShieldCheck,
    Trash2,
    Zap,
} from 'lucide-react';
import { useMemo, useState } from 'react';

const CIM = {
    primary: '#082F54',
    secondary: '#0A6474',
    accent: '#D4A23C',
    dark: '#061F39',
    background: '#F7F8FA',
    white: '#FFFFFF',
    border: '#D1D9DA',
};

const categoryLabels = {
    electricity: 'Electricity',
    internet: 'Internet',
    other: 'Other',
    phone: 'Phone',
    school: 'School',
    subscription: 'Subscription',
    water: 'Water',
};

const frequencyLabels = {
    monthly: 'Monthly',
    one_time: 'One time',
    weekly: 'Weekly',
};

function formatCurrency(amount, currency = 'MAD') {
    return new Intl.NumberFormat('en-MA', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number(amount || 0));
}

function formatDateTime(value) {
    if (!value) {
        return 'Not scheduled';
    }

    return new Intl.DateTimeFormat('en-MA', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value));
}

function fieldDateValue(value) {
    if (!value) {
        return '';
    }

    const date = new Date(value);
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());

    return date.toISOString().slice(0, 16);
}

function titleCase(value) {
    return String(value || 'unknown')
        .replaceAll('_', ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function StatusBadge({ status }) {
    const styles = {
        active: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        cancelled: 'border-slate-200 bg-slate-50 text-slate-600',
        completed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        failed: 'border-rose-200 bg-rose-50 text-rose-700',
        paid: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        paused: 'border-amber-200 bg-amber-50 text-amber-700',
        skipped: 'border-amber-200 bg-amber-50 text-amber-700',
    };

    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[status] ?? 'border-slate-200 bg-white text-slate-600'}`}>
            <CheckCircle2 className="h-3.5 w-3.5" />
            {titleCase(status)}
        </span>
    );
}

function FieldError({ message }) {
    return message ? <p className="mt-1 text-sm text-rose-600">{message}</p> : null;
}

export default function BillsCenter({
    accounts = [],
    bills = [],
    overview = {},
    paymentHistory = [],
    categories = [],
    frequencies = [],
}) {
    const { props } = usePage();
    const flash = props.flash || {};
    const [editingBill, setEditingBill] = useState(null);
    const [historyBill, setHistoryBill] = useState(null);

    const defaultAccountId = accounts[0]?.id ? String(accounts[0].id) : '';
    const form = useForm({
        bank_account_id: defaultAccountId,
        label: '',
        category: 'internet',
        provider_name: '',
        reference_number: '',
        amount: '',
        frequency: 'monthly',
        next_due_at: fieldDateValue(new Date()),
        autopay_enabled: false,
        minimum_balance_after_payment: '300',
    });

    const upcomingBills = useMemo(
        () =>
            bills
                .filter((bill) => bill.status === 'active')
                .sort((a, b) => new Date(a.next_due_at) - new Date(b.next_due_at))
                .slice(0, 4),
        [bills],
    );

    const selectedAccount = accounts.find((account) => String(account.id) === String(form.data.bank_account_id));

    const resetForm = () => {
        setEditingBill(null);
        form.setData({
            bank_account_id: defaultAccountId,
            label: '',
            category: 'internet',
            provider_name: '',
            reference_number: '',
            amount: '',
            frequency: 'monthly',
            next_due_at: fieldDateValue(new Date()),
            autopay_enabled: false,
            minimum_balance_after_payment: '300',
        });
        form.clearErrors();
    };

    const editBill = (bill) => {
        setEditingBill(bill);
        form.setData({
            bank_account_id: String(bill.bank_account_id),
            label: bill.label,
            category: bill.category,
            provider_name: bill.provider_name,
            reference_number: bill.reference_number,
            amount: String(bill.amount),
            frequency: bill.frequency,
            next_due_at: fieldDateValue(bill.next_due_at),
            autopay_enabled: Boolean(bill.autopay_enabled),
            minimum_balance_after_payment: String(bill.minimum_balance_after_payment ?? 0),
        });
        form.clearErrors();
    };

    const submit = (event) => {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: resetForm,
        };

        if (editingBill) {
            form.patch(`/backend/customer/bills/${editingBill.id}`, options);
            return;
        }

        form.post('/backend/customer/bills', options);
    };

    const payNow = (bill) => {
        router.post(`/backend/customer/bills/${bill.id}/pay-now`, {}, { preserveScroll: true });
    };

    const toggleAutopay = (bill) => {
        router.patch(`/backend/customer/bills/${bill.id}/toggle-autopay`, {}, { preserveScroll: true });
    };

    const deleteBill = (bill) => {
        router.delete(`/backend/customer/bills/${bill.id}`, { preserveScroll: true });
    };

    return (
        <>
            <Head title="Bills & AutoPay" />

            <main className="min-h-full bg-[#F7F8FA] px-4 py-6 text-[#061F39] sm:px-6 lg:px-8">
                <div className="mx-auto flex max-w-7xl flex-col gap-6">
                    <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
                        <div>
                            <p className="text-sm font-semibold text-[#0A6474]">
                                Mizan AutoPay
                            </p>
                            <h1 className="mt-1 text-3xl font-semibold">
                                Bills & AutoPay
                            </h1>
                            <p className="mt-2 max-w-2xl text-sm text-slate-500">
                                Manage internal demo providers, pay bills, and schedule protected recurring payments.
                            </p>
                        </div>
                        <Link
                            href="/dashboard"
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[#D1D9DA] bg-white px-4 text-sm font-semibold text-[#082F54] transition hover:border-[#D4A23C]"
                        >
                            <ReceiptText className="h-4 w-4" />
                            Back to dashboard
                        </Link>
                    </section>

                    {flash.success ? (
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                            {flash.success}
                        </div>
                    ) : null}
                    {props.errors?.bill ? (
                        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                            {props.errors.bill}
                        </div>
                    ) : null}

                    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                        {[
                            ['Total bills', overview.total_bills ?? 0, ReceiptText],
                            ['Upcoming', overview.upcoming_bills ?? 0, CalendarClock],
                            ['AutoPay active', overview.autopay_active ?? 0, ShieldCheck],
                            ['Paid this month', overview.paid_this_month ?? 0, CheckCircle2],
                            ['Failed / skipped', overview.failed_or_skipped ?? 0, AlertTriangle],
                        ].map(([label, value, Icon]) => (
                            <div key={label} className="rounded-lg border border-[#D1D9DA] bg-white p-4 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-slate-500">{label}</p>
                                    <Icon className="h-5 w-5 text-[#0A6474]" />
                                </div>
                                <p className="mt-3 text-3xl font-semibold">{value}</p>
                            </div>
                        ))}
                    </section>

                    <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
                        <form onSubmit={submit} className="rounded-lg border border-[#D1D9DA] bg-white p-5 shadow-sm">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-lg font-semibold">
                                        {editingBill ? 'Edit bill' : 'Add bill / subscription'}
                                    </h2>
                                    <p className="text-sm text-slate-500">
                                        Demo providers only. No external provider API is called.
                                    </p>
                                </div>
                                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#082F54] text-white">
                                    <Plus className="h-5 w-5" />
                                </span>
                            </div>

                            <div className="mt-5 grid gap-4 sm:grid-cols-2">
                                <label className="block">
                                    <span className="text-sm font-semibold">Bill label</span>
                                    <input
                                        value={form.data.label}
                                        onChange={(event) => form.setData('label', event.target.value)}
                                        placeholder="Home WiFi"
                                        className="mt-1 h-11 w-full rounded-md border border-[#D1D9DA] px-3 text-sm outline-none transition focus:border-[#0A6474] focus:ring-2 focus:ring-[#0A6474]/15"
                                    />
                                    <FieldError message={form.errors.label} />
                                </label>

                                <label className="block">
                                    <span className="text-sm font-semibold">Provider name</span>
                                    <input
                                        value={form.data.provider_name}
                                        onChange={(event) => form.setData('provider_name', event.target.value)}
                                        placeholder="Inwi, Orange, Lydec, School"
                                        className="mt-1 h-11 w-full rounded-md border border-[#D1D9DA] px-3 text-sm outline-none transition focus:border-[#0A6474] focus:ring-2 focus:ring-[#0A6474]/15"
                                    />
                                    <FieldError message={form.errors.provider_name} />
                                </label>

                                <label className="block">
                                    <span className="text-sm font-semibold">Category</span>
                                    <select
                                        value={form.data.category}
                                        onChange={(event) => form.setData('category', event.target.value)}
                                        className="mt-1 h-11 w-full rounded-md border border-[#D1D9DA] bg-white px-3 text-sm outline-none transition focus:border-[#0A6474] focus:ring-2 focus:ring-[#0A6474]/15"
                                    >
                                        {categories.map((category) => (
                                            <option key={category} value={category}>
                                                {categoryLabels[category] || titleCase(category)}
                                            </option>
                                        ))}
                                    </select>
                                    <FieldError message={form.errors.category} />
                                </label>

                                <label className="block">
                                    <span className="text-sm font-semibold">Reference number</span>
                                    <input
                                        value={form.data.reference_number}
                                        onChange={(event) => form.setData('reference_number', event.target.value)}
                                        placeholder="INV-2026-001"
                                        className="mt-1 h-11 w-full rounded-md border border-[#D1D9DA] px-3 text-sm outline-none transition focus:border-[#0A6474] focus:ring-2 focus:ring-[#0A6474]/15"
                                    />
                                    <FieldError message={form.errors.reference_number} />
                                </label>

                                <label className="block">
                                    <span className="text-sm font-semibold">Account</span>
                                    <select
                                        value={form.data.bank_account_id}
                                        onChange={(event) => form.setData('bank_account_id', event.target.value)}
                                        className="mt-1 h-11 w-full rounded-md border border-[#D1D9DA] bg-white px-3 text-sm outline-none transition focus:border-[#0A6474] focus:ring-2 focus:ring-[#0A6474]/15"
                                    >
                                        {accounts.map((account) => (
                                            <option key={account.id} value={account.id}>
                                                {account.account_number} - {formatCurrency(account.balance, account.currency)}
                                            </option>
                                        ))}
                                    </select>
                                    <FieldError message={form.errors.bank_account_id} />
                                </label>

                                <label className="block">
                                    <span className="text-sm font-semibold">Amount</span>
                                    <input
                                        type="number"
                                        min="0.01"
                                        step="0.01"
                                        value={form.data.amount}
                                        onChange={(event) => form.setData('amount', event.target.value)}
                                        placeholder="0.00"
                                        className="mt-1 h-11 w-full rounded-md border border-[#D1D9DA] px-3 text-sm outline-none transition focus:border-[#0A6474] focus:ring-2 focus:ring-[#0A6474]/15"
                                    />
                                    <FieldError message={form.errors.amount} />
                                </label>

                                <label className="block">
                                    <span className="text-sm font-semibold">Frequency</span>
                                    <select
                                        value={form.data.frequency}
                                        onChange={(event) => form.setData('frequency', event.target.value)}
                                        className="mt-1 h-11 w-full rounded-md border border-[#D1D9DA] bg-white px-3 text-sm outline-none transition focus:border-[#0A6474] focus:ring-2 focus:ring-[#0A6474]/15"
                                    >
                                        {frequencies.map((frequency) => (
                                            <option key={frequency} value={frequency}>
                                                {frequencyLabels[frequency] || titleCase(frequency)}
                                            </option>
                                        ))}
                                    </select>
                                    <FieldError message={form.errors.frequency} />
                                </label>

                                <label className="block">
                                    <span className="text-sm font-semibold">Next due date</span>
                                    <input
                                        type="datetime-local"
                                        value={form.data.next_due_at}
                                        onChange={(event) => form.setData('next_due_at', event.target.value)}
                                        className="mt-1 h-11 w-full rounded-md border border-[#D1D9DA] px-3 text-sm outline-none transition focus:border-[#0A6474] focus:ring-2 focus:ring-[#0A6474]/15"
                                    />
                                    <FieldError message={form.errors.next_due_at} />
                                </label>

                                <label className="block">
                                    <span className="text-sm font-semibold">Minimum balance after payment</span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={form.data.minimum_balance_after_payment}
                                        onChange={(event) => form.setData('minimum_balance_after_payment', event.target.value)}
                                        className="mt-1 h-11 w-full rounded-md border border-[#D1D9DA] px-3 text-sm outline-none transition focus:border-[#0A6474] focus:ring-2 focus:ring-[#0A6474]/15"
                                    />
                                    <FieldError message={form.errors.minimum_balance_after_payment} />
                                </label>

                                <label className="flex items-center justify-between gap-3 rounded-lg border border-[#D1D9DA] bg-[#F7F8FA] px-4 py-3">
                                    <span>
                                        <span className="block text-sm font-semibold">AutoPay enabled</span>
                                        <span className="text-xs text-slate-500">Reminder is sent before automatic payment.</span>
                                    </span>
                                    <input
                                        type="checkbox"
                                        checked={form.data.autopay_enabled}
                                        onChange={(event) => form.setData('autopay_enabled', event.target.checked)}
                                        className="h-5 w-5 rounded border-[#D1D9DA] text-[#082F54] focus:ring-[#0A6474]"
                                    />
                                </label>
                            </div>

                            {selectedAccount ? (
                                <div className="mt-4 rounded-lg border border-[#D4A23C]/40 bg-[#D4A23C]/10 p-3 text-sm text-[#061F39]">
                                    Selected balance: {formatCurrency(selectedAccount.balance, selectedAccount.currency)}. AutoPay will skip if the protected minimum would be breached.
                                </div>
                            ) : null}

                            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                                <button
                                    type="submit"
                                    disabled={form.processing || !accounts.length}
                                    className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-md bg-[#082F54] px-4 text-sm font-semibold text-white transition hover:bg-[#061F39] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <ReceiptText className="h-4 w-4" />
                                    {editingBill ? 'Save bill' : 'Add bill'}
                                </button>
                                {editingBill ? (
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="inline-flex h-11 items-center justify-center rounded-md border border-[#D1D9DA] bg-white px-4 text-sm font-semibold text-[#082F54] transition hover:border-[#D4A23C]"
                                    >
                                        Cancel edit
                                    </button>
                                ) : null}
                            </div>
                        </form>

                        <section className="rounded-lg border border-[#D1D9DA] bg-white p-5 shadow-sm">
                            <div className="mb-4 flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-semibold">Upcoming payment timeline</h2>
                                    <p className="text-sm text-slate-500">Next active bills by due date.</p>
                                </div>
                                <Clock3 className="h-5 w-5 text-[#0A6474]" />
                            </div>
                            <div className="space-y-3">
                                {upcomingBills.length ? upcomingBills.map((bill) => (
                                    <article key={bill.id} className="rounded-lg border border-[#D1D9DA] bg-[#F7F8FA] p-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <p className="font-semibold">{bill.label}</p>
                                                <p className="mt-1 text-sm text-slate-500">{bill.provider_name} - {formatDateTime(bill.next_due_at)}</p>
                                            </div>
                                            <p className="font-semibold text-[#082F54]">{formatCurrency(bill.amount)}</p>
                                        </div>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            <StatusBadge status={bill.autopay_enabled ? 'active' : 'paused'} />
                                            <span className="rounded-full border border-[#D1D9DA] bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">
                                                {frequencyLabels[bill.frequency] || titleCase(bill.frequency)}
                                            </span>
                                        </div>
                                    </article>
                                )) : (
                                    <div className="rounded-lg border border-dashed border-[#D1D9DA] px-6 py-10 text-center">
                                        <ReceiptText className="mx-auto mb-3 h-8 w-8 text-[#0A6474]" />
                                        <h3 className="font-semibold">No upcoming bills</h3>
                                        <p className="mt-1 text-sm text-slate-500">Add a bill to start tracking due dates.</p>
                                    </div>
                                )}
                            </div>
                        </section>
                    </section>

                    <section className="grid gap-4 xl:grid-cols-2">
                        {bills.map((bill) => (
                            <article key={bill.id} className="rounded-lg border border-[#D1D9DA] bg-white p-5 shadow-sm">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h2 className="text-lg font-semibold">{bill.label}</h2>
                                            <StatusBadge status={bill.status} />
                                        </div>
                                        <p className="mt-1 text-sm text-slate-500">
                                            {bill.provider_name} - {categoryLabels[bill.category] || titleCase(bill.category)} - Ref {bill.reference_number}
                                        </p>
                                    </div>
                                    <div className="text-left sm:text-right">
                                        <p className="text-2xl font-semibold text-[#082F54]">{formatCurrency(bill.amount)}</p>
                                        <p className="text-sm text-slate-500">Due {formatDateTime(bill.next_due_at)}</p>
                                    </div>
                                </div>

                                <div className="mt-4 grid gap-3 sm:grid-cols-4">
                                    <div className="rounded-lg bg-[#F7F8FA] p-3">
                                        <p className="text-xs text-slate-500">Frequency</p>
                                        <p className="mt-1 text-sm font-semibold">{frequencyLabels[bill.frequency] || titleCase(bill.frequency)}</p>
                                    </div>
                                    <div className="rounded-lg bg-[#F7F8FA] p-3">
                                        <p className="text-xs text-slate-500">AutoPay</p>
                                        <p className="mt-1 text-sm font-semibold">{bill.autopay_enabled ? 'On' : 'Off'}</p>
                                    </div>
                                    <div className="rounded-lg bg-[#F7F8FA] p-3">
                                        <p className="text-xs text-slate-500">Reminder</p>
                                        <p className="mt-1 text-sm font-semibold">{bill.reminder_sent_at ? 'Sent' : 'Pending'}</p>
                                    </div>
                                    <div className="rounded-lg bg-[#F7F8FA] p-3">
                                        <p className="text-xs text-slate-500">Last payment</p>
                                        <p className="mt-1 text-sm font-semibold">{bill.last_payment_status ? titleCase(bill.last_payment_status) : 'None'}</p>
                                    </div>
                                </div>

                                {Number(bill.amount) + Number(bill.minimum_balance_after_payment) > Number(accounts.find((account) => account.id === bill.bank_account_id)?.balance ?? 0) ? (
                                    <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                                        <AlertTriangle className="mt-0.5 h-4 w-4" />
                                        <span>Balance may be too low after applying the protected minimum.</span>
                                    </div>
                                ) : null}

                                <div className="mt-4 flex flex-wrap gap-2">
                                    <button type="button" onClick={() => payNow(bill)} disabled={bill.status !== 'active'} className="inline-flex h-10 items-center gap-2 rounded-md bg-[#082F54] px-3 text-sm font-semibold text-white transition hover:bg-[#061F39] disabled:cursor-not-allowed disabled:opacity-50">
                                        <CreditCard className="h-4 w-4" />
                                        Pay now
                                    </button>
                                    <button type="button" onClick={() => toggleAutopay(bill)} disabled={bill.status !== 'active'} className="inline-flex h-10 items-center gap-2 rounded-md border border-[#D1D9DA] bg-white px-3 text-sm font-semibold text-[#082F54] transition hover:border-[#D4A23C] disabled:cursor-not-allowed disabled:opacity-50">
                                        <Zap className="h-4 w-4" />
                                        {bill.autopay_enabled ? 'Disable AutoPay' : 'Enable AutoPay'}
                                    </button>
                                    <button type="button" onClick={() => editBill(bill)} className="inline-flex h-10 items-center gap-2 rounded-md border border-[#D1D9DA] bg-white px-3 text-sm font-semibold text-[#082F54] transition hover:border-[#D4A23C]">
                                        <Pencil className="h-4 w-4" />
                                        Edit
                                    </button>
                                    <button type="button" onClick={() => setHistoryBill(historyBill?.id === bill.id ? null : bill)} className="inline-flex h-10 items-center gap-2 rounded-md border border-[#D1D9DA] bg-white px-3 text-sm font-semibold text-[#082F54] transition hover:border-[#D4A23C]">
                                        <History className="h-4 w-4" />
                                        History
                                    </button>
                                    <button type="button" onClick={() => deleteBill(bill)} className="inline-flex h-10 items-center gap-2 rounded-md border border-rose-200 bg-white px-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-50">
                                        <Trash2 className="h-4 w-4" />
                                        Delete / cancel
                                    </button>
                                </div>

                                {historyBill?.id === bill.id ? (
                                    <div className="mt-4 divide-y divide-[#D1D9DA] rounded-lg border border-[#D1D9DA]">
                                        {bill.payments.length ? bill.payments.map((payment) => (
                                            <div key={payment.id} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
                                                <div>
                                                    <p className="font-semibold">{payment.reference}</p>
                                                    <p className="text-sm text-slate-500">{payment.failure_reason || formatDateTime(payment.paid_at || payment.created_at)}</p>
                                                </div>
                                                <div className="flex items-center justify-between gap-3 sm:justify-end">
                                                    <p className="font-semibold">{formatCurrency(payment.amount)}</p>
                                                    <StatusBadge status={payment.status} />
                                                </div>
                                            </div>
                                        )) : (
                                            <p className="p-3 text-sm text-slate-500">No payments yet.</p>
                                        )}
                                    </div>
                                ) : null}
                            </article>
                        ))}
                    </section>

                    <section className="rounded-lg border border-[#D1D9DA] bg-white p-5 shadow-sm">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-semibold">Payment history</h2>
                            <History className="h-5 w-5 text-[#0A6474]" />
                        </div>
                        <div className="divide-y divide-[#D1D9DA]">
                            {paymentHistory.length ? paymentHistory.map((payment) => (
                                <div key={payment.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <p className="font-semibold">{payment.bill_label}</p>
                                        <p className="text-sm text-slate-500">{payment.provider_name} - {payment.reference}</p>
                                    </div>
                                    <div className="flex items-center justify-between gap-4 sm:justify-end">
                                        <p className="font-semibold">{formatCurrency(payment.amount)}</p>
                                        <StatusBadge status={payment.status} />
                                    </div>
                                </div>
                            )) : (
                                <div className="rounded-lg border border-dashed border-[#D1D9DA] px-6 py-10 text-center">
                                    <ReceiptText className="mx-auto mb-3 h-8 w-8 text-[#0A6474]" />
                                    <h3 className="font-semibold">No bill payments yet</h3>
                                    <p className="mt-1 text-sm text-slate-500">Manual and AutoPay receipts will appear here.</p>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </main>
        </>
    );
}
