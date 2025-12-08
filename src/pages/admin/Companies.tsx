import { AdminLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, Activity, TrendingUp } from "lucide-react";

const AdminCompanies = () => {
  return (
    <AdminLayout>
      <main className="relative px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-[66px] mt-20 sm:mt-20 lg:mt-24 xl:mt-28 mb-0 flex flex-col gap-6 text-white flex-1 overflow-y-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              All Companies
            </h1>
            <p className="text-white/60 text-sm">
              Global company management and oversight
            </p>
          </div>
          <Badge className="bg-white/10 text-white/85 border border-white/20 px-4 py-2">
            GLOBAL VIEW
          </Badge>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] border-white/10 hover:border-white/20 transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-white/70 flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Total Companies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">1,247</div>
              <p className="text-xs text-white/60 mt-1">+12% from last month</p>
            </CardContent>
          </Card>

          <Card className="bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] border-white/10 hover:border-white/20 transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-white/70 flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Active Companies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-400">1,189</div>
              <p className="text-xs text-white/60 mt-1">95.3% active rate</p>
            </CardContent>
          </Card>

          <Card className="bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] border-white/10 hover:border-white/20 transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-white/70 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-cyan-400">15,683</div>
              <p className="text-xs text-white/60 mt-1">Across all companies</p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] border-white/10 hover:border-white/20 transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-white/70 flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Company Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-white/70">
              Company management interface would be implemented here with full
              CRUD operations, company status controls, and detailed analytics.
            </p>
          </CardContent>
        </Card>
      </main>
    </AdminLayout>
  );
};

export default AdminCompanies;
