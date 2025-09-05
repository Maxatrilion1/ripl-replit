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
import { Layout } from "@/components/Layout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/auth/onboarding" element={<Auth />} />
          <Route path="/auth/linkedin-confirm" element={<Auth />} />
          <Route path="/invite/:code" element={<Invite />} />
          <Route element={<Layout />}>
            <Route path="/" element={<Index />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/create-session" element={<CreateSession />} />
            <Route path="/sessions" element={<Sessions />} />
            <Route path="/sessions/:id" element={<Session />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
