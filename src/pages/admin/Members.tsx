import { AdminLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, UserCheck, Shield, Crown } from "lucide-react";

const AdminMembers = () => {
  return (
    <AdminLayout>
      <main className="relative px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-[66px] mt-20 sm:mt-20 lg:mt-24 xl:mt-28 mb-0 flex flex-col gap-6 text-white flex-1 overflow-y-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Global Members
            </h1>
            <p className="text-white/60 text-sm">
              System-wide user management and role administration
            </p>
          </div>
          <Badge className="bg-white/10 text-white/85 border border-white/20 px-4 py-2">
            GLOBAL CONTROL
          </Badge>
        </div>

        <div className="grid gap-6 md:grid-cols-4">
          <Card className="bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] border-white/10 hover:border-white/20 transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-white/70 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">15,683</div>
              <p className="text-xs text-white/60 mt-1">All registered users</p>
            </CardContent>
          </Card>

          <Card className="bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] border-white/10 hover:border-white/20 transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-white/70 flex items-center gap-2">
                <UserCheck className="w-5 h-5" />
                Active Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-400">14,892</div>
              <p className="text-xs text-white/60 mt-1">94.9% active rate</p>
            </CardContent>
          </Card>

          <Card className="bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] border-white/10 hover:border-white/20 transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-white/70 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Admins
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-400">247</div>
              <p className="text-xs text-white/60 mt-1">Company administrators</p>
            </CardContent>
          </Card>

          <Card className="bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] border-white/10 hover:border-white/20 transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-white/70 flex items-center gap-2">
                <Crown className="w-5 h-5" />
                Admins
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white/85">3</div>
              <p className="text-xs text-white/60 mt-1">System admins</p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] border-white/10 hover:border-white/20 transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-white/70 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Global Member Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-white/70">Global user management interface would be implemented here with role assignments, user status controls, and cross-company permissions.</p>
          </CardContent>
        </Card>
      </main>
    </AdminLayout>
  );
};

export default AdminMembers;
