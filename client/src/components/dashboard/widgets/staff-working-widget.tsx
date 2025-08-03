import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface StaffEntry {
  id: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
    profileImageUrl?: string;
  };
  clockInTime: Date;
  shiftType: string;
}

export function StaffWorkingWidget() {
  const { data: currentStaff, isLoading } = useQuery<StaffEntry[]>({
    queryKey: ['/api/dashboard/current-staff'],
  });

  const formatDuration = (clockInTime: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(clockInTime).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  if (isLoading) {
    return (
      <div>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Staff Currently Working</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-32 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-20"></div>
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
          <CardTitle className="text-lg">Staff Currently Working</CardTitle>
          <Badge variant="secondary" className="bg-success/10 text-success">
            {currentStaff?.length ?? 0} Online
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {currentStaff && currentStaff.length > 0 ? (
            currentStaff.map((entry: StaffEntry) => (
              <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage 
                      src={entry.user.profileImageUrl || undefined}
                      className="object-cover"
                    />
                    <AvatarFallback>
                      {entry.user.firstName?.[0]}{entry.user.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {entry.user.firstName} {entry.user.lastName}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {entry.user.role?.replace('_', ' ')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {formatDuration(entry.clockInTime)}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {entry.shiftType} Shift
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">No staff currently working</p>
          )}
        </div>
      </CardContent>
    </div>
  );
}