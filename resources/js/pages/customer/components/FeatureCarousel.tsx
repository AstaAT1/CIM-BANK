"use client";

import {
    ArrowLeft,
    ArrowRight,
    Banknote,
    Bot,
    CreditCard,
    Landmark,
    MapPinned,
    ReceiptText,
    Repeat2,
    Send,
    Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ComponentType } from "react";
import { motion, AnimatePresence } from "motion/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type Feature = {
    title: string;
    tag: string;
    description: string;
    icon: ComponentType<{ className?: string }>;
    accent: string;
    image: string;
    bullets: string[];
};

const features: Feature[] = [
    {
        title: "ATM Locator",
        tag: "Location intelligence",
        description: "Find nearby ATMs and branches faster with useful location context for everyday banking.",
        icon: MapPinned,
        accent: "#0A6474",
        image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=1200&q=80",
        bullets: ["Nearest ATM guidance", "Branch location view", "Cleaner customer journey"],
    },
    {
        title: "Machrou3i",
        tag: "Project financing",
        description: "A dedicated flow for salaried customers who want to finance a real project with structured review.",
        icon: Landmark,
        accent: "#D4A23C",
        image: "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=80",
        bullets: ["Project request", "Staff review", "Offer decision"],
    },
    {
        title: "Exchange Rates",
        tag: "Currency tools",
        description: "Check currency rates from inside the customer area with a clean, bank-style interface.",
        icon: Repeat2,
        accent: "#0A6474",
        image: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=1200&q=80",
        bullets: ["Rate overview", "Simple comparison", "Useful daily access"],
    },
    {
        title: "Bills & AutoPay",
        tag: "Payment control",
        description: "Manage bills and recurring payments with a smoother digital banking experience.",
        icon: ReceiptText,
        accent: "#D4A23C",
        image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80",
        bullets: ["Bill tracking", "AutoPay setup", "Less manual work"],
    },
    {
        title: "Transfers",
        tag: "Secure sending",
        description: "Send money to beneficiaries through a focused transfer flow designed for clarity and confidence.",
        icon: Send,
        accent: "#0A6474",
        image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1200&q=80",
        bullets: ["Beneficiaries", "Transfer requests", "Secure workflow"],
    },
    {
        title: "Chatbot Assistant",
        tag: "AI support",
        description: "Customers can ask about account status, appointments, documents, ATMs, and services.",
        icon: Bot,
        accent: "#D4A23C",
        image: "https://images.unsplash.com/photo-1531746790731-6c087fecd65a?auto=format&fit=crop&w=1200&q=80",
        bullets: ["24/7 support", "Darija-friendly", "Bank knowledge"],
    },
];

export default function FeatureCarousel() {
    const sectionRef = useRef<HTMLElement | null>(null);
    const [active, setActive] = useState(0);
    const current = features[active];
    const Icon = current.icon;

    useEffect(() => {
        if (!sectionRef.current) return;

        const ctx = gsap.context(() => {
            gsap.fromTo(
                ".carousel-reveal",
                { autoAlpha: 0, y: 30 },
                {
                    autoAlpha: 1,
                    y: 0,
                    duration: 0.8,
                    stagger: 0.08,
                    ease: "power3.out",
                    scrollTrigger: {
                        trigger: sectionRef.current,
                        start: "top 72%",
                    },
                }
            );

            gsap.to(".carousel-orb", {
                x: 18,
                y: -14,
                scale: 1.06,
                duration: 5,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut",
            });
        }, sectionRef);

        return () => ctx.revert();
    }, []);

    useEffect(() => {
        const timer = window.setInterval(() => {
            setActive((value) => (value + 1) % features.length);
        }, 5500);

        return () => window.clearInterval(timer);
    }, []);

    const next = () => setActive((value) => (value + 1) % features.length);
    const previous = () => setActive((value) => (value - 1 + features.length) % features.length);

    const visibleCards = useMemo(() => {
        return features.map((feature, index) => ({ feature, index }));
    }, []);

    return (
        <section
            ref={sectionRef}
            id="services"
            className="relative overflow-hidden px-4 py-24 sm:px-6 lg:px-8"
        >
            <div className="absolute inset-0 bg-[#F7F8FA] dark:bg-[#061F39]" />
            <div className="carousel-orb pointer-events-none absolute right-8 top-24 h-72 w-72 rounded-full bg-[#0A6474]/8 blur-3xl dark:bg-[#0A6474]/16" />
            <div className="carousel-orb pointer-events-none absolute -left-24 bottom-20 h-80 w-80 rounded-full bg-[#D4A23C]/10 blur-3xl" />

            <div className="relative mx-auto max-w-7xl">
                <div className="carousel-reveal flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-3xl">
                        <p className="text-xs font-bold tracking-[0.22em] text-[#0A6474] uppercase dark:text-cyan-200">
                            CIM services
                        </p>
                        <h2 className="mt-4 text-4xl font-semibold tracking-tight text-[#061F39] dark:text-white sm:text-5xl">
                            One carousel for the services customers actually use.
                        </h2>
                        <p className="mt-5 text-base leading-8 text-slate-600 dark:text-slate-300">
                            No fake products. These are the core CIM features shown with a calm, premium banking style.
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={previous}
                            className="flex h-12 w-12 items-center justify-center rounded-full border border-[#D1D9DA] bg-white text-[#082F54] transition hover:border-[#D4A23C] dark:border-white/10 dark:bg-white/10 dark:text-white"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <button
                            type="button"
                            onClick={next}
                            className="flex h-12 w-12 items-center justify-center rounded-full bg-[#082F54] text-white transition hover:bg-[#061F39] dark:bg-[#0A6474]"
                        >
                            <ArrowRight className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                <div className="carousel-reveal mt-12 grid gap-6 lg:grid-cols-[0.95fr_1.1fr] lg:items-stretch">
                    <div className="relative min-h-[520px] overflow-hidden rounded-[2rem] border border-[#D1D9DA]/75 bg-white shadow-[0_28px_85px_rgba(6,31,57,0.10)] dark:border-white/10 dark:bg-white/[0.055]">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={current.title}
                                initial={{ opacity: 0, x: 40 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -40 }}
                                transition={{ duration: 0.42, ease: "easeOut" }}
                                className="absolute inset-0"
                            >
                                <img
                                    src={current.image}
                                    alt={current.title}
                                    className="h-full w-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#061F39]/90 via-[#061F39]/35 to-transparent" />
                                <div className="absolute inset-x-0 bottom-0 p-6 lg:p-8">
                                    <div
                                        className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold tracking-[0.14em] uppercase text-white backdrop-blur"
                                    >
                                        <Sparkles className="h-3.5 w-3.5" style={{ color: current.accent }} />
                                        {current.tag}
                                    </div>
                                    <h3 className="text-4xl font-semibold tracking-tight text-white">
                                        {current.title}
                                    </h3>
                                    <p className="mt-4 max-w-xl text-sm leading-7 text-white/72">
                                        {current.description}
                                    </p>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    <div className="rounded-[2rem] border border-[#D1D9DA]/75 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.055] lg:p-6">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={`${current.title}-content`}
                                initial={{ opacity: 0, y: 18 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -18 }}
                                transition={{ duration: 0.35 }}
                                className="rounded-[1.5rem] border border-[#D1D9DA]/70 bg-[#F7F8FA] p-6 dark:border-white/10 dark:bg-white/[0.04]"
                            >
                                <span
                                    className="flex h-14 w-14 items-center justify-center rounded-2xl"
                                    style={{ backgroundColor: `${current.accent}20`, color: current.accent }}
                                >
                                    <Icon className="h-7 w-7" />
                                </span>

                                <p className="mt-6 text-xs font-bold tracking-[0.18em] uppercase text-slate-400">
                                    {String(active + 1).padStart(2, "0")} / {String(features.length).padStart(2, "0")}
                                </p>
                                <h3 className="mt-3 text-3xl font-semibold text-[#061F39] dark:text-white">
                                    {current.title}
                                </h3>
                                <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
                                    {current.description}
                                </p>

                                <div className="mt-6 grid gap-3">
                                    {current.bullets.map((bullet) => (
                                        <div
                                            key={bullet}
                                            className="flex items-center gap-3 rounded-2xl border border-[#D1D9DA] bg-white px-4 py-3 text-sm font-semibold text-[#061F39] dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
                                        >
                                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: current.accent }} />
                                            {bullet}
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        </AnimatePresence>

                        <div className="mt-5 grid gap-3 sm:grid-cols-2">
                            {visibleCards.map(({ feature, index }) => {
                                const FeatureIcon = feature.icon;
                                const activeCard = index === active;

                                return (
                                    <button
                                        key={feature.title}
                                        type="button"
                                        onClick={() => setActive(index)}
                                        className={`rounded-2xl border p-4 text-left transition ${
                                            activeCard
                                                ? "border-[#D4A23C] bg-[#D4A23C]/10 shadow-sm"
                                                : "border-[#D1D9DA]/75 bg-white hover:border-[#D4A23C]/60 dark:border-white/10 dark:bg-white/[0.04]"
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span
                                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                                                style={{ backgroundColor: `${feature.accent}18`, color: feature.accent }}
                                            >
                                                <FeatureIcon className="h-5 w-5" />
                                            </span>
                                            <div>
                                                <p className="text-sm font-semibold text-[#061F39] dark:text-white">
                                                    {feature.title}
                                                </p>
                                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                    {feature.tag}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="carousel-reveal mt-6 flex justify-center gap-2">
                    {features.map((feature, index) => (
                        <button
                            key={feature.title}
                            type="button"
                            onClick={() => setActive(index)}
                            className={`h-2.5 rounded-full transition-all ${
                                active === index ? "w-9 bg-[#D4A23C]" : "w-2.5 bg-[#D1D9DA] dark:bg-white/20"
                            }`}
                            aria-label={`Go to ${feature.title}`}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
