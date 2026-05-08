import {
    ChevronDown,
    Clock3,
    LockKeyhole,
    MessageCircle,
    MessagesSquare,
    Send,
    ShieldCheck,
    Sparkles,
    X,
    Zap,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { gsap } from 'gsap';
import AppLogo from '@/components/app-logo';

const CIM = {
    primary: '#082F54',
    secondary: '#0A6474',
    accent: '#D4A23C',
    dark: '#061F39',
    border: '#D1D9DA',
};

const WELCOME_MESSAGE = {
    sender: 'bot',
    message:
        'Salam 👋 أنا CIM Assistant. نقدر نعاونك تعرف حالة الحساب، rendez-vous، الوثائق، و ATM القريب.',
    intent: 'welcome',
    metadata: {},
    created_at: null,
};

const QUICK_QUESTIONS = [
    'Wach account diali t9bel?',
    'Wach 3andi rendez-vous?',
    'Wach ATM Maarif fiha flos?',
    '3lach ma n9drch nsift flos?',
];

const ERROR_REPLY = {
    sender: 'bot',
    message: 'وقع مشكل صغير. عاود جرب أو تواصل مع الدعم.',
    intent: 'fallback_support',
    metadata: {},
    created_at: null,
};

function csrfToken() {
    if (typeof document === 'undefined') return null;

    return document
        .querySelector('meta[name="csrf-token"]')
        ?.getAttribute('content');
}

function endpoint(name, fallback) {
    if (
        typeof globalThis !== 'undefined' &&
        typeof globalThis.route === 'function'
    ) {
        return globalThis.route(name);
    }

    return fallback;
}

function jsonHeaders() {
    const token = csrfToken();

    return {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(token ? { 'X-CSRF-TOKEN': token } : {}),
    };
}

function formatTime(value) {
    if (!value) return 'Now';

    try {
        return new Intl.DateTimeFormat('en-MA', {
            hour: '2-digit',
            minute: '2-digit',
        }).format(new Date(value));
    } catch {
        return 'Now';
    }
}

function TypingDots() {
    return (
        <div className="flex items-center gap-1.5">
            <span className="size-1.5 animate-bounce rounded-full bg-[#0A6474] dark:bg-cyan-200" />
            <span className="size-1.5 animate-bounce rounded-full bg-[#0A6474] [animation-delay:120ms] dark:bg-cyan-200" />
            <span className="size-1.5 animate-bounce rounded-full bg-[#0A6474] [animation-delay:240ms] dark:bg-cyan-200" />
        </div>
    );
}

function MessageBubble({ item }) {
    const isUser = item.sender === 'user';

    return (
        <motion.div
            className={`chatbot-message flex ${isUser ? 'justify-end' : 'justify-start'}`}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.22 }}
        >
            <div
                className={[
                    'group max-w-[84%] overflow-hidden rounded-[1.35rem] px-4 py-3 text-sm leading-relaxed shadow-sm',
                    isUser
                        ? 'rounded-br-md bg-[#082F54] text-white shadow-[#082F54]/15 dark:bg-[#0A6474]'
                        : 'rounded-bl-md border border-[#D1D9DA] bg-white text-[#061F39] dark:border-white/10 dark:bg-white/[0.07] dark:text-white',
                ].join(' ')}
            >
                <p className="whitespace-pre-wrap">{item.message}</p>

                <div
                    className={[
                        'mt-2 flex items-center gap-1.5 text-[10px]',
                        isUser
                            ? 'text-white/55'
                            : 'text-slate-400 dark:text-slate-500',
                    ].join(' ')}
                >
                    <Clock3 className="size-3" />
                    <span>{formatTime(item.created_at)}</span>
                    {!isUser && item.intent ? (
                        <>
                            <span>•</span>
                            <span className="max-w-32 truncate">
                                {String(item.intent).replaceAll('_', ' ')}
                            </span>
                        </>
                    ) : null}
                </div>
            </div>
        </motion.div>
    );
}

function QuickQuestionButton({ question, disabled, onClick }) {
    return (
        <motion.button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className="min-h-10 rounded-2xl border border-[#D1D9DA] bg-[#F7F8FA] px-3 py-2 text-left text-xs font-semibold text-[#061F39] transition hover:border-[#D4A23C] hover:bg-[#D4A23C]/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-100 dark:hover:border-[#D4A23C]/60 dark:hover:bg-[#D4A23C]/10"
            whileHover={disabled ? undefined : { y: -2 }}
            whileTap={disabled ? undefined : { scale: 0.98 }}
        >
            {question}
        </motion.button>
    );
}

export default function CimChatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const endRef = useRef(null);
    const inputRef = useRef(null);
    const panelRef = useRef(null);
    const launcherRef = useRef(null);

    const urls = useMemo(
        () => ({
            history: endpoint(
                'customer.chatbot.history',
                '/customer/chatbot/history',
            ),
            message: endpoint(
                'customer.chatbot.message',
                '/customer/chatbot/message',
            ),
        }),
        [],
    );

    const visibleMessages = messages.length > 0 ? messages : [WELCOME_MESSAGE];

    useEffect(() => {
        if (!launcherRef.current) {
            return undefined;
        }

        const tween = gsap.to(launcherRef.current, {
            y: -4,
            duration: 2.2,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
        });

        return () => tween.kill();
    }, []);

    useEffect(() => {
        function openFromDashboard() {
            setIsOpen(true);
        }

        window.addEventListener('cim-chatbot:open', openFromDashboard);

        return () => {
            window.removeEventListener('cim-chatbot:open', openFromDashboard);
        };
    }, []);

    useEffect(() => {
        if (!isOpen || !panelRef.current) {
            return undefined;
        }

        const context = gsap.context(() => {
            gsap.fromTo(
                '.chatbot-shell',
                { autoAlpha: 0, y: 24, scale: 0.96 },
                {
                    autoAlpha: 1,
                    y: 0,
                    scale: 1,
                    duration: 0.38,
                    ease: 'power3.out',
                },
            );

            gsap.fromTo(
                '.chatbot-stagger',
                { autoAlpha: 0, y: 10 },
                {
                    autoAlpha: 1,
                    y: 0,
                    duration: 0.42,
                    stagger: 0.06,
                    ease: 'power2.out',
                    delay: 0.12,
                },
            );

            gsap.to('.chatbot-orb', {
                x: 12,
                y: -10,
                scale: 1.06,
                duration: 4.2,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut',
            });
        }, panelRef);

        return () => context.revert();
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;

        endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, [isOpen, messages, isSending]);

    useEffect(() => {
        if (!isOpen) return;

        window.setTimeout(() => inputRef.current?.focus(), 80);
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;

        let cancelled = false;

        async function loadHistory() {
            setIsLoadingHistory(true);

            try {
                const response = await fetch(urls.history, {
                    method: 'GET',
                    headers: {
                        Accept: 'application/json',
                    },
                    credentials: 'same-origin',
                });

                if (!response.ok)
                    throw new Error('Unable to load chatbot history.');

                const data = await response.json();
                const history = Array.isArray(data.messages)
                    ? data.messages
                    : [];

                if (!cancelled) {
                    setMessages(history);
                }
            } catch (error) {
                if (!cancelled) {
                    setMessages([ERROR_REPLY]);
                }
            } finally {
                if (!cancelled) {
                    setIsLoadingHistory(false);
                }
            }
        }

        loadHistory();

        return () => {
            cancelled = true;
        };
    }, [isOpen, urls.history]);

    async function sendMessage(messageText = input) {
        const cleanMessage = messageText.trim();

        if (!cleanMessage || isSending) return;

        const userMessage = {
            sender: 'user',
            message: cleanMessage,
            intent: null,
            metadata: {},
            created_at: new Date().toISOString(),
        };

        setMessages((current) => [...current, userMessage]);
        setInput('');
        setIsSending(true);

        try {
            const response = await fetch(urls.message, {
                method: 'POST',
                headers: jsonHeaders(),
                credentials: 'same-origin',
                body: JSON.stringify({ message: cleanMessage }),
            });

            if (!response.ok)
                throw new Error('Unable to send chatbot message.');

            const data = await response.json();

            setMessages((current) => [
                ...current,
                {
                    sender: 'bot',
                    message: data.reply || ERROR_REPLY.message,
                    intent: data.intent || 'fallback_support',
                    metadata: data.metadata || {},
                    created_at: new Date().toISOString(),
                },
            ]);
        } catch (error) {
            setMessages((current) => [...current, ERROR_REPLY]);
        } finally {
            setIsSending(false);
        }
    }

    function handleKeyDown(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            sendMessage();
        }
    }

    return (
        <div className="fixed right-4 bottom-5 z-50 sm:right-6 sm:bottom-6">
            {isOpen && (
                <section
                    ref={panelRef}
                    className="chatbot-shell mb-4 flex h-[min(680px,calc(100vh-7rem))] w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-[2rem] border border-[#D1D9DA] bg-[#F7F8FA] shadow-[0_30px_90px_rgba(6,31,57,0.26)] dark:border-white/10 dark:bg-[#061F39] dark:shadow-[0_30px_95px_rgba(0,0,0,0.35)] sm:w-[420px]"
                    aria-label="CIM Assistant chatbot"
                >
                    <header className="relative overflow-hidden bg-[#061F39] px-4 py-4 text-white">
                        <div className="chatbot-orb pointer-events-none absolute -top-16 right-2 h-36 w-36 rounded-full bg-[#0A6474]/45 blur-3xl" />
                        <div className="chatbot-orb pointer-events-none absolute -bottom-16 left-10 h-32 w-32 rounded-full bg-[#D4A23C]/25 blur-3xl" />

                        <div className="relative flex items-center justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-3">
                                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
                                    <AppLogo variant="mark" className="h-9 w-9" />
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h2 className="truncate text-base font-semibold tracking-normal">
                                            CIM Assistant
                                        </h2>
                                        <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2 py-0.5 text-[10px] font-bold text-emerald-200">
                                            Online
                                        </span>
                                    </div>
                                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-white/70">
                                        <LockKeyhole className="size-3.5 text-[#D4A23C]" />
                                        Secure customer support
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="flex size-9 shrink-0 items-center justify-center rounded-full text-white/75 transition hover:bg-white/10 hover:text-white focus:ring-2 focus:ring-[#D4A23C] focus:outline-none"
                                aria-label="Close CIM Assistant"
                            >
                                <X className="size-5" aria-hidden="true" />
                            </button>
                        </div>

                        <div className="chatbot-stagger relative mt-4 grid grid-cols-3 gap-2">
                            <div className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 backdrop-blur">
                                <p className="text-[10px] text-white/50">
                                    Intent
                                </p>
                                <p className="mt-0.5 text-xs font-semibold">
                                    Banking
                                </p>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 backdrop-blur">
                                <p className="text-[10px] text-white/50">
                                    Language
                                </p>
                                <p className="mt-0.5 text-xs font-semibold">
                                    Any
                                </p>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 backdrop-blur">
                                <p className="text-[10px] text-white/50">
                                    Mode
                                </p>
                                <p className="mt-0.5 text-xs font-semibold">
                                    Secure
                                </p>
                            </div>
                        </div>
                    </header>

                    <div className="chatbot-stagger border-b border-[#D1D9DA] bg-white px-4 py-3 dark:border-white/10 dark:bg-white/[0.055]">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-xs font-semibold text-[#0A6474] dark:text-cyan-100">
                                <ShieldCheck
                                    className="size-4 text-[#D4A23C]"
                                    aria-hidden="true"
                                />
                                Account, documents, appointments, ATM support
                            </div>
                            <Zap className="size-4 text-[#D4A23C]" />
                        </div>
                    </div>

                    <div className="chatbot-stagger flex-1 space-y-4 overflow-y-auto bg-[radial-gradient(circle_at_top_right,rgba(10,100,116,0.08),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(212,162,60,0.08),transparent_26%)] px-4 py-4">
                        {isLoadingHistory ? (
                            <div className="flex justify-start">
                                <div className="rounded-2xl rounded-bl-md border border-[#D1D9DA] bg-white px-4 py-3 shadow-sm dark:border-white/10 dark:bg-white/[0.07]">
                                    <TypingDots />
                                </div>
                            </div>
                        ) : (
                            visibleMessages.map((item, index) => (
                                <MessageBubble
                                    key={`${item.sender}-${index}-${item.created_at || 'local'}`}
                                    item={item}
                                />
                            ))
                        )}

                        {isSending && (
                            <motion.div
                                className="flex justify-start"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <div className="flex max-w-[84%] items-center gap-3 rounded-2xl rounded-bl-md border border-[#D1D9DA] bg-white px-4 py-3 text-sm text-[#061F39] shadow-sm dark:border-white/10 dark:bg-white/[0.07] dark:text-white">
                                    <TypingDots />
                                    <span>CIM Assistant is typing...</span>
                                </div>
                            </motion.div>
                        )}

                        <div ref={endRef} />
                    </div>

                    <div className="chatbot-stagger border-t border-[#D1D9DA] bg-white px-4 py-3 dark:border-white/10 dark:bg-white/[0.055]">
                        <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                            <MessagesSquare className="size-4 text-[#0A6474] dark:text-cyan-100" />
                            Quick questions
                        </div>

                        <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                            {QUICK_QUESTIONS.map((question) => (
                                <QuickQuestionButton
                                    key={question}
                                    question={question}
                                    onClick={() => sendMessage(question)}
                                    disabled={isSending || isLoadingHistory}
                                />
                            ))}
                        </div>

                        <div className="flex items-center gap-2 rounded-2xl border border-[#D1D9DA] bg-[#F7F8FA] p-1.5 shadow-inner dark:border-white/10 dark:bg-white/[0.06]">
                            <input
                                ref={inputRef}
                                value={input}
                                onChange={(event) =>
                                    setInput(event.target.value)
                                }
                                onKeyDown={handleKeyDown}
                                disabled={isSending}
                                type="text"
                                maxLength={1000}
                                placeholder="Type your question..."
                                className="h-11 min-w-0 flex-1 rounded-xl bg-transparent px-3 text-sm font-medium text-[#061F39] outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-70 dark:text-white dark:placeholder:text-slate-500"
                            />

                            <motion.button
                                type="button"
                                onClick={() => sendMessage()}
                                disabled={isSending || !input.trim()}
                                className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#082F54] text-white shadow-sm transition hover:bg-[#061F39] focus:ring-2 focus:ring-[#D4A23C] focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-300 dark:bg-[#0A6474] dark:hover:bg-[#0b788d]"
                                aria-label="Send message"
                                whileHover={
                                    isSending || !input.trim()
                                        ? undefined
                                        : { y: -2 }
                                }
                                whileTap={
                                    isSending || !input.trim()
                                        ? undefined
                                        : { scale: 0.96 }
                                }
                            >
                                <Send className="size-5" aria-hidden="true" />
                            </motion.button>
                        </div>
                    </div>
                </section>
            )}

            <motion.button
                ref={launcherRef}
                type="button"
                onClick={() => setIsOpen((current) => !current)}
                className="relative ml-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#082F54] text-white shadow-2xl ring-1 shadow-slate-900/25 ring-white/30 transition hover:bg-[#061F39] focus:ring-4 focus:ring-[#D4A23C]/35 focus:outline-none dark:bg-[#0A6474]"
                aria-label={
                    isOpen ? 'Minimize CIM Assistant' : 'Open CIM Assistant'
                }
                style={{
                    backgroundColor: isOpen ? CIM.dark : CIM.primary,
                    borderColor: CIM.border,
                }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
            >
                <span className="absolute inset-0 rounded-full bg-[#D4A23C]/20 blur-xl" />

                {isOpen ? (
                    <ChevronDown
                        className="relative size-7"
                        aria-hidden="true"
                    />
                ) : (
                    <span className="relative">
                        <MessageCircle className="size-7" aria-hidden="true" />
                        <Sparkles
                            className="absolute -top-2 -right-2 size-4 text-[#D4A23C]"
                            aria-hidden="true"
                        />
                    </span>
                )}
            </motion.button>
        </div>
    );
}
