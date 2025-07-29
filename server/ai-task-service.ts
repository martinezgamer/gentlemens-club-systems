import { GoogleGenAI } from "@google/genai";
import type { Task, User } from "@shared/schema";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

// AI-Powered Task Creation Assistant
export async function enhanceTaskCreation(taskData: {
  title: string;
  description?: string;
  assignedTo?: string;
  priority?: string;
  category?: string;
  clubLocation?: string;
}): Promise<{
  enhancedTitle: string;
  enhancedDescription: string;
  suggestedTags: string[];
  estimatedTime: number;
  suggestedPriority: string;
  recommendations: string[];
}> {
  try {
    const prompt = `
    Enhance this club management task:
    
    Original Task: ${JSON.stringify(taskData, null, 2)}
    
    Provide:
    1. Enhanced, clear title
    2. Detailed description with specific steps
    3. Relevant tags for categorization
    4. Estimated completion time in minutes
    5. Appropriate priority level (low, medium, high, urgent)
    6. Improvement recommendations
    
    Context: This is for a gentlemen's club management system with roles like bartenders, DJs, house staff, managers, etc.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            enhancedTitle: { type: "string" },
            enhancedDescription: { type: "string" },
            suggestedTags: { type: "array", items: { type: "string" } },
            estimatedTime: { type: "number" },
            suggestedPriority: { type: "string" },
            recommendations: { type: "array", items: { type: "string" } }
          }
        }
      },
      contents: prompt
    });

    const result = JSON.parse(response.text || "{}");
    return {
      enhancedTitle: result.enhancedTitle || taskData.title,
      enhancedDescription: result.enhancedDescription || taskData.description || "",
      suggestedTags: result.suggestedTags || [],
      estimatedTime: result.estimatedTime || 30,
      suggestedPriority: result.suggestedPriority || taskData.priority || "medium",
      recommendations: result.recommendations || []
    };
  } catch (error) {
    console.error("AI task enhancement error:", error);
    return {
      enhancedTitle: taskData.title,
      enhancedDescription: taskData.description || "",
      suggestedTags: [],
      estimatedTime: 30,
      suggestedPriority: taskData.priority || "medium",
      recommendations: ["AI enhancement temporarily unavailable"]
    };
  }
}

// AI-Powered Task Prioritization and Analysis
export async function analyzeTaskWorkload(tasks: Task[], staff: User[]): Promise<{
  prioritizedTasks: Task[];
  workloadAnalysis: {
    [userId: string]: {
      taskCount: number;
      totalEstimatedTime: number;
      urgentTasks: number;
      workloadLevel: 'light' | 'moderate' | 'heavy' | 'overloaded';
    };
  };
  urgentTasks: Task[];
  bottlenecks: string[];
  optimizationSuggestions: string[];
  deadlineAlerts: string[];
}> {
  try {
    const prompt = `
    Analyze this club management task workload:
    
    Tasks: ${JSON.stringify(tasks, null, 2)}
    Staff: ${JSON.stringify(staff.map(s => ({ id: s.id, firstName: s.firstName, lastName: s.lastName, role: s.role, clubLocation: s.clubLocation })), null, 2)}
    
    Provide comprehensive analysis:
    1. Prioritized task list based on urgency, business impact, and dependencies
    2. Staff workload analysis with overload warnings
    3. Critical urgent tasks requiring immediate attention
    4. Workflow bottlenecks and resource conflicts
    5. Optimization suggestions for better task distribution
    6. Deadline alerts and scheduling conflicts
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            prioritizedTasks: { type: "array" },
            workloadAnalysis: { type: "object" },
            urgentTasks: { type: "array" },
            bottlenecks: { type: "array", items: { type: "string" } },
            optimizationSuggestions: { type: "array", items: { type: "string" } },
            deadlineAlerts: { type: "array", items: { type: "string" } }
          }
        }
      },
      contents: prompt
    });

    const result = JSON.parse(response.text || "{}");
    
    // Calculate workload analysis if AI doesn't provide it
    const workloadAnalysis: any = {};
    if (!result.workloadAnalysis) {
      for (const staffMember of staff) {
        const userTasks = tasks.filter(t => t.assignedTo === staffMember.id);
        const totalTime = userTasks.reduce((sum, t) => sum + (t.estimatedTime || 30), 0);
        const urgentCount = userTasks.filter(t => t.priority === 'urgent' || t.priority === 'high').length;
        
        let workloadLevel: 'light' | 'moderate' | 'heavy' | 'overloaded' = 'light';
        if (totalTime > 480) workloadLevel = 'overloaded'; // 8+ hours
        else if (totalTime > 360) workloadLevel = 'heavy'; // 6+ hours
        else if (totalTime > 180) workloadLevel = 'moderate'; // 3+ hours
        
        workloadAnalysis[staffMember.id] = {
          taskCount: userTasks.length,
          totalEstimatedTime: totalTime,
          urgentTasks: urgentCount,
          workloadLevel
        };
      }
    }

    return {
      prioritizedTasks: result.prioritizedTasks || tasks,
      workloadAnalysis: result.workloadAnalysis || workloadAnalysis,
      urgentTasks: result.urgentTasks || tasks.filter(t => t.priority === 'urgent'),
      bottlenecks: result.bottlenecks || [],
      optimizationSuggestions: result.optimizationSuggestions || [],
      deadlineAlerts: result.deadlineAlerts || []
    };
  } catch (error) {
    console.error("AI task analysis error:", error);
    return {
      prioritizedTasks: tasks,
      workloadAnalysis: {},
      urgentTasks: tasks.filter(t => t.priority === 'urgent'),
      bottlenecks: ["AI analysis temporarily unavailable"],
      optimizationSuggestions: [],
      deadlineAlerts: []
    };
  }
}

// AI-Powered Task Progress Insights
export async function generateTaskInsights(tasks: Task[], completedTasks: Task[]): Promise<{
  productivityMetrics: {
    averageCompletionTime: number;
    onTimeDeliveryRate: number;
    taskEfficiencyScore: number;
    mostProductiveHours: string[];
  };
  performanceAnalysis: string[];
  improvementAreas: string[];
  successPatterns: string[];
  recommendations: string[];
}> {
  try {
    const prompt = `
    Analyze task performance and productivity:
    
    Active Tasks: ${JSON.stringify(tasks, null, 2)}
    Completed Tasks: ${JSON.stringify(completedTasks, null, 2)}
    
    Provide detailed analysis:
    1. Key productivity metrics and completion rates
    2. Performance analysis with strengths and weaknesses
    3. Areas needing improvement
    4. Successful task patterns and best practices
    5. Actionable recommendations for optimization
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            productivityMetrics: {
              type: "object",
              properties: {
                averageCompletionTime: { type: "number" },
                onTimeDeliveryRate: { type: "number" },
                taskEfficiencyScore: { type: "number" },
                mostProductiveHours: { type: "array", items: { type: "string" } }
              }
            },
            performanceAnalysis: { type: "array", items: { type: "string" } },
            improvementAreas: { type: "array", items: { type: "string" } },
            successPatterns: { type: "array", items: { type: "string" } },
            recommendations: { type: "array", items: { type: "string" } }
          }
        }
      },
      contents: prompt
    });

    const result = JSON.parse(response.text || "{}");
    return {
      productivityMetrics: result.productivityMetrics || {
        averageCompletionTime: 0,
        onTimeDeliveryRate: 0,
        taskEfficiencyScore: 0,
        mostProductiveHours: []
      },
      performanceAnalysis: result.performanceAnalysis || [],
      improvementAreas: result.improvementAreas || [],
      successPatterns: result.successPatterns || [],
      recommendations: result.recommendations || []
    };
  } catch (error) {
    console.error("AI task insights error:", error);
    return {
      productivityMetrics: {
        averageCompletionTime: 0,
        onTimeDeliveryRate: 0,
        taskEfficiencyScore: 0,
        mostProductiveHours: []
      },
      performanceAnalysis: ["AI analysis temporarily unavailable"],
      improvementAreas: [],
      successPatterns: [],
      recommendations: []
    };
  }
}

// Smart Task Suggestions
export async function generateTaskSuggestions(clubLocation: string, recentActivity: any[]): Promise<{
  suggestedTasks: Array<{
    title: string;
    description: string;
    priority: string;
    category: string;
    estimatedTime: number;
    tags: string[];
    reasoning: string;
  }>;
  maintenanceTasks: string[];
  operationalImprovements: string[];
}> {
  try {
    const prompt = `
    Generate intelligent task suggestions for ${clubLocation} based on recent activity:
    
    Recent Activity: ${JSON.stringify(recentActivity, null, 2)}
    
    Suggest:
    1. Proactive tasks to improve operations
    2. Maintenance tasks based on patterns
    3. Operational improvements and optimizations
    4. Staff development and training tasks
    5. Customer experience enhancements
    
    Consider: bar inventory, DJ equipment, lighting, cleaning, staff scheduling, customer service, compliance, safety
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            suggestedTasks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  priority: { type: "string" },
                  category: { type: "string" },
                  estimatedTime: { type: "number" },
                  tags: { type: "array", items: { type: "string" } },
                  reasoning: { type: "string" }
                }
              }
            },
            maintenanceTasks: { type: "array", items: { type: "string" } },
            operationalImprovements: { type: "array", items: { type: "string" } }
          }
        }
      },
      contents: prompt
    });

    const result = JSON.parse(response.text || "{}");
    return {
      suggestedTasks: result.suggestedTasks || [],
      maintenanceTasks: result.maintenanceTasks || [],
      operationalImprovements: result.operationalImprovements || []
    };
  } catch (error) {
    console.error("AI task suggestions error:", error);
    return {
      suggestedTasks: [],
      maintenanceTasks: [],
      operationalImprovements: []
    };
  }
}