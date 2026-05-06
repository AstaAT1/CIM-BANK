import { Head } from '@inertiajs/react';

type AdminPageProps = Record<string, unknown>;

export default function AdminAccounts(props: AdminPageProps) {
    return (
        <>
            <Head title="Bank Accounts" />
            <section className="space-y-4 p-6">
                <h1 className="text-2xl font-semibold">Bank Accounts</h1>
                <pre className="overflow-auto rounded border p-4 text-sm">
                    {JSON.stringify(props, null, 2)}
                </pre>
            </section>
        </>
    );
}
