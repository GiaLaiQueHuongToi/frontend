import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Youtube, ExternalLink, RefreshCw } from 'lucide-react';

interface YouTubeConnectionProps {
    isYouTubeConnected: boolean;
    isConnecting: boolean;
    onConnect: () => void;
    onRefresh: () => void;
}

export function YouTubeConnection({ 
    isYouTubeConnected, 
    isConnecting, 
    onConnect, 
    onRefresh 
}: YouTubeConnectionProps) {
    return (
        <Card>
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
                <CardTitle className='text-sm font-medium'>
                    YouTube Connection
                </CardTitle>
                <Youtube className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
                {isYouTubeConnected ? (
                    <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-2'>
                            <div className='h-2 w-2 rounded-full bg-green-500'></div>
                            <span className='text-sm'>Connected</span>
                        </div>
                        <Button
                            variant='ghost'
                            size='sm'
                            onClick={onRefresh}
                            className='h-6 w-6 p-0'
                        >
                            <RefreshCw className='h-3 w-3' />
                        </Button>
                    </div>
                ) : (
                    <Button
                        variant='outline'
                        size='sm'
                        onClick={onConnect}
                        disabled={isConnecting}
                        className="gap-2 w-full"
                    >
                        {isConnecting ? (
                            <>
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600"></div>
                                Connecting...
                            </>
                        ) : (
                            <>
                                <ExternalLink className='h-3 w-3' />
                                Connect YouTube
                            </>
                        )}
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}
