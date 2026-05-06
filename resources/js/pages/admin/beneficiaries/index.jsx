import { Head, router, usePage } from '@inertiajs/react';
import {
    CheckCircle2,
    Clock3,
    Search,
    ShieldCheck,
    UserCheck,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';

function titleCase(value) {
    return String(value || 'unknown')
        .replaceAll('_', ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value) {
    if (!value) return 'Not reviewed';

    return new Intl.DateTimeFormat('en-MA', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(new Date(value));
}

function StatusBadge({ status }) {
    const styles = {
        active: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        pending: 'border-amber-200 bg-amber-50 text-amber-700',
        rejected: 'border-rose-200 bg-rose-50 text-rose-700',
    };
    const Icon =
        status === 'active' ? CheckCircle2 : status === 'rejected' ? XCircle : Clock3;

    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${styles[status] ?? 'border-slate-200 bg-white text-slate-600'}`}>
            <Icon className="h-3.5 w-3.5" />
            {titleCase(status)}
        </span>
    );
}

export default function BeneficiaryApprovals({
    beneficiaries = { data: [], links: [] },
    filters = {},
    pendingCount = 0,
}) {
    const { props } = usePage();
    const flash = props.flash || {};
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || 'pending');

    const applyFilters = (event) => {
        event.preventDefault();

        router.get(
            '/admin/beneficiaries',
            { search, status },
            { preserveState: true, replace: true },
        );
    };

    const updateStatus = (beneficiary, action) => {
        router.patch(`/backend/admin/beneficiaries/${beneficiary.id}/${action}`, {}, {
            preserveScroll: true,
        });
    };

    return (
        <>
            <Head title="Beneficiary Approvals" />

            <main className="min-h-full bg-[#F7F8FA] px-4 py-6 text-[#061F39] sm:px-6 lg:px-8">
                <div className="mx-auto flex max-w-7xl flex-col gap-6">
                    <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
                        <div>
                            <p className="text-sm font-semibold text-[#0A6474]">
                                Staff review
                            </p>
                            <h1 className="mt-1 text-3xl font-semibold">
                                Beneficiary Approvals
                            </h1>
                            <p className="mt-2 max-w-2xl text-sm text-slate-500">
                                Review pending CIM beneficiaries before customers can transfer money.
                            </p>
                        </div>
                        <div className="rounded-lg border border-[#D1D9DA] bg-white px-5 py-4 shadow-sm">
                            <p className="text-sm text-slate-500">Pending approvals</p>
                            <p className="mt-1 text-3xl font-semibold">{pendingCount}</p>
                        </div>
                    </section>

                    {flash.success ? (
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                            {flash.success}
                        </div>
                    ) : null}
                    {flash.error ? (
                        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                            {flash.error}
                        </div>
                    ) : null}

                    <section className="rounded-lg border border-[#D1D9DA] bg-white p-5 shadow-sm">
                        <form onSubmit={applyFilters} className="flex flex-col gap-3 md:flex-row md:items-center">
                            <div className="relative flex-1">
                                <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    className="h-11 w-full rounded-md border border-[#D1D9DA] pr-3 pl-10 text-sm outline-none transition focus:border-[#0A6474] focus:ring-2 focus:ring-[#0A6474]/15"
                                    placeholder="Search owner, beneficiary, RIB, account"
                                />
                            </div>
                            <select
                                value={status}
                                onChange={(event) => setStatus(event.target.value)}
                                className="h-11 rounded-md border border-[#D1D9DA] bg-white px-3 text-sm font-semibold outline-none transition focus:border-[#0A6474] focus:ring-2 focus:ring-[#0A6474]/15"
                            >
                                <option value="">All statuses</option>
                                <option value="pending">Pending</option>
                                <option value="active">Active</option>
                                <option value="rejected">Rejected</option>
                            </select>
                            <button
                                type="submit"
                                className="h-11 rounded-md border border-[#D1D9DA] bg-white px-4 text-sm font-semibold text-[#082F54] transition hover:border-[#D4A23C]"
                            >
                                Filter
                            </button>
                        </form>

                        <div className="mt-5 overflow-hidden rounded-lg border border-[#D1D9DA]">
                            <div className="hidden grid-cols-[1fr_1fr_1fr_auto] gap-4 bg-[#F7F8FA] px-4 py-3 text-xs font-semibold text-slate-500 uppercase lg:grid">
                                <span>Beneficiary</span>
                                <span>Owner</span>
                                <span>Target account</span>
                                <span className="text-right">Actions</span>
                            </div>
                            <div className="divide-y divide-[#D1D9DA] bg-white">
                                {beneficiaries.data.length ? beneficiaries.data.map((beneficiary) => (
                                    <article key={beneficiary.id} className="grid gap-4 px-4 py-4 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-center">
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="font-semibold">{beneficiary.full_name}</p>
                                                <StatusBadge status={beneficiary.status} />
                                            </div>
                                            <p className="mt-1 break-all font-mono text-sm text-slate-500">
                                                {beneficiary.rib || beneficiary.account_number}
                                            </p>
                                            <p className="mt-1 text-xs text-slate-500">
                                                {beneficiary.bank_name || 'CIM Bank'} · {formatDate(beneficiary.created_at)}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="font-semibold">{beneficiary.owner?.name || 'Customer'}</p>
                                            <p className="mt-1 text-sm text-slate-500">{beneficiary.owner?.email}</p>
                                        </div>

                                        <div className="rounded-md border border-[#D1D9DA] bg-[#F7F8FA] px-3 py-2 text-sm">
                                            {beneficiary.target_account ? (
                                                <>
                                                    <p className="font-semibold">
                                                        {beneficiary.target_account.account_number}
                                                    </p>
                                                    <p className="mt-1 text-slate-500">
                                                        {beneficiary.target_account.owner_name} · {titleCase(beneficiary.target_account.status)}
                                                    </p>
                                                </>
                                            ) : (
                                                <>
                                                    <p className="font-semibold text-amber-700">No CIM match</p>
                                                    <p className="mt-1 text-slate-500">
                                                        Transfers unavailable until linked.
                                                    </p>
                                                </>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap justify-start gap-2 lg:justify-end">
                                            <button
                                                type="button"
                                                onClick={() => updateStatus(beneficiary, 'activate')}
                                                disabled={beneficiary.status === 'active'}
                                                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#082F54] px-3 text-sm font-semibold text-white transition hover:bg-[#061F39] disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <UserCheck className="h-4 w-4" />
                                                Activate
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => updateStatus(beneficiary, 'reject')}
                                                disabled={beneficiary.status === 'rejected'}
                                                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#D1D9DA] bg-white px-3 text-sm font-semibold text-rose-700 transition hover:border-rose-300 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <XCircle className="h-4 w-4" />
                                                Reject
                                            </button>
                                        </div>
                                    </article>
                                )) : (
                                    <div className="px-6 py-12 text-center">
                                        <ShieldCheck className="mx-auto mb-3 h-8 w-8 text-[#0A6474]" />
                                        <h3 className="font-semibold">No beneficiaries found</h3>
                                        <p className="mt-1 text-sm text-slate-500">
                                            Matching approval requests will appear here.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {beneficiaries.links?.length ? (
                            <div className="mt-4 flex flex-wrap gap-2">
                                {beneficiaries.links.map((link) => (
                                    <button
                                        key={link.label}
                                        type="button"
                                        disabled={!link.url}
                                        onClick={() => link.url && router.visit(link.url, { preserveScroll: true })}
                                        className={`h-9 rounded-md border px-3 text-sm font-semibold ${
                                            link.active
                                                ? 'border-[#082F54] bg-[#082F54] text-white'
                                                : 'border-[#D1D9DA] bg-white text-[#082F54]'
                                        } disabled:cursor-not-allowed disabled:opacity-50`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        ) : null}
                    </section>
                </div>
            </main>
        </>
    );
}
