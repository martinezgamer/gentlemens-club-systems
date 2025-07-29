import { Link, useLocation } from "wouter";
import { Building, BarChart3, Calendar, Clock, DollarSign, MessageCircle, Music, CheckSquare, Users, FileText, Settings } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3 },
  { name: "Schedule", href: "/schedule", icon: Calendar },
  { name: "Time Clock", href: "/timeclock", icon: Clock },
  { name: "Financial", href: "/financial", icon: DollarSign },
  { name: "Messages", href: "/messages", icon: MessageCircle },
  { name: "Music Requests", href: "/music", icon: Music },
  { name: "Tasks", href: "/tasks", icon: CheckSquare },
  { name: "Staff", href: "/staff", icon: Users },
  { name: "Reports", href: "/reports", icon: FileText },
];

const adminNavigation = [
  { name: "Admin", href: "/admin", icon: Settings },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const canAccessAdmin = (user as any)?.role === 'owner' || (user as any)?.role === 'manager';

  return (
    <div className="w-64 bg-white shadow-lg flex-shrink-0 flex flex-col">
      {/* Logo section */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Building className="text-white" size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">FantasyCompanions</h3>
            <p className="text-xs text-gray-500 capitalize">{(user as any)?.role || 'Employee'}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <a className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-primary text-white' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}>
                <item.icon size={20} />
                <span>{item.name}</span>
              </a>
            </Link>
          );
        })}

        {/* Admin section */}
        {canAccessAdmin && (
          <div className="pt-4 border-t border-gray-200">
            {adminNavigation.map((item) => {
              const isActive = location === item.href;
              return (
                <Link key={item.name} href={item.href}>
                  <a className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-primary text-white' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}>
                    <item.icon size={20} />
                    <span>{item.name}</span>
                  </a>
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      {/* User profile section */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex items-center space-x-3">
          <Avatar className="w-10 h-10">
            <AvatarImage 
              src={(user as any)?.profileImageUrl || undefined} 
              alt="User profile"
              className="object-cover"
            />
            <AvatarFallback>
              {(user as any)?.firstName?.[0]}{(user as any)?.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-medium text-gray-900">
              {(user as any)?.firstName} {(user as any)?.lastName}
            </p>
            <p className="text-sm text-gray-500">Online</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-gray-400 hover:text-gray-600"
          >
            <Settings size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
