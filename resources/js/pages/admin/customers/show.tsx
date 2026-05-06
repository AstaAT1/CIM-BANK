import { Head } from '@inertiajs/react';

type AdminPageProps = Record<string, unknown>;

export default function AdminCustomerShow(props: AdminPageProps) {
    return (
        <>
            <Head title="Customer 360" />
            <section className="space-y-4 p-6">
                <h1 className="text-2xl font-semibold">Customer 360</h1>
                <pre className="overflow-auto rounded border p-4 text-sm">
                    {JSON.stringify(props, null, 2)}
                </pre>
            </section>
        </>
    );
}
