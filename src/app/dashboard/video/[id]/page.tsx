'use client';

import type React from 'react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Download, Share2, Edit, Play, Pause, Link as LinkIcon, ExternalLink, Eye, Calendar, Hash, Clock } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';
import { videoService, type VideoResponse, type PublishedVideoResponse } from '@/services/videoService';
import { youtubeUploadService } from '@/services/youtubeUploadService';
import { youtubeStatsService } from '@/services/youtubeService';
import { useAuth } from '@/hooks/useAuth';

// Define the component interface
interface YouTubeUploadDialogProps {
    video: VideoResponse;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (youtubeVideoId: string, youtubeUrl: string, publishedVideo?: any) => void;
}

// Placeholder component for YouTube upload
const YouTubeUploadDialogPlaceholder: React.FC<YouTubeUploadDialogProps> = ({ 
    isOpen, 
    onClose, 
    onSuccess, 
    video 
}) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
                <h2 className="text-xl font-bold mb-4">YouTube Upload</h2>
                <p className="text-gray-600 mb-4">
                    YouTube upload component is not yet implemented.
                </p>
                <div className="flex gap-2">
                    <Button onClick={onClose} variant="outline">
                        Close
                    </Button>
                    <Button onClick={() => {
                        onSuccess('test-video-id', 'https://youtube.com/watch?v=test');
                        onClose();
                    }}>
                        Simulate Success
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default function VideoDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { id } = params;
    const { toast } = useToast();
    const { isYouTubeConnected } = useAuth();
    
    // Existing state
    const [isPlaying, setIsPlaying] = useState(false);
    const [video, setVideo] = useState<VideoResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    
    // YouTube upload state
    const [showYouTubeUpload, setShowYouTubeUpload] = useState(false);
    const [hasYouTubePermissions, setHasYouTubePermissions] = useState(false);
    const [publishedVideoData, setPublishedVideoData] = useState<PublishedVideoResponse | null>(null);

    // Add YouTube views state
    const [youtubeViews, setYoutubeViews] = useState<number | null>(null);
    const [isLoadingYoutubeViews, setIsLoadingYoutubeViews] = useState(false);
    const [youtubeViewsError, setYoutubeViewsError] = useState<string | null>(null);

    // Component state for dynamic import
    const [YouTubeUploadDialog, setYouTubeUploadDialog] = useState<React.FC<YouTubeUploadDialogProps>>(
        () => YouTubeUploadDialogPlaceholder
    );

    // Load the YouTube upload component dynamically
    useEffect(() => {
        const loadYouTubeComponent = async () => {
            try {
                // Try dynamic import first
                const module = await import('@/components/youtube/YouTubeUploadDialog').catch(() => null);
                
                if (module?.YouTubeUploadDialog) {
                    setYouTubeUploadDialog(() => module.YouTubeUploadDialog);
                    console.log('✅ YouTubeUploadDialog loaded successfully');
                } else {
                    // Try require as fallback
                    try {
                        const componentModule = require('@/components/youtube/YouTubeUploadDialog');
                        const Component = componentModule.YouTubeUploadDialog || 
                                         componentModule.default || 
                                         YouTubeUploadDialogPlaceholder;
                        setYouTubeUploadDialog(() => Component);
                        console.log('✅ YouTubeUploadDialog loaded via require');
                    } catch (requireError) {
                        console.warn('YouTubeUploadDialog not found, using placeholder:', requireError);
                        setYouTubeUploadDialog(() => YouTubeUploadDialogPlaceholder);
                    }
                }
            } catch (error) {
                console.warn('Failed to load YouTubeUploadDialog, using placeholder:', error);
                setYouTubeUploadDialog(() => YouTubeUploadDialogPlaceholder);
            }
        };

        loadYouTubeComponent();
    }, []);

    // Add function to fetch YouTube views
    const fetchYouTubeViews = async (publishedVideo: PublishedVideoResponse) => {
        // Check if it's a YouTube video by platform or URL
        const isYouTubeVideo = publishedVideo.platform === 'YouTube' || 
                              publishedVideo.url?.includes('youtube.com') || 
                              publishedVideo.url?.includes('youtu.be');
        
        if (!isYouTubeConnected || !isYouTubeVideo || !publishedVideo.externalId) {
            return;
        }

        setIsLoadingYoutubeViews(true);
        setYoutubeViewsError(null);

        try {
            // Get YouTube video statistics
            const response = await youtubeStatsService.getVideoStats(publishedVideo.externalId);
            if (response.success && response.stats) {
                setYoutubeViews(response.stats.viewCount);
            } else {
                throw new Error(response.error || 'Failed to fetch YouTube views');
            }
        } catch (error) {
            console.error('Error fetching YouTube views:', error);
            setYoutubeViewsError(error instanceof Error ? error.message : 'Unknown error');
        } finally {
            setIsLoadingYoutubeViews(false);
        }
    };

    // Check for published video data when video is loaded
    useEffect(() => {
        const checkPublishedVideo = async () => {
            if (video && video.status === 'published') {
                try {
                    console.log('🔍 Checking for published video data...');
                    const publishedData = await videoService.getPublishedVideo(video.id);
                    setPublishedVideoData(publishedData);
                    console.log('✅ Published video data loaded:', publishedData);
                    
                    // Update video status to 'published' if we have published data
                    if (publishedData && video.status !== 'published') {
                        setVideo(prev => prev ? { ...prev, status: 'published' } : null);
                    }
                    
                    // Fetch YouTube views if it's a YouTube video and we're connected
                    if (publishedData && (publishedData.platform === 'YouTube' || publishedData.url?.includes('youtube.com'))) {
                        await fetchYouTubeViews(publishedData);
                    }
                } catch (error) {
                    console.log('ℹ️ No published video data found or error:', error);
                    // This is expected for videos that haven't been published to external platforms
                }
            }
        };

        if (video) {
            checkPublishedVideo();
        }
    }, [video?.id, isYouTubeConnected]); // Changed dependency to video.id to avoid infinite loop

    // Load video data on component mount
    useEffect(() => {
        if (id) {
            loadVideo();
        }
    }, [id]);

    // Check YouTube permissions on mount
    useEffect(() => {
        const checkPermissions = async () => {
            const hasPermissions = await youtubeUploadService.checkUploadPermissions();
            setHasYouTubePermissions(hasPermissions);
        };
        
        if (video && isYouTubeConnected) {
            checkPermissions();
        }
    }, [video, isYouTubeConnected]);

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

    const handleSharePublished = async (publishedVideo: PublishedVideoResponse) => {
        try {
            // Try native share first
            const nativeShareSuccess = await videoService.shareVideoNative(video!, publishedVideo);
            if (nativeShareSuccess) {
                toast({
                    title: 'Shared Successfully',
                    description: `Shared ${publishedVideo.title} from ${videoService.formatPlatformName(publishedVideo.platform)}.`,
                });
                return;
            }

            // Fallback to copying link
            const success = await videoService.sharePublishedVideo(publishedVideo);
            if (success) {
                toast({
                    title: 'Link Copied',
                    description: `${videoService.formatPlatformName(publishedVideo.platform)} link copied to clipboard.`,
                });
            } else {
                throw new Error('Share failed');
            }
        } catch (error) {
            console.error('Share error:', error);
            toast({
                title: 'Share Failed',
                description: 'Could not share the video. Please try again.',
                variant: 'destructive',
            });
        }
    };

    // Handle successful YouTube upload
    const handleYouTubeUploadSuccess = async (youtubeVideoId: string, youtubeUrl: string, publishedVideo?: any) => {
        try {
            console.log('Video uploaded to YouTube:', { youtubeVideoId, youtubeUrl, publishedVideo });
            
            toast({
                title: 'Success!',
                description: 'Video uploaded to YouTube and published successfully.',
            });

            setShowYouTubeUpload(false);
            
            // Update published video data if provided
            if (publishedVideo) {
                setPublishedVideoData(publishedVideo);
                // Fetch fresh YouTube views for the newly uploaded video
                if (publishedVideo.platform === 'YouTube') {
                    await fetchYouTubeViews(publishedVideo);
                }
            }
            
            // Refresh video data to get updated status
            await loadVideo();

             // Force a complete refresh of the page data
            window.location.reload();
            
        } catch (error) {
            console.error('Error handling YouTube upload success:', error);
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <div className='container mx-auto p-6'>
                <div className='mb-8'>
                    <Link
                        href='/dashboard'
                        className='inline-flex items-center gap-2 text-gray-600 hover:text-purple-600 mb-6 transition-colors'
                    >
                        <ArrowLeft className='h-4 w-4' />
                        <span>Back to Dashboard</span>
                    </Link>
                </div>
                <div className='grid grid-cols-1 xl:grid-cols-4 gap-6'>
                    <div className='xl:col-span-3'>
                        <Card className='overflow-hidden'>
                            <div className='aspect-video bg-gray-200 animate-pulse'></div>
                            <CardContent className='p-6'>
                                <div className='h-8 bg-gray-200 animate-pulse rounded mb-3'></div>
                                <div className='flex items-center gap-4 mb-6'>
                                    <div className='h-4 bg-gray-200 animate-pulse rounded w-24'></div>
                                    <div className='h-4 bg-gray-200 animate-pulse rounded w-32'></div>
                                    <div className='h-4 bg-gray-200 animate-pulse rounded w-16'></div>
                                </div>
                                <div className='flex items-center gap-3 mb-6'>
                                    <div className='h-10 bg-gray-200 animate-pulse rounded w-24'></div>
                                    <div className='h-10 bg-gray-200 animate-pulse rounded w-20'></div>
                                    <div className='h-10 bg-gray-200 animate-pulse rounded w-16'></div>
                                </div>
                                <div className='h-6 bg-gray-200 animate-pulse rounded mb-3 w-32'></div>
                                <div className='space-y-2'>
                                    <div className='h-4 bg-gray-200 animate-pulse rounded'></div>
                                    <div className='h-4 bg-gray-200 animate-pulse rounded w-3/4'></div>
                                    <div className='h-4 bg-gray-200 animate-pulse rounded w-1/2'></div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    <div className='xl:col-span-1 space-y-6'>
                        <Card>
                            <CardContent className='p-6'>
                                <div className='h-6 bg-gray-200 animate-pulse rounded mb-4'></div>
                                <div className='space-y-4'>
                                    {[1, 2, 3, 4].map((i) => (
                                        <div key={i} className='flex justify-between items-center py-2'>
                                            <div className='h-4 bg-gray-200 animate-pulse rounded w-20'></div>
                                            <div className='h-4 bg-gray-200 animate-pulse rounded w-16'></div>
                                        </div>
                                    ))}
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
                <div className='mb-8'>
                    <Link
                        href='/dashboard'
                        className='inline-flex items-center gap-2 text-gray-600 hover:text-purple-600 mb-6 transition-colors'
                    >
                        <ArrowLeft className='h-4 w-4' />
                        <span>Back to Dashboard</span>
                    </Link>
                </div>
                <div className='max-w-2xl mx-auto text-center py-16'>
                    <div className='w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center'>
                        <svg className='w-12 h-12 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m4 0H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zM9 12l2 2 4-4' />
                        </svg>
                    </div>
                    <h2 className='text-3xl font-bold text-gray-900 mb-3'>Video not found</h2>
                    <p className='text-gray-600 mb-8 text-lg'>
                        The video you're looking for could not be found or may have been removed.
                    </p>
                    <Link href='/dashboard'>
                        <Button className='bg-purple-600 hover:bg-purple-700 text-white px-6 py-3'>
                            Return to Dashboard
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className='container mx-auto p-6'>
            <div className='mb-8'>
                <Link
                    href='/dashboard'
                    className='inline-flex items-center gap-2 text-gray-600 hover:text-purple-600 mb-6 transition-colors group'
                >
                    <ArrowLeft className='h-4 w-4 group-hover:-translate-x-1 transition-transform' />
                    <span>Back to Dashboard</span>
                </Link>
                
                {/* Header with title and status */}
                <div className='flex items-start justify-between'>
                    <div className='flex-1'>
                        <h1 className='text-4xl font-bold text-gray-900 mb-2'>{video.title}</h1>
                        <p className='text-gray-600 text-lg max-w-2xl'>
                            {video.description || 'No description available for this video.'}
                        </p>
                    </div>
                    <div className='ml-6 flex items-center gap-3'>
                        <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                            video.status === 'published' 
                                ? 'bg-green-100 text-green-800 border border-green-200' 
                                : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                        }`}>
                            {video.status.charAt(0).toUpperCase() + video.status.slice(1)}
                        </span>
                    </div>
                </div>
            </div>

            <div className='grid grid-cols-1 xl:grid-cols-4 gap-6'>
                {/* Main Video Player - Takes up more space */}
                <div className='xl:col-span-3'>
                    <Card className='overflow-hidden shadow-lg'>
                        <div className='aspect-video bg-gray-900 relative group'>
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
                                        src={video.videoUrl ? videoService.generateThumbnailUrl(video.videoUrl) : '/placeholder-video.svg'}
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
                                    <div className='absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors'>
                                        <div className='w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/30 group-hover:scale-110 transition-all duration-200'>
                                            <div className='w-16 h-16 rounded-full bg-purple-600 flex items-center justify-center group-hover:bg-purple-700 transition-colors shadow-lg'>
                                                <Play className='h-8 w-8 text-white ml-1' fill="white" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        {/* Video Info Section */}
                        <CardContent className='p-6'>
                            <div className='flex items-start justify-between mb-4'>
                                <div className='flex-1'>
                                    <h2 className='text-2xl font-bold text-gray-900 mb-2'>{video.title}</h2>
                                    <div className='flex items-center gap-4 text-sm text-gray-600'>
                                        <div className='flex items-center gap-1'>
                                            <Eye className='h-4 w-4' />
                                            <span>
                                                {isLoadingYoutubeViews ? (
                                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600 inline-block"></div>
                                                ) : youtubeViews !== null ? (
                                                    youtubeViews.toLocaleString()
                                                ) : isYouTubeConnected && video.status === 'published' ? (
                                                    video.views.toLocaleString()
                                                ) : (
                                                    '--'
                                                )}
                                                {youtubeViews !== null && ' views'}
                                            </span>
                                        </div>
                                        <div className='flex items-center gap-1'>
                                            <Calendar className='h-4 w-4' />
                                            <span>{formatDate(video.createdAt)}</span>
                                        </div>
                                        <div className='flex items-center gap-1'>
                                            <Hash className='h-4 w-4' />
                                            <span>#{video.id}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className='flex items-center gap-2 ml-4'>
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                        video.status === 'published' 
                                            ? 'bg-green-100 text-green-800 border border-green-200' 
                                            : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                    }`}>
                                        {video.status.charAt(0).toUpperCase() + video.status.slice(1)}
                                    </span>
                                </div>
                            </div>
                            
                            {/* Action Buttons */}
                            <div className='flex items-center gap-3 mb-6 pb-6 border-b relative'>
                                <div className="relative">
                                    <Button
                                        variant='outline'
                                        className='flex items-center gap-2'
                                        onClick={handleDownload}
                                        disabled={isDownloading}
                                    >
                                        {isDownloading ? (
                                            <div className="flex items-center gap-2">
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                                                <span>Downloading...</span>
                                                {downloadProgress > 0 && (
                                                    <span className="text-xs text-gray-500">
                                                        {downloadProgress}%
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <>
                                                <Download className='h-4 w-4' />
                                                Download
                                            </>
                                        )}
                                    </Button>
                                    {isDownloading && downloadProgress > 0 && (
                                        <div className="absolute -bottom-1 left-0 right-0 h-1 bg-gray-200 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-purple-600 transition-all duration-300 ease-out"
                                                style={{ width: `${downloadProgress}%` }}
                                            />
                                        </div>
                                    )}
                                </div>
                                
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant='outline'
                                            className='flex items-center gap-2'
                                        >
                                            <Share2 className='h-4 w-4' />
                                            Share
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className='w-56'>
                                        {/* Share original video using cloudinary URL */}
                                        <DropdownMenuItem onClick={() => {
                                            navigator.clipboard.writeText(video.videoUrl).then(() => {
                                                toast({
                                                    title: 'Video Link Copied',
                                                    description: 'Video URL has been copied to clipboard.',
                                                });
                                            }).catch(() => {
                                                toast({
                                                    title: 'Copy Failed',
                                                    description: 'Could not copy video link.',
                                                    variant: 'destructive',
                                                });
                                            });
                                        }}>
                                            <LinkIcon className='mr-2 h-4 w-4' />
                                            <span>Copy Video Link</span>
                                        </DropdownMenuItem>

                                        {/* Show published video links if available */}
                                        {video.publishedVideos && video.publishedVideos.length > 0 && (
                                            <>
                                                <div className="border-t my-1"></div>
                                                <div className="px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
                                                    Published Videos
                                                </div>
                                                {video.publishedVideos.map((publishedVideo) => (
                                                    <DropdownMenuItem 
                                                        key={publishedVideo.id}
                                                        onClick={() => handleSharePublished(publishedVideo)}
                                                    >
                                                        <span className='mr-2 text-sm'>
                                                            {videoService.getPlatformIcon(publishedVideo.platform)}
                                                        </span>
                                                        <span>Share from {videoService.formatPlatformName(publishedVideo.platform)}</span>
                                                    </DropdownMenuItem>
                                                ))}
                                            </>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                {/* YouTube Upload/Watch Button */}
                                {!isYouTubeConnected ? (
                                    <Button
                                        variant='outline'
                                        onClick={() => router.push('/dashboard')}
                                        className='flex items-center gap-2'
                                    >
                                        <Youtube className='h-4 w-4 text-red-600' />
                                        Connect YouTube First
                                    </Button>
                                ) : publishedVideoData && (publishedVideoData.platform === 'YouTube' || publishedVideoData.url?.includes('youtube.com')) ? (
                                    <Button
                                        variant='outline'
                                        onClick={() => window.open(publishedVideoData.url, '_blank')}
                                        className='flex items-center gap-2'
                                    >
                                        <Youtube className='h-4 w-4 text-red-600' />
                                        Watch on YouTube
                                    </Button>
                                ) : (
                                    <Button
                                        variant='outline'
                                        onClick={() => setShowYouTubeUpload(true)}
                                        // disabled={!hasYouTubePermissions}
                                        className='flex items-center gap-2'
                                        // title={!hasYouTubePermissions ? 'YouTube upload permissions required' : 'Upload to YouTube'}
                                    >
                                        <Youtube className='h-4 w-4 text-red-600' />
                                        Upload to YouTube
                                    </Button>
                                )}
                            </div>
                            
                            {/* Description */}
                            <div>
                                <h3 className='text-lg font-semibold mb-3 text-gray-900'>Description</h3>
                                <p className='text-gray-700 leading-relaxed'>
                                    {video.description || 'No description available for this video.'}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar with Video Info and Actions */}
                <div className='xl:col-span-1 space-y-6'>
                    {/* Video Statistics */}
                    <Card className={`${ video.status !== 'published' ? 'opacity-50' : ''}`}>
                        <CardContent className='p-6'>
                            <h3 className='font-semibold text-lg mb-4 text-gray-900'>Video Statistics</h3>
                            <div className='space-y-4'>
                                <div className='flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0'>
                                    <div className='flex items-center gap-2 text-gray-600'>
                                        <Eye className='h-4 w-4' />
                                        <span className='text-sm'>Total Views</span>
                                    </div>
                                    <span className='font-semibold text-gray-900'>
                                        {isLoadingYoutubeViews ? (
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                                        ) : youtubeViews !== null ? (
                                            youtubeViews.toLocaleString()
                                        ) : isYouTubeConnected && video.status === 'published' ? (
                                            video.views.toLocaleString()
                                        ) : (
                                            '--'
                                        )}
                                    </span>
                                </div>
                                <div className='flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0'>
                                    <div className='flex items-center gap-2 text-gray-600'>
                                        <Calendar className='h-4 w-4' />
                                        <span className='text-sm'>Created</span>
                                    </div>
                                    <span className='font-semibold text-gray-900'>{formatDate(video.createdAt)}</span>
                                </div>
                                <div className='flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0'>
                                    <div className='flex items-center gap-2 text-gray-600'>
                                        <Hash className='h-4 w-4' />
                                        <span className='text-sm'>Video ID</span>
                                    </div>
                                    <span className='font-semibold text-gray-900'>#{video.id}</span>
                                </div>
                                <div className='flex items-center justify-between py-2'>
                                    <div className='flex items-center gap-2 text-gray-600'>
                                        <div className={`h-4 w-4 rounded-full ${
                                            video.status === 'published' ? 'bg-green-500' : 'bg-yellow-500'
                                        }`}></div>
                                        <span className='text-sm'>Status</span>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        video.status === 'published' 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                        {video.status.charAt(0).toUpperCase() + video.status.slice(1)}
                                    </span>
                                </div>
                                {(!isYouTubeConnected || video.status !== 'published') && (
                                    <div className='pt-3 border-t border-gray-200'>
                                        <p className='text-xs text-gray-500 text-center'>
                                            {!isYouTubeConnected ? 
                                                'Connect YouTube to view detailed statistics' : 
                                                'Publish video to view detailed statistics'
                                            }
                                        </p>
                                        {youtubeViewsError && (
                                            <p className='text-xs text-red-500 text-center mt-1'>
                                                Error loading YouTube views: {youtubeViewsError}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Published Videos Section - Keep this but simplified */}
                    {video.publishedVideos && video.publishedVideos.length > 0 && (
                        <Card>
                            <CardContent className='p-6'>
                                <h3 className='font-semibold text-lg mb-4 text-gray-900'>Published on Platforms</h3>
                                <div className='space-y-4'>
                                    {video.publishedVideos.map((publishedVideo) => (
                                        <div key={publishedVideo.id} className='p-4 bg-gradient-to-r from-gray-50 to-gray-25 rounded-lg border border-gray-200 hover:shadow-sm transition-shadow'>
                                            <div className='flex items-center justify-between mb-3'>
                                                <div className='flex items-center gap-3'>
                                                    <div className='w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm'>
                                                        <span className='text-lg'>
                                                            {videoService.getPlatformIcon(publishedVideo.platform)}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <div className='font-medium text-gray-900'>
                                                            {videoService.formatPlatformName(publishedVideo.platform)}
                                                        </div>
                                                        <div className='text-xs text-gray-500'>
                                                            {publishedVideo.externalId && `ID: ${publishedVideo.externalId}`}
                                                        </div>
                                                    </div>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleSharePublished(publishedVideo)}
                                                    className="h-8 px-3 text-xs"
                                                >
                                                    <Share2 className='h-3 w-3 mr-1' />
                                                    Share
                                                </Button>
                                            </div>
                                            
                                            {publishedVideo.url && (
                                                <div className='mt-3 pt-3 border-t border-gray-200'>
                                                    <a
                                                        href={publishedVideo.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className='inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors'
                                                    >
                                                        <ExternalLink className='h-4 w-4' />
                                                        View on {videoService.formatPlatformName(publishedVideo.platform)}
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Publish Actions for Draft Videos - Only show for private videos
                    {video.status === 'private' && (
                        <Card>
                            <CardContent className='p-6'>
                                <h3 className='font-semibold text-lg mb-4 text-gray-900'>Ready to Publish?</h3>
                                <p className='text-sm text-gray-600 mb-4'>
                                    Your video is ready to be published to various platforms.
                                </p>
                                <Button 
                                    className='w-full bg-purple-600 hover:bg-purple-700'
                                    onClick={() => setShowYouTubeUpload(true)}
                                >
                                    <span className='mr-2'>🚀</span>
                                    Publish Video
                                </Button>
                            </CardContent>
                        </Card>
                    )} */}

                    {/* Developer Info - Only show in development */}
                    {process.env.NODE_ENV === 'development' && (
                        <Card className='border-dashed border-gray-300'>
                            <CardContent className='p-4'>
                                <h3 className='font-medium mb-2 text-gray-700 text-sm'>Development Info</h3>
                                <div className='text-xs text-gray-500 break-all bg-gray-50 p-2 rounded font-mono'>
                                    {video.videoUrl}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {/* YouTube Upload Dialog */}
            {video && (
                <YouTubeUploadDialog
                    video={video}
                    isOpen={showYouTubeUpload}
                    onClose={() => setShowYouTubeUpload(false)}
                    onSuccess={handleYouTubeUploadSuccess}
                />
            )}
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