import { useEffect, useState } from 'react';

interface VideoDebugPanelProps {
    videoBlob: Blob | null;
    className?: string;
}

export function VideoDebugPanel({
    videoBlob,
    className = '',
}: VideoDebugPanelProps) {
    const [debugInfo, setDebugInfo] = useState<{
        hasBlob: boolean;
        size: number;
        type: string;
        isValid: boolean;
        url?: string;
    } | null>(null);

    useEffect(() => {
        if (videoBlob) {
            const url = URL.createObjectURL(videoBlob);
            setDebugInfo({
                hasBlob: true,
                size: videoBlob.size,
                type: videoBlob.type,
                isValid: videoBlob.size > 0 && videoBlob.type.includes('video'),
                url,
            });

            return () => URL.revokeObjectURL(url);
        } else {
            setDebugInfo({
                hasBlob: false,
                size: 0,
                type: '',
                isValid: false,
            });
        }
    }, [videoBlob]);

    if (process.env.NODE_ENV !== 'development') {
        return null;
    }

    return (
        <div className={`bg-gray-100 p-4 rounded-lg text-sm ${className}`}>
            <h4 className='font-semibold mb-2'>🐛 Video Debug Info</h4>
            {debugInfo && (
                <div className='space-y-1'>
                    <div>
                        Has Blob:{' '}
                        <span
                            className={
                                debugInfo.hasBlob
                                    ? 'text-green-600'
                                    : 'text-red-600'
                            }
                        >
                            {debugInfo.hasBlob ? '' : ''}
                        </span>
                    </div>
                    <div>
                        Size: {(debugInfo.size / (1024 * 1024)).toFixed(2)} MB
                    </div>
                    <div>Type: {debugInfo.type || 'Unknown'}</div>
                    <div>
                        Valid:{' '}
                        <span
                            className={
                                debugInfo.isValid
                                    ? 'text-green-600'
                                    : 'text-red-600'
                            }
                        >
                            {debugInfo.isValid ? '' : ''}
                        </span>
                    </div>
                    {debugInfo.url && (
                        <div>
                            <a
                                href={debugInfo.url}
                                download='debug-video.mp4'
                                className='text-blue-600 hover:underline text-xs'
                            >
                                Download Debug Video
                            </a>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
