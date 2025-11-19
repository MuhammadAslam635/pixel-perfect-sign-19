import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Box, Check, X } from "lucide-react";
import { rbacService } from "@/services/rbac.service";
import { Module } from "@/types/rbac.types";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/usePermissions";

const ModuleList = () => {
  const navigate = useNavigate();
  const { isSysAdmin } = usePermissions();
  const [modules, setModules] = useState<Module[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  // Only system admins can view modules
  const hasAccess = isSysAdmin();

  useEffect(() => {
    if (!hasAccess) {
      navigate("/dashboard", { replace: true });
      return;
    }
    fetchModules();
  }, [hasAccess, navigate]);

  const fetchModules = async () => {
    setLoading(true);
    try {
      const response = await rbacService.getAllModules(true); // Include inactive
      if (response.success && response.data) {
        setModules(response.data);
      } else {
        setModules([]);
      }
    } catch (error: any) {
      console.error("Error fetching modules:", error);
      setModules([]);
      toast.error(error?.response?.data?.message || "Failed to fetch modules");
    } finally {
      setLoading(false);
    }
  };

  const filteredModules = modules.filter(
    (module) =>
      module.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      module.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!hasAccess) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen mt-20 w-full px-4 sm:px-6 py-4 sm:py-8 overflow-y-auto">
        <div className="max-w-[1100px] mx-auto space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-white mb-2">
                Modules
              </h1>
              <p className="text-white/60 text-xs sm:text-sm">
                View all available modules in the system
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="rounded-2xl border border-white/10 bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] p-4 sm:p-6 shadow-[0_20px_34px_rgba(0,0,0,0.38)] backdrop-blur">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/50" />
              <Input
                placeholder="Search modules..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full rounded-full bg-black/35 border border-white/10 text-white placeholder:text-white/50 focus:ring-2 focus:ring-cyan-400/40 text-sm sm:text-base"
              />
            </div>
          </div>

          {/* Table */}
          <div className="rounded-2xl border border-white/10 bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] shadow-[0_20px_34px_rgba(0,0,0,0.38)] backdrop-blur overflow-hidden">
            {/* Table Header - Hidden on mobile */}
            <div className="hidden lg:grid grid-cols-[1.5fr_1.5fr_1fr_1fr_1.5fr] items-center gap-4 px-4 sm:px-6 py-4 bg-black/20 border-b border-white/10">
              <div className="text-sm font-medium text-white/70">Module Name</div>
              <div className="text-sm font-medium text-white/70">Route</div>
              <div className="text-sm font-medium text-white/70">Status</div>
              <div className="text-sm font-medium text-white/70">Order</div>
              <div className="text-sm font-medium text-white/70">Available Actions</div>
            </div>

            {/* Table Body */}
            <div className="min-h-[400px]">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-8 h-8 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mb-3" />
                  <p className="text-white/60 text-sm">Loading modules...</p>
                </div>
              ) : filteredModules.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4">
                  <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                    <Box className="w-6 h-6 text-white/30" />
                  </div>
                  <p className="text-white/70 text-base font-medium mb-1">
                    {searchTerm ? "No modules found" : "No modules available"}
                  </p>
                  <p className="text-white/50 text-sm text-center max-w-md">
                    {searchTerm
                      ? "Try adjusting your search terms."
                      : "Run the seeder to create default modules."}
                  </p>
                </div>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden lg:block">
                    {filteredModules.map((module) => (
                      <div
                        key={module._id}
                        className="grid grid-cols-[1.5fr_1.5fr_1fr_1fr_1.5fr] items-center gap-4 px-4 sm:px-6 py-4 hover:bg-white/5 transition-colors border-b border-white/5 last:border-b-0"
                      >
                        <div>
                          <div className="font-medium text-white">
                            {module.displayName}
                          </div>
                          <div className="text-white/50 text-sm">{module.name}</div>
                        </div>
                        <div className="text-white/70 text-sm font-mono">
                          {module.route}
                        </div>
                        <div>
                          {module.isActive ? (
                            <div className="flex items-center gap-1 text-green-400">
                              <Check className="h-4 w-4" />
                              <span className="text-sm">Active</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-red-400">
                              <X className="h-4 w-4" />
                              <span className="text-sm">Inactive</span>
                            </div>
                          )}
                        </div>
                        <div className="text-white/60 text-sm">
                          {module.order}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {module.permissions.map((perm) => (
                            <Badge
                              key={perm.action}
                              className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-full px-2 py-0.5 text-xs capitalize"
                            >
                              {perm.action}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Mobile Card View */}
                  <div className="lg:hidden space-y-4 p-4">
                    {filteredModules.map((module) => (
                      <div
                        key={module._id}
                        className="bg-black/20 rounded-xl border border-white/10 p-4 space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-white mb-1">
                              {module.displayName}
                            </h3>
                            <p className="text-white/50 text-sm">{module.name}</p>
                            <p className="text-white/60 text-xs font-mono mt-1">
                              {module.route}
                            </p>
                          </div>
                          <div>
                            {module.isActive ? (
                              <div className="flex items-center gap-1 text-green-400">
                                <Check className="h-4 w-4" />
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-red-400">
                                <X className="h-4 w-4" />
                              </div>
                            )}
                          </div>
                        </div>

                        {module.description && (
                          <p className="text-white/60 text-sm">
                            {module.description}
                          </p>
                        )}

                        <div className="pt-2 border-t border-white/10">
                          <p className="text-white/50 text-xs mb-2">Available Actions:</p>
                          <div className="flex flex-wrap gap-1">
                            {module.permissions.map((perm) => (
                              <Badge
                                key={perm.action}
                                className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-full px-2 py-0.5 text-xs capitalize"
                              >
                                {perm.action}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="text-white/50 text-xs pt-2 border-t border-white/10">
                          Order: {module.order}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ModuleList;
