import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import CreateSession from "./pages/CreateSession";
import Sessions from "./pages/Sessions";
import NotFound from "./pages/NotFound";
import Session from "./pages/Session";
import Invite from "./pages/Invite";
import Profile from "./pages/Profile";
import SessionPreview from "./pages/SessionPreview";
import { Layout } from "@/components/Layout";
import { StepChooseCafe } from "@/features/session-flow/StepChooseCafe";
import { StepPickDay } from "@/features/session-flow/StepPickDay";
import { StepPickTime } from "@/features/session-flow/StepPickTime";
import { StepConfirm } from "@/features/session-flow/StepConfirm";
import { SuccessShare } from "@/features/session-flow/SuccessShare";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  console.log('App component rendering...');
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/onboarding" element={<Auth />} />
            <Route path="/invite/:code" element={<Invite />} />
            <Route path="/preview/:slug" element={<SessionPreview />} />
            <Route path="/" element={<Index />} />
            <Route element={<Layout />}>
              <Route path="/profile" element={<Profile />} />
              <Route path="/create-session" element={<CreateSession />} />
              <Route path="/create-session/cafe" element={<StepChooseCafe />} />
              <Route path="/create-session/day" element={<StepPickDay />} />
              <Route path="/create-session/time" element={<StepPickTime />} />
              <Route path="/create-session/confirm" element={<StepConfirm />} />
              <Route path="/create-session/success" element={<SuccessShare />} />
              <Route path="/sessions" element={<Sessions />} />
              <Route path="/sessions/:id" element={<Session />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;