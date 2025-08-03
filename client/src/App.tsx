import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { ProtectedRoute } from "@/lib/protected-route";
import { ClubSelectionProvider } from "@/hooks/useClubSelection";
import NotFound from "./pages/not-found";
import AuthPage from "./pages/auth-page";
import Dashboard from "./pages/dashboard";
import SuperuserDashboard from "./pages/superuser-dashboard";
import DancerApplications from "./pages/dancer-applications";
import Lineup from "./pages/lineup";
import TimeClock from "./pages/timeclock";
import Financial from "./pages/financial";
import PersonalFinance from "./pages/personal-finance";
import Schedule from "./pages/schedule";
import Messages from "./pages/messages";
import Music from "./pages/music";
import Tasks from "./pages/tasks";
import Staff from "./pages/staff";
import Reports from "./pages/reports";
import Admin from "./pages/admin";
import AdminSetup from "./pages/admin-setup";
import Demo from "./pages/demo";
import Layout from "./components/layout";
import PublicDancerApplication from "./pages/public-dancer-application";

function Router() {
  const { user } = useAuth();

  return (
    <Switch>
      {/* Public routes - no authentication required */}
      <Route path="/apply" component={PublicDancerApplication} />
      <Route path="/auth" component={AuthPage} />
      
      {/* Protected routes */}
      <ProtectedRoute path="/admin-setup" component={AdminSetup} />
      
      <Layout>
        {user?.role === 'superuser' ? (
          <>
            <ProtectedRoute path="/" component={SuperuserDashboard} />
            <ProtectedRoute path="/superuser" component={SuperuserDashboard} />
            <ProtectedRoute path="/dashboard" component={Dashboard} />
            <ProtectedRoute path="/dancers" component={DancerApplications} />
            <ProtectedRoute path="/lineup" component={Lineup} />
            <ProtectedRoute path="/timeclock" component={TimeClock} />
            <ProtectedRoute path="/financial" component={Financial} />
            <ProtectedRoute path="/personal-finance" component={PersonalFinance} />
            <ProtectedRoute path="/schedule" component={Schedule} />
            <ProtectedRoute path="/messages" component={Messages} />
            <ProtectedRoute path="/music" component={Music} />
            <ProtectedRoute path="/tasks" component={Tasks} />
            <ProtectedRoute path="/staff" component={Staff} />
            <ProtectedRoute path="/reports" component={Reports} />
            <ProtectedRoute path="/admin" component={Admin} />
            <ProtectedRoute path="/demo" component={Demo} />
          </>
        ) : (
          <>
            <ProtectedRoute path="/" component={Dashboard} />
            <ProtectedRoute path="/dancers" component={DancerApplications} />
            <ProtectedRoute path="/lineup" component={Lineup} />
            <ProtectedRoute path="/timeclock" component={TimeClock} />
            <ProtectedRoute path="/financial" component={Financial} />
            <ProtectedRoute path="/personal-finance" component={PersonalFinance} />
            <ProtectedRoute path="/schedule" component={Schedule} />
            <ProtectedRoute path="/messages" component={Messages} />
            <ProtectedRoute path="/music" component={Music} />
            <ProtectedRoute path="/tasks" component={Tasks} />
            <ProtectedRoute path="/staff" component={Staff} />
            <ProtectedRoute path="/reports" component={Reports} />
            <ProtectedRoute path="/admin" component={Admin} />
            <ProtectedRoute path="/demo" component={Demo} />
          </>
        )}
      </Layout>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ClubSelectionProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ClubSelectionProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
