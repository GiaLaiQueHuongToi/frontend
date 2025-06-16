"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import type { VideoCreationState } from "@/types/video-creation";

interface PreviewFinalizeStepProps {
  state: VideoCreationState;
  onUpdateState: (updates: Partial<VideoCreationState>) => void;
  onFinish: () => void;
}

export function PreviewFinalizeStep({ state, onUpdateState, onFinish }: PreviewFinalizeStepProps) {
  return (
    <div className="space-y-6">
      <div className="aspect-video bg-gray-900 rounded-md overflow-hidden relative">
        <Image
          src={state.previewUrl || "/placeholder.svg"}
          alt="Video preview"
          fill
          className="object-cover"
        />
      </div>

      <div className="space-y-4">
        <div>
          <Label className="mb-2 block">Adjust Voice Speed</Label>
          <Slider defaultValue={[50]} max={100} step={1} />
        </div>

        <div>
          <Label className="mb-2 block">Caption Size</Label>
          <Slider defaultValue={[50]} max={100} step={1} />
        </div>

        <div className="flex items-center space-x-2">
          <Switch id="background-music" />
          <Label htmlFor="background-music">Add Background Music</Label>
        </div>
      </div>

      <Button className="w-full" onClick={onFinish}>
        Create Final Video
      </Button>
    </div>
  );
}
