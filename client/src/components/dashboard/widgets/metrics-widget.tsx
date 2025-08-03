import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, DollarSign, Crown, Music } from 'lucide-react';

interface DashboardMetrics {
  staffOnDuty: number;
  todaysTips: number;
  vipSessions: number;
  musicRequests: number;
}

export function MetricsWidget() {
  const { data: metrics, isLoading } = useQuery<DashboardMetrics>({
    queryKey: ['/api/dashboard/metrics'],
  });

  if (isLoading) {
    return (
      <CardContent className="p-6">
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-16 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-24"></div>
            </div>
          ))}
        </div>
      </CardContent>
    );
  }

  return (
    <div>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Overview</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Users className="text-primary text-lg" />
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Staff On Duty</p>
              <p className="text-2xl font-bold text-gray-900">
                {metrics?.staffOnDuty ?? 0}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
              <DollarSign className="text-success text-lg" />
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Today's Tips</p>
              <p className="text-2xl font-bold text-gray-900">
                ${(metrics?.todaysTips ?? 0).toFixed(2)}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
              <Crown className="text-warning text-lg" />
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">VIP Sessions</p>
              <p className="text-2xl font-bold text-gray-900">
                {metrics?.vipSessions ?? 0}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Music className="text-blue-600 text-lg" />
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Music Requests</p>
              <p className="text-2xl font-bold text-gray-900">
                {metrics?.musicRequests ?? 0}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </div>
  );
}