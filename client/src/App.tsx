import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "./pages/not-found";
import Landing from "./pages/landing";
import Dashboard from "./pages/dashboard";
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

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/admin-setup" component={AdminSetup} />
          <Layout>
            <Route path="/" component={Dashboard} />
            <Route path="/timeclock" component={TimeClock} />
            <Route path="/financial" component={Financial} />
            <Route path="/schedule" component={Schedule} />
            <Route path="/messages" component={Messages} />
            <Route path="/music" component={Music} />
            <Route path="/tasks" component={Tasks} />
            <Route path="/staff" component={Staff} />
            <Route path="/reports" component={Reports} />
            <Route path="/admin" component={Admin} />
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
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
