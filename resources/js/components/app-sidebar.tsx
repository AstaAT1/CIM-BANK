import { Link, usePage } from '@inertiajs/react';
import {
    BriefcaseBusiness,
    Coins,
    LayoutDashboard,
    MapPin,
    MapPinned,
    ReceiptText,
    Send,
    UserCheck,
    Users,
    UsersRound,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { pending } from '@/routes/account';
import { index as accountOpeningRequestsIndex } from '@/routes/admin/account-opening-requests';
import { index as adminAtmsIndex } from '@/routes/admin/atms';
import { index as customersDashboardIndex } from '@/routes/admin/customers-dashboard';
import { atmMap, exchangeRates } from '@/routes/customer';
import type { NavItem } from '@/types';

const bankOperationsNavItems: NavItem[] = [
    {
        title: 'Verification Users',
        href: accountOpeningRequestsIndex(),
        icon: UserCheck,
        activeMatch: 'prefix',
    },
    {
        title: 'Customers Dashboard',
        href: customersDashboardIndex(),
        icon: Users,
        activeMatch: 'prefix',
    },
    {
        title: 'ATM Operations',
        href: adminAtmsIndex(),
        icon: MapPinned,
        activeMatch: 'prefix',
    },
    {
        title: 'Machrou3i Review',
        href: '/admin/machrou3i',
        icon: BriefcaseBusiness,
        activeMatch: 'prefix',
    },
];

const verifiedCustomerNavItems: NavItem[] = [
    {
        title: 'Home',
        href: dashboard(),
        icon: LayoutDashboard,
    },
    {
        title: 'ATM Locator',
        href: atmMap(),
        icon: MapPin,
        activeMatch: 'prefix',
    },
    {
        title: 'Exchange Rates',
        href: exchangeRates(),
        icon: Coins,
        activeMatch: 'prefix',
    },
    {
        title: 'Beneficiaries',
        href: '/customer/beneficiaries',
        icon: UsersRound,
        activeMatch: 'prefix',
    },
    {
        title: 'Transfers',
        href: '/customer/transfers',
        icon: Send,
        activeMatch: 'prefix',
    },
    {
        title: 'Bills & AutoPay',
        href: '/customer/bills',
        icon: ReceiptText,
        activeMatch: 'prefix',
    },
    {
        title: 'Machrou3i',
        href: '/customer/machrou3i',
        icon: BriefcaseBusiness,
        activeMatch: 'prefix',
    },
];

const limitedCustomerNavItems: NavItem[] = [
    {
        title: 'Home',
        href: pending(),
        icon: LayoutDashboard,
    },
];

export function AppSidebar() {
    const { auth } = usePage().props;
    const roles = auth.user?.roles ?? [];
    const isBankStaff = roles.includes('admin') || roles.includes('employee');
    const isVerifiedCustomer = auth.user?.profile?.status === 'verified';

    const homeHref = isBankStaff
        ? customersDashboardIndex()
        : isVerifiedCustomer
          ? dashboard()
          : pending();

    const navLabel = isBankStaff ? 'Bank Operations' : 'Home';
    const navItems = isBankStaff
        ? bankOperationsNavItems
        : isVerifiedCustomer
          ? verifiedCustomerNavItems
          : limitedCustomerNavItems;

    return (
        <Sidebar
            collapsible="icon"
            variant="sidebar"
            className="border-r border-[#D1D9DA] bg-white dark:border-[#0A6474]/15 dark:bg-[#061F39]"
        >
            <SidebarHeader className="px-4 pt-5 pb-4 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:pt-4 group-data-[collapsible=icon]:pb-3">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            asChild
                            tooltip="CIM Bank"
                            className="h-14 rounded-2xl border-0 bg-transparent px-0 text-[#061F39] shadow-none hover:bg-[#082F54]/7 data-[active=true]:bg-transparent dark:text-white dark:hover:bg-white/[0.06] group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:h-11! group-data-[collapsible=icon]:w-11! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:rounded-2xl group-data-[collapsible=icon]:p-0!"
                        >
                            <Link
                                href={homeHref}
                                prefetch
                                className="flex min-w-0 items-center group-data-[collapsible=icon]:justify-center"
                            >
                                <AppLogo
                                    variant="wide"
                                    className="h-12 w-auto max-w-[180px] group-data-[collapsible=icon]:hidden"
                                />
                                <AppLogo
                                    variant="mark"
                                    className="hidden h-9 w-9 group-data-[collapsible=icon]:block"
                                />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="px-3 pt-1 pb-3 !overflow-visible group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:gap-2 group-data-[collapsible=icon]:overflow-hidden! group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:pt-1">
                <div className="mb-3 px-2 group-data-[collapsible=icon]:hidden">
                    <p className="text-[11px] font-bold tracking-[0.18em] text-slate-400 uppercase dark:text-white/35">
                        {navLabel}
                    </p>
                </div>

                <NavMain items={navItems} label={navLabel} />
            </SidebarContent>

            <SidebarFooter className="mt-auto border-t border-[#D1D9DA]/80 px-4 pt-3 pb-4 dark:border-white/10 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:pt-3 group-data-[collapsible=icon]:pb-4">
                <NavUser />
            </SidebarFooter>

            <SidebarRail />
        </Sidebar>
    );
}
