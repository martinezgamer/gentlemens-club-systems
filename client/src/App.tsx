import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { ClubSelectionProvider } from "@/hooks/useClubSelection";
import NotFound from "./pages/not-found";
import Landing from "./pages/landing";
import Login from "./pages/login";
import Dashboard from "./pages/dashboard";
import SuperuserDashboard from "./pages/superuser-dashboard";
import DancerApplications from "./pages/dancer-applications";
import Lineup from "./pages/lineup";
import TimeClock from "./pages/timeclock";
import Financial from "./pages/financial";
import Schedule from "./pages/schedule";
import Messages from "./pages/messages";
import Music from "./pages/music";
import Tasks from "./pages/tasks";
import Staff from "./pages/staff";
import Reports from "./pages/reports";
import Admin from "./pages/admin";
import AdminSetup from "./pages/admin-setup";
import Layout from "./components/layout";
import PublicDancerApplication from "./pages/public-dancer-application";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  return (
    <Switch>
      {/* Public routes - no authentication required */}
      <Route path="/apply" component={PublicDancerApplication} />
      
      {isLoading || !isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/login" component={Login} />
        </>
      ) : (
        <>
          <Route path="/admin-setup" component={AdminSetup} />
          <Layout>
            {user?.role === 'superuser' ? (
              <>
                <Route path="/" component={SuperuserDashboard} />
                <Route path="/superuser" component={SuperuserDashboard} />
                <Route path="/dashboard" component={Dashboard} />
                <Route path="/dancers" component={DancerApplications} />
                <Route path="/lineup" component={Lineup} />
                <Route path="/timeclock" component={TimeClock} />
                <Route path="/financial" component={Financial} />
                <Route path="/schedule" component={Schedule} />
                <Route path="/messages" component={Messages} />
                <Route path="/music" component={Music} />
                <Route path="/tasks" component={Tasks} />
                <Route path="/staff" component={Staff} />
                <Route path="/reports" component={Reports} />
                <Route path="/admin" component={Admin} />
              </>
            ) : (
              <>
                <Route path="/" component={Dashboard} />
                <Route path="/dancers" component={DancerApplications} />
                <Route path="/lineup" component={Lineup} />
                <Route path="/timeclock" component={TimeClock} />
                <Route path="/financial" component={Financial} />
                <Route path="/schedule" component={Schedule} />
                <Route path="/messages" component={Messages} />
                <Route path="/music" component={Music} />
                <Route path="/tasks" component={Tasks} />
                <Route path="/staff" component={Staff} />
                <Route path="/reports" component={Reports} />
              </>
            )}

          </Layout>
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ClubSelectionProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ClubSelectionProvider>
    </QueryClientProvider>
  );
}

export default App;
