'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import type { VideoCreationState } from '@/types/video-creation';

export function useVideoCreation() {
    const router = useRouter();
    const { toast } = useToast();

    const [state, setState] = useState<VideoCreationState>({
        currentStep: 1,
        videoDescription: '',
        searchQuery: '',
        topicSource: 'trending',
        selectedTopic: '',
        targetAudience: '',
        videoGoal: '',
        generatedSummary: '',
        videoStyle: '',
        language: 'vietnamese',
        voiceType: 'female',
        emotion: 'neutral',
        captionStyle: 'modern',
        isGenerating: false,
        isPreviewReady: false,
        previewUrl: '/placeholder.svg',
    });

    const updateState = (updates: Partial<VideoCreationState>) => {
        setState((prev) => ({ ...prev, ...updates }));
    };

    const handleNextStep = () => {
        setState((prev) => ({ ...prev, currentStep: prev.currentStep + 1 }));
    };

    const handlePrevStep = () => {
        setState((prev) => ({ ...prev, currentStep: prev.currentStep - 1 }));
    };

    const handleFinishVideo = (videoId?: number) => {
        // If a video ID is provided, redirect to the video detail page
        if (videoId) {
            router.push(`/dashboard/video/${videoId}`);
        } else {
            // Fallback to dashboard if no video ID
            router.push('/dashboard');
        }
    };

    const getVideoContext = () => ({
        topic: state.selectedTopic || state.videoDescription || 'Video content',
        style: state.videoStyle || 'modern',
        targetAudience: state.targetAudience || 'general audience',
    });

    return {
        ...state,
        updateState,
        handleNextStep,
        handlePrevStep,
        handleFinishVideo,
        getVideoContext,
    };
}
