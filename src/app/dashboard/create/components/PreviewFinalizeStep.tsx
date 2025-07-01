'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Download,
    Play,
    Pause,
    Share2,
    CheckCircle,
    FileVideo,
    Clock,
    Upload,
    Loader2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import type { VideoCreationState } from '@/types/video-creation';
import { VideoDebugPanel } from '@/components/debug/VideoDebugPanel';
import {
    createCompatibleVideoBlob,
    testVideoFormats,
} from '@/utils/videoCompatibility';
import {
    CloudinaryService,
    type UploadProgress,
} from '@/services/cloudinaryService';
import { VideoService, type CreateVideoRequest } from '@/services/videoService';

interface PreviewFinalizeStepProps {
    state: VideoCreationState;
    onUpdateState: (updates: Partial<VideoCreationState>) => void;
    onFinish: (videoId?: number) => void;
    finalVideoBlob: Blob | null;
}

export function PreviewFinalizeStep({
    state,
    onUpdateState,
    onFinish,
    finalVideoBlob,
}: PreviewFinalizeStepProps) {
    console.log('🎬 PreviewFinalizeStep received video blob:', {
        hasBlob: !!finalVideoBlob,
        blobSize: finalVideoBlob?.size || 0,
        blobType: finalVideoBlob?.type || 'N/A',
    });

    const router = useRouter();
    const { toast } = useToast();

    const [videoUrl, setVideoUrl] = useState<string>('');
    const [isPlaying, setIsPlaying] = useState(false);
    const [videoMetadata, setVideoMetadata] = useState<{
        duration: number;
        size: string;
    } | null>(null);
    const [videoError, setVideoError] = useState<string>('');

    // Upload and save states
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
        loaded: 0,
        total: 0,
        percentage: 0,
    });
    const [isSaving, setIsSaving] = useState(false);
    const [isFinishing, setIsFinishing] = useState(false);

    // Video title and description state
    const [videoTitle, setVideoTitle] = useState('');
    const [videoDescription, setVideoDescription] = useState('');
    const [titleError, setTitleError] = useState('');
    const [descriptionError, setDescriptionError] = useState('');

    const videoRef = useRef<HTMLVideoElement>(null);

    const cloudinaryService = new CloudinaryService();
    const videoService = new VideoService();

    // Initialize title and description with defaults
    useEffect(() => {
        if (!videoTitle) {
            setVideoTitle(
                state.selectedTopic ||
                    state.videoDescription ||
                    'AI Generated Video'
            );
        }
        if (!videoDescription) {
            setVideoDescription(
                `AI-generated video about: ${state.selectedTopic || state.videoDescription}. Target audience: ${state.targetAudience || 'General'}. Style: ${state.videoStyle || 'Modern'}`
            );
        }
    }, [state, videoTitle, videoDescription]);

    // Create video URL when finalVideoBlob is available
    useEffect(() => {
        if (finalVideoBlob) {
            console.log('🎥 Final video blob received:', {
                size: finalVideoBlob.size,
                type: finalVideoBlob.type,
                isValid: finalVideoBlob.size > 0,
            });

            // Validate the blob
            if (finalVideoBlob.size === 0) {
                console.error('❌ Video blob is empty');
                setVideoError('Video file is empty');
                return;
            }

            // Fix blob MIME type if necessary
            let processedBlob = finalVideoBlob;

            // Test browser video format support
            testVideoFormats();

            // Create a compatible video blob
            processedBlob = createCompatibleVideoBlob(finalVideoBlob);

            console.log('✅ Processed video blob:', {
                originalType: finalVideoBlob.type,
                processedType: processedBlob.type,
                sizeMatches: finalVideoBlob.size === processedBlob.size,
            });

            const url = URL.createObjectURL(processedBlob);
            setVideoUrl(url);

            // Create additional sources for better compatibility
            const sources = createVideoSources(finalVideoBlob);
            setVideoSources(sources);

            // Calculate file size
            const sizeInMB = (finalVideoBlob.size / (1024 * 1024)).toFixed(2);
            setVideoMetadata({
                duration: 0, // Will be set when video loads
                size: `${sizeInMB} MB`,
            });

            // Clear any previous errors
            setVideoError('');

            return () => {
                URL.revokeObjectURL(url);
                // Clean up additional sources
                sources.forEach((source) => URL.revokeObjectURL(source.url));
            };
        } else {
            console.log('❌ No final video blob provided');
            setVideoError('No video available for preview');
        }
    }, [finalVideoBlob]);

    // Create multiple video sources for better browser compatibility
    const [videoSources, setVideoSources] = useState<
        Array<{ url: string; type: string }>
    >([]);

    const createVideoSources = (blob: Blob) => {
        const sources = [];

        // Try original blob type first
        if (blob.type && blob.type.includes('video')) {
            sources.push({
                url: URL.createObjectURL(blob),
                type: blob.type,
            });
        }

        // Add MP4 as fallback
        if (!blob.type.includes('mp4')) {
            const mp4Blob = new Blob([blob], { type: 'video/mp4' });
            sources.push({
                url: URL.createObjectURL(mp4Blob),
                type: 'video/mp4',
            });
        }

        // Add WebM as another fallback
        if (!blob.type.includes('webm')) {
            const webmBlob = new Blob([blob], { type: 'video/webm' });
            sources.push({
                url: URL.createObjectURL(webmBlob),
                type: 'video/webm',
            });
        }

        return sources;
    };

    // Handle video metadata loaded
    const handleVideoLoadedMetadata = () => {
        if (videoRef.current && videoMetadata) {
            setVideoMetadata((prev) =>
                prev
                    ? {
                          ...prev,
                          duration: videoRef.current!.duration,
                      }
                    : null
            );
        }
    };

    // Handle video error
    const handleVideoError = () => {
        const error = videoRef.current?.error;
        let errorMessage = 'Unknown video error';
        let technicalDetails = '';

        if (error) {
            switch (error.code) {
                case MediaError.MEDIA_ERR_ABORTED:
                    errorMessage = 'Video playback was aborted';
                    technicalDetails = 'The video loading was interrupted';
                    break;
                case MediaError.MEDIA_ERR_NETWORK:
                    errorMessage = 'Network error while loading video';
                    technicalDetails =
                        'Check your internet connection and try again';
                    break;
                case MediaError.MEDIA_ERR_DECODE:
                    errorMessage = 'Video format is corrupted or invalid';
                    technicalDetails =
                        'The video file may be damaged during processing';
                    break;
                case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
                    errorMessage = 'Video format not supported by browser';
                    technicalDetails =
                        'Try downloading the video to play it externally';
                    break;
                default:
                    errorMessage = 'Unknown video error';
                    technicalDetails = `Error code: ${error.code}`;
            }
        }

        console.warn(
            '⚠️ Video playback error (handled gracefully):',
            errorMessage,
            error
        );
        setVideoError(`${errorMessage}. ${technicalDetails}`);
    };

    // Toggle video playback
    const togglePlayback = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    // Download final video
    const downloadVideo = () => {
        if (finalVideoBlob) {
            const url = URL.createObjectURL(finalVideoBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'final-captioned-video.mp4';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    };

    // Format duration for display
    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Validation functions
    const validateTitle = (title: string) => {
        if (!title.trim()) {
            setTitleError('Title is required');
            return false;
        }
        if (title.length > 48) {
            setTitleError('Title must be 48 characters or less');
            return false;
        }
        setTitleError('');
        return true;
    };

    const validateDescription = (description: string) => {
        if (description.length > 255) {
            setDescriptionError('Description must be 255 characters or less');
            return false;
        }
        setDescriptionError('');
        return true;
    };

    // Handle title change
    const handleTitleChange = (value: string) => {
        setVideoTitle(value);
        validateTitle(value);
    };

    // Handle description change
    const handleDescriptionChange = (value: string) => {
        setVideoDescription(value);
        validateDescription(value);
    };

    // Handle the complete upload and save flow
    const handleFinishVideo = async () => {
        if (!finalVideoBlob) {
            toast({
                title: 'Error',
                description: 'No video available to upload',
                variant: 'destructive',
            });
            return;
        }

        // Validate title and description before proceeding
        const isTitleValid = validateTitle(videoTitle);
        const isDescriptionValid = validateDescription(videoDescription);

        if (!isTitleValid || !isDescriptionValid) {
            toast({
                title: 'Validation Error',
                description:
                    'Please fix the validation errors before proceeding',
                variant: 'destructive',
            });
            return;
        }

        setIsFinishing(true);

        try {
            // Step 1: Upload to Cloudinary
            setIsUploading(true);
            toast({
                title: 'Uploading Video',
                description: 'Uploading your video to cloud storage...',
            });

            const cloudinaryResponse = await cloudinaryService.uploadVideo(
                finalVideoBlob,
                `ai-video-${Date.now()}.mp4`,
                (progress: UploadProgress) => {
                    setUploadProgress(progress);
                }
            );

            setIsUploading(false);

            // Step 2: Save to backend
            setIsSaving(true);
            toast({
                title: 'Saving Video',
                description: 'Saving video metadata to your account...',
            });

            const createRequest: CreateVideoRequest = {
                title: videoTitle.substring(0, 48),
                videoUrl: cloudinaryResponse.secure_url,
                status: 'private',
                description: videoDescription.substring(0, 255),
            };

            const createdVideo = await videoService.createVideo(createRequest);
            setIsSaving(false);

            // Step 3: Success and redirect
            toast({
                title: 'Video Created Successfully!',
                description: 'Your video has been saved to your dashboard.',
            });

            // Redirect to video detail page
            router.push(`/dashboard/video/${createdVideo.id}`);

            // Call the original onFinish callback with video ID
            onFinish(createdVideo.id);
        } catch (error) {
            console.error('Error finishing video:', error);
            setIsUploading(false);
            setIsSaving(false);
            setIsFinishing(false);

            toast({
                title: 'Error',
                description:
                    error instanceof Error
                        ? error.message
                        : 'Failed to save video',
                variant: 'destructive',
            });
        }
    };

    return (
        <div className='space-y-6'>
            <div className='text-center mb-4'>
                <h3 className='text-lg font-semibold flex items-center justify-center gap-2'>
                    <CheckCircle className='h-5 w-5 text-green-600' />
                    Final Video Preview
                </h3>
                <p className='text-sm text-gray-500'>
                    Your AI-generated video with captions is ready!
                </p>
            </div>

            {/* Video Preview */}
            {videoUrl ? (
                <Card>
                    <CardHeader>
                        <CardTitle className='flex items-center gap-2'>
                            <FileVideo className='h-5 w-5' />
                            Final Captioned Video
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {videoError ? (
                            <div className='aspect-video bg-yellow-50 rounded-md border border-yellow-200 flex items-center justify-center mb-4'>
                                <div className='text-center p-6'>
                                    <FileVideo className='h-12 w-12 text-yellow-500 mx-auto mb-3' />
                                    <p className='text-yellow-800 font-medium mb-2'>
                                        Video Preview Issue
                                    </p>
                                    <p className='text-sm text-yellow-700 mb-4 max-w-md'>
                                        {videoError}
                                    </p>

                                    <div className='flex gap-2 justify-center'>
                                        <Button
                                            variant='outline'
                                            size='sm'
                                            onClick={() => {
                                                setVideoError('');
                                                if (videoRef.current) {
                                                    videoRef.current.load();
                                                }
                                            }}
                                        >
                                            Retry Preview
                                        </Button>

                                        {finalVideoBlob && (
                                            <Button
                                                variant='outline'
                                                size='sm'
                                                onClick={downloadVideo}
                                                className='gap-1'
                                            >
                                                <Download className='h-3 w-3' />
                                                Download Anyway
                                            </Button>
                                        )}
                                    </div>

                                    <p className='text-xs text-yellow-600 mt-3'>
                                        The video file is ready but may not
                                        preview in your browser. You can still
                                        download and play it with external video
                                        players.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className='aspect-video bg-gray-900 rounded-md overflow-hidden relative mb-4'>
                                <video
                                    ref={videoRef}
                                    className='w-full h-full object-contain'
                                    onPlay={() => setIsPlaying(true)}
                                    onPause={() => setIsPlaying(false)}
                                    onLoadedMetadata={handleVideoLoadedMetadata}
                                    onError={handleVideoError}
                                    onLoadStart={() =>
                                        console.log('🎬 Video loading started')
                                    }
                                    onCanPlay={() =>
                                        console.log('✅ Video can play')
                                    }
                                    controls
                                    preload='metadata'
                                >
                                    {/* Primary source */}
                                    <source src={videoUrl} type='video/mp4' />

                                    {/* Fallback sources */}
                                    {videoSources.map((source, index) => (
                                        <source
                                            key={index}
                                            src={source.url}
                                            type={source.type}
                                        />
                                    ))}

                                    {/* Fallback text */}
                                    <p className='text-white text-center p-4'>
                                        Your browser doesn't support HTML5
                                        video.
                                        <button
                                            onClick={downloadVideo}
                                            className='underline ml-2 text-blue-300 hover:text-blue-100'
                                        >
                                            Download the video
                                        </button>
                                        to play it externally.
                                    </p>
                                </video>
                            </div>
                        )}

                        {/* Video Metadata */}
                        {videoMetadata && (
                            <div className='flex items-center justify-center gap-6 text-sm text-gray-600 mb-4'>
                                <div className='flex items-center gap-1'>
                                    <Clock className='h-4 w-4' />
                                    <span>
                                        Duration:{' '}
                                        {videoMetadata.duration > 0
                                            ? formatDuration(
                                                  videoMetadata.duration
                                              )
                                            : 'Loading...'}
                                    </span>
                                </div>
                                <div className='flex items-center gap-1'>
                                    <FileVideo className='h-4 w-4' />
                                    <span>Size: {videoMetadata.size}</span>
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className='flex gap-3 justify-center'>
                            <Button
                                variant='outline'
                                onClick={togglePlayback}
                                className='gap-2'
                            >
                                {isPlaying ? (
                                    <Pause className='h-4 w-4' />
                                ) : (
                                    <Play className='h-4 w-4' />
                                )}
                                {isPlaying ? 'Pause' : 'Play'}
                            </Button>

                            <Button
                                variant='outline'
                                onClick={downloadVideo}
                                className='gap-2'
                            >
                                <Download className='h-4 w-4' />
                                Download MP4
                            </Button>

                            <Button
                                variant='outline'
                                className='gap-2'
                                disabled
                            >
                                <Share2 className='h-4 w-4' />
                                Share (Coming Soon)
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardContent className='pt-6'>
                        <div className='text-center py-8'>
                            <FileVideo className='h-12 w-12 text-gray-400 mx-auto mb-4' />
                            <p className='text-gray-500'>
                                No final video available for preview.
                            </p>
                            <p className='text-sm text-gray-400 mt-2'>
                                Please complete the previous steps to generate a
                                video.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Project Summary */}
            <Card>
                <CardHeader>
                    <CardTitle>Project Summary</CardTitle>
                </CardHeader>
                <CardContent className='space-y-3'>
                    <div className='grid grid-cols-2 gap-4 text-sm'>
                        <div>
                            <Label className='text-gray-500'>Topic</Label>
                            <p className='font-medium'>
                                {state.selectedTopic ||
                                    state.videoDescription ||
                                    'N/A'}
                            </p>
                        </div>
                        <div>
                            <Label className='text-gray-500'>
                                Target Audience
                            </Label>
                            <p className='font-medium'>
                                {state.targetAudience || 'N/A'}
                            </p>
                        </div>
                        <div>
                            <Label className='text-gray-500'>Video Goal</Label>
                            <p className='font-medium'>
                                {state.videoGoal || 'N/A'}
                            </p>
                        </div>
                        <div>
                            <Label className='text-gray-500'>Video Style</Label>
                            <p className='font-medium'>
                                {state.videoStyle || 'N/A'}
                            </p>
                        </div>
                        <div>
                            <Label className='text-gray-500'>Language</Label>
                            <p className='font-medium'>
                                {state.language || 'N/A'}
                            </p>
                        </div>
                        <div>
                            <Label className='text-gray-500'>Status</Label>
                            <p className='font-medium text-green-600'>
                                ✅ Complete
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Debug Panel (Development Only) */}
            <VideoDebugPanel videoBlob={finalVideoBlob} />

            {/* Video Details Form */}
            <Card>
                <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                        <FileVideo className='h-5 w-5' />
                        Video Details
                    </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                    {/* Title Field */}
                    <div className='space-y-2'>
                        <Label htmlFor='videoTitle'>
                            Video Title <span className='text-red-500'>*</span>
                        </Label>
                        <div className='space-y-1'>
                            <Input
                                id='videoTitle'
                                type='text'
                                placeholder='Enter a descriptive title for your video'
                                value={videoTitle}
                                onChange={(e) =>
                                    handleTitleChange(e.target.value)
                                }
                                className={titleError ? 'border-red-500' : ''}
                                maxLength={48}
                            />
                            <div className='flex justify-between items-center text-xs'>
                                <span
                                    className={
                                        titleError
                                            ? 'text-red-500'
                                            : 'text-gray-500'
                                    }
                                >
                                    {titleError ||
                                        'Choose a clear, descriptive title'}
                                </span>
                                <span
                                    className={
                                        videoTitle.length > 40
                                            ? 'text-yellow-600'
                                            : 'text-gray-400'
                                    }
                                >
                                    {videoTitle.length}/48
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Description Field */}
                    <div className='space-y-2'>
                        <Label htmlFor='videoDescription'>
                            Video Description
                        </Label>
                        <div className='space-y-1'>
                            <Textarea
                                id='videoDescription'
                                placeholder='Add a description to help viewers understand your video content'
                                value={videoDescription}
                                onChange={(e) =>
                                    handleDescriptionChange(e.target.value)
                                }
                                className={
                                    descriptionError ? 'border-red-500' : ''
                                }
                                rows={4}
                                maxLength={255}
                            />
                            <div className='flex justify-between items-center text-xs'>
                                <span
                                    className={
                                        descriptionError
                                            ? 'text-red-500'
                                            : 'text-gray-500'
                                    }
                                >
                                    {descriptionError ||
                                        'Provide context about your video content'}
                                </span>
                                <span
                                    className={
                                        videoDescription.length > 240
                                            ? 'text-yellow-600'
                                            : 'text-gray-400'
                                    }
                                >
                                    {videoDescription.length}/255
                                </span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Finish Button */}
            <div className='flex flex-col items-center space-y-3'>
                <Button
                    onClick={handleFinishVideo}
                    size='lg'
                    className='px-12 gap-2'
                    disabled={
                        isFinishing ||
                        !finalVideoBlob ||
                        !!titleError ||
                        !!descriptionError ||
                        !videoTitle.trim()
                    }
                >
                    {isFinishing ? (
                        <>
                            <Loader2 className='h-5 w-5 animate-spin' />
                            {isUploading && 'Uploading...'}
                            {isSaving && 'Saving...'}
                            {!isUploading && !isSaving && 'Processing...'}
                        </>
                    ) : (
                        <>
                            <CheckCircle className='h-5 w-5' />
                            Complete Project
                        </>
                    )}
                </Button>

                {(!!titleError || !!descriptionError || !videoTitle.trim()) && (
                    <p className='text-sm text-red-500 text-center max-w-md'>
                        Please complete all required fields and fix validation
                        errors before proceeding
                    </p>
                )}
            </div>

            {/* Upload Progress */}
            {isUploading && uploadProgress.total > 0 && (
                <Card>
                    <CardContent className='pt-6'>
                        <div className='space-y-2'>
                            <div className='flex items-center justify-between text-sm'>
                                <span className='flex items-center gap-2'>
                                    <Upload className='h-4 w-4' />
                                    Uploading video...
                                </span>
                                <span>
                                    {uploadProgress.percentage.toFixed(1)}%
                                </span>
                            </div>
                            <div className='w-full bg-gray-200 rounded-full h-2'>
                                <div
                                    className='bg-blue-600 h-2 rounded-full transition-all duration-300'
                                    style={{
                                        width: `${uploadProgress.percentage}%`,
                                    }}
                                />
                            </div>
                            <div className='text-xs text-gray-500 text-center'>
                                {(
                                    uploadProgress.loaded /
                                    (1024 * 1024)
                                ).toFixed(2)}{' '}
                                MB /{' '}
                                {(uploadProgress.total / (1024 * 1024)).toFixed(
                                    2
                                )}{' '}
                                MB
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Debug Panel - Uncomment to use */}
            {/* <VideoDebugPanel 
                videoBlob={finalVideoBlob}
                videoUrl={videoUrl}
                metadata={videoMetadata}
                error={videoError}
                onRetry={() => {
                    setVideoError('');
                    if (videoRef.current) {
                        videoRef.current.load();
                    }
                }}
            /> */}
        </div>
    );
}
