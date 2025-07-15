'use client';

import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ErrorPageProps {
    error?: Error & { digest?: string };
    reset?: () => void;
    title?: string;
    description?: string;
    showHomeButton?: boolean;
    className?: string;
}

export function ErrorPage({
    error,
    reset,
    title = 'Something went wrong!',
    description = 'An unexpected error occurred. Please try again.',
    showHomeButton = true,
    className,
}: ErrorPageProps) {
    return (
        <div
            className={cn(
                'min-h-screen flex items-center justify-center bg-background p-4',
                className
            )}
        >
            <Card className='w-full max-w-md'>
                <CardHeader className='text-center'>
                    <div className='mx-auto mb-4 h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center'>
                        <AlertTriangle className='h-6 w-6 text-destructive' />
                    </div>
                    <CardTitle className='text-xl'>{title}</CardTitle>
                    <CardDescription>{description}</CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                    {error && process.env.NODE_ENV === 'development' && (
                        <div className='rounded-md bg-muted p-3'>
                            <p className='text-xs text-muted-foreground font-mono'>
                                {error.message}
                            </p>
                            {error.digest && (
                                <p className='text-xs text-muted-foreground mt-1'>
                                    Digest: {error.digest}
                                </p>
                            )}
                        </div>
                    )}
                    <div className='flex flex-col gap-2'>
                        {reset && (
                            <Button onClick={reset} className='w-full'>
                                <RefreshCw className='mr-2 h-4 w-4' />
                                Try Again
                            </Button>
                        )}
                        {showHomeButton && (
                            <Button
                                variant='outline'
                                onClick={() => (window.location.href = '/')}
                                className='w-full'
                            >
                                <Home className='mr-2 h-4 w-4' />
                                Go Home
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export function ErrorCard({
    error,
    onRetry,
    title = 'Error',
    description = 'Something went wrong',
    className,
}: {
    error?: Error;
    onRetry?: () => void;
    title?: string;
    description?: string;
    className?: string;
}) {
    return (
        <Card className={cn('w-full', className)}>
            <CardContent className='p-6'>
                <div className='flex items-center space-x-2 mb-4'>
                    <AlertTriangle className='h-5 w-5 text-destructive' />
                    <h3 className='font-semibold'>{title}</h3>
                </div>
                <p className='text-sm text-muted-foreground mb-4'>
                    {description}
                </p>
                {error && process.env.NODE_ENV === 'development' && (
                    <p className='text-xs text-muted-foreground font-mono mb-4 p-2 bg-muted rounded'>
                        {error.message}
                    </p>
                )}
                {onRetry && (
                    <Button onClick={onRetry} size='sm'>
                        <RefreshCw className='mr-2 h-4 w-4' />
                        Retry
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}

export function NotFound({
    title = 'Page Not Found',
    description = 'The page you are looking for does not exist.',
    showHomeButton = true,
}: {
    title?: string;
    description?: string;
    showHomeButton?: boolean;
}) {
    return (
        <div className='min-h-screen flex items-center justify-center bg-background p-4'>
            <Card className='w-full max-w-md'>
                <CardHeader className='text-center'>
                    <div className='mx-auto mb-4 text-6xl font-bold text-muted-foreground'>
                        404
                    </div>
                    <CardTitle className='text-xl'>{title}</CardTitle>
                    <CardDescription>{description}</CardDescription>
                </CardHeader>
                {showHomeButton && (
                    <CardContent>
                        <Button
                            onClick={() => (window.location.href = '/')}
                            className='w-full'
                        >
                            <Home className='mr-2 h-4 w-4' />
                            Go Home
                        </Button>
                    </CardContent>
                )}
            </Card>
        </div>
    );
}
