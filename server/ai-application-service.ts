import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export class AIApplicationService {
  async enhanceExperience(experience: string, context: { firstName?: string }): Promise<string> {
    try {
      const prompt = `You are an expert career advisor helping someone improve their job application for a dancer position at a gentlemen's club. 

The applicant ${context.firstName ? `named ${context.firstName}` : ''} has written about their experience:
"${experience}"

Please enhance this experience description by:
1. Making it more professional and compelling
2. Highlighting transferable skills (customer service, performance, confidence, etc.)
3. Using action verbs and specific examples where possible
4. Keeping it honest but presenting it in the best light
5. Making it sound confident and enthusiastic
6. Ensuring it's appropriate for the entertainment industry

Return only the enhanced version, no additional commentary.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      return response.text || experience;
    } catch (error) {
      console.error("Error enhancing experience:", error);
      return experience;
    }
  }

  async improveAvailability(availability: string): Promise<string> {
    try {
      const prompt = `You are helping someone format their availability for a dancer job application. 

They wrote:
"${availability}"

Please reformat this to be:
1. Clear and professional
2. Well-structured with specific days/times
3. Flexible but realistic
4. Easy to read at a glance
5. Showing enthusiasm for the position

Format it in a clear, organized way. Return only the improved version.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      return response.text || availability;
    } catch (error) {
      console.error("Error improving availability:", error);
      return availability;
    }
  }

  async suggestStageName(context: { firstName?: string; lastName?: string }): Promise<string> {
    try {
      const prompt = `Suggest a professional, elegant stage name for a dancer at an upscale gentlemen's club. 

Context:
- First name: ${context.firstName || 'Not provided'}
- Last name: ${context.lastName || 'Not provided'}

Guidelines:
1. Should be memorable and professional
2. Elegant and sophisticated
3. Easy to pronounce
4. Appropriate for an upscale venue
5. Can be inspired by their real name or completely different
6. Should sound confident and alluring

Provide just ONE suggestion that would work well. Return only the stage name, nothing else.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      return response.text || "";
    } catch (error) {
      console.error("Error suggesting stage name:", error);
      return "";
    }
  }

  async reviewApplication(applicationData: any): Promise<{
    score: number;
    suggestions: string[];
    strengths: string[];
  }> {
    try {
      const prompt = `You are an HR expert reviewing a dancer job application. Analyze this application and provide feedback:

Application Data:
${JSON.stringify(applicationData, null, 2)}

Please provide:
1. A score from 1-10 (10 being excellent)
2. 3-5 specific suggestions for improvement
3. 2-3 key strengths of the application

Respond in JSON format:
{
  "score": number,
  "suggestions": ["suggestion1", "suggestion2", ...],
  "strengths": ["strength1", "strength2", ...]
}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              score: { type: "number" },
              suggestions: {
                type: "array",
                items: { type: "string" }
              },
              strengths: {
                type: "array",
                items: { type: "string" }
              }
            },
            required: ["score", "suggestions", "strengths"]
          }
        },
        contents: prompt,
      });

      const result = JSON.parse(response.text || '{}');
      return {
        score: result.score || 5,
        suggestions: result.suggestions || [],
        strengths: result.strengths || []
      };
    } catch (error) {
      console.error("Error reviewing application:", error);
      return {
        score: 5,
        suggestions: ["Please review all fields for completeness"],
        strengths: ["Application submitted successfully"]
      };
    }
  }
}

export const aiApplicationService = new AIApplicationService();