import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, DollarSign, Crown, Music, Plus, UserPlus, Megaphone, BarChart3 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import { formatDuration } from "@/lib/utils";
import Header from "@/components/header";
import { useLocation } from "wouter";

import CurrentDancersCard from "@/components/current-dancers-card";

export default function Dashboard() {
  const { user } = useAuth();
  const { lastMessage } = useWebSocket();
  const [, setLocation] = useLocation();

  const { data: metrics, refetch: refetchMetrics } = useQuery<{
    staffOnDuty: number;
    todaysTips: number;
    vipSessions: number;
    musicRequests: number;
  }>({
    queryKey: ["/api/dashboard/metrics"],
  });

  const { data: currentStaff, refetch: refetchStaff } = useQuery<Array<{
    id: string;
    userId: string;
    clockInTime: string;
    clockOutTime?: string;
    user: {
      id: string;
      email: string;
      firstName?: string;
      lastName?: string;
      role?: string;
    };
  }>>({
    queryKey: ["/api/dashboard/current-staff"],
  });

  // Refetch data on WebSocket updates
  useEffect(() => {
    if (lastMessage) {
      refetchMetrics();
      refetchStaff();
    }
  }, [lastMessage, refetchMetrics, refetchStaff]);



  return (
    <>
      <Header title="Dashboard" />
      <div className="space-y-6 lg:space-y-8 relative">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-primary to-blue-600 rounded-2xl p-4 lg:p-6 text-white">
          <h2 className="text-xl lg:text-2xl font-bold mb-2">
            Welcome back, {user?.firstName || user?.email?.split('@')[0] || 'User'}!
          </h2>
          <p className="text-blue-100 text-sm lg:text-base">Here's what's happening at your club today</p>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
          <Card>
            <CardContent className="p-3 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-xs lg:text-sm font-medium">Staff On Duty</p>
                  <p className="text-lg lg:text-3xl font-bold text-gray-900">
                    {metrics?.staffOnDuty ?? 0}
                  </p>
                  <p className="text-success text-xs lg:text-sm font-medium">Currently working</p>
                </div>
                <div className="w-8 h-8 lg:w-12 lg:h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Users className="text-primary text-sm lg:text-xl" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-xs lg:text-sm font-medium">Today's Tips</p>
                  <p className="text-lg lg:text-3xl font-bold text-gray-900">
                    ${(metrics?.todaysTips ?? 0).toFixed(2)}
                  </p>
                  <p className="text-success text-xs lg:text-sm font-medium">Logged today</p>
                </div>
                <div className="w-8 h-8 lg:w-12 lg:h-12 bg-success/10 rounded-lg flex items-center justify-center">
                  <DollarSign className="text-success text-sm lg:text-xl" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-xs lg:text-sm font-medium">VIP Sessions</p>
                  <p className="text-lg lg:text-3xl font-bold text-gray-900">
                    {metrics?.vipSessions ?? 0}
                  </p>
                  <p className="text-warning text-xs lg:text-sm font-medium">Today</p>
                </div>
                <div className="w-8 h-8 lg:w-12 lg:h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                  <Crown className="text-warning text-sm lg:text-xl" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-xs lg:text-sm font-medium">Music Requests</p>
                  <p className="text-lg lg:text-3xl font-bold text-gray-900">
                    {metrics?.musicRequests ?? 0}
                  </p>
                  <p className="text-error text-xs lg:text-sm font-medium">Pending</p>
                </div>
                <div className="w-8 h-8 lg:w-12 lg:h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Music className="text-purple-600 text-sm lg:text-xl" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Current Staff and Dancers Lineup */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Current Staff Table */}
          <Card>
            <CardHeader className="pb-3 lg:pb-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg lg:text-xl">Staff Currently Working</CardTitle>
                <Badge variant="secondary" className="bg-success/10 text-success text-xs lg:text-sm">
                  {currentStaff?.length ?? 0} Online
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3 lg:space-y-4">
                {currentStaff && currentStaff.length > 0 ? (
                  currentStaff.map((entry: any) => (
                    <div key={entry.id} className="flex items-center justify-between p-2 lg:p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-2 lg:space-x-3">
                        <Avatar className="w-8 h-8 lg:w-10 lg:h-10">
                          <AvatarImage 
                            src={entry.user.profileImageUrl || undefined}
                            className="object-cover"
                          />
                          <AvatarFallback>
                            {entry.user.firstName?.[0]}{entry.user.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm lg:text-base font-medium text-gray-900 truncate">
                            {entry.user.firstName} {entry.user.lastName}
                          </p>
                          <p className="text-xs lg:text-sm text-gray-500 capitalize">
                            {entry.user.role?.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs lg:text-sm font-medium text-gray-900">
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
          </Card>

          {/* Current Dancers - Fantasy */}
          <CurrentDancersCard clubLocation="fantasy_gentlemens_club" />

          {/* Current Dancers - Wiggles */}
          <CurrentDancersCard clubLocation="wiggles_gentlemens_club" />
        </div>



        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-3 lg:pb-6">
            <CardTitle className="text-lg lg:text-xl">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
              <Button 
                variant="outline" 
                className="flex flex-col items-center p-3 lg:p-6 h-auto space-y-2 lg:space-y-3 border-dashed hover:border-primary hover:bg-primary/5"
                onClick={() => setLocation('/tasks')}
              >
                <div className="w-8 h-8 lg:w-12 lg:h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Plus className="text-primary text-sm lg:text-xl" />
                </div>
                <span className="text-xs lg:text-sm font-medium text-gray-700">Create Task</span>
              </Button>

              <Button 
                variant="outline" 
                className="flex flex-col items-center p-3 lg:p-6 h-auto space-y-2 lg:space-y-3 border-dashed hover:border-success hover:bg-success/5"
                onClick={() => setLocation('/staff')}
              >
                <div className="w-8 h-8 lg:w-12 lg:h-12 bg-success/10 rounded-lg flex items-center justify-center">
                  <UserPlus className="text-success text-sm lg:text-xl" />
                </div>
                <span className="text-xs lg:text-sm font-medium text-gray-700">Invite Staff</span>
              </Button>

              <Button 
                variant="outline" 
                className="flex flex-col items-center p-3 lg:p-6 h-auto space-y-2 lg:space-y-3 border-dashed hover:border-warning hover:bg-warning/5"
                onClick={() => setLocation('/messages')}
              >
                <div className="w-8 h-8 lg:w-12 lg:h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                  <Megaphone className="text-warning text-sm lg:text-xl" />
                </div>
                <span className="text-xs lg:text-sm font-medium text-gray-700">Announcement</span>
              </Button>

              <Button 
                variant="outline" 
                className="flex flex-col items-center p-3 lg:p-6 h-auto space-y-2 lg:space-y-3 border-dashed hover:border-blue-500 hover:bg-blue-50"
                onClick={() => setLocation('/admin')}
              >
                <div className="w-8 h-8 lg:w-12 lg:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="text-blue-600 text-sm lg:text-xl" />
                </div>
                <span className="text-xs lg:text-sm font-medium text-gray-700">View Reports</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
