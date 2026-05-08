"use client";

import { Link } from "@inertiajs/react";
import { ArrowRight, BadgeCheck, Landmark, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";
import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import gsap from "gsap";
import CIM from "../images/CIM.png";

export default function Hero() {
    const heroRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (!heroRef.current) return;

        const ctx = gsap.context(() => {
            gsap.fromTo(
                ".hero-reveal",
                { autoAlpha: 0, y: 28 },
                { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.08, ease: "power3.out" }
            );

            gsap.to(".hero-float", {
                y: -14,
                duration: 4,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut",
            });

            gsap.to(".hero-orb", {
                x: 18,
                y: -14,
                scale: 1.06,
                duration: 5.2,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut",
            });
        }, heroRef);

        return () => ctx.revert();
    }, []);

    return (
        <section
            ref={heroRef}
            id="home"
            className="relative flex min-h-screen items-center overflow-hidden px-4 pt-28 sm:px-6 lg:px-8"
        >
            <div className="absolute inset-0">
                <img
                    src={CIM}
                    alt="CIM banking background"
                    className="h-full w-full scale-105 object-cover opacity-[0.05] blur-[1px] dark:opacity-[0.12]"
                />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_22%,rgba(212,162,60,0.14),transparent_30%),radial-gradient(circle_at_82%_20%,rgba(10,100,116,0.12),transparent_32%)]" />
                <div className="absolute inset-0 bg-gradient-to-b from-[#F7F8FA]/72 via-[#F7F8FA]/94 to-[#F7F8FA] dark:from-[#061F39]/75 dark:via-[#061F39]/94 dark:to-[#061F39]" />
            </div>

            <div className="hero-orb pointer-events-none absolute right-4 top-28 h-72 w-72 rounded-full bg-[#0A6474]/8 blur-3xl dark:bg-[#0A6474]/18" />
            <div className="hero-orb pointer-events-none absolute -left-20 bottom-16 h-80 w-80 rounded-full bg-[#D4A23C]/12 blur-3xl" />

            <div className="relative mx-auto grid w-full max-w-7xl items-center gap-12 lg:grid-cols-[1fr_0.86fr]">
                <div className="max-w-4xl">
                    <div className="hero-reveal mb-6 inline-flex items-center gap-2 rounded-full border border-[#D4A23C]/30 bg-[#D4A23C]/10 px-4 py-2 text-xs font-bold tracking-[0.18em] text-[#8A6418] uppercase dark:text-[#F5D58C]">
                        <Sparkles className="h-4 w-4" />
                        Credit Intelligence Mizan
                    </div>

                    <h1 className="hero-reveal text-5xl font-semibold leading-[0.95] tracking-tight text-[#061F39] dark:text-white sm:text-6xl lg:text-7xl">
                        Modern banking for smarter{" "}
                        <span className="bg-gradient-to-r from-[#D4A23C] via-[#F4D17A] to-[#D4A23C] bg-clip-text text-transparent">
                            everyday decisions.
                        </span>
                    </h1>

                    <p className="hero-reveal mt-6 max-w-2xl text-base leading-8 text-slate-600 dark:text-slate-300 sm:text-lg">
                        CIM brings account onboarding, ATM locator, transfers, bills, exchange rates,
                        Machrou3i financing, and AI assistance into one clean digital banking experience.
                    </p>

                    <div className="hero-reveal mt-8 flex flex-col gap-3 sm:flex-row">
                        <Link
                            href="/register"
                            className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-[#D4A23C] px-7 text-sm font-bold text-[#061F39] shadow-xl shadow-[#D4A23C]/20 transition hover:-translate-y-1 hover:bg-[#e5b54d]"
                        >
                            Open your account
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                        <button
                            type="button"
                            onClick={() => document.getElementById("services")?.scrollIntoView({ behavior: "smooth" })}
                            className="inline-flex h-14 items-center justify-center rounded-2xl border border-[#D1D9DA] bg-white/70 px-7 text-sm font-bold text-[#082F54] backdrop-blur transition hover:-translate-y-1 hover:border-[#D4A23C] dark:border-white/10 dark:bg-white/10 dark:text-white"
                        >
                            Explore services
                        </button>
                    </div>

                    <div className="hero-reveal mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
                        {[
                            { icon: BadgeCheck, label: "Verified onboarding" },
                            { icon: ShieldCheck, label: "Secure banking" },
                            { icon: TrendingUp, label: "Smart services" },
                        ].map(({ icon: Icon, label }) => (
                            <div
                                key={label}
                                className="rounded-2xl border border-[#D1D9DA]/70 bg-white/60 px-4 py-3 text-sm font-semibold text-slate-600 backdrop-blur dark:border-white/10 dark:bg-white/[0.055] dark:text-slate-300"
                            >
                                <Icon className="mb-2 h-5 w-5 text-[#0A6474] dark:text-cyan-200" />
                                {label}
                            </div>
                        ))}
                    </div>
                </div>

                <motion.div className="hero-reveal hero-float relative hidden lg:block" whileHover={{ y: -8 }} transition={{ duration: 0.25 }}>
                    <div className="relative overflow-hidden rounded-[2rem] border border-[#D1D9DA]/20 bg-white p-6 text-[#061F39] shadow-[0_35px_100px_rgba(6,31,57,0.16)] dark:border-white/10 dark:bg-white/[0.055] dark:text-white">
                        <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-[#0A6474]/18 blur-3xl" />
                        <div className="absolute -bottom-12 left-10 h-44 w-44 rounded-full bg-[#D4A23C]/20 blur-3xl" />

                        <div className="relative">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs tracking-[0.22em] text-slate-400 uppercase dark:text-white/45">
                                        Customer banking preview
                                    </p>
                                    <h2 className="mt-2 text-2xl font-semibold">CIM Services</h2>
                                </div>
                                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D4A23C]/14 text-[#D4A23C]">
                                    <Landmark className="h-6 w-6" />
                                </span>
                            </div>

                            <div className="mt-8 rounded-[1.5rem] border border-[#D1D9DA]/70 bg-[#F7F8FA] p-5 dark:border-white/10 dark:bg-white/[0.06]">
                                <p className="text-sm text-slate-500 dark:text-white/55">Today’s exchange insight</p>
                                <p className="mt-2 text-4xl font-semibold">EUR / MAD</p>
                                <div className="mt-5 h-3 overflow-hidden rounded-full bg-white dark:bg-white/10">
                                    <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-[#D4A23C] to-[#0A6474]" />
                                </div>
                                <p className="mt-3 text-xs text-slate-400 dark:text-white/45">Rates update from your dashboard.</p>
                            </div>

                            <div className="mt-4 grid grid-cols-2 gap-4">
                                {[
                                    ["ATM Locator", "Nearest branch"],
                                    ["Transfers", "Secure sending"],
                                    ["Bills", "AutoPay"],
                                    ["Chatbot", "24/7 assistant"],
                                ].map(([title, desc]) => (
                                    <div key={title} className="rounded-2xl border border-[#D1D9DA]/70 bg-[#F7F8FA] p-4 dark:border-white/10 dark:bg-white/[0.06]">
                                        <p className="font-semibold">{title}</p>
                                        <p className="mt-1 text-xs text-slate-500 dark:text-white/45">{desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
