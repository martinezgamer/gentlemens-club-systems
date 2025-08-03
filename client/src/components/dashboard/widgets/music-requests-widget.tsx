import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Music, Clock } from 'lucide-react';

interface MusicRequest {
  id: string;
  songTitle: string;
  artistName: string;
  isApproved: boolean;
  isPlayed: boolean;
  requester: {
    firstName: string;
    lastName: string;
  };
  createdAt: Date;
}

export function MusicRequestsWidget() {
  const { data: requests, isLoading } = useQuery<MusicRequest[]>({
    queryKey: ['/api/music/requests'],
  });

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusBadge = (request: MusicRequest) => {
    if (request.isPlayed) {
      return <Badge className="bg-green-100 text-green-800 text-xs">Played</Badge>;
    }
    if (request.isApproved) {
      return <Badge className="bg-blue-100 text-blue-800 text-xs">Approved</Badge>;
    }
    return <Badge className="bg-yellow-100 text-yellow-800 text-xs">Pending</Badge>;
  };

  const recentRequests = requests?.slice(0, 5) || [];

  if (isLoading) {
    return (
      <div>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Music Requests</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-24 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-20"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </div>
    );
  }

  return (
    <div>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Music Requests</CardTitle>
          <Badge variant="secondary">
            {requests?.length ?? 0} Total
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {recentRequests.length > 0 ? (
            recentRequests.map((request: MusicRequest) => (
              <div key={request.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2 flex-1">
                    <Music className="w-4 h-4 text-gray-400" />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {request.songTitle}
                      </h4>
                      <p className="text-xs text-gray-500 truncate">
                        by {request.artistName}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(request)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {request.requester.firstName} {request.requester.lastName}
                  </span>
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>{formatTime(request.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4">
              <Music className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No requests yet</p>
            </div>
          )}
        </div>
      </CardContent>
    </div>
  );
}