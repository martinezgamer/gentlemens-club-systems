import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface DancerLineup {
  id: string;
  dancer: {
    id: string;
    stageName: string;
    profileImageUrl?: string;
  };
  status: string;
  startTime: Date;
}

interface DancersWidgetProps {
  clubLocation: string;
}

export function DancersWidget({ clubLocation }: DancersWidgetProps) {
  const { data: lineup, isLoading } = useQuery<DancerLineup[]>({
    queryKey: ['/api/lineup', clubLocation],
  });

  const clubName = clubLocation === 'fantasy_gentlemens_club' ? 'Fantasy' : 'Wiggles';
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on_stage': return 'bg-red-100 text-red-800';
      case 'working': return 'bg-green-100 text-green-800';
      case 'break': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (time: Date) => {
    return new Date(time).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (isLoading) {
    return (
      <div>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">{clubName} Dancers</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                </div>
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
          <CardTitle className="text-lg">{clubName} Dancers</CardTitle>
          <Badge variant="secondary">
            {lineup?.length ?? 0} Active
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {lineup && lineup.length > 0 ? (
            lineup.map((entry: DancerLineup) => (
              <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage 
                      src={entry.dancer.profileImageUrl || undefined}
                      className="object-cover"
                    />
                    <AvatarFallback>
                      {entry.dancer.stageName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {entry.dancer.stageName}
                    </p>
                    <p className="text-xs text-gray-500">
                      Started {formatTime(entry.startTime)}
                    </p>
                  </div>
                </div>
                <Badge className={`text-xs ${getStatusColor(entry.status)}`}>
                  {entry.status.replace('_', ' ')}
                </Badge>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">No dancers currently active</p>
          )}
        </div>
      </CardContent>
    </div>
  );
}