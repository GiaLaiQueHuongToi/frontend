'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Video, Plus, Eye, Youtube, ExternalLink, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { googleOAuthService } from '@/services/googleOAuthService';
import { useAuth } from '@/hooks/useAuth';
import { youtubeStatsService, type YouTubeStats } from '@/services/youtubeService';

// Mock data for videos
const mockVideos = [
    {
        id: '1',
        title: 'Top 10 AI Trends in 2025',
        thumbnail: '/placeholder-video.svg',
        views: 1245,
        createdAt: '2025-05-28',
    },
    {
        id: '2',
        title: 'How to Learn Programming Fast',
        thumbnail: '/placeholder-video.svg',
        views: 876,
        createdAt: '2025-05-25',
    },
    {
        id: '3',
        title: 'The Future of Web Development',
        thumbnail: '/placeholder-video.svg',
        views: 543,
        createdAt: '2025-05-20',
    },
];

export default function DashboardPage() {
    const [isConnecting, setIsConnecting] = useState(false);
    const [isLoadingStats, setIsLoadingStats] = useState(false);
    const [youtubeStats, setYoutubeStats] = useState<YouTubeStats | null>(null);
    const { toast } = useToast();
    const { user, isYouTubeConnected, checkYouTubeConnection } = useAuth();

    // Load YouTube stats when connected
    useEffect(() => {
        if (isYouTubeConnected) {
            loadYouTubeStats();
        }
    }, [isYouTubeConnected]);

    const loadYouTubeStats = async () => {
        if (!isYouTubeConnected) return;
        
        try {
            setIsLoadingStats(true);
            const stats = await youtubeStatsService.getChannelStats();
            setYoutubeStats(stats);
        } catch (error) {
            console.error('Failed to load YouTube stats:', error);
            toast({
                title: 'Stats Loading Failed',
                description: 'Could not fetch YouTube statistics.',
                variant: 'destructive',
            });
        } finally {
            setIsLoadingStats(false);
        }
    };

    const connectYoutube = async () => {
        console.log('Connecting to YouTube...');
        try {
            setIsConnecting(true);
            
            // Get Google OAuth URL
            const authUrl = googleOAuthService.getAuthUrl();
            
            if (!authUrl) {
                throw new Error('Google OAuth not configured');
            }

            toast({
                title: 'Redirecting to Google',
                description: 'You will be redirected to Google to authorize YouTube access.',
            });

            // Show loading state briefly before redirect
            setTimeout(() => {
                window.location.href = authUrl;
            }, 1000);

        } catch (error) {
            console.error('Error initiating YouTube connection:', error);
            setIsConnecting(false);
            
            toast({
                title: 'Connection Failed',
                description: 'Failed to initiate YouTube connection. Please try again.',
                variant: 'destructive',
            });
        }
    };

    const refreshStats = async () => {
        if (isYouTubeConnected) {
            await loadYouTubeStats();
            toast({
                title: 'Stats Refreshed',
                description: 'YouTube statistics have been updated.',
            });
        }
    };

    return (
        <div className='container mx-auto p-6'>
            <div className='flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4'>
                <div>
                    <h1 className='text-3xl font-bold'>Dashboard</h1>
                    <p className='text-gray-500'>
                        Manage and create your AI-powered videos
                    </p>
                </div>
                <div className='flex gap-2'>
                    {isYouTubeConnected && (
                        <Button
                            variant='outline'
                            onClick={refreshStats}
                            disabled={isLoadingStats}
                            className='gap-2'
                        >
                            <RefreshCw className={`h-4 w-4 ${isLoadingStats ? 'animate-spin' : ''}`} />
                            Refresh Stats
                        </Button>
                    )}
                    <Link href='/dashboard/create'>
                        <Button className='gap-2'>
                            <Plus className='h-4 w-4' />
                            Create New Video
                        </Button>
                    </Link>
                </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
                {/* Total Videos Card */}
                <Card className={`${!isYouTubeConnected ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <CardHeader className='flex flex-row items-center justify-between pb-2'>
                        <CardTitle className='text-sm font-medium'>
                            Total Videos
                        </CardTitle>
                        <Video className='h-4 w-4 text-muted-foreground' />
                    </CardHeader>
                    <CardContent>
                        <div className='text-2xl font-bold'>
                            {isYouTubeConnected ? (
                                isLoadingStats ? (
                                    <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                                ) : (
                                    youtubeStats?.videoCount || '0'
                                )
                            ) : (
                                <span className='text-gray-400'>--</span>
                            )}
                        </div>
                        <p className='text-xs text-muted-foreground mt-1'>
                            {isYouTubeConnected ? 'YouTube videos' : 'Connect YouTube to view'}
                        </p>
                    </CardContent>
                </Card>

                {/* Total Views Card */}
                <Card className={`${!isYouTubeConnected ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <CardHeader className='flex flex-row items-center justify-between pb-2'>
                        <CardTitle className='text-sm font-medium'>
                            Total Views
                        </CardTitle>
                        <Eye className='h-4 w-4 text-muted-foreground' />
                    </CardHeader>
                    <CardContent>
                        <div className='text-2xl font-bold'>
                            {isYouTubeConnected ? (
                                isLoadingStats ? (
                                    <div className="animate-pulse bg-gray-200 h-8 w-20 rounded"></div>
                                ) : (
                                    youtubeStats?.totalViews ? youtubeStats.totalViews.toLocaleString() : '0'
                                )
                            ) : (
                                <span className='text-gray-400'>--</span>
                            )}
                        </div>
                        <p className='text-xs text-muted-foreground mt-1'>
                            {isYouTubeConnected ? 'Channel views' : 'Connect YouTube to view'}
                        </p>
                    </CardContent>
                </Card>

                {/* YouTube Connection Card */}
                <Card>
                    <CardHeader className='flex flex-row items-center justify-between pb-2'>
                        <CardTitle className='text-sm font-medium'>
                            YouTube Connection
                        </CardTitle>
                        <Youtube className='h-4 w-4 text-muted-foreground' />
                    </CardHeader>
                    <CardContent>
                        {isYouTubeConnected ? (
                            <div className='flex items-center justify-between'>
                                <div className='flex items-center gap-2'>
                                    <div className='h-2 w-2 rounded-full bg-green-500'></div>
                                    <span className='text-sm'>Connected</span>
                                </div>
                                <Button
                                    variant='ghost'
                                    size='sm'
                                    onClick={checkYouTubeConnection}
                                    className='h-6 w-6 p-0'
                                >
                                    <RefreshCw className='h-3 w-3' />
                                </Button>
                            </div>
                        ) : (
                            <Button
                                variant='outline'
                                size='sm'
                                onClick={connectYoutube}
                                disabled={isConnecting}
                                className="gap-2 w-full"
                            >
                                {isConnecting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600"></div>
                                        Connecting...
                                    </>
                                ) : (
                                    <>
                                        <ExternalLink className='h-3 w-3' />
                                        Connect YouTube
                                    </>
                                )}
                            </Button>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Tabs for video listings */}
            <Tabs defaultValue='all' className='w-full'>
                <div className='flex justify-between items-center mb-4'>
                    <TabsList>
                        <TabsTrigger value='all'>All Videos</TabsTrigger>
                        <TabsTrigger value='published'>Published</TabsTrigger>
                        <TabsTrigger value='drafts'>Drafts</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value='all' className='mt-0'>
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                        {mockVideos.map((video) => (
                            <Link
                                href={`/dashboard/video/${video.id}`}
                                key={video.id}
                            >
                                <Card className='overflow-hidden hover:shadow-md transition-shadow'>
                                    <div className='aspect-video bg-gray-100 relative'>
                                        <img
                                            src={
                                                video.thumbnail ||
                                                '/placeholder.svg'
                                            }
                                            alt={video.title}
                                            className='w-full h-full object-cover'
                                        />
                                        <div className='absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded'>
                                            {video.views} views
                                        </div>
                                    </div>
                                    <CardContent className='p-4'>
                                        <h3 className='font-medium line-clamp-2'>
                                            {video.title}
                                        </h3>
                                        <p className='text-xs text-gray-500 mt-1'>
                                            Created on {video.createdAt}
                                        </p>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value='published'>
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                        {mockVideos.slice(0, 2).map((video) => (
                            <Link
                                href={`/dashboard/video/${video.id}`}
                                key={video.id}
                            >
                                <Card className='overflow-hidden hover:shadow-md transition-shadow'>
                                    <div className='aspect-video bg-gray-100 relative'>
                                        <img
                                            src={
                                                video.thumbnail ||
                                                '/placeholder.svg'
                                            }
                                            alt={video.title}
                                            className='w-full h-full object-cover'
                                        />
                                        <div className='absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded'>
                                            {video.views} views
                                        </div>
                                    </div>
                                    <CardContent className='p-4'>
                                        <h3 className='font-medium line-clamp-2'>
                                            {video.title}
                                        </h3>
                                        <p className='text-xs text-gray-500 mt-1'>
                                            Created on {video.createdAt}
                                        </p>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value='drafts'>
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                        {mockVideos.slice(2).map((video) => (
                            <Link
                                href={`/dashboard/video/${video.id}`}
                                key={video.id}
                            >
                                <Card className='overflow-hidden hover:shadow-md transition-shadow'>
                                    <div className='aspect-video bg-gray-100 relative'>
                                        <img
                                            src={
                                                video.thumbnail ||
                                                '/placeholder.svg'
                                            }
                                            alt={video.title}
                                            className='w-full h-full object-cover'
                                        />
                                        <div className='absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded'>
                                            Draft
                                        </div>
                                    </div>
                                    <CardContent className='p-4'>
                                        <h3 className='font-medium line-clamp-2'>
                                            {video.title}
                                        </h3>
                                        <p className='text-xs text-gray-500 mt-1'>
                                            Created on {video.createdAt}
                                        </p>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}