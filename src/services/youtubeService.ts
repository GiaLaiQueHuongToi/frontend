export interface YouTubeStats {
    videoCount: number;
    totalViews: number;
    subscriberCount: number;
    channelTitle: string;
    channelId: string;
  }
  
  export interface YouTubeVideo {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    publishedAt: string;
    viewCount: number;
    likeCount: number;
    commentCount: number;
  }
  
  export const youtubeStatsService = {
    // Get YouTube access token from localStorage
    getAccessToken: (): string | null => {
      if (typeof window === 'undefined') return null;
      return localStorage.getItem('youtubeAccessToken');
    },
  
    // Get channel statistics
    getChannelStats: async (): Promise<YouTubeStats> => {
      const accessToken = youtubeStatsService.getAccessToken();
      
      if (!accessToken) {
        throw new Error('YouTube access token not found');
      }
  
      try {
        // First, get the channel ID
        const channelResponse = await fetch(
          'https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&mine=true',
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Accept': 'application/json',
            }
          }
        );
  
        if (!channelResponse.ok) {
          if (channelResponse.status === 401) {
            // Token expired, remove it
            localStorage.removeItem('youtubeAccessToken');
            throw new Error('YouTube access token expired. Please reconnect.');
          }
          throw new Error(`Failed to fetch channel stats: ${channelResponse.status}`);
        }
  
        const channelData = await channelResponse.json();
        
        if (!channelData.items || channelData.items.length === 0) {
          throw new Error('No YouTube channel found for this account');
        }
  
        const channel = channelData.items[0];
        const stats = channel.statistics;
  
        return {
          videoCount: parseInt(stats.videoCount || '0'),
          totalViews: parseInt(stats.viewCount || '0'),
          subscriberCount: parseInt(stats.subscriberCount || '0'),
          channelTitle: channel.snippet.title,
          channelId: channel.id,
        };
      } catch (error) {
        console.error('Error fetching YouTube stats:', error);
        throw error;
      }
    },
  
    // Get channel videos
    getChannelVideos: async (maxResults: number = 10): Promise<YouTubeVideo[]> => {
      const accessToken = youtubeStatsService.getAccessToken();
      
      if (!accessToken) {
        throw new Error('YouTube access token not found');
      }
  
      try {
        // First get the uploads playlist ID
        const channelResponse = await fetch(
          'https://www.googleapis.com/youtube/v3/channels?part=contentDetails&mine=true',
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Accept': 'application/json',
            }
          }
        );
  
        if (!channelResponse.ok) {
          throw new Error(`Failed to fetch channel: ${channelResponse.status}`);
        }
  
        const channelData = await channelResponse.json();
        const uploadsPlaylistId = channelData.items[0]?.contentDetails?.relatedPlaylists?.uploads;
  
        if (!uploadsPlaylistId) {
          throw new Error('No uploads playlist found');
        }
  
        // Get videos from uploads playlist
        const videosResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=${maxResults}`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Accept': 'application/json',
            }
          }
        );
  
        if (!videosResponse.ok) {
          throw new Error(`Failed to fetch videos: ${videosResponse.status}`);
        }
  
        const videosData = await videosResponse.json();
        
        // Get video statistics
        const videoIds = videosData.items.map((item: any) => item.snippet.resourceId.videoId).join(',');
        
        const statsResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${videoIds}`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Accept': 'application/json',
            }
          }
        );
  
        if (!statsResponse.ok) {
          throw new Error(`Failed to fetch video stats: ${statsResponse.status}`);
        }
  
        const statsData = await statsResponse.json();
  
        return statsData.items.map((video: any) => ({
          id: video.id,
          title: video.snippet.title,
          description: video.snippet.description,
          thumbnail: video.snippet.thumbnails.medium?.url || '',
          publishedAt: video.snippet.publishedAt,
          viewCount: parseInt(video.statistics.viewCount || '0'),
          likeCount: parseInt(video.statistics.likeCount || '0'),
          commentCount: parseInt(video.statistics.commentCount || '0'),
        }));
  
      } catch (error) {
        console.error('Error fetching YouTube videos:', error);
        throw error;
      }
    },
  
    // Refresh access token if needed
    refreshAccessToken: async (): Promise<boolean> => {
      try {
        // This would typically involve your backend to refresh the token
        // For now, we'll just check if the current token is valid
        const stats = await youtubeStatsService.getChannelStats();
        return true;
      } catch (error) {
        console.error('Token refresh failed:', error);
        return false;
      }
    },
  };