import Axios from '@/config/Axios';

export interface VideoResponse {
    id: number;
    title: string;
    videoUrl: string;
    status: 'draft' | 'published';
    views: number;
    description: string;
    createdAt: string;
}

export interface PageResponse<T> {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    data: T[];
}

export interface ApiResponse<T> {
    code: number;
    data: T;
    message?: string;
}

export class VideoService {
    private readonly baseUrl = '/videos';

    // Generate thumbnail URL from Cloudinary video URL
    generateThumbnailUrl(videoUrl: string): string {
        try {
            // Check if it's a Cloudinary URL
            if (videoUrl.includes('cloudinary.com') && videoUrl.includes('/video/upload/')) {
                // Method 1: Auto-select best frame
                const autoThumbnail = videoUrl
                    .replace('/video/upload/', '/video/upload/so_auto,w_400,h_225,c_fill,f_jpg/')
                    .replace('.mp4', '.jpg');
                
                // Method 2: Get frame at 1 second (fallback)
                const timeThumbnail = videoUrl
                    .replace('/video/upload/', '/video/upload/so_1.0,w_400,h_225,c_fill,f_jpg/')
                    .replace('.mp4', '.jpg');
                
                // Try auto first, if it fails the onError will handle fallback to placeholder
                return autoThumbnail;
            }
            return '/placeholder-video.svg';
        } catch (error) {
            console.error('Error generating thumbnail URL:', error);
            return '/placeholder-video.svg';
        }
    }

    // Alternative method to get thumbnail at specific time
    generateThumbnailAtTime(videoUrl: string, timeInSeconds: number = 1.0): string {
        try {
            if (videoUrl.includes('cloudinary.com') && videoUrl.includes('/video/upload/')) {
                return videoUrl
                    .replace('/video/upload/', `/video/upload/so_${timeInSeconds},w_400,h_225,c_fill,f_jpg/`)
                    .replace('.mp4', '.jpg');
            }
            return '/placeholder-video.svg';
        } catch (error) {
            console.error('Error generating thumbnail URL:', error);
            return '/placeholder-video.svg';
        }
    }

    async getAllVideos(page: number = 0, size: number = 10): Promise<PageResponse<VideoResponse>> {
        try {
            const response = await Axios.get<ApiResponse<PageResponse<VideoResponse>>>(
                `${this.baseUrl}?page=${page}&size=${size}`
            );
            return response.data.data;
        } catch (error) {
            console.error('❌ Error fetching videos:', error);
            throw error;
        }
    }

    async getVideoById(id: number): Promise<VideoResponse> {
        try {
            const response = await Axios.get<ApiResponse<VideoResponse>>(`${this.baseUrl}/${id}`);
            return response.data.data;
        } catch (error) {
            console.error('Error fetching video:', error);
            throw error;
        }
    }

    // Download video from Cloudinary URL
    async downloadVideo(video: VideoResponse, onProgress?: (progress: number) => void): Promise<boolean> {
        try {
            // Try blob download method first for better control
            const success = await this.downloadVideoAsBlob(video, onProgress);
            if (success) return true;
            
            // Fallback to direct link method
            return this.downloadVideoDirectLink(video);
        } catch (error) {
            console.error('Error downloading video:', error);
            return false;
        }
    }

    // Download video as blob for better control with progress tracking
    private async downloadVideoAsBlob(video: VideoResponse, onProgress?: (progress: number) => void): Promise<boolean> {
        try {
            // Fetch the video with progress tracking
            const response = await fetch(video.videoUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const contentLength = response.headers.get('content-length');
            const total = parseInt(contentLength || '0', 10);
            let loaded = 0;

            // Create a readable stream to track progress
            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error('No response body');
            }

            const chunks: Uint8Array[] = [];
            
            while (true) {
                const { done, value } = await reader.read();
                
                if (done) break;
                
                if (value) {
                    chunks.push(value);
                    loaded += value.length;
                    
                    // Report progress if callback provided
                    if (onProgress && total > 0) {
                        const progress = (loaded / total) * 100;
                        onProgress(Math.round(progress));
                    }
                }
            }

            // Combine all chunks into a single blob
            const blob = new Blob(chunks, { type: 'video/mp4' });
            
            // Create blob URL
            const blobUrl = window.URL.createObjectURL(blob);
            
            // Create download link
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = this.sanitizeFilename(`${video.title}.mp4`);
            link.style.display = 'none';
            
            // Trigger download
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Clean up blob URL
            window.URL.revokeObjectURL(blobUrl);
            
            return true;
        } catch (error) {
            console.error('Blob download failed:', error);
            return false;
        }
    }

    // Fallback direct link download method
    private downloadVideoDirectLink(video: VideoResponse): boolean {
        try {
            let downloadUrl = video.videoUrl;
            
            // For Cloudinary URLs, add fl_attachment parameter to force download
            if (video.videoUrl.includes('cloudinary.com')) {
                // Check if URL has the standard Cloudinary structure
                if (video.videoUrl.includes('/video/upload/')) {
                    // Insert fl_attachment into the transformation path
                    downloadUrl = video.videoUrl.replace('/video/upload/', '/video/upload/fl_attachment/');
                } else {
                    // If no standard structure, add as query parameter
                    downloadUrl = video.videoUrl + (video.videoUrl.includes('?') ? '&' : '?') + 'fl_attachment=true';
                }
            }
            
            // Create a temporary anchor element to trigger download
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = this.sanitizeFilename(`${video.title}.mp4`);
            
            // These attributes ensure it downloads rather than navigating
            link.rel = 'noopener noreferrer';
            link.style.display = 'none';
            
            // Append to body, click, and remove
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            return true;
        } catch (error) {
            console.error('Direct link download failed:', error);
            return false;
        }
    }

    // Generate shareable link for video
    generateShareLink(videoId: number): string {
        if (typeof window !== 'undefined') {
            return `${window.location.origin}/dashboard/video/${videoId}`;
        }
        return `https://yourdomain.com/dashboard/video/${videoId}`;
    }

    // Copy share link to clipboard
    async shareVideo(videoId: number): Promise<boolean> {
        try {
            const shareUrl = this.generateShareLink(videoId);
            
            if (navigator.clipboard && window.isSecureContext) {
                // Use modern clipboard API if available
                await navigator.clipboard.writeText(shareUrl);
                return true;
            } else {
                // Fallback for older browsers
                return this.fallbackCopyToClipboard(shareUrl);
            }
        } catch (error) {
            console.error('Error sharing video:', error);
            // Try fallback method
            try {
                const shareUrl = this.generateShareLink(videoId);
                return this.fallbackCopyToClipboard(shareUrl);
            } catch (fallbackError) {
                console.error('Fallback copy also failed:', fallbackError);
                return false;
            }
        }
    }

    // Generate direct video URL for external sharing (e.g., social media)
    getDirectVideoUrl(video: VideoResponse): string {
        return video.videoUrl;
    }

    // Generate embeddable video URL
    generateEmbedUrl(videoId: number): string {
        if (typeof window !== 'undefined') {
            return `${window.location.origin}/embed/video/${videoId}`;
        }
        return `https://yourdomain.com/embed/video/${videoId}`;
    }

    // Helper method to sanitize filename for downloads
    private sanitizeFilename(filename: string): string {
        // Remove invalid characters for filenames
        return filename.replace(/[<>:"/\\|?*]/g, '_').trim();
    }

    // Fallback clipboard copy method for older browsers
    private fallbackCopyToClipboard(text: string): boolean {
        try {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            
            return successful;
        } catch (error) {
            console.error('Fallback copy failed:', error);
            return false;
        }
    }
}

export const videoService = new VideoService();
