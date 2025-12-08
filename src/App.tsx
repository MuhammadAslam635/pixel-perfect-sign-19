import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./store/store";
import AppRoutes from "./AppRoutes";
import { AdminLayout } from "./components/dashboard/DashboardLayout";
import SkylarFloatingWidget from "@/components/SkylarFloatingWidget";
import "./App.css";

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

const App = () => (
  <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <AppRoutes />
          <SkylarFloatingWidget />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </Provider>
);

export default App;
