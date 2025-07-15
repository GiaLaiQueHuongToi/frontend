'use client';

import { ErrorPage } from '@/components/ui/error';

interface ErrorProps {
    error: Error & { digest?: string };
    reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
    return (
        <ErrorPage
            error={error}
            reset={reset}
            title='Authentication Error'
            description='There was a problem with authentication. Please try again.'
        />
    );
}
