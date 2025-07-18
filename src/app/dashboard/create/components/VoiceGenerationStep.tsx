'use client';

import Image from 'next/image';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Mic, Play, Download, RefreshCw } from 'lucide-react';
import type {
    VideoCreationState,
    ImageGenerationState,
    GeneratedSegment,
} from '@/types/video-creation';
import { useEffect, useState } from 'react';
import audioService, { AudioRequest } from '@/services/AudioService';

interface VoiceGenerationStepProps {
    imageState: ImageGenerationState;
    state: VideoCreationState;
    onUpdateState: (updates: Partial<VideoCreationState>) => void;
    onSegmentsChange?: (segments: GeneratedSegment[]) => void;
    initialSegments?: GeneratedSegment[]; // Add prop to receive existing segments
    previousStep?: number; // Add prop to track where user came from
}

export function VoiceGenerationStep({
    imageState,
    state,
    onUpdateState,
    onSegmentsChange,
    initialSegments,
    previousStep,
}: VoiceGenerationStepProps) {
    const [segments, setSegments] = useState<GeneratedSegment[]>(
        initialSegments || []
    );
    const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
    const [audioGenerationKey, setAudioGenerationKey] = useState(0);
    const [generatingSegmentId, setGeneratingSegmentId] = useState<
        number | null
    >(null);

    const handleLanguageChange = (value: string) => {
        onUpdateState({ language: value });
    };

    const handleVoiceTypeChange = (value: string) => {
        onUpdateState({ voiceType: value });
    };

    const handleEmotionChange = (value: string) => {
        onUpdateState({ emotion: value });
    };

    // Update script text for a specific segment
    const updateSegmentScript = (segmentId: number, newScript: string) => {
        setSegments((prevSegments) =>
            prevSegments.map((segment) =>
                segment.segmentId === segmentId
                    ? { ...segment, scriptText: newScript }
                    : segment
            )
        );
    };

    // Generate audio for all segments
    const generateAllAudio = async () => {
        if (
            !imageState.generatedImages ||
            imageState.generatedImages.length === 0
        )
            return;

        setIsGeneratingAudio(true);
        const newSegments: GeneratedSegment[] = [];

        try {
            // Increment key to force re-render
            setAudioGenerationKey((prev) => prev + 1);

            // Use existing segments or create new ones from images
            // If we have existing segments (from previous navigation), use them
            // Otherwise, create new ones from images
            const sourceSegments =
                segments.length > 0
                    ? segments
                    : imageState.generatedImages.map((image) => ({
                          segmentId: image.segmentId,
                          imageUrl: image.imageUrl,
                          scriptText: image.scriptText,
                          duration: Math.max(3, image.scriptText.length * 0.08),
                          audioUrl: undefined, // Explicitly set audioUrl for new segments
                      }));

            for (const segment of sourceSegments) {
                if (segment.scriptText) {
                    try {
                        const audioRequest: AudioRequest = {
                            text: segment.scriptText,
                            // language: state.language === 'vietnamese' ? 'vi-VN' : 'en-US',
                            language: 'en-US',
                            gender: state.voiceType || 'female',
                            emotion: state.emotion || 'neutral',
                        };

                        console.log(
                            `Generating audio for segment ${segment.segmentId}: ${segment.scriptText}`
                        );

                        const audioUrl =
                            await audioService.generateAudio(audioRequest);

                        // Get audio duration (approximate based on text length)
                        const duration = Math.max(
                            3,
                            segment.scriptText.length * 0.08
                        ); // ~80ms per character, minimum 3 seconds

                        newSegments.push({
                            segmentId: segment.segmentId,
                            imageUrl: segment.imageUrl,
                            scriptText: segment.scriptText,
                            audioUrl,
                            duration,
                        });
                    } catch (audioError) {
                        console.warn(
                            `Failed to generate audio for segment ${segment.segmentId}:`,
                            audioError
                        );
                        // Still add segment without audio, but preserve existing audioUrl if any
                        newSegments.push({
                            segmentId: segment.segmentId,
                            imageUrl: segment.imageUrl,
                            scriptText: segment.scriptText,
                            audioUrl: segment.audioUrl, // Preserve existing audio if generation fails
                            duration: Math.max(
                                3,
                                segment.scriptText.length * 0.08
                            ),
                        });
                    }
                }
            }

            // Always update segments with new audio URLs
            setSegments(newSegments);
            console.log('All audio generated:', newSegments);
        } catch (error) {
            console.error('Error generating audio:', error);
        } finally {
            setIsGeneratingAudio(false);
        }
    };

    // Generate audio for a single segment
    const generateSingleAudio = async (segmentId: number) => {
        const segment = segments.find((s) => s.segmentId === segmentId);
        if (!segment || !segment.scriptText) return;

        setGeneratingSegmentId(segmentId);

        try {
            const audioRequest: AudioRequest = {
                text: segment.scriptText,
                language: 'en-US',
                gender: state.voiceType || 'female',
                emotion: state.emotion || 'neutral',
            };

            console.log(
                `Generating audio for segment ${segmentId}: ${segment.scriptText}`
            );

            const audioUrl = await audioService.generateAudio(audioRequest);

            // Update only this segment with new audio
            setSegments((prevSegments) =>
                prevSegments.map((s) =>
                    s.segmentId === segmentId
                        ? {
                              ...s,
                              audioUrl,
                              duration: Math.max(3, s.scriptText.length * 0.08),
                          }
                        : s
                )
            );

            // Increment key to force re-render
            setAudioGenerationKey((prev) => prev + 1);

            console.log(`Audio generated for segment ${segmentId}`);
        } catch (error) {
            console.error(
                `Error generating audio for segment ${segmentId}:`,
                error
            );
        } finally {
            setGeneratingSegmentId(null);
        }
    };

    // Notify parent when segments change
    useEffect(() => {
        if (onSegmentsChange) {
            onSegmentsChange(segments);
        }
    }, [segments, onSegmentsChange]);

    // Sync with initial segments when prop changes (e.g., coming back from next step)
    useEffect(() => {
        // If coming from image generation step (step 5), clear audio and create fresh segments
        if (previousStep === 5) {
            console.log(
                'Coming from image generation step - clearing audio and creating fresh segments'
            );
            const freshSegments = imageState.generatedImages.map((image) => ({
                segmentId: image.segmentId,
                imageUrl: image.imageUrl,
                scriptText: image.scriptText,
                duration: Math.max(3, image.scriptText.length * 0.08),
                audioUrl: undefined, // Clear audio when coming from image generation
            }));
            setSegments(freshSegments);
        }
        // If coming from video generation step (step 7), preserve existing segments with audio
        else if (
            previousStep === 7 &&
            initialSegments &&
            initialSegments.length > 0
        ) {
            console.log(
                'Coming from video generation step - preserving existing segments with audio'
            );
            setSegments(initialSegments);
        }
        // First time entering or other cases, use initialSegments if available
        else if (
            initialSegments &&
            initialSegments.length > 0 &&
            segments.length === 0
        ) {
            console.log(
                'First time entering or other cases - using initial segments'
            );
            setSegments(initialSegments);
        }
    }, [previousStep, initialSegments, imageState.generatedImages]);

    return (
        <div className='space-y-6'>
            <div className='space-y-2'>
                <Label>Voice Type</Label>
                <RadioGroup
                    value={state.voiceType}
                    onValueChange={handleVoiceTypeChange}
                    className='flex gap-4'
                >
                    <div className='flex items-center space-x-2'>
                        <RadioGroupItem value='female' id='female' />
                        <Label htmlFor='female'>Female</Label>
                    </div>
                    <div className='flex items-center space-x-2'>
                        <RadioGroupItem value='male' id='male' />
                        <Label htmlFor='male'>Male</Label>
                    </div>
                </RadioGroup>
            </div>

            <div className='space-y-2'>
                <Label>Emotion</Label>
                <Select
                    value={state.emotion}
                    onValueChange={handleEmotionChange}
                >
                    <SelectTrigger>
                        <SelectValue placeholder='Select emotion' />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value='neutral'>Neutral</SelectItem>
                        <SelectItem value='cheerful'>Cheerful</SelectItem>
                        <SelectItem value='sad'>Sad</SelectItem>
                        <SelectItem value='angry'>Angry</SelectItem>
                        <SelectItem value='excited'>Excited</SelectItem>
                        <SelectItem value='formal'>Formal</SelectItem>
                        <SelectItem value='funny'>Funny</SelectItem>
                        <SelectItem value='calm'>Calm</SelectItem>
                        <SelectItem value='whisper'>Whisper</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Audio Generation Controls */}
            <div className='space-y-4'>
                <div className='flex gap-4 flex-wrap'>
                    <Button
                        onClick={generateAllAudio}
                        disabled={
                            isGeneratingAudio ||
                            generatingSegmentId !== null ||
                            !imageState.generatedImages?.length
                        }
                        className='gap-2'
                    >
                        <Mic className='h-4 w-4' />
                        {isGeneratingAudio
                            ? 'Generating Audio...'
                            : segments.length > 0 &&
                                segments.some((s) => s.audioUrl)
                              ? 'Regenerate All Audio'
                              : 'Generate All Audio'}
                    </Button>
                </div>

                {isGeneratingAudio && (
                    <div className='flex items-center gap-2'>
                        <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600'></div>
                        <span className='text-sm text-gray-600'>
                            Generating audio for all segments...
                        </span>
                    </div>
                )}
            </div>

            {/* Generated Segments - Show below the generate button */}
            {segments.length > 0 && (
                <div className='space-y-4'>
                    <Label>Generated Segments</Label>

                    {segments.map((segment, index) => (
                        <div
                            key={`${segment.segmentId}-${audioGenerationKey}`}
                            className='p-4 bg-gray-50 rounded-lg border'
                        >
                            <div className='flex items-start justify-between mb-3'>
                                <h4 className='font-medium'>
                                    Segment {segment.segmentId}
                                </h4>
                                <Button
                                    size='sm'
                                    variant='outline'
                                    onClick={() =>
                                        generateSingleAudio(segment.segmentId)
                                    }
                                    disabled={
                                        !segment.scriptText.trim() ||
                                        generatingSegmentId ===
                                            segment.segmentId ||
                                        isGeneratingAudio
                                    }
                                    className='gap-1'
                                >
                                    {generatingSegmentId ===
                                    segment.segmentId ? (
                                        <div className='animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600'></div>
                                    ) : (
                                        <RefreshCw className='h-3 w-3' />
                                    )}
                                    {generatingSegmentId === segment.segmentId
                                        ? 'Generating...'
                                        : 'Generate Audio'}
                                </Button>
                            </div>

                            <div className='flex items-start gap-4'>
                                <div className='w-80 aspect-video relative rounded overflow-hidden flex-shrink-0'>
                                    <Image
                                        src={segment.imageUrl}
                                        alt={`Segment ${segment.segmentId}`}
                                        fill
                                        className='object-cover'
                                    />
                                </div>
                                <div className='flex-1'>
                                    {/* Editable script text */}
                                    <div className='mb-3'>
                                        <Label className='text-xs text-gray-500'>
                                            Script Text:
                                        </Label>
                                        <Textarea
                                            value={segment.scriptText}
                                            onChange={(e) =>
                                                updateSegmentScript(
                                                    segment.segmentId,
                                                    e.target.value
                                                )
                                            }
                                            className='mt-1 text-sm resize-none'
                                            rows={2}
                                            placeholder='Enter script text...'
                                        />
                                    </div>

                                    {/* Audio player */}
                                    <div className='space-y-2'>
                                        {segment.audioUrl && (
                                            <audio
                                                key={segment.audioUrl}
                                                controls
                                                className='w-full'
                                            >
                                                <source
                                                    src={segment.audioUrl}
                                                    type='audio/mp3'
                                                />
                                            </audio>
                                        )}

                                        {!segment.audioUrl &&
                                            generatingSegmentId !==
                                                segment.segmentId && (
                                                <p className='text-xs text-gray-400 italic'>
                                                    No audio generated
                                                </p>
                                            )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
