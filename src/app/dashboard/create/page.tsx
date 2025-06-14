"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, ArrowRight, Search, Sparkles, Wand2, Mic, Video } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { RefreshCw, Play, Scissors, Copy, Trash2, Plus } from "lucide-react"
import { geminiService, type VideoOutlineRequest, type VideoOutlineResponse } from "@/services/geminiService"
import Link from "next/link"

// Mock trending topics
const trendingTopics = [
  "AI in Education",
  "Sustainable Living",
  "Future of Work",
  "Space Exploration",
  "Health Tech Innovations",
]

export default function CreateVideoPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const [videoTitle, setVideoTitle] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [topicSource, setTopicSource] = useState("trending")
  const [selectedTopic, setSelectedTopic] = useState("")
  const [targetAudience, setTargetAudience] = useState("")
  const [videoGoal, setVideoGoal] = useState("")
  const [generatedSummary, setGeneratedSummary] = useState("")
  const [generatedScript, setGeneratedScript] = useState([
    { id: 1, text: "Introduction to the topic and why it matters." },
    { id: 2, text: "Key point 1 with supporting details." },
    { id: 3, text: "Key point 2 with examples and statistics." },
    { id: 4, text: "Conclusion and call to action." },
  ])
  const [videoStyle, setVideoStyle] = useState("")
  const [language, setLanguage] = useState("vietnamese")
  const [voiceType, setVoiceType] = useState("female")
  const [captionStyle, setCaptionStyle] = useState("modern")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isPreviewReady, setIsPreviewReady] = useState(false)
  const [previewUrl, setPreviewUrl] = useState("/placeholder.svg")
  
  // New state for Gemini integration
  const [videoOutline, setVideoOutline] = useState<VideoOutlineResponse | null>(null)
  const [isGeneratingOutline, setIsGeneratingOutline] = useState(false)
  
  // Complete search results data
  const [searchResults, setSearchResults] = useState([
    { id: 1, title: "AI Tutorial for Beginners", thumbnail: "/placeholder-thumbnail.svg", views: "1.2M" },
    { id: 2, title: "Machine Learning Explained", thumbnail: "/placeholder-thumbnail.svg", views: "890K" },
    {
      id: 3,
      title: "Future of Artificial Intelligence",
      thumbnail: "/placeholder-thumbnail.svg",
      views: "2.1M",
    },
  ])
  
  const [selectedAudiencePreview, setSelectedAudiencePreview] = useState("")
  const [selectedGoalPreview, setSelectedGoalPreview] = useState("")
  const [selectedVoicePreview, setSelectedVoicePreview] = useState("")
  const [selectedCaptionPreview, setSelectedCaptionPreview] = useState("")
  
  // Complete editing phase data
  const [editingPhase, setEditingPhase] = useState<{
    timeline: Array<{ id: number; type: string; content: string; duration: number }>;
    selectedElement: number | null;
    playhead: number;
  }>({
    timeline: [
      { id: 1, type: "image", content: "Introduction scene", duration: 3 },
      { id: 2, type: "image", content: "Main content", duration: 5 },
      { id: 3, type: "image", content: "Conclusion", duration: 2 },
    ],
    selectedElement: null,
    playhead: 0,
  })

  // Generate video outline using Gemini AI
  const generateVideoOutline = async () => {
    if (!selectedTopic && !videoTitle) {
      toast({
        title: "Missing information",
        description: "Please select a topic or enter a video title first.",
        variant: "destructive",
      })
      return
    }

    if (!targetAudience || !videoGoal) {
      toast({
        title: "Missing information", 
        description: "Please select target audience and video goal.",
        variant: "destructive",
      })
      return
    }

    setIsGeneratingOutline(true)
    
    try {
      const request: VideoOutlineRequest = {
        description: selectedTopic || videoTitle,
        targetAudience: targetAudience,
        videoGoal: videoGoal
      }

      toast({
        title: "Generating content with Gemini AI",
        description: "Creating your video outline...",
      })

      const outline = await geminiService.generateVideoOutline(request)
      
      setVideoOutline(outline)
      setGeneratedSummary(outline.contentSummary)
      
      // Convert chapters to script format
      setGeneratedScript(outline.chapters.map(chapter => ({
        id: chapter.id,
        text: `${chapter.title}: ${chapter.content}`
      })))

      toast({
        title: "Video outline generated!",
        description: `Created ${outline.chapters.length} chapters with ${outline.estimatedDuration}s total duration.`,
      })

      // Auto-advance to next step
      setCurrentStep(3)
    } catch (error) {
      console.error('Error generating outline:', error)
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingOutline(false)
    }
  }

  // Regenerate script using Gemini
  const regenerateScript = async () => {
    if (!selectedTopic && !videoTitle) {
      toast({
        title: "Missing information",
        description: "Please provide a topic or title first.",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    
    try {
      const scriptSections = await geminiService.generateScript(
        selectedTopic || videoTitle,
        targetAudience || "general public",
        videoOutline?.estimatedDuration || 80
      )

      setGeneratedScript(scriptSections.map((text, index) => ({
        id: index + 1,
        text: text
      })))

      toast({
        title: "Script regenerated!",
        description: "New script content has been generated with AI.",
      })
    } catch (error) {
      console.error('Error regenerating script:', error)
      toast({
        title: "Regeneration failed",
        description: "Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleNextStep = () => {
    if (currentStep === 2) {
      generateVideoOutline()
    } else if (currentStep === 6) {
      generatePreview()
    } else {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevStep = () => {
    setCurrentStep(currentStep - 1)
  }

  const updateScriptItem = (id: number, newText: string) => {
    setGeneratedScript(generatedScript.map((item) => (item.id === id ? { ...item, text: newText } : item)))
  }

  const generatePreview = () => {
    setIsGenerating(true)
    toast({
      title: "Generating preview",
      description: "This may take a moment...",
    })

    setTimeout(() => {
      setIsPreviewReady(true)
      setIsGenerating(false)
      setCurrentStep(7)
    }, 3000)
  }

  const handleFinish = () => {
    toast({
      title: "Video created successfully!",
      description: "Your video has been saved to your dashboard.",
    })
    router.push("/dashboard")
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="videoTitle">Video Title</Label>
              <Input
                id="videoTitle"
                placeholder="Enter a title for your video"
                value={videoTitle}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVideoTitle(e.target.value)}
              />
            </div>

            <div className="space-y-4">
              <Label>Topic Source</Label>
              <RadioGroup value={topicSource} onValueChange={setTopicSource} className="flex flex-col space-y-3">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="trending" id="trending" />
                  <Label htmlFor="trending" className="cursor-pointer">
                    Use trending topics
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="search" id="search" />
                  <Label htmlFor="search" className="cursor-pointer">
                    Search for a specific topic
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {topicSource === "trending" ? (
              <div className="space-y-4">
                <Label>Select a Trending Topic</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {trendingTopics.map((topic, index) => (
                    <div
                      key={topic}
                      className={`p-3 border rounded-md cursor-pointer transition-colors ${
                        selectedTopic === topic ? "border-purple-500 bg-purple-50" : "hover:border-gray-400"
                      }`}
                      onClick={() => setSelectedTopic(topic)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-md overflow-hidden bg-gray-100">
                          <img
                            src="/placeholder-small.svg"
                            alt={topic}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-purple-500" />
                            <span className="font-medium">{topic}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Trending now</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {selectedTopic && (
                  <div className="mt-4 p-4 bg-purple-50 rounded-lg">
                    <h4 className="font-medium mb-2">Topic Preview</h4>
                    <div className="aspect-video bg-gray-100 rounded-md flex items-center justify-center mb-2">
                      <img
                        src="/placeholder.svg"
                        alt={selectedTopic}
                        className="w-full h-full object-cover rounded-md"
                      />
                    </div>
                    <p className="text-sm text-gray-600">
                      This topic is currently trending with high engagement rates.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="searchTopic">Search for a Topic</Label>
                  <div className="flex gap-2">
                    <Input
                      id="searchTopic"
                      placeholder="Enter keywords to search"
                      value={searchQuery}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                    />
                    <Button variant="outline" size="icon">
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {searchQuery && (
                  <div className="space-y-3">
                    <h4 className="font-medium">Search Results Preview</h4>
                    <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto">
                      {searchResults.map((result) => (
                        <div
                          key={result.id}
                          className="flex gap-3 p-3 border rounded-md hover:bg-gray-50 cursor-pointer"
                          onClick={() => setSelectedTopic(result.title)}
                        >
                          <img
                            src={result.thumbnail || "/placeholder-thumbnail.svg"}
                            alt={result.title}
                            className="w-20 h-12 object-cover rounded"
                          />
                          <div className="flex-1">
                            <h5 className="font-medium text-sm">{result.title}</h5>
                            <p className="text-xs text-gray-500">{result.views} views</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="targetAudience">Target Audience</Label>
              <Select
                value={targetAudience}
                onValueChange={(value: string) => {
                  setTargetAudience(value)
                  setSelectedAudiencePreview(value)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your target audience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General Public</SelectItem>
                  <SelectItem value="students">Students</SelectItem>
                  <SelectItem value="professionals">Professionals</SelectItem>
                  <SelectItem value="educators">Educators</SelectItem>
                  <SelectItem value="enthusiasts">Tech Enthusiasts</SelectItem>
                </SelectContent>
              </Select>

              {selectedAudiencePreview && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <h4 className="font-medium mb-2">Audience Preview</h4>
                  <div className="flex items-center gap-3">
                    <img
                      src="/placeholder-avatar.svg"
                      alt={selectedAudiencePreview}
                      className="w-15 h-15 rounded-full"
                    />
                    <div>
                      <p className="font-medium capitalize">{selectedAudiencePreview}</p>
                      <p className="text-sm text-gray-600">
                        {selectedAudiencePreview === "students" && "Young learners seeking educational content"}
                        {selectedAudiencePreview === "professionals" && "Working adults looking for industry insights"}
                        {selectedAudiencePreview === "general" && "Broad audience with diverse interests"}
                        {selectedAudiencePreview === "educators" && "Teachers and educational professionals"}
                        {selectedAudiencePreview === "enthusiasts" && "Tech-savvy individuals passionate about innovation"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="videoGoal">Video Goal</Label>
              <Select
                value={videoGoal}
                onValueChange={(value: string) => {
                  setVideoGoal(value)
                  setSelectedGoalPreview(value)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select the main goal of your video" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="educate">Educate & Inform</SelectItem>
                  <SelectItem value="entertain">Entertain</SelectItem>
                  <SelectItem value="inspire">Inspire & Motivate</SelectItem>
                  <SelectItem value="explain">Explain a Concept</SelectItem>
                  <SelectItem value="promote">Promote an Idea</SelectItem>
                </SelectContent>
              </Select>

              {selectedGoalPreview && (
                <div className="mt-3 p-3 bg-green-50 rounded-lg">
                  <h4 className="font-medium mb-2">Goal Preview</h4>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                      {selectedGoalPreview === "educate" && "📚"}
                      {selectedGoalPreview === "entertain" && "🎭"}
                      {selectedGoalPreview === "inspire" && "✨"}
                      {selectedGoalPreview === "explain" && "💡"}
                      {selectedGoalPreview === "promote" && "📢"}
                    </div>
                    <div>
                      <p className="font-medium capitalize">{selectedGoalPreview}</p>
                      <p className="text-sm text-gray-600">
                        {selectedGoalPreview === "educate" && "Focus on teaching and knowledge sharing"}
                        {selectedGoalPreview === "entertain" && "Create engaging and fun content"}
                        {selectedGoalPreview === "inspire" && "Motivate and uplift your audience"}
                        {selectedGoalPreview === "explain" && "Break down complex topics simply"}
                        {selectedGoalPreview === "promote" && "Advocate for ideas and concepts"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {videoOutline && (
              <div className="mt-4 p-4 bg-purple-50 rounded-lg">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-600" />
                  AI-Generated Insights
                </h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Estimated Duration:</strong> {videoOutline.estimatedDuration} seconds</p>
                  <p><strong>Chapters:</strong> {videoOutline.chapters.length}</p>
                  <p><strong>Keywords:</strong> {videoOutline.keywords.join(", ")}</p>
                </div>
              </div>
            )}

            <Button 
              className="w-full gap-2" 
              onClick={generateVideoOutline} 
              disabled={isGeneratingOutline || !targetAudience || !videoGoal || (!selectedTopic && !videoTitle)}
            >
              <Wand2 className="h-4 w-4" />
              {isGeneratingOutline ? "Generating with Gemini AI..." : "Generate Video Outline"}
            </Button>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="summary">Content Summary</Label>
              <div className="flex items-center gap-2 mb-2 text-sm text-purple-600">
                <Sparkles className="h-4 w-4" />
                <span>AI-generated summary</span>
              </div>
              <Textarea
                id="summary"
                placeholder="Content summary will appear here"
                value={generatedSummary}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setGeneratedSummary(e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Script Sections</Label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 text-sm text-purple-600">
                    <Sparkles className="h-4 w-4" />
                    <span>AI-generated script</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={regenerateScript}
                    disabled={isGenerating}
                    className="gap-1"
                  >
                    <RefreshCw className="h-3 w-3" />
                    {isGenerating ? "Regenerating..." : "Regenerate"}
                  </Button>
                </div>
              </div>
              <div className="space-y-3">
                {generatedScript.map((section) => (
                  <div key={section.id} className="space-y-1">
                    <Label htmlFor={`section-${section.id}`} className="text-sm text-gray-500">
                      Section {section.id}
                      {videoOutline?.chapters[section.id - 1] && (
                        <span className="ml-2 text-xs text-purple-600">
                          (~{videoOutline.chapters[section.id - 1].duration}s)
                        </span>
                      )}
                    </Label>
                    <Textarea
                      id={`section-${section.id}`}
                      value={section.text}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateScriptItem(section.id, e.target.value)}
                      rows={2}
                    />
                  </div>
                ))}
              </div>
            </div>

            {videoOutline && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Video Outline Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><strong>Total Duration:</strong> {videoOutline.estimatedDuration}s</p>
                    <p><strong>Chapters:</strong> {videoOutline.chapters.length}</p>
                  </div>
                  <div>
                    <p><strong>Keywords:</strong></p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {videoOutline.keywords.map((keyword, index) => (
                        <span key={index} className="bg-purple-100 text-purple-800 px-2 py-1 rounded-md text-xs">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Video Style</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    id: "minimalist",
                    name: "Minimalist",
                    desc: "Clean design with simple visuals",
                    color: "bg-gray-100",
                  },
                  { id: "dynamic", name: "Dynamic", desc: "Energetic with motion graphics", color: "bg-purple-100" },
                  {
                    id: "educational",
                    name: "Educational",
                    desc: "Focus on clarity and information",
                    color: "bg-blue-100",
                  },
                  {
                    id: "storytelling",
                    name: "Storytelling",
                    desc: "Narrative-focused with emotional appeal",
                    color: "bg-green-100",
                  },
                ].map((style) => (
                  <div
                    key={style.id}
                    className={`p-4 border rounded-md cursor-pointer transition-colors ${
                      videoStyle === style.id ? "border-purple-500 bg-purple-50" : "hover:border-gray-400"
                    }`}
                    onClick={() => setVideoStyle(style.id)}
                  >
                    <div className="flex flex-col items-center gap-2 text-center">
                      <div
                        className={`w-full aspect-video ${style.color} flex items-center justify-center rounded-md relative overflow-hidden`}
                      >
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-xs font-medium text-gray-600">{style.name} Preview</div>
                        </div>
                        {style.id === "minimalist" && (
                          <div className="absolute bottom-2 left-2 w-8 h-1 bg-gray-400 rounded"></div>
                        )}
                        {style.id === "dynamic" && (
                          <div className="absolute top-2 right-2 w-4 h-4 bg-purple-400 rounded-full animate-pulse"></div>
                        )}
                        {style.id === "educational" && (
                          <div className="absolute bottom-2 left-2 text-xs bg-blue-200 px-2 py-1 rounded">Info</div>
                        )}
                        {style.id === "storytelling" && (
                          <div className="absolute bottom-2 right-2 w-6 h-1 bg-green-400 rounded"></div>
                        )}
                      </div>
                      <span className="font-medium">{style.name}</span>
                      <span className="text-xs text-gray-500">{style.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Language</Label>
              <div className="flex gap-4">
                <RadioGroup value={language} onValueChange={setLanguage} className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="vietnamese" id="vietnamese" />
                    <Label htmlFor="vietnamese">Vietnamese</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="english" id="english" />
                    <Label htmlFor="english">English</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Voice Type</Label>
              <RadioGroup
                value={voiceType}
                onValueChange={(value: string) => {
                  setVoiceType(value)
                  setSelectedVoicePreview(value)
                }}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="female" id="female" />
                  <Label htmlFor="female">Female</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="male" id="male" />
                  <Label htmlFor="male">Male</Label>
                </div>
              </RadioGroup>

              {selectedVoicePreview && (
                <div className="mt-3 p-3 bg-purple-50 rounded-lg">
                  <h4 className="font-medium mb-2">Voice Preview</h4>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                      {selectedVoicePreview === "female" ? "👩" : "👨"}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium capitalize">{selectedVoicePreview} Voice</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Button variant="outline" size="sm" className="gap-1">
                          <Play className="h-3 w-3" />
                          Play Sample
                        </Button>
                        <div className="flex-1 h-1 bg-gray-200 rounded">
                          <div className="w-1/3 h-full bg-purple-400 rounded"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Upload Custom Audio</Label>
                <Switch id="custom-audio" />
              </div>
              <div className="flex items-center gap-2 p-4 border border-dashed rounded-md bg-gray-50 cursor-pointer">
                <Mic className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-500">Click to upload or record audio</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Caption Style</Label>
              <Select
                value={captionStyle}
                onValueChange={(value: string) => {
                  setCaptionStyle(value)
                  setSelectedCaptionPreview(value)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select caption style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="modern">Modern</SelectItem>
                  <SelectItem value="classic">Classic</SelectItem>
                  <SelectItem value="minimal">Minimal</SelectItem>
                  <SelectItem value="bold">Bold</SelectItem>
                </SelectContent>
              </Select>

              {selectedCaptionPreview && (
                <div className="mt-3 p-4 bg-gray-900 rounded-lg relative">
                  <h4 className="text-white font-medium mb-3">Caption Preview</h4>
                  <div className="relative">
                    <img src="/placeholder.svg" alt="Video preview" className="w-full rounded" />
                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
                      {selectedCaptionPreview === "modern" && (
                        <div className="bg-white/90 text-black px-3 py-1 rounded-full text-sm font-medium">
                          Modern Caption Style
                        </div>
                      )}
                      {selectedCaptionPreview === "classic" && (
                        <div className="bg-black/80 text-white px-3 py-1 text-sm">Classic Caption Style</div>
                      )}
                      {selectedCaptionPreview === "minimal" && (
                        <div className="text-white text-sm font-light">Minimal Caption Style</div>
                      )}
                      {selectedCaptionPreview === "bold" && (
                        <div className="bg-yellow-400 text-black px-3 py-1 text-sm font-bold uppercase">
                          BOLD CAPTION STYLE
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Button className="w-full gap-2" onClick={handleNextStep}>
              <ArrowRight className="h-4 w-4" />
              Continue to Editing
            </Button>
          </div>
        )

      case 6:
        return (
          <div className="space-y-6">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold">Video Editor</h3>
              <p className="text-sm text-gray-500">Edit your video like a pro</p>
            </div>

            {/* Video Preview */}
            <div className="aspect-video bg-gray-900 rounded-md overflow-hidden relative">
              <img src={previewUrl || "/placeholder.svg"} alt="Video preview" className="w-full h-full object-cover" />
              <div className="absolute bottom-4 left-4 right-4">
                <div className="bg-black/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                      <Play className="h-4 w-4" />
                    </Button>
                    <div className="flex-1 h-1 bg-white/30 rounded">
                      <div
                        className="h-full bg-white rounded transition-all duration-300"
                        style={{ width: `${(editingPhase.playhead / 10) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-white text-xs">0:10</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-3">
              <Label>Timeline</Label>
              <div className="bg-gray-100 p-4 rounded-lg">
                <div className="flex gap-2 mb-3">
                  {editingPhase.timeline.map((item) => (
                    <div
                      key={item.id}
                      className={`flex-1 h-12 rounded border-2 cursor-pointer transition-colors ${
                        editingPhase.selectedElement === item.id
                          ? "border-purple-500 bg-purple-50"
                          : "border-gray-300 bg-white hover:border-gray-400"
                      }`}
                      onClick={() => setEditingPhase({ ...editingPhase, selectedElement: item.id })}
                    >
                      <div className="p-2 h-full flex flex-col justify-between">
                        <div className="text-xs font-medium truncate">{item.content}</div>
                        <div className="text-xs text-gray-500">{item.duration}s</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Editing Controls */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <Button variant="outline" size="sm" className="gap-1">
                    <Scissors className="h-3 w-3" />
                    Split
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1">
                    <Copy className="h-3 w-3" />
                    Duplicate
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1">
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1">
                    <Plus className="h-3 w-3" />
                    Add Scene
                  </Button>
                </div>
              </div>
            </div>

            {/* Editing Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Visual Effects</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-xs">Transition</Label>
                    <Select defaultValue="fade">
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fade">Fade</SelectItem>
                        <SelectItem value="slide">Slide</SelectItem>
                        <SelectItem value="zoom">Zoom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Filter</Label>
                    <div className="grid grid-cols-3 gap-1">
                      {["None", "Vintage", "B&W", "Warm", "Cool", "Bright"].map((filter) => (
                        <Button key={filter} variant="outline" size="sm" className="text-xs h-8">
                          {filter}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Audio Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-xs">Voice Volume</Label>
                    <Slider defaultValue={[80]} max={100} step={1} className="w-full" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Background Music</Label>
                    <div className="flex items-center gap-2">
                      <Switch id="bg-music" defaultChecked />
                      <Label htmlFor="bg-music" className="text-xs">
                        Enable
                      </Label>
                    </div>
                    <Slider defaultValue={[30]} max={100} step={1} className="w-full" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Button className="w-full gap-2" onClick={generatePreview} disabled={isGenerating}>
              <Video className="h-4 w-4" />
              {isGenerating ? "Generating..." : "Generate Final Preview"}
            </Button>
          </div>
        )

      case 7:
        return (
          <div className="space-y-6">
            <div className="aspect-video bg-gray-900 rounded-md overflow-hidden">
              <img src={previewUrl || "/placeholder.svg"} alt="Video preview" className="w-full h-full object-cover" />
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

            <Button className="w-full" onClick={handleFinish}>
              Create Final Video
            </Button>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Link href="/dashboard" className="flex items-center gap-2 text-gray-600 hover:text-purple-600 mb-4">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </Link>
        <h1 className="text-3xl font-bold">Create New Video</h1>
        <p className="text-gray-500">Follow the steps to create your AI-powered short video</p>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Step {currentStep} of 7</span>
            <span className="text-sm text-gray-500">{Math.round((currentStep / 7) * 100)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 7) * 100}%` }}
            ></div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {currentStep === 1 && "Basic Information"}
              {currentStep === 2 && "Audience & Goals"}
              {currentStep === 3 && "Content & Script"}
              {currentStep === 4 && "Video Style"}
              {currentStep === 5 && "Voice & Captions"}
              {currentStep === 6 && "Video Editing"}
              {currentStep === 7 && "Preview & Finalize"}
            </CardTitle>
            <CardDescription>
              {currentStep === 1 && "Enter your video title and choose a topic"}
              {currentStep === 2 && "Define your target audience and video goals"}
              {currentStep === 3 && "Review and edit the AI-generated content"}
              {currentStep === 4 && "Choose the visual style for your video"}
              {currentStep === 5 && "Configure voice and caption settings"}
              {currentStep === 6 && "Edit your video with professional tools"}
              {currentStep === 7 && "Preview your video and make final adjustments"}
            </CardDescription>
          </CardHeader>
          <CardContent>{renderStepContent()}</CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handlePrevStep} disabled={currentStep === 1}>
              Previous
            </Button>
            <Button
              onClick={handleNextStep}
              disabled={
                (currentStep === 1 && !videoTitle && !selectedTopic) ||
                (currentStep === 2 && (!targetAudience || !videoGoal)) ||
                (currentStep === 4 && !videoStyle) ||
                (currentStep === 5 && !language) ||
                isGenerating ||
                isGeneratingOutline
              }
            >
              {currentStep === 7 ? "Finish" : "Next"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

// Simple TrendingUp icon component
function TrendingUp(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="22,7 13.5,15.5 8.5,10.5 2,17" />
      <polyline points="16,7 22,7 22,13" />
    </svg>
  )
}


















// "use client"

// import type React from "react"

// import { useState } from "react"
// import { useRouter } from "next/navigation"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Textarea } from "@/components/ui/textarea"
// import { Label } from "@/components/ui/label"
// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
// import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { Slider } from "@/components/ui/slider"
// import { Switch } from "@/components/ui/switch"
// import { ArrowLeft, ArrowRight, Search, Sparkles, Wand2, Mic, Video } from "lucide-react"
// import { useToast } from "@/components/ui/use-toast"
// import { RefreshCw, Play, Scissors, Copy, Trash2, Plus } from "lucide-react"

// // Mock trending topics
// const trendingTopics = [
//   "AI in Education",
//   "Sustainable Living",
//   "Future of Work",
//   "Space Exploration",
//   "Health Tech Innovations",
// ]

// export default function CreateVideoPage() {
//   const router = useRouter()
//   const { toast } = useToast()
//   const [currentStep, setCurrentStep] = useState(1)
//   const [videoTitle, setVideoTitle] = useState("")
//   const [searchQuery, setSearchQuery] = useState("")
//   const [topicSource, setTopicSource] = useState("trending")
//   const [selectedTopic, setSelectedTopic] = useState("")
//   const [targetAudience, setTargetAudience] = useState("")
//   const [videoGoal, setVideoGoal] = useState("")
//   const [generatedSummary, setGeneratedSummary] = useState("")
//   const [generatedScript, setGeneratedScript] = useState([
//     { id: 1, text: "Introduction to the topic and why it matters." },
//     { id: 2, text: "Key point 1 with supporting details." },
//     { id: 3, text: "Key point 2 with examples and statistics." },
//     { id: 4, text: "Conclusion and call to action." },
//   ])
//   const [videoStyle, setVideoStyle] = useState("")
//   const [language, setLanguage] = useState("vietnamese")
//   const [voiceType, setVoiceType] = useState("female")
//   const [captionStyle, setCaptionStyle] = useState("modern")
//   const [isGenerating, setIsGenerating] = useState(false)
//   const [isPreviewReady, setIsPreviewReady] = useState(false)
//   const [previewUrl, setPreviewUrl] = useState("/placeholder.svg")
//   const [searchResults, setSearchResults] = useState([
//     { id: 1, title: "AI Tutorial for Beginners", thumbnail: "/placeholder-thumbnail.svg", views: "1.2M" },
//     { id: 2, title: "Machine Learning Explained", thumbnail: "/placeholder-thumbnail.svg", views: "890K" },
//     {
//       id: 3,
//       title: "Future of Artificial Intelligence",
//       thumbnail: "/placeholder-thumbnail.svg",
//       views: "2.1M",
//     },
//   ])
//   const [selectedAudiencePreview, setSelectedAudiencePreview] = useState("")
//   const [selectedGoalPreview, setSelectedGoalPreview] = useState("")
//   const [selectedVoicePreview, setSelectedVoicePreview] = useState("")
//   const [selectedCaptionPreview, setSelectedCaptionPreview] = useState("")
//   const [editingPhase, setEditingPhase] = useState<{
//     timeline: Array<{ id: number; type: string; content: string; duration: number }>;
//     selectedElement: number | null;
//     playhead: number;
//   }>({
//     timeline: [
//       { id: 1, type: "image", content: "Introduction scene", duration: 3 },
//       { id: 2, type: "image", content: "Main content", duration: 5 },
//       { id: 3, type: "image", content: "Conclusion", duration: 2 },
//     ],
//     selectedElement: null,
//     playhead: 0,
//   })

//   const handleNextStep = () => {
//     if (currentStep === 2 && !generatedSummary) {
//       generateSummary()
//     } else if (currentStep === 6) {
//       generatePreview()
//     } else {
//       setCurrentStep(currentStep + 1)
//     }
//   }

//   const handlePrevStep = () => {
//     setCurrentStep(currentStep - 1)
//   }

//   const generateSummary = () => {
//     setIsGenerating(true)
//     // Simulate AI generating content
//     setTimeout(() => {
//       setGeneratedSummary(
//         `This video explores ${selectedTopic || "the selected topic"} with a focus on its impact on ${targetAudience || "the target audience"}. The goal is to ${videoGoal || "inform and educate"} viewers through engaging content and clear explanations.`,
//       )
//       setIsGenerating(false)
//       setCurrentStep(3)
//     }, 2000)
//   }

//   const updateScriptItem = (id: number, newText: string) => {
//     setGeneratedScript(generatedScript.map((item) => (item.id === id ? { ...item, text: newText } : item)))
//   }

//   const generatePreview = () => {
//     setIsGenerating(true)
//     // Simulate video generation
//     toast({
//       title: "Generating preview",
//       description: "This may take a moment...",
//     })

//     setTimeout(() => {
//       setIsPreviewReady(true)
//       setIsGenerating(false)
//       setCurrentStep(7)
//     }, 3000)
//   }

//   const handleFinish = () => {
//     toast({
//       title: "Video created successfully!",
//       description: "Your video has been saved to your dashboard.",
//     })
//     router.push("/dashboard")
//   }

//   const regenerateScript = () => {
//     setIsGenerating(true)
//     setTimeout(() => {
//       setGeneratedScript([
//         { id: 1, text: "Hook: Start with an attention-grabbing question or statement." },
//         { id: 2, text: "Problem: Identify the main challenge or topic to address." },
//         { id: 3, text: "Solution: Present your key insights and solutions." },
//         { id: 4, text: "Action: End with a clear call-to-action for viewers." },
//       ])
//       setIsGenerating(false)
//     }, 1500)
//   }

//   const renderStepContent = () => {
//     switch (currentStep) {
//       case 1:
//         return (
//           <div className="space-y-6">
//             <div className="space-y-2">
//               <Label htmlFor="videoTitle">Video Title</Label>
//               <Input
//                 id="videoTitle"
//                 placeholder="Enter a title for your video"
//                 value={videoTitle}
//                 onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVideoTitle(e.target.value)}
//               />
//             </div>

//             <div className="space-y-4">
//               <Label>Topic Source</Label>
//               <RadioGroup value={topicSource} onValueChange={setTopicSource} className="flex flex-col space-y-3">
//                 <div className="flex items-center space-x-2">
//                   <RadioGroupItem value="trending" id="trending" />
//                   <Label htmlFor="trending" className="cursor-pointer">
//                     Use AI-suggested trending topics
//                   </Label>
//                 </div>
//                 <div className="flex items-center space-x-2">
//                   <RadioGroupItem value="search" id="search" />
//                   <Label htmlFor="search" className="cursor-pointer">
//                     Search for a specific topic
//                   </Label>
//                 </div>
//               </RadioGroup>
//             </div>

//             {topicSource === "trending" ? (
//               <div className="space-y-4">
//                 <Label>Select a Trending Topic</Label>
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//                   {trendingTopics.map((topic, index) => (
//                     <div
//                       key={topic}
//                       className={`p-3 border rounded-md cursor-pointer transition-colors ${
//                         selectedTopic === topic ? "border-purple-500 bg-purple-50" : "hover:border-gray-400"
//                       }`}
//                       onClick={() => setSelectedTopic(topic)}
//                     >
//                       <div className="flex items-center gap-3">
//                         <div className="w-12 h-12 rounded-md overflow-hidden bg-gray-100">
//                           <img
//                             src="/placeholder-small.svg"
//                             alt={topic}
//                             className="w-full h-full object-cover"
//                           />
//                         </div>
//                         <div className="flex-1">
//                           <div className="flex items-center gap-2">
//                             <TrendingUp className="h-4 w-4 text-purple-500" />
//                             <span className="font-medium">{topic}</span>
//                           </div>
//                           <p className="text-xs text-gray-500 mt-1">Trending now</p>
//                         </div>
//                       </div>
//                     </div>
//                   ))}
//                 </div>

//                 {selectedTopic && (
//                   <div className="mt-4 p-4 bg-purple-50 rounded-lg">
//                     <h4 className="font-medium mb-2">Topic Preview</h4>
//                     <div className="aspect-video bg-gray-100 rounded-md flex items-center justify-center mb-2">
//                       <img
//                         src="/placeholder.svg"
//                         alt={selectedTopic}
//                         className="w-full h-full object-cover rounded-md"
//                       />
//                     </div>
//                     <p className="text-sm text-gray-600">
//                       This topic is currently trending with high engagement rates.
//                     </p>
//                   </div>
//                 )}
//               </div>
//             ) : (
//               <div className="space-y-4">
//                 <div className="space-y-2">
//                   <Label htmlFor="searchTopic">Search for a Topic</Label>
//                   <div className="flex gap-2">
//                     <Input
//                       id="searchTopic"
//                       placeholder="Enter keywords to search"
//                       value={searchQuery}
//                       onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
//                     />
//                     <Button variant="outline" size="icon">
//                       <Search className="h-4 w-4" />
//                     </Button>
//                   </div>
//                 </div>

//                 {searchQuery && (
//                   <div className="space-y-3">
//                     <h4 className="font-medium">Search Results Preview</h4>
//                     <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto">
//                       {searchResults.map((result) => (
//                         <div
//                           key={result.id}
//                           className="flex gap-3 p-3 border rounded-md hover:bg-gray-50 cursor-pointer"
//                           onClick={() => setSelectedTopic(result.title)}
//                         >                        <img
//                           src={result.thumbnail || "/placeholder-thumbnail.svg"}
//                           alt={result.title}
//                           className="w-20 h-12 object-cover rounded"
//                         />
//                           <div className="flex-1">
//                             <h5 className="font-medium text-sm">{result.title}</h5>
//                             <p className="text-xs text-gray-500">{result.views} views</p>
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                   </div>
//                 )}
//               </div>
//             )}
//           </div>
//         )

//       case 2:
//         return (
//           <div className="space-y-6">
//             <div className="space-y-2">
//               <Label htmlFor="targetAudience">Target Audience</Label>
//               <Select
//                 value={targetAudience}
//                 onValueChange={(value: string) => {
//                   setTargetAudience(value)
//                   setSelectedAudiencePreview(value)
//                 }}
//               >
//                 <SelectTrigger>
//                   <SelectValue placeholder="Select your target audience" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="general">General Public</SelectItem>
//                   <SelectItem value="students">Students</SelectItem>
//                   <SelectItem value="professionals">Professionals</SelectItem>
//                   <SelectItem value="educators">Educators</SelectItem>
//                   <SelectItem value="enthusiasts">Tech Enthusiasts</SelectItem>
//                 </SelectContent>
//               </Select>

//               {selectedAudiencePreview && (
//                 <div className="mt-3 p-3 bg-blue-50 rounded-lg">
//                   <h4 className="font-medium mb-2">Audience Preview</h4>
//                   <div className="flex items-center gap-3">
//                     <img
//                       src="/placeholder-avatar.svg"
//                       alt={selectedAudiencePreview}
//                       className="w-15 h-15 rounded-full"
//                     />
//                     <div>
//                       <p className="font-medium capitalize">{selectedAudiencePreview}</p>
//                       <p className="text-sm text-gray-600">
//                         {selectedAudiencePreview === "students" && "Young learners seeking educational content"}
//                         {selectedAudiencePreview === "professionals" && "Working adults looking for industry insights"}
//                         {selectedAudiencePreview === "general" && "Broad audience with diverse interests"}
//                         {selectedAudiencePreview === "educators" && "Teachers and educational professionals"}
//                         {selectedAudiencePreview === "enthusiasts" &&
//                           "Tech-savvy individuals passionate about innovation"}
//                       </p>
//                     </div>
//                   </div>
//                 </div>
//               )}
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="videoGoal">Video Goal</Label>
//               <Select
//                 value={videoGoal}
//                 onValueChange={(value: string) => {
//                   setVideoGoal(value)
//                   setSelectedGoalPreview(value)
//                 }}
//               >
//                 <SelectTrigger>
//                   <SelectValue placeholder="Select the main goal of your video" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="educate">Educate & Inform</SelectItem>
//                   <SelectItem value="entertain">Entertain</SelectItem>
//                   <SelectItem value="inspire">Inspire & Motivate</SelectItem>
//                   <SelectItem value="explain">Explain a Concept</SelectItem>
//                   <SelectItem value="promote">Promote an Idea</SelectItem>
//                 </SelectContent>
//               </Select>

//               {selectedGoalPreview && (
//                 <div className="mt-3 p-3 bg-green-50 rounded-lg">
//                   <h4 className="font-medium mb-2">Goal Preview</h4>
//                   <div className="flex items-center gap-3">
//                     <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
//                       {selectedGoalPreview === "educate" && "📚"}
//                       {selectedGoalPreview === "entertain" && "🎭"}
//                       {selectedGoalPreview === "inspire" && "✨"}
//                       {selectedGoalPreview === "explain" && "💡"}
//                       {selectedGoalPreview === "promote" && "📢"}
//                     </div>
//                     <div>
//                       <p className="font-medium capitalize">{selectedGoalPreview}</p>
//                       <p className="text-sm text-gray-600">
//                         {selectedGoalPreview === "educate" && "Focus on teaching and knowledge sharing"}
//                         {selectedGoalPreview === "entertain" && "Create engaging and fun content"}
//                         {selectedGoalPreview === "inspire" && "Motivate and uplift your audience"}
//                         {selectedGoalPreview === "explain" && "Break down complex topics simply"}
//                         {selectedGoalPreview === "promote" && "Advocate for ideas and concepts"}
//                       </p>
//                     </div>
//                   </div>
//                 </div>
//               )}
//             </div>

//             <Button className="w-full gap-2" onClick={generateSummary} disabled={isGenerating}>
//               <Wand2 className="h-4 w-4" />
//               {isGenerating ? "Generating..." : "Generate Content Summary"}
//             </Button>
//           </div>
//         )

//       case 3:
//         return (
//           <div className="space-y-6">
//             <div className="space-y-2">
//               <Label htmlFor="summary">Content Summary</Label>
//               <div className="flex items-center gap-2 mb-2 text-sm text-purple-600">
//                 <Sparkles className="h-4 w-4" />
//                 <span>AI-generated summary</span>
//               </div>
//               <Textarea
//                 id="summary"
//                 placeholder="Content summary will appear here"
//                 value={generatedSummary}
//                 onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setGeneratedSummary(e.target.value)}
//                 rows={4}
//               />
//             </div>

//             <div className="space-y-2">
//               <div className="flex items-center justify-between">
//                 <Label>Script Sections</Label>
//                 <div className="flex items-center gap-2">
//                   <div className="flex items-center gap-2 text-sm text-purple-600">
//                     <Sparkles className="h-4 w-4" />
//                     <span>AI-generated script</span>
//                   </div>
//                   <Button
//                     variant="outline"
//                     size="sm"
//                     onClick={regenerateScript}
//                     disabled={isGenerating}
//                     className="gap-1"
//                   >
//                     <RefreshCw className="h-3 w-3" />
//                     {isGenerating ? "Regenerating..." : "Regenerate"}
//                   </Button>
//                 </div>
//               </div>
//               <div className="space-y-3">
//                 {generatedScript.map((section) => (
//                   <div key={section.id} className="space-y-1">
//                     <Label htmlFor={`section-${section.id}`} className="text-sm text-gray-500">
//                       Section {section.id}
//                     </Label>
//                     <Textarea
//                       id={`section-${section.id}`}
//                       value={section.text}
//                       onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateScriptItem(section.id, e.target.value)}
//                       rows={2}
//                     />
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>
//         )

//       case 4:
//         return (
//           <div className="space-y-6">
//             <div className="space-y-2">
//               <Label>Video Style</Label>
//               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
//                 {[
//                   {
//                     id: "minimalist",
//                     name: "Minimalist",
//                     desc: "Clean design with simple visuals",
//                     color: "bg-gray-100",
//                   },
//                   { id: "dynamic", name: "Dynamic", desc: "Energetic with motion graphics", color: "bg-purple-100" },
//                   {
//                     id: "educational",
//                     name: "Educational",
//                     desc: "Focus on clarity and information",
//                     color: "bg-blue-100",
//                   },
//                   {
//                     id: "storytelling",
//                     name: "Storytelling",
//                     desc: "Narrative-focused with emotional appeal",
//                     color: "bg-green-100",
//                   },
//                 ].map((style) => (
//                   <div
//                     key={style.id}
//                     className={`p-4 border rounded-md cursor-pointer transition-colors ${
//                       videoStyle === style.id ? "border-purple-500 bg-purple-50" : "hover:border-gray-400"
//                     }`}
//                     onClick={() => setVideoStyle(style.id)}
//                   >
//                     <div className="flex flex-col items-center gap-2 text-center">
//                       <div
//                         className={`w-full aspect-video ${style.color} flex items-center justify-center rounded-md relative overflow-hidden`}
//                       >
//                         <div className="absolute inset-0 flex items-center justify-center">
//                           <div className="text-xs font-medium text-gray-600">{style.name} Preview</div>
//                         </div>
//                         {style.id === "minimalist" && (
//                           <div className="absolute bottom-2 left-2 w-8 h-1 bg-gray-400 rounded"></div>
//                         )}
//                         {style.id === "dynamic" && (
//                           <div className="absolute top-2 right-2 w-4 h-4 bg-purple-400 rounded-full animate-pulse"></div>
//                         )}
//                         {style.id === "educational" && (
//                           <div className="absolute bottom-2 left-2 text-xs bg-blue-200 px-2 py-1 rounded">Info</div>
//                         )}
//                         {style.id === "storytelling" && (
//                           <div className="absolute bottom-2 right-2 w-6 h-1 bg-green-400 rounded"></div>
//                         )}
//                       </div>
//                       <span className="font-medium">{style.name}</span>
//                       <span className="text-xs text-gray-500">{style.desc}</span>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>
//         )

//       case 5:
//         return (
//           <div className="space-y-6">
//             <div className="space-y-2">
//               <Label>Language</Label>
//               <div className="flex gap-4">
//                 <RadioGroup value={language} onValueChange={setLanguage} className="flex gap-4">
//                   <div className="flex items-center space-x-2">
//                     <RadioGroupItem value="vietnamese" id="vietnamese" />
//                     <Label htmlFor="vietnamese">Vietnamese</Label>
//                   </div>
//                   <div className="flex items-center space-x-2">
//                     <RadioGroupItem value="english" id="english" />
//                     <Label htmlFor="english">English</Label>
//                   </div>
//                 </RadioGroup>
//               </div>
//             </div>

//             <div className="space-y-2">
//               <Label>Voice Type</Label>
//               <RadioGroup
//                 value={voiceType}
//                 onValueChange={(value: string) => {
//                   setVoiceType(value)
//                   setSelectedVoicePreview(value)
//                 }}
//                 className="flex gap-4"
//               >
//                 <div className="flex items-center space-x-2">
//                   <RadioGroupItem value="female" id="female" />
//                   <Label htmlFor="female">Female</Label>
//                 </div>
//                 <div className="flex items-center space-x-2">
//                   <RadioGroupItem value="male" id="male" />
//                   <Label htmlFor="male">Male</Label>
//                 </div>
//               </RadioGroup>

//               {selectedVoicePreview && (
//                 <div className="mt-3 p-3 bg-purple-50 rounded-lg">
//                   <h4 className="font-medium mb-2">Voice Preview</h4>
//                   <div className="flex items-center gap-3">
//                     <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
//                       {selectedVoicePreview === "female" ? "👩" : "👨"}
//                     </div>
//                     <div className="flex-1">
//                       <p className="font-medium capitalize">{selectedVoicePreview} Voice</p>
//                       <div className="flex items-center gap-2 mt-1">
//                         <Button variant="outline" size="sm" className="gap-1">
//                           <Play className="h-3 w-3" />
//                           Play Sample
//                         </Button>
//                         <div className="flex-1 h-1 bg-gray-200 rounded">
//                           <div className="w-1/3 h-full bg-purple-400 rounded"></div>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               )}
//             </div>

//             <div className="space-y-2">
//               <div className="flex items-center justify-between">
//                 <Label>Upload Custom Audio</Label>
//                 <Switch id="custom-audio" />
//               </div>
//               <div className="flex items-center gap-2 p-4 border border-dashed rounded-md bg-gray-50 cursor-pointer">
//                 <Mic className="h-5 w-5 text-gray-400" />
//                 <span className="text-sm text-gray-500">Click to upload or record audio</span>
//               </div>
//             </div>

//             <div className="space-y-2">
//               <Label>Caption Style</Label>
//               <Select
//                 value={captionStyle}
//                 onValueChange={(value: string) => {
//                   setCaptionStyle(value)
//                   setSelectedCaptionPreview(value)
//                 }}
//               >
//                 <SelectTrigger>
//                   <SelectValue placeholder="Select caption style" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="modern">Modern</SelectItem>
//                   <SelectItem value="classic">Classic</SelectItem>
//                   <SelectItem value="minimal">Minimal</SelectItem>
//                   <SelectItem value="bold">Bold</SelectItem>
//                 </SelectContent>
//               </Select>

//               {selectedCaptionPreview && (
//                 <div className="mt-3 p-4 bg-gray-900 rounded-lg relative">
//                   <h4 className="text-white font-medium mb-3">Caption Preview</h4>
//                   <div className="relative">
//                     <img src="/placeholder.svg" alt="Video preview" className="w-full rounded" />
//                     <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
//                       {selectedCaptionPreview === "modern" && (
//                         <div className="bg-white/90 text-black px-3 py-1 rounded-full text-sm font-medium">
//                           Modern Caption Style
//                         </div>
//                       )}
//                       {selectedCaptionPreview === "classic" && (
//                         <div className="bg-black/80 text-white px-3 py-1 text-sm">Classic Caption Style</div>
//                       )}
//                       {selectedCaptionPreview === "minimal" && (
//                         <div className="text-white text-sm font-light">Minimal Caption Style</div>
//                       )}
//                       {selectedCaptionPreview === "bold" && (
//                         <div className="bg-yellow-400 text-black px-3 py-1 text-sm font-bold uppercase">
//                           BOLD CAPTION STYLE
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 </div>
//               )}
//             </div>

//             <Button className="w-full gap-2" onClick={handleNextStep}>
//               <ArrowRight className="h-4 w-4" />
//               Continue to Editing
//             </Button>
//           </div>
//         )

//       case 6:
//         return (
//           <div className="space-y-6">
//             <div className="text-center mb-4">
//               <h3 className="text-lg font-semibold">Video Editor</h3>
//               <p className="text-sm text-gray-500">Edit your video like a pro</p>
//             </div>

//             {/* Video Preview */}
//             <div className="aspect-video bg-gray-900 rounded-md overflow-hidden relative">
//               <img src={previewUrl || "/placeholder.svg"} alt="Video preview" className="w-full h-full object-cover" />
//               <div className="absolute bottom-4 left-4 right-4">
//                 <div className="bg-black/50 rounded-lg p-3">
//                   <div className="flex items-center gap-2 mb-2">
//                     <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
//                       <Play className="h-4 w-4" />
//                     </Button>
//                     <div className="flex-1 h-1 bg-white/30 rounded">
//                       <div
//                         className="h-full bg-white rounded transition-all duration-300"
//                         style={{ width: `${(editingPhase.playhead / 10) * 100}%` }}
//                       ></div>
//                     </div>
//                     <span className="text-white text-xs">0:10</span>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Timeline */}
//             <div className="space-y-3">
//               <Label>Timeline</Label>
//               <div className="bg-gray-100 p-4 rounded-lg">
//                 <div className="flex gap-2 mb-3">
//                   {editingPhase.timeline.map((item) => (
//                     <div
//                       key={item.id}
//                       className={`flex-1 h-12 rounded border-2 cursor-pointer transition-colors ${
//                         editingPhase.selectedElement === item.id
//                           ? "border-purple-500 bg-purple-50"
//                           : "border-gray-300 bg-white hover:border-gray-400"
//                       }`}
//                       onClick={() => setEditingPhase({ ...editingPhase, selectedElement: item.id })}
//                     >
//                       <div className="p-2 h-full flex flex-col justify-between">
//                         <div className="text-xs font-medium truncate">{item.content}</div>
//                         <div className="text-xs text-gray-500">{item.duration}s</div>
//                       </div>
//                     </div>
//                   ))}
//                 </div>

//                 {/* Editing Controls */}
//                 <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
//                   <Button variant="outline" size="sm" className="gap-1">
//                     <Scissors className="h-3 w-3" />
//                     Split
//                   </Button>
//                   <Button variant="outline" size="sm" className="gap-1">
//                     <Copy className="h-3 w-3" />
//                     Duplicate
//                   </Button>
//                   <Button variant="outline" size="sm" className="gap-1">
//                     <Trash2 className="h-3 w-3" />
//                     Delete
//                   </Button>
//                   <Button variant="outline" size="sm" className="gap-1">
//                     <Plus className="h-3 w-3" />
//                     Add Scene
//                   </Button>
//                 </div>
//               </div>
//             </div>

//             {/* Editing Options */}
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <Card>
//                 <CardHeader className="pb-3">
//                   <CardTitle className="text-sm">Visual Effects</CardTitle>
//                 </CardHeader>
//                 <CardContent className="space-y-3">
//                   <div className="space-y-2">
//                     <Label className="text-xs">Transition</Label>
//                     <Select defaultValue="fade">
//                       <SelectTrigger className="h-8">
//                         <SelectValue />
//                       </SelectTrigger>
//                       <SelectContent>
//                         <SelectItem value="fade">Fade</SelectItem>
//                         <SelectItem value="slide">Slide</SelectItem>
//                         <SelectItem value="zoom">Zoom</SelectItem>
//                       </SelectContent>
//                     </Select>
//                   </div>
//                   <div className="space-y-2">
//                     <Label className="text-xs">Filter</Label>
//                     <div className="grid grid-cols-3 gap-1">
//                       {["None", "Vintage", "B&W", "Warm", "Cool", "Bright"].map((filter) => (
//                         <Button key={filter} variant="outline" size="sm" className="text-xs h-8">
//                           {filter}
//                         </Button>
//                       ))}
//                     </div>
//                   </div>
//                 </CardContent>
//               </Card>

//               <Card>
//                 <CardHeader className="pb-3">
//                   <CardTitle className="text-sm">Audio Settings</CardTitle>
//                 </CardHeader>
//                 <CardContent className="space-y-3">
//                   <div className="space-y-2">
//                     <Label className="text-xs">Voice Volume</Label>
//                     <Slider defaultValue={[80]} max={100} step={1} className="w-full" />
//                   </div>
//                   <div className="space-y-2">
//                     <Label className="text-xs">Background Music</Label>
//                     <div className="flex items-center gap-2">
//                       <Switch id="bg-music" defaultChecked />
//                       <Label htmlFor="bg-music" className="text-xs">
//                         Enable
//                       </Label>
//                     </div>
//                     <Slider defaultValue={[30]} max={100} step={1} className="w-full" />
//                   </div>
//                 </CardContent>
//               </Card>
//             </div>

//             <Button className="w-full gap-2" onClick={generatePreview} disabled={isGenerating}>
//               <Video className="h-4 w-4" />
//               {isGenerating ? "Generating..." : "Generate Final Preview"}
//             </Button>
//           </div>
//         )

//       case 7:
//         return (
//           <div className="space-y-6">
//             <div className="aspect-video bg-gray-900 rounded-md overflow-hidden">
//               <img src={previewUrl || "/placeholder.svg"} alt="Video preview" className="w-full h-full object-cover" />
//             </div>

//             <div className="space-y-4">
//               <div>
//                 <Label className="mb-2 block">Adjust Voice Speed</Label>
//                 <Slider defaultValue={[50]} max={100} step={1} />
//               </div>

//               <div>
//                 <Label className="mb-2 block">Caption Size</Label>
//                 <Slider defaultValue={[50]} max={100} step={1} />
//               </div>

//               <div className="flex items-center space-x-2">
//                 <Switch id="background-music" />
//                 <Label htmlFor="background-music">Add Background Music</Label>
//               </div>
//             </div>

//             <Button className="w-full" onClick={handleFinish}>
//               Create Final Video
//             </Button>
//           </div>
//         )

//       default:
//         return null
//     }
//   }

//   return (
//     <div className="container mx-auto p-6">
//       <div className="mb-6">
//         <div className="flex items-center gap-2 text-gray-600 hover:text-purple-600 mb-4">
//           <ArrowLeft className="h-4 w-4" />
//           <span>Back to Dashboard</span>
//         </div>
//         <h1 className="text-3xl font-bold">Create New Video</h1>
//         <p className="text-gray-500">Follow the steps to create your AI-powered short video</p>
//       </div>

//       <div className="max-w-4xl mx-auto">
//         {/* Progress indicator */}
//         <div className="mb-8">
//           <div className="flex items-center justify-between mb-2">
//             <span className="text-sm text-gray-500">Step {currentStep} of 7</span>
//             <span className="text-sm text-gray-500">{Math.round((currentStep / 7) * 100)}% Complete</span>
//           </div>
//           <div className="w-full bg-gray-200 rounded-full h-2">
//             <div
//               className="bg-purple-600 h-2 rounded-full transition-all duration-300"
//               style={{ width: `${(currentStep / 7) * 100}%` }}
//             ></div>
//           </div>
//         </div>

//         <Card>
//           <CardHeader>
//             <CardTitle>
//               {currentStep === 1 && "Basic Information"}
//               {currentStep === 2 && "Audience & Goals"}
//               {currentStep === 3 && "Content & Script"}
//               {currentStep === 4 && "Video Style"}
//               {currentStep === 5 && "Voice & Captions"}
//               {currentStep === 6 && "Video Editing"}
//               {currentStep === 7 && "Preview & Finalize"}
//             </CardTitle>
//             <CardDescription>
//               {currentStep === 1 && "Enter your video title and choose a topic"}
//               {currentStep === 2 && "Define your target audience and video goals"}
//               {currentStep === 3 && "Review and edit the generated content"}
//               {currentStep === 4 && "Choose the visual style for your video"}
//               {currentStep === 5 && "Configure voice and caption settings"}
//               {currentStep === 6 && "Edit your video with professional tools"}
//               {currentStep === 7 && "Preview your video and make final adjustments"}
//             </CardDescription>
//           </CardHeader>
//           <CardContent>{renderStepContent()}</CardContent>
//           <CardFooter className="flex justify-between">
//             <Button variant="outline" onClick={handlePrevStep} disabled={currentStep === 1}>
//               Previous
//             </Button>
//             <Button
//               onClick={handleNextStep}
//               disabled={
//                 (currentStep === 1 && !videoTitle && !selectedTopic) ||
//                 (currentStep === 2 && (!targetAudience || !videoGoal)) ||
//                 (currentStep === 4 && !videoStyle) ||
//                 (currentStep === 5 && !language) ||
//                 isGenerating
//               }
//             >
//               {currentStep === 7 ? "Finish" : "Next"}
//               <ArrowRight className="ml-2 h-4 w-4" />
//             </Button>
//           </CardFooter>
//         </Card>
//       </div>
//     </div>
//   )
// }

// // Simple TrendingUp icon component
// function TrendingUp(props: React.SVGProps<SVGSVGElement>) {
//   return (
//     <svg
//       {...props}
//       xmlns="http://www.w3.org/2000/svg"
//       width="24"
//       height="24"
//       viewBox="0 0 24 24"
//       fill="none"
//       stroke="currentColor"
//       strokeWidth="2"
//       strokeLinecap="round"
//       strokeLinejoin="round"
//     >
//       <polyline points="22,7 13.5,15.5 8.5,10.5 2,17" />
//       <polyline points="16,7 22,7 22,13" />
//     </svg>
//   )
// }




