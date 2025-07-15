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
            title='Dashboard Error'
            description='There was a problem loading your dashboard. Please try again.'
        />
    );
}
