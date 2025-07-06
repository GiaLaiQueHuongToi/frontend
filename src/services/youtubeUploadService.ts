// src/services/youtubeUploadService.ts
import { youtubeStatsService } from './youtubeService';

export interface YouTubeUploadRequest {
  title: string;
  description: string;
  tags?: string[];
  categoryId?: string;
  privacyStatus: 'private' | 'public' | 'unlisted';
  videoBlob: Blob;
}

export interface YouTubeUploadResponse {
  success: boolean;
  videoId?: string;
  videoUrl?: string;
  error?: string;
  publishedVideo?: any; // Add published video data
  publishError?: string; // Add publish error if backend fails
}

export interface YouTubeUploadProgress {
  loaded: number;
  total: number;
  percentage: number;
  status: 'uploading' | 'processing' | 'complete' | 'error';
}

export const youtubeUploadService = {
  // Upload video to YouTube
  uploadVideo: async (
    request: YouTubeUploadRequest,
    videoId: number, // Add videoId parameter
    onProgress?: (progress: YouTubeUploadProgress) => void
  ): Promise<YouTubeUploadResponse> => {
    try {
      const accessToken = youtubeStatsService.getAccessToken();
      
      if (!accessToken) {
        throw new Error('YouTube access token not found. Please reconnect your YouTube account.');
      }

      onProgress?.({
        loaded: 0,
        total: 100,
        percentage: 0,
        status: 'uploading'
      });

      // Step 1: Upload the video file
      const uploadResponse = await youtubeUploadService.uploadVideoFile(
        request.videoBlob,
        accessToken,
        onProgress
      );

      if (!uploadResponse.success || !uploadResponse.videoId) {
        throw new Error(uploadResponse.error || 'Video upload failed');
      }

      onProgress?.({
        loaded: 80,
        total: 100,
        percentage: 80,
        status: 'processing'
      });

      // Step 2: Update video metadata
      const metadataResponse = await youtubeUploadService.updateVideoMetadata(
        uploadResponse.videoId,
        {
          title: request.title,
          description: request.description,
          tags: request.tags,
          categoryId: request.categoryId || '22',
          privacyStatus: request.privacyStatus
        },
        accessToken
      );

      if (!metadataResponse.success) {
        console.warn('Video uploaded but metadata update failed:', metadataResponse.error);
      }

      // Step 3: Call publish video API after successful YouTube upload
      const youtubeUrl = `https://www.youtube.com/watch?v=${uploadResponse.videoId}`;
      
      try {
        console.log('📤 Publishing video to backend...', {
          videoId,
          youtubeVideoId: uploadResponse.videoId,
          youtubeUrl
        });

        // Import videoService here to avoid circular dependency
        const { videoService } = await import('./videoService');
        
        const publishedVideo = await videoService.publishVideo({
          videoId: videoId,
          publicUrl: youtubeUrl,
          publicId: uploadResponse.videoId
        });

        console.log('✅ Video published to backend successfully:', publishedVideo);

        onProgress?.({
          loaded: 100,
          total: 100,
          percentage: 100,
          status: 'complete'
        });

        return {
          success: true,
          videoId: uploadResponse.videoId,
          videoUrl: youtubeUrl,
          publishedVideo: publishedVideo // Include published video data
        };

      } catch (publishError) {
        console.error('❌ Failed to publish video to backend:', publishError);
        
        // Even if backend publish fails, YouTube upload was successful
        // Return success but with warning
        onProgress?.({
          loaded: 100,
          total: 100,
          percentage: 100,
          status: 'complete'
        });

        return {
          success: true,
          videoId: uploadResponse.videoId,
          videoUrl: youtubeUrl,
          publishError: publishError instanceof Error ? publishError.message : 'Failed to publish to backend'
        };
      }

    } catch (error) {
      console.error('YouTube upload error:', error);
      
      onProgress?.({
        loaded: 0,
        total: 100,
        percentage: 0,
        status: 'error'
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  },
  
  // Upload video file using resumable upload
  uploadVideoFile: async (
    videoBlob: Blob,
    accessToken: string,
    onProgress?: (progress: YouTubeUploadProgress) => void
  ): Promise<{ success: boolean; videoId?: string; error?: string }> => {
    try {
      // Step 1: Initiate resumable upload with correct parts
      const initResponse = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Upload-Content-Type': 'video/*',
          'X-Upload-Content-Length': videoBlob.size.toString()
        },
        body: JSON.stringify({
          snippet: {
            title: 'Uploading...', // Temporary title
            description: 'Video being processed...'
          },
          status: {
            privacyStatus: 'private' // Start as private (fixed comment)
          }
        })
      });

      if (!initResponse.ok) {
        const errorData = await initResponse.json().catch(() => null);
        console.error('Upload initiation failed:', {
          status: initResponse.status,
          statusText: initResponse.statusText,
          error: errorData
        });
        throw new Error(`Upload initiation failed: ${initResponse.status} - ${errorData?.error?.message || initResponse.statusText}`);
      }

      const uploadUrl = initResponse.headers.get('Location');
      if (!uploadUrl) {
        throw new Error('No upload URL received from YouTube');
      }

      console.log('✅ Upload session initiated, upload URL received');

      // Step 2: Upload video content
      const uploadResponse = await youtubeUploadService.uploadVideoContent(
        uploadUrl,
        videoBlob,
        onProgress
      );

      return uploadResponse;

    } catch (error) {
      console.error('Video file upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  },

  // Upload video content with progress tracking
  uploadVideoContent: async (
    uploadUrl: string,
    videoBlob: Blob,
    onProgress?: (progress: YouTubeUploadProgress) => void
  ): Promise<{ success: boolean; videoId?: string; error?: string }> => {
    return new Promise((resolve) => { // Remove reject parameter since we always resolve
      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const percentage = Math.round((event.loaded / event.total) * 70); // Up to 70% for upload
          onProgress({
            loaded: event.loaded,
            total: event.total,
            percentage,
            status: 'uploading'
          });
        }
      });

      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status === 200 || xhr.status === 201) {
          try {
            const response = JSON.parse(xhr.responseText);
            console.log('✅ Video uploaded successfully:', response.id);
            resolve({
              success: true,
              videoId: response.id
            });
          } catch (parseError) {
            console.error('Failed to parse upload response:', xhr.responseText);
            resolve({
              success: false,
              error: 'Failed to parse upload response'
            });
          }
        } else {
          console.error('Upload failed:', {
            status: xhr.status,
            statusText: xhr.statusText,
            response: xhr.responseText
          });
          resolve({
            success: false,
            error: `Upload failed with status ${xhr.status}: ${xhr.statusText}`
          });
        }
      });

      // Handle errors
      xhr.addEventListener('error', () => {
        console.error('Network error during upload');
        resolve({
          success: false,
          error: 'Network error during upload'
        });
      });

      // Handle timeout
      xhr.addEventListener('timeout', () => {
        console.error('Upload timeout');
        resolve({
          success: false,
          error: 'Upload timeout - please try again'
        });
      });

      // Start upload
      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', 'video/*');
      xhr.timeout = 30 * 60 * 1000; // 30 minutes timeout
      xhr.send(videoBlob);
    });
  },

  // Update video metadata
  updateVideoMetadata: async (
    videoId: string,
    metadata: {
      title: string;
      description: string;
      tags?: string[];
      categoryId?: string;
      privacyStatus: string;
    },
    accessToken: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: videoId,
          snippet: {
            title: metadata.title,
            description: metadata.description,
            tags: metadata.tags,
            categoryId: metadata.categoryId
          },
          status: {
            privacyStatus: metadata.privacyStatus
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(`Metadata update failed: ${response.status} - ${errorData?.error?.message || response.statusText}`);
      }

      return { success: true };

    } catch (error) {
      console.error('Metadata update error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Metadata update failed'
      };
    }
  },

  // Check if user has YouTube upload permissions
  checkUploadPermissions: async (): Promise<boolean> => {
    try {
      const accessToken = youtubeStatsService.getAccessToken();
      if (!accessToken) return false;

      const response = await fetch('https://www.googleapis.com/youtube/v3/channels?part=status&mine=true', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) return false;

      const data = await response.json();
      return data.items?.[0]?.status?.longUploadsStatus === 'allowed';

    } catch (error) {
      console.error('Permission check error:', error);
      return false;
    }
  }
};