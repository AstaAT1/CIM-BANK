import { Link, usePage } from '@inertiajs/react';
import {
    BookOpen,
    FolderGit2,
    Coins,
    LayoutDashboard,
    MapPin,
    MapPinned,
    ReceiptText,
    Send,
    User,
    UserCheck,
    Users,
    UsersRound,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
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
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { pending } from '@/routes/account';
import { dashboard as adminDashboard } from '@/routes/admin';
import { index as accountOpeningRequestsIndex } from '@/routes/admin/account-opening-requests';
import { index as appointmentAttendeesIndex } from '@/routes/admin/appointment-attendees';
import { index as adminAtmsIndex } from '@/routes/admin/atms';
import { atmMap, exchangeRates } from '@/routes/customer';
import { edit as editProfile } from '@/routes/profile';
import type { NavItem } from '@/types';

const bankOperationsNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: adminDashboard(),
        icon: LayoutDashboard,
    },
    {
        title: 'Verification Users',
        href: accountOpeningRequestsIndex(),
        icon: UserCheck,
        activeMatch: 'prefix',
    },
    {
        title: 'Customers Dashboard',
        href: appointmentAttendeesIndex(),
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
        title: 'Beneficiary Approvals',
        href: '/admin/beneficiaries',
        icon: UsersRound,
        activeMatch: 'prefix',
    },
];

const verifiedCustomerNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutDashboard,
    },
    {
        title: 'Profile',
        href: editProfile(),
        icon: User,
        activeMatch: 'prefix',
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
];

const limitedCustomerNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: pending(),
        icon: LayoutDashboard,
    },
    {
        title: 'Profile',
        href: editProfile(),
        icon: User,
        activeMatch: 'prefix',
    },
];

const footerNavItems: NavItem[] = [
    {
        title: 'Repository',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: FolderGit2,
    },
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: BookOpen,
    },
];

export function AppSidebar() {
    const { auth } = usePage().props;
    const roles = auth.user?.roles ?? [];
    const isBankStaff = roles.includes('admin') || roles.includes('employee');
    const isVerifiedCustomer = auth.user?.profile?.status === 'verified';
    const homeHref = isBankStaff
        ? adminDashboard()
        : isVerifiedCustomer
          ? dashboard()
          : pending();
    const navLabel = isBankStaff ? 'Bank Operations' : 'My Banking';
    const navItems = isBankStaff
        ? bankOperationsNavItems
        : isVerifiedCustomer
          ? verifiedCustomerNavItems
          : limitedCustomerNavItems;

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={homeHref} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={navItems} label={navLabel} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
