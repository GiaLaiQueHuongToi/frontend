'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CustomPagination } from '@/components/ui/custom-pagination';
import { Video, Plus, Eye, Youtube, ExternalLink, RefreshCw, Share2, Download } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { googleOAuthService } from '@/services/googleOAuthService';
import { useAuth } from '@/hooks/useAuth';
import { youtubeStatsService, type YouTubeStats } from '@/services/youtubeService';
import { useVideos } from '@/hooks/useVideos';
import { videoService } from '@/services/videoService';
import { VideoStats } from '@/components/dashboard/VideoStats';
import { YouTubeConnection } from '@/components/dashboard/YouTubeConnection';

export default function DashboardPage() {
    const [isConnecting, setIsConnecting] = useState(false);
    const [isLoadingStats, setIsLoadingStats] = useState(false);
    const [youtubeStats, setYoutubeStats] = useState<YouTubeStats | null>(null);
    const [activeTab, setActiveTab] = useState('all');
    const { toast } = useToast();
    const { user, isYouTubeConnected, checkYouTubeConnection } = useAuth();
    const { 
        videos, 
        videoPage, 
        isLoading: isLoadingVideos, 
        refreshVideos, 
        getFilteredVideos, 
        formatDate,
        loadVideos,
        currentPage,
        setCurrentPage
    } = useVideos();

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
                    <Button
                        variant='outline'
                        onClick={refreshVideos}
                        disabled={isLoadingVideos}
                        className='gap-2'
                    >
                        <RefreshCw className={`h-4 w-4 ${isLoadingVideos ? 'animate-spin' : ''}`} />
                        Refresh Videos
                    </Button>
                    <Link href='/dashboard/create'>
                        <Button className='gap-2'>
                            <Plus className='h-4 w-4' />
                            Create New Video
                        </Button>
                    </Link>
                </div>
            </div>            <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
                <VideoStats
                    totalVideos={videoPage?.totalElements || 0}
                    totalViews={youtubeStats?.totalViews || 0}
                    isYouTubeConnected={isYouTubeConnected}
                    isLoadingStats={isLoadingStats}
                />
                
                <YouTubeConnection
                    isYouTubeConnected={isYouTubeConnected}
                    isConnecting={isConnecting}
                    onConnect={connectYoutube}
                    onRefresh={checkYouTubeConnection}
                />
            </div>

            {/* Tabs for video listings */}
            <Tabs defaultValue='all' className='w-full' onValueChange={setActiveTab}>
                <div className='flex justify-between items-center mb-4'>
                    <TabsList>
                        <TabsTrigger value='all'>All Videos</TabsTrigger>
                        <TabsTrigger value='published'>Published</TabsTrigger>
                        <TabsTrigger value='private'>Private</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value='all' className='mt-0'>
                    {isLoadingVideos ? (
                        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                            {[...Array(6)].map((_, i) => (
                                <Card key={i} className='overflow-hidden'>
                                    <div className='aspect-video bg-gray-200 animate-pulse'></div>
                                    <CardContent className='p-4'>
                                        <div className='h-4 bg-gray-200 animate-pulse rounded mb-2'></div>
                                        <div className='h-3 bg-gray-200 animate-pulse rounded w-1/2'></div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : getFilteredVideos('all').length === 0 ? (
                        <div className='text-center py-12'>
                            <Video className='h-12 w-12 text-gray-400 mx-auto mb-4' />
                            <h3 className='text-lg font-medium text-gray-900 mb-2'>No videos found</h3>
                            <p className='text-gray-500 mb-4'>Get started by creating your first video</p>
                            <Link href='/dashboard/create'>
                                <Button>
                                    <Plus className='h-4 w-4 mr-2' />
                                    Create New Video
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                            {getFilteredVideos('all').map((video) => (
                                <Link
                                    href={`/dashboard/video/${video.id}`}
                                    key={video.id}
                                >
                                    <Card className='overflow-hidden hover:shadow-md transition-shadow'>
                                        <div className='aspect-video bg-gray-100 relative'>
                                            <img
                                                src={videoService.generateThumbnailUrl(video.videoUrl)}
                                                alt={video.title}
                                                className='w-full h-full object-cover'
                                                onError={(e) => {
                                                    // Try alternative thumbnail method first
                                                    const target = e.currentTarget;
                                                    if (!target.src.includes('so_1.0')) {
                                                        target.src = videoService.generateThumbnailAtTime(video.videoUrl, 1.0);
                                                    } else {
                                                        // Final fallback to placeholder
                                                        target.src = '/placeholder-video.svg';
                                                    }
                                                }}
                                            />
                                            <div className='absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded'>
                                                {video.status === 'private' 
                                                    ? 'private' 
                                                    : !isYouTubeConnected 
                                                        ? 'disabled' 
                                                        : `${video.views.toLocaleString()} views`
                                                }
                                            </div>
                                        </div>
                                        <CardContent className='p-4'>
                                            <h3 className='font-medium line-clamp-2'>
                                                {video.title}
                                            </h3>
                                            <p className='text-xs text-gray-500 mt-1'>
                                                Created on {formatDate(video.createdAt)}
                                            </p>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    )}
                    {videoPage && videoPage.totalPages > 1 && (
                        <div className="mt-6">
                            <CustomPagination
                                currentPage={currentPage}
                                totalPages={videoPage.totalPages}
                                onPageChange={(page) => {
                                    setCurrentPage(page);
                                    loadVideos(page);
                                }}
                                isLoading={isLoadingVideos}
                            />
                        </div>
                    )}
                </TabsContent>

                <TabsContent value='published'>
                    {isLoadingVideos ? (
                        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                            {[...Array(3)].map((_, i) => (
                                <Card key={i} className='overflow-hidden'>
                                    <div className='aspect-video bg-gray-200 animate-pulse'></div>
                                    <CardContent className='p-4'>
                                        <div className='h-4 bg-gray-200 animate-pulse rounded mb-2'></div>
                                        <div className='h-3 bg-gray-200 animate-pulse rounded w-1/2'></div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : getFilteredVideos('published').length === 0 ? (
                        <div className='text-center py-12'>
                            <Youtube className='h-12 w-12 text-gray-400 mx-auto mb-4' />
                            <h3 className='text-lg font-medium text-gray-900 mb-2'>No published videos</h3>
                            <p className='text-gray-500'>Videos will appear here once published</p>
                        </div>
                    ) : (
                        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                            {getFilteredVideos('published').map((video) => (
                                <Link
                                    href={`/dashboard/video/${video.id}`}
                                    key={video.id}
                                >
                                    <Card className='overflow-hidden hover:shadow-md transition-shadow'>
                                        <div className='aspect-video bg-gray-100 relative'>
                                            <img
                                                src={videoService.generateThumbnailUrl(video.videoUrl)}
                                                alt={video.title}
                                                className='w-full h-full object-cover'
                                                onError={(e) => {
                                                    e.currentTarget.src = '/placeholder-video.svg';
                                                }}
                                            />
                                            <div className='absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded'>
                                                {video.status === 'private' 
                                                    ? 'private' 
                                                    : !isYouTubeConnected 
                                                        ? 'disabled' 
                                                        : `${video.views.toLocaleString()} views`
                                                }
                                            </div>
                                        </div>
                                        <CardContent className='p-4'>
                                            <h3 className='font-medium line-clamp-2'>
                                                {video.title}
                                            </h3>
                                            <p className='text-xs text-gray-500 mt-1'>
                                                Created on {formatDate(video.createdAt)}
                                            </p>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    )}
                    {videoPage && videoPage.totalPages > 1 && (
                        <div className="mt-6">
                            <CustomPagination
                                currentPage={currentPage}
                                totalPages={videoPage.totalPages}
                                onPageChange={(page) => {
                                    setCurrentPage(page);
                                    loadVideos(page);
                                }}
                                isLoading={isLoadingVideos}
                            />
                        </div>
                    )}
                </TabsContent>

                <TabsContent value='private'>
                    {isLoadingVideos ? (
                        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                            {[...Array(3)].map((_, i) => (
                                <Card key={i} className='overflow-hidden'>
                                    <div className='aspect-video bg-gray-200 animate-pulse'></div>
                                    <CardContent className='p-4'>
                                        <div className='h-4 bg-gray-200 animate-pulse rounded mb-2'></div>
                                        <div className='h-3 bg-gray-200 animate-pulse rounded w-1/2'></div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : getFilteredVideos('private').length === 0 ? (
                        <div className='text-center py-12'>
                            <Video className='h-12 w-12 text-gray-400 mx-auto mb-4' />
                            <h3 className='text-lg font-medium text-gray-900 mb-2'>No private videos</h3>
                            <p className='text-gray-500'>private videos will appear here</p>
                        </div>
                    ) : (
                        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                            {getFilteredVideos('private').map((video) => (
                                <Link
                                    href={`/dashboard/video/${video.id}`}
                                    key={video.id}
                                >
                                    <Card className='overflow-hidden hover:shadow-md transition-shadow'>
                                        <div className='aspect-video bg-gray-100 relative'>
                                            <img
                                                src={videoService.generateThumbnailUrl(video.videoUrl)}
                                                alt={video.title}
                                                className='w-full h-full object-cover'
                                                onError={(e) => {
                                                    e.currentTarget.src = '/placeholder-video.svg';
                                                }}
                                            />
                                            <div className='absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded'>
                                                {video.status === 'private' 
                                                    ? 'private' 
                                                    : !isYouTubeConnected 
                                                        ? 'disabled' 
                                                        : `${video.views.toLocaleString()} views`
                                                }
                                            </div>
                                        </div>
                                        <CardContent className='p-4'>
                                            <h3 className='font-medium line-clamp-2'>
                                                {video.title}
                                            </h3>
                                            <p className='text-xs text-gray-500 mt-1'>
                                                Created on {formatDate(video.createdAt)}
                                            </p>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    )}
                    {videoPage && videoPage.totalPages > 1 && (
                        <div className="mt-6">
                            <CustomPagination
                                currentPage={currentPage}
                                totalPages={videoPage.totalPages}
                                onPageChange={(page) => {
                                    setCurrentPage(page);
                                    loadVideos(page);
                                }}
                                isLoading={isLoadingVideos}
                            />
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}