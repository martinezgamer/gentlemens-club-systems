import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Users } from "lucide-react";
import { formatDuration } from "@/lib/utils";
import { format } from "date-fns";

interface CurrentDancersCardProps {
  clubLocation: string;
}

interface LineupEntry {
  id: string;
  dancerId: string;
  shiftType: "day" | "night";
  status: string;
  currentStatus?: string;
  stageOrder: number;
  clubLocation: string;
  shiftStart: string;
  shiftEnd: string;
  checkInTime?: string;
  dancer: {
    id: string;
    firstName: string;
    lastName: string;
    stageName: string;
    email: string;
    clubLocation: string;
  };
}

export default function CurrentDancersCard({ clubLocation }: CurrentDancersCardProps) {
  const { data: currentDancers, isLoading } = useQuery<LineupEntry[]>({
    queryKey: ['/api/lineup/current', clubLocation],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const getClubDisplayName = (location: string) => {
    if (location === "fantasy_gentlemens_club") return "Fantasy";
    if (location === "wiggles_gentlemens_club") return "Wiggles";
    return "Club";
  };

  const getClubColor = (location: string) => {
    if (location === "fantasy_gentlemens_club") return "bg-purple-500/10 text-purple-700";
    if (location === "wiggles_gentlemens_club") return "bg-pink-500/10 text-pink-700";
    return "bg-blue-500/10 text-blue-700";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "checked_in":
        return "bg-green-100 text-green-800";
      case "on_stage":
        return "bg-red-100 text-red-800";
      case "break":
        return "bg-yellow-100 text-yellow-800";
      case "checked_out":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const workingDancers = currentDancers?.filter(dancer => 
    dancer.status === "checked_in" || 
    dancer.status === "on_stage" || 
    dancer.status === "break"
  ) || [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3 lg:pb-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg lg:text-xl">
              {getClubDisplayName(clubLocation)} Dancers
            </CardTitle>
            <div className="animate-pulse">
              <div className="h-5 w-12 bg-gray-200 rounded"></div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3 lg:pb-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg lg:text-xl flex items-center gap-2">
            <Users className="h-5 w-5" />
            {getClubDisplayName(clubLocation)} Dancers
          </CardTitle>
          <Badge className={`text-xs lg:text-sm ${getClubColor(clubLocation)}`}>
            {workingDancers.length} Working
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3 lg:space-y-4">
          {workingDancers.length > 0 ? (
            workingDancers.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between p-2 lg:p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2 lg:space-x-3">
                  <Avatar className="w-8 h-8 lg:w-10 lg:h-10">
                    <AvatarImage 
                      src={undefined} // No profile images for dancers in this system
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                      {entry.dancer.stageName?.[0] || entry.dancer.firstName?.[0]}
                      {entry.dancer.stageName?.[1] || entry.dancer.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm lg:text-base font-medium text-gray-900 truncate">
                      {entry.dancer.stageName}
                    </p>
                    <p className="text-xs lg:text-sm text-gray-500">
                      Stage #{entry.stageOrder} • {entry.shiftType} shift
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className={`text-xs mb-1 ${getStatusColor(entry.status)}`}>
                    {entry.status === "checked_in" ? "Working" :
                     entry.status === "on_stage" ? "On Stage" :
                     entry.status === "break" ? "Break" : entry.status}
                  </Badge>
                  {entry.checkInTime && (
                    <p className="text-xs text-gray-500">
                      {formatDuration(entry.checkInTime)}
                    </p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6">
              <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-gray-500 text-sm">
                No dancers currently working at {getClubDisplayName(clubLocation)}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}