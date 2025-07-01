// Cloudinary Service for uploading videos
// This service provides methods to upload video files to Cloudinary

export interface CloudinaryUploadResponse {
    public_id: string;
    version: number;
    signature: string;
    width: number;
    height: number;
    format: string;
    resource_type: string;
    created_at: string;
    tags: string[];
    bytes: number;
    type: string;
    etag: string;
    placeholder: boolean;
    url: string;
    secure_url: string;
    playback_url?: string;
    duration?: number;
    bit_rate?: number;
    frame_rate?: number;
    audio?: {
        codec: string;
        bit_rate: string;
        frequency: number;
        channels: number;
        channel_layout: string;
    };
    video?: {
        pix_format: string;
        codec: string;
        level: number;
        profile: string;
        bit_rate: string;
        dar: string;
        time_base: string;
    };
    original_filename: string;
}

export interface CloudinaryUploadError {
    message: string;
    name: string;
    http_code?: number;
}

export interface UploadProgress {
    loaded: number;
    total: number;
    percentage: number;
}

export class CloudinaryService {
    private readonly cloudName: string;
    private readonly uploadPreset: string;

    constructor() {
        this.cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '';
        this.uploadPreset =
            process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '';

        if (!this.cloudName || !this.uploadPreset) {
            throw new Error(
                'Cloudinary configuration missing. Please set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET environment variables.'
            );
        }
    }

    /**
     * Upload a video file to Cloudinary
     * @param videoBlob - The video file as a Blob
     * @param filename - Optional filename for the uploaded video
     * @param onProgress - Optional callback for upload progress updates
     * @returns Promise resolving to CloudinaryUploadResponse
     */
    async uploadVideo(
        videoBlob: Blob,
        filename?: string,
        onProgress?: (progress: UploadProgress) => void
    ): Promise<CloudinaryUploadResponse> {
        return new Promise((resolve, reject) => {
            try {
                // Create FormData for multipart upload
                const formData = new FormData();

                // Add the video file
                const videoFile = new File(
                    [videoBlob],
                    filename || `video-${Date.now()}.mp4`,
                    { type: videoBlob.type || 'video/mp4' }
                );
                formData.append('file', videoFile);

                // Add Cloudinary parameters (only those allowed for unsigned upload)
                formData.append('upload_preset', this.uploadPreset);
                formData.append('resource_type', 'video');

                // Optional: Add folder for organization
                formData.append('folder', 'autoreels/videos');

                // Optional: Add tags for organization
                formData.append('tags', 'autoreels,generated-video');

                // Create XMLHttpRequest for progress tracking
                const xhr = new XMLHttpRequest();

                // Setup progress tracking
                if (onProgress) {
                    xhr.upload.addEventListener('progress', (event) => {
                        if (event.lengthComputable) {
                            const progress: UploadProgress = {
                                loaded: event.loaded,
                                total: event.total,
                                percentage: Math.round(
                                    (event.loaded / event.total) * 100
                                ),
                            };
                            onProgress(progress);
                        }
                    });
                }

                // Setup completion handlers
                xhr.addEventListener('load', () => {
                    if (xhr.status === 200) {
                        try {
                            const response: CloudinaryUploadResponse =
                                JSON.parse(xhr.responseText);
                            console.log('✅ Video uploaded to Cloudinary:', {
                                public_id: response.public_id,
                                secure_url: response.secure_url,
                                duration: response.duration,
                                bytes: response.bytes,
                            });
                            resolve(response);
                        } catch (parseError) {
                            console.error(
                                '❌ Failed to parse Cloudinary response:',
                                parseError
                            );
                            reject(
                                new Error('Invalid response from Cloudinary')
                            );
                        }
                    } else {
                        console.error(
                            '❌ Cloudinary upload failed:',
                            xhr.status,
                            xhr.responseText
                        );
                        try {
                            const errorResponse = JSON.parse(xhr.responseText);
                            reject(
                                new Error(
                                    errorResponse.error?.message ||
                                        'Upload failed'
                                )
                            );
                        } catch {
                            reject(
                                new Error(
                                    `Upload failed with status ${xhr.status}`
                                )
                            );
                        }
                    }
                });

                xhr.addEventListener('error', () => {
                    console.error('❌ Network error during Cloudinary upload');
                    reject(new Error('Network error during upload'));
                });

                xhr.addEventListener('timeout', () => {
                    console.error('❌ Cloudinary upload timeout');
                    reject(new Error('Upload timeout'));
                });

                // Configure request
                const uploadUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/video/upload`;
                xhr.open('POST', uploadUrl);

                // Set timeout (5 minutes for video uploads)
                xhr.timeout = 5 * 60 * 1000;

                // Start upload
                console.log('🚀 Starting Cloudinary video upload...', {
                    filename: videoFile.name,
                    size: videoFile.size,
                    type: videoFile.type,
                    cloudName: this.cloudName,
                    uploadPreset: this.uploadPreset,
                    uploadUrl,
                });

                xhr.send(formData);
            } catch (error) {
                console.error('❌ Error preparing Cloudinary upload:', error);
                reject(error);
            }
        });
    }

    /**
     * Get video thumbnail URL from Cloudinary video URL
     * @param videoUrl - The Cloudinary video URL
     * @param transformations - Optional transformation parameters
     * @returns Thumbnail URL
     */
    getThumbnailUrl(
        videoUrl: string,
        transformations: {
            width?: number;
            height?: number;
            quality?: string;
        } = {}
    ): string {
        try {
            if (
                !videoUrl.includes('cloudinary.com') ||
                !videoUrl.includes('/video/upload/')
            ) {
                throw new Error('Invalid Cloudinary video URL');
            }

            const {
                width = 400,
                height = 300,
                quality = 'auto',
            } = transformations;

            // Replace /video/upload/ with /image/upload/ and add transformations
            const thumbnailUrl = videoUrl
                .replace(
                    '/video/upload/',
                    `/image/upload/w_${width},h_${height},c_fill,q_${quality},f_jpg/`
                )
                .replace('.mp4', '.jpg');

            return thumbnailUrl;
        } catch (error) {
            console.error('❌ Error generating thumbnail URL:', error);
            return '/placeholder-thumbnail.svg'; // Fallback thumbnail
        }
    }

    /**
     * Get optimized video URL with transformations
     * @param videoUrl - The original Cloudinary video URL
     * @param transformations - Video transformation parameters
     * @returns Optimized video URL
     */
    getOptimizedVideoUrl(
        videoUrl: string,
        transformations: {
            quality?: string;
            format?: string;
            width?: number;
            height?: number;
        } = {}
    ): string {
        try {
            if (
                !videoUrl.includes('cloudinary.com') ||
                !videoUrl.includes('/video/upload/')
            ) {
                return videoUrl; // Return original if not Cloudinary URL
            }

            const {
                quality = 'auto',
                format = 'mp4',
                width,
                height,
            } = transformations;

            let transformationString = `q_${quality},f_${format}`;

            if (width && height) {
                transformationString += `,w_${width},h_${height},c_fill`;
            }

            // Insert transformations into the URL
            const optimizedUrl = videoUrl.replace(
                '/video/upload/',
                `/video/upload/${transformationString}/`
            );

            return optimizedUrl;
        } catch (error) {
            console.error('❌ Error generating optimized video URL:', error);
            return videoUrl; // Return original URL on error
        }
    }
}

// Create and export singleton instance
export const cloudinaryService = new CloudinaryService();
