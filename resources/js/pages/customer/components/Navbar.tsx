"use client";

import { Link } from "@inertiajs/react";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import gsap from "gsap";
import ThemeToggle from "@/components/theme-toggle";

const navItems = [
    { label: "About", href: "#about" },
    { label: "Services", href: "#services" },
    { label: "How it works", href: "#how-it-works" },
    { label: "Support", href: "#contact" },
];

export default function Navbar() {
    const [open, setOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 18);
        onScroll();
        window.addEventListener("scroll", onScroll);

        gsap.fromTo(
            ".cim-nav-reveal",
            { autoAlpha: 0, y: -18 },
            { autoAlpha: 1, y: 0, duration: 0.65, stagger: 0.04, ease: "power3.out" }
        );

        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const scrollTo = (href: string) => {
        const el = document.querySelector(href);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        setOpen(false);
    };

    return (
        <nav
            className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
                scrolled
                    ? "border-b border-[#D1D9DA]/75 bg-white/88 shadow-[0_18px_50px_rgba(6,31,57,0.08)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#061F39]/86"
                    : "bg-transparent"
            }`}
        >
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
                <Link href="/" className="cim-nav-reveal flex items-center gap-3">
                    <span className="hidden rounded-2xl border border-[#D4A23C]/18 bg-white/70 px-3 py-2 shadow-sm dark:border-white/10 dark:bg-white/5 sm:block">
                        <img
                            src="/logo_twil.png"
                            alt="CIM Bank"
                            className="h-10 w-auto max-w-[180px] object-contain"
                        />
                    </span>
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D4A23C] shadow-[0_14px_35px_rgba(212,162,60,0.22)] sm:hidden">
                        <img src="/logo_9sir.png" alt="CIM Bank" className="h-9 w-9 object-contain" />
                    </span>
                </Link>

                <div className="cim-nav-reveal hidden items-center gap-1 rounded-full border border-[#D1D9DA]/70 bg-white/62 p-1 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.055] lg:flex">
                    {navItems.map((item) => (
                        <button
                            key={item.href}
                            type="button"
                            onClick={() => scrollTo(item.href)}
                            className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-[#082F54]/7 hover:text-[#082F54] dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
                        >
                            {item.label}
                        </button>
                    ))}
                </div>

                <div className="cim-nav-reveal hidden items-center gap-3 md:flex">
                    <ThemeToggle className="rounded-full" />

                    <Link href="/login" className="rounded-full px-4 py-2 text-sm font-semibold text-[#082F54] transition hover:text-[#D4A23C] dark:text-white">
                        Login
                    </Link>

                    <Link
                        href="/register"
                        className="rounded-full bg-[#D4A23C] px-5 py-3 text-sm font-bold text-[#061F39] shadow-lg shadow-[#D4A23C]/18 transition hover:-translate-y-0.5 hover:bg-[#e2b34a]"
                    >
                        Create Account
                    </Link>
                </div>

                <button
                    type="button"
                    onClick={() => setOpen((value) => !value)}
                    className="cim-nav-reveal flex h-11 w-11 items-center justify-center rounded-full border border-[#D1D9DA]/80 bg-white/75 text-[#082F54] dark:border-white/10 dark:bg-white/10 dark:text-white md:hidden"
                >
                    {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
            </div>

            {open && (
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border-t border-[#D1D9DA]/70 bg-white/95 px-4 py-4 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-[#061F39]/95 md:hidden"
                >
                    <div className="grid gap-2">
                        {navItems.map((item) => (
                            <button
                                key={item.href}
                                type="button"
                                onClick={() => scrollTo(item.href)}
                                className="rounded-2xl px-4 py-3 text-left text-sm font-semibold text-[#061F39] hover:bg-[#F7F8FA] dark:text-white dark:hover:bg-white/10"
                            >
                                {item.label}
                            </button>
                        ))}
                        <div className="mt-2 grid grid-cols-2 gap-2">
                            <Link href="/login" className="rounded-2xl border border-[#D1D9DA] px-4 py-3 text-center text-sm font-semibold text-[#082F54] dark:border-white/10 dark:text-white">
                                Login
                            </Link>
                            <Link href="/register" className="rounded-2xl bg-[#D4A23C] px-4 py-3 text-center text-sm font-bold text-[#061F39]">
                                Create
                            </Link>
                        </div>
                        <ThemeToggle className="mt-2 w-full rounded-2xl" />
                    </div>
                </motion.div>
            )}
        </nav>
    );
}
