import * as React from 'react';

function cn(...classes: (string | undefined | false | null)[]) {
    return classes.filter(Boolean).join(' ');
}

export interface FlippableCreditCardProps extends React.HTMLAttributes<HTMLDivElement> {
    cardholderName: string;
    cardNumber: string;
    expiryDate: string;
    cvv: string;
}

const FlippableCreditCard = React.forwardRef<
    HTMLDivElement,
    FlippableCreditCardProps
>(
    (
        { className, cardholderName, cardNumber, expiryDate, cvv, ...props },
        ref,
    ) => {
        return (
            <div
                className={cn(
                    'group h-48 w-80 [perspective:1000px]',
                    className,
                )}
                ref={ref}
                {...props}
            >
                <div className="relative h-full w-full rounded-2xl shadow-2xl transition-transform duration-700 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]">
                    {/* ── Front side ── */}
                    <div
                        className="absolute h-full w-full overflow-hidden rounded-2xl text-white [backface-visibility:hidden]"
                        style={{
                            background:
                                'linear-gradient(135deg, #061F39 0%, #082F54 50%, #0A6474 100%)',
                        }}
                    >
                        {/* Decorative glows */}
                        <div
                            className="absolute -top-20 -left-14 h-52 w-52 rounded-full blur-3xl"
                            style={{
                                backgroundColor: 'rgba(212, 162, 60, 0.15)',
                            }}
                        />
                        <div
                            className="absolute -right-12 -bottom-20 h-52 w-52 rounded-full blur-3xl"
                            style={{
                                backgroundColor: 'rgba(10, 100, 116, 0.25)',
                            }}
                        />

                        <div className="relative flex h-full flex-col justify-between p-5">
                            {/* Top row: chip + network */}
                            <div className="flex items-start justify-between">
                                {/* EMV chip */}
                                <div
                                    className="grid h-10 w-12 place-items-center rounded-md shadow-inner"
                                    style={{
                                        background:
                                            'linear-gradient(135deg, #D4A23C 0%, #f0c96e 50%, #D4A23C 100%)',
                                    }}
                                >
                                    <div
                                        className="h-7 w-9 rounded-sm border"
                                        style={{
                                            borderColor:
                                                'rgba(136, 88, 17, 0.45)',
                                        }}
                                    />
                                </div>
                                <p className="text-sm font-bold tracking-widest text-white/90">
                                    MASTERCARD
                                </p>
                            </div>

                            {/* Card number */}
                            <div className="text-center font-mono text-lg tracking-[0.2em]">
                                {cardNumber}
                            </div>

                            {/* Bottom row: holder + expiry */}
                            <div className="flex items-end justify-between">
                                <div className="text-left">
                                    <p
                                        className="text-[10px] font-semibold tracking-wide uppercase"
                                        style={{
                                            color: 'rgba(212, 162, 60, 0.7)',
                                        }}
                                    >
                                        Card Holder
                                    </p>
                                    <p className="font-mono text-sm font-medium text-white/95">
                                        {cardholderName}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p
                                        className="text-[10px] font-semibold tracking-wide uppercase"
                                        style={{
                                            color: 'rgba(212, 162, 60, 0.7)',
                                        }}
                                    >
                                        Expires
                                    </p>
                                    <p className="font-mono text-sm font-medium text-white/95">
                                        {expiryDate}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Subtle gold border accent at the bottom */}
                        <div
                            className="absolute bottom-0 left-0 h-[2px] w-full"
                            style={{
                                background:
                                    'linear-gradient(90deg, transparent, #D4A23C, transparent)',
                            }}
                        />
                    </div>

                    {/* ── Back side ── */}
                    <div
                        className="absolute h-full w-full [transform:rotateY(180deg)] overflow-hidden rounded-2xl text-white [backface-visibility:hidden]"
                        style={{
                            background:
                                'linear-gradient(135deg, #082F54 0%, #061F39 100%)',
                        }}
                    >
                        <div className="flex h-full flex-col">
                            {/* Magnetic stripe */}
                            <div
                                className="mt-7 h-11 w-full"
                                style={{ backgroundColor: '#061F39' }}
                            />

                            {/* CVV strip */}
                            <div className="mx-5 mt-5 flex justify-end">
                                <div
                                    className="flex h-9 w-full items-center justify-end rounded-md pr-4"
                                    style={{ backgroundColor: '#D1D9DA' }}
                                >
                                    <p
                                        className="font-mono text-sm font-semibold"
                                        style={{ color: '#061F39' }}
                                    >
                                        {cvv}
                                    </p>
                                </div>
                            </div>
                            <p
                                className="self-end pt-1 pr-5 text-xs font-semibold uppercase"
                                style={{ color: 'rgba(212, 162, 60, 0.7)' }}
                            >
                                CVV
                            </p>

                            {/* Mastercard circles */}
                            <div className="mt-auto flex items-center justify-end p-5 text-right">
                                <div className="h-8 w-8 rounded-full bg-red-600 opacity-90" />
                                <div
                                    className="-ml-3 h-8 w-8 rounded-full opacity-90"
                                    style={{ backgroundColor: '#D4A23C' }}
                                />
                            </div>
                        </div>

                        {/* Subtle gold border accent at the top */}
                        <div
                            className="absolute top-0 left-0 h-[2px] w-full"
                            style={{
                                background:
                                    'linear-gradient(90deg, transparent, #D4A23C, transparent)',
                            }}
                        />
                    </div>
                </div>
            </div>
        );
    },
);

FlippableCreditCard.displayName = 'FlippableCreditCard';

export { FlippableCreditCard };
