import { ReactNode } from "react";
import Sidebar from "./sidebar";
import { useMobile } from "@/hooks/use-mobile";
import NotificationSystem from "./notification-system";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const isMobile = useMobile();

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      
      {/* Main content area */}
      <div className={`transition-all duration-300 ${
        isMobile 
          ? 'pt-16' // Top padding for mobile header
          : 'ml-64' // Left margin for desktop sidebar
      } min-h-screen`}>
        {/* Notification system positioned in top right */}
        <div className={`fixed z-40 ${
          isMobile 
            ? 'top-4 right-16' // Position to left of mobile menu button
            : 'top-4 right-4'  // Standard desktop position
        }`}>
          <NotificationSystem />
        </div>
        
        <main className={`${
          isMobile 
            ? 'px-4 py-6' // Mobile padding
            : 'p-6 lg:p-8' // Desktop padding
        } w-full max-w-none relative`}>
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}