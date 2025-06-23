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
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Mic, Play } from 'lucide-react';
import type { VideoCreationState } from '@/types/video-creation';

interface VoiceCaptionsStepProps {
    state: VideoCreationState;
    onUpdateState: (updates: Partial<VideoCreationState>) => void;
}

export function VoiceCaptionsStep({
    state,
    onUpdateState,
}: VoiceCaptionsStepProps) {
    const handleLanguageChange = (value: string) => {
        onUpdateState({ language: value });
    };

    const handleVoiceTypeChange = (value: string) => {
        onUpdateState({ voiceType: value });
    };

    const handleCaptionStyleChange = (value: string) => {
        onUpdateState({ captionStyle: value });
    };

    return (
        <div className='space-y-6'>
            <div className='space-y-2'>
                <Label>Language</Label>
                <div className='flex gap-4'>
                    <RadioGroup
                        value={state.language}
                        onValueChange={handleLanguageChange}
                        className='flex gap-4'
                    >
                        <div className='flex items-center space-x-2'>
                            <RadioGroupItem
                                value='vietnamese'
                                id='vietnamese'
                            />
                            <Label htmlFor='vietnamese'>Vietnamese</Label>
                        </div>
                        <div className='flex items-center space-x-2'>
                            <RadioGroupItem value='english' id='english' />
                            <Label htmlFor='english'>English</Label>
                        </div>
                    </RadioGroup>
                </div>
            </div>

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

                {state.voiceType && (
                    <div className='mt-3 p-3 bg-purple-50 rounded-lg'>
                        <h4 className='font-medium mb-2'>Voice Preview</h4>
                        <div className='flex items-center gap-3'>
                            <div className='w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center'>
                                {state.voiceType === 'female' ? '👩' : '👨'}
                            </div>
                            <div className='flex-1'>
                                <p className='font-medium capitalize'>
                                    {state.voiceType} Voice
                                </p>
                                <div className='flex items-center gap-2 mt-1'>
                                    <Button
                                        variant='outline'
                                        size='sm'
                                        className='gap-1'
                                    >
                                        <Play className='h-3 w-3' />
                                        Play Sample
                                    </Button>
                                    <div className='flex-1 h-1 bg-gray-200 rounded'>
                                        <div className='w-1/3 h-full bg-purple-400 rounded'></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className='space-y-2'>
                <div className='flex items-center justify-between'>
                    <Label>Upload Custom Audio</Label>
                    <Switch id='custom-audio' />
                </div>
                <div className='flex items-center gap-2 p-4 border border-dashed rounded-md bg-gray-50 cursor-pointer'>
                    <Mic className='h-5 w-5 text-gray-400' />
                    <span className='text-sm text-gray-500'>
                        Click to upload or record audio
                    </span>
                </div>
            </div>

            <div className='space-y-2'>
                <Label>Caption Style</Label>
                <Select
                    value={state.captionStyle}
                    onValueChange={handleCaptionStyleChange}
                >
                    <SelectTrigger>
                        <SelectValue placeholder='Select caption style' />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value='modern'>Modern</SelectItem>
                        <SelectItem value='classic'>Classic</SelectItem>
                        <SelectItem value='minimal'>Minimal</SelectItem>
                        <SelectItem value='bold'>Bold</SelectItem>
                    </SelectContent>
                </Select>

                {state.captionStyle && (
                    <div className='mt-3 p-4 bg-gray-900 rounded-lg relative'>
                        <h4 className='text-white font-medium mb-3'>
                            Caption Preview
                        </h4>
                        <div className='relative'>
                            <div className='w-full aspect-video relative rounded overflow-hidden'>
                                <Image
                                    src='/placeholder.svg'
                                    alt='Video preview'
                                    fill
                                    className='object-cover'
                                />
                            </div>
                            <div className='absolute bottom-2 left-1/2 transform -translate-x-1/2'>
                                {state.captionStyle === 'modern' && (
                                    <div className='bg-white/90 text-black px-3 py-1 rounded-full text-sm font-medium'>
                                        Modern Caption Style
                                    </div>
                                )}
                                {state.captionStyle === 'classic' && (
                                    <div className='bg-black/80 text-white px-3 py-1 text-sm'>
                                        Classic Caption Style
                                    </div>
                                )}
                                {state.captionStyle === 'minimal' && (
                                    <div className='text-white text-sm font-light'>
                                        Minimal Caption Style
                                    </div>
                                )}
                                {state.captionStyle === 'bold' && (
                                    <div className='bg-yellow-400 text-black px-3 py-1 text-sm font-bold uppercase'>
                                        BOLD CAPTION STYLE
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
