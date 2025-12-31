import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { Suspense, lazy } from "react";
import { store } from "./store/store";
import AppRoutes from "./AppRoutes";
import { AdminLayout } from "./components/dashboard/DashboardLayout";
const SkylarFloatingWidget = lazy(() => import("@/components/SkylarFloatingWidget"));
import "./App.css";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { updateUser } from "./store/slices/authSlice";
import { fetchAndSyncUser } from "./utils/authSync";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0, // Data is immediately stale
      gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes (formerly cacheTime)
      refetchOnWindowFocus: true, // Refetch when window regains focus
      refetchOnMount: true, // Refetch when component mounts
      retry: 1,
    },
  },
});

// Component to sync auth state on app load
const AuthSynchronizer = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const syncUser = async () => {
      const user = await fetchAndSyncUser();
      if (user) {
        dispatch(updateUser(user));
      }
    };
    syncUser();
  }, [dispatch]);

  return null;
};

const App = () => (
  <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthSynchronizer />
        <Toaster />
        <Sonner />
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <AppRoutes />
          <Suspense fallback={null}>
            <SkylarFloatingWidget />
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </Provider>
);

export default App;
