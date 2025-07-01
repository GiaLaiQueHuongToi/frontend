/**
 * Test utility for video format compatibility
 */

export const testVideoFormats = () => {
    const videoElement = document.createElement('video');

    const formats = {
        mp4: videoElement.canPlayType('video/mp4'),
        webm: videoElement.canPlayType('video/webm'),
        ogg: videoElement.canPlayType('video/ogg'),
        'mp4;codecs=avc1.42E01E': videoElement.canPlayType(
            'video/mp4; codecs="avc1.42E01E"'
        ),
        'webm;codecs=vp8': videoElement.canPlayType('video/webm; codecs="vp8"'),
        'webm;codecs=vp9': videoElement.canPlayType('video/webm; codecs="vp9"'),
    };

    console.log('🎬 Browser Video Format Support:', formats);
    return formats;
};

export const createCompatibleVideoBlob = (originalBlob: Blob): Blob => {
    const videoElement = document.createElement('video');

    // Check what formats are supported
    const canPlayMp4 = videoElement.canPlayType('video/mp4');
    const canPlayWebm = videoElement.canPlayType('video/webm');

    console.log('🔧 Creating compatible video blob:', {
        originalType: originalBlob.type,
        mp4Support: canPlayMp4,
        webmSupport: canPlayWebm,
    });

    // If no type is set or it's not a video type, try MP4 first
    if (!originalBlob.type || !originalBlob.type.includes('video')) {
        if (canPlayMp4 !== '') {
            return new Blob([originalBlob], { type: 'video/mp4' });
        } else if (canPlayWebm !== '') {
            return new Blob([originalBlob], { type: 'video/webm' });
        }
    }

    // If original type is already video and supported, keep it
    if (originalBlob.type.includes('video')) {
        const canPlay = videoElement.canPlayType(originalBlob.type);
        if (canPlay !== '') {
            return originalBlob;
        }
    }

    // Fallback to MP4
    return new Blob([originalBlob], { type: 'video/mp4' });
};
