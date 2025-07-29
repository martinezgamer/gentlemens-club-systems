import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useClubSelection, clubs } from "@/hooks/useClubSelection";
import { useQuery } from "@tanstack/react-query";
import { Building2, Users, Clock, MessageSquare, UserPlus, FileText, Activity } from "lucide-react";

export default function SuperuserDashboard() {
  const { selectedClub, setSelectedClub } = useClubSelection();

  // Get dashboard data for selected club
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['/api/dashboard/superuser', selectedClub],
    enabled: !!selectedClub
  });

  // Get dancer applications
  const { data: applications = [] } = useQuery({
    queryKey: ['/api/dancer-applications', selectedClub],
    enabled: !!selectedClub
  });

  // Get staff notes summary
  const { data: staffNotes = {} } = useQuery({
    queryKey: ['/api/staff-notes/summary', selectedClub],
    enabled: !!selectedClub
  });

  const selectedClubInfo = clubs.find(club => club.id === selectedClub);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header with Club Selection */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Superuser Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage both club locations and oversee operations
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-gray-500" />
            <span className="text-sm font-medium">Club Location:</span>
          </div>
          <Select value={selectedClub} onValueChange={setSelectedClub}>
            <SelectTrigger className="w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {clubs.map((club) => (
                <SelectItem key={club.id} value={club.id}>
                  <div className="flex flex-col">
                    <span className="font-medium">{club.name}</span>
                    <span className="text-xs text-gray-500">{club.address}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Current Club Info */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Currently Managing: {selectedClubInfo?.name}
          </CardTitle>
          <CardDescription>
            {selectedClubInfo?.address}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(dashboardData as any)?.activeStaff || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently on duty
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Applications</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(applications as any[]).filter((app: any) => app.status === 'pending').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(dashboardData as any)?.unreadMessages || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Requiring attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Notes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(staffNotes as any)?.recent || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Last 24 hours
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Management Tabs */}
      <Tabs defaultValue="applications" className="space-y-6">
        <TabsList>
          <TabsTrigger value="applications">Dancer Applications</TabsTrigger>
          <TabsTrigger value="staff">Staff Management</TabsTrigger>
          <TabsTrigger value="notes">Staff Notes</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="applications">
          <Card>
            <CardHeader>
              <CardTitle>Dancer Applications - {selectedClubInfo?.name}</CardTitle>
              <CardDescription>
                Review and process new dancer applications for this location
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(applications as any[]).length > 0 ? (
                <div className="space-y-4">
                  {(applications as any[]).map((app: any) => (
                    <div key={app.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{app.firstName} {app.lastName}</h4>
                        <p className="text-sm text-gray-600">{app.email} • {app.phone}</p>
                        <p className="text-sm text-gray-500 mt-1">{app.experience}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={app.status === 'pending' ? 'secondary' : 
                                      app.status === 'approved' ? 'default' : 'destructive'}>
                          {app.status}
                        </Badge>
                        {app.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">Review</Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No applications for {selectedClubInfo?.name}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="staff">
          <Card>
            <CardHeader>
              <CardTitle>Staff Management - {selectedClubInfo?.name}</CardTitle>
              <CardDescription>
                Current staff members and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                Staff management interface will be implemented here
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <CardTitle>Staff Notes - {selectedClubInfo?.name}</CardTitle>
              <CardDescription>
                Recent notes and tracking for staff members
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                Staff notes interface will be implemented here
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity - {selectedClubInfo?.name}</CardTitle>
              <CardDescription>
                Latest activities and events at this location
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                Activity feed will be implemented here
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}