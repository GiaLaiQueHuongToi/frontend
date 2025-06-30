export interface TrendingTopic {
    id: string;
    title: string;
    description: string;
    category: string;
    popularity: number;
    relatedKeywords: string[];
    videoCount?: number;
}

export interface YouTubeVideo {
    id: string;
    title: string;
    description: string;
    channelTitle: string;
    publishedAt: string;
    viewCount: number;
    likeCount?: number;
    categoryId: string;
    categoryTitle?: string;
    tags?: string[];
    thumbnailUrl: string;
    duration?: string;
}

export interface YouTubeCategory {
    id: string;
    title: string;
    assignable: boolean;
}

export class YouTubeTopicService {
    private readonly apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
    private readonly baseUrl = 'https://www.googleapis.com/youtube/v3';
    private categoriesCache: YouTubeCategory[] | null = null;

    // Helper function to convert YouTube duration (PT3M1S) to readable format (3:01)
    private formatYouTubeDuration(duration: string): string {
        if (!duration) return 'Unknown';
        
        try {
            const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
            if (!match) return duration;
            
            const hours = parseInt(match[1] || '0');
            const minutes = parseInt(match[2] || '0');
            const seconds = parseInt(match[3] || '0');
            
            if (hours > 0) {
                return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            } else {
                return `${minutes}:${seconds.toString().padStart(2, '0')}`;
            }
        } catch (error) {
            console.warn('Failed to parse duration:', duration);
            return duration;
        }
    }

    // Get YouTube video categories
    async getVideoCategories(regionCode: string = 'US'): Promise<YouTubeCategory[]> {
        if (this.categoriesCache && this.categoriesCache.length > 0) {
            return this.categoriesCache;
        }

        if (!this.apiKey) {
            throw new Error('YouTube API key not configured');
        }

        try {
            const response = await fetch(
                `${this.baseUrl}/videoCategories?part=snippet&regionCode=${regionCode}&key=${this.apiKey}`
            );

            if (!response.ok) {
                throw new Error(`YouTube API error: ${response.status}`);
            }

            const data = await response.json();
            
            this.categoriesCache = data.items?.map((item: any) => ({
                id: item.id,
                title: item.snippet.title,
                assignable: item.snippet.assignable
            })).filter((category: YouTubeCategory) => category.assignable) || [];

            return this.categoriesCache || [];
        } catch (error) {
            console.error('Error fetching YouTube categories:', error);
            throw error;
        }
    }

    // Get categories as trending topics
    async getCategoriesAsTopics(): Promise<string[]> {
        try {
            const categories = await this.getVideoCategories();
            return categories.map(cat => cat.title);
        } catch (error) {
            console.error('Error getting categories as topics:', error);
            throw error;
        }
    }

    // Search YouTube videos
    async searchVideos(query: string, maxResults: number = 20): Promise<YouTubeVideo[]> {
        if (!this.apiKey) {
            throw new Error('YouTube API key not configured');
        }

        try {
            // Get video IDs from search
            const searchResponse = await fetch(
                `${this.baseUrl}/search?part=snippet&q=${encodeURIComponent(query)}&type=video&order=relevance&maxResults=${maxResults}&key=${this.apiKey}`
            );

            if (!searchResponse.ok) {
                throw new Error(`YouTube API error: ${searchResponse.status}`);
            }

            const searchData = await searchResponse.json();
            const videoIds = searchData.items?.map((item: any) => item.id.videoId).join(',');

            if (!videoIds) {
                return [];
            }

            // Get detailed video information
            const videosResponse = await fetch(
                `${this.baseUrl}/videos?part=snippet,statistics,contentDetails&id=${videoIds}&key=${this.apiKey}`
            );

            if (!videosResponse.ok) {
                throw new Error(`YouTube API error: ${videosResponse.status}`);
            }

            const videosData = await videosResponse.json();
            const categories = await this.getVideoCategories();

            return videosData.items?.map((item: any) => ({
                id: item.id,
                title: item.snippet.title,
                description: item.snippet.description,
                channelTitle: item.snippet.channelTitle,
                publishedAt: item.snippet.publishedAt,
                viewCount: parseInt(item.statistics.viewCount || '0'),
                likeCount: parseInt(item.statistics.likeCount || '0'),
                categoryId: item.snippet.categoryId,
                categoryTitle: categories.find(cat => cat.id === item.snippet.categoryId)?.title || 'Unknown',
                tags: item.snippet.tags || [],
                thumbnailUrl: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
                duration: this.formatYouTubeDuration(item.contentDetails?.duration || '')
            })) || [];
        } catch (error) {
            console.error('Error searching YouTube videos:', error);
            throw error;
        }
    }

    // Get trending videos by category
    async getTrendingVideosByCategory(categoryId: string, maxResults: number = 20): Promise<YouTubeVideo[]> {
        if (!this.apiKey) {
            throw new Error('YouTube API key not configured');
        }

        try {
            const response = await fetch(
                `${this.baseUrl}/videos?part=snippet,statistics,contentDetails&chart=mostPopular&regionCode=US&videoCategoryId=${categoryId}&maxResults=${maxResults}&key=${this.apiKey}`
            );

            if (!response.ok) {
                throw new Error(`YouTube API error: ${response.status}`);
            }

            const data = await response.json();
            const categories = await this.getVideoCategories();

            return data.items?.map((item: any) => ({
                id: item.id,
                title: item.snippet.title,
                description: item.snippet.description,
                channelTitle: item.snippet.channelTitle,
                publishedAt: item.snippet.publishedAt,
                viewCount: parseInt(item.statistics.viewCount || '0'),
                likeCount: parseInt(item.statistics.likeCount || '0'),
                categoryId: item.snippet.categoryId,
                categoryTitle: categories.find(cat => cat.id === item.snippet.categoryId)?.title || 'Unknown',
                tags: item.snippet.tags || [],
                thumbnailUrl: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
                duration: this.formatYouTubeDuration(item.contentDetails?.duration || '')
            })) || [];
        } catch (error) {
            console.error('Error getting trending videos by category:', error);
            throw error;
        }
    }
}

export const youTubeTopicService = new YouTubeTopicService();
