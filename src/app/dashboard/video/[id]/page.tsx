'use client';

import type React from 'react';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Download, Share2, Edit, Play, Pause, Link as LinkIcon, ExternalLink } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';
import { videoService, type VideoResponse } from '@/services/videoService';

export default function VideoDetailPage() {
    const params = useParams();
    const { id } = params;
    const { toast } = useToast();
    const [isPlaying, setIsPlaying] = useState(false);
    const [video, setVideo] = useState<VideoResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    // Load video data on component mount
    useEffect(() => {
        if (id) {
            loadVideo();
        }
    }, [id]);

    const loadVideo = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const videoData = await videoService.getVideoById(Number(id));
            setVideo(videoData);
        } catch (error) {
            console.error('Failed to load video:', error);
            setError('Failed to load video details');
            toast({
                title: 'Loading Failed',
                description: 'Could not fetch video details from server.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const handleDownload = async () => {
        if (!video) return;
        
        try {
            setIsDownloading(true);
            setDownloadProgress(0);
            toast({
                title: 'Download Starting',
                description: 'Preparing your video for download...',
            });
            
            const success = await videoService.downloadVideo(video, (progress) => {
                setDownloadProgress(progress);
            });
            
            if (success) {
                toast({
                    title: 'Download Complete',
                    description: 'Your video has been downloaded successfully.',
                });
            } else {
                throw new Error('Download failed');
            }
        } catch (error) {
            console.error('Download error:', error);
            toast({
                title: 'Download Failed',
                description: 'Could not download the video. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsDownloading(false);
            setDownloadProgress(0);
        }
    };

    const handleShare = async () => {
        if (!video) return;
        
        try {
            const success = await videoService.shareVideo(video.id);
            if (success) {
                toast({
                    title: 'Link Copied',
                    description: 'Video share link has been copied to your clipboard.',
                });
            } else {
                throw new Error('Share failed');
            }
        } catch (error) {
            console.error('Share error:', error);
            toast({
                title: 'Share Failed',
                description: 'Could not copy link to clipboard. Please try again.',
                variant: 'destructive',
            });
        }
    };

    const handleShareDirect = () => {
        if (!video) return;
        
        const directUrl = videoService.getDirectVideoUrl(video);
        
        // Try to use Web Share API if available (mobile devices)
        if (navigator.share) {
            navigator.share({
                title: video.title,
                text: video.description || `Check out this video: ${video.title}`,
                url: directUrl,
            }).catch((error) => {
                console.error('Web Share API failed:', error);
                // Fallback to copying link
                handleShare();
            });
        } else {
            // Fallback to copying link
            handleShare();
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <div className='container mx-auto p-6'>
                <div className='mb-6'>
                    <Link
                        href='/dashboard'
                        className='flex items-center gap-2 text-gray-600 hover:text-purple-600 mb-4'
                    >
                        <ArrowLeft className='h-4 w-4' />
                        <span>Back to Dashboard</span>
                    </Link>
                </div>
                <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
                    <div className='lg:col-span-2'>
                        <Card className='overflow-hidden'>
                            <div className='aspect-video bg-gray-200 animate-pulse'></div>
                            <CardContent className='p-4'>
                                <div className='h-6 bg-gray-200 animate-pulse rounded mb-2'></div>
                                <div className='h-4 bg-gray-200 animate-pulse rounded w-3/4'></div>
                            </CardContent>
                        </Card>
                    </div>
                    <div>
                        <Card>
                            <CardContent className='p-4'>
                                <div className='h-4 bg-gray-200 animate-pulse rounded mb-4'></div>
                                <div className='grid grid-cols-2 gap-3 mb-4'>
                                    <div className='h-10 bg-gray-200 animate-pulse rounded'></div>
                                    <div className='h-10 bg-gray-200 animate-pulse rounded'></div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (error || !video) {
        return (
            <div className='container mx-auto p-6'>
                <div className='mb-6'>
                    <Link
                        href='/dashboard'
                        className='flex items-center gap-2 text-gray-600 hover:text-purple-600 mb-4'
                    >
                        <ArrowLeft className='h-4 w-4' />
                        <span>Back to Dashboard</span>
                    </Link>
                </div>
                <div className='text-center py-12'>
                    <h2 className='text-2xl font-bold text-gray-900 mb-2'>Video not found</h2>
                    <p className='text-gray-500 mb-4'>The video you're looking for could not be found.</p>
                    <Link href='/dashboard'>
                        <Button>Return to Dashboard</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className='container mx-auto p-6'>
            <div className='mb-6'>
                <Link
                    href='/dashboard'
                    className='flex items-center gap-2 text-gray-600 hover:text-purple-600 mb-4'
                >
                    <ArrowLeft className='h-4 w-4' />
                    <span>Back to Dashboard</span>
                </Link>
                <div className='flex items-start justify-between'>
                    <div>
                        <h1 className='text-3xl font-bold'>{video.title}</h1>
                        <div className='flex items-center gap-2 text-sm text-gray-500 mt-2'>
                            <span>{video.views.toLocaleString()} views</span>
                            <span>•</span>
                            <span>Created on {formatDate(video.createdAt)}</span>
                            <span>•</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                video.status === 'published' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-yellow-100 text-yellow-800'
                            }`}>
                                {video.status.charAt(0).toUpperCase() + video.status.slice(1)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
                <div className='lg:col-span-2'>
                    <Card className='overflow-hidden'>
                        <div className='aspect-video bg-gray-900 relative'>
                            {isPlaying ? (
                                <video 
                                    src={video.videoUrl} 
                                    controls 
                                    autoPlay 
                                    className='w-full h-full'
                                    onEnded={() => setIsPlaying(false)}
                                >
                                    Your browser does not support the video tag.
                                </video>
                            ) : (
                                <div
                                    className='w-full h-full cursor-pointer flex items-center justify-center relative'
                                    onClick={() => setIsPlaying(true)}
                                >
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
                                    <div className='absolute inset-0 flex items-center justify-center bg-black/20'>
                                        <div className='w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors'>
                                            <div className='w-16 h-16 rounded-full bg-purple-600 flex items-center justify-center hover:bg-purple-700 transition-colors'>
                                                <Play className='h-8 w-8 text-white ml-1' fill="white" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <CardContent className='p-6'>
                            <h3 className='text-lg font-semibold mb-3'>Description</h3>
                            <p className='text-gray-700 leading-relaxed'>
                                {video.description || 'No description available for this video.'}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div>
                    <Card>
                        <CardContent className='p-6 space-y-6'>
                            <div>
                                <h3 className='font-semibold text-lg mb-4'>Video Actions</h3>
                                <div className='grid grid-cols-1 gap-3'>
                                    <Button
                                        variant='outline'
                                        className='w-full flex items-center gap-2'
                                        onClick={handleDownload}
                                        disabled={isDownloading}
                                    >
                                        {isDownloading ? (
                                            <div className="flex flex-col items-center w-full">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                                                    Downloading...
                                                </div>
                                                {downloadProgress > 0 && (
                                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                                        <div 
                                                            className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                                                            style={{ width: `${downloadProgress}%` }}
                                                        ></div>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <>
                                                <Download className='h-4 w-4' />
                                                Download Video
                                            </>
                                        )}
                                    </Button>
                                    
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant='outline'
                                                className='w-full flex items-center gap-2'
                                            >
                                                <Share2 className='h-4 w-4' />
                                                Share Video
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className='w-full'>
                                            <DropdownMenuItem onClick={() => {
                                                const embedUrl = videoService.generateEmbedUrl(video.id);
                                                navigator.clipboard.writeText(embedUrl).then(() => {
                                                    toast({
                                                        title: 'Embed Link Copied',
                                                        description: 'Embed link has been copied to clipboard.',
                                                    });
                                                }).catch(() => {
                                                    toast({
                                                        title: 'Copy Failed',
                                                        description: 'Could not copy embed link.',
                                                        variant: 'destructive',
                                                    });
                                                });
                                            }}>
                                                <Youtube className='mr-2 h-4 w-4' />
                                                <span>Copy Embed Link</span>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>

                            <div className='pt-4 border-t'>
                                <h3 className='font-semibold text-lg mb-4'>Video Details</h3>
                                <div className='space-y-3 text-sm'>
                                    <div className='flex justify-between'>
                                        <span className='text-gray-500'>Status:</span>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            video.status === 'published' 
                                                ? 'bg-green-100 text-green-800' 
                                                : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                            {video.status.charAt(0).toUpperCase() + video.status.slice(1)}
                                        </span>
                                    </div>
                                    <div className='flex justify-between'>
                                        <span className='text-gray-500'>Views:</span>
                                        <span className='font-medium'>{video.views.toLocaleString()}</span>
                                    </div>
                                    <div className='flex justify-between'>
                                        <span className='text-gray-500'>Created:</span>
                                        <span className='font-medium'>{formatDate(video.createdAt)}</span>
                                    </div>
                                    <div className='flex justify-between'>
                                        <span className='text-gray-500'>Video ID:</span>
                                        <span className='font-medium'>#{video.id}</span>
                                    </div>
                                </div>
                            </div>

                            {video.status === 'published' && (
                                <div className='pt-4 border-t'>
                                    <h3 className='font-semibold text-lg mb-4'>Publishing</h3>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant='outline'
                                                className='w-full'
                                            >
                                                Publish to Platform
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className='w-full'>
                                            <DropdownMenuItem>
                                                <Youtube className='mr-2 h-4 w-4' />
                                                <span>YouTube</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem>
                                                <TikTok className='mr-2 h-4 w-4' />
                                                <span>TikTok</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem>
                                                <Instagram className='mr-2 h-4 w-4' />
                                                <span>Instagram</span>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            )}

                            {video.status === 'draft' && (
                                <div className='pt-4 border-t'>
                                    <h3 className='font-semibold text-lg mb-4'>Draft Actions</h3>
                                    <div className='space-y-3'>
                                        <Button className='w-full'>
                                            Publish Video
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Video URL Card for debugging/development */}
                    <Card className='mt-6'>
                        <CardContent className='p-4'>
                            <h3 className='font-medium mb-2'>Video URL</h3>
                            <div className='text-xs text-gray-500 break-all bg-gray-50 p-2 rounded'>
                                {video.videoUrl}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

// Simple icon components for social platforms
function Youtube(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns='http://www.w3.org/2000/svg'
            width='24'
            height='24'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
        >
            <path d='M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17' />
            <path d='m10 15 5-3-5-3z' />
        </svg>
    );
}

function TikTok(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns='http://www.w3.org/2000/svg'
            width='24'
            height='24'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
        >
            <path d='M9 12a4 4 0 1 0 0 8 4 4 0 0 0 0-8z' />
            <path d='M16 8v8' />
            <path d='M12 16v-8' />
            <path d='M20 12V8h-4' />
            <path d='M16 8a4 4 0 0 0-4-4' />
        </svg>
    );
}

function Instagram(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns='http://www.w3.org/2000/svg'
            width='24'
            height='24'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
        >
            <rect width='20' height='20' x='2' y='2' rx='5' ry='5' />
            <path d='M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z' />
            <line x1='17.5' x2='17.51' y1='6.5' y2='6.5' />
        </svg>
    );
}
