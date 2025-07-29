import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MessageCircle, 
  Send, 
  Users, 
  Megaphone, 
  Clock, 
  CheckCircle, 
  Circle,
  Bot,
  Sparkles,
  Search,
  Filter
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Header from "@/components/header";

interface Message {
  id: string;
  senderId: string;
  receiverId?: string;
  recipientRole?: string;
  subject: string;
  content: string;
  status: 'sent' | 'delivered' | 'read';
  isAnnouncement: boolean;
  createdAt: string;
  readAt?: string;
  sender: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
    role?: string;
  };
  receiver?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
    role?: string;
  };
}

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
}

const roleLabels = {
  owner: "Owner",
  manager: "Manager", 
  house_mom: "House Mom",
  house_dad: "House Dad",
  dancer: "Dancer",
  dj: "DJ",
  host: "Host",
  floor_host: "Floor Host",
  front_door: "Front Door",
  bartender: "Bartender",
  server: "Server",
  barback: "Barback",
  security: "Security",
  superuser: "Superuser"
};

export default function Messages() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessageOpen, setNewMessageOpen] = useState(false);
  const [announcementOpen, setAnnouncementOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  
  // New message form state
  const [recipient, setRecipient] = useState("");
  const [recipientType, setRecipientType] = useState<"individual" | "role">("individual");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  
  // Announcement form state
  const [announcementSubject, setAnnouncementSubject] = useState("");
  const [announcementContent, setAnnouncementContent] = useState("");
  const [targetRole, setTargetRole] = useState<string>("all");

  // Fetch messages
  const { data: messages = [], refetch: refetchMessages } = useQuery<Message[]>({
    queryKey: ["/api/messages"],
  });

  // Fetch users for recipient selection
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  // Fetch unread count
  const { data: unreadData } = useQuery<{ count: number }>({
    queryKey: ["/api/messages/unread-count"],
  });
  const unreadCount = unreadData?.count || 0;

  // Create message mutation
  const createMessageMutation = useMutation({
    mutationFn: async (messageData: any) => {
      return await apiRequest("POST", "/api/messages", messageData);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Message sent successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/unread-count"] });
      setNewMessageOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to send message",
        variant: "destructive" 
      });
    },
  });

  // Create AI announcement mutation
  const createAnnouncementMutation = useMutation({
    mutationFn: async (announcementData: any) => {
      return await apiRequest("POST", "/api/messages/ai-announcement", announcementData);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "AI-powered announcement sent successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      setAnnouncementOpen(false);
      resetAnnouncementForm();
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to send announcement",
        variant: "destructive" 
      });
    },
  });

  // Mark message as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: string) => {
      return await apiRequest("PATCH", `/api/messages/${messageId}/read`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/unread-count"] });
    },
  });

  const resetForm = () => {
    setRecipient("");
    setSubject("");
    setContent("");
    setRecipientType("individual");
  };

  const resetAnnouncementForm = () => {
    setAnnouncementSubject("");
    setAnnouncementContent("");
    setTargetRole("all");
  };

  const handleSendMessage = () => {
    if (!subject.trim() || !content.trim()) {
      toast({ 
        title: "Error", 
        description: "Please fill in all fields",
        variant: "destructive" 
      });
      return;
    }

    const messageData = {
      subject: subject.trim(),
      content: content.trim(),
      ...(recipientType === "individual" 
        ? { receiverId: recipient }
        : { recipientRole: recipient }
      )
    };

    createMessageMutation.mutate(messageData);
  };

  const handleSendAnnouncement = () => {
    if (!announcementSubject.trim() || !announcementContent.trim()) {
      toast({ 
        title: "Error", 
        description: "Please fill in all fields",
        variant: "destructive" 
      });
      return;
    }

    const announcementData = {
      subject: announcementSubject.trim(),
      content: announcementContent.trim(),
      targetRole: targetRole === "all" ? undefined : targetRole
    };

    createAnnouncementMutation.mutate(announcementData);
  };

  const handleMarkAsRead = (messageId: string) => {
    markAsReadMutation.mutate(messageId);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'read':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'delivered':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      default:
        return <Circle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'read':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Read</Badge>;
      case 'delivered':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Delivered</Badge>;
      default:
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Sent</Badge>;
    }
  };

  const filteredMessages = messages.filter(message => {
    const matchesSearch = message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         `${message.sender.firstName} ${message.sender.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === "all" || message.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const sortedMessages = filteredMessages.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getUserDisplayName = (user: any) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.email;
  };

  return (
    <>
      <Header title="Messages" />
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Messages</p>
                  <p className="text-2xl font-bold">{messages.length}</p>
                </div>
                <MessageCircle className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Unread</p>
                  <p className="text-2xl font-bold text-orange-600">{unreadCount}</p>
                </div>
                <Circle className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Announcements</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {messages.filter(m => m.isAnnouncement).length}
                  </p>
                </div>
                <Megaphone className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Staff Members</p>
                  <p className="text-2xl font-bold text-green-600">{users.length}</p>
                </div>
                <Users className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4">
          <Dialog open={newMessageOpen} onOpenChange={setNewMessageOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Send className="w-4 h-4 mr-2" />
                New Message
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Send New Message</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <Button
                    variant={recipientType === "individual" ? "default" : "outline"}
                    onClick={() => setRecipientType("individual")}
                    className="flex-1"
                  >
                    Individual
                  </Button>
                  <Button
                    variant={recipientType === "role" ? "default" : "outline"}
                    onClick={() => setRecipientType("role")}
                    className="flex-1"
                  >
                    Group by Role
                  </Button>
                </div>

                <div>
                  <label className="text-sm font-medium">
                    {recipientType === "individual" ? "Recipient" : "Target Role"}
                  </label>
                  <Select value={recipient} onValueChange={setRecipient}>
                    <SelectTrigger>
                      <SelectValue placeholder={
                        recipientType === "individual" 
                          ? "Select staff member..." 
                          : "Select role..."
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {recipientType === "individual" ? (
                        users
                          .filter(u => u.id !== user?.id)
                          .map((u) => (
                            <SelectItem key={u.id} value={u.id}>
                              {getUserDisplayName(u)} ({roleLabels[u.role as keyof typeof roleLabels]})
                            </SelectItem>
                          ))
                      ) : (
                        Object.entries(roleLabels).map(([role, label]) => (
                          <SelectItem key={role} value={role}>
                            {label}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Subject</label>
                  <Input
                    placeholder="Enter message subject..."
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Message</label>
                  <Textarea
                    placeholder="Type your message here..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setNewMessageOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSendMessage}
                    disabled={createMessageMutation.isPending}
                  >
                    {createMessageMutation.isPending ? "Sending..." : "Send Message"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={announcementOpen} onOpenChange={setAnnouncementOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-purple-200 text-purple-700 hover:bg-purple-50">
                <Bot className="w-4 h-4 mr-2" />
                <Sparkles className="w-4 h-4 mr-1" />
                AI Announcement
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-purple-600" />
                  Create AI-Powered Announcement
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-purple-800">
                    AI will enhance your announcement with professional tone, urgency indicators, and optimal timing suggestions.
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium">Target Audience</label>
                  <Select value={targetRole} onValueChange={setTargetRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select target audience..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Staff</SelectItem>
                      {Object.entries(roleLabels).map(([role, label]) => (
                        <SelectItem key={role} value={role}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Subject</label>
                  <Input
                    placeholder="Enter announcement subject..."
                    value={announcementSubject}
                    onChange={(e) => setAnnouncementSubject(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Content</label>
                  <Textarea
                    placeholder="Describe what you want to announce. AI will optimize the message..."
                    value={announcementContent}
                    onChange={(e) => setAnnouncementContent(e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setAnnouncementOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSendAnnouncement}
                    disabled={createAnnouncementMutation.isPending}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {createAnnouncementMutation.isPending ? "Creating..." : "Send AI Announcement"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and Filter */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search messages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="read">Read</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Messages List */}
        <Card>
          <CardHeader>
            <CardTitle>Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              <div className="space-y-3">
                {sortedMessages.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No messages found</p>
                  </div>
                ) : (
                  sortedMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                        message.status === 'read' ? 'bg-gray-50' : 'bg-white hover:bg-blue-50'
                      } ${message.isAnnouncement ? 'border-purple-200 bg-purple-50' : ''}`}
                      onClick={() => {
                        if (message.status !== 'read' && message.receiverId === user?.id) {
                          handleMarkAsRead(message.id);
                        }
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback>
                              {message.sender.firstName?.[0]}{message.sender.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-gray-900">
                                {getUserDisplayName(message.sender)}
                              </p>
                              {message.isAnnouncement && (
                                <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                                  <Megaphone className="w-3 h-3 mr-1" />
                                  Announcement
                                </Badge>
                              )}
                              {getStatusBadge(message.status)}
                            </div>
                            <h4 className="font-medium text-gray-900 mb-1">{message.subject}</h4>
                            <p className="text-gray-600 text-sm line-clamp-2">{message.content}</p>
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Clock className="w-3 h-3" />
                                {formatTime(message.createdAt)}
                              </div>
                              <div className="flex items-center gap-1">
                                {getStatusIcon(message.status)}
                                {message.recipientRole && (
                                  <Badge variant="outline" className="text-xs">
                                    To: {roleLabels[message.recipientRole as keyof typeof roleLabels]}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
