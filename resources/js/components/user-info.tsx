import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import type { User } from '@/types';

export function UserInfo({
    user,
    showEmail = false,
}: {
    user: User;
    showEmail?: boolean;
}) {
    const getInitials = useInitials();

    return (
        <>
            {/* Avatar with gold ring */}
            <Avatar className="h-8 w-8 shrink-0 overflow-hidden rounded-full ring-2 ring-[#D4A23C]/40 group-data-[collapsible=icon]:h-9 group-data-[collapsible=icon]:w-9">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-full bg-[#0A6474] text-xs font-semibold text-white">
                    {getInitials(user.name)}
                </AvatarFallback>
            </Avatar>

            {/* Name + email */}
            <div
                data-slot="user-meta"
                className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden"
            >
                <span className="truncate font-semibold text-white">
                    {user.name}
                </span>
                {showEmail && (
                    <span className="truncate text-xs text-white/50">
                        {user.email}
                    </span>
                )}
            </div>
        </>
    );
}
