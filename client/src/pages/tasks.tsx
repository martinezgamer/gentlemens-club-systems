import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/header";
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  MapPin,
  Zap,
  Target,
  TrendingUp,
  Brain,
  Edit3,
  Trash2,
  Play,
  Pause,
  CheckCheck
} from "lucide-react";

interface Task {
  id: string;
  title: string;
  description?: string;
  assignedTo?: string;
  assignedBy: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category?: string;
  tags?: string;
  clubLocation?: string;
  estimatedTime?: number;
  actualTime?: number;
  dueDate?: string;
  startedAt?: string;
  completedAt?: string;
  notes?: string;
  attachments?: string;
  aiSuggestions?: string;
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  clubLocation?: string;
}

interface TaskStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  overdue: number;
  byPriority: { [key: string]: number };
  byAssignee: { [key: string]: number };
}

interface AIAnalysis {
  prioritizedTasks: Task[];
  workloadAnalysis: {
    [userId: string]: {
      taskCount: number;
      totalEstimatedTime: number;
      urgentTasks: number;
      workloadLevel: 'light' | 'moderate' | 'heavy' | 'overloaded';
    };
  };
  urgentTasks: Task[];
  bottlenecks: string[];
  optimizationSuggestions: string[];
  deadlineAlerts: string[];
}

export default function Tasks() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTaskDialogOpen, setNewTaskDialogOpen] = useState(false);
  const [aiInsightsOpen, setAiInsightsOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterAssignee, setFilterAssignee] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // New task form state
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    assignedTo: "",
    priority: "medium" as const,
    category: "general",
    clubLocation: user?.clubLocation || "",
    estimatedTime: 30,
    dueDate: "",
    tags: ""
  });

  const [aiEnhancement, setAiEnhancement] = useState<any>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);

  const isSuperuser = user?.role === 'superuser';

  // Fetch tasks with filtering
  const { data: tasks = [], isLoading: tasksLoading, refetch: refetchTasks } = useQuery({
    queryKey: ['/api/tasks', filterStatus, filterPriority, filterAssignee],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterPriority !== 'all') params.append('priority', filterPriority);
      if (filterAssignee !== 'all') params.append('assignedTo', filterAssignee);
      
      const response = await fetch(`/api/tasks?${params}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch tasks');
      return response.json();
    }
  });

  // Fetch staff for assignment dropdown
  const { data: staff = [] } = useQuery({
    queryKey: ['/api/staff'],
    queryFn: async () => {
      const response = await fetch('/api/staff', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch staff');
      return response.json();
    }
  });

  // Fetch task statistics
  const { data: taskStats } = useQuery({
    queryKey: ['/api/tasks/statistics'],
    queryFn: async () => {
      const response = await fetch('/api/tasks/statistics', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch task statistics');
      return response.json();
    }
  });

  // Fetch AI workload analysis
  const { data: aiAnalysis, isLoading: aiLoading } = useQuery({
    queryKey: ['/api/ai/tasks/workload-analysis'],
    queryFn: async () => {
      const response = await fetch('/api/ai/tasks/workload-analysis', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch AI analysis');
      return response.json();
    },
    enabled: ['owner', 'manager', 'superuser'].includes(user?.role || ''),
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (taskData: any) => {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(taskData),
      });
      if (!response.ok) throw new Error('Failed to create task');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Task created successfully" });
      setNewTaskDialogOpen(false);
      setNewTask({
        title: "",
        description: "",
        assignedTo: "",
        priority: "medium",
        category: "general",
        clubLocation: user?.clubLocation || "",
        estimatedTime: 30,
        dueDate: "",
        tags: ""
      });
      setAiEnhancement(null);
      refetchTasks();
      queryClient.invalidateQueries({ queryKey: ['/api/tasks/statistics'] });
    },
    onError: () => {
      toast({ title: "Failed to create task", variant: "destructive" });
    },
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update task');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Task updated successfully" });
      setEditingTask(null);
      refetchTasks();
      queryClient.invalidateQueries({ queryKey: ['/api/tasks/statistics'] });
    },
    onError: () => {
      toast({ title: "Failed to update task", variant: "destructive" });
    },
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to delete task');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Task deleted successfully" });
      refetchTasks();
      queryClient.invalidateQueries({ queryKey: ['/api/tasks/statistics'] });
    },
    onError: () => {
      toast({ title: "Failed to delete task", variant: "destructive" });
    },
  });

  // AI Enhancement mutation
  const enhanceTaskMutation = useMutation({
    mutationFn: async (taskData: any) => {
      const response = await fetch('/api/ai/tasks/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(taskData),
      });
      if (!response.ok) throw new Error('Failed to enhance task');
      return response.json();
    },
    onSuccess: (data) => {
      setAiEnhancement(data);
      setNewTask(prev => ({
        ...prev,
        title: data.enhancedTitle || prev.title,
        description: data.enhancedDescription || prev.description,
        priority: data.suggestedPriority || prev.priority,
        estimatedTime: data.estimatedTime || prev.estimatedTime,
        tags: data.suggestedTags?.join(', ') || prev.tags
      }));
      toast({ title: "Task enhanced with AI suggestions" });
    },
    onError: () => {
      toast({ title: "Failed to enhance task", variant: "destructive" });
    },
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'pending': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getClubBadgeColor = (clubLocation: string | null | undefined) => {
    switch (clubLocation) {
      case 'wiggles_gentlemens_club':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'fantasy_gentlemens_club':
        return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300';
      case 'both_clubs':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getClubDisplayName = (clubLocation: string | null | undefined) => {
    switch (clubLocation) {
      case 'wiggles_gentlemens_club': return 'Wiggles';
      case 'fantasy_gentlemens_club': return 'Fantasy';
      case 'both_clubs': return 'Both Clubs';
      default: return 'Unassigned';
    }
  };

  const getStaffName = (staffId: string) => {
    const staffMember = staff.find((s: User) => s.id === staffId);
    return staffMember ? `${staffMember.firstName} ${staffMember.lastName}` : 'Unassigned';
  };

  const filteredTasks = tasks.filter((task: Task) => {
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !task.description?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const handleCreateTask = () => {
    const taskData = {
      ...newTask,
      tags: newTask.tags ? newTask.tags.split(',').map(t => t.trim()) : [],
      dueDate: newTask.dueDate ? new Date(newTask.dueDate).toISOString() : null,
    };
    createTaskMutation.mutate(taskData);
  };

  const handleUpdateTaskStatus = (taskId: string, status: string) => {
    const updates: any = { status };
    if (status === 'in_progress' && tasks.find((t: Task) => t.id === taskId)?.status === 'pending') {
      updates.startedAt = new Date().toISOString();
    }
    updateTaskMutation.mutate({ id: taskId, updates });
  };

  const handleEnhanceTask = () => {
    if (!newTask.title.trim()) {
      toast({ title: "Please enter a task title first", variant: "destructive" });
      return;
    }
    setIsEnhancing(true);
    enhanceTaskMutation.mutate(newTask);
    setTimeout(() => setIsEnhancing(false), 2000);
  };

  return (
    <>
      <Header title="AI Task Management" />
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Header Controls */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <Target className="w-5 h-5 sm:w-6 sm:h-6" />
              AI Task Management
            </h1>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Dialog open={newTaskDialogOpen} onOpenChange={setNewTaskDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2 text-sm">
                  <Plus className="w-4 h-4" />
                  Create Task
                </Button>
              </DialogTrigger>
            </Dialog>
            
            {['owner', 'manager', 'superuser'].includes(user?.role || '') && (
              <Button 
                variant="outline" 
                onClick={() => setAiInsightsOpen(true)}
                className="flex items-center gap-2 text-sm"
              >
                <Brain className="w-4 h-4" />
                AI Insights
              </Button>
            )}
          </div>
        </div>

        {/* Task Statistics Overview */}
        {taskStats && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <Card className="hover:shadow-lg transition-shadow duration-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                    <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Tasks</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{taskStats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow duration-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full">
                    <Clock className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{taskStats.pending}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow duration-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                    <Play className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">In Progress</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{taskStats.inProgress}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow duration-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                    <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{taskStats.completed}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow duration-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-red-100 dark:bg-red-900 rounded-full">
                    <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Overdue</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{taskStats.overdue}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterAssignee} onValueChange={setFilterAssignee}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Assignee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assignees</SelectItem>
                {staff.map((staffMember: User) => (
                  <SelectItem key={staffMember.id} value={staffMember.id}>
                    {staffMember.firstName} {staffMember.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tasks List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Active Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tasksLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-20 bg-gray-200 rounded animate-pulse"></div>
                ))}
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No tasks found. Create your first task to get started.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTasks.map((task: Task) => (
                  <div key={task.id} className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-base truncate">{task.title}</h3>
                          <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                          <Badge className={getStatusColor(task.status)}>{task.status.replace('_', ' ')}</Badge>
                          {task.clubLocation && (
                            <Badge className={getClubBadgeColor(task.clubLocation)}>
                              {getClubDisplayName(task.clubLocation)}
                            </Badge>
                          )}
                        </div>
                        
                        {task.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                        
                        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                          {task.assignedTo && (
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {getStaffName(task.assignedTo)}
                            </div>
                          )}
                          {task.estimatedTime && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {task.estimatedTime}min
                            </div>
                          )}
                          {task.dueDate && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(task.dueDate).toLocaleDateString()}
                            </div>
                          )}
                          {task.tags && (
                            <div className="flex items-center gap-1">
                              #{task.tags}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {task.status === 'pending' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleUpdateTaskStatus(task.id, 'in_progress')}
                          >
                            <Play className="w-4 h-4" />
                          </Button>
                        )}
                        {task.status === 'in_progress' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleUpdateTaskStatus(task.id, 'completed')}
                          >
                            <CheckCheck className="w-4 h-4" />
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setEditingTask(task)}
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => deleteTaskMutation.mutate(task.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Task Dialog */}
        <Dialog open={newTaskDialogOpen} onOpenChange={setNewTaskDialogOpen}>
          <DialogContent className="max-w-2xl" aria-describedby="create-task-description">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Create New Task with AI Enhancement
              </DialogTitle>
              <p id="create-task-description" className="text-sm text-muted-foreground">
                Create a new task with AI-powered enhancement suggestions for better planning and execution.
              </p>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Task Title</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter task title..."
                    value={newTask.title}
                    onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleEnhanceTask}
                    disabled={isEnhancing || !newTask.title.trim()}
                    className="flex items-center gap-2"
                  >
                    <Brain className="w-4 h-4" />
                    {isEnhancing ? 'Enhancing...' : 'AI Enhance'}
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  placeholder="Describe the task in detail..."
                  value={newTask.description}
                  onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Assign To</label>
                  <Select value={newTask.assignedTo} onValueChange={(value) => setNewTask(prev => ({ ...prev, assignedTo: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select staff member" />
                    </SelectTrigger>
                    <SelectContent>
                      {staff.map((staffMember: User) => (
                        <SelectItem key={staffMember.id} value={staffMember.id}>
                          {staffMember.firstName} {staffMember.lastName} - {staffMember.role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Priority</label>
                  <Select value={newTask.priority} onValueChange={(value) => setNewTask(prev => ({ ...prev, priority: value as any }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Club Location</label>
                  <Select value={newTask.clubLocation} onValueChange={(value) => setNewTask(prev => ({ ...prev, clubLocation: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="wiggles_gentlemens_club">Wiggles Gentlemen's Club</SelectItem>
                      <SelectItem value="fantasy_gentlemens_club">Fantasy Gentlemen's Club</SelectItem>
                      <SelectItem value="both_clubs">Both Clubs</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Input
                    placeholder="e.g., cleaning, maintenance, inventory"
                    value={newTask.category}
                    onChange={(e) => setNewTask(prev => ({ ...prev, category: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Estimated Time (minutes)</label>
                  <Input
                    type="number"
                    placeholder="30"
                    value={newTask.estimatedTime}
                    onChange={(e) => setNewTask(prev => ({ ...prev, estimatedTime: parseInt(e.target.value) || 30 }))}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Due Date</label>
                  <Input
                    type="datetime-local"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask(prev => ({ ...prev, dueDate: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Tags (comma-separated)</label>
                <Input
                  placeholder="cleaning, urgent, maintenance"
                  value={newTask.tags}
                  onChange={(e) => setNewTask(prev => ({ ...prev, tags: e.target.value }))}
                />
              </div>

              {aiEnhancement && (
                <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                    <Brain className="w-4 h-4" />
                    AI Suggestions Applied
                  </h4>
                  <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                    {aiEnhancement.recommendations?.map((rec: string, index: number) => (
                      <p key={index}>• {rec}</p>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setNewTaskDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateTask} disabled={!newTask.title.trim()}>
                  Create Task
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Task Dialog */}
        <Dialog open={!!editingTask} onOpenChange={(open) => !open && setEditingTask(null)}>
          <DialogContent className="max-w-2xl" aria-describedby="edit-task-description">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit3 className="w-5 h-5" />
                Edit Task
              </DialogTitle>
              <p id="edit-task-description" className="text-sm text-muted-foreground">
                Modify task details, reassign responsibilities, and update status or priority levels.
              </p>
            </DialogHeader>
            
            {editingTask && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Task Title</label>
                  <Input
                    placeholder="Enter task title..."
                    value={editingTask.title}
                    onChange={(e) => setEditingTask(prev => prev ? ({ ...prev, title: e.target.value }) : null)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    placeholder="Describe the task in detail..."
                    value={editingTask.description || ""}
                    onChange={(e) => setEditingTask(prev => prev ? ({ ...prev, description: e.target.value }) : null)}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Assign To</label>
                    <Select value={editingTask.assignedTo || ""} onValueChange={(value) => setEditingTask(prev => prev ? ({ ...prev, assignedTo: value }) : null)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select staff member" />
                      </SelectTrigger>
                      <SelectContent>
                        {staff.map((staffMember: User) => (
                          <SelectItem key={staffMember.id} value={staffMember.id}>
                            {staffMember.firstName} {staffMember.lastName} - {staffMember.role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Priority</label>
                    <Select value={editingTask.priority} onValueChange={(value) => setEditingTask(prev => prev ? ({ ...prev, priority: value as any }) : null)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Status</label>
                    <Select value={editingTask.status} onValueChange={(value) => setEditingTask(prev => prev ? ({ ...prev, status: value as any }) : null)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Category</label>
                    <Input
                      placeholder="e.g., cleaning, maintenance, inventory"
                      value={editingTask.category || ""}
                      onChange={(e) => setEditingTask(prev => prev ? ({ ...prev, category: e.target.value }) : null)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Estimated Time (minutes)</label>
                    <Input
                      type="number"
                      placeholder="30"
                      value={editingTask.estimatedTime || 30}
                      onChange={(e) => setEditingTask(prev => prev ? ({ ...prev, estimatedTime: parseInt(e.target.value) || 30 }) : null)}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Due Date</label>
                    <Input
                      type="datetime-local"
                      value={editingTask.dueDate ? new Date(editingTask.dueDate).toISOString().slice(0, 16) : ""}
                      onChange={(e) => setEditingTask(prev => prev ? ({ ...prev, dueDate: e.target.value }) : null)}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Tags (comma-separated)</label>
                  <Input
                    placeholder="cleaning, urgent, maintenance"
                    value={editingTask.tags || ""}
                    onChange={(e) => setEditingTask(prev => prev ? ({ ...prev, tags: e.target.value }) : null)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Notes</label>
                  <Textarea
                    placeholder="Add any additional notes..."
                    value={editingTask.notes || ""}
                    onChange={(e) => setEditingTask(prev => prev ? ({ ...prev, notes: e.target.value }) : null)}
                    rows={2}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setEditingTask(null)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => {
                      if (editingTask) {
                        const updates = {
                          title: editingTask.title,
                          description: editingTask.description,
                          assignedTo: editingTask.assignedTo,
                          priority: editingTask.priority,
                          status: editingTask.status,
                          category: editingTask.category,
                          estimatedTime: editingTask.estimatedTime,
                          dueDate: editingTask.dueDate ? new Date(editingTask.dueDate).toISOString() : null,
                          tags: editingTask.tags ? editingTask.tags.split(',').map(t => t.trim()) : [],
                          notes: editingTask.notes
                        };
                        updateTaskMutation.mutate({ id: editingTask.id, updates });
                      }
                    }}
                    disabled={!editingTask?.title.trim()}
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* AI Insights Dialog */}
        <Dialog open={aiInsightsOpen} onOpenChange={setAiInsightsOpen}>
          <DialogContent className="max-w-4xl" aria-describedby="ai-insights-description">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                AI Task Insights & Workload Analysis
              </DialogTitle>
              <p id="ai-insights-description" className="text-sm text-muted-foreground">
                View intelligent analysis of task priorities, workload distribution, and optimization recommendations.
              </p>
            </DialogHeader>
            
            {aiLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : aiAnalysis ? (
              <div className="space-y-6">
                {aiAnalysis.urgentTasks?.length > 0 && (
                  <div>
                    <h4 className="font-medium text-red-600 dark:text-red-400 mb-2">🚨 Urgent Tasks Requiring Attention</h4>
                    <div className="space-y-2">
                      {aiAnalysis.urgentTasks.slice(0, 3).map((task: Task) => (
                        <div key={task.id} className="p-3 bg-red-50 dark:bg-red-950 rounded border border-red-200 dark:border-red-800">
                          <div className="font-medium text-red-900 dark:text-red-100">{task.title}</div>
                          <div className="text-sm text-red-700 dark:text-red-300">{task.description}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {aiAnalysis.optimizationSuggestions?.length > 0 && (
                  <div>
                    <h4 className="font-medium text-blue-600 dark:text-blue-400 mb-2">💡 Optimization Suggestions</h4>
                    <div className="space-y-2">
                      {aiAnalysis.optimizationSuggestions.map((suggestion: string, index: number) => (
                        <div key={index} className="p-3 bg-blue-50 dark:bg-blue-950 rounded border border-blue-200 dark:border-blue-800">
                          <div className="text-sm text-blue-800 dark:text-blue-200">{suggestion}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {aiAnalysis.bottlenecks?.length > 0 && (
                  <div>
                    <h4 className="font-medium text-orange-600 dark:text-orange-400 mb-2">⚠️ Workflow Bottlenecks</h4>
                    <div className="space-y-2">
                      {aiAnalysis.bottlenecks.map((bottleneck: string, index: number) => (
                        <div key={index} className="p-3 bg-orange-50 dark:bg-orange-950 rounded border border-orange-200 dark:border-orange-800">
                          <div className="text-sm text-orange-800 dark:text-orange-200">{bottleneck}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {Object.keys(aiAnalysis.workloadAnalysis || {}).length > 0 && (
                  <div>
                    <h4 className="font-medium text-green-600 dark:text-green-400 mb-2">📊 Staff Workload Analysis</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {Object.entries(aiAnalysis.workloadAnalysis).map(([userId, analysis]: [string, any]) => {
                        const staffMember = staff.find((s: User) => s.id === userId);
                        if (!staffMember) return null;
                        
                        const workloadColor = analysis.workloadLevel === 'overloaded' ? 'red' :
                                            analysis.workloadLevel === 'heavy' ? 'orange' :
                                            analysis.workloadLevel === 'moderate' ? 'yellow' : 'green';
                        
                        return (
                          <div key={userId} className="p-3 bg-gray-50 dark:bg-gray-800 rounded border">
                            <div className="font-medium">{staffMember.firstName} {staffMember.lastName}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {analysis.taskCount} tasks • {Math.floor(analysis.totalEstimatedTime / 60)}h {analysis.totalEstimatedTime % 60}m
                            </div>
                            <Badge className={`${workloadColor === 'red' ? 'bg-red-100 text-red-800' :
                                             workloadColor === 'orange' ? 'bg-orange-100 text-orange-800' :
                                             workloadColor === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                                             'bg-green-100 text-green-800'} mt-1`}>
                              {analysis.workloadLevel}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No AI analysis available yet. Create some tasks to get insights.
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
