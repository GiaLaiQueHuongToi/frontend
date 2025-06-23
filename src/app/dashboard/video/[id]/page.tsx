'use client';

import type React from 'react';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Download, Share2, Edit } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';

// Mock video data
const mockVideoDetails = {
    id: '1',
    title: 'Top 10 AI Trends in 2025',
    description:
        'Exploring the most exciting AI trends that will shape the future of technology in 2025.',
    videoUrl: 'https://example.com/video.mp4', // This would be a real video URL in production
    thumbnail: '/placeholder.svg?height=360&width=640',
    views: 1245,
    createdAt: '2025-05-28',
};

export default function VideoDetailPage() {
    const params = useParams();
    const { id } = params;
    const { toast } = useToast();
    const [isPlaying, setIsPlaying] = useState(false);

    const handleDownload = () => {
        toast({
            title: 'Download started',
            description: 'Your video is being downloaded.',
        });
    };

    const handleShare = () => {
        // In a real app, this would copy a share link to clipboard
        navigator.clipboard.writeText(`https://yourdomain.com/share/${id}`);
        toast({
            title: 'Link copied',
            description: 'Video share link copied to clipboard.',
        });
    };

    return (
        <div className='container mx-auto p-6'>
            <div className='mb-6'>
                <Link
                    href='/dashboard'
                    className='flex items-center gap-2 text-gray-600 hover:text-purple-600 mb-4'
                >
                    <ArrowLeft className='h-4 w-4' />
                    <span>Back to Dashboard</span>
                </Link>
                <h1 className='text-3xl font-bold'>{mockVideoDetails.title}</h1>
                <div className='flex items-center gap-2 text-sm text-gray-500 mt-2'>
                    <span>{mockVideoDetails.views} views</span>
                    <span>•</span>
                    <span>Created on {mockVideoDetails.createdAt}</span>
                </div>
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
                <div className='lg:col-span-2'>
                    <Card className='overflow-hidden'>
                        <div className='aspect-video bg-gray-900 relative flex items-center justify-center'>
                            {/* This would be a real video player in production */}
                            <div
                                className='w-full h-full cursor-pointer flex items-center justify-center'
                                onClick={() => setIsPlaying(!isPlaying)}
                            >
                                {isPlaying ? (
                                    <div className='text-white text-lg'>
                                        Video is playing...
                                    </div>
                                ) : (
                                    <>
                                        <img
                                            src={
                                                mockVideoDetails.thumbnail ||
                                                '/placeholder.svg'
                                            }
                                            alt={mockVideoDetails.title}
                                            className='w-full h-full object-cover opacity-70'
                                        />
                                        <div className='absolute inset-0 flex items-center justify-center'>
                                            <div className='w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center'>
                                                <div className='w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center'>
                                                    <div className='w-0 h-0 border-t-8 border-t-transparent border-l-12 border-l-white border-b-8 border-b-transparent ml-1'></div>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                        <CardContent className='p-4'>
                            <p className='text-gray-700'>
                                {mockVideoDetails.description}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div>
                    <Card>
                        <CardContent className='p-4 space-y-4'>
                            <h3 className='font-medium'>Video Actions</h3>

                            <div className='grid grid-cols-2 gap-3'>
                                <Button
                                    variant='outline'
                                    className='w-full flex items-center gap-2'
                                    onClick={handleDownload}
                                >
                                    <Download className='h-4 w-4' />
                                    Download
                                </Button>
                                <Button
                                    variant='outline'
                                    className='w-full flex items-center gap-2'
                                    onClick={handleShare}
                                >
                                    <Share2 className='h-4 w-4' />
                                    Share
                                </Button>
                            </div>

                            <div className='pt-4 border-t'>
                                <h3 className='font-medium mb-3'>Publishing</h3>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant='outline'
                                            className='w-full'
                                        >
                                            Publish to Platform
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuItem>
                                            <Youtube className='mr-2 h-4 w-4' />
                                            <span>YouTube</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                            <TikTok className='mr-2 h-4 w-4' />
                                            <span>TikTok</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                            <Instagram className='mr-2 h-4 w-4' />
                                            <span>Instagram</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

// Simple icon components for social platforms
function Youtube(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns='http://www.w3.org/2000/svg'
            width='24'
            height='24'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
        >
            <path d='M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17' />
            <path d='m10 15 5-3-5-3z' />
        </svg>
    );
}

function TikTok(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns='http://www.w3.org/2000/svg'
            width='24'
            height='24'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
        >
            <path d='M9 12a4 4 0 1 0 0 8 4 4 0 0 0 0-8z' />
            <path d='M16 8v8' />
            <path d='M12 16v-8' />
            <path d='M20 12V8h-4' />
            <path d='M16 8a4 4 0 0 0-4-4' />
        </svg>
    );
}

function Instagram(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns='http://www.w3.org/2000/svg'
            width='24'
            height='24'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
        >
            <rect width='20' height='20' x='2' y='2' rx='5' ry='5' />
            <path d='M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z' />
            <line x1='17.5' x2='17.51' y1='6.5' y2='6.5' />
        </svg>
    );
}
