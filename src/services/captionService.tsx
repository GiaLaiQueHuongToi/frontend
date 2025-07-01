import axios, { AxiosInstance } from 'axios';

// Create dedicated Axios instance for caption generator service
const captionAxios: AxiosInstance = axios.create({
    baseURL:
        process.env.NEXT_PUBLIC_CAPTION_GENERATOR_URL ||
        'http://localhost:8081',
    headers: {
        Accept: '*/*',
    },
    timeout: 300000, // 5 minutes timeout for video processing
});

// Add request interceptor for logging
captionAxios.interceptors.request.use((config) => {
    const fullURL = `${config.baseURL}${config.url}`;
    console.log('🎬 Caption Service Request:', {
        method: config.method?.toUpperCase(),
        endpoint: config.url,
        fullURL: fullURL,
        contentType: config.headers['Content-Type'],
        timestamp: new Date().toISOString(),
    });
    return config;
});

// Add response interceptor for error handling
captionAxios.interceptors.response.use(
    (response) => {
        console.log('✅ Caption Service Response:', {
            status: response.status,
            contentType: response.headers['content-type'],
            dataSize:
                response.data instanceof Blob
                    ? `${response.data.size} bytes`
                    : 'N/A',
        });
        return response;
    },
    (error) => {
        console.error('❌ Caption Service Error:', {
            status: error.response?.status,
            message: error.message,
            url: error.config?.url,
            data: error.response?.data,
            headers: error.response?.headers,
        });

        // If response has text data, try to read it for better error details
        if (
            error.response?.data &&
            typeof error.response.data === 'object' &&
            error.response.data instanceof Blob
        ) {
            error.response.data
                .text()
                .then((text: string) => {
                    console.error('❌ Caption Service Error Details:', text);
                })
                .catch(() => {
                    console.error('❌ Could not read error response details');
                });
        }

        return Promise.reject(error);
    }
);

export interface CaptionGenerationRequest {
    videoFile: File | Blob;
    fontSize?: number;
    fontColor?: string;
    position?: 'top' | 'bottom';
}

export interface CaptionGenerationResponse {
    success: boolean;
    videoWithCaptions?: Blob;
    error?: string;
}

export interface BackendCaptionResponse {
    video_url: string;
    message: string;
    processing_time: number;
    language_detected?: string;
    job_id?: string;
}

export interface AudioReplacementRequest {
    videoFile: File | Blob;
    audioFile: File | Blob;
}

export interface AudioReplacementResponse {
    success: boolean;
    videoWithNewAudio?: Blob;
    error?: string;
}

export const captionService = {
    // Health check for caption generator service
    healthCheck: async (): Promise<{ success: boolean; error?: string }> => {
        try {
            const response = await captionAxios.get('/health');
            console.log('✅ Caption Service Health Check:', response.data);
            return { success: true };
        } catch (error) {
            console.error('❌ Caption Service Health Check Failed:', error);
            return {
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : 'Health check failed',
            };
        }
    },

    // Generate captions for video using the caption-generator service
    generateCaptions: async (
        request: CaptionGenerationRequest
    ): Promise<CaptionGenerationResponse> => {
        try {
            const formData = new FormData();

            // Convert Blob to File if needed (backend might expect filename)
            const videoFile =
                request.videoFile instanceof File
                    ? request.videoFile
                    : new File([request.videoFile], 'video.mp4', {
                          type: 'video/mp4',
                      });

            // Backend expects 'file' parameter, not 'video'
            formData.append('file', videoFile);

            // Add optional parameters with correct names
            if (request.fontSize)
                formData.append('font_size', request.fontSize.toString());
            if (request.fontColor)
                formData.append('font_color', request.fontColor);
            if (request.position) formData.append('position', request.position);

            console.log('🎬 Sending caption request with parameters:', {
                fileName: videoFile.name,
                fileSize: videoFile.size,
                fileType: videoFile.type,
                fontSize: request.fontSize,
                fontColor: request.fontColor,
                position: request.position,
            });

            // Step 1: Generate captioned video (returns JSON with download URL)
            const response = await captionAxios.post<BackendCaptionResponse>(
                '/generate-captioned-video',
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                    responseType: 'json', // Expecting JSON response with video_url
                }
            );

            console.log('🎥 Caption generation response:', {
                status: response.status,
                data: response.data,
                videoUrl: response.data.video_url,
                processingTime: response.data.processing_time,
                language: response.data.language_detected,
            });

            // Validate response structure
            if (!response.data.video_url) {
                throw new Error('Invalid response: missing video_url');
            }

            // Step 2: Download the actual video blob from the provided URL
            console.log('📥 Downloading video from:', response.data.video_url);

            const videoResponse = await captionAxios.get(
                response.data.video_url,
                {
                    responseType: 'blob',
                }
            );

            console.log('✅ Video download successful:', {
                status: videoResponse.status,
                contentType: videoResponse.headers['content-type'],
                blobSize: videoResponse.data.size,
                blobType: videoResponse.data.type,
            });

            // Ensure the blob has the correct MIME type
            let videoBlob = videoResponse.data;
            if (!videoBlob.type || !videoBlob.type.includes('video')) {
                console.log(
                    '🔧 Fixing blob MIME type from',
                    videoBlob.type,
                    'to video/mp4'
                );
                videoBlob = new Blob([videoBlob], { type: 'video/mp4' });
            }

            return {
                success: true,
                videoWithCaptions: videoBlob,
            };
        } catch (error) {
            console.error('Caption generation error:', error);
            return {
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : 'Failed to generate captions',
            };
        }
    },

    // Replace audio in video using FFmpeg in browser
    replaceAudio: async (
        request: AudioReplacementRequest
    ): Promise<AudioReplacementResponse> => {
        try {
            // Note: This would require FFmpeg to be available
            // For now, return an error indicating this feature needs backend implementation
            return {
                success: false,
                error: 'Audio replacement feature requires backend implementation. Please use the caption generator service after implementing the audio replacement endpoint.',
            };
        } catch (error) {
            console.error('Audio replacement error:', error);
            return {
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : 'Failed to replace audio',
            };
        }
    },
};
