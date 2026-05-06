import { Head, Link, useForm, usePage } from '@inertiajs/react';
import {
    ArrowDownLeft,
    ArrowUpRight,
    CheckCircle2,
    CircleAlert,
    Landmark,
    ReceiptText,
    Send,
    ShieldCheck,
} from 'lucide-react';
import { useMemo, useState } from 'react';

function formatCurrency(amount, currency = 'MAD') {
    return new Intl.NumberFormat('en-MA', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number(amount || 0));
}

function formatDate(value) {
    if (!value) return 'Pending';

    return new Intl.DateTimeFormat('en-MA', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value));
}

function titleCase(value) {
    return String(value || 'unknown')
        .replaceAll('_', ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function FieldError({ message }) {
    return message ? <p className="mt-1 text-sm text-rose-600">{message}</p> : null;
}

function StatusBadge({ status }) {
    const styles = {
        completed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        active: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        pending: 'border-amber-200 bg-amber-50 text-amber-700',
        rejected: 'border-rose-200 bg-rose-50 text-rose-700',
        failed: 'border-rose-200 bg-rose-50 text-rose-700',
    };

    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${styles[status] ?? 'border-slate-200 bg-white text-slate-600'}`}>
            <CheckCircle2 className="h-3.5 w-3.5" />
            {titleCase(status)}
        </span>
    );
}

export default function Transfers({
    accounts = [],
    beneficiaries = [],
    recentTransfers = [],
}) {
    const { props } = usePage();
    const flash = props.flash || {};
    const activeBeneficiaries = beneficiaries.filter((beneficiary) => beneficiary.transfers_available);
    const queryPrefill = useMemo(() => {
        if (typeof window === 'undefined') {
            return { amount: '', beneficiaryId: '' };
        }

        const params = new URLSearchParams(window.location.search);
        const amount = params.get('amount') || '';
        const beneficiaryName = (params.get('beneficiary') || '').toLowerCase().trim();
        const matchedBeneficiary = beneficiaryName
            ? activeBeneficiaries.find((beneficiary) =>
                  String(beneficiary.full_name || '').toLowerCase().includes(beneficiaryName),
              )
            : null;

        return {
            amount: /^\d+(\.\d{1,2})?$/.test(amount) ? amount : '',
            beneficiaryId: matchedBeneficiary?.id ? String(matchedBeneficiary.id) : '',
        };
    }, [activeBeneficiaries]);
    const [confirming, setConfirming] = useState(false);

    const form = useForm({
        from_account_id: accounts[0]?.id ? String(accounts[0].id) : '',
        beneficiary_id: queryPrefill.beneficiaryId || (activeBeneficiaries[0]?.id ? String(activeBeneficiaries[0].id) : ''),
        amount: queryPrefill.amount,
        note: '',
    });

    const selectedAccount = useMemo(
        () => accounts.find((account) => String(account.id) === String(form.data.from_account_id)),
        [accounts, form.data.from_account_id],
    );

    const selectedBeneficiary = useMemo(
        () => beneficiaries.find((beneficiary) => String(beneficiary.id) === String(form.data.beneficiary_id)),
        [beneficiaries, form.data.beneficiary_id],
    );

    const amount = Number(form.data.amount || 0);
    const balanceAfter = selectedAccount ? Number(selectedAccount.balance) - amount : 0;

    const submit = (event) => {
        event.preventDefault();

        if (!confirming) {
            setConfirming(true);
            return;
        }

        form.post('/backend/customer/transfers', {
            preserveScroll: true,
            onSuccess: () => {
                form.reset('amount', 'note');
                setConfirming(false);
            },
            onError: () => setConfirming(false),
        });
    };

    return (
        <>
            <Head title="Transfers" />

            <main className="min-h-full bg-[#F7F8FA] px-4 py-6 text-[#061F39] sm:px-6 lg:px-8">
                <div className="mx-auto flex max-w-7xl flex-col gap-6">
                    <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
                        <div>
                            <p className="text-sm font-semibold text-[#0A6474]">
                                Secure internal transfer
                            </p>
                            <h1 className="mt-1 text-3xl font-semibold">
                                Transfer Money
                            </h1>
                            <p className="mt-2 max-w-2xl text-sm text-slate-500">
                                Send MAD instantly to verified CIM beneficiaries.
                            </p>
                        </div>
                        <Link
                            href="/customer/beneficiaries"
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[#D1D9DA] bg-white px-4 text-sm font-semibold text-[#082F54] transition hover:border-[#D4A23C]"
                        >
                            <ShieldCheck className="h-4 w-4" />
                            Manage beneficiaries
                        </Link>
                    </section>

                    {flash.success ? (
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                            {flash.success}
                        </div>
                    ) : null}

                    {queryPrefill.amount || queryPrefill.beneficiaryId ? (
                        <div className="rounded-lg border border-[#D4A23C]/50 bg-[#D4A23C]/10 px-4 py-3 text-sm font-semibold text-[#061F39]">
                            This transfer was prefilled for review. It will not be sent until you click Confirm transfer.
                        </div>
                    ) : null}

                    <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
                        <form
                            onSubmit={submit}
                            className="rounded-lg border border-[#D1D9DA] bg-white p-5 shadow-sm"
                        >
                            <div className="flex items-center gap-3">
                                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#082F54] text-white">
                                    <Send className="h-5 w-5" />
                                </span>
                                <div>
                                    <h2 className="text-lg font-semibold">Transfer form</h2>
                                    <p className="text-sm text-slate-500">
                                        Active beneficiaries only.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-5 grid gap-4">
                                <label className="block">
                                    <span className="text-sm font-semibold">From account</span>
                                    <select
                                        value={form.data.from_account_id}
                                        onChange={(event) => {
                                            setConfirming(false);
                                            form.setData('from_account_id', event.target.value);
                                        }}
                                        className="mt-1 h-11 w-full rounded-md border border-[#D1D9DA] bg-white px-3 text-sm outline-none transition focus:border-[#0A6474] focus:ring-2 focus:ring-[#0A6474]/15"
                                    >
                                        {accounts.map((account) => (
                                            <option key={account.id} value={account.id}>
                                                {account.account_number} - {formatCurrency(account.balance, account.currency)}
                                            </option>
                                        ))}
                                    </select>
                                    <FieldError message={form.errors.from_account_id} />
                                </label>

                                <label className="block">
                                    <span className="text-sm font-semibold">Active beneficiary</span>
                                    <select
                                        value={form.data.beneficiary_id}
                                        onChange={(event) => {
                                            setConfirming(false);
                                            form.setData('beneficiary_id', event.target.value);
                                        }}
                                        className="mt-1 h-11 w-full rounded-md border border-[#D1D9DA] bg-white px-3 text-sm outline-none transition focus:border-[#0A6474] focus:ring-2 focus:ring-[#0A6474]/15"
                                    >
                                        {activeBeneficiaries.map((beneficiary) => (
                                            <option key={beneficiary.id} value={beneficiary.id}>
                                                {beneficiary.full_name} - {beneficiary.account_number || beneficiary.rib}
                                            </option>
                                        ))}
                                    </select>
                                    {!activeBeneficiaries.length ? (
                                        <p className="mt-1 text-sm text-amber-700">
                                            Add a verified CIM beneficiary before transferring.
                                        </p>
                                    ) : null}
                                    <FieldError message={form.errors.beneficiary_id} />
                                </label>

                                <label className="block">
                                    <span className="text-sm font-semibold">Amount</span>
                                    <input
                                        type="number"
                                        min="0.01"
                                        step="0.01"
                                        value={form.data.amount}
                                        onChange={(event) => {
                                            setConfirming(false);
                                            form.setData('amount', event.target.value);
                                        }}
                                        className="mt-1 h-11 w-full rounded-md border border-[#D1D9DA] px-3 text-sm outline-none transition focus:border-[#0A6474] focus:ring-2 focus:ring-[#0A6474]/15"
                                        placeholder="0.00"
                                    />
                                    <FieldError message={form.errors.amount} />
                                </label>

                                <label className="block">
                                    <span className="text-sm font-semibold">Note</span>
                                    <textarea
                                        value={form.data.note}
                                        onChange={(event) => form.setData('note', event.target.value)}
                                        className="mt-1 min-h-24 w-full resize-none rounded-md border border-[#D1D9DA] px-3 py-2 text-sm outline-none transition focus:border-[#0A6474] focus:ring-2 focus:ring-[#0A6474]/15"
                                        placeholder="Optional transfer description"
                                    />
                                    <FieldError message={form.errors.note} />
                                </label>
                            </div>

                            {confirming ? (
                                <div className="mt-5 rounded-lg border border-[#D4A23C]/50 bg-[#D4A23C]/10 p-4">
                                    <div className="flex items-start gap-3">
                                        <CircleAlert className="mt-0.5 h-5 w-5 text-[#D4A23C]" />
                                        <div>
                                            <h3 className="font-semibold">Confirm transfer</h3>
                                            <p className="mt-1 text-sm text-slate-600">
                                                Send {formatCurrency(amount)} to {selectedBeneficiary?.full_name || 'beneficiary'}.
                                                Your estimated balance after transfer is {formatCurrency(balanceAfter)}.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : null}

                            <button
                                type="submit"
                                disabled={form.processing || !accounts.length || !activeBeneficiaries.length}
                                className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#082F54] px-4 text-sm font-semibold text-white transition hover:bg-[#061F39] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <Send className="h-4 w-4" />
                                {form.processing
                                    ? 'Processing'
                                    : confirming
                                      ? 'Confirm transfer'
                                      : 'Review transfer'}
                            </button>
                        </form>

                        <section className="rounded-lg border border-[#D1D9DA] bg-white p-5 shadow-sm">
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="rounded-lg bg-[#082F54] p-4 text-white">
                                    <div className="flex items-center gap-2 text-sm text-white/70">
                                        <Landmark className="h-4 w-4 text-[#D4A23C]" />
                                        Selected balance
                                    </div>
                                    <p className="mt-3 text-3xl font-semibold">
                                        {formatCurrency(selectedAccount?.balance, selectedAccount?.currency)}
                                    </p>
                                </div>
                                <div className="rounded-lg border border-[#D1D9DA] bg-[#F7F8FA] p-4">
                                    <p className="text-sm text-slate-500">Transfer access</p>
                                    <p className="mt-3 text-3xl font-semibold">{activeBeneficiaries.length}</p>
                                    <p className="mt-1 text-sm text-slate-500">active beneficiaries</p>
                                </div>
                            </div>

                            <div className="mt-5">
                                <div className="mb-3 flex items-center justify-between gap-3">
                                    <h2 className="text-lg font-semibold">Recent transfers</h2>
                                    <ReceiptText className="h-5 w-5 text-[#0A6474]" />
                                </div>
                                <div className="divide-y divide-[#D1D9DA]">
                                    {recentTransfers.length ? recentTransfers.map((transfer) => {
                                        const isOut = transfer.direction === 'out';
                                        const Icon = isOut ? ArrowDownLeft : ArrowUpRight;

                                        return (
                                            <article key={transfer.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                                                <div className="flex items-center gap-3">
                                                    <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${isOut ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                        <Icon className="h-5 w-5" />
                                                    </span>
                                                    <div>
                                                        <p className="font-semibold">
                                                            {transfer.beneficiary_name || 'Internal CIM transfer'}
                                                        </p>
                                                        <p className="text-sm text-slate-500">
                                                            {transfer.reference} · {formatDate(transfer.completed_at || transfer.created_at)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between gap-4 sm:justify-end">
                                                    <p className={`font-semibold ${isOut ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                        {isOut ? '-' : '+'}{formatCurrency(transfer.amount, transfer.currency)}
                                                    </p>
                                                    <StatusBadge status={transfer.status} />
                                                </div>
                                            </article>
                                        );
                                    }) : (
                                        <div className="rounded-lg border border-dashed border-[#D1D9DA] px-6 py-10 text-center">
                                            <ReceiptText className="mx-auto mb-3 h-8 w-8 text-[#0A6474]" />
                                            <h3 className="font-semibold">No transfers yet</h3>
                                            <p className="mt-1 text-sm text-slate-500">
                                                Completed internal transfers will appear here.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>
                    </section>
                </div>
            </main>
        </>
    );
}
