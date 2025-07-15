import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}

export function LoadingSpinner({
    className,
    size = 'md',
}: LoadingSpinnerProps) {
    return (
        <div
            className={cn(
                'animate-spin rounded-full border-2 border-current border-t-transparent',
                {
                    'h-4 w-4': size === 'sm',
                    'h-6 w-6': size === 'md',
                    'h-8 w-8': size === 'lg',
                },
                className
            )}
        >
            <span className='sr-only'>Loading...</span>
        </div>
    );
}

interface LoadingProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg';
    text?: string;
    fullPage?: boolean;
}

export function Loading({
    className,
    size = 'md',
    text = 'Loading...',
    fullPage = false,
}: LoadingProps) {
    const sizeClasses = {
        sm: 'h-4 w-4',
        md: 'h-8 w-8',
        lg: 'h-12 w-12',
    };

    const textSizeClasses = {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg',
    };

    if (fullPage) {
        return (
            <div className='min-h-screen flex items-center justify-center bg-background'>
                <div className='flex flex-col items-center space-y-4'>
                    <Loader2
                        className={cn(
                            sizeClasses[size],
                            'animate-spin text-primary'
                        )}
                    />
                    <p
                        className={cn(
                            'text-muted-foreground',
                            textSizeClasses[size]
                        )}
                    >
                        {text}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className={cn('flex items-center justify-center p-8', className)}>
            <div className='flex flex-col items-center space-y-2'>
                <Loader2
                    className={cn(
                        sizeClasses[size],
                        'animate-spin text-primary'
                    )}
                />
                <p
                    className={cn(
                        'text-muted-foreground',
                        textSizeClasses[size]
                    )}
                >
                    {text}
                </p>
            </div>
        </div>
    );
}

export function LoadingCard({
    text = 'Loading...',
    className,
}: {
    text?: string;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'rounded-lg border bg-card text-card-foreground shadow-sm',
                className
            )}
        >
            <div className='p-6'>
                <div className='flex items-center justify-center space-x-2'>
                    <Loader2 className='h-6 w-6 animate-spin text-primary' />
                    <span className='text-sm text-muted-foreground'>
                        {text}
                    </span>
                </div>
            </div>
        </div>
    );
}

export function PageLoading({ text = 'Loading page...' }: { text?: string }) {
    return <Loading fullPage text={text} size='lg' />;
}
