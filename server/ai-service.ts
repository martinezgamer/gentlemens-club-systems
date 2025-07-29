import { GoogleGenAI } from "@google/genai";
import { storage } from "./storage";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

// AI-Powered Schedule Optimization
export async function optimizeSchedule(schedules: any[], staffData: any[]): Promise<{
  optimizedSchedules: any[];
  insights: string[];
  conflicts: string[];
  recommendations: string[];
}> {
  try {
    const prompt = `
    As a club management AI, analyze this staff scheduling data and provide optimization recommendations:
    
    Current Schedules: ${JSON.stringify(schedules, null, 2)}
    Staff Data: ${JSON.stringify(staffData, null, 2)}
    
    Provide:
    1. Schedule conflicts and overlaps
    2. Staff workload balance issues
    3. Coverage gap recommendations
    4. Cost optimization suggestions
    5. Performance-based shift assignments
    
    Return JSON format:
    {
      "conflicts": ["list of scheduling conflicts"],
      "recommendations": ["optimization suggestions"],
      "insights": ["key insights about current schedule"]
    }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            conflicts: { type: "array", items: { type: "string" } },
            recommendations: { type: "array", items: { type: "string" } },
            insights: { type: "array", items: { type: "string" } }
          }
        }
      },
      contents: prompt
    });

    const result = JSON.parse(response.text || "{}");
    
    return {
      optimizedSchedules: schedules, // Could implement actual optimization logic here
      insights: result.insights || [],
      conflicts: result.conflicts || [],
      recommendations: result.recommendations || []
    };
  } catch (error) {
    console.error("AI Schedule optimization error:", error);
    return {
      optimizedSchedules: schedules,
      insights: ["AI analysis temporarily unavailable"],
      conflicts: [],
      recommendations: []
    };
  }
}

// AI-Powered Financial Analysis
export async function analyzeFinancialData(financialRecords: any[]): Promise<{
  insights: string[];
  trends: string[];
  recommendations: string[];
  categorizations: { [key: string]: string };
  forecastedRevenue: number;
}> {
  try {
    const prompt = `
    Analyze this gentlemen's club financial data and provide business intelligence:
    
    Financial Records: ${JSON.stringify(financialRecords, null, 2)}
    
    Provide:
    1. Revenue trends and patterns
    2. Expense optimization opportunities
    3. Peak performance insights
    4. Cash flow recommendations
    5. Revenue forecasting for next month
    6. Automatic expense categorization
    
    Return JSON format with insights, trends, recommendations, and categorizations.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            insights: { type: "array", items: { type: "string" } },
            trends: { type: "array", items: { type: "string" } },
            recommendations: { type: "array", items: { type: "string" } },
            categorizations: { type: "object" },
            forecastedRevenue: { type: "number" }
          }
        }
      },
      contents: prompt
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("AI Financial analysis error:", error);
    return {
      insights: ["AI financial analysis temporarily unavailable"],
      trends: [],
      recommendations: [],
      categorizations: {},
      forecastedRevenue: 0
    };
  }
}

// AI-Powered Staff Performance Analysis
export async function analyzeStaffPerformance(performanceData: any[]): Promise<{
  insights: string[];
  topPerformers: string[];
  improvementAreas: { [staffId: string]: string[] };
  recommendations: string[];
}> {
  try {
    const prompt = `
    Analyze staff performance data for this gentlemen's club:
    
    Performance Data: ${JSON.stringify(performanceData, null, 2)}
    
    Identify:
    1. Top performing staff members and why
    2. Areas needing improvement for each staff member
    3. Training recommendations
    4. Recognition suggestions
    5. Performance trends over time
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            insights: { type: "array", items: { type: "string" } },
            topPerformers: { type: "array", items: { type: "string" } },
            improvementAreas: { type: "object" },
            recommendations: { type: "array", items: { type: "string" } }
          }
        }
      },
      contents: prompt
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("AI Performance analysis error:", error);
    return {
      insights: ["AI performance analysis temporarily unavailable"],
      topPerformers: [],
      improvementAreas: {},
      recommendations: []
    };
  }
}

// AI-Powered Customer Insights
export async function analyzeCustomerData(customerData: any[]): Promise<{
  insights: string[];
  preferences: { [customerId: string]: string[] };
  recommendations: string[];
  loyaltyTiers: { [customerId: string]: string };
}> {
  try {
    const prompt = `
    Analyze customer data to provide personalized service insights:
    
    Customer Data: ${JSON.stringify(customerData, null, 2)}
    
    Provide:
    1. Customer behavior patterns
    2. Preference analysis per customer
    3. Service recommendations
    4. Loyalty tier suggestions
    5. Retention strategies
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            insights: { type: "array", items: { type: "string" } },
            preferences: { type: "object" },
            recommendations: { type: "array", items: { type: "string" } },
            loyaltyTiers: { type: "object" }
          }
        }
      },
      contents: prompt
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("AI Customer analysis error:", error);
    return {
      insights: ["AI customer analysis temporarily unavailable"],
      preferences: {},
      recommendations: [],
      loyaltyTiers: {}
    };
  }
}

// AI-Powered Music Recommendations
export async function generateMusicPlaylist(context: {
  timeOfDay: string;
  crowdSize: number;
  specialEvents?: string[];
  previousRequests?: any[];
}): Promise<{
  playlist: string[];
  reasoning: string;
  moodAnalysis: string;
}> {
  try {
    const prompt = `
    Create an intelligent music playlist for a gentlemen's club:
    
    Context: ${JSON.stringify(context, null, 2)}
    
    Consider:
    1. Time-appropriate energy levels
    2. Crowd size and mood
    3. Special events or themes
    4. Previous successful tracks
    5. Genre variety and flow
    
    Generate 15-20 song recommendations with reasoning.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            playlist: { type: "array", items: { type: "string" } },
            reasoning: { type: "string" },
            moodAnalysis: { type: "string" }
          }
        }
      },
      contents: prompt
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("AI Music generation error:", error);
    return {
      playlist: ["AI playlist generation temporarily unavailable"],
      reasoning: "Unable to generate playlist at this time",
      moodAnalysis: "Mood analysis unavailable"
    };
  }
}

// AI-Powered Task Prioritization
export async function prioritizeTasks(tasks: any[]): Promise<{
  prioritizedTasks: any[];
  insights: string[];
  urgentTasks: any[];
  recommendations: string[];
}> {
  try {
    const prompt = `
    Prioritize and analyze these club management tasks:
    
    Tasks: ${JSON.stringify(tasks, null, 2)}
    
    Provide:
    1. Priority ranking based on business impact
    2. Urgent tasks requiring immediate attention
    3. Task optimization recommendations
    4. Workload distribution suggestions
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            prioritizedTasks: { type: "array" },
            insights: { type: "array", items: { type: "string" } },
            urgentTasks: { type: "array" },
            recommendations: { type: "array", items: { type: "string" } }
          }
        }
      },
      contents: prompt
    });

    const result = JSON.parse(response.text || "{}");
    return {
      prioritizedTasks: result.prioritizedTasks || tasks,
      insights: result.insights || [],
      urgentTasks: result.urgentTasks || [],
      recommendations: result.recommendations || []
    };
  } catch (error) {
    console.error("AI Task prioritization error:", error);
    return {
      prioritizedTasks: tasks,
      insights: ["AI task analysis temporarily unavailable"],
      urgentTasks: [],
      recommendations: []
    };
  }
}

// AI-Powered Message Sentiment Analysis
export async function analyzeMessageSentiment(messages: any[]): Promise<{
  sentimentScores: { [messageId: string]: number };
  insights: string[];
  flaggedMessages: any[];
  communicationTips: string[];
}> {
  try {
    const prompt = `
    Analyze message sentiment and communication patterns:
    
    Messages: ${JSON.stringify(messages, null, 2)}
    
    Provide:
    1. Sentiment scores (1-5 scale)
    2. Communication insights
    3. Messages requiring attention
    4. Improvement suggestions
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            sentimentScores: { type: "object" },
            insights: { type: "array", items: { type: "string" } },
            flaggedMessages: { type: "array" },
            communicationTips: { type: "array", items: { type: "string" } }
          }
        }
      },
      contents: prompt
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("AI Message analysis error:", error);
    return {
      sentimentScores: {},
      insights: ["AI message analysis temporarily unavailable"],
      flaggedMessages: [],
      communicationTips: []
    };
  }
}

// AI-Powered Business Intelligence Dashboard
export async function generateBusinessIntelligence(allData: {
  schedules: any[];
  financial: any[];
  staff: any[];
  customers: any[];
  tasks: any[];
}): Promise<{
  keyInsights: string[];
  performanceMetrics: { [key: string]: number };
  recommendations: string[];
  alerts: string[];
  trends: string[];
}> {
  try {
    const prompt = `
    Provide comprehensive business intelligence for this gentlemen's club:
    
    All Business Data: ${JSON.stringify(allData, null, 2)}
    
    Generate:
    1. Top 5 key business insights
    2. Performance metrics and KPIs
    3. Strategic recommendations
    4. Important alerts requiring attention
    5. Business trends analysis
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            keyInsights: { type: "array", items: { type: "string" } },
            performanceMetrics: { type: "object" },
            recommendations: { type: "array", items: { type: "string" } },
            alerts: { type: "array", items: { type: "string" } },
            trends: { type: "array", items: { type: "string" } }
          }
        }
      },
      contents: prompt
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("AI Business intelligence error:", error);
    return {
      keyInsights: ["AI business analysis temporarily unavailable"],
      performanceMetrics: {},
      recommendations: [],
      alerts: [],
      trends: []
    };
  }
}