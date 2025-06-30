import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Video, Eye, Youtube } from 'lucide-react';

interface VideoStatsProps {
    totalVideos: number;
    totalViews: number;
    isYouTubeConnected: boolean;
    isLoadingStats: boolean;
}

export function VideoStats({ 
    totalVideos, 
    totalViews, 
    isYouTubeConnected, 
    isLoadingStats 
}: VideoStatsProps) {
    return (
        <>
            {/* Total Videos Card */}
            <Card>
                <CardHeader className='flex flex-row items-center justify-between pb-2'>
                    <CardTitle className='text-sm font-medium'>
                        Total Videos
                    </CardTitle>
                    <Video className='h-4 w-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                    <div className='text-2xl font-bold'>
                        {isLoadingStats ? (
                            <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                        ) : (
                            totalVideos.toLocaleString()
                        )}
                    </div>
                    <p className='text-xs text-muted-foreground mt-1'>
                        Videos created
                    </p>
                </CardContent>
            </Card>

            {/* Total Views Card */}
            <Card className={`${!isYouTubeConnected ? 'opacity-50' : ''}`}>
                <CardHeader className='flex flex-row items-center justify-between pb-2'>
                    <CardTitle className='text-sm font-medium'>
                        Total Views
                    </CardTitle>
                    <Eye className='h-4 w-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                    <div className='text-2xl font-bold'>
                        {isYouTubeConnected ? (
                            isLoadingStats ? (
                                <div className="animate-pulse bg-gray-200 h-8 w-20 rounded"></div>
                            ) : (
                                totalViews.toLocaleString()
                            )
                        ) : (
                            <span className='text-gray-400'>--</span>
                        )}
                    </div>
                    <p className='text-xs text-muted-foreground mt-1'>
                        {isYouTubeConnected ? 'YouTube views' : 'Connect YouTube to view'}
                    </p>
                </CardContent>
            </Card>
        </>
    );
}
