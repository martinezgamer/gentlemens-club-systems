import { GoogleGenAI } from "@google/genai";
import type { MusicRequest, User } from "@shared/schema";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

// AI-Powered Music Recommendation Engine
export async function generateSmartPlaylist(params: {
  timeOfDay: 'early_evening' | 'prime_time' | 'late_night';
  clubLocation: string;
  crowdEnergy: 'low' | 'medium' | 'high' | 'peak';
  currentRequests: MusicRequest[];
  djPreferences?: string[];
  specialEvents?: string[];
}): Promise<{
  playlist: Array<{
    artist: string;
    title: string;
    genre: string;
    energy: number;
    reasoning: string;
    suggestedOrder: number;
  }>;
  mixingTips: string[];
  crowdEngagementStrategy: string[];
  transitionSuggestions: string[];
}> {
  try {
    const prompt = `
    Generate an intelligent club playlist for ${params.clubLocation}:
    
    Context:
    - Time: ${params.timeOfDay}
    - Crowd Energy: ${params.crowdEnergy}
    - Current Requests: ${JSON.stringify(params.currentRequests.slice(0, 10), null, 2)}
    - DJ Preferences: ${params.djPreferences?.join(', ') || 'None specified'}
    - Special Events: ${params.specialEvents?.join(', ') || 'Regular night'}
    
    Create a 20-song playlist that:
    1. Matches the current energy and time
    2. Builds crowd engagement progressively
    3. Incorporates popular club tracks and crowd favorites
    4. Considers smooth transitions between songs
    5. Balances different genres appropriately for a gentlemen's club
    
    Focus on: Hip-hop, R&B, Electronic/Dance, Popular hits that work well in adult entertainment venues.
    Avoid: Explicit content that might be inappropriate, overly aggressive tracks
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            playlist: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  artist: { type: "string" },
                  title: { type: "string" },
                  genre: { type: "string" },
                  energy: { type: "number" },
                  reasoning: { type: "string" },
                  suggestedOrder: { type: "number" }
                }
              }
            },
            mixingTips: { type: "array", items: { type: "string" } },
            crowdEngagementStrategy: { type: "array", items: { type: "string" } },
            transitionSuggestions: { type: "array", items: { type: "string" } }
          }
        }
      },
      contents: prompt
    });

    const result = JSON.parse(response.text || "{}");
    return {
      playlist: result.playlist || [],
      mixingTips: result.mixingTips || [],
      crowdEngagementStrategy: result.crowdEngagementStrategy || [],
      transitionSuggestions: result.transitionSuggestions || []
    };
  } catch (error) {
    console.error("AI playlist generation error:", error);
    return {
      playlist: [],
      mixingTips: ["AI playlist generation temporarily unavailable"],
      crowdEngagementStrategy: [],
      transitionSuggestions: []
    };
  }
}

// Smart Music Request Analysis
export async function analyzeMusicRequests(requests: MusicRequest[]): Promise<{
  trendingGenres: Array<{ genre: string; count: number; popularity: number }>;
  peakRequestTimes: string[];
  popularArtists: Array<{ artist: string; requestCount: number }>;
  crowdPreferences: {
    energyLevel: 'low' | 'medium' | 'high';
    preferredGenres: string[];
    timeBasedPreferences: { [time: string]: string[] };
  };
  recommendations: string[];
  requestPatterns: string[];
}> {
  try {
    const prompt = `
    Analyze music request patterns for intelligent insights:
    
    Requests Data: ${JSON.stringify(requests.slice(0, 50), null, 2)}
    
    Provide comprehensive analysis:
    1. Trending genres and their popularity scores
    2. Peak request times throughout the day
    3. Most requested artists
    4. Overall crowd energy preferences and genre preferences
    5. Time-based music preferences (what works best when)
    6. Actionable recommendations for DJs
    7. Pattern insights for better music curation
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            trendingGenres: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  genre: { type: "string" },
                  count: { type: "number" },
                  popularity: { type: "number" }
                }
              }
            },
            peakRequestTimes: { type: "array", items: { type: "string" } },
            popularArtists: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  artist: { type: "string" },
                  requestCount: { type: "number" }
                }
              }
            },
            crowdPreferences: {
              type: "object",
              properties: {
                energyLevel: { type: "string" },
                preferredGenres: { type: "array", items: { type: "string" } },
                timeBasedPreferences: { type: "object" }
              }
            },
            recommendations: { type: "array", items: { type: "string" } },
            requestPatterns: { type: "array", items: { type: "string" } }
          }
        }
      },
      contents: prompt
    });

    const result = JSON.parse(response.text || "{}");
    return {
      trendingGenres: result.trendingGenres || [],
      peakRequestTimes: result.peakRequestTimes || [],
      popularArtists: result.popularArtists || [],
      crowdPreferences: result.crowdPreferences || {
        energyLevel: 'medium',
        preferredGenres: [],
        timeBasedPreferences: {}
      },
      recommendations: result.recommendations || [],
      requestPatterns: result.requestPatterns || []
    };
  } catch (error) {
    console.error("AI music analysis error:", error);
    return {
      trendingGenres: [],
      peakRequestTimes: [],
      popularArtists: [],
      crowdPreferences: {
        energyLevel: 'medium',
        preferredGenres: [],
        timeBasedPreferences: {}
      },
      recommendations: ["AI analysis temporarily unavailable"],
      requestPatterns: []
    };
  }
}

// Intelligent Request Prioritization
export async function prioritizeMusicRequests(requests: MusicRequest[], djPreferences: string[]): Promise<{
  prioritizedRequests: Array<MusicRequest & { priority: number; reasoning: string }>;
  batchSuggestions: Array<{
    title: string;
    requests: string[];
    reasoning: string;
    estimatedPlayTime: number;
  }>;
  skipRecommendations: Array<{ requestId: string; reason: string }>;
}> {
  try {
    const prompt = `
    Intelligently prioritize music requests for optimal crowd flow:
    
    Requests: ${JSON.stringify(requests, null, 2)}
    DJ Preferences: ${djPreferences.join(', ')}
    
    Analyze and prioritize based on:
    1. Song flow and energy progression
    2. Request timing and frequency
    3. Artist popularity and club appeal
    4. Mix compatibility and transitions
    5. Crowd energy management
    
    Provide priority scores (1-10) and batching suggestions for smooth sets.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            prioritizedRequests: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  priority: { type: "number" },
                  reasoning: { type: "string" }
                }
              }
            },
            batchSuggestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  requests: { type: "array", items: { type: "string" } },
                  reasoning: { type: "string" },
                  estimatedPlayTime: { type: "number" }
                }
              }
            },
            skipRecommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  requestId: { type: "string" },
                  reason: { type: "string" }
                }
              }
            }
          }
        }
      },
      contents: prompt
    });

    const result = JSON.parse(response.text || "{}");
    
    // Match prioritized requests with original request objects
    const prioritizedRequests = requests.map(request => {
      const priorityData = result.prioritizedRequests?.find((p: any) => p.id === request.id);
      return {
        ...request,
        priority: priorityData?.priority || 5,
        reasoning: priorityData?.reasoning || "Standard priority"
      };
    }).sort((a, b) => b.priority - a.priority);

    return {
      prioritizedRequests,
      batchSuggestions: result.batchSuggestions || [],
      skipRecommendations: result.skipRecommendations || []
    };
  } catch (error) {
    console.error("AI request prioritization error:", error);
    return {
      prioritizedRequests: requests.map(r => ({ ...r, priority: 5, reasoning: "Default priority" })),
      batchSuggestions: [],
      skipRecommendations: []
    };
  }
}

// Auto-Generate Request Suggestions
export async function generateMusicSuggestions(params: {
  clubLocation: string;
  timeOfDay: string;
  recentlyPlayed: string[];
  crowdResponse: 'positive' | 'neutral' | 'negative';
}): Promise<{
  suggestedTracks: Array<{
    artist: string;
    title: string;
    genre: string;
    reasoning: string;
    confidence: number;
  }>;
  genreRecommendations: string[];
  energyAdjustments: string[];
}> {
  try {
    const prompt = `
    Generate smart music suggestions for ${params.clubLocation}:
    
    Context:
    - Time: ${params.timeOfDay}
    - Recently Played: ${params.recentlyPlayed.join(', ')}
    - Crowd Response: ${params.crowdResponse}
    
    Suggest 10 tracks that would work well now, considering:
    1. Energy level appropriate for time and crowd response
    2. Avoiding recently played songs
    3. Genre variety suitable for the venue
    4. Crowd engagement potential
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            suggestedTracks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  artist: { type: "string" },
                  title: { type: "string" },
                  genre: { type: "string" },
                  reasoning: { type: "string" },
                  confidence: { type: "number" }
                }
              }
            },
            genreRecommendations: { type: "array", items: { type: "string" } },
            energyAdjustments: { type: "array", items: { type: "string" } }
          }
        }
      },
      contents: prompt
    });

    const result = JSON.parse(response.text || "{}");
    return {
      suggestedTracks: result.suggestedTracks || [],
      genreRecommendations: result.genreRecommendations || [],
      energyAdjustments: result.energyAdjustments || []
    };
  } catch (error) {
    console.error("AI music suggestions error:", error);
    return {
      suggestedTracks: [],
      genreRecommendations: [],
      energyAdjustments: ["AI suggestions temporarily unavailable"]
    };
  }
}