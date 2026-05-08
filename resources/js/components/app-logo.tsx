import type { ImgHTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

export const CIM_LOGO_WIDE_SRC = '/logo_twil.png';
export const CIM_LOGO_MARK_SRC = '/logo_sghir.png';

type AppLogoVariant = 'wide' | 'mark';

type AppLogoProps = ImgHTMLAttributes<HTMLImageElement> & {
    variant?: AppLogoVariant;
};

export default function AppLogo({
    className,
    alt = 'CIM Bank',
    variant = 'wide',
    ...props
}: AppLogoProps) {
    const isMark = variant === 'mark';

    return (
        <img
            src={isMark ? CIM_LOGO_MARK_SRC : CIM_LOGO_WIDE_SRC}
            alt={alt}
            className={cn(
                isMark
                    ? 'size-9 object-contain'
                    : 'h-12 w-auto max-w-full object-contain',
                className,
            )}
            {...props}
        />
    );
}
