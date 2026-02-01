import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import RouteGuard from "@/components/RouteGuard";
import Login from "./pages/Login";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import CRM from "./pages/CRM";
import Compensation from "./pages/Compensation";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Login page */}
            <Route path="/login" element={<Login />} />
            
            {/* Redirect root to login */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            
            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <RouteGuard allowedRoles={["developer"]}>
                  <Dashboard />
                </RouteGuard>
              }
            />
            <Route
              path="/crm"
              element={
                <RouteGuard allowedRoles={["salesAgent"]}>
                  <CRM />
                </RouteGuard>
              }
            />
            <Route
              path="/compensation"
              element={
                <RouteGuard allowedRoles={["admin"]}>
                  <Compensation />
                </RouteGuard>
              }
            />
            
            {/* Keep Index page accessible but redirect to login if not authenticated */}
            <Route path="/home" element={<Index />} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
