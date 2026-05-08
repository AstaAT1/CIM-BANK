"use client";

import { Link } from "@inertiajs/react";
import { ArrowUpRight, Building2, ShieldCheck } from "lucide-react";

const footerColumns = [
    {
        title: "Products",
        links: ["Accounts", "Cards", "Transfers", "Bills", "Machrou3i"],
    },
    {
        title: "Support",
        links: ["Contact Support", "FAQs", "Chatbot", "Help Center", "Status"],
    },
    {
        title: "Legal",
        links: ["About", "Legal Notice", "Privacy Policy", "Terms of Use", "Claims"],
    },
];

export default function Footer() {
    return (
        <footer className="relative overflow-hidden border-t border-[#D1D9DA]/70 bg-white text-[#061F39] dark:border-white/10 dark:bg-[#061F39] dark:text-white">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(212,162,60,0.08),transparent_30%),radial-gradient(circle_at_88%_30%,rgba(10,100,116,0.10),transparent_34%)]" />

            <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
                <div className="grid gap-12 lg:grid-cols-[1.1fr_1.4fr]">
                    <div>
                        <img src="/logo_twil.png" alt="CIM Bank" className="h-14 w-auto max-w-[210px] object-contain" />
                        <p className="mt-5 max-w-md text-sm leading-7 text-slate-600 dark:text-slate-300">
                            Credit Intelligence Mizan combines secure banking, customer onboarding, transfers, bills, rates, and intelligent support in one modern platform.
                        </p>

                        <div className="mt-6 grid max-w-md gap-3 sm:grid-cols-2">
                            <div className="rounded-2xl border border-[#D1D9DA]/75 bg-[#F7F8FA] p-4 dark:border-white/10 dark:bg-white/[0.055]">
                                <ShieldCheck className="mb-3 h-5 w-5 text-[#0A6474] dark:text-cyan-200" />
                                <p className="text-sm font-semibold">Secure banking</p>
                            </div>
                            <div className="rounded-2xl border border-[#D1D9DA]/75 bg-[#F7F8FA] p-4 dark:border-white/10 dark:bg-white/[0.055]">
                                <Building2 className="mb-3 h-5 w-5 text-[#D4A23C]" />
                                <p className="text-sm font-semibold">Moroccan branches</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-8 sm:grid-cols-3">
                        {footerColumns.map((column) => (
                            <div key={column.title}>
                                <h4 className="font-semibold">{column.title}</h4>
                                <ul className="mt-4 space-y-3">
                                    {column.links.map((item) => (
                                        <li key={item}>
                                            <a href="#" className="inline-flex items-center gap-1 text-sm text-slate-500 transition hover:text-[#D4A23C] dark:text-slate-400">
                                                {item}
                                                <ArrowUpRight className="h-3.5 w-3.5" />
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-12 border-t border-[#D1D9DA]/70 pt-8 dark:border-white/10">
                    <div className="flex flex-col gap-4 text-sm text-slate-500 dark:text-slate-400 md:flex-row md:items-center md:justify-between">
                        <div>
                            <p>© 2026 CIM — Credit Intelligence Mizan.</p>
                            <p className="mt-1">Capital social 1,2 Mds DH. Siège : 142, Boulevard Anfa — Casablanca.</p>
                        </div>
                        <div className="flex flex-wrap gap-4">
                            {["BANK AL-MAGHRIB", "ANRT", "CASA FINANCE", "VISA PLATINUM"].map((bank) => (
                                <span key={bank} className="text-xs font-bold tracking-[0.12em] text-slate-400">
                                    {bank}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="relative border-t border-[#D1D9DA]/70 bg-[#F7F8FA]/80 py-4 dark:border-white/10 dark:bg-black/20">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-4 text-xs text-slate-500 dark:text-slate-400 sm:px-6 lg:px-8">
                    <p>Made with intelligence · Powered by AI</p>
                    <Link href="/login" className="font-semibold text-[#0A6474] dark:text-cyan-200">
                        Secure login
                    </Link>
                </div>
            </div>
        </footer>
    );
}
