import CimFeedbackModal from '@/components/cim-feedback-modal';
import { usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function CimFlashFeedback() {
    const { props } = usePage();
    const flash = props.flash;
    const [errorMessage, setErrorMessage] = useState('');
    const success = flash?.success;
    const error = flash?.error;

    useEffect(() => {
        if (success) {
            toast.success(success);
        }
    }, [success]);

    useEffect(() => {
        if (error) {
            setErrorMessage(error);
        }
    }, [error]);

    return (
        <CimFeedbackModal
            open={Boolean(errorMessage)}
            type="error"
            title="Action failed"
            message={errorMessage}
            confirmLabel="Close"
            onClose={() => setErrorMessage('')}
        />
    );
}
