import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, DollarSign, Crown, Music, Plus, UserPlus, Megaphone, BarChart3 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import Header from "@/components/header";

export default function Dashboard() {
  const { user } = useAuth();
  const { lastMessage } = useWebSocket();

  const { data: metrics, refetch: refetchMetrics } = useQuery({
    queryKey: ["/api/dashboard/metrics"],
  });

  const { data: currentStaff, refetch: refetchStaff } = useQuery({
    queryKey: ["/api/dashboard/current-staff"],
  });

  // Refetch data on WebSocket updates
  useEffect(() => {
    if (lastMessage) {
      refetchMetrics();
      refetchStaff();
    }
  }, [lastMessage, refetchMetrics, refetchStaff]);

  const formatDuration = (clockInTime: string) => {
    const start = new Date(clockInTime);
    const now = new Date();
    const diff = now.getTime() - start.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <>
      <Header title="Dashboard" />
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-primary to-blue-600 rounded-2xl p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">
            Welcome back, {user?.firstName || 'User'}!
          </h2>
          <p className="text-blue-100">Here's what's happening at your club today</p>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Staff On Duty</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {metrics?.staffOnDuty || 0}
                  </p>
                  <p className="text-success text-sm font-medium">Currently working</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Users className="text-primary text-xl" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Today's Tips</p>
                  <p className="text-3xl font-bold text-gray-900">
                    ${metrics?.todaysTips?.toFixed(2) || '0.00'}
                  </p>
                  <p className="text-success text-sm font-medium">Logged today</p>
                </div>
                <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                  <DollarSign className="text-success text-xl" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">VIP Sessions</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {metrics?.vipSessions || 0}
                  </p>
                  <p className="text-warning text-sm font-medium">Today</p>
                </div>
                <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                  <Crown className="text-warning text-xl" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Music Requests</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {metrics?.musicRequests || 0}
                  </p>
                  <p className="text-error text-sm font-medium">Pending</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Music className="text-purple-600 text-xl" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Current Staff and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Current Staff Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Staff Currently Working</CardTitle>
                <Badge variant="secondary" className="bg-success/10 text-success">
                  {currentStaff?.length || 0} Online
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {currentStaff?.length ? (
                  currentStaff.map((entry: any) => (
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
                        <div>
                          <p className="font-medium text-gray-900">
                            {entry.user.firstName} {entry.user.lastName}
                          </p>
                          <p className="text-sm text-gray-500 capitalize">
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
          </Card>

          {/* Recent Activity Feed */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">
                      System initialized and ready
                    </p>
                    <p className="text-xs text-gray-500">Just now</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button 
                variant="outline" 
                className="flex flex-col items-center p-6 h-auto space-y-3 border-dashed hover:border-primary hover:bg-primary/5"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Plus className="text-primary text-xl" />
                </div>
                <span className="text-sm font-medium text-gray-700">Create Task</span>
              </Button>

              <Button 
                variant="outline" 
                className="flex flex-col items-center p-6 h-auto space-y-3 border-dashed hover:border-success hover:bg-success/5"
              >
                <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                  <UserPlus className="text-success text-xl" />
                </div>
                <span className="text-sm font-medium text-gray-700">Invite Staff</span>
              </Button>

              <Button 
                variant="outline" 
                className="flex flex-col items-center p-6 h-auto space-y-3 border-dashed hover:border-warning hover:bg-warning/5"
              >
                <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                  <Megaphone className="text-warning text-xl" />
                </div>
                <span className="text-sm font-medium text-gray-700">Announcement</span>
              </Button>

              <Button 
                variant="outline" 
                className="flex flex-col items-center p-6 h-auto space-y-3 border-dashed hover:border-purple-500 hover:bg-purple-50"
              >
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="text-purple-600 text-xl" />
                </div>
                <span className="text-sm font-medium text-gray-700">View Reports</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
