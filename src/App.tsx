import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppLayout } from "@/components/AppLayout";
import { Suspense, lazy } from "react";
import { Loader2 } from "lucide-react";

// Eagerly loaded pages — these are critical-path screens that the user sees
// immediately after login, so they must be in the main bundle.
import Dashboard from "./pages/Dashboard";
import ChecklistPage from "./pages/ChecklistPage";
import LoginPage from "./pages/LoginPage";

// Lazily loaded pages — these contain heavy dependencies (Recharts ~45KB gzipped)
// and are not on the critical path. Code-splitting them reduces the initial
// bundle size, improving Time-to-Interactive on first PWA load.
const InsightsPage = lazy(() => import("./pages/InsightsPage"));
const AchievementsPage = lazy(() => import("./pages/AchievementsPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 5-minute stale time prevents over-fetching during a single Ramadan session
      // (users typically check habits, see dashboard, and close). Data that's
      // < 5 min old is shown from cache, reducing Supabase API calls.
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

/**
 * Shared loading fallback for lazy-loaded route chunks.
 * Uses the same spinner as ProtectedRoute for visual consistency.
 */
function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ErrorBoundary>
            <AuthProvider>
              <Routes>
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Dashboard />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/checklist"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <ChecklistPage />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/insights"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Suspense fallback={<PageLoader />}>
                          <InsightsPage />
                        </Suspense>
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/achievements"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Suspense fallback={<PageLoader />}>
                          <AchievementsPage />
                        </Suspense>
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route path="/login" element={<LoginPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AuthProvider>
          </ErrorBoundary>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
