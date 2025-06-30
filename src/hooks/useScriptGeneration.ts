'use client';

import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { geminiService } from '@/services/GeminiService';
import type {
    ScriptGenerationState,
    VideoOutlineResponse,
} from '@/types/video-creation';

export interface ScriptGeneration {
    videoOutline: VideoOutlineResponse | null;
    isGeneratingOutline: boolean;
    generateScript: (
        topic: string,
        audience?: string,
        goal?: string,
        duration?: number
    ) => Promise<VideoOutlineResponse>;
    regenerateScript: (
        topic: string,
        audience: string,
        goal: string,
        duration?: number
    ) => Promise<void>;
    updateScriptItem: (id: number, newText: string) => void;
}

export function useScriptGeneration(): ScriptGeneration {
    const { toast } = useToast();

    const [state, setState] = useState<ScriptGenerationState>({
        videoOutline: null,
        isGeneratingOutline: false,
    });

    const generateScript = async (
        topic: string,
        audience: string = 'general audience',
        goal: string = 'inform and engage',
        duration: number = 60
    ) => {
        setState((prev) => ({ ...prev, isGeneratingOutline: true }));

        try {
            toast({
                title: 'Generating video script with Gemini AI',
                description: `Creating script for "${topic}"...`,
            });

            console.log('Generating video script for topic:', topic);

            const outline = await geminiService.generateScript(topic, audience, goal, duration);

            setState((prev) => ({ ...prev, videoOutline: outline }));

            toast({
                title: 'Video outline generated successfully!',
                description: `Created ${outline.scriptSegments.length} script segments with AI.`,
            });

            return outline;
        } catch (error) {
            console.error('Error generating video outline:', error);
            toast({
                title: 'Outline generation failed',
                description:
                    error instanceof Error
                        ? error.message
                        : 'Please try again later.',
                variant: 'destructive',
            });
            throw error;
        } finally {
            setState((prev) => ({ ...prev, isGeneratingOutline: false }));
        }
    };

    const regenerateScript = async (
        topic: string,
        audience: string,
        goal: string,
        duration: number = 60
    ) => {
        if (!topic) {
            toast({
                title: 'Missing information',
                description: 'Please provide a topic or title first.',
                variant: 'destructive',
            });
            return;
        }

        setState((prev) => ({ ...prev, isGeneratingOutline: true }));

        try {
            const scriptSections = await geminiService.generateScript(
                topic,
                audience || 'general public',
                goal,
                duration
            );

            setState((prev) => {
                if (!prev.videoOutline) return prev;
                return {
                    ...prev,
                    videoOutline: {
                        ...prev.videoOutline,
                        scriptSegments: scriptSections.scriptSegments,
                        estimatedDuration: scriptSections.estimatedDuration,
                        keywords: scriptSections.keywords,
                    },
                };
            });

            toast({
                title: 'Script regenerated!',
                description: 'New script content has been generated with AI.',
            });
        } catch (error) {
            console.error('Error regenerating script:', error);
            toast({
                title: 'Regeneration failed',
                description: 'Please try again later.',
                variant: 'destructive',
            });
        } finally {
            setState((prev) => ({ ...prev, isGeneratingOutline: false }));
        }
    };

    const updateScriptItem = (id: number, newText: string) => {
        setState((prev) => {
            if (!prev.videoOutline) return prev;
            return {
                ...prev,
                videoOutline: {
                    ...prev.videoOutline,
                    scriptSegments: prev.videoOutline.scriptSegments.map(
                        (segment) =>
                            segment.id === id
                                ? { ...segment, text: newText }
                                : segment
                    ),
                },
            };
        });
    };

    return {
        ...state,
        generateScript,
        regenerateScript,
        updateScriptItem,
    };
}
