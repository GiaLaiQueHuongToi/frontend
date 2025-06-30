'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useYouTubeTopics } from '@/hooks/useYouTubeTopics';
import { Search, Play, Eye, ThumbsUp, Calendar, User, Hash, RefreshCw } from 'lucide-react';
import Image from 'next/image';

interface YouTubeTopicBrowserProps {
    onTopicSelect?: (topic: string) => void;
    onVideoSelect?: (videoId: string, title: string) => void;
}

export function YouTubeTopicBrowser({ onTopicSelect, onVideoSelect }: YouTubeTopicBrowserProps) {
    const {
        categories,
        videos,
        isLoadingCategories,
        isLoadingVideos,
        error,
        fetchCategories,
        fetchVideosForTopic,
        fetchTrendingTopics,
        searchTopics,
        clearError,
    } = useYouTubeTopics();

    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'categories' | 'videos'>('categories');
    const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        
        clearError();
        const result = await searchTopics(searchQuery.trim());
        if (result) {
            setActiveTab('videos');
        }
    };

    const handleTopicClick = async (topicId: string, topicTitle: string) => {
        setSelectedTopic(topicTitle);
        clearError();
        await fetchVideosForTopic(topicId);
        setActiveTab('videos');
        onTopicSelect?.(topicTitle);
    };

    const handleVideoClick = (videoId: string, title: string) => {
        onVideoSelect?.(videoId, title);
    };

    const formatViewCount = (views: number) => {
        if (views >= 1000000) {
            return `${(views / 1000000).toFixed(1)}M`;
        } else if (views >= 1000) {
            return `${(views / 1000).toFixed(1)}K`;
        }
        return views.toString();
    };

    const formatDuration = (duration: string) => {
        if (duration === 'Unknown') return duration;
        // Parse ISO 8601 duration (PT4M13S -> 4:13)
        const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        if (!match) return duration;
        
        const hours = match[1] ? parseInt(match[1]) : 0;
        const minutes = match[2] ? parseInt(match[2]) : 0;
        const seconds = match[3] ? parseInt(match[3]) : 0;
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900">YouTube Topic Browser</h2>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={fetchCategories}
                            disabled={isLoadingCategories}
                        >
                            <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingCategories ? 'animate-spin' : ''}`} />
                            Refresh Categories
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fetchTrendingTopics()}
                            disabled={isLoadingCategories}
                        >
                            <Hash className="h-4 w-4 mr-2" />
                            Trending Topics
                        </Button>
                    </div>
                </div>

                {/* Search */}
                <div className="flex gap-2">
                    <Input
                        placeholder="Search YouTube topics and videos..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        className="flex-1"
                    />
                    <Button onClick={handleSearch} disabled={isLoadingVideos || !searchQuery.trim()}>
                        <Search className="h-4 w-4 mr-2" />
                        Search
                    </Button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2">
                    <Button
                        variant={activeTab === 'categories' ? 'default' : 'outline'}
                        onClick={() => setActiveTab('categories')}
                    >
                        Categories ({categories.length})
                    </Button>
                    <Button
                        variant={activeTab === 'videos' ? 'default' : 'outline'}
                        onClick={() => setActiveTab('videos')}
                    >
                        Videos ({videos.length})
                        {selectedTopic && ` - ${selectedTopic}`}
                    </Button>
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Categories Tab */}
            {activeTab === 'categories' && (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">YouTube Categories & Topics</h3>
                    
                    {isLoadingCategories ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <Card key={i}>
                                    <CardHeader>
                                        <Skeleton className="h-6 w-3/4" />
                                        <Skeleton className="h-4 w-full" />
                                    </CardHeader>
                                    <CardContent>
                                        <Skeleton className="h-4 w-1/2 mb-2" />
                                        <div className="flex gap-1">
                                            <Skeleton className="h-6 w-16" />
                                            <Skeleton className="h-6 w-16" />
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {categories.map((category) => (
                                <Card 
                                    key={category.id} 
                                    className="cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-l-purple-500"
                                    onClick={() => handleTopicClick(category.id, category.title)}
                                >
                                    <CardHeader>
                                        <CardTitle className="text-lg">{category.title}</CardTitle>
                                        <CardDescription className="text-sm line-clamp-2">
                                            {category.description}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                                            <span className="flex items-center gap-1">
                                                <Eye className="h-4 w-4" />
                                                {formatViewCount(category.popularity * 1000)} views
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Play className="h-4 w-4" />
                                                {category.videoCount} videos
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                            {category.relatedKeywords.slice(0, 3).map((keyword, index) => (
                                                <Badge key={index} variant="secondary" className="text-xs">
                                                    {keyword}
                                                </Badge>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Videos Tab */}
            {activeTab === 'videos' && (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">
                        YouTube Videos
                        {selectedTopic && ` - ${selectedTopic}`}
                    </h3>
                    
                    {isLoadingVideos ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <Card key={i}>
                                    <Skeleton className="h-48 w-full rounded-t-lg" />
                                    <CardHeader>
                                        <Skeleton className="h-5 w-full" />
                                        <Skeleton className="h-4 w-3/4" />
                                    </CardHeader>
                                    <CardContent>
                                        <Skeleton className="h-4 w-1/2" />
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : videos.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {videos.map((video) => (
                                <Card 
                                    key={video.id} 
                                    className="cursor-pointer hover:shadow-lg transition-shadow overflow-hidden"
                                    onClick={() => handleVideoClick(video.id, video.title)}
                                >
                                    <div className="relative">
                                        <Image
                                            src={video.thumbnailUrl || '/placeholder-thumbnail.svg'}
                                            alt={video.title}
                                            width={320}
                                            height={180}
                                            className="w-full h-48 object-cover"
                                            unoptimized
                                        />
                                        <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs">
                                            {formatDuration(video.duration || 'Unknown')}
                                        </div>
                                    </div>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm line-clamp-2 leading-tight">
                                            {video.title}
                                        </CardTitle>
                                        <CardDescription className="text-xs flex items-center gap-1">
                                            <User className="h-3 w-3" />
                                            {video.channelTitle}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                                            <span className="flex items-center gap-1">
                                                <Eye className="h-3 w-3" />
                                                {formatViewCount(video.viewCount)}
                                            </span>
                                            {video.likeCount && (
                                                <span className="flex items-center gap-1">
                                                    <ThumbsUp className="h-3 w-3" />
                                                    {formatViewCount(video.likeCount)}
                                                </span>
                                            )}
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {new Date(video.publishedAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        {video.tags && video.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                                {video.tags.slice(0, 2).map((tag, index) => (
                                                    <Badge key={index} variant="outline" className="text-xs">
                                                        {tag}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            <Play className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No videos found. Try selecting a category or searching for topics.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
