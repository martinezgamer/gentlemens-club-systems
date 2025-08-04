export interface MusicParams {
  timeOfDay: 'early_evening' | 'prime_time' | 'late_night';
  clubLocation: string;
  crowdEnergy: 'low' | 'medium' | 'high' | 'peak';
  currentRequests: unknown[];
  djPreferences?: string[];
  specialEvents?: string[];
}

export async function generateSmartPlaylist(params: MusicParams) {
  const res = await fetch('/api/ai/music', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    throw new Error('Failed to generate playlist');
  }
  return res.json();
}
