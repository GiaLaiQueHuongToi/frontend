'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Download, Video, X, Eye, EyeOff } from 'lucide-react';
import type { GeneratedSegment } from '@/types/video-creation';
import { generateVideoFromSegments } from '@/utils/videoGenerator';
import { useFFmpeg } from '@/contexts/FFmpegContext';

interface VideoGenerationStepProps {
    onFinish: (videoBlob?: Blob) => void;
    segments: GeneratedSegment[];
    onVideoGenerated?: (hasVideo: boolean, videoBlob?: Blob) => void; // Updated to pass video blob
}

interface TimelineElement {
    id: number;
    type: string;
    content: string;
    duration: number;
}

export function VideoGenerationStep({
    onFinish,
    segments,
    onVideoGenerated,
}: VideoGenerationStepProps) {
    const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
    const [videoUrl, setVideoUrl] = useState<string>('');
    const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
    const [progressMessage, setProgressMessage] = useState<string>('');
    const [enabledSegments, setEnabledSegments] = useState<Set<number>>(
        new Set(segments.map((s) => s.segmentId))
    );

    // Use shared FFmpeg context
    const {
        ffmpeg,
        isLoading: ffmpegLoading,
        error: ffmpegError,
        reinitialize,
    } = useFFmpeg();

    // Update enabled segments when segments prop changes
    useEffect(() => {
        setEnabledSegments(new Set(segments.map((s) => s.segmentId)));
    }, [segments]);

    // Toggle segment enabled/disabled
    const toggleSegment = (segmentId: number) => {
        setEnabledSegments((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(segmentId)) {
                newSet.delete(segmentId);
            } else {
                newSet.add(segmentId);
            }
            return newSet;
        });
        // Reset video URL when segments change
        setVideoUrl('');
    };

    // Notify parent when video generation status changes
    useEffect(() => {
        if (onVideoGenerated) {
            onVideoGenerated(!!videoUrl, videoBlob || undefined);
        }
    }, [videoUrl, videoBlob, onVideoGenerated]);

    // Get filtered segments for video generation
    const getActiveSegments = () => {
        return segments.filter((segment) =>
            enabledSegments.has(segment.segmentId)
        );
    };

    // Generate video from segments using utility
    const generateVideo = async () => {
        const activeSegments = getActiveSegments();
        if (!ffmpeg || activeSegments.length === 0) return;

        setIsGeneratingVideo(true);
        setProgressMessage('Initializing video generation...');

        try {
            const result = await generateVideoFromSegments({
                segments: activeSegments,
                ffmpeg,
                onProgress: (message) => {
                    setProgressMessage(message);
                },
            });

            if (result.success && result.videoBlob) {
                const url = URL.createObjectURL(result.videoBlob);
                setVideoUrl(url);
                setVideoBlob(result.videoBlob); // Store the blob
                setProgressMessage('Video generated successfully!');
            } else {
                throw new Error(result.error || 'Failed to generate video');
            }
        } catch (error) {
            console.error('Error generating video:', error);
            const errorMessage =
                error instanceof Error ? error.message : 'Unknown error';
            alert(`Failed to generate video: ${errorMessage}`);
            setProgressMessage('');
        } finally {
            setIsGeneratingVideo(false);
        }
    };

    const downloadVideo = () => {
        if (videoUrl) {
            const a = document.createElement('a');
            a.href = videoUrl;
            a.download = 'generated-video.mp4';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
    };

    return (
        <div className='space-y-6'>
            <div className='text-center mb-4'>
                <h3 className='text-lg font-semibold'>
                    Final Video Generation
                </h3>
                <p className='text-sm text-gray-500'>
                    Generate your final video with all segments
                </p>
            </div>

            {/* Segments Preview */}
            {segments.length > 0 && (
                <div className='space-y-4'>
                    <div className='flex items-center justify-between'>
                        <Label>
                            Video Segments ({getActiveSegments().length} of{' '}
                            {segments.length} enabled)
                        </Label>
                        <div className='flex gap-2'>
                            <Button
                                variant='outline'
                                size='sm'
                                onClick={() =>
                                    setEnabledSegments(
                                        new Set(
                                            segments.map((s) => s.segmentId)
                                        )
                                    )
                                }
                                disabled={
                                    enabledSegments.size === segments.length
                                }
                            >
                                Enable All
                            </Button>
                            <Button
                                variant='outline'
                                size='sm'
                                onClick={() => setEnabledSegments(new Set())}
                                disabled={enabledSegments.size === 0}
                            >
                                Disable All
                            </Button>
                        </div>
                    </div>
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                        {segments.map((segment, index) => {
                            const isEnabled = enabledSegments.has(
                                segment.segmentId
                            );
                            return (
                                <Card
                                    key={segment.segmentId}
                                    className={`overflow-hidden relative transition-all ${
                                        isEnabled
                                            ? 'border-green-200 bg-white'
                                            : 'border-gray-300 bg-gray-50 opacity-60'
                                    }`}
                                >
                                    {/* Toggle Button */}
                                    <Button
                                        variant={
                                            isEnabled
                                                ? 'destructive'
                                                : 'default'
                                        }
                                        size='sm'
                                        className='absolute top-2 right-2 z-10 h-8 w-8 p-0'
                                        onClick={() =>
                                            toggleSegment(segment.segmentId)
                                        }
                                    >
                                        {isEnabled ? (
                                            <EyeOff className='h-4 w-4' />
                                        ) : (
                                            <Eye className='h-4 w-4' />
                                        )}
                                    </Button>

                                    <div className='aspect-video relative'>
                                        <Image
                                            src={segment.imageUrl}
                                            alt={`Segment ${segment.segmentId}`}
                                            fill
                                            className='object-cover'
                                        />
                                        {!isEnabled && (
                                            <div className='absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center'>
                                                <span className='text-white font-medium text-sm'>
                                                    Disabled
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <CardContent className='p-3'>
                                        <h4 className='font-medium text-sm mb-1'>
                                            Segment {segment.segmentId}
                                            {!isEnabled && (
                                                <span className='text-gray-500'>
                                                    {' '}
                                                    (Disabled)
                                                </span>
                                            )}
                                        </h4>
                                        <p className='text-xs text-gray-600 line-clamp-2'>
                                            {segment.scriptText}
                                        </p>
                                        <div className='flex items-center justify-between mt-2'>
                                            <span className='text-xs text-gray-500'>
                                                {segment.duration?.toFixed(1) ||
                                                    '5.0'}
                                                s
                                            </span>
                                            <div className='flex gap-1'>
                                                {segment.audioUrl && (
                                                    <span className='text-xs text-green-600'>
                                                        ✓ Audio
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Video Generation */}
            <Card>
                <CardHeader>
                    <CardTitle className='text-center'>
                        Generate Final Video
                    </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                    {!videoUrl ? (
                        <div className='text-center space-y-4'>
                            <p className='text-gray-600'>
                                Ready to generate your final video with{' '}
                                {getActiveSegments().length} segments
                                {getActiveSegments().length !==
                                    segments.length && (
                                    <span className='text-orange-600'>
                                        {' '}
                                        (
                                        {segments.length -
                                            getActiveSegments().length}{' '}
                                        segments disabled)
                                    </span>
                                )}
                            </p>
                            <Button
                                onClick={generateVideo}
                                disabled={
                                    isGeneratingVideo ||
                                    getActiveSegments().length === 0 ||
                                    !ffmpeg
                                }
                                className='gap-2'
                                size='lg'
                            >
                                <Video className='h-5 w-5' />
                                {isGeneratingVideo
                                    ? 'Generating Video...'
                                    : 'Generate Final Video'}
                            </Button>

                            {/* Debug information */}
                            <div className='text-xs text-gray-500 mt-2 p-2 bg-gray-50 rounded'>
                                <div>
                                    <strong>Debug Info:</strong>
                                </div>
                                <div>
                                    FFmpeg Status:{' '}
                                    {ffmpeg ? 'Loaded' : 'Not loaded'}
                                </div>
                                <div>
                                    Active Segments:{' '}
                                    {getActiveSegments().length}
                                </div>
                                <div>
                                    Currently Generating:{' '}
                                    {isGeneratingVideo ? 'Yes' : 'No'}
                                </div>
                                <div>
                                    Button Disabled:{' '}
                                    {isGeneratingVideo ||
                                    getActiveSegments().length === 0 ||
                                    !ffmpeg
                                        ? 'Yes'
                                        : 'No'}
                                </div>
                            </div>

                            {getActiveSegments().length === 0 && (
                                <p className='text-red-500 text-sm mt-2'>
                                    Please enable at least one segment to
                                    generate video
                                </p>
                            )}

                            {isGeneratingVideo && (
                                <div className='flex flex-col items-center gap-2 mt-4'>
                                    <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600'></div>
                                    <span className='text-sm text-gray-600'>
                                        {progressMessage ||
                                            'This may take a few minutes...'}
                                    </span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className='space-y-4'>
                            <h4 className='font-medium text-center text-green-600'>
                                ✓ Video Generated Successfully! (
                                {getActiveSegments().length} segments)
                            </h4>
                            <video
                                key={videoUrl}
                                controls
                                className='w-full max-w-2xl mx-auto rounded-lg'
                            >
                                <source src={videoUrl} type='video/mp4' />
                                Your browser does not support the video element.
                            </video>
                            <div className='flex gap-2 justify-center'>
                                <Button
                                    variant='outline'
                                    onClick={downloadVideo}
                                    className='gap-2'
                                >
                                    <Download className='h-4 w-4' />
                                    Download MP4
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
