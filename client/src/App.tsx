import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import AllProjects from "./pages/AllProjects";
import TrackedProjects from "./pages/TrackedProjects";
import ProjectDetail from "./pages/ProjectDetail";
import ProjectInsights from "./pages/ProjectInsights";
import TrackingManagement from "./pages/TrackingManagement";
import Alerts from "./pages/Alerts";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/projects" element={<AllProjects />} />
            <Route path="/tracked" element={<TrackedProjects />} />
            <Route path="/project/:id" element={<ProjectDetail />} />
            <Route path="/insights" element={<ProjectInsights />} />
            <Route path="/tracking" element={<TrackingManagement />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
