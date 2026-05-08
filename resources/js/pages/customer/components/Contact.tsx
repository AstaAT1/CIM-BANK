"use client";

import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Banknote, Mail, MapPin, MessageCircle, Phone, Send } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const contacts = [
    {
        icon: Phone,
        title: "Phone Support",
        value: "+212 5 22 46 XX XX",
        sub: "Mon–Fri 8am–6pm",
    },
    {
        icon: Mail,
        title: "Email Support",
        value: "support@cim.ma",
        sub: "Response within 24h",
    },
    {
        icon: MessageCircle,
        title: "Live Chat",
        value: "In-app messaging",
        sub: "Available now",
    },
    {
        icon: MapPin,
        title: "Nearest Branch",
        value: "Casablanca — Av. Hassan II",
        sub: "2.3 km away",
    },
];

export default function Contact() {
    const sectionRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (!sectionRef.current) return;

        const ctx = gsap.context(() => {
            gsap.fromTo(
                ".contact-reveal",
                { autoAlpha: 0, y: 28 },
                {
                    autoAlpha: 1,
                    y: 0,
                    duration: 0.75,
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
        <section
            ref={sectionRef}
            id="contact"
            className="relative overflow-hidden bg-[#F7F8FA] px-4 py-24 text-[#061F39] dark:bg-[#061F39] dark:text-white sm:px-6 lg:px-8"
        >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(212,162,60,0.10),transparent_30%),radial-gradient(circle_at_90%_20%,rgba(10,100,116,0.10),transparent_34%)]" />

            <div className="relative mx-auto max-w-7xl">
                <div className="contact-reveal mx-auto max-w-3xl text-center">
                    <p className="text-xs font-bold tracking-[0.22em] text-[#0A6474] uppercase dark:text-cyan-200">
                        Contact & support
                    </p>
                    <h2 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
                        Support that feels close to the customer.
                    </h2>
                    <p className="mt-5 text-base leading-8 text-slate-600 dark:text-slate-300">
                        Reach CIM support by phone, email, live chat, or visit your nearest branch.
                    </p>
                </div>

                <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
                    {contacts.map(({ icon: Icon, title, value, sub }) => (
                        <motion.div
                            key={title}
                            className="contact-reveal rounded-[1.7rem] border border-[#D1D9DA]/75 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.055]"
                            whileHover={{ y: -8 }}
                            transition={{ duration: 0.2 }}
                        >
                            <span className="flex h-13 w-13 items-center justify-center rounded-2xl bg-[#D4A23C]/12 text-[#D4A23C]">
                                <Icon className="h-6 w-6" />
                            </span>
                            <h3 className="mt-6 text-lg font-semibold">{title}</h3>
                            <p className="mt-2 text-sm font-bold text-[#0A6474] dark:text-cyan-200">
                                {value}
                            </p>
                            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{sub}</p>
                        </motion.div>
                    ))}
                </div>

                <div className="contact-reveal mt-12 overflow-hidden rounded-[2rem] border border-white/10 bg-[#061F39] p-6 text-white shadow-[0_30px_90px_rgba(6,31,57,0.25)] lg:p-8">
                    <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
                        <div>
                            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#D4A23C]/30 bg-[#D4A23C]/10 px-3 py-1 text-xs font-semibold tracking-[0.14em] text-[#F5D58C] uppercase">
                                <Banknote className="h-4 w-4" />
                                CIM assistant
                            </div>
                            <h3 className="text-3xl font-semibold">Need immediate assistance?</h3>
                            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
                                The CIM chatbot can help customers with account status, appointments, documents, ATMs, and general banking questions.
                            </p>
                        </div>
                        <motion.button
                            type="button"
                            className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-[#D4A23C] px-7 text-sm font-bold text-[#061F39] shadow-xl shadow-[#D4A23C]/20 transition hover:bg-[#e5b54d]"
                            whileHover={{ y: -3 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            Open Live Chat
                            <Send className="h-4 w-4" />
                        </motion.button>
                    </div>
                </div>
            </div>
        </section>
    );
}
