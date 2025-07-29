import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { 
  UserPlus, 
  Check, 
  X, 
  Eye, 
  Share2,
  Copy,
  ExternalLink,
  Building2,
  Calendar,
  Phone,
  Mail,
  MapPin,
  UserCheck,
  UserX,
  Clock,
  AlertCircle
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useClubSelection } from "@/hooks/useClubSelection";
import { queryClient, apiRequest } from "@/lib/queryClient";
import Header from "@/components/header";

interface DancerApplication {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  address?: string;
  dateOfBirth?: Date;
  ssn?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  stageName?: string;
  experience?: string;
  availability?: string;
  idDocumentUrl?: string;
  idDocumentType?: string;
  clubLocation: string;
  status: string;
  interviewDate?: Date;
  interviewNotes?: string;
  backgroundCheckStatus?: string;
  documents?: string;
  notes?: string;
  reviewedBy?: string;
  approvedBy?: string;
  rejectedReason?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const clubLabels = {
  club_1: "Main Location - Downtown",
  club_2: "Second Location - Uptown"
};

const statusLabels = {
  pending: { label: "Pending Review", color: "bg-yellow-100 text-yellow-800" },
  approved: { label: "Approved", color: "bg-green-100 text-green-800" },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-800" },
  interview_scheduled: { label: "Interview Scheduled", color: "bg-blue-100 text-blue-800" },
  background_check: { label: "Background Check", color: "bg-purple-100 text-purple-800" },
  active: { label: "Active Dancer", color: "bg-emerald-100 text-emerald-800" },
  inactive: { label: "Inactive", color: "bg-gray-100 text-gray-800" }
};

export default function DancerApplications() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { selectedClub } = useClubSelection();
  const [selectedTab, setSelectedTab] = useState("dancers");
  const [selectedApplication, setSelectedApplication] = useState<DancerApplication | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Determine if user can see all clubs or just their assigned club
  const isSuperuser = user?.role === 'superuser';
  const userClub = isSuperuser ? undefined : user?.clubLocation;

  // Get dancer applications with club filtering
  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['/api/dancer-applications', userClub],
    queryFn: async () => {
      const params = userClub ? `?clubLocation=${userClub}` : '';
      return await apiRequest(`/api/dancer-applications${params}`);
    }
  });

  // Get active dancers
  const { data: activeDancers = [] } = useQuery({
    queryKey: ['/api/dancers/active', userClub],
    queryFn: async () => {
      const params = userClub ? `?clubLocation=${userClub}` : '';
      return await apiRequest(`/api/dancers/active${params}`);
    }
  });

  // Get inactive dancers
  const { data: inactiveDancers = [] } = useQuery({
    queryKey: ['/api/dancers/inactive', userClub],
    queryFn: async () => {
      const params = userClub ? `?clubLocation=${userClub}` : '';
      return await apiRequest(`/api/dancers/inactive${params}`);
    }
  });

  // Approve application
  const approveApplication = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/dancer-applications/${id}/approve`, {
        method: 'PUT'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dancer-applications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dancers/active'] });
      toast({
        title: "Application Approved",
        description: "The dancer application has been approved successfully."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve application",
        variant: "destructive"
      });
    }
  });

  // Reject application
  const rejectApplication = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      return await apiRequest(`/api/dancer-applications/${id}/reject`, {
        method: 'PUT',
        body: JSON.stringify({ reason })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dancer-applications'] });
      toast({
        title: "Application Rejected",
        description: "The dancer application has been rejected."
      });
      setSelectedApplication(null);
      setRejectionReason("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reject application",
        variant: "destructive"
      });
    }
  });

  // Toggle dancer status
  const toggleDancerStatus = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/dancers/${id}/toggle-status`, {
        method: 'PUT'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dancers/active'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dancers/inactive'] });
      toast({
        title: "Status Updated",
        description: "Dancer status has been updated successfully."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update dancer status",
        variant: "destructive"
      });
    }
  });

  const copyApplicationLink = () => {
    const applicationUrl = `${window.location.origin}/apply`;
    navigator.clipboard.writeText(applicationUrl);
    toast({
      title: "Link Copied!",
      description: "The application link has been copied to your clipboard."
    });
  };

  const openApplicationLink = () => {
    window.open('/apply', '_blank');
  };

  const getDancerDisplayName = (dancer: DancerApplication) => {
    if (dancer.stageName) {
      return `${dancer.firstName} "${dancer.stageName}" ${dancer.lastName}`;
    }
    return `${dancer.firstName} ${dancer.lastName}`;
  };

  const pendingApplications = applications.filter((app: DancerApplication) => 
    ['pending', 'interview_scheduled', 'background_check'].includes(app.status)
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading dancer information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Header title="Dancer Management" />
      
      {/* Application Link Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Public Application Form
          </CardTitle>
          <CardDescription>
            Share this link with potential dancers to apply online with AI assistance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <div className="font-mono text-sm bg-white px-3 py-2 rounded border">
                {window.location.origin}/apply
              </div>
            </div>
            <Button onClick={copyApplicationLink} size="sm" variant="outline">
              <Copy className="h-4 w-4 mr-2" />
              Copy Link
            </Button>
            <Button onClick={openApplicationLink} size="sm">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Form
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="dancers" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Active Dancers ({activeDancers.length})
          </TabsTrigger>
          <TabsTrigger value="applications" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pending Applications ({pendingApplications.length})
          </TabsTrigger>
          <TabsTrigger value="inactive" className="flex items-center gap-2">
            <UserX className="h-4 w-4" />
            Inactive Dancers ({inactiveDancers.length})
          </TabsTrigger>
        </TabsList>

        {/* Active Dancers Tab */}
        <TabsContent value="dancers">
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Active Dancers</h2>
              <Badge variant="secondary">{activeDancers.length} dancers</Badge>
            </div>
            
            {activeDancers.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No active dancers found.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {activeDancers.map((dancer: DancerApplication) => (
                  <Card key={dancer.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-lg">
                            {getDancerDisplayName(dancer)}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                            <Building2 className="h-4 w-4" />
                            {clubLabels[dancer.clubLocation as keyof typeof clubLabels]}
                          </div>
                        </div>
                        <Badge className={statusLabels[dancer.status as keyof typeof statusLabels]?.color || statusLabels.active.color}>
                          {statusLabels[dancer.status as keyof typeof statusLabels]?.label || 'Active'}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          {dancer.email}
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          {dancer.phoneNumber}
                        </div>
                        {dancer.dateOfBirth && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            Joined {format(new Date(dancer.createdAt), 'MMM dd, yyyy')}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 mt-4">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" className="flex-1">
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>{getDancerDisplayName(dancer)}</DialogTitle>
                              <DialogDescription>
                                Dancer details and information
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium">Email</label>
                                  <p className="text-sm text-gray-600">{dancer.email}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Phone</label>
                                  <p className="text-sm text-gray-600">{dancer.phoneNumber}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Club Location</label>
                                  <p className="text-sm text-gray-600">
                                    {clubLabels[dancer.clubLocation as keyof typeof clubLabels]}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Status</label>
                                  <Badge className={statusLabels[dancer.status as keyof typeof statusLabels]?.color || statusLabels.active.color}>
                                    {statusLabels[dancer.status as keyof typeof statusLabels]?.label || 'Active'}
                                  </Badge>
                                </div>
                              </div>
                              
                              {dancer.experience && (
                                <div>
                                  <label className="text-sm font-medium">Experience</label>
                                  <p className="text-sm text-gray-600 mt-1">{dancer.experience}</p>
                                </div>
                              )}
                              
                              {dancer.availability && (
                                <div>
                                  <label className="text-sm font-medium">Availability</label>
                                  <p className="text-sm text-gray-600 mt-1">{dancer.availability}</p>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                        
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => toggleDancerStatus.mutate(dancer.id)}
                          disabled={toggleDancerStatus.isPending}
                        >
                          <UserX className="h-4 w-4 mr-2" />
                          Deactivate
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Pending Applications Tab */}
        <TabsContent value="applications">
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Pending Applications</h2>
              <Badge variant="secondary">{pendingApplications.length} applications</Badge>
            </div>
            
            {pendingApplications.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No pending applications.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {pendingApplications.map((application: DancerApplication) => (
                  <Card key={application.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-lg">
                            {getDancerDisplayName(application)}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                            <div className="flex items-center gap-1">
                              <Mail className="h-4 w-4" />
                              {application.email}
                            </div>
                            <div className="flex items-center gap-1">
                              <Phone className="h-4 w-4" />
                              {application.phoneNumber}
                            </div>
                            <div className="flex items-center gap-1">
                              <Building2 className="h-4 w-4" />
                              {clubLabels[application.clubLocation as keyof typeof clubLabels]}
                            </div>
                          </div>
                        </div>
                        <Badge className={statusLabels[application.status as keyof typeof statusLabels]?.color || statusLabels.pending.color}>
                          {statusLabels[application.status as keyof typeof statusLabels]?.label || 'Pending'}
                        </Badge>
                      </div>

                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4 mr-2" />
                              Review Application
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>{getDancerDisplayName(application)}</DialogTitle>
                              <DialogDescription>
                                Review application details and make a decision
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-6">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium">Full Name</label>
                                  <p className="text-sm text-gray-600">{application.firstName} {application.lastName}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Stage Name</label>
                                  <p className="text-sm text-gray-600">{application.stageName || 'Not provided'}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Email</label>
                                  <p className="text-sm text-gray-600">{application.email}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Phone</label>
                                  <p className="text-sm text-gray-600">{application.phoneNumber}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Club Location</label>
                                  <p className="text-sm text-gray-600">
                                    {clubLabels[application.clubLocation as keyof typeof clubLabels]}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Application Date</label>
                                  <p className="text-sm text-gray-600">
                                    {format(new Date(application.createdAt), 'MMM dd, yyyy')}
                                  </p>
                                </div>
                              </div>

                              {application.experience && (
                                <div>
                                  <label className="text-sm font-medium">Experience</label>
                                  <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{application.experience}</p>
                                </div>
                              )}

                              {application.availability && (
                                <div>
                                  <label className="text-sm font-medium">Availability</label>
                                  <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{application.availability}</p>
                                </div>
                              )}

                              <div className="flex gap-3 pt-4 border-t">
                                <Button 
                                  onClick={() => approveApplication.mutate(application.id)}
                                  disabled={approveApplication.isPending}
                                  className="flex-1"
                                >
                                  <Check className="h-4 w-4 mr-2" />
                                  Approve Application
                                </Button>
                                
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="destructive" className="flex-1">
                                      <X className="h-4 w-4 mr-2" />
                                      Reject Application
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Reject Application</DialogTitle>
                                      <DialogDescription>
                                        Please provide a reason for rejecting this application.
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <Textarea
                                        placeholder="Enter rejection reason..."
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                      />
                                      <div className="flex gap-2">
                                        <Button
                                          variant="destructive"
                                          onClick={() => rejectApplication.mutate({ 
                                            id: application.id, 
                                            reason: rejectionReason 
                                          })}
                                          disabled={!rejectionReason.trim() || rejectApplication.isPending}
                                          className="flex-1"
                                        >
                                          Confirm Rejection
                                        </Button>
                                      </div>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Inactive Dancers Tab */}
        <TabsContent value="inactive">
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Inactive Dancers</h2>
              <Badge variant="secondary">{inactiveDancers.length} dancers</Badge>
            </div>
            
            {inactiveDancers.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <UserX className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No inactive dancers.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {inactiveDancers.map((dancer: DancerApplication) => (
                  <Card key={dancer.id} className="hover:shadow-md transition-shadow opacity-75">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-lg">
                            {getDancerDisplayName(dancer)}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                            <Building2 className="h-4 w-4" />
                            {clubLabels[dancer.clubLocation as keyof typeof clubLabels]}
                          </div>
                        </div>
                        <Badge className="bg-gray-100 text-gray-800">
                          Inactive
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          {dancer.email}
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          {dancer.phoneNumber}
                        </div>
                      </div>

                      <div className="flex gap-2 mt-4">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => toggleDancerStatus.mutate(dancer.id)}
                          disabled={toggleDancerStatus.isPending}
                          className="flex-1"
                        >
                          <UserCheck className="h-4 w-4 mr-2" />
                          Reactivate
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}