'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Play, Scissors, Copy, Trash2, Plus, Video } from 'lucide-react';

interface VideoEditingStepProps {
    onFinish: () => void;
}

interface TimelineElement {
    id: number;
    type: string;
    content: string;
    duration: number;
}

export function VideoEditingStep({ onFinish }: VideoEditingStepProps) {
    const [editingPhase, setEditingPhase] = useState<{
        timeline: TimelineElement[];
        selectedElement: number | null;
        playhead: number;
    }>({
        timeline: [
            {
                id: 1,
                type: 'image',
                content: 'Introduction scene',
                duration: 3,
            },
            { id: 2, type: 'image', content: 'Main content', duration: 5 },
            { id: 3, type: 'image', content: 'Conclusion', duration: 2 },
        ],
        selectedElement: null,
        playhead: 0,
    });

    const [isGenerating, setIsGenerating] = useState(false);

    const generatePreview = () => {
        setIsGenerating(true);
        setTimeout(() => {
            setIsGenerating(false);
            onFinish();
        }, 3000);
    };

    return (
        <div className='space-y-6'>
            <div className='text-center mb-4'>
                <h3 className='text-lg font-semibold'>Video Editor</h3>
                <p className='text-sm text-gray-500'>
                    Edit your video like a pro
                </p>
            </div>

            {/* Video Preview */}
            <div className='aspect-video bg-gray-900 rounded-md overflow-hidden relative'>
                <Image
                    src='/placeholder.svg'
                    alt='Video preview'
                    fill
                    className='object-cover'
                />
                <div className='absolute bottom-4 left-4 right-4'>
                    <div className='bg-black/50 rounded-lg p-3'>
                        <div className='flex items-center gap-2 mb-2'>
                            <Button
                                variant='ghost'
                                size='sm'
                                className='text-white hover:bg-white/20'
                            >
                                <Play className='h-4 w-4' />
                            </Button>
                            <div className='flex-1 h-1 bg-white/30 rounded'>
                                <div
                                    className='h-full bg-white rounded transition-all duration-300'
                                    style={{
                                        width: `${(editingPhase.playhead / 10) * 100}%`,
                                    }}
                                ></div>
                            </div>
                            <span className='text-white text-xs'>0:10</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Timeline */}
            <div className='space-y-3'>
                <Label>Timeline</Label>
                <div className='bg-gray-100 p-4 rounded-lg'>
                    <div className='flex gap-2 mb-3'>
                        {editingPhase.timeline.map((item) => (
                            <div
                                key={item.id}
                                className={`flex-1 h-12 rounded border-2 cursor-pointer transition-colors ${
                                    editingPhase.selectedElement === item.id
                                        ? 'border-purple-500 bg-purple-50'
                                        : 'border-gray-300 bg-white hover:border-gray-400'
                                }`}
                                onClick={() =>
                                    setEditingPhase({
                                        ...editingPhase,
                                        selectedElement: item.id,
                                    })
                                }
                            >
                                <div className='p-2 h-full flex flex-col justify-between'>
                                    <div className='text-xs font-medium truncate'>
                                        {item.content}
                                    </div>
                                    <div className='text-xs text-gray-500'>
                                        {item.duration}s
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Editing Controls */}
                    <div className='grid grid-cols-2 md:grid-cols-4 gap-2'>
                        <Button variant='outline' size='sm' className='gap-1'>
                            <Scissors className='h-3 w-3' />
                            Split
                        </Button>
                        <Button variant='outline' size='sm' className='gap-1'>
                            <Copy className='h-3 w-3' />
                            Duplicate
                        </Button>
                        <Button variant='outline' size='sm' className='gap-1'>
                            <Trash2 className='h-3 w-3' />
                            Delete
                        </Button>
                        <Button variant='outline' size='sm' className='gap-1'>
                            <Plus className='h-3 w-3' />
                            Add Scene
                        </Button>
                    </div>
                </div>
            </div>

            {/* Editing Options */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <Card>
                    <CardHeader className='pb-3'>
                        <CardTitle className='text-sm'>
                            Visual Effects
                        </CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-3'>
                        <div className='space-y-2'>
                            <Label className='text-xs'>Transition</Label>
                            <Select defaultValue='fade'>
                                <SelectTrigger className='h-8'>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value='fade'>Fade</SelectItem>
                                    <SelectItem value='slide'>Slide</SelectItem>
                                    <SelectItem value='zoom'>Zoom</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className='space-y-2'>
                            <Label className='text-xs'>Filter</Label>
                            <div className='grid grid-cols-3 gap-1'>
                                {[
                                    'None',
                                    'Vintage',
                                    'B&W',
                                    'Warm',
                                    'Cool',
                                    'Bright',
                                ].map((filter) => (
                                    <Button
                                        key={filter}
                                        variant='outline'
                                        size='sm'
                                        className='text-xs h-8'
                                    >
                                        {filter}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className='pb-3'>
                        <CardTitle className='text-sm'>
                            Audio Settings
                        </CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-3'>
                        <div className='space-y-2'>
                            <Label className='text-xs'>Voice Volume</Label>
                            <Slider
                                defaultValue={[80]}
                                max={100}
                                step={1}
                                className='w-full'
                            />
                        </div>
                        <div className='space-y-2'>
                            <Label className='text-xs'>Background Music</Label>
                            <div className='flex items-center gap-2'>
                                <Switch id='bg-music' defaultChecked />
                                <Label htmlFor='bg-music' className='text-xs'>
                                    Enable
                                </Label>
                            </div>
                            <Slider
                                defaultValue={[30]}
                                max={100}
                                step={1}
                                className='w-full'
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Button
                className='w-full gap-2'
                onClick={generatePreview}
                disabled={isGenerating}
            >
                <Video className='h-4 w-4' />
                {isGenerating ? 'Generating...' : 'Generate Final Preview'}
            </Button>
        </div>
    );
}
