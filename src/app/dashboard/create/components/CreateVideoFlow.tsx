'use client';

import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import Link from 'next/link';

import { useVideoCreation } from '@/hooks/useVideoCreation';
import { useScriptGeneration } from '@/hooks/useScriptGeneration';
import { useImageGeneration } from '@/hooks/useImageGeneration';

// Import step components
import { BasicInformationStep } from './BasicInformationStep';
import { AudienceGoalsStep } from './AudienceGoalsStep';
import { ContentScriptStep } from './ContentScriptStep';
import { VideoStyleStep } from './VideoStyleStep';
import { ImageGenerationSection } from '@/components/video-creation/ImageGenerationSection';
import { VoiceGenerationStep } from './VoiceGenerationStep';
import { VideoGenerationStep } from './VideoGenerationStep';
import { CaptionedVideoStep } from './CaptionedVideoStep';
import { PreviewFinalizeStep } from './PreviewFinalizeStep';
import type { GeneratedSegment } from '@/types/video-creation';

export function CreateVideoFlow() {
    const videoCreation = useVideoCreation();
    const scriptGeneration = useScriptGeneration();
    const imageGeneration = useImageGeneration();

    // Segments state for passing between steps 6 and 7
    const [segments, setSegments] = useState<GeneratedSegment[]>([]);

    // Video generation status for step 7 validation
    const [hasGeneratedVideo, setHasGeneratedVideo] = useState(false);

    // Generated video blob for passing between steps 7 and 8
    const [generatedVideoBlob, setGeneratedVideoBlob] = useState<Blob | null>(
        null
    );

    // Final captioned video blob from step 8 for step 9 preview
    const [finalCaptionedVideoBlob, setFinalCaptionedVideoBlob] =
        useState<Blob | null>(null);

    // Track previous step to handle audio clearing logic
    const previousStepRef = useRef<number>(0);

    // Destructure state for easier access
    const {
        currentStep,
        videoDescription,
        selectedTopic,
        targetAudience,
        videoGoal,
        videoStyle,
        language,
        isGenerating,
        updateState,
        handleNextStep,
        handlePrevStep,
        handleFinishVideo,
        getVideoContext,
    } = videoCreation;

    // Auto-generate images when script is ready
    useEffect(() => {
        if (
            currentStep === 5 &&
            scriptGeneration.videoOutline &&
            !imageGeneration.isGeneratingImages
        ) {
            // Auto-generate images when reaching the visual content step
        }
    }, [
        currentStep,
        scriptGeneration.videoOutline,
        imageGeneration.isGeneratingImages,
    ]);

    // Reset video generation status when navigating away from step 7
    useEffect(() => {
        if (currentStep !== 7) {
            setHasGeneratedVideo(false);
        }
        // Reset video blob when navigating away from steps 7 and 8
        if (currentStep < 7) {
            setGeneratedVideoBlob(null);
        }
    }, [currentStep]);

    // Track step changes to know where user came from
    const prevStep = previousStepRef.current;
    useEffect(() => {
        previousStepRef.current = currentStep;
    });

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <BasicInformationStep
                        state={videoCreation}
                        onUpdateState={updateState}
                    />
                );

            case 2:
                return (
                    <AudienceGoalsStep
                        state={videoCreation}
                        onUpdateState={updateState}
                        onGenerateOutline={async () => {
                            if (!selectedTopic && !videoDescription) {
                                return;
                            }
                            if (!targetAudience || !videoGoal) {
                                return;
                            }

                            updateState({ isGenerating: true });

                            try {
                                const outline =
                                    await scriptGeneration.generateScript(
                                        selectedTopic || videoDescription,
                                        targetAudience,
                                        videoGoal,
                                        60
                                    );

                                if (outline) {
                                    updateState({
                                        generatedSummary:
                                            outline.contentSummary,
                                    });
                                    handleNextStep();
                                }
                            } catch (error) {
                                console.error(
                                    'Failed to generate outline:',
                                    error
                                );
                            } finally {
                                updateState({ isGenerating: false });
                            }
                        }}
                    />
                );

            case 3:
                return (
                    <ContentScriptStep
                        state={videoCreation}
                        onUpdateState={updateState}
                        scriptGeneration={scriptGeneration}
                        onNextStep={handleNextStep}
                    />
                );

            case 4:
                return (
                    <VideoStyleStep
                        state={videoCreation}
                        onUpdateState={updateState}
                        onGenerateImages={async () => {
                            if (!videoStyle || !scriptGeneration.videoOutline) {
                                return;
                            }

                            updateState({ isGenerating: true });

                            try {
                                await imageGeneration.generateImagesForScript(
                                    scriptGeneration.videoOutline,
                                    getVideoContext()
                                );
                                handleNextStep();
                            } catch (error) {
                                console.error(
                                    'Failed to generate images:',
                                    error
                                );
                            } finally {
                                updateState({ isGenerating: false });
                            }
                        }}
                    />
                );

            case 5:
                return (
                    <ImageGenerationSection
                        imageState={imageGeneration}
                        onRegenerateImage={(segmentId, customScriptText) => {
                            if (scriptGeneration.videoOutline) {
                                imageGeneration.regenerateIndividualImage(
                                    segmentId,
                                    scriptGeneration.videoOutline,
                                    getVideoContext(),
                                    customScriptText
                                );
                            }
                        }}
                        onUploadImage={imageGeneration.handleImageUpload}
                        onDebugImages={() => {
                            imageGeneration.generatedImages.forEach((img) => {
                                console.log(
                                    `Image for segment ${img.segmentId}:`,
                                    img
                                );
                            });
                        }}
                    />
                );

            case 6:
                return (
                    <VoiceGenerationStep
                        imageState={imageGeneration}
                        state={videoCreation}
                        onUpdateState={updateState}
                        onSegmentsChange={setSegments}
                        initialSegments={segments}
                        previousStep={prevStep}
                    />
                );

            case 7:
                return (
                    <VideoGenerationStep
                        onFinish={(videoBlob) => {
                            setGeneratedVideoBlob(videoBlob || null);
                            handleNextStep();
                        }}
                        segments={segments}
                        onVideoGenerated={(hasVideo, videoBlob) => {
                            setHasGeneratedVideo(hasVideo);
                            setGeneratedVideoBlob(videoBlob || null);
                        }}
                    />
                );

            case 8:
                return (
                    <CaptionedVideoStep
                        videoBlob={generatedVideoBlob}
                        onFinish={handleNextStep}
                        onCaptionedVideoGenerated={setFinalCaptionedVideoBlob}
                    />
                );

            case 9:
                return (
                    <PreviewFinalizeStep
                        state={videoCreation}
                        onUpdateState={updateState}
                        onFinish={handleFinishVideo}
                        finalVideoBlob={
                            finalCaptionedVideoBlob || generatedVideoBlob
                        }
                    />
                );

            default:
                return null;
        }
    };

    const getStepTitle = () => {
        switch (currentStep) {
            case 1:
                return 'Basic Information';
            case 2:
                return 'Audience & Goals';
            case 3:
                return 'Content & Script';
            case 4:
                return 'Video Style';
            case 5:
                return 'Visual Content';
            case 6:
                return 'Voice & Captions';
            case 7:
                return 'Video Generation';
            case 8:
                return 'Audio & Captions';
            case 9:
                return 'Preview & Finalize';
            default:
                return 'Create Video';
        }
    };

    const getStepDescription = () => {
        switch (currentStep) {
            case 1:
                return 'Enter your video description and choose a topic';
            case 2:
                return 'Define your target audience and video goals';
            case 3:
                return 'Review and edit the AI-generated content';
            case 4:
                return 'Choose the visual style for your video';
            case 5:
                return 'Select images and video clips';
            case 6:
                return 'Configure voice and caption settings';
            case 7:
                return 'Generate your final video from segments';
            case 8:
                return 'Replace audio and add captions to your video';
            case 9:
                return 'Preview your video and make final adjustments';
            default:
                return 'Follow the steps to create your AI-powered short video';
        }
    };

    const isStepValid = () => {
        switch (currentStep) {
            case 1:
                return !!(videoDescription || selectedTopic);
            case 2:
                return (
                    !!(targetAudience && videoGoal) &&
                    !!scriptGeneration.videoOutline
                );
            case 3:
                return !!scriptGeneration.videoOutline;
            case 4:
                return !!videoStyle && !!imageGeneration.generatedImages.length;
            case 5:
                return true; // Image generation is optional
            case 6:
                // Require at least one segment with audio to proceed
                return (
                    !!language &&
                    segments.length > 0 &&
                    segments.some((s) => s.audioUrl)
                );
            case 7:
                // Require video to be generated to proceed
                return hasGeneratedVideo;
            case 8:
                // Audio and captions step - can proceed without changes
                return true;
            case 9:
                return true; // Final step
            default:
                return true;
        }
    };

    const isLoading =
        isGenerating ||
        scriptGeneration.isGeneratingOutline ||
        imageGeneration.isGeneratingImages;

    return (
        <div className='min-h-screen bg-gray-50'>
            <div className='container mx-auto p-6'>
                <div className='mb-6'>
                    <Link
                        href='/dashboard'
                        className='flex items-center gap-2 text-gray-600 hover:text-purple-600 mb-4 transition-colors'
                    >
                        <ArrowLeft className='h-4 w-4' />
                        <span>Back to Dashboard</span>
                    </Link>
                    <h1 className='text-3xl font-bold'>Create New Video</h1>
                    <p className='text-gray-600'>
                        Follow the steps to create your AI-powered short video
                    </p>
                </div>

                <div className='max-w-4xl mx-auto'>
                    {/* Progress indicator */}
                    <div className='mb-8'>
                        <div className='flex items-center justify-between mb-2'>
                            <span className='text-sm text-gray-600'>
                                Step {currentStep} of 9
                            </span>
                            <span className='text-sm text-gray-600'>
                                {Math.round((currentStep / 9) * 100)}% Complete
                            </span>
                        </div>
                        <div className='w-full bg-gray-200 rounded-full h-2'>
                            <div
                                className='bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all duration-500'
                                style={{ width: `${(currentStep / 9) * 100}%` }}
                            ></div>
                        </div>
                    </div>

                    <Card className='shadow-lg border-0'>
                        <CardHeader className='bg-gradient-to-r from-purple-50 to-blue-50'>
                            <CardTitle className='text-xl'>
                                {getStepTitle()}
                            </CardTitle>
                            <CardDescription className='text-gray-600'>
                                {getStepDescription()}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className='p-6'>
                            {renderStepContent()}
                        </CardContent>
                        <CardFooter className='flex justify-between bg-gray-50 px-6 py-4'>
                            <Button
                                variant='outline'
                                onClick={handlePrevStep}
                                disabled={currentStep === 1}
                                className='gap-2'
                            >
                                <ArrowLeft className='h-4 w-4' />
                                Previous
                            </Button>
                            <Button
                                onClick={() => {
                                    if (currentStep === 9) {
                                        handleFinishVideo();
                                    } else {
                                        handleNextStep();
                                    }
                                }}
                                disabled={!isStepValid() || isLoading}
                                className='gap-2'
                            >
                                {currentStep === 9 ? 'Exit without saving' : 'Next'}
                                <ArrowRight className='h-4 w-4' />
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
}
