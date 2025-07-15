'use client';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import type { VideoCreationState } from '@/types/video-creation';
import { Wand2 } from 'lucide-react';
import Image from 'next/image';

interface VideoStyleStepProps {
    state: VideoCreationState;
    onUpdateState: (updates: Partial<VideoCreationState>) => void;
    onGenerateImages: () => Promise<void>;
}

const styleOptions = [
    {
        id: 'minimalist',
        name: 'Minimalist',
        desc: 'Clean design with simple visuals',
        color: 'bg-gray-100',
        css: 'absolute bottom-2 left-2 w-8 h-1 bg-gray-400 rounded',
        image: '/minimalist.jpg',
    },
    {
        id: 'dynamic',
        name: 'Dynamic',
        desc: 'Energetic with motion graphics',
        color: 'bg-purple-100',
        css: 'absolute top-2 right-2 w-4 h-4 bg-purple-400 rounded-full animate-pulse',
        image: '/dynamic.jpg',
    },
    {
        id: 'educational',
        name: 'Educational',
        desc: 'Focus on clarity and information',
        color: 'bg-blue-100',
        css: 'absolute bottom-2 left-2 text-xs bg-blue-200 px-2 py-1 rounded',
        image: '/educational.jpg',
    },
    {
        id: 'storytelling',
        name: 'Storytelling',
        desc: 'Narrative-focused with emotional appeal',
        color: 'bg-green-100',
        css: 'absolute bottom-2 right-2 w-6 h-1 bg-green-400 rounded',
        image: '/storytelling.jpg',
    },
];

export function VideoStyleStep({
    state,
    onUpdateState,
    onGenerateImages,
}: VideoStyleStepProps) {
    const handleStyleChange = (styleId: string) => {
        onUpdateState({ videoStyle: styleId });
    };

    const isDisabled = !state.videoStyle;
    const isLoading = state.isGenerating;

    return (
        <div className='space-y-6'>
            <div className='space-y-2'>
                <Label>Video Style</Label>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                    {styleOptions.map((style) => (
                        <div
                            key={style.id}
                            className={`p-4 border rounded-md cursor-pointer transition-colors ${
                                state.videoStyle === style.id
                                    ? 'border-purple-500 bg-purple-50'
                                    : 'hover:border-gray-400'
                            }`}
                            onClick={() => handleStyleChange(style.id)}
                        >
                            <div className='flex flex-col items-center gap-2 text-center'>
                                <div
                                    className={`w-full aspect-video ${style.color} flex items-center justify-center rounded-md relative overflow-hidden`}
                                >
                                    <Image
                                        src={style.image}
                                        alt={style.name}
                                        layout='fill'
                                        objectFit='cover'
                                    />
                                    <div className={style.css}></div>
                                </div>
                                <span className='font-medium'>
                                    {style.name}
                                </span>
                                <span className='text-xs text-gray-500'>
                                    {style.desc}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <Button
                className={`w-full gap-2 ${
                    isDisabled || isLoading
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
                onClick={onGenerateImages}
                disabled={isDisabled || isLoading}
            >
                <Wand2 className='h-4 w-4' />
                {isLoading ? 'Generating with Gemini AI...' : 'Generate Images'}
            </Button>
        </div>
    );
}
