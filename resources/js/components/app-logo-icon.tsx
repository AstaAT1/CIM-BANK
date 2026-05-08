import type { ImgHTMLAttributes } from 'react';

import { cn } from '@/lib/utils';
import { CIM_LOGO_MARK_SRC } from '@/components/app-logo';

export default function AppLogoIcon({
    className,
    alt = 'CIM Bank',
    ...props
}: ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <img
            src={CIM_LOGO_MARK_SRC}
            alt={alt}
            className={cn('size-9 object-contain', className)}
            {...props}
        />
    );
}
