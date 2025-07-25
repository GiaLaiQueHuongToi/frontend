'use client';

import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { geminiService } from '@/services/GeminiService';
import type {
    ImageGenerationState,
    VideoOutlineResponse,
} from '@/types/video-creation';

export const DELAY_INCREMENT = 5000; // 5 seconds delay for staggered loading

export function useImageGeneration() {
    const { toast } = useToast();

    const [state, setState] = useState<ImageGenerationState>({
        generatedImages: [],
        isGeneratingImages: false,
        hasAutoGeneratedImages: false,
        imageGenerationKey: 0,
    });

    const generateImagesForScript = async (
        videoOutline: VideoOutlineResponse,
        videoContext: {
            topic: string;
            style: string;
            targetAudience: string;
        }
    ) => {
        if (!videoOutline || !videoOutline.scriptSegments.length) {
            toast({
                title: 'Missing script',
                description: 'Please generate script content first.',
                variant: 'destructive',
            });
            return;
        }

        if (state.isGeneratingImages) {
            console.log('Already generating images, skipping...');
            return;
        }

        setState((prev) => ({ ...prev, isGeneratingImages: true }));

        try {
            toast({
                title: 'Generating images with Gemini AI',
                description:
                    'Creating visual content for each script segment...',
            });

            console.log(
                'Starting image generation with context:',
                videoContext
            );
            console.log('Script segments:', videoOutline.scriptSegments.length);

            const imageResults = await geminiService.generateImagesForScript(
                videoOutline.scriptSegments,
                videoContext
            );

            console.log('Image generation completed:', imageResults);

            const generatedImages = imageResults.map((img, index) => ({
                ...img,
                key: `${Date.now()}-${img.segmentId}`, // Unique key for re-rendering
                delay: index * DELAY_INCREMENT, // Staggered loading delay
            }));

            setState((prev) => ({
                ...prev,
                generatedImages,
                hasAutoGeneratedImages: true,
                imageGenerationKey: prev.imageGenerationKey + 1,
            }));

            // Verify all images have URLs
            const missingImages = generatedImages.filter(
                (img) => !img.imageUrl
            );
            if (missingImages.length > 0) {
                console.warn('Some images missing URLs:', missingImages);
            }

            toast({
                title: 'Images generated successfully!',
                description: `Created ${imageResults.length} image descriptions for your video segments.`,
            });
        } catch (error) {
            console.error('Error generating images:', error);
            toast({
                title: 'Image generation failed',
                description:
                    error instanceof Error
                        ? error.message
                        : 'Please try again later.',
                variant: 'destructive',
            });
        } finally {
            setState((prev) => ({ ...prev, isGeneratingImages: false }));
        }
    };

    const regenerateIndividualImage = async (
        segmentId: number,
        videoOutline: VideoOutlineResponse,
        videoContext: {
            topic: string;
            style: string;
            targetAudience: string;
        },
        customScriptText?: string
    ) => {
        if (!videoOutline) return;

        const segment = videoOutline.scriptSegments.find(
            (s) => s.id === segmentId
        );
        if (!segment) return;

        try {
            toast({
                title: 'Regenerating image',
                description: `Creating new image for segment ${segmentId}...`,
            });

            // Create a modified segment with custom script text if provided
            const modifiedSegment = customScriptText
                ? { ...segment, text: customScriptText }
                : segment;

            const { imageUrl, imagePrompt } = await geminiService.generateImage(
                modifiedSegment,
                videoContext
            );

            // Update only this specific image, including the script text if it was customized
            setState((prev) => ({
                ...prev,
                generatedImages: prev.generatedImages.map((img) =>
                    img.segmentId === segmentId
                        ? {
                            ...img,
                            imageUrl,
                            imagePrompt,
                            scriptText: customScriptText || img.scriptText, // Update script text if provided
                            width: 1920,
                            height: 1080,
                            key: `${Date.now()}-${segmentId}`, // Unique key for re-rendering
                            delay: 0, // Reset delay for new image
                        }
                        : img
                ),
            }));

            toast({
                title: 'Image regenerated!',
                description: `New image created for segment ${segmentId}.`,
            });
        } catch (error) {
            console.error('Error regenerating individual image:', error);
            toast({
                title: 'Regeneration failed',
                description: 'Please try again later.',
                variant: 'destructive',
            });
        }
    };

    const handleImageUpload = (segmentId: number, file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const result = e.target?.result as string;

            // Update the image with uploaded file
            setState((prev) => ({
                ...prev,
                generatedImages: prev.generatedImages.map((img) =>
                    img.segmentId === segmentId
                        ? {
                            ...img,
                            imageUrl: result,
                            imagePrompt: 'User uploaded image',
                            width: 1920,
                            height: 1080,
                            key: `${Date.now()}-${segmentId}`,
                            delay: 0, // Reset delay for uploaded image
                        }
                        : img
                ),
            }));

            toast({
                title: 'Image uploaded!',
                description: `Custom image set for segment ${segmentId}.`,
            });
        };
        reader.readAsDataURL(file);
    };

    return {
        ...state,
        generateImagesForScript,
        regenerateIndividualImage,
        handleImageUpload,
    };
}
