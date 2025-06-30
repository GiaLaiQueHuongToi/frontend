import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { videoService, type VideoResponse } from '@/services/videoService';

interface VideoDownloadButtonProps {
    video: VideoResponse;
    variant?: 'default' | 'outline' | 'ghost';
    size?: 'default' | 'sm' | 'lg';
}

export function VideoDownloadButton({ video, variant = 'outline', size = 'sm' }: VideoDownloadButtonProps) {
    const { toast } = useToast();

    const handleDownload = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        try {
            const success = await videoService.downloadVideo(video);
            if (success) {
                toast({
                    title: 'Download Started',
                    description: `Downloading "${video.title}"...`,
                });
            } else {
                throw new Error('Download failed');
            }
        } catch (error) {
            console.error('Download error:', error);
            toast({
                title: 'Download Failed',
                description: 'Could not download the video. Please try again.',
                variant: 'destructive',
            });
        }
    };

    return (
        <Button
            variant={variant}
            size={size}
            className='gap-2'
            onClick={handleDownload}
        >
            <Download className='h-4 w-4' />
            {size !== 'sm' && 'Download'}
        </Button>
    );
}
