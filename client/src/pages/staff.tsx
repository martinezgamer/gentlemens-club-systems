import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/header";
import { 
  Users, 
  UserPlus, 
  Settings, 
  Eye, 
  FileText, 
  Brain, 
  Clock, 
  DollarSign,
  MapPin,
  Star,
  AlertTriangle,
  TrendingUp,
  Search
} from "lucide-react";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  clubLocation: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  profileCompleted: boolean;
}

interface StaffNote {
  id: string;
  staffId: string;
  noteType: string;
  title: string;
  content: string;
  isPrivate: boolean;
  createdBy: string;
  clubLocation: string;
  createdAt: string;
}

interface AIInsights {
  insights: string[];
  topPerformers: string[];
  improvementAreas: { [staffId: string]: string[] };
  recommendations: string[];
}

export default function Staff() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedClub, setSelectedClub] = useState<string>("all");
  const [selectedStaff, setSelectedStaff] = useState<User | null>(null);
  const [editingStaff, setEditingStaff] = useState<User | null>(null);
  const [newStaffDialogOpen, setNewStaffDialogOpen] = useState(false);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);

  const isSuperuser = user?.role === 'superuser';

  // Fetch staff data
  const { data: staff = [], isLoading: staffLoading, refetch: refetchStaff } = useQuery({
    queryKey: ['/api/staff', selectedClub],
    queryFn: async () => {
      const params = selectedClub !== 'all' ? `?clubLocation=${selectedClub}` : '';
      const response = await fetch(`/api/staff${params}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch staff');
      return response.json();
    }
  });

  // Fetch AI insights
  const { data: aiInsights, isLoading: insightsLoading } = useQuery({
    queryKey: ['/api/staff/ai-insights'],
    queryFn: async () => {
      const response = await fetch('/api/staff/ai-insights', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch AI insights');
      return response.json();
    },
    enabled: ['owner', 'manager', 'superuser'].includes(user?.role || ''),
  });

  // Update staff mutation
  const updateStaffMutation = useMutation({
    mutationFn: async (data: { id: string; updates: Partial<User> }) => {
      const response = await fetch(`/api/staff/${data.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data.updates),
      });
      if (!response.ok) throw new Error('Failed to update staff');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Staff member updated successfully" });
      refetchStaff();
      setEditingStaff(null);
    },
    onError: () => {
      toast({ title: "Failed to update staff member", variant: "destructive" });
    },
  });

  // Create staff note mutation
  const createNoteMutation = useMutation({
    mutationFn: async (noteData: Omit<StaffNote, 'id' | 'createdAt'>) => {
      const response = await fetch('/api/staff/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(noteData),
      });
      if (!response.ok) throw new Error('Failed to create note');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Note added successfully" });
      setNoteDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to add note", variant: "destructive" });
    },
  });

  const getClubBadgeColor = (clubLocation: string | null) => {
    switch (clubLocation) {
      case 'wiggles_gentlemens_club':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'fantasy_gentlemens_club':
        return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getClubDisplayName = (clubLocation: string | null) => {
    switch (clubLocation) {
      case 'wiggles_gentlemens_club':
        return 'Wiggles';
      case 'fantasy_gentlemens_club':
        return 'Fantasy';
      default:
        return 'Both Clubs';
    }
  };

  const getRoleDisplayName = (role: string) => {
    const roleMap: { [key: string]: string } = {
      'owner': 'Owner',
      'manager': 'Manager',
      'house_mom': 'House Mom',
      'house_dad': 'House Dad',
      'dj': 'DJ',
      'bartender': 'Bartender',
      'server': 'Server',
      'barback': 'Barback',
      'security': 'Security',
      'superuser': 'Superuser'
    };
    return roleMap[role] || role;
  };

  const handleStaffUpdate = (updates: Partial<User>) => {
    if (!editingStaff) return;
    updateStaffMutation.mutate({ id: editingStaff.id, updates });
  };

  const handleAddNote = (formData: FormData) => {
    if (!selectedStaff || !user?.id) return;

    const noteData = {
      staffId: selectedStaff.id,
      noteType: formData.get('noteType') as string,
      title: formData.get('title') as string,
      content: formData.get('content') as string,
      isPrivate: formData.get('isPrivate') === 'on',
      createdBy: user.id,
      clubLocation: selectedStaff.clubLocation || 'wiggles_gentlemens_club',
    };

    createNoteMutation.mutate(noteData);
  };

  return (
    <>
      <Header title="Staff Management" />
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header Controls */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <Users className="w-5 h-5 sm:w-6 sm:h-6" />
              Staff Management
            </h1>
            {isSuperuser && (
              <Select value={selectedClub} onValueChange={setSelectedClub}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Select club" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clubs</SelectItem>
                  <SelectItem value="wiggles_gentlemens_club">Wiggles Gentlemen's Club</SelectItem>
                  <SelectItem value="fantasy_gentlemens_club">Fantasy Gentlemen's Club</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={() => setNewStaffDialogOpen(true)} className="flex items-center gap-2 text-sm">
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Invite Staff</span>
              <span className="sm:hidden">Invite</span>
            </Button>
            <Button variant="outline" className="flex items-center gap-2 text-sm">
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Search</span>
            </Button>
          </div>
        </div>

        {/* AI Insights Card */}
        {['owner', 'manager', 'superuser'].includes(user?.role || '') && (
          <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                AI-Powered Staff Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              {insightsLoading ? (
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ) : aiInsights ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Star className="w-4 h-4" />
                      Top Performers
                    </h4>
                    <ul className="space-y-1">
                      {aiInsights.topPerformers?.slice(0, 3).map((performer: string, idx: number) => (
                        <li key={idx} className="text-sm text-green-700 dark:text-green-300">• {performer}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Key Recommendations
                    </h4>
                    <ul className="space-y-1">
                      {aiInsights.recommendations?.slice(0, 3).map((rec: string, idx: number) => (
                        <li key={idx} className="text-sm text-blue-700 dark:text-blue-300">• {rec}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600">AI insights will appear here once staff data is analyzed</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Enhanced Staff Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                  <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Staff</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{staff.length}</p>
                  <p className="text-xs text-green-600 dark:text-green-400">+2 this month</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                  <Clock className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Active Today</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{staff.filter((s: User) => s.isActive).length}</p>
                  <p className="text-xs text-green-600 dark:text-green-400">Currently working</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                  <MapPin className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Wiggles Staff</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {staff.filter((s: User) => s.clubLocation === 'wiggles_gentlemens_club').length}
                  </p>
                  <p className="text-xs text-purple-600 dark:text-purple-400">Club location</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-pink-100 dark:bg-pink-900 rounded-full">
                  <MapPin className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Fantasy Staff</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {staff.filter((s: User) => s.clubLocation === 'fantasy_gentlemens_club').length}
                  </p>
                  <p className="text-xs text-pink-600 dark:text-pink-400">Club location</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Staff List */}
        <Card>
          <CardHeader>
            <CardTitle>Staff Members</CardTitle>
          </CardHeader>
          <CardContent>
            {staffLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
                ))}
              </div>
            ) : staff.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No staff members found for the selected club.
              </div>
            ) : (
              <div className="space-y-4">
                {staff.map((member: User) => (
                  <div key={member.id} className="border rounded-lg p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm sm:text-base flex-shrink-0">
                          {member.firstName[0]}{member.lastName[0]}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-sm sm:text-base truncate">{member.firstName} {member.lastName}</h3>
                          <p className="text-xs sm:text-sm text-gray-600 truncate">{member.email}</p>
                          <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">{getRoleDisplayName(member.role)}</Badge>
                            <Badge className={`text-xs ${getClubBadgeColor(member.clubLocation)}`}>
                              {getClubDisplayName(member.clubLocation)}
                            </Badge>
                            {!member.isActive && (
                              <Badge variant="destructive" className="text-xs">Inactive</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedStaff(member)}
                          className="p-2"
                        >
                          <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setEditingStaff(member)}
                          className="p-2"
                        >
                          <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedStaff(member);
                            setNoteDialogOpen(true);
                          }}
                          className="p-2"
                        >
                          <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Staff Dialog */}
        <Dialog open={!!editingStaff} onOpenChange={() => setEditingStaff(null)}>
          <DialogContent className="max-w-md mx-4 sm:mx-auto">
            <DialogHeader>
              <DialogTitle>Edit Staff Member</DialogTitle>
            </DialogHeader>
            {editingStaff && (
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const updates = {
                  firstName: formData.get('firstName') as string,
                  lastName: formData.get('lastName') as string,
                  role: formData.get('role') as string,
                  clubLocation: formData.get('clubLocation') as string,
                  isActive: formData.get('isActive') === 'on',
                };
                handleStaffUpdate(updates);
              }} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      defaultValue={editingStaff.firstName}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      defaultValue={editingStaff.lastName}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select name="role" defaultValue={editingStaff.role}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owner">Owner</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="house_mom">House Mom</SelectItem>
                      <SelectItem value="house_dad">House Dad</SelectItem>
                      <SelectItem value="dj">DJ</SelectItem>
                      <SelectItem value="bartender">Bartender</SelectItem>
                      <SelectItem value="server">Server</SelectItem>
                      <SelectItem value="barback">Barback</SelectItem>
                      <SelectItem value="security">Security</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {isSuperuser && (
                  <div>
                    <Label htmlFor="clubLocation">Club Assignment</Label>
                    <Select name="clubLocation" defaultValue={editingStaff.clubLocation || ''}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="wiggles_gentlemens_club">Wiggles Gentlemen's Club</SelectItem>
                        <SelectItem value="fantasy_gentlemens_club">Fantasy Gentlemen's Club</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    name="isActive"
                    defaultChecked={editingStaff.isActive}
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
                <Button type="submit" className="w-full" disabled={updateStaffMutation.isPending}>
                  {updateStaffMutation.isPending ? 'Updating...' : 'Update Staff Member'}
                </Button>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Add Note Dialog */}
        <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Staff Note</DialogTitle>
            </DialogHeader>
            {selectedStaff && (
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleAddNote(formData);
              }} className="space-y-4">
                <div>
                  <Label>Staff Member</Label>
                  <p className="text-sm text-gray-600">
                    {selectedStaff.firstName} {selectedStaff.lastName}
                  </p>
                </div>
                <div>
                  <Label htmlFor="noteType">Note Type</Label>
                  <Select name="noteType" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select note type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="performance">Performance Review</SelectItem>
                      <SelectItem value="disciplinary">Disciplinary Action</SelectItem>
                      <SelectItem value="training">Training Record</SelectItem>
                      <SelectItem value="recognition">Recognition</SelectItem>
                      <SelectItem value="general">General Note</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="Brief note title"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    name="content"
                    placeholder="Detailed note content..."
                    rows={4}
                    required
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="isPrivate" name="isPrivate" />
                  <Label htmlFor="isPrivate">Private Note (Management Only)</Label>
                </div>
                <Button type="submit" className="w-full" disabled={createNoteMutation.isPending}>
                  {createNoteMutation.isPending ? 'Adding Note...' : 'Add Note'}
                </Button>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}