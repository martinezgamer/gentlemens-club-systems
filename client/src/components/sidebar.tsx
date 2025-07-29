import { Link, useLocation } from "wouter";
import { Building, BarChart3, Calendar, Clock, DollarSign, MessageCircle, Music, CheckSquare, Users, FileText, Settings, Menu, X, TestTube } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { useMobile } from "@/hooks/use-mobile";

const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3 },
  { name: "Dancers", href: "/dancers", icon: Users },
  { name: "Lineup", href: "/lineup", icon: Calendar },
  { name: "Schedule", href: "/schedule", icon: Calendar },
  { name: "Time Clock", href: "/timeclock", icon: Clock },
  { name: "Messages", href: "/messages", icon: MessageCircle },
  { name: "Music Requests", href: "/music", icon: Music },
  { name: "Tasks", href: "/tasks", icon: CheckSquare },
  { name: "Staff", href: "/staff", icon: Users },
  { name: "Reports", href: "/reports", icon: FileText },
  { name: "Demo", href: "/demo", icon: TestTube },
];

const superuserNavigation = [
  { name: "Superuser Dashboard", href: "/superuser", icon: Building },
  { name: "Staff Dashboard", href: "/dashboard", icon: BarChart3 },
];

const adminNavigation = [
  { name: "Admin", href: "/admin", icon: Settings },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useMobile();

  // Close mobile menu when location changes
  useEffect(() => {
    if (isMobile) {
      setIsOpen(false);
    }
  }, [location, isMobile]);

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const canAccessAdmin = (user as any)?.role === 'owner' || (user as any)?.role === 'manager' || (user as any)?.role === 'superuser';
  const isSuperuser = (user as any)?.role === 'superuser';

  // Mobile header with hamburger menu
  if (isMobile) {
    return (
      <>
        {/* Mobile Header */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Building className="text-white" size={16} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">FantasyCompanions</h3>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
            className="p-2"
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>
        </div>

        {/* Mobile Overlay */}
        {isOpen && (
          <div 
            className="fixed inset-0 z-40 bg-black bg-opacity-50"
            onClick={() => setIsOpen(false)}
          />
        )}

        {/* Mobile Sidebar */}
        <div className={`fixed top-0 left-0 z-50 h-full w-72 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          {/* Mobile Logo section */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <Building className="text-white" size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">FantasyCompanions</h3>
                  <p className="text-xs text-gray-500 capitalize">{(user as any)?.role || 'Employee'}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="p-2"
              >
                <X size={20} />
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              
              return (
                <Link key={item.name} href={item.href}>
                  <div className={`flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActive 
                      ? 'bg-primary text-white shadow-sm' 
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}>
                    <Icon size={20} />
                    <span>{item.name}</span>
                  </div>
                </Link>
              );
            })}

            {canAccessAdmin && (
              <div className="pt-4 mt-4 border-t border-gray-200">
                {adminNavigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = location === item.href;
                  
                  return (
                    <Link key={item.name} href={item.href}>
                      <div className={`flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                        isActive 
                          ? 'bg-primary text-white shadow-sm' 
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }`}>
                        <Icon size={20} />
                        <span>{item.name}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </nav>

          {/* Mobile User section */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center space-x-3 mb-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={(user as any)?.profileImageUrl} />
                <AvatarFallback className="text-xs">
                  {((user as any)?.firstName?.[0] || '') + ((user as any)?.lastName?.[0] || '')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {(user as any)?.firstName} {(user as any)?.lastName}
                </p>
                <p className="text-xs text-gray-500 truncate capitalize">
                  {(user as any)?.role || 'Employee'}
                </p>
              </div>
            </div>
            <Button 
              onClick={handleLogout} 
              variant="outline" 
              size="sm"
              className="w-full text-xs"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </>
    );
  }

  // Desktop sidebar
  return (
    <div className="fixed left-0 top-0 z-30 h-full w-64 bg-white shadow-lg flex flex-col">
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
              <div className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                isActive 
                  ? 'bg-primary text-white' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}>
                <item.icon size={20} />
                <span>{item.name}</span>
              </div>
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
                  <div className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                    isActive 
                      ? 'bg-primary text-white' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}>
                    <item.icon size={20} />
                    <span>{item.name}</span>
                  </div>
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
