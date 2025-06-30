'use client';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, RefreshCw } from 'lucide-react';
import { ScriptGeneration } from '@/hooks/useScriptGeneration';
import type { VideoCreationState } from '@/types/video-creation';

interface ContentScriptStepProps {
    state: VideoCreationState;
    onUpdateState: (updates: Partial<VideoCreationState>) => void;
    scriptGeneration: ScriptGeneration;
    onNextStep: () => void;
}

export function ContentScriptStep({
    state,
    onUpdateState,
    scriptGeneration,
    onNextStep,
}: ContentScriptStepProps) {
    const handleGenerateOutline = async () => {
        if (!state.selectedTopic && !state.videoDescription) {
            return;
        }

        try {
            const outline = await scriptGeneration.generateScript(
                state.selectedTopic || state.videoDescription,
                state.targetAudience,
                state.videoGoal,
                60
            );

            if (outline) {
                onUpdateState({ generatedSummary: outline.contentSummary });
                onNextStep(); // Auto-advance to next step
            }
        } catch (error) {
            // Error is handled in the hook
            console.error('Failed to generate outline:', error);
        }
    };

    const handleRegenerateScript = async () => {
        await scriptGeneration.regenerateScript(
            state.selectedTopic || state.videoDescription,
            state.targetAudience,
            state.videoGoal,
            scriptGeneration.videoOutline?.estimatedDuration || 60
        );
    };

    const handleEditSummary = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onUpdateState({ generatedSummary: e.target.value });
    };

    const handleUpdateScriptItem = (id: number, newText: string) => {
        if (scriptGeneration.updateScriptItem) {
            scriptGeneration.updateScriptItem(id, newText);
        }
    };

    if (!scriptGeneration.videoOutline) {
        return (
            <div className='text-center space-y-4'>
                <div className='w-16 h-16 mx-auto bg-gradient-to-r from-purple-100 to-blue-100 rounded-full flex items-center justify-center'>
                    <Sparkles className='h-8 w-8 text-purple-600' />
                </div>
                <div>
                    <h3 className='text-lg font-semibold mb-2'>
                        Generate AI Content
                    </h3>
                    <p className='text-gray-600 mb-4'>
                        Let our AI create a compelling script and content
                        outline based on your topic and audience.
                    </p>
                    <Button
                        onClick={handleGenerateOutline}
                        disabled={
                            scriptGeneration.isGeneratingOutline ||
                            (!state.selectedTopic && !state.videoDescription)
                        }
                        className='gap-2'
                    >
                        {scriptGeneration.isGeneratingOutline ? (
                            <>
                                <RefreshCw className='h-4 w-4 animate-spin' />
                                Generating Content...
                            </>
                        ) : (
                            <>
                                <Sparkles className='h-4 w-4' />
                                Generate Script & Outline
                            </>
                        )}
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className='space-y-6'>
            <div className='space-y-2'>
                <Label htmlFor='summary'>Content Summary</Label>
                <div className='flex items-center gap-2 mb-2 text-sm text-purple-600'>
                    <Sparkles className='h-4 w-4' />
                    <span>AI-generated summary</span>
                </div>
                <Textarea
                    id='summary'
                    placeholder='Content summary will appear here'
                    value={state.generatedSummary}
                    onChange={handleEditSummary}
                    rows={4}
                    className='resize-none'
                />
            </div>

            <div className='space-y-2'>
                <div className='flex items-center justify-between'>
                    <Label>Script Sections</Label>
                    <div className='flex items-center gap-2'>
                        <div className='flex items-center gap-2 text-sm text-purple-600'>
                            <Sparkles className='h-4 w-4' />
                            <span>AI-generated script</span>
                        </div>
                        <Button
                            variant='outline'
                            size='sm'
                            onClick={handleRegenerateScript}
                            disabled={scriptGeneration.isGeneratingOutline}
                            className='gap-1'
                        >
                            <RefreshCw className='h-3 w-3' />
                            {scriptGeneration.isGeneratingOutline
                                ? 'Regenerating...'
                                : 'Regenerate'}
                        </Button>
                    </div>
                </div>

                <ScrollArea className='h-80 border rounded-lg p-4'>
                    <div className='space-y-4'>
                        {scriptGeneration.videoOutline.scriptSegments.map(
                            (section, index) => (
                                <div key={section.id} className='space-y-2'>
                                    <div className='flex items-center justify-between'>
                                        <Label
                                            htmlFor={`section-${section.id}`}
                                            className='text-sm font-medium text-gray-700'
                                        >
                                            Section {section.id}
                                        </Label>
                                        <Badge
                                            variant='secondary'
                                            className='text-xs'
                                        >
                                            {section.start}s - {section.end}s
                                        </Badge>
                                    </div>
                                    <Textarea
                                        id={`section-${section.id}`}
                                        value={section.text}
                                        onChange={(
                                            e: React.ChangeEvent<HTMLTextAreaElement>
                                        ) =>
                                            handleUpdateScriptItem(
                                                section.id,
                                                e.target.value
                                            )
                                        }
                                        rows={3}
                                        className='resize-none text-sm'
                                        placeholder={`Enter content for section ${section.id}...`}
                                    />
                                    {index <
                                        (scriptGeneration.videoOutline
                                            ?.scriptSegments?.length ?? 0) -
                                            1 && <Separator className='my-3' />}
                                </div>
                            )
                        )}
                    </div>
                </ScrollArea>
            </div>

            {scriptGeneration.videoOutline && (
                <div className='mt-4 p-4 bg-gray-50 rounded-lg border'>
                    <h4 className='font-medium mb-3'>Video Outline Summary</h4>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
                        <div className='space-y-2'>
                            <p>
                                <strong>Total Duration:</strong>{' '}
                                {
                                    scriptGeneration.videoOutline
                                        .estimatedDuration
                                }
                                s
                            </p>
                            <p>
                                <strong>Segments:</strong>{' '}
                                {
                                    scriptGeneration.videoOutline.scriptSegments
                                        .length
                                }
                            </p>
                        </div>
                        <div className='space-y-2'>
                            <p>
                                <strong>Keywords:</strong>
                            </p>
                            <ScrollArea className='h-16'>
                                <div className='flex flex-wrap gap-1'>
                                    {scriptGeneration.videoOutline.keywords.map(
                                        (keyword, index) => (
                                            <Badge
                                                key={index}
                                                variant='outline'
                                                className='text-xs'
                                            >
                                                {keyword}
                                            </Badge>
                                        )
                                    )}
                                </div>
                            </ScrollArea>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
