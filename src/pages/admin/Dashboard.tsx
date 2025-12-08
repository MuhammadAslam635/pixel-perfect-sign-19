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
} from "lucide-react";

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

  // Mock data for admin dashboard
  const [stats, setStats] = useState({
    totalCompanies: 0,
    totalUsers: 0,
    activeCompanies: 0,
    systemHealth: "Good",
    totalRevenue: 0,
    monthlyGrowth: 0,
  });

  const [recentActivities, setRecentActivities] = useState([
    {
      id: 1,
      type: "company_created",
      message: "New company 'TechCorp' registered",
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    },
    {
      id: 2,
      type: "user_invited",
      message: "Admin invited to 'DataFlow Inc'",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    },
    {
      id: 3,
      type: "system_update",
      message: "System maintenance completed",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
    },
  ]);

  useEffect(() => {
    // In a real app, fetch stats from API
    setStats({
      totalCompanies: 1247,
      totalUsers: 15683,
      activeCompanies: 1189,
      systemHealth: "Excellent",
      totalRevenue: 284750,
      monthlyGrowth: 12.5,
    });
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Companies"
            value={stats.totalCompanies.toLocaleString()}
            icon={Building2}
            trend={`${stats.activeCompanies} active`}
          />
          <StatCard
            title="Total Users"
            value={stats.totalUsers.toLocaleString()}
            icon={Users}
            trend="Across all companies"
          />
          <StatCard
            title="System Health"
            value={stats.systemHealth}
            icon={Activity}
            trend="All systems operational"
          />
          <StatCard
            title="Monthly Growth"
            value={`+${stats.monthlyGrowth}%`}
            icon={TrendingUp}
            trend="vs last month"
          />
        </div>

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
                <span className="text-white/70">Active Sessions</span>
                <span className="text-white font-semibold">1,247</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/70">API Requests (24h)</span>
                <span className="text-white font-semibold">892,341</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/70">Database Load</span>
                <span className="text-green-400 font-semibold">23%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/70">Uptime</span>
                <span className="text-green-400 font-semibold">99.98%</span>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activities */}
          <Card className="bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] border-white/10">
            <CardHeader>
              <CardTitle className="text-white/70 flex items-center gap-2">
                <Activity className="w-5 h-5 text-cyan-400" />
                Recent Activities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-black/20 border border-white/10"
                  >
                    <div className="w-2 h-2 rounded-full bg-cyan-400 mt-2 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white/90 text-sm">
                        {activity.message}
                      </p>
                      <p className="text-white/50 text-xs mt-1">
                        {activity.timestamp.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] border-white/10">
          <CardHeader>
            <CardTitle className="text-white/70 flex items-center gap-2">
              <Settings className="w-5 h-5 text-cyan-400" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <button className="p-4 rounded-lg bg-black/35 border border-white/10 hover:bg-black/50 transition-colors text-left">
                <BarChart3 className="w-6 h-6 text-cyan-400 mb-2" />
                <h3 className="text-white font-semibold mb-1">
                  View Analytics
                </h3>
                <p className="text-white/60 text-sm">Detailed system metrics</p>
              </button>
              <button className="p-4 rounded-lg bg-black/35 border border-white/10 hover:bg-black/50 transition-colors text-left">
                <Building2 className="w-6 h-6 text-cyan-400 mb-2" />
                <h3 className="text-white font-semibold mb-1">
                  Manage Companies
                </h3>
                <p className="text-white/60 text-sm">Company administration</p>
              </button>
              <button className="p-4 rounded-lg bg-black/35 border border-white/10 hover:bg-black/50 transition-colors text-left">
                <Users className="w-6 h-6 text-cyan-400 mb-2" />
                <h3 className="text-white font-semibold mb-1">
                  User Management
                </h3>
                <p className="text-white/60 text-sm">Global user controls</p>
              </button>
              <button className="p-4 rounded-lg bg-black/35 border border-white/10 hover:bg-black/50 transition-colors text-left">
                <Shield className="w-6 h-6 text-cyan-400 mb-2" />
                <h3 className="text-white font-semibold mb-1">
                  System Settings
                </h3>
                <p className="text-white/60 text-sm">
                  Security & configuration
                </p>
              </button>
            </div>
          </CardContent>
        </Card>
      </main>
    </AdminLayout>
  );
};

export default AdminDashboard;
