import { useState, useEffect, useCallback } from 'react';
import { youTubeTopicService, type YouTubeVideo, type YouTubeCategory } from '@/services/youtubeTopicService';

export const useYouTubeTopics = () => {
    const [categories, setCategories] = useState<string[]>([]);
    const [videos, setVideos] = useState<YouTubeVideo[]>([]);
    const [isLoadingCategories, setIsLoadingCategories] = useState(false);
    const [isLoadingVideos, setIsLoadingVideos] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch categories from YouTube API
    const fetchCategories = useCallback(async () => {
        setIsLoadingCategories(true);
        setError(null);
        try {
            console.log('Fetching categories from YouTube API...');
            const fetchedCategories = await youTubeTopicService.getCategoriesAsTopics();
            console.log('Fetched categories:', fetchedCategories);
            setCategories(fetchedCategories);
        } catch (err) {
            console.error('Error fetching categories:', err);
            setError('Failed to fetch YouTube categories');
        } finally {
            setIsLoadingCategories(false);
        }
    }, []);

    // Fetch videos for a specific topic from YouTube API
    const fetchVideosForTopic = useCallback(async (topic: string, maxResults: number = 10) => {
        setIsLoadingVideos(true);
        setError(null);
        try {
            console.log(`Fetching videos for topic: ${topic}`);
            const fetchedVideos = await youTubeTopicService.searchVideos(topic, maxResults);
            console.log('Fetched videos:', fetchedVideos);
            setVideos(fetchedVideos);
        } catch (err) {
            console.error('Error fetching videos:', err);
            setError(`Failed to fetch videos for topic: ${topic}`);
        } finally {
            setIsLoadingVideos(false);
        }
    }, []);

    // Auto-fetch categories on mount
    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    return {
        categories,
        videos,
        isLoadingCategories,
        isLoadingVideos,
        error,
        fetchCategories,
        fetchVideosForTopic,
        clearError: () => setError(null),
    };
};
