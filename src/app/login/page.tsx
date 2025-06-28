'use client';

import type React from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Sparkles, ArrowLeft, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const { login, isLoading } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Clear previous errors
        setError(null);
        
        if (!username || !password) {
            setError('Please enter both username and password');
            return;
        }

        try {
            await login({ username, password });
        } catch (error) {
            // Display specific error message
            const errorMessage = error instanceof Error ? error.message : 'Login failed';
            setError(errorMessage);
            console.error('Login failed:', error);
        }
    };

    return (
        <div className='min-h-screen flex flex-col'>
            <div className='flex-1 flex items-center justify-center p-4 relative'>
                {/* AI-themed background */}
                <div className='absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 z-0'>
                    <div className='absolute inset-0 opacity-10'>
                        <div className='absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-purple-400 blur-3xl'></div>
                        <div className='absolute top-3/4 left-2/3 w-80 h-80 rounded-full bg-blue-400 blur-3xl'></div>
                        <div className='absolute top-1/2 left-1/3 w-40 h-40 rounded-full bg-pink-400 blur-3xl'></div>
                    </div>
                </div>

                <Card className='w-full max-w-md z-10 shadow-lg'>
                    <CardHeader className='space-y-1'>
                        <div className='flex items-center gap-2'>
                            <Sparkles className='h-5 w-5 text-purple-600' />
                            <CardTitle className='text-2xl'>Sign In</CardTitle>
                        </div>
                        <CardDescription>
                            Enter your credentials to access your account
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSubmit}>
                        <CardContent className='space-y-4'>
                            {/* Error Alert */}
                            {error && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}
                            
                            <div className='space-y-2'>
                                <Label htmlFor='username'>Username</Label>
                                <Input
                                    id='username'
                                    type='text'
                                    placeholder='Enter your username'
                                    value={username}
                                    onChange={(e) => {
                                        setUsername(e.target.value);
                                        if (error) setError(null); // Clear error on input
                                    }}
                                    required
                                />
                            </div>
                            <div className='space-y-2'>
                                <div className='flex items-center justify-between'>
                                    <Label htmlFor='password'>Password</Label>
                                    <Link
                                        href='/forgot-password'
                                        className='text-sm text-purple-600 hover:underline'
                                    >
                                        Forgot password?
                                    </Link>
                                </div>
                                <Input
                                    id='password'
                                    type='password'
                                    placeholder='Enter your password'
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        if (error) setError(null); // Clear error on input
                                    }}
                                    required
                                />
                            </div>
                        </CardContent>
                        <CardFooter className='flex flex-col space-y-4'>
                            <Button
                                type='submit'
                                className='w-full'
                                disabled={isLoading || !username || !password}
                            >
                                {isLoading ? 'Signing in...' : 'Sign In'}
                            </Button>
                            <div className='text-center text-sm'>
                                Don't have an account?{' '}
                                <Link
                                    href='/register'
                                    className='text-purple-600 hover:underline'
                                >
                                    Sign up
                                </Link>
                            </div>
                        </CardFooter>
                    </form>
                </Card>
            </div>

            <div className='p-4'>
                <Link
                    href='/'
                    className='flex items-center gap-2 text-gray-600 hover:text-purple-600'
                >
                    <ArrowLeft className='h-4 w-4' />
                    <span>Back to Home</span>
                </Link>
            </div>
        </div>
    );
}