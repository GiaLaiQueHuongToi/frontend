import Axios from '@/config/Axios';
import AudioConverter from '@/utils/AudioConverter';

export interface AudioRequest {
    text: string;
    language: string; // 'en-US', 'vi-VN', 'ja-JP', 'ko-KR', 'zh-CN', 'es-ES', 'fr-FR', 'de-DE'
    gender: string; // 'female', 'male'
    emotion: string; // 'neutral', 'cheerful', 'sad', 'angry', 'excited', 'formal', 'funny', 'calm', 'whisper'
}

class AudioService {
    private baseUrl: string =
        process.env.NEXT_PUBLIC_AUDIO_URL || 'http://localhost:9999';

    async generateAudio(request: AudioRequest): Promise<string> {
        try {
            const response = await Axios.post(
                `${this.baseUrl}/synthesize`,
                request,
                {
                    responseType: 'arraybuffer', // Nhận raw audio data
                }
            );

            // Convert raw audio to MP3
            const mp3Blob = await AudioConverter.convertRawToMp3(response.data);

            // Create blob URL
            const audioUrl = URL.createObjectURL(mp3Blob);

            return audioUrl;
        } catch (error) {
            console.error('Error generating audio:', error);
            throw error;
        }
    }
}

export default new AudioService();
