import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/header";

export default function TimeClock() {
  const [selectedShift, setSelectedShift] = useState<"day" | "night">("night");
  const { toast } = useToast();

  const { data: activeEntry } = useQuery({
    queryKey: ["/api/timeclock/active"],
  });

  const { data: entries } = useQuery({
    queryKey: ["/api/timeclock/entries"],
  });

  const clockInMutation = useMutation({
    mutationFn: async (shiftType: string) => {
      await apiRequest("POST", "/api/timeclock/clock-in", { shiftType });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/timeclock"] });
      toast({ title: "Success", description: "Clocked in successfully" });
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const clockOutMutation = useMutation({
    mutationFn: async (notes?: string) => {
      await apiRequest("POST", "/api/timeclock/clock-out", { notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/timeclock"] });
      toast({ title: "Success", description: "Clocked out successfully" });
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const formatDuration = (start: string, end?: string) => {
    const startTime = new Date(start);
    const endTime = end ? new Date(end) : new Date();
    const diff = endTime.getTime() - startTime.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const currentTime = new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <>
      <Header title="Time Clock" />
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Current Status Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Current Status</h3>
                
                {!activeEntry ? (
                  <div>
                    <p className="text-gray-600 mb-4">You are currently clocked out</p>
                    <div className="flex items-center space-x-4">
                      <Select value={selectedShift} onValueChange={(value: "day" | "night") => setSelectedShift(value)}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="day">Day Shift</SelectItem>
                          <SelectItem value="night">Night Shift</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button 
                        onClick={() => clockInMutation.mutate(selectedShift)}
                        disabled={clockInMutation.isPending}
                        className="bg-success text-white hover:bg-green-600"
                      >
                        {clockInMutation.isPending ? "Clocking In..." : "Clock In"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-3 h-3 bg-success rounded-full animate-pulse"></div>
                      <p className="text-success font-medium capitalize">
                        Currently on {activeEntry.shiftType} Shift
                      </p>
                    </div>
                    <div className="flex items-center space-x-6 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Clocked in at</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {formatTime(activeEntry.clockInTime)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Current duration</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {formatDuration(activeEntry.clockInTime)}
                        </p>
                      </div>
                    </div>
                    <Button 
                      onClick={() => clockOutMutation.mutate()}
                      disabled={clockOutMutation.isPending}
                      variant="destructive"
                    >
                      {clockOutMutation.isPending ? "Clocking Out..." : "Clock Out"}
                    </Button>
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-gray-900">{currentTime}</div>
                <p className="text-gray-600">Current Time</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Clock Entries */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Clock Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Shift Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Clock In
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Clock Out
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {entries?.length ? (
                    entries.map((entry: any) => (
                      <tr key={entry.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(entry.clockInTime)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                          {entry.shiftType} Shift
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatTime(entry.clockInTime)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {entry.clockOutTime ? formatTime(entry.clockOutTime) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {entry.clockOutTime 
                            ? formatDuration(entry.clockInTime, entry.clockOutTime)
                            : formatDuration(entry.clockInTime)
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={entry.clockOutTime ? "secondary" : "default"}>
                            {entry.clockOutTime ? "Completed" : "Active"}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                        No clock entries found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
