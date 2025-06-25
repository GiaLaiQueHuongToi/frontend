'use client';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ImageCard } from './ImageCard';
import type { ImageGenerationState } from '@/types/video-creation';
import { DELAY_INCREMENT } from '@/hooks/useImageGeneration';
import { useEffect } from 'react';

interface ImageGenerationSectionProps {
    imageState: ImageGenerationState;
    onRegenerateImage: (segmentId: number, customScriptText?: string) => void;
    onUploadImage: (segmentId: number, file: File) => void;
    onDebugImages: () => void;
}

export function ImageGenerationSection({
    imageState,
    onRegenerateImage,
    onUploadImage,
    onDebugImages,
}: ImageGenerationSectionProps) {
    if (
        imageState.generatedImages.length === 0 &&
        !imageState.isGeneratingImages
    ) {
        return null;
    }

    useEffect(() => {
        if (imageState.generatedImages.length > 0) {
            const timer = setTimeout(() => {
                // Set delay to 0 for all images after initial staggered loading
                imageState.generatedImages.forEach((image) => {
                    image.delay = 0;
                });
            }, DELAY_INCREMENT * imageState.generatedImages.length);

            return () => clearTimeout(timer);
        }
    }, []);

    return (
        <div className='space-y-4'>
            {imageState.generatedImages.length > 0 && (
                <div className='space-y-3'>
                    <div className='flex items-center justify-between'>
                        <h4 className='font-medium flex items-center gap-2'>
                            <div className='w-2 h-2 bg-purple-500 rounded-full'></div>
                            Generated Images (
                            {imageState.generatedImages.length})
                        </h4>
                    </div>

                    <div className='space-y-4'>
                        {imageState.generatedImages.map((image) => (
                            <div key={`${image.key}`} className='w-full border rounded-lg'>
                                <ImageCard
                                    image={image}
                                    onRegenerate={onRegenerateImage}
                                    onUpload={onUploadImage}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {imageState.isGeneratingImages && (
                <div className='flex items-center justify-center p-8 border rounded-lg bg-purple-50'>
                    <div className='text-center space-y-2'>
                        <div className='animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto'></div>
                        <p className='text-sm text-purple-600'>
                            Gemini AI is generating visual content for your
                            script segments...
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
