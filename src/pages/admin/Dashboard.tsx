import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { AdminLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Building2,
  Activity,
  TrendingUp,
  Shield,
  Settings,
  BarChart3,
  Globe,
  Loader2,
} from "lucide-react";
import { adminService } from "@/services/admin.service";
import { toast } from "sonner";

const AdminDashboard = () => {
  const authState = useSelector((state: RootState) => state.auth);

  // Get user's role name
  const getUserRoleName = (): string | null => {
    const user = authState.user;
    if (!user) return null;

    if (user.roleId && typeof user.roleId === "object") {
      return (user.roleId as any).name;
    }

    if (user.role && typeof user.role === "string") {
      return user.role;
    }

    return null;
  };

  const userRole = getUserRoleName();

  // Real data for admin dashboard
  const [stats, setStats] = useState({
    totalCompanies: 0,
    totalAiAgents: 0,
    totalAiAgentRequests: 0,
    totalRequestPortal: 0,
    totalFreeCompanies: 0,
    totalPremiumCompanies: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoading(true);
        const response = await adminService.getDashboardStats();
        if (response.success) {
          setStats(response.data);
        } else {
          toast.error("Failed to load dashboard statistics");
        }
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        toast.error("Failed to load dashboard statistics");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  const StatCard = ({
    title,
    value,
    icon: Icon,
    trend,
    color = "blue",
  }: {
    title: string;
    value: string | number;
    icon: any;
    trend?: string;
    color?: string;
  }) => (
    <Card className="bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] border-white/10 hover:border-white/20 transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-white/70">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-cyan-400" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-white">{value}</div>
        {trend && <p className="text-xs text-white/60">{trend}</p>}
      </CardContent>
    </Card>
  );

  if (userRole !== "Admin") {
    return (
      <AdminLayout>
        <main className="relative px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-[66px] mt-20 sm:mt-20 lg:mt-24 xl:mt-28 mb-0 flex flex-col gap-6 text-white flex-1 overflow-y-auto">
          <div className="flex flex-col items-center justify-center py-16">
            <Shield className="w-16 h-16 text-white/85 mb-4" />
            <p className="text-white/70 text-lg font-medium mb-2">
              Access Denied
            </p>
            <p className="text-white/50 text-sm">
              Admin access required to view this page.
            </p>
          </div>
        </main>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <main className="relative px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-[66px] mt-20 sm:mt-20 lg:mt-24 xl:mt-28 mb-0 flex flex-col gap-6 text-white flex-1 overflow-y-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Admin Dashboard
            </h1>
            <p className="text-white/70 text-sm">
              System-wide overview and management controls
            </p>
          </div>
          <Badge className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-4 py-2 text-sm font-semibold">
            <Shield className="w-4 h-4 mr-2" />
            ADMIN
          </Badge>
        </div>

        {/* Stats Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            <span className="ml-3 text-white/70">Loading dashboard statistics...</span>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Companies"
              value={stats.totalCompanies.toLocaleString()}
              icon={Building2}
              trend={`${stats.totalFreeCompanies} free • ${stats.totalPremiumCompanies} premium`}
            />
            <StatCard
              title="AI Agents"
              value={stats.totalAiAgents.toLocaleString()}
              icon={Activity}
              trend="Active AI agents"
            />
            <StatCard
              title="Agent Requests"
              value={stats.totalAiAgentRequests.toLocaleString()}
              icon={TrendingUp}
              trend="Total requests processed"
            />
            <StatCard
              title="Request Portal"
              value={stats.totalRequestPortal.toLocaleString()}
              icon={Users}
              trend="Portal entries"
            />
          </div>
        )}

        {!loading && (
          <div className="grid gap-6 md:grid-cols-2">
            {/* System Overview */}
            <Card className="bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] border-white/10">
              <CardHeader>
                <CardTitle className="text-white/70 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-cyan-400" />
                  System Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-white/70">Total Companies</span>
                  <span className="text-white font-semibold">{stats.totalCompanies.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/70">Free Tier Companies</span>
                  <span className="text-white font-semibold">{stats.totalFreeCompanies.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/70">Premium Companies</span>
                  <span className="text-cyan-400 font-semibold">{stats.totalPremiumCompanies.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/70">AI Agents Deployed</span>
                  <span className="text-green-400 font-semibold">{stats.totalAiAgents.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            {/* Activity Summary */}
            <Card className="bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] border-white/10">
              <CardHeader>
                <CardTitle className="text-white/70 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-cyan-400" />
                  Activity Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-white/70">Total AI Agent Requests</span>
                  <span className="text-white font-semibold">{stats.totalAiAgentRequests.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/70">Request Portal Entries</span>
                  <span className="text-white font-semibold">{stats.totalRequestPortal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/70">Avg Requests per Company</span>
                  <span className="text-cyan-400 font-semibold">
                    {stats.totalCompanies > 0
                      ? Math.round(stats.totalAiAgentRequests / stats.totalCompanies).toLocaleString()
                      : 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/70">System Status</span>
                  <span className="text-green-400 font-semibold flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    Operational
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Actions */}
        {!loading && (
          <Card className="bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] border-white/10">
            <CardHeader>
              <CardTitle className="text-white/70 flex items-center gap-2">
                <Settings className="w-5 h-5 text-cyan-400" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <button
                  onClick={() => window.location.href = "/admin/prompts"}
                  className="p-4 rounded-lg bg-black/35 border border-white/10 hover:bg-black/50 hover:border-cyan-500/30 transition-all text-left group"
                >
                  <Settings className="w-6 h-6 text-cyan-400 mb-2 group-hover:scale-110 transition-transform" />
                  <h3 className="text-white font-semibold mb-1">
                    AI Prompts
                  </h3>
                  <p className="text-white/60 text-sm">Manage AI prompt configurations</p>
                </button>
                <button
                  onClick={() => window.location.href = "/admin/users"}
                  className="p-4 rounded-lg bg-black/35 border border-white/10 hover:bg-black/50 hover:border-cyan-500/30 transition-all text-left group"
                >
                  <Users className="w-6 h-6 text-cyan-400 mb-2 group-hover:scale-110 transition-transform" />
                  <h3 className="text-white font-semibold mb-1">
                    User Management
                  </h3>
                  <p className="text-white/60 text-sm">Global user controls</p>
                </button>
                <button
                  onClick={() => window.location.href = "/admin/settings"}
                  className="p-4 rounded-lg bg-black/35 border border-white/10 hover:bg-black/50 hover:border-cyan-500/30 transition-all text-left group"
                >
                  <Shield className="w-6 h-6 text-cyan-400 mb-2 group-hover:scale-110 transition-transform" />
                  <h3 className="text-white font-semibold mb-1">
                    System Settings
                  </h3>
                  <p className="text-white/60 text-sm">
                    Security & configuration
                  </p>
                </button>
                <button
                  onClick={() => window.location.href = "/admin/dashboard"}
                  className="p-4 rounded-lg bg-black/35 border border-white/10 hover:bg-black/50 hover:border-cyan-500/30 transition-all text-left group"
                >
                  <BarChart3 className="w-6 h-6 text-cyan-400 mb-2 group-hover:scale-110 transition-transform" />
                  <h3 className="text-white font-semibold mb-1">
                    View Analytics
                  </h3>
                  <p className="text-white/60 text-sm">Detailed system metrics</p>
                </button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </AdminLayout>
  );
};

export default AdminDashboard;
