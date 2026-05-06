import { Head } from '@inertiajs/react';

type AdminPageProps = Record<string, unknown>;

export default function AdminTransfers(props: AdminPageProps) {
    return (
        <>
            <Head title="Transfer Review" />
            <section className="space-y-4 p-6">
                <h1 className="text-2xl font-semibold">Transfer Review</h1>
                <pre className="overflow-auto rounded border p-4 text-sm">
                    {JSON.stringify(props, null, 2)}
                </pre>
            </section>
        </>
    );
}
