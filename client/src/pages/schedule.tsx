import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import { Plus, Calendar as CalendarIcon, Users, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertScheduleSchema, type InsertSchedule } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import Header from "@/components/header";

// Big Calendar localizer setup
const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// Schedule type options
const SHIFT_TYPES = [
  { value: "day", label: "Day Shift" },
  { value: "night", label: "Night Shift" },
  { value: "double", label: "Double Shift" },
  { value: "split", label: "Split Shift" }
];

const ROLES = [
  { value: "dancer", label: "Dancer" },
  { value: "bartender", label: "Bartender" },
  { value: "dj", label: "DJ" },
  { value: "server", label: "Server" },
  { value: "barback", label: "Barback" },
  { value: "house_mom", label: "House Mom" },
  { value: "house_dad", label: "House Dad" },
  { value: "security", label: "Security" },
  { value: "manager", label: "Manager" }
];

export default function Schedule() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { lastMessage } = useWebSocket();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<'month' | 'week' | 'day'>('month');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Fetch schedules
  const { data: schedules, refetch: refetchSchedules } = useQuery({
    queryKey: ["/api/schedules"],
  });

  // Fetch all users for staff selection
  const { data: allUsers } = useQuery({
    queryKey: ["/api/admin/users"],
  });

  // Refetch on WebSocket updates
  useEffect(() => {
    if (lastMessage) {
      refetchSchedules();
    }
  }, [lastMessage, refetchSchedules]);

  // Create schedule form
  const form = useForm({
    defaultValues: {
      userId: "",
      date: new Date(),
      shiftType: "day" as const,
      startTime: new Date(),
      endTime: new Date(),
      notes: "",
    },
  });

  // Create schedule mutation
  const createScheduleMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("/api/schedules", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Schedule created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Transform schedules for calendar display
  const calendarEvents = Array.isArray(schedules) ? schedules.map((schedule: any) => ({
    id: schedule.id,
    title: `${schedule.user?.firstName || 'Unknown'} ${schedule.user?.lastName || 'User'} - ${schedule.shiftType}`,
    start: new Date(schedule.startTime),
    end: new Date(schedule.endTime),
    resource: {
      ...schedule,
      color: getShiftColor(schedule.shiftType),
    },
  })) : [];

  function getShiftColor(shiftType: string) {
    switch (shiftType) {
      case 'day': return '#3b82f6';
      case 'night': return '#8b5cf6';
      case 'double': return '#f59e0b';
      case 'split': return '#10b981';
      default: return '#6b7280';
    }
  }

  // Event style getter for calendar
  const eventStyleGetter = (event: any) => ({
    style: {
      backgroundColor: event.resource.color,
      borderRadius: '6px',
      opacity: 0.8,
      color: 'white',
      border: '0px',
      display: 'block'
    }
  });

  // Handle form submission
  const onSubmit = (data: any) => {
    createScheduleMutation.mutate(data);
  };

  const isManager = user && (user.role === 'owner' || user.role === 'manager' || user.role === 'house_mom' || user.role === 'house_dad');

  return (
    <>
      <Header title="Schedule Management" />
      <div className="space-y-6 lg:space-y-8">
        {/* Header with Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Schedule Management</h1>
            <p className="text-gray-600 text-sm lg:text-base">Manage staff schedules and shifts</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            {/* View Type Selector */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <Button
                variant={viewType === 'month' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewType('month')}
                className="text-xs lg:text-sm"
              >
                Month
              </Button>
              <Button
                variant={viewType === 'week' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewType('week')}
                className="text-xs lg:text-sm"
              >
                Week
              </Button>
              <Button
                variant={viewType === 'day' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewType('day')}
                className="text-xs lg:text-sm"
              >
                Day
              </Button>
            </div>

            {isManager && (
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Create Schedule</span>
                    <span className="sm:hidden">Create</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Create New Schedule</DialogTitle>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="userId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Staff Member</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select staff member" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {Array.isArray(allUsers) && allUsers.map((user: any) => (
                                    <SelectItem key={user.id} value={user.id}>
                                      {user.firstName} {user.lastName} ({user.role?.replace('_', ' ')})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="shiftType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Shift Type</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select shift type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {SHIFT_TYPES.map((shift) => (
                                    <SelectItem key={shift.value} value={shift.value}>
                                      {shift.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="startTime"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Start Time</FormLabel>
                              <FormControl>
                                <Input
                                  type="datetime-local"
                                  {...field}
                                  value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ''}
                                  onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : new Date())}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="endTime"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>End Time</FormLabel>
                              <FormControl>
                                <Input
                                  type="datetime-local"
                                  {...field}
                                  value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ''}
                                  onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : new Date())}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Notes (Optional)</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Any additional notes about this schedule..."
                                {...field}
                                value={field.value || ''}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end space-x-2 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsCreateDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={createScheduleMutation.isPending}>
                          {createScheduleMutation.isPending ? "Creating..." : "Create Schedule"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Schedule Statistics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
          <Card>
            <CardContent className="p-3 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs lg:text-sm font-medium text-gray-600">Total Schedules</p>
                  <p className="text-lg lg:text-2xl font-bold text-gray-900">{Array.isArray(schedules) ? schedules.length : 0}</p>
                </div>
                <CalendarIcon className="w-6 h-6 lg:w-8 lg:h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs lg:text-sm font-medium text-gray-600">Today's Shifts</p>
                  <p className="text-lg lg:text-2xl font-bold text-gray-900">
                    {Array.isArray(schedules) ? schedules.filter((s: any) => {
                      const today = new Date();
                      const startTime = new Date(s.startTime);
                      return startTime.toDateString() === today.toDateString();
                    }).length : 0}
                  </p>
                </div>
                <Clock className="w-6 h-6 lg:w-8 lg:h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs lg:text-sm font-medium text-gray-600">Staff Scheduled</p>
                  <p className="text-lg lg:text-2xl font-bold text-gray-900">
                    {Array.isArray(schedules) ? new Set(schedules.map((s: any) => s.userId)).size : 0}
                  </p>
                </div>
                <Users className="w-6 h-6 lg:w-8 lg:h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs lg:text-sm font-medium text-gray-600">Shift Types</p>
                  <p className="text-lg lg:text-2xl font-bold text-gray-900">
                    {Array.isArray(schedules) ? new Set(schedules.map((s: any) => s.shiftType)).size : 0}
                  </p>
                </div>
                <Badge variant="secondary" className="w-6 h-6 lg:w-8 lg:h-8 rounded-full p-0 flex items-center justify-center">
                  <span className="text-xs lg:text-sm font-bold">S</span>
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Calendar View */}
        <Card className="min-h-[600px]">
          <CardHeader className="pb-3 lg:pb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle className="text-lg lg:text-xl">Schedule Calendar</CardTitle>
              
              {/* Calendar Navigation */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newDate = new Date(currentDate);
                    if (viewType === 'month') {
                      newDate.setMonth(newDate.getMonth() - 1);
                    } else if (viewType === 'week') {
                      newDate.setDate(newDate.getDate() - 7);
                    } else {
                      newDate.setDate(newDate.getDate() - 1);
                    }
                    setCurrentDate(newDate);
                  }}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                
                <span className="text-sm lg:text-base font-medium px-2">
                  {format(currentDate, viewType === 'month' ? 'MMMM yyyy' : 
                    viewType === 'week' ? "'Week of' MMM d, yyyy" : 'EEEE, MMM d, yyyy')}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newDate = new Date(currentDate);
                    if (viewType === 'month') {
                      newDate.setMonth(newDate.getMonth() + 1);
                    } else if (viewType === 'week') {
                      newDate.setDate(newDate.getDate() + 7);
                    } else {
                      newDate.setDate(newDate.getDate() + 1);
                    }
                    setCurrentDate(newDate);
                  }}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentDate(new Date())}
                >
                  Today
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-3 lg:p-6">
            <div className="h-[500px] lg:h-[600px]">
              <Calendar
                localizer={localizer}
                events={calendarEvents}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%' }}
                view={viewType}
                date={currentDate}
                onNavigate={setCurrentDate}
                onView={(view) => {
                  if (view === 'month' || view === 'week' || view === 'day') {
                    setViewType(view);
                  }
                }}
                eventPropGetter={eventStyleGetter}
                popup
                showMultiDayTimes
                step={60}
                timeslots={1}
                min={new Date(2024, 0, 1, 6, 0)}
                max={new Date(2024, 0, 1, 23, 59)}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}