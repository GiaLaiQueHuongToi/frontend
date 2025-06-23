'use client';

import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { TrendingTopics } from '@/components/video-creation/TrendingTopics';
import type { VideoCreationState } from '@/types/video-creation';

interface BasicInformationStepProps {
    state: VideoCreationState;
    onUpdateState: (updates: Partial<VideoCreationState>) => void;
}

// Mock trending topics - matching original
const trendingTopics = [
    'AI in Education',
    'Sustainable Living',
    'Future of Work',
    'Space Exploration',
    'Health Tech Innovations',
];

// TrendingUp icon component from original
function TrendingUp(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns='http://www.w3.org/2000/svg'
            width='24'
            height='24'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
        >
            <polyline points='22,7 13.5,15.5 8.5,10.5 2,17' />
            <polyline points='16,7 22,7 22,13' />
        </svg>
    );
}

export function BasicInformationStep({
    state,
    onUpdateState,
}: BasicInformationStepProps) {
    const handleTopicSourceChange = (value: string) => {
        onUpdateState({
            topicSource: value,
            selectedTopic: '', // Reset selected topic when changing source
            searchQuery: '', // Reset search query
        });
    };

    const handleVideoDescriptionChange = (
        e: React.ChangeEvent<HTMLTextAreaElement>
    ) => {
        onUpdateState({ videoDescription: e.target.value });
    };

    const handleSearchQueryChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        onUpdateState({ searchQuery: e.target.value, selectedTopic: '' });
    };

    const handleTopicSelect = (topic: string) => {
        onUpdateState({ selectedTopic: topic, searchQuery: topic });
    };

    return (
        <div className='space-y-6'>
            <div className='space-y-4'>
                <Label>Topic Source</Label>
                <RadioGroup
                    value={state.topicSource}
                    onValueChange={handleTopicSourceChange}
                    className='flex flex-col space-y-3'
                >
                    <div className='flex items-center space-x-2'>
                        <RadioGroupItem value='trending' id='trending' />
                        <Label htmlFor='trending' className='cursor-pointer'>
                            Use AI-generated content
                        </Label>
                    </div>

                    <div className='flex items-center space-x-2'>
                        <RadioGroupItem value='search' id='search' />
                        <Label htmlFor='search' className='cursor-pointer'>
                            Search for a specific topic
                        </Label>
                    </div>
                </RadioGroup>
            </div>

            {state.topicSource === 'trending' ? (
                <div className='space-y-4'>
                    <div className='space-y-2'>
                        <Label htmlFor='videoDescription'>
                            Video Description
                        </Label>
                        <Textarea
                            id='videoDescription'
                            placeholder='Enter a detailed description for your video. Include the main topic, key points you want to cover, and any specific requirements or preferences.'
                            value={state.videoDescription}
                            onChange={handleVideoDescriptionChange}
                            rows={5}
                            className='resize-none'
                        />
                    </div>
                </div>
            ) : (
                <div className='space-y-4'>
                    <div className='space-y-2'>
                        <Label>Select a Trending Topic</Label>
                        <TrendingTopics
                            topics={trendingTopics}
                            selectedTopic={state.selectedTopic}
                            onTopicSelect={handleTopicSelect}
                        />
                    </div>

                    <div className='space-y-2'>
                        <Label htmlFor='searchTopic'>Search for a Topic</Label>
                        <div className='flex gap-2'>
                            <Input
                                id='searchTopic'
                                placeholder='Enter keywords to search'
                                value={state.searchQuery}
                                onChange={handleSearchQueryChange}
                            />
                            <Button variant='outline' size='icon'>
                                <Search className='h-4 w-4' />
                            </Button>
                        </div>
                    </div>

                    {state.searchQuery && (
                        <div className='space-y-3'>
                            <h4 className='font-medium'>
                                Search Results Preview
                            </h4>
                            <div className='grid grid-cols-1 gap-3 max-h-60 overflow-y-auto'>
                                {[
                                    {
                                        id: 1,
                                        title: 'AI Tutorial for Beginners',
                                        thumbnail: '/placeholder-thumbnail.svg',
                                        views: '1.2M',
                                    },
                                    {
                                        id: 2,
                                        title: 'Machine Learning Explained',
                                        thumbnail: '/placeholder-thumbnail.svg',
                                        views: '890K',
                                    },
                                    {
                                        id: 3,
                                        title: 'Future of Artificial Intelligence',
                                        thumbnail: '/placeholder-thumbnail.svg',
                                        views: '2.1M',
                                    },
                                ].map((result) => (
                                    <div
                                        key={result.id}
                                        className='flex gap-3 p-3 border rounded-md hover:bg-gray-50 cursor-pointer'
                                        onClick={() =>
                                            handleTopicSelect(result.title)
                                        }
                                    >
                                        <div className='w-20 h-12 relative rounded overflow-hidden'>
                                            <Image
                                                src={result.thumbnail}
                                                alt={result.title}
                                                fill
                                                className='object-cover'
                                            />
                                        </div>
                                        <div className='flex-1'>
                                            <h5 className='font-medium text-sm'>
                                                {result.title}
                                            </h5>
                                            <p className='text-xs text-gray-500'>
                                                {result.views} views
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
