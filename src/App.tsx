import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import Services from "./pages/Services";
import BookingRequests from "./pages/BookingRequests";
import Appointments from "./pages/Appointments";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import PendingApproval from "./pages/PendingApproval";
import PublicBooking from "./pages/PublicBooking";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

// Layout wrapper that properly handles the outlet for nested routes
function ProtectedLayout() {
  return (
    <ProtectedRoute>
      <DashboardLayout />
    </ProtectedRoute>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                {/* Public routes */}
                <Route path="/auth" element={<Auth />} />
                <Route path="/pending-approval" element={<PendingApproval />} />
                <Route path="/book" element={<PublicBooking />} />
                
                {/* Protected routes with layout */}
                <Route element={<ProtectedLayout />}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/patients" element={<Patients />} />
                  <Route path="/services" element={<Services />} />
                  <Route path="/booking-requests" element={<BookingRequests />} />
                  <Route path="/appointments" element={<Appointments />} />
                  <Route path="/settings" element={<Settings />} />
                </Route>
                
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
