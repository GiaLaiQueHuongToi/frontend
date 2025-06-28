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
import { useAuth } from '../../hooks/useAuth';

export default function RegisterPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const { register, isLoading } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Clear previous errors
        setError(null);

        // Validation
        if (!username || !password || !confirmPassword) {
            setError('Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords don't match");
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }

        try {
            await register({
                username,
                password,
                confirmPassword,
            });
            // Success will be handled by useAuth hook - redirects to login
        } catch (error) {
            // Display specific error message
            const errorMessage = error instanceof Error ? error.message : 'Registration failed';
            setError(errorMessage);
            console.error('Registration failed:', error);
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
                            <CardTitle className='text-2xl'>
                                Create an Account
                            </CardTitle>
                        </div>
                        <CardDescription>
                            Enter your information to create an account
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
                                <Label htmlFor='password'>Password</Label>
                                <Input
                                    id='password'
                                    type='password'
                                    placeholder='Enter your password (min 6 characters)'
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        if (error) setError(null); // Clear error on input
                                    }}
                                    required
                                />
                            </div>
                            <div className='space-y-2'>
                                <Label htmlFor='confirmPassword'>
                                    Confirm Password
                                </Label>
                                <Input
                                    id='confirmPassword'
                                    type='password'
                                    placeholder='Confirm your password'
                                    value={confirmPassword}
                                    onChange={(e) => {
                                        setConfirmPassword(e.target.value);
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
                                disabled={isLoading || !username || !password || !confirmPassword}
                            >
                                {isLoading
                                    ? 'Creating account...'
                                    : 'Create Account'}
                            </Button>
                            <div className='text-center text-sm'>
                                Already have an account?{' '}
                                <Link
                                    href='/login'
                                    className='text-purple-600 hover:underline'
                                >
                                    Sign in
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