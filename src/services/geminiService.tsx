import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(
  process.env.NEXT_PUBLIC_GEMINI_API_KEY || ""
);

export interface VideoOutlineRequest {
  description: string;
  targetAudience: string;
  videoGoal: string;
}

export interface VideoScriptSegment {
  id: number;
  text: string;
  start: number; // Start time in seconds
  end: number; // End time in seconds
}

export interface VideoOutlineResponse {
  contentSummary: string;
  scriptSegments: VideoScriptSegment[];
  estimatedDuration: number;
  keywords: string[];
}

export const geminiService = {
  generateVideoOutline: async (
    request: VideoOutlineRequest
  ): Promise<VideoOutlineResponse> => {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const prompt = `
You are an expert short-form video content creator and scriptwriter. Based on the following information, generate a complete and engaging script breakdown for approximately 60-second video.

**Video Description:** ${request.description}
**Target Audience:** ${request.targetAudience}
**Video Goal:** ${request.videoGoal}

Return your response in the following JSON format:

{
  "contentSummary": "A concise 4-5 sentence summary of the video content and its key message.",
  "scriptSegments": [
    {
      "id": 1,
      "text": "Short, clear sentence suitable for on-screen caption.",
      "start": 0,
      "end": 5
    }
  ],
  "estimatedDuration": 60, // Total video duration in seconds
  "keywords": ["keyword1", "keyword2", "keyword3"]
}


Guidelines:
- The total video duration must be approximately 60 seconds.
- Divide the script into short segments (10–15 total), each lasting 4–6 seconds.
- Each scriptSegment must include:
  + A short, engaging sentence that fits comfortably on screen as a caption.
  + Accurate start and end times in seconds.
- Begin with a hook to grab attention immediately.
- End with a clear and compelling call-to-action.
- Make the content highly relevant, engaging, and easy to read for the target audience.
- Ensure the messaging aligns closely with the stated video goal.
- Add relevant SEO keywords to increase discoverability.
- Return only the JSON — no explanations, comments, or extra formatting.
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      try {
        // Clean the response text to extract JSON
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error("No JSON found in response");
        }

        const parsedResponse: VideoOutlineResponse = JSON.parse(jsonMatch[0]);

        // Validate the response structure
        if (
          !parsedResponse.contentSummary ||
          !parsedResponse.scriptSegments ||
          !Array.isArray(parsedResponse.scriptSegments)
        ) {
          throw new Error("Invalid response structure");
        }

        return parsedResponse;
      } catch (parseError) {
        console.error("Failed to parse Gemini response:", parseError);

        // Fallback response if JSON parsing fails
        return {
          contentSummary: `This video explores ${request.description} targeting ${request.targetAudience} with the goal to ${request.videoGoal}.`,
          scriptSegments: [
            {
              id: 1,
              text: "Hook the audience with an engaging opening that introduces the main topic.",
              start: 0,
              end: 5,
            },
            {
              id: 2,
              text: "Present the core information or message of the video with clear explanations.",
              start: 5,
              end: 35,
            },
            {
              id: 3,
              text: "Highlight the most important takeaways or benefits for the audience.",
              start: 35,
              end: 55,
            },
            {
              id: 4,
              text: "End with a clear call to action encouraging engagement or next steps.",
              start: 55,
              end: 60,
            },
          ],
          estimatedDuration: 60,
          keywords: ["video", "content", "audience"],
        };
      }
    } catch (error) {
      console.error("Gemini API error:", error);
      throw new Error("Failed to generate video outline. Please try again.");
    }
  },

  generateScript: async (
    topic: string,
    audience: string,
    duration: number = 60
  ): Promise<VideoOutlineResponse> => {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const prompt = `
Generate a script for approximately ${duration}-second video about "${topic}" for ${audience}.
Please return the script as a JSON object with the following structure:

{
  "contentSummary": "",
  "scriptSegments": [
    {
      "id": 1,
      "text": "Short, clear sentence suitable for on-screen caption.",
      "start": 0,
      "end": 5
    },
    {
      "id": 2,
      "text": "Another engaging segment of the script.",
      "start": 5,
      "end": 10
    }
  ],
  "estimatedDuration": ${duration}, // Total video duration in seconds
  "keywords": ["keyword1", "keyword2", "keyword3"]
}

Guidelines:
- Divide the script into 10–15 segments depending on the total duration (each segment should last roughly 4–6 seconds when spoken).
- Make the tone conversational, engaging, and natural for ${audience}.
- Start with a strong hook to grab attention immediately.
- Include the core message and any relevant context or supporting details.
- End with a clear and motivating call to action.
- Each script segment (text) should be standalone, suitable for on-screen caption or spoken word.
- The start and end times should be provided in seconds for each segment.
- Do not include any additional formatting, explanation, or markdown—only return the final JSON response.
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      try {
        // Clean the response text to extract JSON
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error("No JSON found in response");
        }

        const parsedResponse: VideoOutlineResponse = JSON.parse(jsonMatch[0]);

        // Validate the response structure
        if (
          !parsedResponse.contentSummary ||
          !parsedResponse.scriptSegments ||
          !Array.isArray(parsedResponse.scriptSegments)
        ) {
          throw new Error("Invalid response structure");
        }

        return parsedResponse;
      } catch (parseError) {
        // Fallback script if parsing fails
        return {
          contentSummary: `${topic}`,
          scriptSegments: [
            {
              id: 1,
              text: "Introduction to the topic and why it matters.",
              start: 0,
              end: 5,
            },
            {
              id: 2,
              text: "Key point 1 with supporting details.",
              start: 5,
              end: 35,
            },
            {
              id: 3,
              text: "Key point 2 with examples and statistics.",
              start: 35,
              end: 55,
            },
            {
              id: 4,
              text: "Conclusion and call to action.",
              start: 55,
              end: 60,
            },
          ],
          estimatedDuration: duration,
          keywords: ["video", "content", "audience"],
        };
      }
    } catch (error) {
      console.error("Script generation error:", error);
      throw new Error("Failed to generate script. Please try again.");
    }
  },
};
