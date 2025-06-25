'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RefreshCw, Upload } from 'lucide-react';
import { ImageWithFallback } from '@/components/ui/image-with-fallback';
import type { ImageGenerationResult } from '@/types/video-creation';

interface ImageCardProps {
    image: ImageGenerationResult;
    onRegenerate: (segmentId: number, customScriptText?: string) => void;
    onUpload: (segmentId: number, file: File) => void;
}

export function ImageCard({ image, onRegenerate, onUpload }: ImageCardProps) {
    const [editedScriptText, setEditedScriptText] = useState(image.scriptText);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize textarea based on content
    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${Math.max(60, textarea.scrollHeight)}px`;
        }
    }, [editedScriptText]);

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setEditedScriptText(e.target.value);
    };

    const handleUploadClick = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                onUpload(image.segmentId, file);
            }
        };
        input.click();
    };

    const handleRegenerateClick = () => {
        onRegenerate(image.segmentId, editedScriptText);
    };

    const getImageType = (url: string) => {
        if (url.includes('pollinations')) return 'AI';
        if (url.includes('picsum')) return 'Stock';
        if (url.includes('placeholder')) return 'Placeholder';
        return 'Unknown';
    };

    return (
        <div className='border rounded-lg bg-white shadow-sm overflow-hidden'>
            <div className='aspect-video relative bg-gray-100'>
                <ImageWithFallback
                    src={image.imageUrl}
                    alt={`Segment ${image.segmentId}: ${image.scriptText}`}
                    segmentId={image.segmentId}
                    loadDelay={image.delay} // 5 second delay between each image
                />
                <div className='absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-medium'>
                    #{image.segmentId}
                </div>
                <div className='absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs'>
                    {getImageType(image.imageUrl)}
                </div>
            </div>

            <div className='p-3 space-y-2'>
                <div className='space-y-2'>
                    <div className='text-sm font-medium text-gray-600 mb-1'>
                        Script Text:
                    </div>
                    <Textarea
                        ref={textareaRef}
                        value={editedScriptText}
                        onChange={handleTextChange}
                        placeholder="Enter script text..."
                        className='text-sm resize-none min-h-[60px] overflow-hidden'
                        rows={1}
                    />
                </div>

                <div className='text-xs text-gray-500 bg-gray-50 p-2 rounded'>
                    <strong>Prompt:</strong> {image.imagePrompt}
                </div>

                <div className='text-xs text-gray-400 space-y-1'>
                    <div>
                        {image.width} × {image.height}px
                    </div>
                    <div
                        className='font-mono text-xs bg-gray-100 p-1 rounded truncate'
                        title={image.imageUrl}
                    >
                        {image.imageUrl.length > 50
                            ? image.imageUrl.substring(0, 50) + '...'
                            : image.imageUrl}
                    </div>
                </div>

                <div className='flex gap-2 pt-2'>
                    <Button
                        size='sm'
                        variant='outline'
                        onClick={handleRegenerateClick}
                        className='flex-1 text-xs'
                    >
                        <RefreshCw className='w-3 h-3 mr-1' />
                        Regenerate
                    </Button>
                    <Button
                        size='sm'
                        variant='outline'
                        onClick={handleUploadClick}
                        className='flex-1 text-xs'
                    >
                        <Upload className='w-3 h-3 mr-1' />
                        Upload
                    </Button>
                </div>
            </div>
        </div>
    );
}
