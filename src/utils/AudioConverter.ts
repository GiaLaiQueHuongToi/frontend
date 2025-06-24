
class AudioConverter {
    async convertRawToMp3(rawData: ArrayBuffer): Promise<Blob> {
        try {
            return new Blob([rawData], { type: 'audio/mp3' });
        } catch (error) {
            console.error('Error converting audio:', error);
            throw error;
        }
    }

    async convertRawToWav(rawData: ArrayBuffer): Promise<Blob> {
        try {
            return new Blob([rawData], { type: 'audio/wav' });
        } catch (error) {
            console.error('Error converting to WAV:', error);
            throw error;
        }
    }
}


export default new AudioConverter();