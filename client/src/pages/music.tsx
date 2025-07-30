import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/header";
import { Music as MusicIcon, Play, Pause, SkipForward, Heart, Star, TrendingUp, Zap, Bot, ListMusic, Users, Clock, ThumbsUp, Flame, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { MusicRequest, MusicAnalytics, Playlist, User } from "../../../shared/schema";

const musicRequestSchema = z.object({
  trackTitle: z.string().min(1, "Track title is required"),
  artist: z.string().min(1, "Artist is required"),
  genre: z.string().optional(),
  specialInstructions: z.string().optional(),
  urgency: z.enum(["low", "medium", "high"]).default("medium"),
});

const playlistSchema = z.object({
  name: z.string().min(1, "Playlist name is required"),
  description: z.string().optional(),
  isPublic: z.boolean().default(false),
  clubLocation: z.enum(["wiggles_gentlemens_club", "fantasy_gentlemens_club", "both_clubs"]),
});

export default function Music() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedClub, setSelectedClub] = useState<string>("wiggles_gentlemens_club");
  const [isGeneratingPlaylist, setIsGeneratingPlaylist] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [showRequestDialog, setShowRequestDialog] = useState(false);

  // Fetch music requests
  const { data: musicRequests = [], isLoading: requestsLoading } = useQuery<(MusicRequest & { requester: User; dj?: User })[]>({
    queryKey: ['/api/music-requests', user?.role === 'dj' ? user.id : undefined],
    enabled: !!user,
  });

  // Fetch playlists
  const { data: playlists = [], isLoading: playlistsLoading } = useQuery<Playlist[]>({
    queryKey: ['/api/playlists', selectedClub],
    enabled: !!user,
  });

  // Fetch music analytics
  const { data: analytics = [], isLoading: analyticsLoading } = useQuery<MusicAnalytics[]>({
    queryKey: ['/api/music/analytics', selectedClub],
    enabled: !!user,
  });

  // Create music request mutation
  const createRequestMutation = useMutation({
    mutationFn: async (data: z.infer<typeof musicRequestSchema>) => {
      const response = await fetch('/api/music-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...data, clubLocation: selectedClub }),
      });
      if (!response.ok) throw new Error('Failed to create request');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/music-requests'] });
      toast({ title: "Music request submitted successfully!" });
      setShowRequestDialog(false);
    },
    onError: () => {
      toast({ title: "Failed to submit request", variant: "destructive" });
    },
  });

  // Update request mutation
  const updateRequestMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const response = await fetch(`/api/music-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update request');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/music-requests'] });
      toast({ title: "Request updated successfully!" });
    },
  });

  // AI playlist generation mutation
  const generatePlaylistMutation = useMutation({
    mutationFn: async (params: any) => {
      const response = await fetch('/api/music/ai/generate-playlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(params),
      });
      if (!response.ok) throw new Error('Failed to generate playlist');
      return response.json();
    },
    onSuccess: (data) => {
      toast({ title: "AI playlist generated successfully!", description: `Created "${data.name}" with ${data.tracks?.length || 0} tracks` });
      queryClient.invalidateQueries({ queryKey: ['/api/playlists'] });
    },
  });

  const requestForm = useForm<z.infer<typeof musicRequestSchema>>({
    resolver: zodResolver(musicRequestSchema),
    defaultValues: {
      trackTitle: "",
      artist: "",
      genre: "",
      specialInstructions: "",
      urgency: "medium",
    },
  });

  const onSubmitRequest = (data: z.infer<typeof musicRequestSchema>) => {
    createRequestMutation.mutate(data);
    requestForm.reset();
  };

  const handleApproveRequest = (id: string) => {
    updateRequestMutation.mutate({
      id,
      updates: { isApproved: true, djId: user?.id },
    });
  };

  const handlePlayRequest = (id: string) => {
    updateRequestMutation.mutate({
      id,
      updates: { isPlayed: true },
    });
    setCurrentlyPlaying(id);
  };

  const generateAIPlaylist = async () => {
    setIsGeneratingPlaylist(true);
    try {
      await generatePlaylistMutation.mutateAsync({
        clubLocation: selectedClub,
        timeOfDay: new Date().getHours(),
        targetDuration: 120,
        preferredGenres: ['electronic', 'hip-hop', 'house'],
        energyLevel: 'high',
        crowdSize: 'large',
      });
    } finally {
      setIsGeneratingPlaylist(false);
    }
  };

  const getStatusBadge = (request: any) => {
    if (request.isPlayed) return <Badge className="bg-green-500">Played</Badge>;
    if (request.isApproved) return <Badge className="bg-blue-500">Approved</Badge>;
    return <Badge variant="outline">Pending</Badge>;
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  const getDancerRequests = () => {
    return musicRequests.filter((req: any) => req.requester?.role === 'dancer' || 
      ['dancer', 'bartender', 'server', 'front_door', 'host', 'floor_host'].includes(req.requester?.role));
  };

  const getPopularSongs = () => {
    return analytics.slice(0, 10).map((track: any) => ({
      ...track,
      isPopular: track.playCount > 5
    }));
  };

  const getTrendingSongs = () => {
    const recent = analytics.filter((track: any) => {
      const lastPlayed = new Date(track.lastPlayed);
      const daysSince = (Date.now() - lastPlayed.getTime()) / (1000 * 60 * 60 * 24);
      return daysSince <= 7;
    });
    return recent.slice(0, 8);
  };

  return (
    <>
      <Header title="Music Request System" />
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Club Selection & Quick Request */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MusicIcon className="h-5 w-5" />
                Music Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Label htmlFor="club-select">Location:</Label>
                  <Select value={selectedClub} onValueChange={setSelectedClub}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="wiggles_gentlemens_club">Wiggles Club</SelectItem>
                      <SelectItem value="fantasy_gentlemens_club">Fantasy Club</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Request Song
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Request a Song</DialogTitle>
                      <DialogDescription>
                        Submit your music request to the DJ
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...requestForm}>
                      <form onSubmit={requestForm.handleSubmit(onSubmitRequest)} className="space-y-4">
                        <FormField
                          control={requestForm.control}
                          name="trackTitle"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Song Title</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter song title..." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={requestForm.control}
                          name="artist"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Artist</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter artist name..." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={requestForm.control}
                          name="urgency"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Priority</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="low">Low Priority</SelectItem>
                                  <SelectItem value="medium">Medium Priority</SelectItem>
                                  <SelectItem value="high">High Priority</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={requestForm.control}
                          name="specialInstructions"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Special Notes (Optional)</FormLabel>
                              <FormControl>
                                <Textarea placeholder="Any special requests..." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex gap-2">
                          <Button 
                            type="submit" 
                            className="flex-1" 
                            disabled={createRequestMutation.isPending}
                          >
                            {createRequestMutation.isPending ? "Submitting..." : "Submit Request"}
                          </Button>
                          <Button 
                            type="button" 
                            variant="outline"
                            onClick={() => setShowRequestDialog(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Requests</span>
                  <span className="font-semibold">{musicRequests.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">From Dancers</span>
                  <span className="font-semibold">{getDancerRequests().length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Approved</span>
                  <span className="font-semibold">{musicRequests.filter((r: any) => r.isApproved).length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Played</span>
                  <span className="font-semibold">{musicRequests.filter((r: any) => r.isPlayed).length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="popular" className="w-full mt-6">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="popular">What's Popular</TabsTrigger>
            <TabsTrigger value="trending">Trending Now</TabsTrigger>
            <TabsTrigger value="requests">Current Requests</TabsTrigger>
            <TabsTrigger value="history">Playlist History</TabsTrigger>
            <TabsTrigger value="dj-tools">DJ Tools</TabsTrigger>
          </TabsList>

          {/* What's Popular Tab */}
          <TabsContent value="popular" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-orange-500" />
                  Most Requested Songs by Dancers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {getPopularSongs().length === 0 ? (
                    <div className="col-span-full text-center py-8 text-gray-500">
                      No popular songs data yet
                    </div>
                  ) : (
                    getPopularSongs().map((track: any, index: number) => (
                      <Card key={track.id} className="p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold">{track.trackTitle}</h4>
                            <p className="text-sm text-gray-600">{track.artist}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant={track.isPopular ? "default" : "outline"}>
                                {track.playCount} plays
                              </Badge>
                              {track.crowdResponse === 'great' && (
                                <Badge className="bg-green-100 text-green-800">Crowd Favorite</Badge>
                              )}
                            </div>
                          </div>
                          <Button size="sm" variant="outline">
                            <Heart className="h-4 w-4" />
                          </Button>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trending Now Tab */}
          <TabsContent value="trending" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Trending This Week
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getTrendingSongs().length === 0 ? (
                    <div className="col-span-full text-center py-8 text-gray-500">
                      No trending songs this week
                    </div>
                  ) : (
                    getTrendingSongs().map((track: any) => (
                      <Card key={track.id} className="p-4 hover:shadow-md transition-shadow">
                        <div className="space-y-2">
                          <h4 className="font-semibold">{track.trackTitle}</h4>
                          <p className="text-sm text-gray-600">{track.artist}</p>
                          <div className="flex items-center justify-between">
                            <Badge className="bg-green-100 text-green-800">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              Trending
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {track.playCount} plays
                            </span>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Current Requests Tab */}
          <TabsContent value="requests" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Dancer Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {getDancerRequests().length === 0 ? (
                      <div className="text-center py-8 text-gray-500">No dancer requests yet</div>
                    ) : (
                      getDancerRequests().map((request: any) => (
                        <Card key={request.id} className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-semibold">{request.trackTitle}</h4>
                              <p className="text-sm text-gray-600">by {request.artist}</p>
                              <p className="text-xs text-gray-500">
                                Requested by {request.requester?.email?.split('@')[0] || 'Dancer'}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                {getStatusBadge(request)}
                                <span className={`text-xs ${getUrgencyColor(request.urgency)}`}>
                                  {request.urgency} priority
                                </span>
                              </div>
                            </div>
                            {user?.role === 'dj' && !request.isPlayed && (
                              <div className="flex gap-2">
                                {!request.isApproved && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleApproveRequest(request.id)}
                                  >
                                    Approve
                                  </Button>
                                )}
                                {request.isApproved && (
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => handlePlayRequest(request.id)}
                                  >
                                    <Play className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>All Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {requestsLoading ? (
                      <div className="text-center py-8">Loading requests...</div>
                    ) : musicRequests.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">No requests yet</div>
                    ) : (
                      musicRequests.map((request: any) => (
                        <Card key={request.id} className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-semibold">{request.trackTitle}</h4>
                              <p className="text-sm text-gray-600">by {request.artist}</p>
                              <div className="flex items-center gap-2 mt-2">
                                {getStatusBadge(request)}
                                <span className={`text-xs ${getUrgencyColor(request.urgency)}`}>
                                  {request.urgency} priority
                                </span>
                              </div>
                            </div>
                            {user?.role === 'dj' && !request.isPlayed && (
                              <div className="flex gap-2">
                                {!request.isApproved && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleApproveRequest(request.id)}
                                  >
                                    Approve
                                  </Button>
                                )}
                                {request.isApproved && (
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => handlePlayRequest(request.id)}
                                  >
                                    <Play className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Playlist History Tab */}
          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ListMusic className="h-5 w-5" />
                  DJ Playlist History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {playlistsLoading ? (
                    <div className="col-span-full text-center py-8">Loading playlists...</div>
                  ) : playlists.length === 0 ? (
                    <div className="col-span-full text-center py-8 text-gray-500">
                      No playlists created yet
                    </div>
                  ) : (
                    playlists.map((playlist: any) => (
                      <Card key={playlist.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <ListMusic className="h-5 w-5" />
                            {playlist.name}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-600 mb-4">{playlist.description}</p>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-500">
                                {playlist.trackCount || 0} tracks
                              </span>
                              <Badge variant={playlist.isPublic ? "default" : "outline"}>
                                {playlist.isPublic ? "Public" : "Private"}
                              </Badge>
                            </div>
                            <div className="text-xs text-gray-500">
                              Created {new Date(playlist.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="mt-4 space-y-2">
                            <Button size="sm" className="w-full">
                              <Play className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* DJ Tools Tab */}
          <TabsContent value="dj-tools" className="space-y-6">
            {user?.role !== 'dj' ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-gray-500">DJ tools are available for DJs only.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>AI Assistant</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Button 
                        className="w-full" 
                        onClick={generateAIPlaylist}
                        disabled={isGeneratingPlaylist}
                      >
                        <Bot className="h-4 w-4 mr-2" />
                        {isGeneratingPlaylist ? "Generating..." : "Generate Smart Playlist"}
                      </Button>
                      <Button className="w-full" variant="outline">
                        <Zap className="h-4 w-4 mr-2" />
                        Analyze Dancer Preferences
                      </Button>
                      <Button className="w-full" variant="outline">
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Get Next Song Suggestion
                      </Button>
                      <Button className="w-full" variant="outline">
                        <Users className="h-4 w-4 mr-2" />
                        Crowd Energy Analysis
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Queue Management</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {musicRequests.filter((r: any) => r.isApproved && !r.isPlayed).length === 0 ? (
                        <div className="text-center py-4 text-gray-500">No songs in queue</div>
                      ) : (
                        musicRequests.filter((r: any) => r.isApproved && !r.isPlayed).map((request: any) => (
                          <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium">{request.trackTitle}</p>
                              <p className="text-sm text-gray-600">{request.artist}</p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handlePlayRequest(request.id)}
                              >
                                <Play className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <SkipForward className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}