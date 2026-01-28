import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { RootState } from "@/store/store";
import { AdminLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Building2, Activity, TrendingUp, Shield, Settings, Loader2 } from "lucide-react";
import { adminService } from "@/services/admin.service";
import { useQuery } from "@tanstack/react-query";
import { StatCard } from "./components/StatCard";


const AdminDashboard = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();
  const userRole = user?.role?.toString() ?? (user?.roleId as any)?.name ?? null;

  const { data: stats, isLoading, isError } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: () => adminService.getDashboardStats(),
    refetchOnWindowFocus: false,
  });

  if (userRole !== "Admin") {
    return (
      <AdminLayout>
        <main className="relative px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-[66px] mt-20 mb-0 flex flex-col gap-6 text-white flex-1 overflow-y-auto">
          <div className="flex flex-col items-center justify-center py-16">
            <Shield className="w-16 h-16 text-white/85 mb-4" />
            <p className="text-white/70 text-lg font-medium mb-2">Access Denied</p>
            <p className="text-white/50 text-sm">Admin access required to view this page.</p>
          </div>
        </main>
      </AdminLayout>
    );
  }

  const quickActions = [
    { title: "AI Prompts", description: "Manage AI prompt configurations", icon: Settings, path: "/admin/prompts" },
    { title: "User Management", description: "Manage all users", icon: Users, path: "/admin/users" },
    { title: "System Settings", description: "System configuration", icon: Shield, path: "/admin/settings" },
  ];

  return (
    <AdminLayout>
      <main className="relative px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-[66px] mt-20 sm:mt-20 lg:mt-24 xl:mt-28 mb-0 flex flex-col gap-6 text-white flex-1 overflow-y-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white my-2">Admin Dashboard</h1>
            <p className="text-white/70">System-wide overview and management controls</p>
          </div>
          <Badge className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-4 py-2 text-sm font-semibold flex items-center gap-2">
            <Shield className="w-4 h-4" /> ADMIN
          </Badge>
        </div>


        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            <span className="ml-3 text-white/70">Loading dashboard statistics...</span>
          </div>
        ) : isError || !stats ? (
          <p className="text-white/60">Failed to load dashboard statistics</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <StatCard title="Total Companies" value={stats?.data?.totalCompanies.toLocaleString()} icon={Building2} trend="Active companies" />
            <StatCard title="AI Agents" value={stats?.data?.totalAiAgents.toLocaleString()} icon={Activity} trend="Total agents deployed" />
            <StatCard title="Agent Requests" value={stats?.data?.totalAiAgentRequests.toLocaleString()} icon={TrendingUp} trend="Total requests processed" />
          </div>
        )}

        {!isLoading && stats && (
          <Card className="bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] border-white/10">
            <CardHeader>
              <CardTitle className="text-white/70 flex items-center gap-2">
                <Settings className="w-5 h-5 text-cyan-400" /> Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {quickActions.map((action) => (
                  <button
                    key={action.title}
                    onClick={() => navigate(action.path)}
                    className="p-4 rounded-lg bg-black/35 border border-white/10 hover:bg-black/50 hover:border-cyan-500/30 transition-all text-left group"
                  >
                    <action.icon className="w-6 h-6 text-cyan-400 mb-2 group-hover:scale-110 transition-transform" />
                    <h3 className="text-white font-semibold mb-1">{action.title}</h3>
                    <p className="text-white/60 text-sm">{action.description}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </AdminLayout>
  );
};

export default AdminDashboard;