'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Search, Loader2 } from 'lucide-react';
import { TrendingTopics } from '@/components/video-creation/TrendingTopics';
import { useYouTubeTopics } from '@/hooks/useYouTubeTopics';
import { youTubeTopicService } from '@/services/youtubeTopicService';
import type { VideoCreationState } from '@/types/video-creation';

interface BasicInformationStepProps {
    state: VideoCreationState;
    onUpdateState: (updates: Partial<VideoCreationState>) => void;
}

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
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const {
        categories,
        isLoadingCategories: categoriesLoading,
        error: categoriesError,
        fetchVideosForTopic,
    } = useYouTubeTopics();

    const trendingTopics = categories;

    const handleTopicSourceChange = (value: string) => {
        onUpdateState({
            topicSource: value,
            selectedTopic: '',
            searchQuery: '',
        });
        setSearchResults([]);
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

    const handleSearch = async () => {
        if (!state.searchQuery.trim()) return;

        setIsSearching(true);
        try {
            const results = await youTubeTopicService.searchVideos(state.searchQuery, 10);
            setSearchResults(results);
        } catch (error) {
            console.error('Search failed:', error);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    useEffect(() => {
        if (!state.searchQuery.trim()) {
            setSearchResults([]);
            return;
        }

        const timer = setTimeout(() => {
            handleSearch();
        }, 500);

        return () => clearTimeout(timer);
    }, [state.searchQuery]);

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
                        {categoriesLoading ? (
                            <div className='flex items-center justify-center py-4'>
                                <Loader2 className='h-6 w-6 animate-spin' />
                                <span className='ml-2'>Loading trending topics...</span>
                            </div>
                        ) : categoriesError ? (
                            <div className='text-red-500 text-sm p-4 border border-red-200 rounded-md'>
                                Failed to load trending topics: {categoriesError}
                            </div>
                        ) : (
                            <TrendingTopics
                                topics={trendingTopics}
                                selectedTopic={state.selectedTopic}
                                onTopicSelect={handleTopicSelect}
                            />
                        )}
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
                            <Button
                                variant='outline'
                                size='icon'
                                onClick={handleSearch}
                                disabled={isSearching || !state.searchQuery.trim()}
                            >
                                {isSearching ? (
                                    <Loader2 className='h-4 w-4 animate-spin' />
                                ) : (
                                    <Search className='h-4 w-4' />
                                )}
                            </Button>
                        </div>
                    </div>

                    {(state.searchQuery && searchResults.length > 0) && (
                        <div className='space-y-3'>
                            <h4 className='font-medium'>
                                YouTube Search Results
                            </h4>
                            <div className='grid grid-cols-1 gap-3 max-h-80 overflow-y-auto'>
                                {searchResults.map((result) => {
                                    const isSelected = state.selectedTopic === result.title;
                                    return (
                                        <div
                                            key={result.id}
                                            className={`flex gap-3 p-3 border rounded-md cursor-pointer transition-all ${
                                                isSelected 
                                                    ? 'border-blue-500 bg-blue-50 shadow-md' 
                                                    : 'hover:bg-gray-50 border-gray-200'
                                            }`}
                                            onClick={() =>
                                                handleTopicSelect(result.title)
                                            }
                                        >
                                            <div className='w-32 h-18 relative rounded overflow-hidden flex-shrink-0'>
                                                <Image
                                                    src={result.thumbnailUrl || '/placeholder-thumbnail.svg'}
                                                    alt={result.title}
                                                    fill
                                                    className='object-cover'
                                                    unoptimized
                                                />
                                                {result.duration && (
                                                    <div className='absolute bottom-1 right-1 bg-black bg-opacity-75 text-white px-1 py-0.5 rounded text-xs'>
                                                        {result.duration}
                                                    </div>
                                                )}
                                            </div>
                                            <div className='flex-1 min-w-0'>
                                                <h5 className={`text-sm line-clamp-2 mb-1 ${
                                                    isSelected ? 'font-bold text-blue-700' : 'font-medium'
                                                }`}>
                                                    {result.title}
                                                </h5>
                                                <p className='text-xs text-gray-500 mb-1'>
                                                    {result.channelTitle}
                                                </p>
                                                <div className='flex items-center gap-2 text-xs text-gray-400'>
                                                    <span>
                                                        {result.viewCount ? `${parseInt(result.viewCount).toLocaleString()} views` : 'N/A views'}
                                                    </span>
                                                    <span>•</span>
                                                    <span>
                                                        {new Date(result.publishedAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {state.searchQuery && isSearching && (
                        <div className='flex items-center justify-center py-8'>
                            <Loader2 className='h-6 w-6 animate-spin' />
                            <span className='ml-2'>Searching YouTube...</span>
                        </div>
                    )}

                    {state.searchQuery && !isSearching && searchResults.length === 0 && (
                        <div className='text-center py-8 text-gray-500'>
                            No results found for "{state.searchQuery}"
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
