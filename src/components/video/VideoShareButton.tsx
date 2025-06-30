import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2, Link as LinkIcon, ExternalLink, Copy } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';
import { videoService, type VideoResponse } from '@/services/videoService';

interface VideoShareButtonProps {
    video: VideoResponse;
    variant?: 'default' | 'outline' | 'ghost';
    size?: 'default' | 'sm' | 'lg';
}

export function VideoShareButton({ video, variant = 'outline', size = 'sm' }: VideoShareButtonProps) {
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);

    const handleSharePage = async () => {
        try {
            const success = await videoService.shareVideo(video.id);
            if (success) {
                toast({
                    title: 'Link Copied',
                    description: 'Video page link copied to clipboard.',
                });
            } else {
                throw new Error('Share failed');
            }
        } catch (error) {
            toast({
                title: 'Share Failed',
                description: 'Could not copy link to clipboard.',
                variant: 'destructive',
            });
        }
        setIsOpen(false);
    };

    const handleShareDirect = async () => {
        try {
            const directUrl = videoService.getDirectVideoUrl(video);
            await navigator.clipboard.writeText(directUrl);
            toast({
                title: 'Direct Link Copied',
                description: 'Direct video link copied to clipboard.',
            });
        } catch (error) {
            toast({
                title: 'Share Failed',
                description: 'Could not copy direct link.',
                variant: 'destructive',
            });
        }
        setIsOpen(false);
    };

    const handleShareEmbed = async () => {
        try {
            const embedUrl = videoService.generateEmbedUrl(video.id);
            await navigator.clipboard.writeText(embedUrl);
            toast({
                title: 'Embed Link Copied',
                description: 'Embed link copied to clipboard.',
            });
        } catch (error) {
            toast({
                title: 'Share Failed',
                description: 'Could not copy embed link.',
                variant: 'destructive',
            });
        }
        setIsOpen(false);
    };

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant={variant}
                    size={size}
                    className='gap-2'
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                    }}
                >
                    <Share2 className='h-4 w-4' />
                    {size !== 'sm' && 'Share'}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleSharePage}>
                    <LinkIcon className='mr-2 h-4 w-4' />
                    <span>Copy Page Link</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleShareDirect}>
                    <ExternalLink className='mr-2 h-4 w-4' />
                    <span>Copy Video URL</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleShareEmbed}>
                    <Copy className='mr-2 h-4 w-4' />
                    <span>Copy Embed Link</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
