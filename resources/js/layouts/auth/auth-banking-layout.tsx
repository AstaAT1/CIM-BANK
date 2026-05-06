import { lazy, Suspense } from 'react';
import type { AuthLayoutProps } from '@/types';

const BankingScene3D = lazy(() => import('@/components/banking/BankingScene3D'));

function ShieldIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L3 6.5v5c0 4.7 3.8 9.1 9 10.5 5.2-1.4 9-5.8 9-10.5v-5L12 2z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
        </svg>
    );
}
function LockIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
    );
}
function KeyIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="15.5" cy="8.5" r="5.5" />
            <path d="M11.5 12.5L3 21M3 21l3-1M3 21l1-3" />
        </svg>
    );
}

function CimLogoSVG() {
    return (
        <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22 24C16 24 12 28 12 34L12 46C12 52 16 56 22 56L32 56L32 50L22 50C19.8 50 18 48.2 18 46L18 34C18 31.8 19.8 30 22 30L32 30L32 24Z" fill="#D4A23C" />
            <rect x="37" y="24" width="6" height="32" fill="#D4A23C" />
            <path d="M49 24L49 56L55 56L55 36L62 46L69 36L69 56L75 56L75 24L69 24L62 34L55 24Z" fill="white" fillOpacity="0.9" />
            <rect x="39" y="21" width="4" height="4" fill="#D4A23C" transform="rotate(45 41 23)" />
        </svg>
    );
}

export default function AuthBankingLayout({ children, title, description }: AuthLayoutProps) {
    return (
        <div className="cim-root">
            {/* Full-screen 3D background */}
            <div className="cim-canvas">
                <Suspense fallback={<div style={{ background: '#061F39', width: '100%', height: '100%', position: 'absolute', inset: 0 }} />}>
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
                        <div className="cim-logo-mark">
                            <CimLogoSVG />
                        </div>
                        <div className="cim-logo-name">CIM</div>
                        <div className="cim-logo-sub">Credit Intelligence Mizan</div>
                    </div>

                    {/* Header */}
                    <div className="cim-hdr">
                        <h1>{title || 'Secure Banking Login'}</h1>
                        <p>{description || 'Access your CIM account securely'}</p>
                    </div>

                    {/* Form slot */}
                    {children}

                    {/* Trust indicators */}
                    <div className="cim-trust">
                        <span className="cim-trust-item"><ShieldIcon /> 256-bit Encryption</span>
                        <span className="cim-trust-item"><LockIcon /> Fraud Protection</span>
                        <span className="cim-trust-item"><KeyIcon /> Secure Access</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
