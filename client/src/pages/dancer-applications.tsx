import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { 
  UserPlus, 
  Upload, 
  Check, 
  X, 
  Eye, 
  FileText, 
  Calendar,
  Phone,
  Mail,
  MapPin,
  Clock,
  Shield,
  AlertCircle,
  Users,
  UserCheck,
  UserX
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useClubSelection } from "@/hooks/useClubSelection";
import { queryClient } from "@/lib/queryClient";
import { insertDancerApplicationSchema } from "@shared/schema";
import { z } from "zod";

type DancerApplication = {
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
};

const applicationFormSchema = insertDancerApplicationSchema.extend({
  dateOfBirth: z.string().optional(),
});

export default function DancerApplications() {
  const { user } = useAuth();
  const { selectedClub } = useClubSelection();
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const canManage = user?.role && ['superuser', 'manager', 'house_mom', 'house_dad'].includes(user.role);

  const form = useForm<z.infer<typeof applicationFormSchema>>({
    resolver: zodResolver(applicationFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      address: "",
      emergencyContact: "",
      emergencyPhone: "",
      stageName: "",
      experience: "",
      availability: "",
      clubLocation: selectedClub,
      idDocumentType: "drivers_license",
    },
  });

  // Fetch applications
  const { data: applications = [], refetch: refetchApplications } = useQuery({
    queryKey: ['/api/dancer-applications', selectedClub],
    enabled: canManage,
  });

  // Fetch active dancers
  const { data: activeDancers = [], refetch: refetchActive } = useQuery({
    queryKey: ['/api/dancers/active', selectedClub],
    enabled: canManage,
  });

  // Fetch inactive dancers  
  const { data: inactiveDancers = [], refetch: refetchInactive } = useQuery({
    queryKey: ['/api/dancers/inactive', selectedClub],
    enabled: canManage,
  });

  // Create application mutation
  const createApplication = useMutation({
    mutationFn: async (data: z.infer<typeof applicationFormSchema>) => {
      let idDocumentUrl = "";
      
      // Handle file upload
      if (selectedFile) {
        setUploading(true);
        const formData = new FormData();
        formData.append('file', selectedFile);
        
        const uploadResponse = await fetch('/api/upload-document', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });
        
        if (uploadResponse.ok) {
          const { url } = await uploadResponse.json();
          idDocumentUrl = url;
        }
        setUploading(false);
      }

      const applicationData = {
        ...data,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
        idDocumentUrl,
        clubLocation: selectedClub,
      };

      const response = await fetch('/api/dancer-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(applicationData),
      });

      if (!response.ok) throw new Error('Failed to submit application');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Application submitted successfully!" });
      form.reset();
      setSelectedFile(null);
      refetchApplications();
    },
    onError: (error) => {
      toast({ title: "Error submitting application", description: error.message, variant: "destructive" });
    },
  });

  // Approve application mutation
  const approveApplication = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/dancer-applications/${id}/approve`, {
        method: 'PUT',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to approve application');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Application approved successfully!" });
      refetchApplications();
      refetchActive();
    },
  });

  // Reject application mutation
  const rejectApplication = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const response = await fetch(`/api/dancer-applications/${id}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason }),
      });
      if (!response.ok) throw new Error('Failed to reject application');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Application rejected" });
      refetchApplications();
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: "File too large", description: "Please select a file smaller than 10MB", variant: "destructive" });
        return;
      }
      
      // Check file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast({ title: "Invalid file type", description: "Please select a JPG, PNG, GIF, or PDF file", variant: "destructive" });
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const onSubmit = (data: z.infer<typeof applicationFormSchema>) => {
    createApplication.mutate(data);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "outline",
      under_review: "secondary", 
      approved: "default",
      rejected: "destructive",
      interview_scheduled: "secondary",
      background_check: "secondary",
      training: "secondary"
    };
    return <Badge variant={variants[status] || "outline"}>{status.replace('_', ' ')}</Badge>;
  };

  if (!canManage) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dancer Application</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Apply to Become a Dancer
            </CardTitle>
            <CardDescription>
              Submit your application to join our team at {selectedClub === 'club_1' ? 'Main Location' : 'Second Location'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your first name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your last name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Enter your email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="(555) 123-4567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Birth</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ssn"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Social Security Number</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="XXX-XX-XXXX" 
                            maxLength={11}
                            {...field} 
                            onChange={(e) => {
                              let value = e.target.value.replace(/\D/g, '');
                              if (value.length >= 6) {
                                value = `${value.slice(0, 3)}-${value.slice(3, 5)}-${value.slice(5, 9)}`;
                              } else if (value.length >= 4) {
                                value = `${value.slice(0, 3)}-${value.slice(3)}`;
                              }
                              field.onChange(value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="emergencyContact"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Emergency Contact</FormLabel>
                        <FormControl>
                          <Input placeholder="Emergency contact name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="emergencyPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Emergency Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="Emergency contact phone" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="stageName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stage Name (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your preferred stage name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* ID Document Upload */}
                <div className="space-y-4">
                  <Label>ID Document Upload *</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="idDocumentType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Document Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select document type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="drivers_license">Driver's License</SelectItem>
                              <SelectItem value="state_id">State ID</SelectItem>
                              <SelectItem value="passport">Passport</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="space-y-2">
                      <Label>Upload Document</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={handleFileChange}
                          className="flex-1"
                        />
                        <Upload className="h-4 w-4 text-muted-foreground" />
                      </div>
                      {selectedFile && (
                        <p className="text-sm text-muted-foreground">
                          Selected: {selectedFile.name}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        JPG, PNG, GIF, or PDF. Max 10MB.
                      </p>
                    </div>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="experience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Previous Experience</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe any relevant experience in the entertainment industry..."
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="availability"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Availability</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe your availability (days, times, etc.)..."
                          className="min-h-[80px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    All information provided will be kept confidential and used solely for employment purposes. 
                    By submitting this application, you consent to a background check if your application is approved for further review.
                  </AlertDescription>
                </Alert>

                <Button 
                  type="submit" 
                  disabled={createApplication.isPending || uploading}
                  className="w-full"
                >
                  {createApplication.isPending || uploading ? "Submitting..." : "Submit Application"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Management interface for authorized roles
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dancer Management</h1>
      </div>

      <Tabs defaultValue="applications" className="space-y-4">
        <TabsList>
          <TabsTrigger value="applications" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Applications ({applications.length})
          </TabsTrigger>
          <TabsTrigger value="active" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Active Dancers ({activeDancers.length})
          </TabsTrigger>
          <TabsTrigger value="inactive" className="flex items-center gap-2">
            <UserX className="h-4 w-4" />
            Inactive Dancers ({inactiveDancers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="applications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Applications</CardTitle>
              <CardDescription>
                Review and manage dancer applications for {selectedClub === 'club_1' ? 'Main Location' : 'Second Location'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {applications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No applications found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {applications.map((app: DancerApplication) => (
                    <Card key={app.id} className="border">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-semibold">{app.firstName} {app.lastName}</h3>
                            <p className="text-sm text-muted-foreground">{app.stageName && `"${app.stageName}"`}</p>
                          </div>
                          {getStatusBadge(app.status)}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-4 w-4" />
                            {app.email}
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4" />
                            {app.phoneNumber}
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4" />
                            Applied {format(new Date(app.createdAt), 'MMM d, yyyy')}
                          </div>
                        </div>

                        {app.experience && (
                          <div className="mb-4">
                            <Label className="text-sm font-medium">Experience:</Label>
                            <p className="text-sm text-muted-foreground mt-1">{app.experience}</p>
                          </div>
                        )}

                        {app.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => approveApplication.mutate(app.id)}
                              disabled={approveApplication.isPending}
                              className="flex items-center gap-2"
                            >
                              <Check className="h-4 w-4" />
                              Approve
                            </Button>
                            
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="flex items-center gap-2">
                                  <X className="h-4 w-4" />
                                  Reject
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Reject Application</DialogTitle>
                                  <DialogDescription>
                                    Please provide a reason for rejecting {app.firstName}'s application.
                                  </DialogDescription>
                                </DialogHeader>
                                <form
                                  onSubmit={(e) => {
                                    e.preventDefault();
                                    const formData = new FormData(e.currentTarget);
                                    const reason = formData.get('reason') as string;
                                    rejectApplication.mutate({ id: app.id, reason });
                                  }}
                                  className="space-y-4"
                                >
                                  <Textarea 
                                    name="reason"
                                    placeholder="Enter rejection reason..."
                                    required
                                  />
                                  <Button type="submit" disabled={rejectApplication.isPending}>
                                    Reject Application
                                  </Button>
                                </form>
                              </DialogContent>
                            </Dialog>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Dancers</CardTitle>
              <CardDescription>
                Currently active dancers at {selectedClub === 'club_1' ? 'Main Location' : 'Second Location'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeDancers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No active dancers found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeDancers.map((dancer: DancerApplication) => (
                    <Card key={dancer.id} className="border">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">{dancer.firstName} {dancer.lastName}</h3>
                          <Badge variant="default">Active</Badge>
                        </div>
                        {dancer.stageName && (
                          <p className="text-sm text-muted-foreground mb-2">"{dancer.stageName}"</p>
                        )}
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3" />
                            {dancer.email}
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3" />
                            {dancer.phoneNumber}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inactive" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inactive Dancers</CardTitle>
              <CardDescription>
                Previously active dancers who are now inactive
              </CardDescription>
            </CardHeader>
            <CardContent>
              {inactiveDancers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <UserX className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No inactive dancers found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {inactiveDancers.map((dancer: DancerApplication) => (
                    <Card key={dancer.id} className="border">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">{dancer.firstName} {dancer.lastName}</h3>
                          <Badge variant="secondary">Inactive</Badge>
                        </div>
                        {dancer.stageName && (
                          <p className="text-sm text-muted-foreground mb-2">"{dancer.stageName}"</p>
                        )}
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3" />
                            {dancer.email}
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3" />
                            {dancer.phoneNumber}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}