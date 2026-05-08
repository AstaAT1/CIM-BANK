import { Moon, Sun } from 'lucide-react';
import { useAppearance } from '@/hooks/use-appearance';
import { cn } from '@/lib/utils';

export default function ThemeToggle({ className }) {
    const { resolvedAppearance, updateAppearance } = useAppearance();
    const isDark = resolvedAppearance === 'dark';
    const Icon = isDark ? Sun : Moon;

    return (
        <button
            type="button"
            onClick={() => updateAppearance(isDark ? 'light' : 'dark')}
            className={cn(
                'inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#D1D9DA]/80 bg-white/85 text-[#082F54] shadow-sm backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-[#D4A23C] hover:bg-[#F7F8FA] hover:text-[#061F39] focus-visible:ring-2 focus-visible:ring-[#D4A23C]/35 focus-visible:outline-none dark:border-white/12 dark:bg-white/10 dark:text-white dark:hover:border-[#D4A23C]/45 dark:hover:bg-white/15 dark:hover:text-[#D4A23C]',
                className,
            )}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
            <Icon className="h-5 w-5" />
        </button>
    );
}
