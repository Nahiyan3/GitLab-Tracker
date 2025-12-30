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
import ProjectInsight from "./pages/ProjectInsight";
import TrackingManagement from "./pages/TrackingManagement";
import Alerts from "./pages/Alerts";
import GeminiTest from "./pages/GeminiTest";
import DoraMetricsInput from "./pages/DoraMetricsInput";
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
            <Route path="/project/:id/insights" element={<ProjectInsight />} />
            <Route path="/project/:id/dora-input" element={<DoraMetricsInput />} />
            <Route path="/insights" element={<ProjectInsights />} />
            <Route path="/tracking" element={<TrackingManagement />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/gemini-test" element={<GeminiTest />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
