'use client';

import { Suspense, ReactNode, Component, ErrorInfo } from 'react';
import { Loading, LoadingCard } from '@/components/ui/loading';
import { ErrorCard } from '@/components/ui/error';

interface ErrorBoundaryState {
    hasError: boolean;
    error?: Error;
}

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        this.props.onError?.(error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback;
        }

        return this.props.children;
    }
}

interface LoadingWrapperProps {
    children: ReactNode;
    fallback?: ReactNode;
    loadingText?: string;
    errorTitle?: string;
    errorDescription?: string;
    className?: string;
    onRetry?: () => void;
}

export function LoadingWrapper({
    children,
    fallback,
    loadingText = 'Loading...',
    errorTitle = 'Something went wrong',
    errorDescription = 'An error occurred while loading this content.',
    className,
    onRetry,
}: LoadingWrapperProps) {
    const defaultFallback = fallback || (
        <Loading text={loadingText} className={className} />
    );

    return (
        <ErrorBoundary
            fallback={
                <ErrorCard
                    title={errorTitle}
                    description={errorDescription}
                    onRetry={onRetry}
                    className={className}
                />
            }
        >
            <Suspense fallback={defaultFallback}>{children}</Suspense>
        </ErrorBoundary>
    );
}

interface LoadingCardWrapperProps {
    children: ReactNode;
    loadingText?: string;
    errorTitle?: string;
    errorDescription?: string;
    className?: string;
    onRetry?: () => void;
}

export function LoadingCardWrapper({
    children,
    loadingText = 'Loading...',
    errorTitle = 'Error',
    errorDescription = 'Failed to load content.',
    className,
    onRetry,
}: LoadingCardWrapperProps) {
    return (
        <ErrorBoundary
            fallback={
                <ErrorCard
                    title={errorTitle}
                    description={errorDescription}
                    onRetry={onRetry}
                    className={className}
                />
            }
        >
            <Suspense
                fallback={
                    <LoadingCard text={loadingText} className={className} />
                }
            >
                {children}
            </Suspense>
        </ErrorBoundary>
    );
}
