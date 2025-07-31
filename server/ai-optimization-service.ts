import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

interface CodebaseAnalysis {
  architecture: {
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  };
  performance: {
    bottlenecks: string[];
    optimizations: string[];
    priorities: string[];
  };
  codeQuality: {
    strengths: string[];
    issues: string[];
    improvements: string[];
  };
  scalability: {
    concerns: string[];
    solutions: string[];
    futureConsiderations: string[];
  };
  security: {
    vulnerabilities: string[];
    enhancements: string[];
    bestPractices: string[];
  };
  userExperience: {
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  };
}

export async function analyzeCodebase(codebaseInfo: {
  schema: string;
  routes: string;
  frontend: string;
  packageJson: string;
  projectDescription: string;
}): Promise<CodebaseAnalysis> {
  try {
    const analysisPrompt = `As a senior software architect and performance expert, analyze this full-stack club management application codebase and provide comprehensive optimization recommendations.

**PROJECT OVERVIEW:**
${codebaseInfo.projectDescription}

**DATABASE SCHEMA (key parts):**
${codebaseInfo.schema}

**BACKEND ROUTES (sample):**
${codebaseInfo.routes}

**FRONTEND COMPONENT (sample):**
${codebaseInfo.frontend}

**PACKAGE.JSON:**
${codebaseInfo.packageJson}

**ANALYSIS REQUIREMENTS:**
Please provide a comprehensive analysis covering:

1. **Architecture Analysis**: Evaluate the overall system architecture, patterns used, and structural decisions
2. **Performance Optimization**: Identify bottlenecks, inefficiencies, and optimization opportunities  
3. **Code Quality**: Assess code organization, maintainability, and best practices
4. **Scalability**: Evaluate how well the system can handle growth in users, data, and features
5. **Security**: Identify potential vulnerabilities and security enhancements
6. **User Experience**: Assess frontend performance, accessibility, and usability

**FOCUS AREAS:**
- Database query optimization and indexing strategies
- React/frontend performance improvements
- API efficiency and caching opportunities
- Bundle size and loading performance
- Real-time features optimization (WebSocket usage)
- Code organization and maintainability
- Security best practices for club management data
- Mobile responsiveness and accessibility
- Deployment and infrastructure considerations

Provide specific, actionable recommendations with implementation priorities (High/Medium/Low).

Respond with a detailed JSON analysis following this structure:
{
  "architecture": {
    "strengths": ["strength1", "strength2"],
    "weaknesses": ["weakness1", "weakness2"], 
    "recommendations": ["rec1", "rec2"]
  },
  "performance": {
    "bottlenecks": ["bottleneck1", "bottleneck2"],
    "optimizations": ["opt1", "opt2"],
    "priorities": ["high priority item", "medium priority item"]
  },
  "codeQuality": {
    "strengths": ["strength1", "strength2"],
    "issues": ["issue1", "issue2"],
    "improvements": ["improvement1", "improvement2"]
  },
  "scalability": {
    "concerns": ["concern1", "concern2"],
    "solutions": ["solution1", "solution2"], 
    "futureConsiderations": ["consideration1", "consideration2"]
  },
  "security": {
    "vulnerabilities": ["vuln1", "vuln2"],
    "enhancements": ["enhancement1", "enhancement2"],
    "bestPractices": ["practice1", "practice2"]
  },
  "userExperience": {
    "strengths": ["strength1", "strength2"],
    "weaknesses": ["weakness1", "weakness2"],
    "recommendations": ["rec1", "rec2"]
  }
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            architecture: {
              type: "object",
              properties: {
                strengths: { type: "array", items: { type: "string" } },
                weaknesses: { type: "array", items: { type: "string" } },
                recommendations: { type: "array", items: { type: "string" } }
              },
              required: ["strengths", "weaknesses", "recommendations"]
            },
            performance: {
              type: "object", 
              properties: {
                bottlenecks: { type: "array", items: { type: "string" } },
                optimizations: { type: "array", items: { type: "string" } },
                priorities: { type: "array", items: { type: "string" } }
              },
              required: ["bottlenecks", "optimizations", "priorities"]
            },
            codeQuality: {
              type: "object",
              properties: {
                strengths: { type: "array", items: { type: "string" } },
                issues: { type: "array", items: { type: "string" } },
                improvements: { type: "array", items: { type: "string" } }
              },
              required: ["strengths", "issues", "improvements"]
            },
            scalability: {
              type: "object",
              properties: {
                concerns: { type: "array", items: { type: "string" } },
                solutions: { type: "array", items: { type: "string" } },
                futureConsiderations: { type: "array", items: { type: "string" } }
              },
              required: ["concerns", "solutions", "futureConsiderations"]
            },
            security: {
              type: "object",
              properties: {
                vulnerabilities: { type: "array", items: { type: "string" } },
                enhancements: { type: "array", items: { type: "string" } },
                bestPractices: { type: "array", items: { type: "string" } }
              },
              required: ["vulnerabilities", "enhancements", "bestPractices"]
            },
            userExperience: {
              type: "object",
              properties: {
                strengths: { type: "array", items: { type: "string" } },
                weaknesses: { type: "array", items: { type: "string" } },
                recommendations: { type: "array", items: { type: "string" } }
              },
              required: ["strengths", "weaknesses", "recommendations"]
            }
          },
          required: ["architecture", "performance", "codeQuality", "scalability", "security", "userExperience"]
        }
      },
      contents: analysisPrompt,
    });

    const rawJson = response.text;
    if (rawJson) {
      const analysis: CodebaseAnalysis = JSON.parse(rawJson);
      return analysis;
    } else {
      throw new Error("Empty response from Gemini AI");
    }
  } catch (error) {
    console.error("Error analyzing codebase:", error);
    throw new Error(`Failed to analyze codebase: ${error}`);
  }
}

export async function generateImplementationPlan(analysis: CodebaseAnalysis): Promise<{
  highPriority: string[];
  mediumPriority: string[];
  lowPriority: string[];
  quickWins: string[];
  longTermGoals: string[];
}> {
  try {
    const planPrompt = `Based on this codebase analysis, create a prioritized implementation plan for optimizing the FantasyCompanions club management application.

ANALYSIS RESULTS:
${JSON.stringify(analysis, null, 2)}

Create a detailed implementation plan that prioritizes improvements based on:
1. Business impact (user experience, performance, reliability)
2. Implementation effort (time, complexity, risk)
3. Dependencies between improvements
4. Quick wins vs long-term investments

Categorize recommendations into:
- High Priority: Critical fixes/improvements needed ASAP
- Medium Priority: Important but can wait 1-2 weeks
- Low Priority: Nice to have, can be addressed later
- Quick Wins: Easy improvements with immediate impact
- Long Term Goals: Major architectural changes for future growth

Focus on actionable steps that can be implemented systematically.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            highPriority: { type: "array", items: { type: "string" } },
            mediumPriority: { type: "array", items: { type: "string" } },
            lowPriority: { type: "array", items: { type: "string" } },
            quickWins: { type: "array", items: { type: "string" } },
            longTermGoals: { type: "array", items: { type: "string" } }
          },
          required: ["highPriority", "mediumPriority", "lowPriority", "quickWins", "longTermGoals"]
        }
      },
      contents: planPrompt,
    });

    const rawJson = response.text;
    if (rawJson) {
      return JSON.parse(rawJson);
    } else {
      throw new Error("Empty response from Gemini AI");
    }
  } catch (error) {
    console.error("Error generating implementation plan:", error);
    throw new Error(`Failed to generate implementation plan: ${error}`);
  }
}