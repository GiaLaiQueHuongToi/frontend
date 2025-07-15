'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Sparkles,
    Video,
    LayoutDashboard,
    Settings,
    LogOut,
    User,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import Image from 'next/image';

export function DashboardNav() {
    const pathname = usePathname();
    const { user, logout } = useAuth();

    const handleLogout = () => {
        logout();
    };

    return (
        <div className='border-b'>
            <div className='flex h-16 items-center px-4 container mx-auto'>
                <div className='flex items-center gap-2 mr-8'>
                    <Sparkles className='h-5 w-5 text-purple-600' />
                    <span className='font-bold text-xl'>AI Video Creator</span>
                </div>
                <nav className='flex items-center space-x-4 lg:space-x-6 mx-6 flex-1'>
                    <Link
                        href='/dashboard'
                        className={cn(
                            'text-sm font-medium transition-colors hover:text-purple-600',
                            pathname === '/dashboard'
                                ? 'text-purple-600'
                                : 'text-muted-foreground'
                        )}
                    >
                        <div className='flex items-center gap-2'>
                            <LayoutDashboard className='h-4 w-4' />
                            <span>Dashboard</span>
                        </div>
                    </Link>
                    <Link
                        href='/dashboard/create'
                        className={cn(
                            'text-sm font-medium transition-colors hover:text-purple-600',
                            pathname === '/dashboard/create'
                                ? 'text-purple-600'
                                : 'text-muted-foreground'
                        )}
                    >
                        <div className='flex items-center gap-2'>
                            <Video className='h-4 w-4' />
                            <span>Create Video</span>
                        </div>
                    </Link>
                </nav>
                <div className='ml-auto flex items-center space-x-4'>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant='ghost'
                                className='relative h-8 w-8 rounded-full'
                            >
                                <div className='flex h-8 w-8 items-center justify-center rounded-full bg-purple-100'>
                                    <User className='h-4 w-4 text-purple-600' />
                                </div>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            className='w-56'
                            align='end'
                            forceMount
                        >
                            <DropdownMenuLabel className='font-normal'>
                                <div className='flex flex-col space-y-1'>
                                    <p className='text-sm font-medium leading-none'>
                                        {user?.username || 'Loading...'}
                                    </p>
                                    {/* <p className='text-xs leading-none text-muted-foreground'>
                                        user@example.com
                                    </p> */}
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                                <Settings className='mr-2 h-4 w-4' />
                                <span>Settings</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <Link href='/'>
                                <DropdownMenuItem onClick={handleLogout}>
                                    <LogOut className='mr-2 h-4 w-4' />
                                    <span>Log out</span>
                                </DropdownMenuItem>
                            </Link>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </div>
    );
}
