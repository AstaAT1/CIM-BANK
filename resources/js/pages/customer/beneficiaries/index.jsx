import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    CheckCircle2,
    Clock3,
    Search,
    ShieldCheck,
    UserPlus,
    XCircle,
} from 'lucide-react';
import { useMemo, useState } from 'react';

const statusStyles = {
    active: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    pending: 'border-amber-200 bg-amber-50 text-amber-700',
    rejected: 'border-rose-200 bg-rose-50 text-rose-700',
};

function titleCase(value) {
    return String(value || 'unknown')
        .replaceAll('_', ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value) {
    if (!value) return 'Recently';

    return new Intl.DateTimeFormat('en-MA', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(new Date(value));
}

function StatusBadge({ status }) {
    const Icon =
        status === 'active' ? CheckCircle2 : status === 'rejected' ? XCircle : Clock3;

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${statusStyles[status] ?? 'border-slate-200 bg-white text-slate-600'}`}
        >
            <Icon className="h-3.5 w-3.5" />
            {titleCase(status)}
        </span>
    );
}

function FieldError({ message }) {
    return message ? <p className="mt-1 text-sm text-rose-600">{message}</p> : null;
}

export default function Beneficiaries({ beneficiaries = [], filters = {} }) {
    const { props } = usePage();
    const flash = props.flash || {};
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');

    const form = useForm({
        full_name: '',
        identifier: '',
        bank_name: 'CIM Bank',
        phone: '',
    });

    const summary = useMemo(
        () => ({
            total: beneficiaries.length,
            active: beneficiaries.filter((beneficiary) => beneficiary.status === 'active').length,
        }),
        [beneficiaries],
    );

    const applyFilters = (event) => {
        event.preventDefault();

        router.get(
            '/customer/beneficiaries',
            { search, status },
            { preserveState: true, replace: true },
        );
    };

    const addBeneficiary = (event) => {
        event.preventDefault();

        form.post('/backend/customer/beneficiaries', {
            preserveScroll: true,
            onSuccess: () =>
                form.reset('full_name', 'identifier', 'phone'),
        });
    };

    return (
        <>
            <Head title="Beneficiaries" />

            <main className="min-h-full bg-[#F7F8FA] px-4 py-6 text-[#061F39] sm:px-6 lg:px-8">
                <div className="mx-auto flex max-w-7xl flex-col gap-6">
                    <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
                        <div>
                            <p className="text-sm font-semibold text-[#0A6474]">
                                Internal CIM transfers
                            </p>
                            <h1 className="mt-1 text-3xl font-semibold">
                                Beneficiaries
                            </h1>
                            <p className="mt-2 max-w-2xl text-sm text-slate-500">
                                Add CIM customers with instant account verification and keep transfer destinations controlled.
                            </p>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center sm:min-w-80">
                            {[
                                ['Total', summary.total],
                                ['Ready', summary.active],
                                ['Unavailable', summary.total - summary.active],
                            ].map(([label, value]) => (
                                <div key={label} className="rounded-lg border border-[#D1D9DA] bg-white px-4 py-3">
                                    <p className="text-xs text-slate-500">{label}</p>
                                    <p className="mt-1 text-xl font-semibold">{value}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {flash.success ? (
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                            {flash.success}
                        </div>
                    ) : null}

                    <section className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
                        <form
                            onSubmit={addBeneficiary}
                            className="rounded-lg border border-[#D1D9DA] bg-white p-5 shadow-sm"
                        >
                            <div className="flex items-center gap-3">
                                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#082F54] text-white">
                                    <UserPlus className="h-5 w-5" />
                                </span>
                                <div>
                                    <h2 className="text-lg font-semibold">
                                        Add beneficiary
                                    </h2>
                                    <p className="text-sm text-slate-500">
                                        We verify CIM account details instantly.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-5 grid gap-4">
                                <label className="block">
                                    <span className="text-sm font-semibold">Full name</span>
                                    <input
                                        value={form.data.full_name}
                                        onChange={(event) => form.setData('full_name', event.target.value)}
                                        className="mt-1 h-11 w-full rounded-md border border-[#D1D9DA] px-3 text-sm outline-none transition focus:border-[#0A6474] focus:ring-2 focus:ring-[#0A6474]/15"
                                        placeholder="Receiver full name"
                                    />
                                    <FieldError message={form.errors.full_name} />
                                </label>

                                <label className="block">
                                    <span className="text-sm font-semibold">RIB or account number</span>
                                    <input
                                        value={form.data.identifier}
                                        onChange={(event) => form.setData('identifier', event.target.value)}
                                        className="mt-1 h-11 w-full rounded-md border border-[#D1D9DA] px-3 font-mono text-sm outline-none transition focus:border-[#0A6474] focus:ring-2 focus:ring-[#0A6474]/15"
                                        placeholder="RIB or CIM account number"
                                    />
                                    <FieldError message={form.errors.identifier || form.errors.rib || form.errors.account_number} />
                                </label>

                                <label className="block">
                                    <span className="text-sm font-semibold">Bank name</span>
                                    <input
                                        value={form.data.bank_name}
                                        onChange={(event) => form.setData('bank_name', event.target.value)}
                                        className="mt-1 h-11 w-full rounded-md border border-[#D1D9DA] px-3 text-sm outline-none transition focus:border-[#0A6474] focus:ring-2 focus:ring-[#0A6474]/15"
                                    />
                                    <FieldError message={form.errors.bank_name} />
                                </label>

                                <label className="block">
                                    <span className="text-sm font-semibold">Phone</span>
                                    <input
                                        value={form.data.phone}
                                        onChange={(event) => form.setData('phone', event.target.value)}
                                        className="mt-1 h-11 w-full rounded-md border border-[#D1D9DA] px-3 text-sm outline-none transition focus:border-[#0A6474] focus:ring-2 focus:ring-[#0A6474]/15"
                                        placeholder="Optional"
                                    />
                                    <FieldError message={form.errors.phone} />
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={form.processing}
                                className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#082F54] px-4 text-sm font-semibold text-white transition hover:bg-[#061F39] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <ShieldCheck className="h-4 w-4" />
                                {form.processing ? 'Adding' : 'Add beneficiary'}
                            </button>
                        </form>

                        <section className="rounded-lg border border-[#D1D9DA] bg-white p-5 shadow-sm">
                            <form onSubmit={applyFilters} className="flex flex-col gap-3 md:flex-row md:items-center">
                                <div className="relative flex-1">
                                    <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <input
                                        value={search}
                                        onChange={(event) => setSearch(event.target.value)}
                                        className="h-11 w-full rounded-md border border-[#D1D9DA] pr-3 pl-10 text-sm outline-none transition focus:border-[#0A6474] focus:ring-2 focus:ring-[#0A6474]/15"
                                        placeholder="Search by name, RIB, account, phone"
                                    />
                                </div>
                                <select
                                    value={status}
                                    onChange={(event) => setStatus(event.target.value)}
                                    className="h-11 rounded-md border border-[#D1D9DA] bg-white px-3 text-sm font-semibold outline-none transition focus:border-[#0A6474] focus:ring-2 focus:ring-[#0A6474]/15"
                                >
                                    <option value="">All statuses</option>
                                    <option value="active">Active</option>
                                    <option value="pending">Pending</option>
                                    <option value="rejected">Rejected</option>
                                </select>
                                <button
                                    type="submit"
                                    className="h-11 rounded-md border border-[#D1D9DA] bg-white px-4 text-sm font-semibold text-[#082F54] transition hover:border-[#D4A23C]"
                                >
                                    Filter
                                </button>
                            </form>

                            <div className="mt-5 divide-y divide-[#D1D9DA]">
                                {beneficiaries.length ? beneficiaries.map((beneficiary) => (
                                    <article key={beneficiary.id} className="grid gap-3 py-4 lg:grid-cols-[1fr_auto] lg:items-center">
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="font-semibold">{beneficiary.full_name}</h3>
                                                <StatusBadge status={beneficiary.status} />
                                            </div>
                                            <p className="mt-1 break-all font-mono text-sm text-slate-500">
                                                {beneficiary.rib || beneficiary.account_number || 'Account unavailable'}
                                            </p>
                                            <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                                                <span>{beneficiary.bank_name || 'CIM Bank'}</span>
                                                <span>Added {formatDate(beneficiary.created_at)}</span>
                                                <span>
                                                    {beneficiary.transfers_available
                                                        ? 'Transfers available'
                                                        : 'Transfers unavailable'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="rounded-md border border-[#D1D9DA] bg-[#F7F8FA] px-3 py-2 text-sm">
                                            <p className="text-xs font-semibold text-slate-500">Linked CIM account</p>
                                            <p className="mt-1 font-semibold">
                                                {beneficiary.linked_bank_account_id
                                                    ? titleCase(beneficiary.linked_account_status)
                                                    : 'Not linked'}
                                            </p>
                                        </div>
                                    </article>
                                )) : (
                                    <div className="rounded-lg border border-dashed border-[#D1D9DA] px-6 py-10 text-center">
                                        <UserPlus className="mx-auto mb-3 h-8 w-8 text-[#0A6474]" />
                                        <h3 className="font-semibold">No beneficiaries found</h3>
                                        <p className="mt-1 text-sm text-slate-500">
                                            Add an active CIM account to make transfers available immediately.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </section>
                    </section>
                </div>
            </main>
        </>
    );
}
