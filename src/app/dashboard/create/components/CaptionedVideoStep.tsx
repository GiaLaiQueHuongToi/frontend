'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
    Upload,
    Download,
    Video,
    AudioLines,
    Captions,
    Loader2,
    Play,
    Pause,
    RotateCcw,
} from 'lucide-react';
import {
    captionService,
    type CaptionGenerationRequest,
} from '@/services/captionService';

interface CaptionedVideoStepProps {
    videoBlob: Blob | null;
    onFinish: () => void;
    onCaptionedVideoGenerated?: (captionedVideoBlob: Blob | null) => void;
}

interface CaptionSettings {
    fontSize: number;
    fontColor: string;
    position: 'top' | 'bottom';
}

// Common color presets that backend supports
const COLOR_PRESETS = [
    { name: 'White', value: 'white', hex: '#FFFFFF' },
    { name: 'Black', value: 'black', hex: '#000000' },
    { name: 'Red', value: 'red', hex: '#FF0000' },
    { name: 'Blue', value: 'blue', hex: '#0000FF' },
    { name: 'Green', value: 'green', hex: '#00FF00' },
    { name: 'Yellow', value: 'yellow', hex: '#FFFF00' },
    { name: 'Orange', value: 'orange', hex: '#FF8000' },
    { name: 'Purple', value: 'purple', hex: '#800080' },
] as const;

// Convert hex to color name if possible, otherwise return hex
const getOptimalColorValue = (hexColor: string): string => {
    const preset = COLOR_PRESETS.find(
        (p) => p.hex.toLowerCase() === hexColor.toLowerCase()
    );
    return preset ? preset.value : hexColor;
};

export function CaptionedVideoStep({
    videoBlob,
    onFinish,
    onCaptionedVideoGenerated,
}: CaptionedVideoStepProps) {
    // Video states
    const [currentVideoBlob, setCurrentVideoBlob] = useState<Blob | null>(
        videoBlob
    );
    const [videoUrl, setVideoUrl] = useState<string>('');
    const [finalVideoBlob, setFinalVideoBlob] = useState<Blob | null>(null);
    const [finalVideoUrl, setFinalVideoUrl] = useState<string>('');

    // Audio replacement states
    const [selectedAudioFile, setSelectedAudioFile] = useState<File | null>(
        null
    );
    const [isReplacingAudio, setIsReplacingAudio] = useState(false);

    // Caption states
    const [enableCaptions, setEnableCaptions] = useState(true);
    const [isGeneratingCaptions, setIsGeneratingCaptions] = useState(false);
    const [captionSettings, setCaptionSettings] = useState<CaptionSettings>({
        fontSize: 24,
        fontColor: 'white', // Use color name instead of hex
        position: 'bottom',
    });

    // Progress and UI states
    const [progressMessage, setProgressMessage] = useState('');
    const [isPlaying, setIsPlaying] = useState(false);
    const [serviceHealthy, setServiceHealthy] = useState<boolean | null>(null);

    // Refs
    const videoRef = useRef<HTMLVideoElement>(null);
    const audioInputRef = useRef<HTMLInputElement>(null);

    // Check caption service health on component mount
    useEffect(() => {
        const checkServiceHealth = async () => {
            const healthResult = await captionService.healthCheck();
            setServiceHealthy(healthResult.success);
            if (!healthResult.success) {
                console.warn(
                    'Caption service health check failed:',
                    healthResult.error
                );
            }
        };
        checkServiceHealth();
    }, []);

    // Initialize video URL when component mounts or videoBlob changes
    useEffect(() => {
        if (currentVideoBlob) {
            const url = URL.createObjectURL(currentVideoBlob);
            setVideoUrl(url);
            return () => URL.revokeObjectURL(url);
        }
    }, [currentVideoBlob]);

    // Clean up final video URL
    useEffect(() => {
        if (finalVideoUrl) {
            return () => URL.revokeObjectURL(finalVideoUrl);
        }
    }, [finalVideoUrl]);

    // Handle audio file selection
    const handleAudioFileSelect = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0];
        if (file && file.type.startsWith('audio/')) {
            setSelectedAudioFile(file);
        } else {
            alert('Please select a valid audio file');
        }
    };

    // Replace audio in video
    const handleAudioReplacement = async () => {
        if (!currentVideoBlob || !selectedAudioFile) return;

        setIsReplacingAudio(true);
        setProgressMessage('Replacing audio in video...');

        try {
            const result = await captionService.replaceAudio({
                videoFile: currentVideoBlob,
                audioFile: selectedAudioFile,
            });

            if (result.success && result.videoWithNewAudio) {
                setCurrentVideoBlob(result.videoWithNewAudio);
                setProgressMessage('Audio replaced successfully!');

                // Clear the selected audio file after successful replacement
                setSelectedAudioFile(null);
                if (audioInputRef.current) {
                    audioInputRef.current.value = '';
                }
            } else {
                throw new Error(result.error || 'Failed to replace audio');
            }
        } catch (error) {
            console.error('Audio replacement error:', error);
            const errorMessage =
                error instanceof Error ? error.message : 'Unknown error';
            alert(`Failed to replace audio: ${errorMessage}`);
            setProgressMessage('');
        } finally {
            setIsReplacingAudio(false);
        }
    };

    // Generate captioned video
    const handleCaptionGeneration = async () => {
        if (!currentVideoBlob) return;

        setIsGeneratingCaptions(true);
        setProgressMessage('Generating captions for video...');

        try {
            const request: CaptionGenerationRequest = {
                videoFile: currentVideoBlob,
                fontSize: captionSettings.fontSize,
                fontColor: getOptimalColorValue(captionSettings.fontColor),
                position: captionSettings.position,
            };

            const result = await captionService.generateCaptions(request);

            if (result.success && result.videoWithCaptions) {
                console.log('✅ Caption generation successful:', {
                    blobSize: result.videoWithCaptions.size,
                    blobType: result.videoWithCaptions.type,
                    isValidBlob: result.videoWithCaptions.size > 0,
                });

                setFinalVideoBlob(result.videoWithCaptions);
                const url = URL.createObjectURL(result.videoWithCaptions);
                setFinalVideoUrl(url);
                setProgressMessage('Captions generated successfully!');

                // Notify parent component about the captioned video
                if (onCaptionedVideoGenerated) {
                    onCaptionedVideoGenerated(result.videoWithCaptions);
                }
            } else {
                console.error('❌ Caption generation failed:', result.error);
                throw new Error(result.error || 'Failed to generate captions');
            }
        } catch (error) {
            console.error('Caption generation error:', error);
            const errorMessage =
                error instanceof Error ? error.message : 'Unknown error';
            alert(`Failed to generate captions: ${errorMessage}`);
            setProgressMessage('');
        } finally {
            setIsGeneratingCaptions(false);
        }
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
    const downloadVideo = (blob: Blob, filename: string) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // Reset to original video
    const resetToOriginal = () => {
        setCurrentVideoBlob(videoBlob);
        setFinalVideoBlob(null);
        setFinalVideoUrl('');
        setSelectedAudioFile(null);
        if (audioInputRef.current) {
            audioInputRef.current.value = '';
        }
        setProgressMessage('Reset to original video');
    };

    const displayVideoUrl = finalVideoUrl || videoUrl;
    const downloadableBlob = finalVideoBlob || currentVideoBlob;

    return (
        <div className='space-y-6'>
            <div className='text-center mb-4'>
                <h3 className='text-lg font-semibold'>Audio & Captions</h3>
                <p className='text-sm text-gray-500'>
                    Replace audio and add captions to your video
                </p>
            </div>

            {/* Video Preview */}
            {displayVideoUrl && (
                <Card>
                    <CardHeader>
                        <CardTitle className='flex items-center gap-2'>
                            <Video className='h-5 w-5' />
                            Video Preview
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className='aspect-video bg-gray-900 rounded-md overflow-hidden relative mb-4'>
                            <video
                                ref={videoRef}
                                src={displayVideoUrl}
                                className='w-full h-full object-contain'
                                onPlay={() => setIsPlaying(true)}
                                onPause={() => setIsPlaying(false)}
                                controls
                            />
                        </div>
                        <div className='flex gap-2 justify-center'>
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
                            {downloadableBlob && (
                                <Button
                                    variant='outline'
                                    onClick={() =>
                                        downloadVideo(
                                            downloadableBlob,
                                            finalVideoBlob
                                                ? 'final-video-with-captions.mp4'
                                                : 'video.mp4'
                                        )
                                    }
                                    className='gap-2'
                                >
                                    <Download className='h-4 w-4' />
                                    Download
                                </Button>
                            )}
                            {currentVideoBlob !== videoBlob && (
                                <Button
                                    variant='outline'
                                    onClick={resetToOriginal}
                                    className='gap-2'
                                >
                                    <RotateCcw className='h-4 w-4' />
                                    Reset
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Audio Replacement Section */}
            <Card>
                <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                        <AudioLines className='h-5 w-5' />
                        Replace Audio (Optional)
                    </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                    <div>
                        <Label htmlFor='audio-upload' className='mb-2 block'>
                            Upload New Audio File
                        </Label>
                        <div className='flex gap-2'>
                            <Input
                                ref={audioInputRef}
                                id='audio-upload'
                                type='file'
                                accept='audio/*'
                                onChange={handleAudioFileSelect}
                                className='flex-1'
                            />
                            <Button
                                onClick={handleAudioReplacement}
                                disabled={
                                    !selectedAudioFile ||
                                    isReplacingAudio ||
                                    !currentVideoBlob
                                }
                                className='gap-2'
                            >
                                {isReplacingAudio ? (
                                    <Loader2 className='h-4 w-4 animate-spin' />
                                ) : (
                                    <Upload className='h-4 w-4' />
                                )}
                                Replace
                            </Button>
                        </div>
                        {selectedAudioFile && (
                            <p className='text-sm text-gray-600 mt-1'>
                                Selected: {selectedAudioFile.name}
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Caption Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                        <Captions className='h-5 w-5' />
                        Caption Settings
                    </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                    <div className='flex items-center space-x-2'>
                        <Switch
                            id='enable-captions'
                            checked={enableCaptions}
                            onCheckedChange={setEnableCaptions}
                        />
                        <Label htmlFor='enable-captions'>
                            Add captions to video
                        </Label>
                    </div>

                    {enableCaptions && (
                        <div className='space-y-4 pl-6 border-l-2 border-gray-200'>
                            <div>
                                <Label className='mb-2 block'>
                                    Font Size: {captionSettings.fontSize}px
                                </Label>
                                <Slider
                                    value={[captionSettings.fontSize]}
                                    onValueChange={([value]) =>
                                        setCaptionSettings((prev) => ({
                                            ...prev,
                                            fontSize: value,
                                        }))
                                    }
                                    min={12}
                                    max={48}
                                    step={2}
                                />
                            </div>

                            <div className='grid grid-cols-1 gap-4'>
                                <div>
                                    <Label className='mb-2 block'>
                                        Font Color
                                    </Label>

                                    {/* Color Presets */}
                                    <div className='mb-3'>
                                        <Label className='text-xs text-gray-500 mb-2 block'>
                                            Quick Presets:
                                        </Label>
                                        <div className='flex flex-wrap gap-2'>
                                            {COLOR_PRESETS.map((preset) => (
                                                <Button
                                                    key={preset.value}
                                                    type='button'
                                                    variant={
                                                        captionSettings.fontColor ===
                                                            preset.value ||
                                                        captionSettings.fontColor ===
                                                            preset.hex
                                                            ? 'default'
                                                            : 'outline'
                                                    }
                                                    size='sm'
                                                    onClick={() =>
                                                        setCaptionSettings(
                                                            (prev) => ({
                                                                ...prev,
                                                                fontColor:
                                                                    preset.value,
                                                            })
                                                        )
                                                    }
                                                    className='gap-2'
                                                >
                                                    <div
                                                        className='w-3 h-3 rounded border'
                                                        style={{
                                                            backgroundColor:
                                                                preset.hex,
                                                        }}
                                                    />
                                                    {preset.name}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Custom Color Input */}
                                    <div>
                                        <Label className='text-xs text-gray-500 mb-2 block'>
                                            Custom Color:
                                        </Label>
                                        <div className='flex gap-2'>
                                            <Input
                                                type='color'
                                                value={
                                                    COLOR_PRESETS.find(
                                                        (p) =>
                                                            p.value ===
                                                            captionSettings.fontColor
                                                    )?.hex ||
                                                    captionSettings.fontColor.startsWith(
                                                        '#'
                                                    )
                                                        ? captionSettings.fontColor
                                                        : '#FFFFFF'
                                                }
                                                onChange={(e) =>
                                                    setCaptionSettings(
                                                        (prev) => ({
                                                            ...prev,
                                                            fontColor:
                                                                e.target.value,
                                                        })
                                                    )
                                                }
                                                className='w-12 h-8 p-1 border rounded'
                                            />
                                            <Input
                                                type='text'
                                                value={
                                                    captionSettings.fontColor
                                                }
                                                onChange={(e) =>
                                                    setCaptionSettings(
                                                        (prev) => ({
                                                            ...prev,
                                                            fontColor:
                                                                e.target.value,
                                                        })
                                                    )
                                                }
                                                placeholder='e.g., white or #FFFFFF'
                                                className='flex-1'
                                            />
                                        </div>
                                        <p className='text-xs text-gray-500 mt-1'>
                                            Sending to backend: "
                                            {getOptimalColorValue(
                                                captionSettings.fontColor
                                            )}
                                            "
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <Label className='mb-2 block'>
                                    Caption Position
                                </Label>
                                <Select
                                    value={captionSettings.position}
                                    onValueChange={(value: 'top' | 'bottom') =>
                                        setCaptionSettings((prev) => ({
                                            ...prev,
                                            position: value,
                                        }))
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value='top'>Top</SelectItem>
                                        <SelectItem value='bottom'>
                                            Bottom
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button
                                onClick={handleCaptionGeneration}
                                disabled={
                                    !currentVideoBlob ||
                                    isGeneratingCaptions ||
                                    serviceHealthy === false
                                }
                                className='w-full gap-2'
                            >
                                {isGeneratingCaptions ? (
                                    <Loader2 className='h-4 w-4 animate-spin' />
                                ) : (
                                    <Captions className='h-4 w-4' />
                                )}
                                {isGeneratingCaptions
                                    ? 'Generating Captions...'
                                    : serviceHealthy === false
                                      ? 'Caption Service Unavailable'
                                      : 'Generate Captions'}
                            </Button>

                            {serviceHealthy === false && (
                                <p className='text-xs text-red-600 mt-2'>
                                    Caption generator service is not responding.
                                    Please ensure it's running on the configured
                                    port.
                                </p>
                            )}

                            {serviceHealthy === null && (
                                <p className='text-xs text-gray-500 mt-2'>
                                    Checking caption service availability...
                                </p>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Progress Messages */}
            {progressMessage && (
                <Card className='border-blue-200 bg-blue-50'>
                    <CardContent className='pt-6'>
                        <p className='text-sm text-blue-800'>
                            {progressMessage}
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Finish Button */}
            <div className='flex justify-center'>
                <Button
                    onClick={onFinish}
                    size='lg'
                    className='px-8'
                    disabled={!currentVideoBlob}
                >
                    Continue to Final Review
                </Button>
            </div>
        </div>
    );
}
