import { Head, usePage } from '@inertiajs/react';

/** ATM Detail — placeholder. Frontend team will build the final UI. */
export default function AtmMapShow() {
    const props = usePage().props;
    return (
        <>
            <Head title="ATM Detail — CIM" />
            <div style={{ fontFamily: 'monospace', padding: 32, background: '#f7f8fa', minHeight: '100vh' }}>
                <h1 style={{ fontSize: '1.1rem', color: '#082F54', marginBottom: 8 }}>
                    customer/atm-map/show — Placeholder
                </h1>
                <p style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: 24 }}>
                    Final UI to be built by the frontend team. Props preview:
                </p>
                <pre style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 20, fontSize: '0.75rem', overflowX: 'auto', color: '#374151', lineHeight: 1.6 }}>
                    {JSON.stringify(props, null, 2)}
                </pre>
            </div>
        </>
    );
}
