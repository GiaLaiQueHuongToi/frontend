'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Upload, Loader2, X } from 'lucide-react';
import { youtubeUploadService } from '@/services/youtubeUploadService';
import type { VideoResponse } from '@/services/videoService';

interface YouTubeUploadDialogProps {
    video: VideoResponse;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (youtubeVideoId: string, youtubeUrl: string, publishedVideo?: any) => void;
}

export function YouTubeUploadDialog({ video, isOpen, onClose, onSuccess }: YouTubeUploadDialogProps) {
    const { toast } = useToast();
    
    // Form state
    const [title, setTitle] = useState(video.title || '');
    const [description, setDescription] = useState(video.description || '');
    const [privacy, setPrivacy] = useState<'private' | 'unlisted' | 'public'>('public');
    const [tags, setTags] = useState('');
    const [category, setCategory] = useState('22'); // People & Blogs
    
    // Upload state
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const handleUpload = async () => {
        if (!video) return;

        try {
            setIsUploading(true);
            setUploadProgress(0);
            
            toast({
                title: 'Starting Upload',
                description: 'Uploading your video to YouTube...',
            });

            // First, we need to get the video blob from the video URL
            const videoBlob = await fetch(video.videoUrl).then(res => res.blob());

            const uploadRequest = {
                title: title.trim() || video.title,
                description: description.trim() || video.description || '',
                privacyStatus: privacy,
                tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
                categoryId: category,
                videoBlob: videoBlob,
            };

            const result = await youtubeUploadService.uploadVideo(
                uploadRequest,
                video.id,
                (progress) => {
                    setUploadProgress(progress.percentage);
                }
            );

            if (result.success) {
                toast({
                    title: 'Upload Successful!',
                    description: `Video uploaded to YouTube: ${result.videoUrl}`,
                });
                
                onSuccess(result.videoId || '', result.videoUrl || '', result.publishedVideo);
                onClose();
            } else {
                throw new Error(result.error || 'Upload failed');
            }
            
        } catch (error) {
            console.error('YouTube upload error:', error);
            toast({
                title: 'Upload Failed',
                description: error instanceof Error ? error.message : 'Failed to upload video to YouTube',
                variant: 'destructive',
            });
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    const handleClose = () => {
        if (!isUploading) {
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-red-600 rounded flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                            </svg>
                        </div>
                        Upload to YouTube
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Video Preview */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">Video Preview</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="aspect-video bg-gray-900 rounded-md overflow-hidden">
                                <video
                                    src={video.videoUrl}
                                    className="w-full h-full object-contain"
                                    controls
                                    preload="metadata"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Upload Form */}
                    <div className="space-y-4">
                        {/* Title */}
                        <div>
                            <Label htmlFor="youtube-title">Title *</Label>
                            <Input
                                id="youtube-title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Enter video title"
                                maxLength={100}
                                disabled={isUploading}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                {title.length}/100 characters
                            </p>
                        </div>

                        {/* Description */}
                        <div>
                            <Label htmlFor="youtube-description">Description</Label>
                            <Textarea
                                id="youtube-description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Enter video description"
                                rows={4}
                                maxLength={5000}
                                disabled={isUploading}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                {description.length}/5000 characters
                            </p>
                        </div>

                        {/* Privacy */}
                        <div>
                            <Label>Privacy</Label>
                            <Select value={privacy} onValueChange={(value: any) => setPrivacy(value)} disabled={isUploading}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="private">Private</SelectItem>
                                    <SelectItem value="unlisted">Unlisted</SelectItem>
                                    <SelectItem value="public">Public</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Tags */}
                        <div>
                            <Label htmlFor="youtube-tags">Tags</Label>
                            <Input
                                id="youtube-tags"
                                value={tags}
                                onChange={(e) => setTags(e.target.value)}
                                placeholder="tag1, tag2, tag3"
                                disabled={isUploading}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Separate tags with commas
                            </p>
                        </div>

                        {/* Category
                        <div>
                            <Label>Category</Label>
                            <Select value={category} onValueChange={setCategory} disabled={isUploading}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">Film & Animation</SelectItem>
                                    <SelectItem value="2">Autos & Vehicles</SelectItem>
                                    <SelectItem value="10">Music</SelectItem>
                                    <SelectItem value="15">Pets & Animals</SelectItem>
                                    <SelectItem value="17">Sports</SelectItem>
                                    <SelectItem value="19">Travel & Events</SelectItem>
                                    <SelectItem value="20">Gaming</SelectItem>
                                    <SelectItem value="22">People & Blogs</SelectItem>
                                    <SelectItem value="23">Comedy</SelectItem>
                                    <SelectItem value="24">Entertainment</SelectItem>
                                    <SelectItem value="25">News & Politics</SelectItem>
                                    <SelectItem value="26">Howto & Style</SelectItem>
                                    <SelectItem value="27">Education</SelectItem>
                                    <SelectItem value="28">Science & Technology</SelectItem>
                                </SelectContent>
                            </Select>
                        </div> */}
                    </div>

                    {/* Upload Progress */}
                    {isUploading && (
                        <Card>
                            <CardContent className="pt-6">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="flex items-center gap-2">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Uploading to YouTube...
                                        </span>
                                        <span>{uploadProgress.toFixed(1)}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-red-600 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${uploadProgress}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 text-center">
                                        This may take several minutes depending on video size
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button
                            variant="outline"
                            onClick={handleClose}
                            disabled={isUploading}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleUpload}
                            disabled={isUploading || !title.trim()}
                            className="gap-2"
                        >
                            {isUploading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Upload className="h-4 w-4" />
                            )}
                            {isUploading ? 'Uploading...' : 'Upload to YouTube'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export { YouTubeUploadDialog as default };