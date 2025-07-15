'use client';

import { LoadingWrapper } from '@/components/loading-wrapper';

export default function Template({ children }: { children: React.ReactNode }) {
    return (
        <LoadingWrapper
            errorTitle='Application Error'
            errorDescription='Something went wrong. Please try refreshing the page.'
        >
            {children}
        </LoadingWrapper>
    );
}
