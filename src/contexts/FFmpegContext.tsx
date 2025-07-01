'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { initializeFFmpeg } from '@/utils/videoGenerator';

interface FFmpegContextType {
    ffmpeg: any | null;
    isLoading: boolean;
    error: string | null;
    reinitialize: () => Promise<void>;
}

const FFmpegContext = createContext<FFmpegContextType | undefined>(undefined);

export function FFmpegProvider({ children }: { children: React.ReactNode }) {
    const [ffmpeg, setFFmpeg] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const initFFmpeg = async () => {
        try {
            setIsLoading(true);
            setError(null);
            console.log('🔄 Initializing FFmpeg...');

            const ffmpegInstance = await initializeFFmpeg();
            console.log('✅ FFmpeg initialized successfully');
            setFFmpeg(ffmpegInstance);
        } catch (err) {
            console.error('❌ Failed to initialize FFmpeg:', err);
            const errorMessage =
                err instanceof Error ? err.message : 'Unknown error';
            setError(`Failed to load video processing engine: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // Only load FFmpeg on client side
        if (typeof window !== 'undefined') {
            initFFmpeg();
        }
    }, []);

    const reinitialize = async () => {
        await initFFmpeg();
    };

    return (
        <FFmpegContext.Provider
            value={{ ffmpeg, isLoading, error, reinitialize }}
        >
            {children}
        </FFmpegContext.Provider>
    );
}

export function useFFmpeg() {
    const context = useContext(FFmpegContext);
    if (context === undefined) {
        throw new Error('useFFmpeg must be used within a FFmpegProvider');
    }
    return context;
}
