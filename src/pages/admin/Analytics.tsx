import { AdminLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  Activity,
  Globe,
} from "lucide-react";

const AdminAnalytics = () => {
  return (
    <AdminLayout>
      <main className="relative px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-[66px] mt-20 sm:mt-20 lg:mt-24 xl:mt-28 mb-0 flex flex-col gap-6 text-white flex-1 overflow-y-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              System Analytics
            </h1>
            <p className="text-white/60 text-sm">
              Comprehensive system performance and usage analytics
            </p>
          </div>
          <Badge className="bg-white/10 text-white/85 border border-white/20 px-4 py-2">
            REAL-TIME DATA
          </Badge>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] border-white/10 hover:border-white/20 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/70">
                Total Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">$284,750</div>
              <p className="text-xs text-white/60 mt-1">
                +12.5% from last month
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] border-white/10 hover:border-white/20 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/70">
                User Growth
              </CardTitle>
              <Users className="h-4 w-4 text-cyan-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-cyan-400">+1,247</div>
              <p className="text-xs text-white/60 mt-1">
                New users this month
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] border-white/10 hover:border-white/20 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/70">
                System Load
              </CardTitle>
              <Activity className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-400">67%</div>
              <p className="text-xs text-white/60 mt-1">Average CPU usage</p>
            </CardContent>
          </Card>

          <Card className="bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] border-white/10 hover:border-white/20 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/70">
                Global Reach
              </CardTitle>
              <Globe className="h-4 w-4 text-white/85" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white/85">89</div>
              <p className="text-xs text-white/60 mt-1">
                Countries with users
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] border-white/10 hover:border-white/20 transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-white/70 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-white/70">API Response Time</span>
                  <span className="text-green-400">245ms avg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Error Rate</span>
                  <span className="text-green-400">0.01%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Uptime</span>
                  <span className="text-green-400">99.98%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Throughput</span>
                  <span className="text-cyan-400">1,200 req/s</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] border-white/10 hover:border-white/20 transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-white/70 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Growth Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-white/70">Monthly Active Users</span>
                  <span className="text-white/85">+15.2%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Company Registrations</span>
                  <span className="text-white/85">+12.8%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Revenue Growth</span>
                  <span className="text-white/85">+18.5%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Feature Adoption</span>
                  <span className="text-cyan-400">+22.1%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </AdminLayout>
  );
};

export default AdminAnalytics;
