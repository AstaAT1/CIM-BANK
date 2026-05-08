import 'leaflet/dist/leaflet.css';

import { Head, router, useForm } from '@inertiajs/react';
import L from 'leaflet';
import {
    Activity,
    ArrowRight,
    Banknote,
    Building2,
    CheckCircle2,
    ChevronRight,
    CircleAlert,
    LocateFixed,
    MapPin,
    Minus,
    Navigation,
    Plus,
    Save,
    Search,
    Settings2,
    ShieldCheck,
    WalletCards,
    XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
    MapContainer,
    Marker,
    TileLayer,
    Tooltip,
    useMap,
} from 'react-leaflet';

import adminAtms from '@/routes/admin/atms';

/* ─────────────────────────────────── palette ── */
const CIM = {
    primary: '#082F54',
    secondary: '#0A6474',
    accent: '#D4A23C',
    dark: '#061F39',
    background: '#F7F8FA',
    white: '#FFFFFF',
    border: '#D1D9DA',
};

const DEFAULT_CENTER = [33.6087, -7.5396];
const DEFAULT_STATUSES = ['active', 'low_cash', 'empty', 'out_of_service'];

const readableFieldColor = '#EAF2F8';
const readablePlaceholderColor = '#94A3B8';
const readableFieldBackground = 'rgba(255,255,255,0.10)';
const readableFieldBorder = 'rgba(255,255,255,0.22)';

const darkInputClass =
    'atm-readable-field h-10 w-full rounded-lg border px-3 text-sm font-semibold text-[#EAF2F8] placeholder:text-slate-400 outline-none transition caret-[#D4A23C] focus:border-[#D4A23C] focus:ring-2 focus:ring-[#D4A23C]/20 disabled:opacity-100 disabled:text-[#EAF2F8]';
const darkSelectClass =
    'atm-readable-field h-10 w-full rounded-lg border px-3 text-sm font-semibold text-[#EAF2F8] outline-none transition caret-[#D4A23C] focus:border-[#D4A23C] focus:ring-2 focus:ring-[#D4A23C]/20 disabled:opacity-100 disabled:text-[#EAF2F8]';
const darkTextareaClass =
    'atm-readable-field w-full rounded-lg border px-3 py-2 text-sm font-semibold text-[#EAF2F8] placeholder:text-slate-400 outline-none resize-none transition caret-[#D4A23C] focus:border-[#D4A23C] focus:ring-2 focus:ring-[#D4A23C]/20 disabled:opacity-100 disabled:text-[#EAF2F8]';
const darkLabelClass = 'block text-xs font-semibold text-[#EAF2F8]';
const darkFieldStyle = {
    color: readableFieldColor,
    WebkitTextFillColor: readableFieldColor,
    backgroundColor: readableFieldBackground,
    borderColor: readableFieldBorder,
    caretColor: CIM.accent,
    colorScheme: 'dark',
    opacity: 1,
};
const darkSelectOptionStyle = {
    color: CIM.white,
    backgroundColor: CIM.dark,
};

/* ─────────────────────────────────── status meta ── */
const STATUS_META = {
    active: {
        label: 'Active',
        color: '#22C55E',
        bg: '#F0FDF4',
        border: '#86EFAC',
        text: '#15803D',
    },
    low_cash: {
        label: 'Low cash',
        color: '#F59E0B',
        bg: '#FFFBEB',
        border: '#FCD34D',
        text: '#92400E',
    },
    empty: {
        label: 'Empty',
        color: '#EF4444',
        bg: '#FEF2F2',
        border: '#FCA5A5',
        text: '#991B1B',
    },
    out_of_service: {
        label: 'Out of service',
        color: '#6B7280',
        bg: '#F9FAFB',
        border: '#D1D5DB',
        text: '#374151',
    },
};

const FILTER_DEFS = [
    { key: '', label: 'All statuses' },
    { key: 'active', label: 'Active' },
    { key: 'low_cash', label: 'Low cash' },
    { key: 'empty', label: 'Empty' },
    { key: 'out_of_service', label: 'Out of service' },
];

/* ─────────────────────────────────── helpers ── */
function asNumber(v) {
    const n = Number(v ?? 0);
    return Number.isFinite(n) ? n : 0;
}
function formatMad(v) {
    return `${asNumber(v).toLocaleString('fr-MA', { maximumFractionDigits: 0 })} MAD`;
}

function cashFill(atm) {
    if (atm?.fill_percentage != null)
        return Math.max(0, Math.min(100, asNumber(atm.fill_percentage)));
    const cap = asNumber(atm?.max_capacity);
    return cap > 0
        ? Math.max(0, Math.min(100, (asNumber(atm.current_cash) / cap) * 100))
        : 0;
}

function atmPosition(atm) {
    const lat = asNumber(atm?.latitude),
        lng = asNumber(atm?.longitude);
    return lat && lng ? [lat, lng] : null;
}

function atmFormPayload(atm) {
    return {
        name: atm?.name ?? '',
        area: atm?.area ?? '',
        address: atm?.address ?? '',
        latitude: atm?.latitude ?? '',
        longitude: atm?.longitude ?? '',
        max_capacity: atm?.max_capacity ?? '',
        status: atm?.status ?? 'active',
        is_active: atm?.is_active ? '1' : '0',
        notes: atm?.notes ?? '',
    };
}

/* ─────────────────────────────────── custom DivIcon ── */
function buildAtmIcon(atm, selected) {
    const meta = STATUS_META[atm?.status] ?? STATUS_META.active;
    const color = meta.color;
    const size = selected ? 52 : 40;
    const ring = selected ? 4 : 2.5;

    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size + 10}" viewBox="0 0 ${size} ${size + 10}">
  <defs>
    <filter id="ds${atm.id}" x="-60%" y="-60%" width="220%" height="220%">
      <feDropShadow dx="0" dy="3" stdDeviation="${selected ? 7 : 3}" flood-color="${color}" flood-opacity="${selected ? 0.75 : 0.45}"/>
    </filter>
  </defs>
  <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - ring}" fill="${CIM.dark}" stroke="${color}" stroke-width="${ring}" filter="url(#ds${atm.id})"/>
  <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - ring - 5}" fill="${color}25"/>
  <text x="${size / 2}" y="${size / 2 + 5.5}" font-size="${selected ? 17 : 13}" text-anchor="middle" fill="${color}" font-family="monospace" font-weight="900">₪</text>
  <polygon points="${size / 2 - 5},${size - 2} ${size / 2 + 5},${size - 2} ${size / 2},${size + 9}" fill="${color}" filter="url(#ds${atm.id})"/>
  ${selected ? `<circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 1}" fill="none" stroke="${CIM.accent}" stroke-width="2" opacity="0.5"/>` : ''}
</svg>`;

    return L.divIcon({
        html: svg,
        iconSize: [size, size + 10],
        iconAnchor: [size / 2, size + 10],
        tooltipAnchor: [0, -(size + 14)],
        className: '',
    });
}

function buildFocusIcon() {
    const size = 36;
    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs><filter id="ff"><feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="${CIM.accent}" flood-opacity="0.65"/></filter></defs>
  <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 3}" fill="${CIM.primary}" stroke="${CIM.accent}" stroke-width="3" filter="url(#ff)"/>
  <circle cx="${size / 2}" cy="${size / 2}" r="5" fill="${CIM.accent}"/>
  <circle cx="${size / 2}" cy="${size / 2}" r="10" fill="none" stroke="${CIM.accent}" stroke-width="1" opacity="0.5"/>
</svg>`;
    return L.divIcon({
        html: svg,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        className: '',
    });
}

/* ─────────────────────────────────── map effects ── */
function MapEffects({ locateRequest, selectedPosition, mapRef }) {
    const map = useMap();
    useEffect(() => {
        mapRef.current = map;
    }, [map]);
    useEffect(() => {
        if (selectedPosition)
            map.flyTo(selectedPosition, 15, { duration: 0.85 });
    }, [selectedPosition]);
    useEffect(() => {
        if (locateRequest > 0)
            map.flyTo(DEFAULT_CENTER, 15, { duration: 0.85 });
    }, [locateRequest]);
    return null;
}

/* ─────────────────────────────────── map controls ── */
function MapControls({ onLocate }) {
    const map = useMap();
    return (
        <div className="absolute right-4 bottom-8 z-[800] flex flex-col gap-2">
            {[
                { icon: Plus, action: () => map.zoomIn(), tip: 'Zoom in' },
                { icon: Minus, action: () => map.zoomOut(), tip: 'Zoom out' },
                { icon: LocateFixed, action: onLocate, tip: 'Locate focus' },
            ].map(({ icon: Icon, action, tip }) => (
                <button
                    key={tip}
                    onClick={action}
                    title={tip}
                    className="flex size-10 items-center justify-center rounded-xl transition-all hover:scale-105 hover:brightness-110"
                    style={{
                        background: 'rgba(6,15,30,0.90)',
                        border: '1px solid rgba(255,255,255,0.10)',
                        color: CIM.accent,
                        backdropFilter: 'blur(10px)',
                    }}
                    type="button"
                >
                    <Icon className="size-4" />
                </button>
            ))}
        </div>
    );
}

/* ─────────────────────────────────── status badge ── */
function StatusBadge({ status, size = 'sm' }) {
    const meta = STATUS_META[status] ?? STATUS_META.active;
    const px =
        size === 'xs' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full border font-semibold ${px}`}
            style={{
                background: meta.bg,
                borderColor: meta.border,
                color: meta.text,
            }}
        >
            <span
                className="size-1.5 rounded-full"
                style={{ background: meta.color }}
            />
            {meta.label}
        </span>
    );
}

/* ─────────────────────────────────── cash bar ── */
function CashBar({ atm, dark = false }) {
    const fill = cashFill(atm);
    const color =
        fill >= 40
            ? STATUS_META.active.color
            : fill >= 15
              ? STATUS_META.low_cash.color
              : STATUS_META.empty.color;
    const trackBg = dark ? 'rgba(255,255,255,0.08)' : '#E2E8F0';
    const labelColor = dark ? '#94A3B8' : '#64748B';
    return (
        <div>
            <div className="mb-1.5 flex justify-between text-[11px]">
                <span style={{ color: labelColor }} className="font-medium">
                    Cash availability
                </span>
                <span className="font-bold" style={{ color }}>
                    {Math.round(fill)}%
                </span>
            </div>
            <div
                className="h-1.5 overflow-hidden rounded-full"
                style={{ background: trackBg }}
            >
                <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                        width: `${fill}%`,
                        background: color,
                        boxShadow: `0 0 6px ${color}99`,
                    }}
                />
            </div>
            <div
                className="mt-1.5 flex justify-between text-[10px]"
                style={{ color: labelColor }}
            >
                <span>{formatMad(atm.current_cash)}</span>
                <span>Max {formatMad(atm.max_capacity)}</span>
            </div>
        </div>
    );
}

/* ─────────────────────────────────── sidebar ATM card ── */
function AtmCard({ atm, selected, onSelect }) {
    const meta = STATUS_META[atm.status] ?? STATUS_META.active;
    const fill = cashFill(atm);
    return (
        <button
            onClick={() => onSelect(atm)}
            className="w-full rounded-xl border p-3 text-left transition-all duration-200"
            style={{
                background: selected
                    ? 'rgba(212,162,60,0.08)'
                    : 'rgba(255,255,255,0.04)',
                borderColor: selected ? CIM.accent : 'rgba(255,255,255,0.08)',
                boxShadow: selected ? `0 0 0 1px ${CIM.accent}44` : 'none',
            }}
            type="button"
        >
            <div className="flex items-start gap-2.5">
                <div
                    className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg"
                    style={{
                        background: `${meta.color}20`,
                        border: `1.5px solid ${meta.color}55`,
                    }}
                >
                    <span
                        className="text-xs font-black"
                        style={{ color: meta.color }}
                    >
                        ₪
                    </span>
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                        <p className="font-mono text-[9px] font-bold text-slate-500 uppercase">
                            {atm.code}
                        </p>
                    </div>
                    <p className="mt-0.5 truncate text-sm font-semibold text-white">
                        {atm.name}
                    </p>
                    <p className="truncate text-[11px] text-slate-400">
                        {atm.area ?? 'Casablanca'}
                    </p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                        <StatusBadge status={atm.status} size="xs" />
                        <span
                            className="text-[10px] font-bold"
                            style={{ color: meta.color }}
                        >
                            {Math.round(fill)}% full
                        </span>
                    </div>
                    <div className="mt-2">
                        <CashBar atm={atm} dark />
                    </div>
                </div>
            </div>
        </button>
    );
}

/* ─────────────────────────────────── floating sidebar ── */
function FloatingSidebar({
    atms,
    counts,
    search,
    area,
    status,
    areas,
    selectedAtm,
    onSearch,
    onArea,
    onStatus,
    onSelect,
    onClear,
    collapsed,
    onToggle,
}) {
    return (
        <div className="absolute top-0 left-0 z-[900] flex h-full">
            <div
                className="flex h-full flex-col overflow-hidden transition-all duration-300"
                style={{
                    width: collapsed ? 0 : 300,
                    background: 'rgba(6,15,30,0.92)',
                    backdropFilter: 'blur(20px)',
                    borderRight: '1px solid rgba(255,255,255,0.06)',
                }}
            >
                {!collapsed && (
                    <div className="flex h-full flex-col overflow-hidden">
                        {/* header */}
                        <div className="shrink-0 border-b border-white/8 p-4">
                            <div className="mb-4 flex items-center gap-2.5">
                                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#D4A23C] text-[10px] font-black text-[#061F39]">
                                    CIM
                                </div>
                                <div>
                                    <p className="text-[9px] font-bold tracking-widest text-slate-500 uppercase">
                                        Staff Operations
                                    </p>
                                    <h2 className="text-sm font-bold text-white">
                                        ATM Register
                                    </h2>
                                </div>
                                <span
                                    className="ml-auto rounded-full px-2 py-0.5 text-xs font-bold"
                                    style={{
                                        background: `${CIM.accent}22`,
                                        color: CIM.accent,
                                    }}
                                >
                                    {counts.total ?? 0}
                                </span>
                            </div>

                            {/* search */}
                            <div className="relative">
                                <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-slate-500" />
                                <input
                                    className={`${darkInputClass} h-9 pl-8 text-xs`}
                                    style={darkFieldStyle}
                                    placeholder="Search name, code, area…"
                                    value={search}
                                    onChange={(e) => onSearch(e.target.value)}
                                />
                            </div>

                            {/* area + status filters */}
                            <div className="mt-3 grid grid-cols-2 gap-2">
                                <select
                                    className={`${darkSelectClass} h-9 px-2 text-xs`}
                                    style={darkFieldStyle}
                                    value={area}
                                    onChange={(e) => onArea(e.target.value)}
                                >
                                    <option
                                        value=""
                                        style={darkSelectOptionStyle}
                                    >
                                        All areas
                                    </option>
                                    {areas.map((a) => (
                                        <option
                                            key={a}
                                            value={a}
                                            style={darkSelectOptionStyle}
                                        >
                                            {a}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    className={`${darkSelectClass} h-9 px-2 text-xs`}
                                    style={darkFieldStyle}
                                    value={status}
                                    onChange={(e) => onStatus(e.target.value)}
                                >
                                    {FILTER_DEFS.map((f) => (
                                        <option
                                            key={f.key}
                                            value={f.key}
                                            style={darkSelectOptionStyle}
                                        >
                                            {f.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="mt-2 flex items-center justify-between">
                                <p className="text-[10px] text-slate-500">
                                    {atms.length} terminals
                                </p>
                                <button
                                    onClick={onClear}
                                    className="text-[10px] font-semibold transition hover:opacity-80"
                                    style={{ color: CIM.accent }}
                                    type="button"
                                >
                                    Clear filters
                                </button>
                            </div>
                        </div>

                        {/* status quick-filters */}
                        <div className="shrink-0 border-b border-white/8 px-3 pt-2 pb-1">
                            <div className="flex flex-wrap gap-1.5">
                                {Object.entries(STATUS_META).map(
                                    ([key, meta]) => (
                                        <button
                                            key={key}
                                            onClick={() =>
                                                onStatus(
                                                    status === key ? '' : key,
                                                )
                                            }
                                            className="flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold transition"
                                            style={{
                                                background:
                                                    status === key
                                                        ? `${meta.color}22`
                                                        : 'rgba(255,255,255,0.05)',
                                                border: `1px solid ${status === key ? meta.color + '55' : 'rgba(255,255,255,0.08)'}`,
                                                color:
                                                    status === key
                                                        ? meta.color
                                                        : '#94A3B8',
                                            }}
                                            type="button"
                                        >
                                            <span
                                                className="size-1.5 rounded-full"
                                                style={{
                                                    background: meta.color,
                                                }}
                                            />
                                            {meta.label}
                                            <span className="font-bold opacity-70">
                                                {counts[key] ?? 0}
                                            </span>
                                        </button>
                                    ),
                                )}
                            </div>
                        </div>

                        {/* list */}
                        <div className="flex-1 space-y-2 overflow-y-auto p-3">
                            {atms.length === 0 ? (
                                <p className="mt-8 text-center text-sm text-slate-500">
                                    No ATMs match your filters.
                                </p>
                            ) : (
                                atms.map((atm) => (
                                    <AtmCard
                                        key={atm.id}
                                        atm={atm}
                                        selected={selectedAtm?.id === atm.id}
                                        onSelect={onSelect}
                                    />
                                ))
                            )}
                        </div>

                        {/* legend */}
                        <div className="shrink-0 border-t border-white/8 p-3">
                            <p className="mb-2 text-[9px] font-bold tracking-widest text-slate-600 uppercase">
                                Marker legend
                            </p>
                            <div className="grid grid-cols-2 gap-1">
                                {Object.entries(STATUS_META).map(
                                    ([key, meta]) => (
                                        <div
                                            key={key}
                                            className="flex items-center gap-1.5 text-[10px] text-slate-400"
                                        >
                                            <span
                                                className="size-2 shrink-0 rounded-full"
                                                style={{
                                                    background: meta.color,
                                                }}
                                            />
                                            {meta.label}
                                        </div>
                                    ),
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* collapse tab */}
            <button
                onClick={onToggle}
                className="absolute top-1/2 flex -translate-y-1/2 items-center justify-center rounded-r-lg transition-all hover:scale-105"
                style={{
                    left: collapsed ? 0 : 300,
                    width: 22,
                    height: 56,
                    background: 'rgba(6,15,30,0.92)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderLeft: 'none',
                    color: CIM.accent,
                    zIndex: 1,
                }}
                type="button"
            >
                {collapsed ? (
                    <ChevronRight className="size-3.5" />
                ) : (
                    <ChevronRight className="size-3.5 rotate-180" />
                )}
            </button>
        </div>
    );
}

/* ─────────────────────────────────── top bar ── */
function MapTopBar({ counts }) {
    return (
        <div
            className="absolute top-0 right-0 left-0 z-[800] flex items-center justify-between px-4 py-2.5"
            style={{
                background: 'rgba(6,15,30,0.88)',
                backdropFilter: 'blur(14px)',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}
        >
            <a
                href="/dashboard"
                className="flex items-center gap-2 text-sm font-semibold text-slate-400 transition-colors hover:text-white"
            >
                <ChevronRight className="size-4 rotate-180" />
                Dashboard
            </a>

            <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-md bg-[#D4A23C] text-[10px] font-black text-[#061F39]">
                    CIM
                </div>
                <span className="text-sm font-bold text-white">
                    ATM Operations
                </span>
                <span className="hidden text-slate-600 sm:inline">·</span>
                <span className="hidden text-xs text-slate-400 sm:inline">
                    Staff Dashboard
                </span>
            </div>

            <div className="hidden flex-wrap items-center justify-end gap-2 sm:flex">
                {[
                    { label: 'Total', val: counts.total, color: CIM.accent },
                    {
                        label: 'Active',
                        val: counts.active,
                        color: STATUS_META.active.color,
                    },
                    {
                        label: 'Low',
                        val: counts.low_cash,
                        color: STATUS_META.low_cash.color,
                    },
                    {
                        label: 'Empty',
                        val: counts.empty,
                        color: STATUS_META.empty.color,
                    },
                ].map(({ label, val, color }) => (
                    <div
                        key={label}
                        className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                        style={{
                            background: `${color}18`,
                            color,
                            border: `1px solid ${color}33`,
                        }}
                    >
                        {label}: <span className="font-bold">{val ?? 0}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ─────────────────────────────────── admin tools panel ── */
function AdminToolsPanel({ atm, isAdmin, onOpenFull }) {
    const updateForm = useForm(atmFormPayload(atm));
    const loadForm = useForm({ amount: '', note: '' });

    useEffect(() => {
        updateForm.setData(atmFormPayload(atm));
        updateForm.clearErrors();
        loadForm.reset('amount', 'note');
        loadForm.clearErrors();
    }, [atm?.id]);

    if (!atm) {
        return (
            <div
                className="flex h-full min-h-64 flex-col items-center justify-center rounded-2xl border border-white/8 p-8 text-center"
                style={{
                    background: 'rgba(6,15,30,0.60)',
                    backdropFilter: 'blur(10px)',
                }}
            >
                <div
                    className="mb-4 flex size-14 items-center justify-center rounded-xl"
                    style={{
                        background: `${CIM.accent}18`,
                        border: `1px solid ${CIM.accent}33`,
                    }}
                >
                    <LocateFixed
                        className="size-7"
                        style={{ color: CIM.accent }}
                    />
                </div>
                <h3 className="mb-2 text-lg font-bold text-white">
                    Select an ATM
                </h3>
                <p className="max-w-xs text-sm leading-6 text-slate-400">
                    Click a marker on the map or choose a terminal from the
                    register to inspect and manage it.
                </p>
            </div>
        );
    }

    const meta = STATUS_META[atm.status] ?? STATUS_META.active;

    const submitUpdate = (e) => {
        e.preventDefault();
        updateForm.patch(`/backend/admin/atms/${atm.id}`, {
            preserveScroll: true,
        });
    };

    const submitLoad = (e) => {
        e.preventDefault();
        loadForm.post(`/backend/admin/atms/${atm.id}/load-cash`, {
            preserveScroll: true,
            onSuccess: () => loadForm.reset('amount', 'note'),
        });
    };

    return (
        <div
            className="overflow-hidden rounded-2xl border border-white/8"
            style={{
                background: 'rgba(6,15,30,0.75)',
                backdropFilter: 'blur(16px)',
            }}
        >
            {/* ATM header */}
            <div
                className="border-b border-white/8 p-5"
                style={{
                    background: `linear-gradient(135deg, ${CIM.dark}ee, rgba(10,100,116,0.30))`,
                }}
            >
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <div
                            className="flex size-12 shrink-0 items-center justify-center rounded-xl"
                            style={{
                                background: `${meta.color}20`,
                                border: `2px solid ${meta.color}55`,
                            }}
                        >
                            <span
                                className="text-xl font-black"
                                style={{ color: meta.color }}
                            >
                                ₪
                            </span>
                        </div>
                        <div>
                            <p className="font-mono text-[10px] font-bold text-slate-500 uppercase">
                                {atm.code}
                            </p>
                            <h3 className="mt-0.5 text-xl font-bold tracking-tight text-white">
                                {atm.name}
                            </h3>
                            <p className="mt-1 flex items-start gap-1.5 text-sm text-slate-400">
                                <MapPin
                                    className="mt-0.5 size-3.5 shrink-0"
                                    style={{ color: CIM.accent }}
                                />
                                {atm.area ?? 'Casablanca'} · {atm.address}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => onOpenFull(atm)}
                        className="flex h-9 shrink-0 items-center gap-2 rounded-xl px-4 text-sm font-bold transition hover:brightness-110"
                        style={{ background: CIM.accent, color: CIM.dark }}
                        type="button"
                    >
                        Full workstation
                        <ArrowRight className="size-4" />
                    </button>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                    <StatusBadge status={atm.status} />
                    <span
                        className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold"
                        style={{
                            background: atm.is_active
                                ? '#22c55e18'
                                : '#6b728018',
                            borderColor: atm.is_active
                                ? '#22c55e33'
                                : '#6b728033',
                            color: atm.is_active ? '#22c55e' : '#9CA3AF',
                        }}
                    >
                        <ShieldCheck className="size-3" />
                        {atm.is_active ? 'Operational' : 'Paused'}
                    </span>
                </div>
            </div>

            <div className="space-y-5 p-5">
                {/* cash bar */}
                <div
                    className="rounded-xl p-4"
                    style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.07)',
                    }}
                >
                    <CashBar atm={atm} dark />
                </div>

                {/* stats grid */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                        {
                            label: 'Current cash',
                            val: formatMad(atm.current_cash),
                        },
                        {
                            label: 'Max capacity',
                            val: formatMad(atm.max_capacity),
                        },
                        {
                            label: 'Cash movements',
                            val: atm.cash_movements_count ?? 0,
                        },
                        {
                            label: 'Withdrawals',
                            val: atm.withdrawals_count ?? 0,
                        },
                    ].map(({ label, val }) => (
                        <div
                            key={label}
                            className="rounded-xl p-3 text-center"
                            style={{
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.07)',
                            }}
                        >
                            <p className="text-[10px] font-bold tracking-wide text-slate-500 uppercase">
                                {label}
                            </p>
                            <p className="mt-1.5 text-base font-bold text-white">
                                {val}
                            </p>
                        </div>
                    ))}
                </div>

                {/* edit + load cash grid */}
                <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_340px]">
                    {/* edit form */}
                    <form
                        onSubmit={submitUpdate}
                        className="rounded-xl p-4"
                        style={{
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.07)',
                        }}
                    >
                        <div className="mb-5 flex items-center gap-2.5">
                            <div
                                className="flex size-9 items-center justify-center rounded-lg"
                                style={{
                                    background: `${CIM.primary}80`,
                                    border: `1px solid ${CIM.accent}33`,
                                }}
                            >
                                <Settings2
                                    className="size-4"
                                    style={{ color: CIM.accent }}
                                />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-white">
                                    Edit ATM controls
                                </h4>
                                <p className="text-[10px] text-slate-500">
                                    PATCH /backend/admin/atms/{atm.id}
                                </p>
                            </div>
                        </div>

                        <fieldset disabled={!isAdmin} className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                {[
                                    {
                                        label: 'ATM name',
                                        key: 'name',
                                        type: 'text',
                                        span: 1,
                                    },
                                    {
                                        label: 'Area',
                                        key: 'area',
                                        type: 'text',
                                        span: 1,
                                    },
                                    {
                                        label: 'Address',
                                        key: 'address',
                                        type: 'text',
                                        span: 2,
                                    },
                                    {
                                        label: 'Latitude',
                                        key: 'latitude',
                                        type: 'number',
                                        span: 1,
                                    },
                                    {
                                        label: 'Longitude',
                                        key: 'longitude',
                                        type: 'number',
                                        span: 1,
                                    },
                                    {
                                        label: 'Max capacity',
                                        key: 'max_capacity',
                                        type: 'number',
                                        span: 1,
                                    },
                                ].map(({ label, key, type, span }) => (
                                    <label
                                        key={key}
                                        className={`${darkLabelClass} ${span === 2 ? 'sm:col-span-2' : ''}`}
                                    >
                                        {label}
                                        <input
                                            type={type}
                                            value={updateForm.data[key]}
                                            onChange={(e) =>
                                                updateForm.setData(
                                                    key,
                                                    e.target.value,
                                                )
                                            }
                                            className={`mt-1.5 ${darkInputClass}`}
                                            style={darkFieldStyle}
                                            min={
                                                type === 'number'
                                                    ? '0'
                                                    : undefined
                                            }
                                        />
                                    </label>
                                ))}

                                <label className={darkLabelClass}>
                                    Status
                                    <select
                                        value={updateForm.data.status}
                                        onChange={(e) =>
                                            updateForm.setData(
                                                'status',
                                                e.target.value,
                                            )
                                        }
                                        className={`mt-1.5 ${darkSelectClass}`}
                                        style={darkFieldStyle}
                                    >
                                        {DEFAULT_STATUSES.map((s) => (
                                            <option
                                                key={s}
                                                value={s}
                                                style={darkSelectOptionStyle}
                                            >
                                                {STATUS_META[s]?.label ?? s}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label className={darkLabelClass}>
                                    Operational flag
                                    <select
                                        value={updateForm.data.is_active}
                                        onChange={(e) =>
                                            updateForm.setData(
                                                'is_active',
                                                e.target.value,
                                            )
                                        }
                                        className={`mt-1.5 ${darkSelectClass}`}
                                        style={darkFieldStyle}
                                    >
                                        <option
                                            value="1"
                                            style={darkSelectOptionStyle}
                                        >
                                            Operational
                                        </option>
                                        <option
                                            value="0"
                                            style={darkSelectOptionStyle}
                                        >
                                            Paused
                                        </option>
                                    </select>
                                </label>

                                <label
                                    className={`${darkLabelClass} sm:col-span-2`}
                                >
                                    Notes
                                    <textarea
                                        value={updateForm.data.notes}
                                        onChange={(e) =>
                                            updateForm.setData(
                                                'notes',
                                                e.target.value,
                                            )
                                        }
                                        rows={3}
                                        className={`mt-1.5 ${darkTextareaClass}`}
                                        style={darkFieldStyle}
                                    />
                                </label>
                            </div>
                        </fieldset>

                        {Object.values(updateForm.errors).length > 0 && (
                            <div
                                className="mt-4 rounded-xl px-3 py-2 text-xs text-red-300"
                                style={{
                                    background: '#ef444418',
                                    border: '1px solid #ef444433',
                                }}
                            >
                                {Object.values(updateForm.errors)[0]}
                            </div>
                        )}

                        <div className="mt-4 flex items-center justify-between gap-3">
                            <p className="text-[10px] text-slate-600">
                                Current cash is adjusted via movements.
                            </p>
                            <button
                                type="submit"
                                disabled={!isAdmin || updateForm.processing}
                                className="flex h-9 items-center gap-2 rounded-xl px-4 text-sm font-bold transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                                style={{
                                    background: CIM.primary,
                                    color: CIM.white,
                                    border: `1px solid ${CIM.accent}44`,
                                }}
                            >
                                <Save className="size-3.5" />
                                {updateForm.processing
                                    ? 'Saving…'
                                    : 'Save changes'}
                            </button>
                        </div>
                    </form>

                    {/* load cash form */}
                    <form
                        onSubmit={submitLoad}
                        className="rounded-xl p-4"
                        style={{
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.07)',
                        }}
                    >
                        <div className="mb-5 flex items-center gap-2.5">
                            <div
                                className="flex size-9 items-center justify-center rounded-lg"
                                style={{
                                    background: `${CIM.accent}18`,
                                    border: `1px solid ${CIM.accent}33`,
                                }}
                            >
                                <Banknote
                                    className="size-4"
                                    style={{ color: CIM.accent }}
                                />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-white">
                                    Load cash
                                </h4>
                                <p className="text-[10px] text-slate-500">
                                    POST /backend/admin/atms/{atm.id}/load-cash
                                </p>
                            </div>
                        </div>

                        <fieldset disabled={!isAdmin} className="space-y-4">
                            <label className={darkLabelClass}>
                                Amount (MAD)
                                <div
                                    className="mt-1.5 flex overflow-hidden rounded-lg border"
                                    style={darkFieldStyle}
                                >
                                    <input
                                        type="number"
                                        min="0.01"
                                        step="0.01"
                                        placeholder="0"
                                        value={loadForm.data.amount}
                                        onChange={(e) =>
                                            loadForm.setData(
                                                'amount',
                                                e.target.value,
                                            )
                                        }
                                        className={`${darkInputClass} flex-1 border-0 bg-transparent text-base`}
                                        style={{
                                            color: readableFieldColor,
                                            WebkitTextFillColor:
                                                readableFieldColor,
                                            backgroundColor: 'transparent',
                                            caretColor: CIM.accent,
                                            opacity: 1,
                                        }}
                                    />
                                    <span
                                        className="flex items-center border-l px-3 text-xs font-bold text-[#EAF2F8]"
                                        style={{
                                            background:
                                                'rgba(255,255,255,0.04)',
                                            borderColor:
                                                'rgba(255,255,255,0.08)',
                                        }}
                                    >
                                        MAD
                                    </span>
                                </div>
                                {loadForm.errors.amount && (
                                    <p className="mt-1 text-[10px] text-red-400">
                                        {loadForm.errors.amount}
                                    </p>
                                )}
                            </label>

                            <label className={darkLabelClass}>
                                Operational note
                                <textarea
                                    rows={4}
                                    placeholder="Optional note…"
                                    value={loadForm.data.note}
                                    onChange={(e) =>
                                        loadForm.setData('note', e.target.value)
                                    }
                                    className={`mt-1.5 ${darkTextareaClass}`}
                                    style={darkFieldStyle}
                                />
                            </label>
                        </fieldset>

                        {Object.values(loadForm.errors).length > 0 && (
                            <div
                                className="mt-3 rounded-xl px-3 py-2 text-xs text-red-300"
                                style={{
                                    background: '#ef444418',
                                    border: '1px solid #ef444433',
                                }}
                            >
                                {Object.values(loadForm.errors)[0]}
                            </div>
                        )}

                        {loadForm.wasSuccessful && (
                            <div
                                className="mt-3 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold"
                                style={{
                                    background: '#22c55e18',
                                    border: '1px solid #22c55e33',
                                    color: '#22c55e',
                                }}
                            >
                                <CheckCircle2 className="size-4" /> Cash loaded
                                successfully.
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={
                                !isAdmin ||
                                loadForm.processing ||
                                !loadForm.data.amount
                            }
                            className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                            style={{ background: CIM.accent, color: CIM.dark }}
                        >
                            {loadForm.processing
                                ? 'Loading…'
                                : 'Load cash into ATM'}
                            <ChevronRight className="size-4" />
                        </button>

                        {!isAdmin && (
                            <p className="mt-3 text-center text-[10px] text-slate-500">
                                Admin access required for cash and status
                                changes.
                            </p>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
}

/* ─────────────────────────────────── stat chip ── */
function StatChip({ icon: Icon, label, value, accent = CIM.accent }) {
    return (
        <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-2 text-white shadow-sm backdrop-blur">
            <Icon className="size-4" style={{ color: accent }} />
            <span className="text-xs text-white/70">{label}</span>
            <span className="text-sm font-bold text-white">{value}</span>
        </div>
    );
}

/* ─────────────────────────────────── main component ── */
export default function AtmsIndex({
    atms = [],
    summary = {},
    filters = {},
    areas = [],
    statuses = DEFAULT_STATUSES,
    isAdmin = false,
}) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [area, setArea] = useState(filters.area ?? '');
    const [status, setStatus] = useState(filters.status ?? '');
    const [selectedAtm, setSelectedAtm] = useState(atms[0] ?? null);
    const [locateRequest, setLocateRequest] = useState(0);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const mapRef = useRef(null);
    const canRenderMap = typeof window !== 'undefined';

    const focusIcon = useMemo(
        () => (canRenderMap ? buildFocusIcon() : null),
        [canRenderMap],
    );

    const filteredAtms = useMemo(() => {
        const q = search.trim().toLowerCase();
        return atms.filter((atm) => {
            const matchSearch =
                !q ||
                [atm.code, atm.name, atm.area, atm.address]
                    .filter(Boolean)
                    .join(' ')
                    .toLowerCase()
                    .includes(q);
            const matchArea = !area || atm.area === area;
            const matchStatus = !status || atm.status === status;
            return matchSearch && matchArea && matchStatus;
        });
    }, [atms, search, area, status]);

    useEffect(() => {
        if (!selectedAtm && filteredAtms.length > 0) {
            setSelectedAtm(filteredAtms[0]);
            return;
        }
        if (selectedAtm && !filteredAtms.some((a) => a.id === selectedAtm.id))
            setSelectedAtm(filteredAtms[0] ?? null);
    }, [filteredAtms]);

    const counts = {
        total: summary.total ?? atms.length,
        active: summary.active ?? 0,
        low_cash: summary.low_cash ?? 0,
        empty: summary.empty ?? 0,
        out_of_service: summary.out_of_service ?? 0,
        total_cash: summary.total_cash ?? 0,
    };

    const selectedPosition = atmPosition(selectedAtm);
    const resetFilters = () => {
        setSearch('');
        setArea('');
        setStatus('');
    };
    const openWorkstation = (atm) =>
        router.visit(adminAtms.show.url({ atm: atm.id }));

    return (
        <>
            <Head title="CIM ATM Operations" />

            <style>{`
                .leaflet-tile { filter: invert(1) hue-rotate(200deg) saturate(0.7) brightness(0.52) contrast(1.15) !important; }
                .leaflet-container { background: #060f1e !important; }
                .leaflet-control-zoom { display: none !important; }
                .leaflet-tooltip {
                    background: rgba(6,15,30,0.96) !important;
                    border: 1px solid rgba(255,255,255,0.10) !important;
                    border-radius: 10px !important;
                    color: #fff !important;
                    padding: 8px 12px !important;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.5) !important;
                    backdrop-filter: blur(12px) !important;
                }
                .leaflet-tooltip-top::before { border-top-color: rgba(255,255,255,0.10) !important; }
                .atm-readable-field,
                .atm-readable-field:disabled,
                fieldset:disabled .atm-readable-field {
                    color: ${readableFieldColor} !important;
                    -webkit-text-fill-color: ${readableFieldColor} !important;
                    background-color: ${readableFieldBackground} !important;
                    border-color: ${readableFieldBorder} !important;
                    caret-color: ${CIM.accent} !important;
                    opacity: 1 !important;
                }
                .atm-readable-field::placeholder {
                    color: ${readablePlaceholderColor} !important;
                    -webkit-text-fill-color: ${readablePlaceholderColor} !important;
                    opacity: 1 !important;
                }
                .atm-readable-field option {
                    background-color: ${CIM.white} !important;
                    color: ${CIM.dark} !important;
                    -webkit-text-fill-color: ${CIM.dark} !important;
                }
                .atm-readable-field:-webkit-autofill,
                .atm-readable-field:-webkit-autofill:hover,
                .atm-readable-field:-webkit-autofill:focus,
                .atm-readable-field:-webkit-autofill:disabled {
                    -webkit-text-fill-color: ${readableFieldColor} !important;
                    box-shadow: 0 0 0 1000px rgba(255,255,255,0.10) inset !important;
                    caret-color: ${CIM.accent} !important;
                }
            `}</style>

            {/* full-screen immersive layout */}
            <div
                className="relative flex w-full flex-col"
                style={{ minHeight: '100vh', background: '#060f1e' }}
            >
                {/* ── scrollable content wrapper ── */}
                <div className="flex flex-col" style={{ minHeight: '100vh' }}>
                    {/* ── top stats banner ── */}
                    <div
                        className="relative z-10 shrink-0"
                        style={{
                            background:
                                'linear-gradient(135deg,#061F39,#082F54)',
                            borderBottom: '1px solid rgba(255,255,255,0.07)',
                        }}
                    >
                        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(212,162,60,0.18),transparent_34%)]" />
                        <div className="relative mx-auto max-w-[1680px] px-4 py-4 sm:px-6 lg:px-8">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="flex size-10 items-center justify-center rounded-xl text-sm font-black text-[#061F39]"
                                        style={{ background: CIM.accent }}
                                    >
                                        CIM
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold tracking-widest text-white/50 uppercase">
                                            Staff Operations
                                        </p>
                                        <h1 className="text-xl font-bold tracking-tight text-white">
                                            CIM ATM Operations
                                        </h1>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <StatChip
                                        icon={MapPin}
                                        label="Total"
                                        value={counts.total}
                                        accent={CIM.accent}
                                    />
                                    <StatChip
                                        icon={Activity}
                                        label="Active"
                                        value={counts.active}
                                        accent={STATUS_META.active.color}
                                    />
                                    <StatChip
                                        icon={WalletCards}
                                        label="Low cash"
                                        value={counts.low_cash}
                                        accent={STATUS_META.low_cash.color}
                                    />
                                    <StatChip
                                        icon={CircleAlert}
                                        label="Empty"
                                        value={counts.empty}
                                        accent={STATUS_META.empty.color}
                                    />
                                    <StatChip
                                        icon={XCircle}
                                        label="Out of service"
                                        value={counts.out_of_service}
                                        accent={
                                            STATUS_META.out_of_service.color
                                        }
                                    />
                                    <StatChip
                                        icon={Banknote}
                                        label="Network cash"
                                        value={formatMad(counts.total_cash)}
                                        accent={CIM.accent}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── immersive map block ── */}
                    <div
                        className="relative shrink-0"
                        style={{ height: '80vh', minHeight: 520 }}
                    >
                        {/* map */}
                        {canRenderMap ? (
                            <MapContainer
                                center={DEFAULT_CENTER}
                                zoom={12}
                                scrollWheelZoom
                                zoomControl={false}
                                style={{
                                    position: 'absolute',
                                    inset: 0,
                                    zIndex: 0,
                                }}
                            >
                                <TileLayer
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                <MapEffects
                                    locateRequest={locateRequest}
                                    selectedPosition={selectedPosition}
                                    mapRef={mapRef}
                                />

                                {/* focus marker */}
                                {focusIcon && (
                                    <Marker
                                        position={DEFAULT_CENTER}
                                        icon={focusIcon}
                                        zIndexOffset={1000}
                                    >
                                        <Tooltip
                                            direction="top"
                                            offset={[0, -14]}
                                        >
                                            <div className="text-xs font-bold">
                                                Ain Sebaa — Operations Focus
                                            </div>
                                        </Tooltip>
                                    </Marker>
                                )}

                                {/* ATM markers */}
                                {filteredAtms.map((atm) => {
                                    const pos = atmPosition(atm);
                                    if (!pos) return null;
                                    const selected = selectedAtm?.id === atm.id;
                                    const icon = buildAtmIcon(atm, selected);
                                    const meta =
                                        STATUS_META[atm.status] ??
                                        STATUS_META.active;
                                    return (
                                        <Marker
                                            key={atm.id}
                                            position={pos}
                                            icon={icon}
                                            zIndexOffset={selected ? 900 : 0}
                                            eventHandlers={{
                                                click: () =>
                                                    setSelectedAtm(atm),
                                            }}
                                        >
                                            <Tooltip
                                                direction="top"
                                                offset={[0, -4]}
                                            >
                                                <div className="min-w-40">
                                                    <p className="font-mono text-[10px] text-slate-400 uppercase">
                                                        {atm.code}
                                                    </p>
                                                    <p className="text-sm font-bold">
                                                        {atm.name}
                                                    </p>
                                                    <p className="mt-0.5 text-xs text-slate-400">
                                                        {atm.area}
                                                    </p>
                                                    <div className="mt-1.5 flex items-center gap-1.5">
                                                        <span
                                                            className="size-1.5 rounded-full"
                                                            style={{
                                                                background:
                                                                    meta.color,
                                                            }}
                                                        />
                                                        <span className="text-xs">
                                                            {meta.label}
                                                        </span>
                                                        <span className="text-xs text-slate-400">
                                                            ·{' '}
                                                            {formatMad(
                                                                atm.current_cash,
                                                            )}
                                                        </span>
                                                        <span
                                                            className="text-[10px] font-bold"
                                                            style={{
                                                                color: meta.color,
                                                            }}
                                                        >
                                                            (
                                                            {Math.round(
                                                                cashFill(atm),
                                                            )}
                                                            %)
                                                        </span>
                                                    </div>
                                                </div>
                                            </Tooltip>
                                        </Marker>
                                    );
                                })}

                                <MapControls
                                    onLocate={() =>
                                        setLocateRequest((c) => c + 1)
                                    }
                                />
                            </MapContainer>
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-slate-500">
                                Loading operations map…
                            </div>
                        )}

                        {/* top bar overlay */}
                        <MapTopBar counts={counts} />

                        {/* floating sidebar */}
                        <div
                            className="absolute"
                            style={{
                                top: 48,
                                bottom: 0,
                                left: 0,
                                zIndex: 800,
                                pointerEvents: 'auto',
                            }}
                        >
                            <FloatingSidebar
                                atms={filteredAtms}
                                counts={counts}
                                search={search}
                                area={area}
                                status={status}
                                areas={areas}
                                selectedAtm={selectedAtm}
                                onSearch={setSearch}
                                onArea={setArea}
                                onStatus={setStatus}
                                onSelect={setSelectedAtm}
                                onClear={resetFilters}
                                collapsed={!sidebarOpen}
                                onToggle={() => setSidebarOpen((o) => !o)}
                            />
                        </div>

                        {/* selected ATM badge */}
                        {selectedAtm && (
                            <div
                                className="absolute top-16 right-4 z-[800] flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold"
                                style={{
                                    background: 'rgba(6,15,30,0.90)',
                                    border: `1px solid ${CIM.accent}44`,
                                    color: CIM.accent,
                                    backdropFilter: 'blur(12px)',
                                }}
                            >
                                <MapPin className="size-4" />
                                {selectedAtm.code} · {selectedAtm.name}
                            </div>
                        )}

                        {/* select hint */}
                        {!selectedAtm && (
                            <div className="pointer-events-none absolute bottom-6 left-1/2 z-[700] -translate-x-1/2">
                                <div
                                    className="flex items-center gap-2 rounded-full px-4 py-2 text-sm text-slate-300"
                                    style={{
                                        background: 'rgba(6,15,30,0.85)',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        backdropFilter: 'blur(12px)',
                                    }}
                                >
                                    <MapPin
                                        className="size-4"
                                        style={{ color: CIM.accent }}
                                    />
                                    Click an ATM marker or select from the
                                    register
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── admin tools section (below map) ── */}
                    <div
                        className="relative z-10 flex-1 px-4 py-5 sm:px-6 lg:px-8"
                        style={{
                            background: '#070e1c',
                            borderTop: '1px solid rgba(255,255,255,0.06)',
                        }}
                    >
                        <div className="mx-auto max-w-[1680px]">
                            <div className="mb-4">
                                <p className="text-[10px] font-bold tracking-widest text-slate-600 uppercase">
                                    Admin workstation
                                </p>
                                <h2 className="mt-0.5 text-lg font-bold text-white">
                                    {selectedAtm
                                        ? `Managing: ${selectedAtm.name}`
                                        : 'Select a terminal to manage'}
                                </h2>
                            </div>
                            <AdminToolsPanel
                                atm={selectedAtm}
                                isAdmin={isAdmin}
                                onOpenFull={openWorkstation}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
