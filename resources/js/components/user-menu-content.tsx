import { Link, router } from '@inertiajs/react';
import { LogOut, User as UserIcon } from 'lucide-react';
import {
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { UserInfo } from '@/components/user-info';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { logout } from '@/routes';
import { edit } from '@/routes/profile';
import type { User } from '@/types';

type Props = {
    user: User;
};

export function UserMenuContent({ user }: Props) {
    const cleanup = useMobileNavigation();

    const handleLogout = () => {
        cleanup();
        router.flushAll();
    };

    return (
        <>
            {/* User identity header */}
            <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2.5 px-3 py-2.5">
                    <UserInfo user={user} showEmail={true} />
                </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator className="bg-white/10" />

            {/* Profile link */}
            <DropdownMenuGroup className="p-1">
                <DropdownMenuItem
                    asChild
                    className="cursor-pointer rounded-lg px-3 py-2 text-sm text-white/80 transition-colors duration-100 hover:bg-white/10 hover:text-white focus:bg-white/10 focus:text-white"
                >
                    <Link
                        className="flex w-full items-center gap-2.5"
                        href={edit()}
                        prefetch
                        onClick={cleanup}
                    >
                        <UserIcon className="size-4 text-[#0A6474]" />
                        <span>Profile</span>
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator className="bg-white/10" />

            {/* Logout */}
            <div className="p-1">
                <DropdownMenuItem
                    asChild
                    className="cursor-pointer rounded-lg px-3 py-2 text-sm text-white/70 transition-colors duration-100 hover:bg-red-500/15 hover:text-red-400 focus:bg-red-500/15 focus:text-red-400"
                >
                    <Link
                        className="flex w-full items-center gap-2.5"
                        href={logout()}
                        as="button"
                        onClick={handleLogout}
                        data-test="logout-button"
                    >
                        <LogOut className="size-4" />
                        <span>Log out</span>
                    </Link>
                </DropdownMenuItem>
            </div>
        </>
    );
}
