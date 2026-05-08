"use client";

import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { BadgeCheck, CalendarCheck, CreditCard, UserPlus } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const steps = [
    {
        number: "01",
        icon: UserPlus,
        title: "Create account",
        text: "Start your CIM account opening request and fill in your customer information.",
    },
    {
        number: "02",
        icon: CalendarCheck,
        title: "Verify details",
        text: "Upload documents, book an appointment, and complete staff verification.",
    },
    {
        number: "03",
        icon: BadgeCheck,
        title: "Get activated",
        text: "After review, your account and card can be created securely.",
    },
    {
        number: "04",
        icon: CreditCard,
        title: "Use services",
        text: "Access ATM locator, transfers, bills, rates, Machrou3i, and chatbot support.",
    },
];

export default function HowItWorks() {
    const sectionRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (!sectionRef.current) return;

        const ctx = gsap.context(() => {
            gsap.fromTo(
                ".steps-reveal",
                { autoAlpha: 0, y: 28 },
                {
                    autoAlpha: 1,
                    y: 0,
                    duration: 0.72,
                    stagger: 0.08,
                    ease: "power3.out",
                    scrollTrigger: {
                        trigger: sectionRef.current,
                        start: "top 70%",
                    },
                }
            );
        }, sectionRef);

        return () => ctx.revert();
    }, []);

    return (
        <section ref={sectionRef} id="how-it-works" className="relative overflow-hidden px-4 py-24 sm:px-6 lg:px-8">
            <div className="absolute inset-0 bg-white dark:bg-[#061F39]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(10,100,116,0.10),transparent_32%),radial-gradient(circle_at_90%_60%,rgba(212,162,60,0.10),transparent_34%)]" />

            <div className="relative mx-auto max-w-7xl">
                <div className="steps-reveal mx-auto max-w-3xl text-center">
                    <p className="text-xs font-bold tracking-[0.22em] text-[#0A6474] uppercase dark:text-cyan-200">
                        How it works
                    </p>
                    <h2 className="mt-4 text-4xl font-semibold tracking-tight text-[#061F39] dark:text-white sm:text-5xl">
                        A simple path from request to banking access.
                    </h2>
                    <p className="mt-5 text-base leading-8 text-slate-600 dark:text-slate-300">
                        Short, clear, and designed for trust.
                    </p>
                </div>

                <div className="mt-14 grid gap-5 lg:grid-cols-4">
                    {steps.map(({ number, icon: Icon, title, text }) => (
                        <motion.div
                            key={title}
                            className="steps-reveal relative overflow-hidden rounded-[1.7rem] border border-[#D1D9DA]/75 bg-[#F7F8FA] p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.055]"
                            whileHover={{ y: -8 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[#D4A23C]/10 blur-2xl" />
                            <div className="relative">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold tracking-[0.2em] text-[#D4A23C]">
                                        {number}
                                    </span>
                                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#082F54]/10 text-[#082F54] dark:bg-cyan-200/10 dark:text-cyan-100">
                                        <Icon className="h-6 w-6" />
                                    </span>
                                </div>
                                <h3 className="mt-8 text-xl font-semibold text-[#061F39] dark:text-white">
                                    {title}
                                </h3>
                                <p className="mt-3 text-sm leading-7 text-slate-500 dark:text-slate-400">
                                    {text}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
