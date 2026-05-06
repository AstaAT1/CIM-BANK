import 'leaflet/dist/leaflet.css';

import { Head, useForm } from '@inertiajs/react';
import L from 'leaflet';
import {
    AlertTriangle,
    Banknote,
    Building2,
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    ChevronUp,
    LocateFixed,
    MapPin,
    Minus,
    Navigation,
    Plus,
    Route,
    Search,
    ShieldCheck,
    WalletCards,
    X,
    Zap,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
    MapContainer,
    Marker,
    Polyline,
    TileLayer,
    Tooltip,
    useMap,
    useMapEvents,
} from 'react-leaflet';

/* ─────────────────────────────────────────── palette ── */
const CIM = {
    primary:    '#082F54',
    secondary:  '#0A6474',
    accent:     '#D4A23C',
    dark:       '#061F39',
    background: '#F7F8FA',
    white:      '#FFFFFF',
    border:     '#D1D9DA',
};

const LIONSGEEK_LOCATION = [33.6087, -7.5396];

/* ─────────────────────────────────────────── status ── */
const STATUS = {
    active:         { label: 'Active',          color: '#22C55E', glow: '#22C55E55', text: '#15803D', bg: '#F0FDF4', border: '#86EFAC' },
    low_cash:       { label: 'Low cash',        color: '#F59E0B', glow: '#F59E0B55', text: '#92400E', bg: '#FFFBEB', border: '#FCD34D' },
    empty:          { label: 'Empty',           color: '#EF4444', glow: '#EF444455', text: '#991B1B', bg: '#FEF2F2', border: '#FCA5A5' },
    out_of_service: { label: 'Out of service',  color: '#6B7280', glow: '#6B728055', text: '#374151', bg: '#F9FAFB', border: '#D1D5DB' },
};

const FILTERS = [
    { key: 'all',            label: 'All ATMs',       icon: MapPin       },
    { key: 'active',         label: 'Active',         icon: CheckCircle2 },
    { key: 'low_cash',       label: 'Low cash',       icon: AlertTriangle},
    { key: 'empty',          label: 'Empty',          icon: WalletCards  },
    { key: 'out_of_service', label: 'Out of service', icon: Building2    },
];

/* ─────────────────────────────────────────── helpers ── */
function asNumber(v)     { const n = Number(v ?? 0); return Number.isFinite(n) ? n : 0; }
function formatMad(v)    { return `${asNumber(v).toLocaleString('fr-MA', { maximumFractionDigits: 0 })} MAD`; }
function cashFill(atm)   { const m = asNumber(atm?.max_capacity); return m > 0 ? Math.max(0, Math.min(100, (asNumber(atm.current_cash) / m) * 100)) : 0; }
function isWithdrawable(atm) { return atm?.is_active && !['empty', 'out_of_service'].includes(atm.status); }
function atmPosition(atm) { const lat = asNumber(atm?.latitude), lng = asNumber(atm?.longitude); return lat && lng ? [lat, lng] : null; }
function distanceKm(from, to) {
    if (!from || !to) return null;
    const R = 6371, r = v => (v * Math.PI) / 180;
    const dLat = r(to[0] - from[0]), dLng = r(to[1] - from[1]);
    const a = Math.sin(dLat/2)**2 + Math.cos(r(from[0])) * Math.cos(r(to[0])) * Math.sin(dLng/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function formatDistance(v) {
    if (v == null) return '—';
    return v < 1 ? `${Math.round(v * 1000)} m` : `${v.toFixed(1)} km`;
}

/* ────────────────────────────── custom DivIcon marker ── */
function buildAtmIcon(atm, selected) {
    const meta    = STATUS[atm?.status] ?? STATUS.active;
    const fill    = cashFill(atm);
    const color   = meta.color;
    const size    = selected ? 52 : 40;
    const ring    = selected ? 4  : 2.5;
    const glowR   = selected ? 18 : 0;

    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size + 10}" viewBox="0 0 ${size} ${size + 10}">
  <defs>
    <filter id="s${atm.id}" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="3" stdDeviation="${selected ? 6 : 3}" flood-color="${color}" flood-opacity="${selected ? 0.7 : 0.4}"/>
    </filter>
    ${selected ? `<filter id="g${atm.id}">
      <feGaussianBlur stdDeviation="5" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>` : ''}
  </defs>
  <!-- pin body -->
  <circle cx="${size/2}" cy="${size/2}" r="${size/2 - ring}" fill="${CIM.dark}" stroke="${color}" stroke-width="${ring}" filter="url(#s${atm.id})"/>
  <!-- inner colored ring -->
  <circle cx="${size/2}" cy="${size/2}" r="${size/2 - ring - 4}" fill="${color}22"/>
  <!-- banknote icon, centered -->
  <text x="${size/2}" y="${size/2 + 5}" font-size="${selected ? 18 : 14}" text-anchor="middle" fill="${color}" font-family="monospace" font-weight="bold">₪</text>
  <!-- pin tail -->
  <polygon points="${size/2 - 5},${size - 2} ${size/2 + 5},${size - 2} ${size/2},${size + 9}" fill="${color}" filter="url(#s${atm.id})"/>
  ${selected ? `<circle cx="${size/2}" cy="${size/2}" r="${glowR}" fill="none" stroke="${color}" stroke-width="1.5" opacity="0.4"/>` : ''}
</svg>`;

    return L.divIcon({
        html: svg,
        iconSize:   [size, size + 10],
        iconAnchor: [size / 2, size + 10],
        tooltipAnchor: [0, -(size + 14)],
        className: '',
    });
}

function buildUserIcon() {
    const size = 38;
    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <filter id="uf">
      <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="${CIM.accent}" flood-opacity="0.7"/>
    </filter>
  </defs>
  <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 3}" fill="${CIM.primary}" stroke="${CIM.accent}" stroke-width="3" filter="url(#uf)"/>
  <circle cx="${size/2}" cy="${size/2}" r="5" fill="${CIM.accent}"/>
  <circle cx="${size/2}" cy="${size/2}" r="10" fill="none" stroke="${CIM.accent}" stroke-width="1.2" opacity="0.5"/>
</svg>`;
    return L.divIcon({
        html: svg,
        iconSize:   [size, size],
        iconAnchor: [size / 2, size / 2],
        className: '',
    });
}

/* ─────────────────────────────── map effects hook ── */
function MapEffects({ locateRequest, selectedPosition, userLocation, mapRef }) {
    const map = useMap();

    useEffect(() => {
        mapRef.current = map;
    }, [map]);

    useEffect(() => {
        if (selectedPosition && userLocation) {
            map.fitBounds([userLocation, selectedPosition], { animate: true, duration: 0.85, padding: [90, 90] });
        } else if (selectedPosition) {
            map.flyTo(selectedPosition, 15, { duration: 0.85 });
        }
    }, [selectedPosition]);

    useEffect(() => {
        if (locateRequest > 0 && userLocation) {
            map.flyTo(userLocation, 15, { duration: 0.85 });
        }
    }, [locateRequest]);

    return null;
}

/* ─────────────────────────────── status badge ── */
function StatusBadge({ status, size = 'sm' }) {
    const meta = STATUS[status] ?? STATUS.active;
    const px = size === 'xs' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold border ${px}`}
            style={{ background: meta.bg, borderColor: meta.border, color: meta.text }}>
            <span className="size-1.5 rounded-full" style={{ background: meta.color }} />
            {meta.label}
        </span>
    );
}

/* ─────────────────────────────── cash bar ── */
function CashBar({ atm }) {
    const fill  = cashFill(atm);
    const color = fill >= 40 ? STATUS.active.color : fill >= 15 ? STATUS.low_cash.color : STATUS.empty.color;
    return (
        <div>
            <div className="mb-1.5 flex justify-between text-[11px]">
                <span className="text-slate-400 font-medium">Cash level</span>
                <span className="font-bold" style={{ color }}>{Math.round(fill)}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700"
                     style={{ width: `${fill}%`, background: color, boxShadow: `0 0 6px ${color}99` }} />
            </div>
            <div className="mt-1.5 flex justify-between text-[10px] text-slate-500">
                <span>{formatMad(atm.current_cash)}</span>
                <span>Max {formatMad(atm.max_capacity)}</span>
            </div>
        </div>
    );
}

/* ─────────────────────────────── sidebar ATM card ── */
function AtmCard({ atm, selected, onSelect, userLocation }) {
    const meta = STATUS[atm.status] ?? STATUS.active;
    const pos  = atmPosition(atm);
    const dist = distanceKm(userLocation, pos);
    return (
        <button
            onClick={() => onSelect(atm)}
            className="w-full text-left rounded-xl border transition-all duration-200 p-3 group"
            style={{
                background:   selected ? 'rgba(212,162,60,0.08)' : 'rgba(255,255,255,0.04)',
                borderColor:  selected ? CIM.accent : 'rgba(255,255,255,0.08)',
                boxShadow:    selected ? `0 0 0 1px ${CIM.accent}44` : 'none',
            }}
            type="button"
        >
            <div className="flex items-start gap-2.5">
                <div className="mt-0.5 size-8 rounded-lg shrink-0 flex items-center justify-center"
                     style={{ background: `${meta.color}20`, border: `1.5px solid ${meta.color}55` }}>
                    <span className="text-xs font-black" style={{ color: meta.color }}>₪</span>
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white truncate">{atm.name}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">{atm.area ?? 'Casablanca'}</p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                        <StatusBadge status={atm.status} size="xs" />
                        {dist != null && (
                            <span className="text-[10px] font-bold text-slate-400">{formatDistance(dist)}</span>
                        )}
                    </div>
                    <div className="mt-2">
                        <CashBar atm={atm} />
                    </div>
                </div>
            </div>
        </button>
    );
}

/* ─────────────────────────────── floating sidebar ── */
function FloatingSidebar({
    atms, counts, search, selectedAtm, statusFilter,
    onFilter, onSearch, onSelect, userLocation, collapsed, onToggle,
}) {
    return (
        <div className="absolute top-0 left-0 h-full z-[900] flex">
            <div
                className="h-full flex flex-col transition-all duration-300 overflow-hidden"
                style={{
                    width: collapsed ? 0 : 300,
                    background: 'rgba(6,15,30,0.92)',
                    backdropFilter: 'blur(20px)',
                    borderRight: '1px solid rgba(255,255,255,0.06)',
                }}
            >
                {!collapsed && (
                    <div className="flex flex-col h-full overflow-hidden">
                        {/* sidebar header */}
                        <div className="p-4 border-b border-white/8 shrink-0">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="size-9 rounded-lg bg-[#D4A23C] flex items-center justify-center text-[#061F39] text-xs font-black shrink-0">CIM</div>
                                <div>
                                    <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest">ATM Network</p>
                                    <h2 className="text-sm font-bold text-white">Casablanca ATMs</h2>
                                </div>
                                <span className="ml-auto text-xs font-bold rounded-full px-2 py-0.5"
                                      style={{ background: `${CIM.accent}22`, color: CIM.accent }}>{counts.all ?? 0}</span>
                            </div>
                            {/* search */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-500 pointer-events-none" />
                                <input
                                    className="w-full h-9 pl-8 pr-3 rounded-lg text-sm text-white placeholder-slate-500 outline-none transition"
                                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
                                    placeholder="Search ATM, area, code…"
                                    value={search}
                                    onChange={e => onSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* filters */}
                        <div className="px-3 py-3 border-b border-white/8 shrink-0 space-y-1">
                            {FILTERS.map(f => {
                                const active = statusFilter === f.key;
                                const meta   = STATUS[f.key];
                                const Icon   = f.icon;
                                return (
                                    <button
                                        key={f.key}
                                        onClick={() => onFilter(f.key)}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150"
                                        style={{
                                            background:  active ? `${CIM.accent}18` : 'transparent',
                                            color:       active ? CIM.accent : '#94A3B8',
                                            borderLeft:  active ? `2px solid ${CIM.accent}` : '2px solid transparent',
                                        }}
                                        type="button"
                                    >
                                        {meta && (
                                            <span className="size-2 rounded-full shrink-0"
                                                  style={{ background: active ? CIM.accent : meta.color }} />
                                        )}
                                        {!meta && <Icon className="size-3.5 shrink-0" />}
                                        <span className="font-medium flex-1 text-left">{f.label}</span>
                                        <span className="text-[10px] font-bold rounded-full px-1.5 py-0.5"
                                              style={{ background: 'rgba(255,255,255,0.06)', color: active ? CIM.accent : '#64748B' }}>
                                            {counts[f.key] ?? 0}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* ATM list */}
                        <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
                            {atms.length === 0 ? (
                                <p className="text-sm text-slate-500 text-center mt-8">No ATMs match your search.</p>
                            ) : atms.map(atm => (
                                <AtmCard
                                    key={atm.id}
                                    atm={atm}
                                    selected={selectedAtm?.id === atm.id}
                                    onSelect={onSelect}
                                    userLocation={userLocation}
                                />
                            ))}
                        </div>

                        {/* legend */}
                        <div className="p-3 border-t border-white/8 shrink-0">
                            <p className="text-[10px] text-slate-600 font-semibold uppercase tracking-widest mb-2">Legend</p>
                            <div className="grid grid-cols-2 gap-1.5">
                                {Object.entries(STATUS).map(([key, meta]) => (
                                    <div key={key} className="flex items-center gap-1.5 text-[10px] text-slate-400">
                                        <span className="size-2 rounded-full shrink-0" style={{ background: meta.color }} />
                                        {meta.label}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* toggle tab */}
            <button
                onClick={onToggle}
                className="absolute top-1/2 -translate-y-1/2 flex items-center justify-center rounded-r-lg transition-all duration-200 hover:scale-105"
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
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
                {collapsed ? <ChevronRight className="size-3.5" /> : <ChevronRight className="size-3.5 rotate-180" />}
            </button>
        </div>
    );
}

/* ─────────────────────────────── map top bar ── */
function MapTopBar({ locationLabel, counts }) {
    return (
        <div
            className="absolute top-0 left-0 right-0 z-[800] flex items-center justify-between px-4 py-2.5"
            style={{
                background: 'rgba(6,15,30,0.85)',
                backdropFilter: 'blur(14px)',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}
        >
            <a
                href="/dashboard"
                className="flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors"
            >
                <ChevronRight className="size-4 rotate-180" />
                Dashboard
            </a>

            <div className="flex items-center gap-2">
                <div className="size-7 rounded-md bg-[#D4A23C] flex items-center justify-center text-[#061F39] text-[10px] font-black">CIM</div>
                <span className="text-sm font-bold text-white tracking-tight">ATM Locator</span>
                <span className="hidden sm:inline text-slate-600">·</span>
                <span className="hidden sm:inline text-xs text-slate-400">Casablanca</span>
            </div>

            <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
                     style={{ background: `${STATUS.active.color}18`, color: STATUS.active.color, border: `1px solid ${STATUS.active.color}33` }}>
                    <span className="size-1.5 rounded-full animate-pulse" style={{ background: STATUS.active.color }} />
                    {counts.active ?? 0} Active
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Navigation className="size-3.5" />
                    <span className="hidden md:inline">{locationLabel}</span>
                </div>
            </div>
        </div>
    );
}

/* ─────────────────────────────── floating map controls ── */
function MapControls({ onLocate }) {
    const map = useMap();
    return (
        <div className="absolute bottom-8 right-4 z-[800] flex flex-col gap-2">
            {[
                { icon: Plus,          action: () => map.zoomIn(),    tip: 'Zoom in'    },
                { icon: Minus,         action: () => map.zoomOut(),   tip: 'Zoom out'   },
                { icon: LocateFixed,   action: onLocate,              tip: 'Locate me'  },
            ].map(({ icon: Icon, action, tip }) => (
                <button
                    key={tip}
                    onClick={action}
                    title={tip}
                    className="size-10 flex items-center justify-center rounded-xl transition-all duration-150 hover:scale-105 hover:brightness-110"
                    style={{
                        background: 'rgba(6,15,30,0.90)',
                        border: '1px solid rgba(255,255,255,0.10)',
                        color: CIM.accent,
                        backdropFilter: 'blur(10px)',
                    }}
                    type="button"
                >
                    <Icon className="size-4.5" />
                </button>
            ))}
        </div>
    );
}

/* ─────────────────────────────── selected ATM panel ── */
function SelectedAtmPanel({ atm, bankAccounts, locationLabel, onClose, routeDistance }) {
    const available = atm ? isWithdrawable(atm) : false;
    const form = useForm({ atm_id: atm?.id ?? '', bank_account_id: bankAccounts[0]?.id ?? '', amount: '' });
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        if (atm) { form.setData('atm_id', atm.id); form.reset('amount'); setExpanded(true); }
    }, [atm?.id]);

    const selectedAccount = bankAccounts.find(a => String(a.id) === String(form.data.bank_account_id));

    const submit = e => {
        e.preventDefault();
        form.post('/backend/customer/atm-withdrawals', { preserveScroll: true, onSuccess: () => form.reset('amount') });
    };

    if (!atm) return null;

    const meta = STATUS[atm.status] ?? STATUS.active;

    return (
        <div
            className="absolute bottom-0 right-0 z-[850] flex flex-col transition-all duration-300 overflow-hidden"
            style={{
                width: 360,
                maxHeight: expanded ? '90%' : 'auto',
                background: 'rgba(6,15,30,0.95)',
                backdropFilter: 'blur(20px)',
                borderTop: `1px solid rgba(255,255,255,0.08)`,
                borderLeft: `1px solid rgba(255,255,255,0.08)`,
                borderTopLeftRadius: 16,
            }}
        >
            {/* header */}
            <div className="p-4 shrink-0 border-b border-white/8">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                        <div className="size-10 rounded-xl flex items-center justify-center shrink-0"
                             style={{ background: `${meta.color}20`, border: `1.5px solid ${meta.color}55` }}>
                            <span className="text-base font-black" style={{ color: meta.color }}>₪</span>
                        </div>
                        <div>
                            <p className="font-mono text-[10px] text-slate-500 uppercase">{atm.code}</p>
                            <h3 className="text-base font-bold text-white leading-tight mt-0.5">{atm.name}</h3>
                            <p className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                                <MapPin className="size-3 shrink-0" style={{ color: CIM.accent }} />
                                {atm.area ?? 'Casablanca'}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-1.5">
                        <button onClick={() => setExpanded(e => !e)}
                                className="size-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-white transition"
                                style={{ background: 'rgba(255,255,255,0.06)' }} type="button">
                            {expanded ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
                        </button>
                        <button onClick={onClose}
                                className="size-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-white transition"
                                style={{ background: 'rgba(255,255,255,0.06)' }} type="button">
                            <X className="size-4" />
                        </button>
                    </div>
                </div>
            </div>

            {expanded && (
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* status + badges */}
                    <div className="flex flex-wrap gap-2">
                        <StatusBadge status={atm.status} />
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border"
                              style={{ background: available ? '#0F2' + '11' : '#F0011122', borderColor: available ? '#22c55e33' : '#ef444433', color: available ? '#22c55e' : '#ef4444' }}>
                            <ShieldCheck className="size-3" />
                            {available ? 'Available' : 'Unavailable'}
                        </span>
                    </div>

                    {/* address */}
                    <p className="text-xs text-slate-400 leading-5">{atm.address}</p>

                    {/* stats grid */}
                    <div className="grid grid-cols-3 gap-2">
                        {[
                            { label: 'Current cash',   val: formatMad(atm.current_cash)  },
                            { label: 'Max capacity',   val: formatMad(atm.max_capacity)   },
                            { label: 'Distance',       val: formatDistance(routeDistance)  },
                        ].map(({ label, val }) => (
                            <div key={label} className="rounded-xl p-3 text-center"
                                 style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                                <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wide">{label}</p>
                                <p className="text-sm font-bold text-white mt-1">{val}</p>
                            </div>
                        ))}
                    </div>

                    {/* cash bar */}
                    <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <CashBar atm={atm} />
                    </div>

                    {/* route info */}
                    <div className="flex items-center gap-3 rounded-xl p-3"
                         style={{ background: `${CIM.accent}0D`, border: `1px solid ${CIM.accent}22` }}>
                        <Route className="size-5 shrink-0" style={{ color: CIM.accent }} />
                        <p className="text-xs text-slate-300 leading-5">Route from <span className="font-semibold text-white">{locationLabel}</span> is shown on the map.</p>
                    </div>

                    {/* success */}
                    {form.wasSuccessful && (
                        <div className="rounded-xl px-3 py-2 text-xs font-semibold flex items-center gap-2"
                             style={{ background: '#22c55e18', border: '1px solid #22c55e33', color: '#22c55e' }}>
                            <CheckCircle2 className="size-4" /> Withdrawal completed successfully.
                        </div>
                    )}

                    {/* withdrawal form */}
                    <form onSubmit={submit} className="rounded-xl p-4 space-y-4"
                          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <div className="flex items-center gap-2">
                            <div className="size-8 rounded-lg flex items-center justify-center" style={{ background: `${CIM.accent}18` }}>
                                <Banknote className="size-4" style={{ color: CIM.accent }} />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-white">Withdraw from ATM</h4>
                                <p className="text-[10px] text-slate-500">Select account and enter amount</p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[11px] font-semibold text-slate-400 mb-1.5" htmlFor="bank_account_id">Account</label>
                            <select
                                id="bank_account_id"
                                disabled={!available || bankAccounts.length === 0}
                                value={form.data.bank_account_id}
                                onChange={e => form.setData('bank_account_id', e.target.value)}
                                className="w-full h-10 rounded-lg px-3 text-sm text-white outline-none transition disabled:opacity-50"
                                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
                            >
                                {bankAccounts.length === 0
                                    ? <option value="">No active account</option>
                                    : bankAccounts.map(a => (
                                        <option key={a.id} value={a.id} style={{ background: '#0c1a2e' }}>
                                            {a.account_number} — {formatMad(a.balance)}
                                        </option>
                                    ))}
                            </select>
                            {selectedAccount && (
                                <p className="mt-1 text-[10px] text-slate-500">
                                    Balance: <span className="font-semibold text-slate-300">{formatMad(selectedAccount.balance)}</span>
                                </p>
                            )}
                            {form.errors.bank_account_id && <p className="mt-1 text-[10px] text-red-400">{form.errors.bank_account_id}</p>}
                        </div>

                        <div>
                            <label className="block text-[11px] font-semibold text-slate-400 mb-1.5" htmlFor="amount">Amount</label>
                            <div className="flex overflow-hidden rounded-lg" style={{ border: '1px solid rgba(255,255,255,0.12)' }}>
                                <input
                                    id="amount"
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    placeholder="0"
                                    disabled={!available}
                                    value={form.data.amount}
                                    onChange={e => form.setData('amount', e.target.value)}
                                    className="flex-1 h-10 bg-transparent px-3 text-base font-bold text-white outline-none placeholder-slate-600 disabled:opacity-50"
                                />
                                <span className="flex items-center border-l px-3 text-xs font-bold text-slate-500"
                                      style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}>MAD</span>
                            </div>
                            {form.errors.amount  && <p className="mt-1 text-[10px] text-red-400">{form.errors.amount}</p>}
                            {form.errors.atm_id  && <p className="mt-1 text-[10px] text-red-400">{form.errors.atm_id}</p>}
                        </div>

                        {!available && (
                            <p className="rounded-lg px-3 py-2 text-xs text-red-300"
                               style={{ background: '#ef444418', border: '1px solid #ef444433' }}>
                                This ATM is not available for withdrawal.
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={form.processing || !available || !form.data.amount || bankAccounts.length === 0}
                            className="w-full h-10 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all duration-200 hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
                            style={{ background: CIM.accent, color: CIM.dark }}
                        >
                            {form.processing ? 'Processing…' : 'Withdraw from ATM'}
                            <ChevronRight className="size-4" />
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}

/* ─────────────────────────────── empty selection hint ── */
function SelectHint() {
    return (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[700] pointer-events-none">
            <div className="flex items-center gap-2 rounded-full px-4 py-2 text-sm text-slate-300"
                 style={{ background: 'rgba(6,15,30,0.85)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}>
                <MapPin className="size-4" style={{ color: CIM.accent }} />
                Click an ATM marker or select from the list
            </div>
        </div>
    );
}

/* ─────────────────────────────── inner map controls wrapper ── */
function InnerControls({ onLocate }) {
    return <MapControls onLocate={onLocate} />;
}

/* ─────────────────────────────── main component ── */
export default function AtmMapIndex({
    atms          = [],
    bankAccounts  = [],
    mapCenter     = { lat: 33.5731, lng: -7.5898 },
    defaultFocus  = null,
}) {
    const [selectedAtm,   setSelectedAtm]   = useState(null);
    const [statusFilter,  setStatusFilter]  = useState('all');
    const [search,        setSearch]        = useState('');
    const [locateRequest, setLocateRequest] = useState(0);
    const [userLocation,  setUserLocation]  = useState(LIONSGEEK_LOCATION);
    const [locationSource,setLocationSource]= useState('fallback');
    const [sidebarOpen,   setSidebarOpen]   = useState(true);
    const mapRef = useRef(null);
    const canRenderMap = typeof window !== 'undefined';

    const initialCenter = defaultFocus
        ? [asNumber(defaultFocus.lat), asNumber(defaultFocus.lng)]
        : [asNumber(mapCenter.lat), asNumber(mapCenter.lng)];

    const filteredAtms = useMemo(() => {
        const q = search.trim().toLowerCase();
        return atms.filter(atm => {
            const matchStatus = statusFilter === 'all' || atm.status === statusFilter;
            const matchSearch = !q || [atm.name, atm.area, atm.code, atm.address].filter(Boolean).join(' ').toLowerCase().includes(q);
            return matchStatus && matchSearch;
        });
    }, [atms, search, statusFilter]);

    const counts = useMemo(() =>
        FILTERS.reduce((acc, f) => {
            acc[f.key] = f.key === 'all' ? atms.length : atms.filter(a => a.status === f.key).length;
            return acc;
        }, {}),
    [atms]);

    const selectedPosition = atmPosition(selectedAtm);
    const routeDistance    = distanceKm(userLocation, selectedPosition);
    const locationLabel    = locationSource === 'browser' ? 'your location' : 'LionsGeek, Ain Sebaa';

    useEffect(() => {
        if (!canRenderMap || !navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            pos => { setUserLocation([pos.coords.latitude, pos.coords.longitude]); setLocationSource('browser'); },
            ()  => { setUserLocation(LIONSGEEK_LOCATION); setLocationSource('fallback'); },
            { enableHighAccuracy: true, maximumAge: 60000, timeout: 8000 },
        );
    }, [canRenderMap]);

    const userIcon    = useMemo(() => canRenderMap ? buildUserIcon() : null, [canRenderMap]);

    return (
        <>
            <Head title="CIM ATM Locator" />

            {/* Global dark-map CSS override */}
            <style>{`
                .leaflet-tile { filter: invert(1) hue-rotate(200deg) saturate(0.7) brightness(0.55) contrast(1.15) !important; }
                .leaflet-container { background: #060f1e !important; }
                .leaflet-control-zoom { display: none !important; }
                .leaflet-tooltip { background: rgba(6,15,30,0.95) !important; border: 1px solid rgba(255,255,255,0.1) !important; border-radius: 10px !important; color: #fff !important; padding: 8px 12px !important; box-shadow: 0 8px 32px rgba(0,0,0,0.5) !important; backdrop-filter: blur(12px) !important; }
                .leaflet-tooltip-top::before { border-top-color: rgba(255,255,255,0.1) !important; }
            `}</style>

            <main className="relative w-full overflow-hidden" style={{ height: '100vh', background: '#060f1e' }}>
                {canRenderMap ? (
                    <MapContainer
                        center={initialCenter}
                        zoom={13}
                        scrollWheelZoom
                        zoomControl={false}
                        style={{ position: 'absolute', inset: 0, zIndex: 0 }}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        <MapEffects
                            locateRequest={locateRequest}
                            selectedPosition={selectedPosition}
                            userLocation={userLocation}
                            mapRef={mapRef}
                        />

                        {/* route lines */}
                        {selectedPosition && (
                            <>
                                <Polyline
                                    positions={[userLocation, selectedPosition]}
                                    pathOptions={{ color: CIM.primary, weight: 10, opacity: 0.25 }}
                                />
                                <Polyline
                                    positions={[userLocation, selectedPosition]}
                                    pathOptions={{ color: CIM.accent, weight: 3, opacity: 0.9, dashArray: '10 8' }}
                                />
                            </>
                        )}

                        {/* user marker */}
                        {userIcon && (
                            <Marker position={userLocation} icon={userIcon} zIndexOffset={1000}>
                                <Tooltip direction="top" offset={[0, -14]}>
                                    <div className="text-xs font-bold">{locationLabel}</div>
                                </Tooltip>
                            </Marker>
                        )}

                        {/* ATM markers */}
                        {filteredAtms.map(atm => {
                            const pos = atmPosition(atm);
                            if (!pos) return null;
                            const selected = selectedAtm?.id === atm.id;
                            const icon = buildAtmIcon(atm, selected);
                            return (
                                <Marker
                                    key={atm.id}
                                    position={pos}
                                    icon={icon}
                                    zIndexOffset={selected ? 900 : 0}
                                    eventHandlers={{ click: () => setSelectedAtm(atm) }}
                                >
                                    <Tooltip direction="top" offset={[0, -4]}>
                                        <div className="min-w-36">
                                            <div className="font-bold text-sm">{atm.name}</div>
                                            <div className="text-slate-400 text-xs mt-0.5">{atm.area ?? 'Casablanca'}</div>
                                            <div className="flex items-center gap-1.5 mt-1.5">
                                                <span className="size-1.5 rounded-full" style={{ background: (STATUS[atm.status] ?? STATUS.active).color }} />
                                                <span className="text-xs">{(STATUS[atm.status] ?? STATUS.active).label}</span>
                                                <span className="text-slate-400 text-xs">· {formatMad(atm.current_cash)}</span>
                                            </div>
                                        </div>
                                    </Tooltip>
                                </Marker>
                            );
                        })}

                        {/* floating zoom/locate controls inside map */}
                        <InnerControls onLocate={() => setLocateRequest(c => c + 1)} />
                    </MapContainer>
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-500">Loading map…</div>
                )}

                {/* top bar */}
                <MapTopBar locationLabel={locationLabel} counts={counts} />

                {/* sidebar */}
                <div className="absolute" style={{ top: 48, bottom: 0, left: 0, zIndex: 800, pointerEvents: 'auto' }}>
                    <FloatingSidebar
                        atms={filteredAtms}
                        counts={counts}
                        search={search}
                        selectedAtm={selectedAtm}
                        statusFilter={statusFilter}
                        onFilter={setStatusFilter}
                        onSearch={setSearch}
                        onSelect={setSelectedAtm}
                        userLocation={userLocation}
                        collapsed={!sidebarOpen}
                        onToggle={() => setSidebarOpen(o => !o)}
                    />
                </div>

                {/* distance badge */}
                {selectedAtm && routeDistance != null && (
                    <div className="absolute top-16 right-4 z-[800] rounded-xl px-4 py-2 text-sm font-bold flex items-center gap-2"
                         style={{ background: 'rgba(6,15,30,0.90)', border: `1px solid ${CIM.accent}44`, color: CIM.accent, backdropFilter: 'blur(12px)' }}>
                        <Route className="size-4" />
                        {formatDistance(routeDistance)}
                    </div>
                )}

                {/* detail panel */}
                <div className="absolute" style={{ bottom: 0, right: 0, top: 48, zIndex: 849, pointerEvents: 'auto' }}>
                    <SelectedAtmPanel
                        atm={selectedAtm}
                        bankAccounts={bankAccounts}
                        locationLabel={locationLabel}
                        onClose={() => setSelectedAtm(null)}
                        routeDistance={routeDistance}
                    />
                </div>

                {/* select hint */}
                {!selectedAtm && <SelectHint />}
            </main>
        </>
    );
}
