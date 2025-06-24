'use client';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ImageCard } from './ImageCard';
import type { ImageGenerationState } from '@/types/video-creation';
import { DELAY_INCREMENT } from '@/hooks/useImageGeneration';
import { useEffect } from 'react';

interface ImageGenerationSectionProps {
    imageState: ImageGenerationState;
    onRegenerateImage: (segmentId: number) => void;
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
                        <div className='flex gap-2'>
                            <Button
                                size='sm'
                                variant='outline'
                                onClick={onDebugImages}
                            >
                                Debug Images
                            </Button>
                        </div>
                    </div>

                    <div className='text-xs text-gray-600 bg-blue-50 p-2 rounded'>
                        💡 AI images load with {DELAY_INCREMENT / 1000}-second
                        delays to avoid rate limits. Each image will appear
                        progressively.
                    </div>

                    <ScrollArea className='h-80 border rounded-lg p-4'>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                            {imageState.generatedImages.map((image) => (
                                <ImageCard
                                    key={`${image.key}`}
                                    image={image}
                                    onRegenerate={onRegenerateImage}
                                    onUpload={onUploadImage}
                                />
                            ))}
                        </div>
                    </ScrollArea>
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
