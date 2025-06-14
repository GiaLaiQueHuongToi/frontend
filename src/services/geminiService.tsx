import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

export interface VideoOutlineRequest {
  description: string;
  targetAudience: string;
  videoGoal: string;
}

export interface VideoChapter {
  id: number;
  title: string;
  content: string;
  duration: number; // estimated duration in seconds
}

export interface VideoOutlineResponse {
  contentSummary: string;
  chapters: VideoChapter[];
  estimatedDuration: number;
  keywords: string[];
}

export const geminiService = {
  generateVideoOutline: async (request: VideoOutlineRequest): Promise<VideoOutlineResponse> => {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

      const prompt = `
You are an expert video content creator and scriptwriter. Generate a comprehensive video outline based on the following information:

**Video Description:** ${request.description}
**Target Audience:** ${request.targetAudience}
**Video Goal:** ${request.videoGoal}

Please provide a detailed response in the following JSON format:

{
  "contentSummary": "A comprehensive 2-3 sentence summary of the video content and its key message",
  "chapters": [
    {
      "id": 1,
      "title": "Chapter title",
      "content": "Detailed script content for this chapter (2-3 sentences)",
      "duration": 15
    }
  ],
  "estimatedDuration": 60,
  "keywords": ["keyword1", "keyword2", "keyword3"]
}

Guidelines:
- Create 4-6 chapters for a short video (60-90 seconds total)
- Each chapter should be 10-20 seconds long
- Start with a hook in the first chapter
- Include a clear call-to-action in the final chapter
- Make the content engaging and appropriate for the target audience
- Ensure the script aligns with the video goal
- Include relevant keywords for SEO

Provide only the JSON response without any additional text or formatting.
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      try {
        // Clean the response text to extract JSON
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No JSON found in response');
        }

        const parsedResponse: VideoOutlineResponse = JSON.parse(jsonMatch[0]);
        
        // Validate the response structure
        if (!parsedResponse.contentSummary || !parsedResponse.chapters || !Array.isArray(parsedResponse.chapters)) {
          throw new Error('Invalid response structure');
        }

        return parsedResponse;
      } catch (parseError) {
        console.error('Failed to parse Gemini response:', parseError);
        
        // Fallback response if JSON parsing fails
        return {
          contentSummary: `This video explores ${request.description} targeting ${request.targetAudience} with the goal to ${request.videoGoal}.`,
          chapters: [
            {
              id: 1,
              title: "Introduction",
              content: "Hook the audience with an engaging opening that introduces the main topic.",
              duration: 15
            },
            {
              id: 2,
              title: "Main Content",
              content: "Present the core information or message of the video with clear explanations.",
              duration: 30
            },
            {
              id: 3,
              title: "Key Points",
              content: "Highlight the most important takeaways or benefits for the audience.",
              duration: 20
            },
            {
              id: 4,
              title: "Call to Action",
              content: "End with a clear call to action encouraging engagement or next steps.",
              duration: 15
            }
          ],
          estimatedDuration: 80,
          keywords: ["video", "content", "audience"]
        };
      }
    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error('Failed to generate video outline. Please try again.');
    }
  },

  generateScript: async (topic: string, audience: string, duration: number = 60): Promise<string[]> => {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

      const prompt = `
Generate a script for a ${duration}-second video about "${topic}" for ${audience}.

Please provide the script as a JSON array of strings, where each string represents a section/paragraph of the script.

Example format:
["Opening hook statement", "Main point explanation", "Supporting details", "Call to action"]

Guidelines:
- Keep it conversational and engaging
- Make it appropriate for ${audience}
- Each section should be 10-20 seconds when spoken
- Include a strong hook at the beginning
- End with a clear call to action

Provide only the JSON array without any additional text.
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      try {
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
          throw new Error('No JSON array found in response');
        }

        const scriptSections: string[] = JSON.parse(jsonMatch[0]);
        return scriptSections;
      } catch (parseError) {
        // Fallback script if parsing fails
        return [
          "Introduction to the topic and why it matters.",
          "Key point 1 with supporting details.",
          "Key point 2 with examples and statistics.",
          "Conclusion and call to action."
        ];
      }
    } catch (error) {
      console.error('Script generation error:', error);
      throw new Error('Failed to generate script. Please try again.');
    }
  }
};