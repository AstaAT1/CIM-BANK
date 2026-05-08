import { Link } from '@inertiajs/react';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavItem } from '@/types';

type NavMainProps = {
    items: NavItem[];
    label?: string;
};

export function NavMain({ items = [], label = 'Platform' }: NavMainProps) {
    const { isCurrentOrParentUrl, isCurrentUrl } = useCurrentUrl();

    return (
        <SidebarGroup className="px-3 py-2 group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:px-0">
            {/* Section label — e.g. "Bank Operations" or "Home" */}
            <SidebarGroupLabel className="mb-1 px-2 text-[10px] font-semibold tracking-[0.12em] text-white/35 uppercase">
                {label}
            </SidebarGroupLabel>

            <SidebarMenu className="gap-0.5 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:gap-2">
                {items.map((item) => {
                    const isActive =
                        item.isActive ??
                        (item.activeMatch === 'prefix'
                            ? isCurrentOrParentUrl(item.href)
                            : isCurrentUrl(item.href));

                    return (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                asChild
                                isActive={isActive}
                                tooltip={{ children: item.title }}
                                className={[
                                    // base
                                    'group/navbtn relative h-9 w-full rounded-lg px-3 text-sm font-medium transition-all duration-150',
                                    // inactive state — subtle ghost on navy
                                    'text-white/65 hover:bg-white/8 hover:text-white',
                                    // active state — gold accent pill
                                    'data-[active=true]:bg-[#D4A23C]/15 data-[active=true]:text-[#D4A23C]',
                                    // icon sizing
                                    '[&>svg]:size-4 [&>svg]:shrink-0',
                                    // active indicator bar on the left edge
                                    'data-[active=true]:before:absolute data-[active=true]:before:top-1/2 data-[active=true]:before:left-0 data-[active=true]:before:h-5 data-[active=true]:before:w-[3px] data-[active=true]:before:-translate-y-1/2 data-[active=true]:before:rounded-full data-[active=true]:before:bg-[#D4A23C]',
                                    // collapsed icon rail
                                    'group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:h-11! group-data-[collapsible=icon]:w-11! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:rounded-2xl group-data-[collapsible=icon]:p-0! group-data-[collapsible=icon]:shadow-none group-data-[collapsible=icon]:before:hidden group-data-[collapsible=icon]:data-[active=true]:bg-[#D4A23C]/18 group-data-[collapsible=icon]:data-[active=true]:shadow-[inset_0_0_0_1px_rgba(212,162,60,0.28),0_10px_24px_rgba(0,0,0,0.16)]',
                                ].join(' ')}
                            >
                                <Link href={item.href} prefetch>
                                    {item.icon && (
                                        <item.icon
                                            className={
                                                isActive
                                                    ? 'text-[#D4A23C]'
                                                    : 'text-white/50 group-hover/navbtn:text-white/80'
                                            }
                                        />
                                    )}
                                    <span className="group-data-[collapsible=icon]:hidden">
                                        {item.title}
                                    </span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}
