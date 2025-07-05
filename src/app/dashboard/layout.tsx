'use client';

import type React from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardNav } from '@/components/dashboard-nav';
import { useAuth } from '@/hooks/useAuth';
import { authService } from '@/services/authService';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !authService.isAuthenticated()) {
            console.log('isAuthenticated:', isAuthenticated);
            console.log('isLoading:', isLoading);
            console.log('Redirecting to login page');
            router.push('/login');
        }
    }, [isAuthenticated, isLoading, router]);

    // Show loading spinner while checking authentication
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    // If not authenticated, don't render dashboard (will redirect)
    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className='min-h-screen flex flex-col'>
            <DashboardNav />
            <main className='flex-1 bg-gray-50'>{children}</main>
        </div>
    );
}