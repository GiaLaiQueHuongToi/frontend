import { useState, useEffect } from 'react';
import { videoService, type VideoResponse, type PageResponse } from '@/services/videoService';
import { useToast } from '@/components/ui/use-toast';

export const useVideos = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [videos, setVideos] = useState<VideoResponse[]>([]);
    const [videoPage, setVideoPage] = useState<PageResponse<VideoResponse> | null>(null);
    const [currentPage, setCurrentPage] = useState(0);
    const { toast } = useToast();

    const loadVideos = async (page: number = currentPage, size: number = 10) => {
        try {
            setIsLoading(true);
            const pageResponse = await videoService.getAllVideos(page, size);
            setVideoPage(pageResponse);
            setVideos(pageResponse.data);
            setCurrentPage(page);
        } catch (error) {
            toast({
                title: 'Loading Failed',
                description: 'Could not fetch videos from server.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const refreshVideos = async () => {
        await loadVideos();
        toast({
            title: 'Videos Refreshed',
            description: 'Video list has been updated.',
        });
    };

    const getFilteredVideos = (status?: string) => {
        if (!videos) return [];
        if (!status || status === 'all') return videos;
        const filtered = videos.filter(video => video.status === status);
        return filtered;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    useEffect(() => {
        loadVideos();
    }, []);

    return {
        videos,
        videoPage,
        isLoading,
        currentPage,
        loadVideos,
        refreshVideos,
        getFilteredVideos,
        formatDate,
        setCurrentPage
    };
};
