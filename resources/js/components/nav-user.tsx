import { usePage } from '@inertiajs/react';
import { ChevronsUpDown } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar';
import { UserInfo } from '@/components/user-info';
import { UserMenuContent } from '@/components/user-menu-content';
import { useIsMobile } from '@/hooks/use-mobile';

export function NavUser() {
    const { auth } = usePage().props;
    const { state } = useSidebar();
    const isMobile = useIsMobile();

    if (!auth.user) {
        return null;
    }

    return (
        <SidebarMenu className="group-data-[collapsible=icon]:items-center">
            <SidebarMenuItem>
                {/* Subtle divider above the user area */}
                <div className="mx-3 mb-2 h-px bg-[#D1D9DA]/80 dark:bg-white/8 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:w-8" />

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="group/userbtn mx-1 h-auto w-[calc(100%-8px)] rounded-xl border border-[#D1D9DA]/80 bg-[#F7F8FA] px-3 py-2.5 text-slate-600 transition-all duration-150 hover:border-[#D4A23C]/45 hover:bg-white hover:text-[#061F39] data-[state=open]:border-[#D4A23C]/45 data-[state=open]:bg-[#D4A23C]/10 dark:border-white/8 dark:bg-white/5 dark:text-white/80 dark:hover:border-white/15 dark:hover:bg-white/10 dark:hover:text-white dark:data-[state=open]:border-[#D4A23C]/30 dark:data-[state=open]:bg-[#D4A23C]/10 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:h-11! group-data-[collapsible=icon]:w-11! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:rounded-2xl group-data-[collapsible=icon]:border-[#D1D9DA]/80 group-data-[collapsible=icon]:bg-[#F7F8FA] dark:group-data-[collapsible=icon]:border-white/10 dark:group-data-[collapsible=icon]:bg-white/[0.06] group-data-[collapsible=icon]:p-0!"
                            data-test="sidebar-menu-button"
                        >
                            <UserInfo user={auth.user} />
                            <ChevronsUpDown className="ml-auto size-4 shrink-0 text-slate-400 transition-colors duration-150 group-hover/userbtn:text-slate-600 dark:text-white/40 dark:group-hover/userbtn:text-white/70 group-data-[collapsible=icon]:hidden" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-xl border border-white/10 bg-[#082F54] shadow-xl shadow-black/30"
                        align="end"
                        side={
                            isMobile
                                ? 'bottom'
                                : state === 'collapsed'
                                  ? 'left'
                                  : 'bottom'
                        }
                    >
                        <UserMenuContent user={auth.user} />
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
