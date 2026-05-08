import AppLogo from '@/components/app-logo';
import { Breadcrumbs } from '@/components/breadcrumbs';
import ThemeToggle from '@/components/theme-toggle';
import { SidebarTrigger } from '@/components/ui/sidebar';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';
import { ShieldCheck } from 'lucide-react';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    return (
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-[#D1D9DA]/70 bg-white/90 px-4 shadow-[0_10px_35px_rgba(6,31,57,0.06)] backdrop-blur-xl transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-14 dark:border-white/10 dark:bg-[#061F39]/88 dark:shadow-[0_12px_38px_rgba(0,0,0,0.22)]">
            <div className="flex min-w-0 items-center gap-3">
                <SidebarTrigger className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#D1D9DA] bg-[#FFFFFF] text-[#082F54] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#D4A23C] hover:bg-[#F7F8FA] hover:text-[#061F39] focus-visible:ring-2 focus-visible:ring-[#D4A23C]/35 focus-visible:outline-none dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:border-[#D4A23C]/40 dark:hover:bg-white/15 dark:hover:text-[#D4A23C] [&>svg]:size-4.5" />

                {breadcrumbs.length > 0 ? (
                    <>
                        <div className="hidden h-6 w-px bg-[#D1D9DA] dark:bg-white/10 sm:block" />

                        <div className="min-w-0 rounded-2xl border border-[#D1D9DA]/65 bg-[#F7F8FA]/80 px-3 py-2 dark:border-white/10 dark:bg-white/[0.055]">
                            <Breadcrumbs breadcrumbs={breadcrumbs} />
                        </div>
                    </>
                ) : (
                    <div className="hidden sm:flex">
                        <AppLogo className="h-10 w-auto max-w-[132px]" />
                    </div>
                )}
            </div>

            <div className="hidden items-center gap-2 sm:flex">
                <ThemeToggle className="h-10 w-10 rounded-2xl" />

                <div className="inline-flex h-10 items-center gap-2 rounded-2xl border border-[#0A6474]/20 bg-[#0A6474]/10 px-3 text-xs font-semibold text-[#0A6474] dark:border-cyan-200/10 dark:bg-cyan-200/10 dark:text-cyan-100">
                    <ShieldCheck className="h-4 w-4" />
                    Secure home
                </div>

                <div className="inline-flex h-10 items-center rounded-2xl border border-[#D4A23C]/25 bg-[#D4A23C]/10 px-3 dark:border-[#D4A23C]/20">
                    <AppLogo variant="mark" className="h-8 w-8" />
                </div>
            </div>
        </header>
    );
}
