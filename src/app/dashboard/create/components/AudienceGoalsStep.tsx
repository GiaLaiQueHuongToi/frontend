"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { VideoCreationState } from "@/types/video-creation";
import { Wand2 } from "lucide-react";

interface AudienceGoalsStepProps {
  state: VideoCreationState;
  onUpdateState: (updates: Partial<VideoCreationState>) => void;
  onGenerateOutline: () => Promise<void>;
}

const audiencesOptions = [
  {
    value: "general",
    label: "General Public",
    description: "Broad audience with diverse interests",
  },
  {
    value: "students",
    label: "Students",
    description: "Learners seeking educational content",
  },
  {
    value: "professionals",
    label: "Professionals",
    description: "Individuals looking to enhance their skills",
  },
  {
    value: "educators",
    label: "Educators",
    description: "Teachers and trainers sharing knowledge",
  },
  {
    value: "enthusiasts",
    label: "Tech Enthusiasts",
    description: "Fans of the latest technology trends",
  },
];

const goalsOptions = [
  {
    value: "educate",
    label: "Educate & Inform",
    description: "Provide valuable information and insights",
    icon: "📚",
  },
  {
    value: "entertain",
    label: "Entertain",
    description: "Engage the audience with fun and enjoyable content",
    icon: "🎭",
  },
  {
    value: "inspire",
    label: "Inspire & Motivate",
    description: "Encourage positive action and change",
    icon: "✨",
  },
  {
    value: "explain",
    label: "Explain a Concept",
    description: "Break down complex ideas into understandable segments",
    icon: "💡",
  },
  {
    value: "promote",
    label: "Promote an Idea",
    description: "Advocate for a specific viewpoint or product",
    icon: "📢",
  },
];

export function AudienceGoalsStep({
  state,
  onUpdateState,
  onGenerateOutline,
}: AudienceGoalsStepProps) {
  const handleAudienceChange = (value: string) => {
    onUpdateState({ targetAudience: value });
  };

  const handleGoalChange = (value: string) => {
    onUpdateState({ videoGoal: value });
  };

  const isDisabled = !state.targetAudience || !state.videoGoal;
  const isLoading = state.isGenerating;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="targetAudience">Target Audience</Label>
        <Select
          value={state.targetAudience}
          onValueChange={handleAudienceChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select your target audience" />
          </SelectTrigger>
          <SelectContent>
            {audiencesOptions.map((audience) => (
              <SelectItem key={audience.value} value={audience.value}>
                {audience.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {state.targetAudience && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
            <h4 className="font-medium mb-2">Audience Preview</h4>
            <div className="flex items-center gap-3">
              <img
                src="/placeholder-avatar.svg"
                alt={state.targetAudience}
                className="w-15 h-15 rounded-full"
              />
              <div>
                <p className="font-medium capitalize">{state.targetAudience}</p>
                <p className="text-sm text-gray-600">
                  {
                    audiencesOptions.find(
                      (audience) => audience.value === state.targetAudience
                    )?.description
                  }
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="videoGoal">Video Goal</Label>
        <Select value={state.videoGoal} onValueChange={handleGoalChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select the main goal of your video" />
          </SelectTrigger>
          <SelectContent>
            {goalsOptions.map((goal) => (
              <SelectItem key={goal.value} value={goal.value}>
                {goal.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {state.videoGoal && (
          <div className="mt-3 p-3 bg-green-50 rounded-lg">
            <h4 className="font-medium mb-2">Goal Preview</h4>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                {
                  goalsOptions.find((goal) => goal.value === state.videoGoal)
                    ?.icon
                }
              </div>
              <div>
                <p className="font-medium capitalize">{state.videoGoal}</p>
                <p className="text-sm text-gray-600">
                  {
                    goalsOptions.find((goal) => goal.value === state.videoGoal)
                      ?.description
                  }
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <Button
        className={`w-full gap-2 ${
          isDisabled || isLoading
            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
            : "bg-purple-600 hover:bg-purple-700 text-white"
        }`}
        onClick={onGenerateOutline}
        disabled={isDisabled || isLoading}
      >
        <Wand2 className="h-4 w-4" />
        {isLoading ? "Generating with Gemini AI..." : "Generate Video Outline"}
      </Button>
    </div>
  );
}
