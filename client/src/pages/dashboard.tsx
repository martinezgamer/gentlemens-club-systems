import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, DollarSign, Crown, Music, Plus, UserPlus, Megaphone, BarChart3, Brain } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import Header from "@/components/header";
import { AIInsightsDashboard } from "@/components/ai-insights-dashboard";
import { AIChatAssistant } from "@/components/ai-chat-assistant";
import { AILiveMetrics } from "@/components/ai-live-metrics";
import { AISmartNotifications } from "@/components/ai-smart-notifications";

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
      <AISmartNotifications />
      <div className="space-y-6 lg:space-y-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-primary to-blue-600 rounded-2xl p-4 lg:p-6 text-white">
          <h2 className="text-xl lg:text-2xl font-bold mb-2">
            Welcome back, {user?.firstName || 'User'}!
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
                    {metrics?.staffOnDuty || 0}
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
                    ${metrics?.todaysTips?.toFixed(2) || '0.00'}
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
                    {metrics?.vipSessions || 0}
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
                    {metrics?.musicRequests || 0}
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

        {/* Current Staff and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          {/* Current Staff Table */}
          <Card>
            <CardHeader className="pb-3 lg:pb-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg lg:text-xl">Staff Currently Working</CardTitle>
                <Badge variant="secondary" className="bg-success/10 text-success text-xs lg:text-sm">
                  {currentStaff?.length || 0} Online
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3 lg:space-y-4">
                {currentStaff?.length ? (
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

          {/* Recent Activity Feed */}
          <Card>
            <CardHeader className="pb-3 lg:pb-6">
              <CardTitle className="text-lg lg:text-xl">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3 lg:space-y-4">
                <div className="flex items-start space-x-2 lg:space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-1.5 lg:mt-2 flex-shrink-0"></div>
                  <div className="flex-1">
                    <p className="text-xs lg:text-sm text-gray-900">
                      System initialized and ready
                    </p>
                    <p className="text-xs text-gray-500">Just now</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Intelligence Center */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          <div className="lg:col-span-2">
            <AIInsightsDashboard />
          </div>
          <div className="lg:col-span-1 space-y-4">
            <AIChatAssistant />
            <AILiveMetrics />
          </div>
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
              >
                <div className="w-8 h-8 lg:w-12 lg:h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Plus className="text-primary text-sm lg:text-xl" />
                </div>
                <span className="text-xs lg:text-sm font-medium text-gray-700">Create Task</span>
              </Button>

              <Button 
                variant="outline" 
                className="flex flex-col items-center p-3 lg:p-6 h-auto space-y-2 lg:space-y-3 border-dashed hover:border-success hover:bg-success/5"
              >
                <div className="w-8 h-8 lg:w-12 lg:h-12 bg-success/10 rounded-lg flex items-center justify-center">
                  <UserPlus className="text-success text-sm lg:text-xl" />
                </div>
                <span className="text-xs lg:text-sm font-medium text-gray-700">Invite Staff</span>
              </Button>

              <Button 
                variant="outline" 
                className="flex flex-col items-center p-3 lg:p-6 h-auto space-y-2 lg:space-y-3 border-dashed hover:border-warning hover:bg-warning/5"
              >
                <div className="w-8 h-8 lg:w-12 lg:h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                  <Megaphone className="text-warning text-sm lg:text-xl" />
                </div>
                <span className="text-xs lg:text-sm font-medium text-gray-700">Announcement</span>
              </Button>

              <Button 
                variant="outline" 
                className="flex flex-col items-center p-3 lg:p-6 h-auto space-y-2 lg:space-y-3 border-dashed hover:border-purple-500 hover:bg-purple-50"
              >
                <div className="w-8 h-8 lg:w-12 lg:h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Brain className="text-purple-600 text-sm lg:text-xl" />
                </div>
                <span className="text-xs lg:text-sm font-medium text-gray-700">AI Insights</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
