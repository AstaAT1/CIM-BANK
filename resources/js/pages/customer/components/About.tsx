"use client";

import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Landmark, MapPinned, ShieldCheck, WalletCards } from "lucide-react";
import CIM from "../images/CIM.png";

gsap.registerPlugin(ScrollTrigger);

const features = [
    {
        icon: MapPinned,
        title: "Real branch and ATM guidance",
        text: "Customers can locate CIM services faster through ATM and branch tools.",
    },
    {
        icon: WalletCards,
        title: "Everyday banking services",
        text: "Transfers, bills, AutoPay, exchange rates, cards, and account information in one place.",
    },
    {
        icon: ShieldCheck,
        title: "Verified onboarding",
        text: "Account opening uses documents, appointments, and staff review before activation.",
    },
];

export default function About() {
    const sectionRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (!sectionRef.current) return;

        const ctx = gsap.context(() => {
            gsap.fromTo(
                ".about-reveal",
                { autoAlpha: 0, y: 28 },
                {
                    autoAlpha: 1,
                    y: 0,
                    duration: 0.75,
                    stagger: 0.08,
                    ease: "power3.out",
                    scrollTrigger: {
                        trigger: sectionRef.current,
                        start: "top 72%",
                    },
                }
            );
        }, sectionRef);

        return () => ctx.revert();
    }, []);

    return (
        <section ref={sectionRef} id="about" className="relative overflow-hidden px-4 py-24 sm:px-6 lg:px-8">
            <div className="absolute inset-0 bg-white dark:bg-[#061F39]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(212,162,60,0.11),transparent_34%),radial-gradient(circle_at_82%_70%,rgba(10,100,116,0.10),transparent_34%)] dark:bg-[radial-gradient(circle_at_18%_20%,rgba(212,162,60,0.12),transparent_34%),radial-gradient(circle_at_82%_70%,rgba(10,100,116,0.16),transparent_34%)]" />

            <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.85fr_1fr] lg:items-center">
                <motion.div className="about-reveal relative" whileHover={{ y: -6 }} transition={{ duration: 0.25 }}>
                    <div className="overflow-hidden rounded-[2rem] border border-[#D1D9DA]/80 bg-[#F7F8FA] p-4 shadow-[0_30px_90px_rgba(6,31,57,0.10)] dark:border-white/10 dark:bg-white/[0.055] dark:shadow-[0_30px_90px_rgba(0,0,0,0.22)]">
                        <img src={CIM} alt="CIM Bank" className="h-[420px] w-full rounded-[1.5rem] object-cover opacity-80" />
                    </div>
                    <div className="absolute -bottom-6 -right-6 rounded-[1.5rem] border border-[#D4A23C]/25 bg-[#D4A23C] p-5 text-[#061F39] shadow-2xl">
                        <Landmark className="mb-3 h-6 w-6" />
                        <p className="text-3xl font-semibold">CIM</p>
                        <p className="text-xs font-bold uppercase tracking-[0.18em]">Digital bank</p>
                    </div>
                </motion.div>

                <div>
                    <p className="about-reveal text-xs font-bold tracking-[0.22em] text-[#0A6474] uppercase dark:text-cyan-200">
                        About CIM Bank
                    </p>
                    <h2 className="about-reveal mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-[#061F39] dark:text-white sm:text-5xl">
                        A Moroccan digital banking experience built for daily financial life.
                    </h2>
                    <p className="about-reveal mt-5 max-w-2xl text-base leading-8 text-slate-600 dark:text-slate-300">
                        CIM combines practical banking services with clean digital workflows: account opening, appointments, transfers,
                        bills, exchange rates, branch tools, and intelligent support.
                    </p>

                    <div className="mt-8 grid gap-4">
                        {features.map(({ icon: Icon, title, text }) => (
                            <div key={title} className="about-reveal rounded-[1.5rem] border border-[#D1D9DA]/75 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.055]">
                                <div className="flex gap-4">
                                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0A6474]/10 text-[#0A6474] dark:bg-cyan-200/10 dark:text-cyan-100">
                                        <Icon className="h-6 w-6" />
                                    </span>
                                    <div>
                                        <h3 className="font-semibold text-[#061F39] dark:text-white">{title}</h3>
                                        <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">{text}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
