import { useFlashToast } from '@/hooks/use-flash-toast';
import { useAppearance } from '@/hooks/use-appearance';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

function Toaster({ ...props }: ToasterProps) {
    const { appearance } = useAppearance();

    useFlashToast();

    return (
        <Sonner
            theme={appearance}
            className="toaster group"
            position="top-right"
            richColors
            style={
                {
                    '--normal-bg': 'rgba(255, 255, 255, 0.94)',
                    '--normal-text': '#061F39',
                    '--normal-border': '#D1D9DA',
                    '--success-bg': 'rgba(255, 255, 255, 0.96)',
                    '--success-text': '#061F39',
                    '--success-border': '#D4A23C',
                    '--error-bg': 'rgba(255, 255, 255, 0.96)',
                    '--error-text': '#7f1d1d',
                    '--error-border': '#fecaca',
                } as React.CSSProperties
            }
            {...props}
        />
    );
}

export { Toaster };
