import { AnimatePresence, motion } from 'motion/react';
import {
    AlertTriangle,
    CheckCircle2,
    Info,
    ShieldAlert,
    X,
    XCircle,
} from 'lucide-react';

const TYPE_META = {
    success: {
        icon: CheckCircle2,
        accent: 'text-emerald-600 dark:text-emerald-300',
        glow: 'bg-emerald-500/12 ring-emerald-400/30',
    },
    error: {
        icon: XCircle,
        accent: 'text-rose-600 dark:text-rose-300',
        glow: 'bg-rose-500/12 ring-rose-400/30',
    },
    warning: {
        icon: AlertTriangle,
        accent: 'text-[#D4A23C]',
        glow: 'bg-[#D4A23C]/14 ring-[#D4A23C]/35',
    },
    info: {
        icon: Info,
        accent: 'text-[#0A6474] dark:text-cyan-200',
        glow: 'bg-[#0A6474]/12 ring-[#0A6474]/30',
    },
    confirm: {
        icon: ShieldAlert,
        accent: 'text-[#D4A23C]',
        glow: 'bg-[#D4A23C]/14 ring-[#D4A23C]/35',
    },
};

export default function CimFeedbackModal({
    open,
    type = 'info',
    title,
    message,
    confirmLabel,
    cancelLabel = 'Cancel',
    onConfirm,
    onClose,
}) {
    const meta = TYPE_META[type] ?? TYPE_META.info;
    const Icon = meta.icon;
    const isConfirm = type === 'confirm' || Boolean(onConfirm);

    return (
        <AnimatePresence>
            {open ? (
                <motion.div
                    className="fixed inset-0 z-[80] flex items-center justify-center px-4 py-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    role="presentation"
                >
                    <motion.button
                        type="button"
                        aria-label="Close feedback dialog"
                        className="absolute inset-0 bg-[#061F39]/58 backdrop-blur-md dark:bg-black/62"
                        onClick={onClose}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    />

                    <motion.section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="cim-feedback-title"
                        className="relative w-full max-w-md overflow-hidden rounded-[1.35rem] border border-[#D1D9DA]/85 bg-white/94 p-6 text-[#061F39] shadow-[0_30px_90px_rgba(6,31,57,0.26)] backdrop-blur-2xl dark:border-white/12 dark:bg-[#061F39]/92 dark:text-white"
                        initial={{ opacity: 0, y: 18, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 12, scale: 0.98 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                    >
                        <div className="pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full bg-[#D4A23C]/16 blur-3xl" />
                        <div className="pointer-events-none absolute -bottom-20 -left-16 h-40 w-40 rounded-full bg-[#0A6474]/14 blur-3xl" />

                        <button
                            type="button"
                            aria-label="Close"
                            onClick={onClose}
                            className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#D1D9DA]/70 bg-white/80 text-[#082F54] transition hover:border-[#D4A23C] hover:text-[#061F39] dark:border-white/12 dark:bg-white/8 dark:text-white/72 dark:hover:text-white"
                        >
                            <X className="h-4 w-4" />
                        </button>

                        <div className="relative pr-8">
                            <div
                                className={`mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl ring-1 ${meta.glow}`}
                            >
                                <Icon className={`h-7 w-7 ${meta.accent}`} />
                            </div>

                            <h2
                                id="cim-feedback-title"
                                className="text-xl font-bold tracking-normal text-[#061F39] dark:text-white"
                            >
                                {title}
                            </h2>

                            {message ? (
                                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-white/68">
                                    {message}
                                </p>
                            ) : null}
                        </div>

                        <div className="relative mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            {isConfirm ? (
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="inline-flex h-11 items-center justify-center rounded-2xl border border-[#D1D9DA] bg-white px-5 text-sm font-bold text-[#082F54] transition hover:border-[#D4A23C] dark:border-white/12 dark:bg-white/8 dark:text-white"
                                >
                                    {cancelLabel}
                                </button>
                            ) : null}

                            <button
                                type="button"
                                onClick={onConfirm ?? onClose}
                                className="inline-flex h-11 items-center justify-center rounded-2xl bg-[#D4A23C] px-5 text-sm font-bold text-[#061F39] shadow-lg shadow-[#D4A23C]/20 transition hover:-translate-y-0.5 hover:bg-[#e2b34a]"
                            >
                                {confirmLabel ?? (isConfirm ? 'Confirm' : 'Close')}
                            </button>
                        </div>
                    </motion.section>
                </motion.div>
            ) : null}
        </AnimatePresence>
    );
}
