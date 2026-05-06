import 'leaflet/dist/leaflet.css';

import { Head, router, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    Banknote,
    ChartColumn,
    CircleAlert,
    Clock3,
    Landmark,
    MapPin,
    ShieldCheck,
    WalletCards,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
    CircleMarker,
    MapContainer,
    TileLayer,
    Tooltip,
    useMap,
} from 'react-leaflet';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import adminAtms from '@/routes/admin/atms';

const CIM = {
    primary: '#082F54',
    secondary: '#0A6474',
    accent: '#D4A23C',
    dark: '#061F39',
    background: '#F7F8FA',
    white: '#FFFFFF',
    border: '#D1D9DA',
};

const STATUS_META = {
    active: {
        label: 'Active',
        marker: '#0A6474',
        soft: '#E7F3F4',
        text: '#075463',
    },
    low_cash: {
        label: 'Low cash',
        marker: '#D4A23C',
        soft: '#FFF7E6',
        text: '#8A620E',
    },
    empty: {
        label: 'Empty',
        marker: '#C2413B',
        soft: '#FEF0EF',
        text: '#9F2B27',
    },
    out_of_service: {
        label: 'Out of service',
        marker: '#475569',
        soft: '#F1F5F9',
        text: '#334155',
    },
};

const ALL_STATUSES = ['active', 'low_cash', 'empty', 'out_of_service'];

function asNumber(value) {
    const parsed = Number(value ?? 0);

    return Number.isFinite(parsed) ? parsed : 0;
}

function formatMad(value) {
    return `${asNumber(value).toLocaleString('fr-MA', {
        maximumFractionDigits: 0,
    })} MAD`;
}

function formatDate(value) {
    if (!value) {
        return 'Not recorded';
    }

    return new Intl.DateTimeFormat('fr-MA', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value));
}

function cashFill(atm, stats) {
    const providedFill = stats?.fill_percentage ?? atm?.fill_percentage;

    if (providedFill !== undefined && providedFill !== null) {
        return Math.max(0, Math.min(100, asNumber(providedFill)));
    }

    const capacity = asNumber(atm?.max_capacity);

    return capacity > 0
        ? Math.max(
              0,
              Math.min(100, (asNumber(atm?.current_cash) / capacity) * 100),
          )
        : 0;
}

function atmPosition(atm) {
    const lat = asNumber(atm?.latitude);
    const lng = asNumber(atm?.longitude);

    return lat && lng ? [lat, lng] : null;
}

function StatusBadge({ status }) {
    const meta = STATUS_META[status] ?? STATUS_META.active;

    return (
        <span
            className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold"
            style={{
                backgroundColor: meta.soft,
                borderColor: `${meta.marker}33`,
                color: meta.text,
            }}
        >
            <span
                className="size-1.5 rounded-full"
                style={{ backgroundColor: meta.marker }}
            />
            {meta.label}
        </span>
    );
}

function StatChip({ icon: Icon, label, value, accent = CIM.accent }) {
    return (
        <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-white shadow-sm backdrop-blur">
            <Icon className="size-4" style={{ color: accent }} />
            <span className="text-xs text-white/70">{label}</span>
            <span className="text-sm font-bold text-white">{value}</span>
        </div>
    );
}

function FlyToAtm({ position }) {
    const map = useMap();

    useEffect(() => {
        if (position) {
            map.flyTo(position, 15, { duration: 0.85 });
        }
    }, [map, position]);

    return null;
}

function SectionCard({ title, subtitle, children, action }) {
    return (
        <div className="overflow-hidden rounded-2xl border border-[#D1D9DA] bg-white shadow-sm">
            <div className="flex flex-col gap-2 border-b border-[#D1D9DA] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-base font-bold text-[#082F54]">
                        {title}
                    </h2>
                    {subtitle ? (
                        <p className="mt-1 text-xs text-slate-500">
                            {subtitle}
                        </p>
                    ) : null}
                </div>
                {action}
            </div>
            <div className="p-5">{children}</div>
        </div>
    );
}

function TableSection({ columns, rows, emptyText, renderRow }) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-sm">
                <thead className="bg-slate-50">
                    <tr className="border-b border-[#D1D9DA] text-left text-[11px] font-semibold tracking-[0.12em] text-slate-500 uppercase">
                        {columns.map((column) => (
                            <th className="px-4 py-3" key={column}>
                                {column}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.length === 0 ? (
                        <tr>
                            <td
                                className="px-4 py-8 text-center text-sm text-slate-500"
                                colSpan={columns.length}
                            >
                                {emptyText}
                            </td>
                        </tr>
                    ) : (
                        rows.map(renderRow)
                    )}
                </tbody>
            </table>
        </div>
    );
}

function CashMovementTable({ rows }) {
    return (
        <TableSection
            columns={['Type', 'Amount', 'Cash balance', 'By', 'Date']}
            emptyText="No cash movement recorded for this ATM yet."
            renderRow={(movement) => {
                const tone =
                    movement.type === 'load'
                        ? '#0A6474'
                        : movement.type === 'withdrawal'
                          ? '#C2413B'
                          : '#8A620E';

                return (
                    <tr
                        className="border-b border-[#D1D9DA]/70 last:border-b-0"
                        key={movement.id}
                    >
                        <td className="px-4 py-4">
                            <span
                                className="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize"
                                style={{
                                    backgroundColor: `${tone}12`,
                                    color: tone,
                                }}
                            >
                                {movement.type}
                            </span>
                        </td>
                        <td className="px-4 py-4 font-semibold text-[#061F39]">
                            {formatMad(movement.amount)}
                        </td>
                        <td className="px-4 py-4 text-slate-600">
                            {formatMad(movement.cash_before)} to{' '}
                            {formatMad(movement.cash_after)}
                        </td>
                        <td className="px-4 py-4 text-slate-600">
                            {movement.admin_user?.name ?? 'System'}
                        </td>
                        <td className="px-4 py-4 text-slate-500">
                            {formatDate(movement.created_at)}
                        </td>
                    </tr>
                );
            }}
            rows={rows}
        />
    );
}

function WithdrawalTable({ rows }) {
    return (
        <TableSection
            columns={['Amount', 'Customer', 'Account', 'Status', 'Date']}
            emptyText="No withdrawal history recorded for this ATM yet."
            renderRow={(withdrawal) => (
                <tr
                    className="border-b border-[#D1D9DA]/70 last:border-b-0"
                    key={withdrawal.id}
                >
                    <td className="px-4 py-4 font-semibold text-[#061F39]">
                        {formatMad(withdrawal.amount)}
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                        {withdrawal.user?.name ?? 'Customer'}
                    </td>
                    <td className="px-4 py-4 font-mono text-xs text-slate-600">
                        {withdrawal.bank_account?.account_number ??
                            'No account attached'}
                    </td>
                    <td className="px-4 py-4">
                        <span
                            className="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize"
                            style={{
                                backgroundColor:
                                    withdrawal.status === 'completed'
                                        ? '#E7F3F4'
                                        : '#FEF0EF',
                                color:
                                    withdrawal.status === 'completed'
                                        ? '#075463'
                                        : '#9F2B27',
                            }}
                        >
                            {withdrawal.status}
                        </span>
                    </td>
                    <td className="px-4 py-4 text-slate-500">
                        {formatDate(withdrawal.created_at)}
                    </td>
                </tr>
            )}
            rows={rows}
        />
    );
}

export default function AtmsShow({
    atm = {},
    stats = {},
    recentCashMovements = [],
    recentWithdrawals = [],
    availableForWithdrawal = false,
    isAdmin = false,
}) {
    const [activeTab, setActiveTab] = useState('movements');
    const canRenderMap = typeof window !== 'undefined';
    const position = atmPosition(atm);
    const fill = cashFill(atm, stats);
    const fillColor =
        fill >= 40 ? CIM.secondary : fill >= 15 ? CIM.accent : '#C2413B';

    const loadForm = useForm({
        amount: '',
        note: '',
    });

    const statusForm = useForm({
        name: atm.name ?? '',
        area: atm.area ?? '',
        address: atm.address ?? '',
        latitude: atm.latitude ?? '',
        longitude: atm.longitude ?? '',
        max_capacity: atm.max_capacity ?? '',
        status: atm.status ?? 'active',
        is_active: atm.is_active ?? true,
        notes: atm.notes ?? '',
    });

    const submitLoad = (event) => {
        event.preventDefault();
        loadForm.post(`/backend/admin/atms/${atm.id}/load-cash`, {
            preserveScroll: true,
            onSuccess: () => loadForm.reset(),
        });
    };

    const submitStatus = (event) => {
        event.preventDefault();
        statusForm.patch(`/backend/admin/atms/${atm.id}`, {
            preserveScroll: true,
        });
    };

    const activityRows =
        activeTab === 'movements' ? recentCashMovements : recentWithdrawals;

    return (
        <>
            <Head title={`${atm.name ?? 'ATM'} - CIM ATM Workstation`} />

            <section className="min-h-[calc(100vh-4rem)] bg-[#F7F8FA] p-4 text-[#061F39] sm:p-6">
                <div className="mx-auto max-w-[1680px]">
                    <div className="mb-5 overflow-hidden rounded-2xl border border-[#D1D9DA] bg-[#082F54] shadow-xl shadow-[#061F39]/10">
                        <div className="grid gap-5 p-5 text-white lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:p-6">
                            <div>
                                <Button
                                    className="mb-4 h-9 border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                                    onClick={() =>
                                        router.visit(adminAtms.index.url())
                                    }
                                    type="button"
                                    variant="outline"
                                >
                                    <ArrowLeft className="size-4" />
                                    Back to network map
                                </Button>
                                <div className="mb-4 flex items-center gap-3">
                                    <div className="flex size-11 items-center justify-center rounded-xl bg-[#D4A23C] text-sm font-black text-[#061F39]">
                                        CIM
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold tracking-[0.18em] text-white/60 uppercase">
                                            ATM workstation
                                        </p>
                                        <h1 className="mt-1 text-3xl font-bold tracking-tight">
                                            {atm.name}
                                        </h1>
                                    </div>
                                </div>
                                <p className="max-w-3xl text-sm leading-6 text-white/72">
                                    Review cash movements, service availability,
                                    withdrawal activity, and replenishment
                                    actions for this Casablanca terminal.
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-2 lg:justify-end">
                                <StatChip
                                    accent={CIM.accent}
                                    icon={Landmark}
                                    label="ATM code"
                                    value={atm.code}
                                />
                                <StatChip
                                    accent="#8FE3D6"
                                    icon={WalletCards}
                                    label="Current cash"
                                    value={formatMad(atm.current_cash)}
                                />
                                <StatChip
                                    accent={CIM.accent}
                                    icon={ChartColumn}
                                    label="Fill level"
                                    value={`${Math.round(fill)}%`}
                                />
                                <StatChip
                                    accent={
                                        availableForWithdrawal
                                            ? '#8FE3D6'
                                            : '#FCA5A5'
                                    }
                                    icon={ShieldCheck}
                                    label="Withdrawal"
                                    value={
                                        availableForWithdrawal
                                            ? 'Available'
                                            : 'Unavailable'
                                    }
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)_380px]">
                        <div className="space-y-5">
                            <SectionCard
                                subtitle="Location and operational profile"
                                title="ATM Snapshot"
                            >
                                <div className="space-y-4">
                                    <div className="flex flex-wrap gap-2">
                                        <StatusBadge status={atm.status} />
                                        <Badge className="rounded-full border-[#D1D9DA] bg-[#F7F8FA] px-2.5 py-1 text-[#082F54]">
                                            {atm.is_active
                                                ? 'Operational'
                                                : 'Paused'}
                                        </Badge>
                                    </div>
                                    <div className="space-y-3 text-sm">
                                        <div className="rounded-xl border border-[#D1D9DA] bg-[#F7F8FA] p-4">
                                            <p className="flex items-center gap-2 font-semibold text-[#082F54]">
                                                <MapPin className="size-4 text-[#D4A23C]" />
                                                {atm.area ?? 'Casablanca'}
                                            </p>
                                            <p className="mt-2 leading-6 text-slate-600">
                                                {atm.address}
                                            </p>
                                        </div>
                                        <div className="rounded-xl border border-[#D1D9DA] bg-white p-4">
                                            <div className="mb-2 flex items-center justify-between text-xs">
                                                <span className="font-medium text-slate-500">
                                                    Cash availability
                                                </span>
                                                <span className="font-semibold text-[#061F39]">
                                                    {Math.round(fill)}%
                                                </span>
                                            </div>
                                            <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                                                <div
                                                    className="h-full rounded-full transition-all duration-500"
                                                    style={{
                                                        backgroundColor:
                                                            fillColor,
                                                        width: `${fill}%`,
                                                    }}
                                                />
                                            </div>
                                            <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-slate-500">
                                                <div>
                                                    <p className="font-semibold uppercase">
                                                        Current cash
                                                    </p>
                                                    <p className="mt-1 text-sm font-bold text-[#061F39]">
                                                        {formatMad(
                                                            atm.current_cash,
                                                        )}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="font-semibold uppercase">
                                                        Max capacity
                                                    </p>
                                                    <p className="mt-1 text-sm font-bold text-[#061F39]">
                                                        {formatMad(
                                                            atm.max_capacity,
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="rounded-xl border border-[#D1D9DA] bg-white p-4">
                                            <div className="grid gap-3 text-sm text-slate-600">
                                                <div className="flex items-center justify-between gap-3">
                                                    <span>
                                                        Total withdrawals
                                                    </span>
                                                    <span className="font-semibold text-[#061F39]">
                                                        {stats.total_withdrawals ??
                                                            0}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between gap-3">
                                                    <span>Completed</span>
                                                    <span className="font-semibold text-[#061F39]">
                                                        {stats.completed_withdrawals ??
                                                            0}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between gap-3">
                                                    <span>Cash loaded</span>
                                                    <span className="font-semibold text-[#061F39]">
                                                        {formatMad(
                                                            stats.total_cash_loaded,
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between gap-3">
                                                    <span>Cash withdrawn</span>
                                                    <span className="font-semibold text-[#061F39]">
                                                        {formatMad(
                                                            stats.total_cash_withdrawn,
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </SectionCard>
                        </div>

                        <div className="space-y-5">
                            <div className="overflow-hidden rounded-2xl border border-[#D1D9DA] bg-white shadow-2xl shadow-[#061F39]/12">
                                <div className="relative h-[74vh] min-h-[520px] bg-slate-100">
                                    {canRenderMap ? (
                                        <MapContainer
                                            center={
                                                position ?? [33.5731, -7.5898]
                                            }
                                            className="h-full w-full"
                                            scrollWheelZoom={false}
                                            zoom={15}
                                            zoomControl={false}
                                        >
                                            <TileLayer
                                                attribution="OpenStreetMap"
                                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                            />
                                            <FlyToAtm position={position} />
                                            {position ? (
                                                <CircleMarker
                                                    center={position}
                                                    pathOptions={{
                                                        color: CIM.accent,
                                                        fillColor:
                                                            STATUS_META[
                                                                atm.status
                                                            ]?.marker ??
                                                            CIM.secondary,
                                                        fillOpacity: 0.96,
                                                        weight: 4,
                                                    }}
                                                    radius={14}
                                                >
                                                    <Tooltip
                                                        direction="top"
                                                        offset={[0, -10]}
                                                        permanent
                                                    >
                                                        <div className="text-xs font-semibold text-[#061F39]">
                                                            {atm.name}
                                                        </div>
                                                    </Tooltip>
                                                </CircleMarker>
                                            ) : null}
                                        </MapContainer>
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-sm text-slate-500">
                                            Loading ATM map
                                        </div>
                                    )}
                                    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(6,31,57,0.08),transparent_20%,transparent_78%,rgba(6,31,57,0.12))]" />
                                    <div className="absolute right-5 bottom-5 left-5 rounded-xl border border-white/20 bg-[#061F39]/88 p-4 text-white shadow-xl backdrop-blur">
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                            <div>
                                                <p className="text-xs font-semibold tracking-[0.14em] text-white/55 uppercase">
                                                    ATM coverage
                                                </p>
                                                <p className="mt-1 text-sm font-semibold">
                                                    {atm.code} remains pinned
                                                    for rapid operations review
                                                    and cash intervention.
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-white/70">
                                                <Clock3 className="size-4 text-[#D4A23C]" />
                                                Updated through live preview
                                                props
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <SectionCard
                                action={
                                    <div className="flex rounded-full border border-[#D1D9DA] bg-[#F7F8FA] p-1">
                                        <button
                                            className={cn(
                                                'rounded-full px-3 py-1.5 text-xs font-semibold transition',
                                                activeTab === 'movements'
                                                    ? 'bg-white text-[#082F54] shadow-sm'
                                                    : 'text-slate-500',
                                            )}
                                            onClick={() =>
                                                setActiveTab('movements')
                                            }
                                            type="button"
                                        >
                                            Cash movements
                                        </button>
                                        <button
                                            className={cn(
                                                'rounded-full px-3 py-1.5 text-xs font-semibold transition',
                                                activeTab === 'withdrawals'
                                                    ? 'bg-white text-[#082F54] shadow-sm'
                                                    : 'text-slate-500',
                                            )}
                                            onClick={() =>
                                                setActiveTab('withdrawals')
                                            }
                                            type="button"
                                        >
                                            Withdrawals
                                        </button>
                                    </div>
                                }
                                subtitle="Recent activity for the selected ATM"
                                title="Operations Feed"
                            >
                                {activeTab === 'movements' ? (
                                    <CashMovementTable
                                        rows={recentCashMovements}
                                    />
                                ) : (
                                    <WithdrawalTable rows={recentWithdrawals} />
                                )}
                            </SectionCard>
                        </div>

                        <div className="space-y-5">
                            <SectionCard
                                subtitle="Permissions and operational controls"
                                title="ATM Controls"
                            >
                                {isAdmin ? (
                                    <div className="space-y-5">
                                        {loadForm.recentlySuccessful ? (
                                            <div className="rounded-xl border border-[#0A6474]/20 bg-[#E7F3F4] px-3 py-2 text-sm font-medium text-[#075463]">
                                                Cash load submitted
                                                successfully.
                                            </div>
                                        ) : null}
                                        <form
                                            className="rounded-xl border border-[#D1D9DA] bg-[#F7F8FA] p-4"
                                            onSubmit={submitLoad}
                                        >
                                            <div className="mb-4 flex items-center gap-2">
                                                <div className="flex size-9 items-center justify-center rounded-lg bg-[#D4A23C]/15 text-[#082F54]">
                                                    <Banknote className="size-5" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-[#082F54]">
                                                        Load cash
                                                    </h3>
                                                    <p className="text-xs text-slate-500">
                                                        Add funds to this ATM
                                                        without changing backend
                                                        behavior.
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <div>
                                                    <Label htmlFor="amount">
                                                        Amount
                                                    </Label>
                                                    <div className="mt-2 flex overflow-hidden rounded-lg border border-[#D1D9DA] bg-white focus-within:border-[#0A6474] focus-within:ring-2 focus-within:ring-[#0A6474]/15">
                                                        <Input
                                                            className="h-11 flex-1 border-0 shadow-none focus-visible:ring-0"
                                                            id="amount"
                                                            min="0.01"
                                                            onChange={(event) =>
                                                                loadForm.setData(
                                                                    'amount',
                                                                    event.target
                                                                        .value,
                                                                )
                                                            }
                                                            placeholder="0"
                                                            step="0.01"
                                                            type="number"
                                                            value={
                                                                loadForm.data
                                                                    .amount
                                                            }
                                                        />
                                                        <span className="flex items-center border-l border-[#D1D9DA] px-3 text-xs font-bold text-slate-500">
                                                            MAD
                                                        </span>
                                                    </div>
                                                    {loadForm.errors.amount ? (
                                                        <p className="mt-2 text-xs font-medium text-red-600">
                                                            {
                                                                loadForm.errors
                                                                    .amount
                                                            }
                                                        </p>
                                                    ) : null}
                                                </div>
                                                <div>
                                                    <Label htmlFor="note">
                                                        Cash loading note
                                                    </Label>
                                                    <textarea
                                                        className="mt-2 min-h-24 w-full rounded-lg border border-[#D1D9DA] bg-white px-3 py-2 text-sm text-[#061F39] placeholder-slate-500 transition outline-none focus:border-[#0A6474] focus:ring-2 focus:ring-[#0A6474]/15 disabled:text-slate-600 disabled:opacity-70"
                                                        id="note"
                                                        onChange={(event) =>
                                                            loadForm.setData(
                                                                'note',
                                                                event.target
                                                                    .value,
                                                            )
                                                        }
                                                        placeholder="Vault batch, transport reference, or replenishment note"
                                                        value={
                                                            loadForm.data.note
                                                        }
                                                    />
                                                </div>
                                                <Button
                                                    className="h-11 w-full bg-[#D4A23C] text-[#061F39] hover:bg-[#c69531]"
                                                    disabled={
                                                        loadForm.processing ||
                                                        !loadForm.data.amount
                                                    }
                                                    type="submit"
                                                >
                                                    Load cash into ATM
                                                </Button>
                                            </div>
                                        </form>

                                        {statusForm.recentlySuccessful ? (
                                            <div className="rounded-xl border border-[#0A6474]/20 bg-[#E7F3F4] px-3 py-2 text-sm font-medium text-[#075463]">
                                                ATM status updated.
                                            </div>
                                        ) : null}
                                        <form
                                            className="rounded-xl border border-[#D1D9DA] bg-white p-4"
                                            onSubmit={submitStatus}
                                        >
                                            <div className="mb-4 flex items-center gap-2">
                                                <div className="flex size-9 items-center justify-center rounded-lg bg-[#082F54]/10 text-[#082F54]">
                                                    <CircleAlert className="size-5" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-[#082F54]">
                                                        Update operational
                                                        status
                                                    </h3>
                                                    <p className="text-xs text-slate-500">
                                                        Adjust service state and
                                                        internal notes.
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <div>
                                                    <Label htmlFor="status">
                                                        Status
                                                    </Label>
                                                    <select
                                                        className="mt-2 h-11 w-full rounded-lg border border-[#D1D9DA] bg-[#F7F8FA] px-3 text-sm text-[#061F39] transition outline-none focus:border-[#0A6474] focus:bg-white focus:ring-2 focus:ring-[#0A6474]/15"
                                                        id="status"
                                                        onChange={(event) =>
                                                            statusForm.setData(
                                                                'status',
                                                                event.target
                                                                    .value,
                                                            )
                                                        }
                                                        value={
                                                            statusForm.data
                                                                .status
                                                        }
                                                    >
                                                        {ALL_STATUSES.map(
                                                            (statusName) => (
                                                                <option
                                                                    key={
                                                                        statusName
                                                                    }
                                                                    value={
                                                                        statusName
                                                                    }
                                                                >
                                                                    {
                                                                        STATUS_META[
                                                                            statusName
                                                                        ]?.label
                                                                    }
                                                                </option>
                                                            ),
                                                        )}
                                                    </select>
                                                </div>
                                                <div className="rounded-xl border border-[#D1D9DA] bg-[#F7F8FA] p-3">
                                                    <div className="flex items-center gap-3">
                                                        <Checkbox
                                                            checked={
                                                                statusForm.data
                                                                    .is_active
                                                            }
                                                            id="is_active"
                                                            onCheckedChange={(
                                                                checked,
                                                            ) =>
                                                                statusForm.setData(
                                                                    'is_active',
                                                                    checked ===
                                                                        true,
                                                                )
                                                            }
                                                        />
                                                        <Label
                                                            className="cursor-pointer"
                                                            htmlFor="is_active"
                                                        >
                                                            ATM active and
                                                            accepting
                                                            withdrawals
                                                        </Label>
                                                    </div>
                                                </div>
                                                <div>
                                                    <Label htmlFor="notes">
                                                        Internal notes
                                                    </Label>
                                                    <textarea
                                                        className="mt-2 min-h-24 w-full rounded-lg border border-[#D1D9DA] bg-white px-3 py-2 text-sm text-[#061F39] placeholder-slate-500 transition outline-none focus:border-[#0A6474] focus:ring-2 focus:ring-[#0A6474]/15 disabled:text-slate-600 disabled:opacity-70"
                                                        id="notes"
                                                        onChange={(event) =>
                                                            statusForm.setData(
                                                                'notes',
                                                                event.target
                                                                    .value,
                                                            )
                                                        }
                                                        placeholder="Service note, technician update, or branch instruction"
                                                        value={
                                                            statusForm.data
                                                                .notes
                                                        }
                                                    />
                                                </div>
                                                <Button
                                                    className="h-11 w-full bg-[#082F54] text-white hover:bg-[#061F39]"
                                                    disabled={
                                                        statusForm.processing
                                                    }
                                                    type="submit"
                                                >
                                                    Save ATM status
                                                </Button>
                                            </div>
                                        </form>
                                    </div>
                                ) : (
                                    <div className="rounded-xl border border-[#D1D9DA] bg-[#F7F8FA] p-4">
                                        <div className="flex items-center gap-2">
                                            <ShieldCheck className="size-4 text-[#0A6474]" />
                                            <h3 className="font-bold text-[#082F54]">
                                                Read-only employee mode
                                            </h3>
                                        </div>
                                        <p className="mt-2 text-sm leading-6 text-slate-500">
                                            Employees can review cash levels,
                                            operational status, and customer
                                            withdrawal patterns. Cash loading
                                            and ATM status updates remain
                                            restricted to admin users.
                                        </p>
                                    </div>
                                )}
                            </SectionCard>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
