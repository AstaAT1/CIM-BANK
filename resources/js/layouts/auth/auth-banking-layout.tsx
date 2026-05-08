import { lazy, Suspense } from 'react';
import AppLogo from '@/components/app-logo';
import type { AuthLayoutProps } from '@/types';

const BankingScene3D = lazy(
    () => import('@/components/banking/BankingScene3D'),
);

function ShieldIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 2L3 6.5v5c0 4.7 3.8 9.1 9 10.5 5.2-1.4 9-5.8 9-10.5v-5L12 2z"
            />
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4"
            />
        </svg>
    );
}
function LockIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
        >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
    );
}
function KeyIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
        >
            <circle cx="15.5" cy="8.5" r="5.5" />
            <path d="M11.5 12.5L3 21M3 21l3-1M3 21l1-3" />
        </svg>
    );
}

export default function AuthBankingLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="cim-root">
            {/* Full-screen 3D background */}
            <div className="cim-canvas">
                <Suspense
                    fallback={
                        <div
                            style={{
                                background: '#061F39',
                                width: '100%',
                                height: '100%',
                                position: 'absolute',
                                inset: 0,
                            }}
                        />
                    }
                >
                    <BankingScene3D />
                </Suspense>
            </div>

            {/* Radial overlay for depth + readability */}
            <div className="cim-overlay" />

            {/* Centered login card */}
            <div className="cim-center">
                <div className="cim-card">
                    {/* Logo */}
                    <div className="cim-logo">
                        <AppLogo className="cim-logo-image" />
                    </div>

                    {/* Header */}
                    <div className="cim-hdr">
                        <h1>{title || 'Secure Banking Login'}</h1>
                        <p>
                            {description || 'Access your CIM account securely'}
                        </p>
                    </div>

                    {/* Form slot */}
                    {children}

                    {/* Trust indicators */}
                    <div className="cim-trust">
                        <span className="cim-trust-item">
                            <ShieldIcon /> 256-bit Encryption
                        </span>
                        <span className="cim-trust-item">
                            <LockIcon /> Fraud Protection
                        </span>
                        <span className="cim-trust-item">
                            <KeyIcon /> Secure Access
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
