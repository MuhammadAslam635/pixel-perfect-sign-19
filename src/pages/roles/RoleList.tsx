import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Plus, MoreVertical, Pencil, Trash2, Shield } from "lucide-react";
import { rbacService } from "@/services/rbac.service";
import { Role } from "@/types/rbac.types";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/usePermissions";

const RoleList = () => {
  const navigate = useNavigate();
  const { isCompAdmin, isSysAdmin } = usePermissions();
  const [roles, setRoles] = useState<Role[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  // Check if user has permission
  const hasAccess = isCompAdmin() || isSysAdmin();

  useEffect(() => {
    if (!hasAccess) {
      navigate("/dashboard", { replace: true });
      return;
    }
    fetchRoles();
  }, [hasAccess, navigate]);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const response = await rbacService.getAllRoles();
      if (response.success && response.data) {
        setRoles(response.data);
      } else {
        setRoles([]);
      }
    } catch (error: any) {
      console.error("Error fetching roles:", error);
      setRoles([]);
      toast.error(error?.response?.data?.message || "Failed to fetch roles");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (roleId: string, roleName: string) => {
    if (
      !window.confirm(
        `Are you sure you want to delete role '${roleName}'? This action cannot be undone!`
      )
    ) {
      return;
    }

    try {
      await rbacService.deleteRole(roleId);
      toast.success("Role deleted successfully");
      fetchRoles();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to delete role");
    }
  };

  const filteredRoles = roles.filter(
    (role) =>
      role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.displayName.toLowerCase().includes(searchTerm.toLowerCase())
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
                Roles & Permissions
              </h1>
              <p className="text-white/60 text-xs sm:text-sm">
                Manage roles and their permissions
              </p>
            </div>
            <Button
              className="w-full sm:w-auto bg-gradient-to-r from-cyan-500/60 to-[#1F4C55] text-white hover:from-[#30cfd0] hover:to-[#2a9cb3]"
              style={{
                boxShadow:
                  "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
              }}
              onClick={() => navigate("/roles/create")}
            >
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Create Role</span>
              <span className="sm:hidden">Create</span>
            </Button>
          </div>

          {/* Search */}
          <div className="rounded-2xl border border-white/10 bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] p-4 sm:p-6 shadow-[0_20px_34px_rgba(0,0,0,0.38)] backdrop-blur">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/50" />
              <Input
                placeholder="Search roles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full rounded-full bg-black/35 border border-white/10 text-white placeholder:text-white/50 focus:ring-2 focus:ring-cyan-400/40 text-sm sm:text-base"
              />
            </div>
          </div>

          {/* Table */}
          <div className="rounded-2xl border border-white/10 bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] shadow-[0_20px_34px_rgba(0,0,0,0.38)] backdrop-blur overflow-hidden">
            {/* Table Header - Hidden on mobile */}
            <div className="hidden lg:grid grid-cols-[1.5fr_1fr_1fr_1.5fr_80px] items-center gap-4 px-4 sm:px-6 py-4 bg-black/20 border-b border-white/10">
              <div className="text-sm font-medium text-white/70">Role Name</div>
              <div className="text-sm font-medium text-white/70">Type</div>
              <div className="text-sm font-medium text-white/70">Status</div>
              <div className="text-sm font-medium text-white/70">Permissions</div>
              <div className="text-sm font-medium text-white/70 text-center">
                Actions
              </div>
            </div>

            {/* Table Body */}
            <div className="min-h-[400px]">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-8 h-8 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mb-3" />
                  <p className="text-white/60 text-sm">Loading roles...</p>
                </div>
              ) : filteredRoles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4">
                  <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                    <Shield className="w-6 h-6 text-white/30" />
                  </div>
                  <p className="text-white/70 text-base font-medium mb-1">
                    {searchTerm ? "No roles found" : "No roles available"}
                  </p>
                  <p className="text-white/50 text-sm text-center max-w-md">
                    {searchTerm
                      ? "Try adjusting your search terms."
                      : "Create your first role to get started."}
                  </p>
                </div>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden lg:block">
                    {filteredRoles.map((role) => (
                      <div
                        key={role._id}
                        className="grid grid-cols-[1.5fr_1fr_1fr_1.5fr_80px] items-center gap-4 px-4 sm:px-6 py-4 hover:bg-white/5 transition-colors border-b border-white/5 last:border-b-0"
                      >
                        <div>
                          <div className="font-medium text-white">
                            {role.displayName}
                          </div>
                          <div className="text-white/50 text-sm">{role.name}</div>
                        </div>
                        <div>
                          {role.type === "system" && (
                            <Badge className="bg-blue-600/20 text-blue-400 border border-blue-600/30 rounded-full px-3 py-1 text-xs">
                              System
                            </Badge>
                          )}
                          {role.type === "default" && (
                            <Badge className="bg-purple-600/20 text-purple-400 border border-purple-600/30 rounded-full px-3 py-1 text-xs">
                              Default
                            </Badge>
                          )}
                          {role.type === "custom" && (
                            <Badge className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-full px-3 py-1 text-xs">
                              Custom
                            </Badge>
                          )}
                        </div>
                        <div>
                          {role.isActive ? (
                            <Badge className="bg-green-600/20 text-green-400 border border-green-600/30 rounded-full px-3 py-1 text-xs">
                              Active
                            </Badge>
                          ) : (
                            <Badge className="bg-red-600/20 text-red-400 border border-red-600/30 rounded-full px-3 py-1 text-xs">
                              Inactive
                            </Badge>
                          )}
                        </div>
                        <div className="text-white/60 text-sm">
                          {role.permissions.length} module
                          {role.permissions.length !== 1 ? "s" : ""}
                        </div>
                        <div className="flex justify-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition">
                                <MoreVertical className="h-5 w-5" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="bg-[rgba(30,30,30,0.95)] border border-white/10 text-white shadow-lg rounded-lg w-40 backdrop-blur"
                            >
                              <DropdownMenuItem
                                onClick={() => navigate(`/roles/${role._id}/edit`)}
                                className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-white/10"
                              >
                                <Pencil size={16} /> Edit
                              </DropdownMenuItem>
                              {!role.isSystemRole && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleDelete(role._id, role.displayName)
                                  }
                                  className="flex items-center gap-2 px-3 py-2 hover:bg-red-600/30 text-red-400 cursor-pointer"
                                >
                                  <Trash2 size={16} /> Delete
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Mobile Card View */}
                  <div className="lg:hidden space-y-4 p-4">
                    {filteredRoles.map((role) => (
                      <div
                        key={role._id}
                        className="bg-black/20 rounded-xl border border-white/10 p-4 space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-white mb-1">
                              {role.displayName}
                            </h3>
                            <p className="text-white/50 text-sm">{role.name}</p>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition flex-shrink-0">
                                <MoreVertical className="h-5 w-5" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="bg-[rgba(30,30,30,0.95)] border border-white/10 text-white shadow-lg rounded-lg w-40 backdrop-blur"
                            >
                              <DropdownMenuItem
                                onClick={() => navigate(`/roles/${role._id}/edit`)}
                                className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-white/10"
                              >
                                <Pencil size={16} /> Edit
                              </DropdownMenuItem>
                              {!role.isSystemRole && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleDelete(role._id, role.displayName)
                                  }
                                  className="flex items-center gap-2 px-3 py-2 hover:bg-red-600/30 text-red-400 cursor-pointer"
                                >
                                  <Trash2 size={16} /> Delete
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {role.type === "system" && (
                            <Badge className="bg-blue-600/20 text-blue-400 border border-blue-600/30 rounded-full px-3 py-1 text-xs">
                              System
                            </Badge>
                          )}
                          {role.type === "default" && (
                            <Badge className="bg-purple-600/20 text-purple-400 border border-purple-600/30 rounded-full px-3 py-1 text-xs">
                              Default
                            </Badge>
                          )}
                          {role.type === "custom" && (
                            <Badge className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-full px-3 py-1 text-xs">
                              Custom
                            </Badge>
                          )}
                          {role.isActive ? (
                            <Badge className="bg-green-600/20 text-green-400 border border-green-600/30 rounded-full px-3 py-1 text-xs">
                              Active
                            </Badge>
                          ) : (
                            <Badge className="bg-red-600/20 text-red-400 border border-red-600/30 rounded-full px-3 py-1 text-xs">
                              Inactive
                            </Badge>
                          )}
                        </div>
                        <div className="text-white/60 text-xs pt-2 border-t border-white/10">
                          Permissions: {role.permissions.length} module
                          {role.permissions.length !== 1 ? "s" : ""}
                        </div>
                        {role.description && (
                          <div className="text-white/50 text-xs">
                            {role.description}
                          </div>
                        )}
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

export default RoleList;
