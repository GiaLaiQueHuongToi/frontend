import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';
import type { GeneratedSegment } from '@/types/video-creation';

export interface VideoGenerationOptions {
    segments: GeneratedSegment[];
    ffmpeg: FFmpeg;
    onProgress?: (message: string) => void;
}

export interface VideoGenerationResult {
    success: boolean;
    videoBlob?: Blob;
    error?: string;
}

export async function generateVideoFromSegments({
    segments,
    ffmpeg,
    onProgress
}: VideoGenerationOptions): Promise<VideoGenerationResult> {
    try {
        if (!ffmpeg || segments.length === 0) {
            return {
                success: false,
                error: 'FFmpeg not initialized or no segments provided'
            };
        }

        onProgress?.('Starting video generation...');

        const validSegments: { segment: GeneratedSegment; index: number }[] = [];

        // Clean up FFmpeg filesystem first
        try {
            await ffmpeg.exec(['-y', '-f', 'lavfi', '-i', 'color=c=black:s=1x1:d=0.1', 'cleanup.mp4']);
            await ffmpeg.deleteFile('cleanup.mp4');
        } catch (cleanupError) {
            console.log('Cleanup completed or no files to clean');
        }

        onProgress?.('Downloading and processing segments...');

        // Download and write all images and audio files to FFmpeg filesystem
        for (let i = 0; i < segments.length; i++) {
            const segment = segments[i];

            try {
                onProgress?.(`Processing segment ${i + 1}/${segments.length}...`);

                // Download image with timeout
                console.log(`Downloading image ${i}:`, segment.imageUrl);

                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 30000);

                const imageResponse = await fetch(segment.imageUrl, {
                    signal: controller.signal,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (compatible; VideoGenerator/1.0)'
                    }
                });
                clearTimeout(timeoutId);

                if (!imageResponse.ok) {
                    console.warn(`Failed to fetch image ${i}: ${imageResponse.status} ${imageResponse.statusText}`);
                    continue;
                }

                const imageData = await imageResponse.arrayBuffer();

                if (imageData.byteLength === 0) {
                    console.warn(`Image ${i} is empty`);
                    continue;
                }

                await ffmpeg.writeFile(`image_${i}.jpg`, new Uint8Array(imageData));

                // Download audio if available
                let hasAudio = false;
                if (segment.audioUrl) {
                    try {
                        console.log(`Downloading audio ${i}:`, segment.audioUrl);
                        const audioController = new AbortController();
                        const audioTimeoutId = setTimeout(() => audioController.abort(), 30000);

                        const audioResponse = await fetch(segment.audioUrl, {
                            signal: audioController.signal
                        });
                        clearTimeout(audioTimeoutId);

                        if (audioResponse.ok) {
                            const audioData = await audioResponse.arrayBuffer();
                            if (audioData.byteLength > 0) {
                                await ffmpeg.writeFile(`audio_${i}.mp3`, new Uint8Array(audioData));
                                hasAudio = true;
                            }
                        }
                    } catch (audioError) {
                        console.warn(`Error downloading audio for segment ${i}:`, audioError);
                    }
                }

                // Create silent audio if no audio available
                if (!hasAudio) {
                    try {
                        await ffmpeg.exec([
                            '-f', 'lavfi',
                            '-i', `anullsrc=channel_layout=stereo:sample_rate=44100`,
                            '-t', (segment.duration || 5).toString(),
                            '-c:a', 'mp3',
                            `audio_${i}.mp3`
                        ]);
                        console.log(`Created silent audio for segment ${i}`);
                    } catch (silentAudioError) {
                        console.warn(`Failed to create silent audio for segment ${i}:`, silentAudioError);
                        continue;
                    }
                }

                validSegments.push({ segment, index: i });
                console.log(`Successfully processed segment ${i}`);

            } catch (segmentError) {
                console.warn(`Error processing segment ${i}:`, segmentError);
                continue;
            }
        }

        if (validSegments.length === 0) {
            return {
                success: false,
                error: 'No valid segments found. All images failed to download.'
            };
        }

        console.log(`Processing ${validSegments.length} valid segments out of ${segments.length} total`);
        onProgress?.('Creating video segments...');

        // Create video segments
        const createdSegments: number[] = [];

        for (const { segment, index } of validSegments) {
            const duration = segment.duration || 5;

            try {
                onProgress?.(`Creating video segment ${createdSegments.length + 1}/${validSegments.length}...`);

                // Create video from image with duration
                await ffmpeg.exec([
                    '-loop', '1',
                    '-i', `image_${index}.jpg`,
                    '-i', `audio_${index}.mp3`,
                    '-c:v', 'libx264',
                    '-preset', 'ultrafast',
                    '-t', duration.toString(),
                    '-pix_fmt', 'yuv420p',
                    '-vf', 'scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2',
                    '-c:a', 'aac',
                    '-ar', '44100',
                    '-shortest',
                    '-y',
                    `segment_${index}.mp4`
                ]);

                createdSegments.push(index);
                console.log(`Created video segment ${index}`);

            } catch (ffmpegError) {
                console.warn(`Error creating video for segment ${index}:`, ffmpegError);
                continue;
            }
        }

        if (createdSegments.length === 0) {
            return {
                success: false,
                error: 'No video segments were successfully created.'
            };
        }

        onProgress?.('Concatenating video segments...');

        // Create concat file content
        let concatContent = '';
        for (const index of createdSegments) {
            concatContent += `file 'segment_${index}.mp4'\n`;
        }

        // Write concat file
        await ffmpeg.writeFile('concat.txt', concatContent);

        // Concatenate all segments
        await ffmpeg.exec([
            '-f', 'concat',
            '-safe', '0',
            '-i', 'concat.txt',
            '-c', 'copy',
            '-y',
            'final_video.mp4'
        ]);

        onProgress?.('Finalizing video...');

        // Read the output
        const data = await ffmpeg.readFile('final_video.mp4');
        const videoBlob = new Blob([data], { type: 'video/mp4' });

        console.log(`Video generated successfully with ${createdSegments.length} segments`);

        return {
            success: true,
            videoBlob
        };

    } catch (error) {
        console.error('Error generating video:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}


export async function initializeFFmpeg(): Promise<FFmpeg> {
    const ffmpegInstance = new FFmpeg();

    ffmpegInstance.on('log', ({ message }) => {
        console.log(message);
    });

    // Load FFmpeg core
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    await ffmpegInstance.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    return ffmpegInstance;
}
