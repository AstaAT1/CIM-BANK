import {
    Bot,
    ChevronDown,
    MessageCircle,
    Send,
    ShieldCheck,
    Sparkles,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

const CIM = {
    primary: '#082F54',
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

function TypingDots() {
    return (
        <div className="flex items-center gap-1.5">
            <span className="size-1.5 animate-bounce rounded-full bg-[#0A6474]" />
            <span className="size-1.5 animate-bounce rounded-full bg-[#0A6474] [animation-delay:120ms]" />
            <span className="size-1.5 animate-bounce rounded-full bg-[#0A6474] [animation-delay:240ms]" />
        </div>
    );
}

function MessageBubble({ item }) {
    const isUser = item.sender === 'user';

    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div
                className={[
                    'max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm',
                    isUser
                        ? 'rounded-br-md bg-[#082F54] text-white'
                        : 'rounded-bl-md border border-[#D1D9DA] bg-white text-[#061F39]',
                ].join(' ')}
            >
                {item.message}
            </div>
        </div>
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
                    className="mb-4 flex h-[min(640px,calc(100vh-7rem))] w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-3xl border border-[#D1D9DA] bg-[#F7F8FA] shadow-2xl shadow-slate-900/20 sm:w-[390px]"
                    aria-label="CIM Assistant chatbot"
                >
                    <header className="flex items-center justify-between bg-[#082F54] px-4 py-4 text-white">
                        <div className="flex items-center gap-3">
                            <div className="flex size-11 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
                                <Bot
                                    className="size-5 text-[#D4A23C]"
                                    aria-hidden="true"
                                />
                            </div>
                            <div>
                                <h2 className="text-base font-semibold tracking-normal">
                                    CIM Assistant
                                </h2>
                                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-white/75">
                                    <span className="size-2 rounded-full bg-emerald-400" />
                                    Online • Customer support
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="flex size-9 items-center justify-center rounded-full text-white/75 transition hover:bg-white/10 hover:text-white focus:ring-2 focus:ring-[#D4A23C] focus:outline-none"
                            aria-label="Close CIM Assistant"
                        >
                            <X className="size-5" aria-hidden="true" />
                        </button>
                    </header>

                    <div className="border-b border-[#D1D9DA] bg-white px-4 py-3">
                        <div className="flex items-center gap-2 text-xs font-medium text-[#0A6474]">
                            <ShieldCheck
                                className="size-4 text-[#D4A23C]"
                                aria-hidden="true"
                            />
                            Secure customer assistance
                        </div>
                    </div>

                    <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
                        {isLoadingHistory ? (
                            <div className="flex justify-start">
                                <div className="rounded-2xl rounded-bl-md border border-[#D1D9DA] bg-white px-4 py-3 shadow-sm">
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
                            <div className="flex justify-start">
                                <div className="flex max-w-[82%] items-center gap-3 rounded-2xl rounded-bl-md border border-[#D1D9DA] bg-white px-4 py-3 text-sm text-[#061F39] shadow-sm">
                                    <TypingDots />
                                    <span>CIM Assistant is typing...</span>
                                </div>
                            </div>
                        )}

                        <div ref={endRef} />
                    </div>

                    <div className="border-t border-[#D1D9DA] bg-white px-4 py-3">
                        <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                            {QUICK_QUESTIONS.map((question) => (
                                <button
                                    key={question}
                                    type="button"
                                    onClick={() => sendMessage(question)}
                                    disabled={isSending || isLoadingHistory}
                                    className="min-h-10 rounded-2xl border border-[#D1D9DA] bg-[#F7F8FA] px-3 py-2 text-left text-xs font-medium text-[#061F39] transition hover:border-[#D4A23C] hover:bg-[#D4A23C]/10 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {question}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-2">
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
                                className="h-12 min-w-0 flex-1 rounded-2xl border border-[#D1D9DA] bg-[#F7F8FA] px-4 text-sm text-[#061F39] transition outline-none placeholder:text-slate-400 focus:border-[#0A6474] focus:bg-white focus:ring-2 focus:ring-[#0A6474]/15 disabled:cursor-not-allowed disabled:opacity-70"
                            />

                            <button
                                type="button"
                                onClick={() => sendMessage()}
                                disabled={isSending || !input.trim()}
                                className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#082F54] text-white shadow-sm transition hover:bg-[#061F39] focus:ring-2 focus:ring-[#D4A23C] focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-300"
                                aria-label="Send message"
                            >
                                <Send className="size-5" aria-hidden="true" />
                            </button>
                        </div>
                    </div>
                </section>
            )}

            <button
                type="button"
                onClick={() => setIsOpen((current) => !current)}
                className="ml-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#082F54] text-white shadow-2xl ring-1 shadow-slate-900/25 ring-white/30 transition hover:-translate-y-0.5 hover:bg-[#061F39] focus:ring-4 focus:ring-[#D4A23C]/35 focus:outline-none"
                aria-label={
                    isOpen ? 'Minimize CIM Assistant' : 'Open CIM Assistant'
                }
                style={{
                    backgroundColor: isOpen ? CIM.dark : CIM.primary,
                    borderColor: CIM.border,
                }}
            >
                {isOpen ? (
                    <ChevronDown className="size-7" aria-hidden="true" />
                ) : (
                    <span className="relative">
                        <MessageCircle className="size-7" aria-hidden="true" />
                        <Sparkles
                            className="absolute -top-2 -right-2 size-4 text-[#D4A23C]"
                            aria-hidden="true"
                        />
                    </span>
                )}
            </button>
        </div>
    );
}
