import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import Persona from "@/pages/persona";
import Conversations from "@/pages/conversations";
import Content from "@/pages/content";
import Fans from "@/pages/fans";
import Payments from "@/pages/payments";
import Safety from "@/pages/safety";
import Analytics from "@/pages/analytics";
import NotFound from "@/pages/not-found";
import Sidebar from "@/components/sidebar";

function Router() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="pl-64">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/persona" component={Persona} />
          <Route path="/conversations" component={Conversations} />
          <Route path="/content" component={Content} />
          <Route path="/fans" component={Fans} />
          <Route path="/payments" component={Payments} />
          <Route path="/safety" component={Safety} />
          <Route path="/analytics" component={Analytics} />
          <Route component={NotFound} />
        </Switch>
      </div>
    </div>
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
