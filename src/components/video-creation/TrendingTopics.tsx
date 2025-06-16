"use client";

import { Badge } from "@/components/ui/badge";

interface TrendingTopicsProps {
  topics: string[];
  selectedTopic: string;
  onTopicSelect: (topic: string) => void;
}

export function TrendingTopics({ topics, selectedTopic, onTopicSelect }: TrendingTopicsProps) {
  return (
    <div className="space-y-3">
      <h3 className="font-medium text-gray-900">Trending Topics</h3>
      <div className="flex flex-wrap gap-2">
        {topics.map((topic) => (
          <Badge
            key={topic}
            variant={selectedTopic === topic ? "default" : "secondary"}
            className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
            onClick={() => onTopicSelect(topic)}
          >
            {topic}
          </Badge>
        ))}
      </div>
    </div>
  );
}
