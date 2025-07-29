import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Clock, UserPlus, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import type { SelectDancer, SelectDancerLineup } from "@shared/schema";

interface LineupEntry extends SelectDancerLineup {
  dancer: SelectDancer;
}

export default function LineupPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedShift, setSelectedShift] = useState<"day" | "night">("night");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newLineupEntry, setNewLineupEntry] = useState({
    dancerId: "",
    shiftType: "night" as "day" | "night",
    date: new Date(),
    shiftStart: "",
    shiftEnd: "",
    stageOrder: 1,
    notes: ""
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch today's lineup
  const { data: todaysLineup, isLoading: loadingToday } = useQuery<LineupEntry[]>({
    queryKey: ['/api/lineup/today'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch lineup for selected date
  const { data: selectedDateLineup, isLoading: loadingSelected } = useQuery<LineupEntry[]>({
    queryKey: ['/api/lineup', selectedDate.toISOString().split('T')[0]],
    enabled: selectedDate.toDateString() !== new Date().toDateString(),
  });

  // Fetch dancers for lineup management
  const { data: dancers = [] } = useQuery<SelectDancer[]>({
    queryKey: ['/api/dancers'],
  });

  // Add to lineup mutation
  const addToLineupMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/lineup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to add to lineup');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/lineup/today'] });
      queryClient.invalidateQueries({ queryKey: ['/api/lineup'] });
      setShowAddDialog(false);
      setNewLineupEntry({
        dancerId: "",
        shiftType: "night",
        date: new Date(),
        shiftStart: "",
        shiftEnd: "",
        stageOrder: 1,
        notes: ""
      });
      toast({ title: "Dancer added to lineup successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to add dancer",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/lineup/${id}/check-in`, {
        method: 'PUT',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to check in dancer');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/lineup/today'] });
      toast({ title: "Dancer checked in successfully" });
    },
  });

  // Status update mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, currentStatus }: { id: string; status: string; currentStatus?: string }) => {
      const response = await fetch(`/api/lineup/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status, currentStatus }),
      });
      if (!response.ok) throw new Error('Failed to update status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/lineup/today'] });
      toast({ title: "Status updated successfully" });
    },
  });

  // Fantasy Gentlemen's Club shift hours
  const getShiftHours = (shiftType: "day" | "night") => {
    if (shiftType === "day") {
      return { start: "12:00", end: "19:00", label: "Day Shift (Wed/Thu/Fri 12pm-7pm)" };
    } else {
      return { start: "19:00", end: "03:00", label: "Night Shift (7pm-3am)" };
    }
  };

  const handleAddToLineup = () => {
    const shiftHours = getShiftHours(newLineupEntry.shiftType);
    const shiftDate = newLineupEntry.date;
    
    const shiftStart = new Date(shiftDate);
    const [startHours, startMinutes] = shiftHours.start.split(':');
    shiftStart.setHours(parseInt(startHours), parseInt(startMinutes), 0, 0);
    
    const shiftEnd = new Date(shiftDate);
    const [endHours, endMinutes] = shiftHours.end.split(':');
    if (parseInt(endHours) < 12) {
      // Next day for night shift ending
      shiftEnd.setDate(shiftEnd.getDate() + 1);
    }
    shiftEnd.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0);

    addToLineupMutation.mutate({
      ...newLineupEntry,
      date: shiftDate,
      shiftStart,
      shiftEnd,
      clubLocation: "fantasy_gentlemens_club"
    });
  };

  const getStatusBadge = (status: string, currentStatus?: string | null) => {
    const statusConfig = {
      scheduled: { variant: "secondary" as const, icon: Clock },
      checked_in: { variant: "default" as const, icon: CheckCircle },
      on_stage: { variant: "destructive" as const, icon: AlertCircle },
      break: { variant: "outline" as const, icon: AlertCircle },
      checked_out: { variant: "secondary" as const, icon: XCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.scheduled;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status.replace('_', ' ')}
        {currentStatus && currentStatus !== status && (
          <span className="ml-1 text-xs">({currentStatus})</span>
        )}
      </Badge>
    );
  };

  const currentLineup = selectedDate.toDateString() === new Date().toDateString() 
    ? todaysLineup 
    : selectedDateLineup;

  const dayShiftDancers = (currentLineup || []).filter((entry: LineupEntry) => entry.shiftType === "day");
  const nightShiftDancers = (currentLineup || []).filter((entry: LineupEntry) => entry.shiftType === "night");

  const renderDancerCard = (entry: LineupEntry) => (
    <Card key={entry.id}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{entry.dancer?.stageName || 'Unknown'}</CardTitle>
            <p className="text-sm text-gray-600">
              {entry.dancer?.firstName} {entry.dancer?.lastName}
            </p>
          </div>
          {getStatusBadge(entry.status, entry.currentStatus)}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Stage Order:</span>
            <span>#{entry.stageOrder}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Hours:</span>
            <span>{entry.shiftType === "day" ? "12:00 PM - 7:00 PM" : "7:00 PM - 3:00 AM"}</span>
          </div>
          {entry.notes && (
            <div className="text-sm">
              <span className="font-medium">Notes:</span>
              <p className="text-gray-600">{entry.notes}</p>
            </div>
          )}
          {entry.status === "scheduled" && (
            <Button
              size="sm"
              onClick={() => checkInMutation.mutate(entry.id)}
              disabled={checkInMutation.isPending}
              className="w-full mt-2"
            >
              Check In
            </Button>
          )}
          {entry.status === "checked_in" && (
            <div className="flex gap-2 mt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateStatusMutation.mutate({
                  id: entry.id,
                  status: "on_stage",
                  currentStatus: "working"
                })}
                disabled={updateStatusMutation.isPending}
              >
                On Stage
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateStatusMutation.mutate({
                  id: entry.id,
                  status: "break",
                  currentStatus: "break"
                })}
                disabled={updateStatusMutation.isPending}
              >
                Break
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dancer Lineup</h1>
        <div className="flex items-center gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                {format(selectedDate, "PPP")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Add to Lineup
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Dancer to Lineup</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="dancer">Dancer</Label>
                  <Select
                    value={newLineupEntry.dancerId}
                    onValueChange={(value) =>
                      setNewLineupEntry({ ...newLineupEntry, dancerId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a dancer" />
                    </SelectTrigger>
                    <SelectContent>
                      {dancers.map((dancer: SelectDancer) => (
                        <SelectItem key={dancer.id} value={dancer.id}>
                          {dancer.stageName} ({dancer.firstName} {dancer.lastName})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="shift">Shift Type</Label>
                  <Select
                    value={newLineupEntry.shiftType}
                    onValueChange={(value: "day" | "night") =>
                      setNewLineupEntry({ ...newLineupEntry, shiftType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">Day Shift (Wed/Thu/Fri 12pm-7pm)</SelectItem>
                      <SelectItem value="night">Night Shift (7pm-3am)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="date">Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        {format(newLineupEntry.date, "PPP")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={newLineupEntry.date}
                        onSelect={(date) =>
                          date && setNewLineupEntry({ ...newLineupEntry, date })
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label htmlFor="stage-order">Stage Order</Label>
                  <Input
                    type="number"
                    min="1"
                    value={newLineupEntry.stageOrder}
                    onChange={(e) =>
                      setNewLineupEntry({
                        ...newLineupEntry,
                        stageOrder: parseInt(e.target.value) || 1,
                      })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Input
                    value={newLineupEntry.notes}
                    onChange={(e) =>
                      setNewLineupEntry({ ...newLineupEntry, notes: e.target.value })
                    }
                    placeholder="Any special notes..."
                  />
                </div>

                <Button
                  onClick={handleAddToLineup}
                  disabled={!newLineupEntry.dancerId || addToLineupMutation.isPending}
                  className="w-full"
                >
                  {addToLineupMutation.isPending ? "Adding..." : "Add to Lineup"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">Fantasy Gentlemen's Club Hours</h3>
        <div className="space-y-1 text-sm text-blue-800">
          <p><strong>Day Shift:</strong> Wednesday, Thursday, Friday - 12:00 PM to 7:00 PM</p>
          <p><strong>Night Shift:</strong> Daily - 7:00 PM to 3:00 AM</p>
        </div>
      </div>

      <Tabs value={selectedShift} onValueChange={(value) => setSelectedShift(value as "day" | "night")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="day" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Day Shift ({dayShiftDancers.length})
          </TabsTrigger>
          <TabsTrigger value="night" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Night Shift ({nightShiftDancers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="day" className="space-y-4">
          <div className="text-sm text-gray-600 mb-4">
            Day shift operates Wednesday, Thursday, and Friday from 12:00 PM to 7:00 PM
          </div>
          
          {loadingToday || loadingSelected ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <>
              {dayShiftDancers.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center text-gray-500">
                    No dancers scheduled for day shift on {format(selectedDate, "PPP")}
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {dayShiftDancers.map(renderDancerCard)}
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="night" className="space-y-4">
          <div className="text-sm text-gray-600 mb-4">
            Night shift operates daily from 7:00 PM to 3:00 AM
          </div>
          
          {loadingToday || loadingSelected ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <>
              {nightShiftDancers.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center text-gray-500">
                    No dancers scheduled for night shift on {format(selectedDate, "PPP")}
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {nightShiftDancers.map(renderDancerCard)}
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}