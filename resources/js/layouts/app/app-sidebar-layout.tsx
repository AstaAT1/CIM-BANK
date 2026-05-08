import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import type { AppLayoutProps } from '@/types';

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    return (
        <AppShell variant="sidebar">
            <AppSidebar />

            <AppContent
                variant="sidebar"
                className="relative min-h-svh overflow-x-hidden bg-[#F7F8FA] text-[#061F39] dark:bg-[#061F39] dark:text-white"
            >
                <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
                    <div className="absolute -top-32 right-12 h-80 w-80 rounded-full bg-[#0A6474]/10 blur-3xl dark:bg-[#0A6474]/20" />
                    <div className="absolute top-[38rem] -left-28 h-80 w-80 rounded-full bg-[#D4A23C]/8 blur-3xl dark:bg-[#D4A23C]/12" />
                    <div className="absolute right-1/4 bottom-0 h-64 w-64 rounded-full bg-[#082F54]/5 blur-3xl dark:bg-black/20" />
                </div>

                <div className="relative z-10 flex min-h-svh flex-col">
                    <AppSidebarHeader breadcrumbs={breadcrumbs} />

                    <div className="relative flex-1">
                        {children}
                    </div>
                </div>
            </AppContent>
        </AppShell>
    );
}