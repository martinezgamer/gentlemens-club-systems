import { ReactNode } from "react";
import Sidebar from "./sidebar";
import { useMobile } from "@/hooks/use-mobile";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const isMobile = useMobile();

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      
      {/* Main content area */}
      <div className={`${
        isMobile 
          ? 'pt-16' // Top padding for mobile header
          : 'ml-64' // Left margin for desktop sidebar
      } min-h-screen`}>
        <main className={`${
          isMobile 
            ? 'px-4 py-6' // Mobile padding
            : 'p-8' // Desktop padding
        }`}>
          {children}
        </main>
      </div>
    </div>
  );
}