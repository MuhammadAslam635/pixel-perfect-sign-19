import { AdminLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Server, Database, Cpu, HardDrive, Wifi } from "lucide-react";

const AdminSystemOverview = () => {
  return (
    <AdminLayout>
      <main className="relative px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-[66px] mt-20 sm:mt-20 lg:mt-24 xl:mt-28 mb-0 flex flex-col gap-6 text-white flex-1 overflow-y-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              System Overview
            </h1>
            <p className="text-white/60 text-sm">
              Real-time system monitoring and performance metrics
            </p>
          </div>
          <Badge className="bg-white/10 text-white/85 border border-white/20 px-4 py-2">
            LIVE MONITORING
          </Badge>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] border-white/10 hover:border-white/20 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/70">
                Server Status
              </CardTitle>
              <Server className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">Online</div>
              <p className="text-xs text-white/60 mt-1">
                All servers operational
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] border-white/10 hover:border-white/20 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/70">
                CPU Usage
              </CardTitle>
              <Cpu className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-400">67%</div>
              <p className="text-xs text-white/60 mt-1">
                Average across cluster
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] border-white/10 hover:border-white/20 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/70">
                Memory Usage
              </CardTitle>
              <Database className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-400">4.2GB</div>
              <p className="text-xs text-white/60 mt-1">
                of 8GB available
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] border-white/10 hover:border-white/20 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/70">
                Storage
              </CardTitle>
              <HardDrive className="h-4 w-4 text-white/85" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white/85">78%</div>
              <p className="text-xs text-white/60 mt-1">
                312GB of 400GB used
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] border-white/10 hover:border-white/20 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/70">
                Network I/O
              </CardTitle>
              <Wifi className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">1.2GB/s</div>
              <p className="text-xs text-white/60 mt-1">
                Peak bandwidth usage
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] border-white/10 hover:border-white/20 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/70">
                Active Connections
              </CardTitle>
              <Activity className="h-4 w-4 text-cyan-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-cyan-400">1,247</div>
              <p className="text-xs text-white/60 mt-1">
                Real-time connections
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </AdminLayout>
  );
};

export default AdminSystemOverview;
