import { AdminLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings, Shield, Database, Mail, Key } from "lucide-react";

const AdminSettings = () => {
  return (
    <AdminLayout>
      <main className="relative px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-[66px] mt-20 sm:mt-20 lg:mt-24 xl:mt-28 mb-0 flex flex-col gap-6 text-white flex-1 overflow-y-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              System Settings
            </h1>
            <p className="text-white/60 text-sm">
              Global system configuration and security settings
            </p>
          </div>
          <Badge className="bg-white/10 text-white/85 border border-white/20 px-4 py-2">
            SYSTEM CONFIG
          </Badge>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] border-white/10 hover:border-white/20 transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-white/70 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-white/70">Two-Factor Auth</span>
                <span className="text-green-400 font-semibold">Enabled</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/70">Session Timeout</span>
                <span className="text-white font-semibold">24 hours</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/70">Password Policy</span>
                <span className="text-yellow-400 font-semibold">Strong</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] border-white/10 hover:border-white/20 transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-white/70 flex items-center gap-2">
                <Database className="w-5 h-5" />
                Database Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-white/70">Backup Frequency</span>
                <span className="text-white font-semibold">Daily</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/70">Retention Period</span>
                <span className="text-white font-semibold">90 days</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/70">Auto-scaling</span>
                <span className="text-green-400 font-semibold">Enabled</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] border-white/10 hover:border-white/20 transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-white/70 flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Email Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-white/70">SMTP Server</span>
                <span className="text-white font-semibold">Configured</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/70">Daily Limit</span>
                <span className="text-white font-semibold">10,000</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/70">Bounce Handling</span>
                <span className="text-green-400 font-semibold">Active</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] border-white/10 hover:border-white/20 transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-white/70 flex items-center gap-2">
                <Key className="w-5 h-5" />
                API Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-white/70">Rate Limiting</span>
                <span className="text-white font-semibold">1000 req/min</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/70">API Keys</span>
                <span className="text-white font-semibold">247 active</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/70">Webhook Events</span>
                <span className="text-green-400 font-semibold">Enabled</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </AdminLayout>
  );
};

export default AdminSettings;
