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
import {
  Search,
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  Shield,
  Table,
  Network,
  Users,
} from "lucide-react";
import { rbacService } from "@/services/rbac.service";
import { Role, Module } from "@/types/rbac.types";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/usePermissions";
import OrgChart from "./OrgChart";

type ViewMode = "table" | "chart";

const RoleList = () => {
  const navigate = useNavigate();
  const { checkPermission, permissionsReady } = usePermissions();
  const [roles, setRoles] = useState<Role[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  // Check if user has permission
  const hasAccess = permissionsReady
    ? checkPermission("roles", ["view"])
    : null;

  useEffect(() => {
    if (!permissionsReady) {
      return;
    }

    if (hasAccess === false) {
      navigate("/dashboard", { replace: true });
      return;
    }
    fetchRoles();
    fetchModules();
  }, [hasAccess, navigate, permissionsReady]);

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

  const fetchModules = async () => {
    try {
      const response = await rbacService.getAllModules(false);
      if (response.success && response.data) {
        setModules(response.data);
      }
    } catch (error: any) {
      console.error("Error fetching modules:", error);
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

  if (!permissionsReady) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[60vh] items-center justify-center text-white/70">
          Checking permissions...
        </div>
      </DashboardLayout>
    );
  }

  if (hasAccess === false) {
    return null;
  }

  return (
    <DashboardLayout>
      <main className="relative px-4 sm:px-6 md:px-10 lg:px-14 xl:px-16 2xl:px-[96px] mt-20 lg:mt-24 xl:mt-28 mb-10 flex flex-col gap-8 text-white flex-1 overflow-y-auto">
        <section className="p-5 sm:p-8 lg:p-2 space-y-6 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
          <div className="flex items-center gap-3 mt-2">
            <div>
              <h1 className="text-3xl md:text-[36px] font-semibold tracking-tight">
                Roles & Permissions
              </h1>
              <p className="text-white/60 text-sm mt-2">
                Keep access aligned with your employee experience.
              </p>
            </div>
          </div>
          <div className="flex flex-col justify-end xl:flex-row xl:items-center gap-4 w-full xl:w-auto">
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60 z-20" />
              <Input
                placeholder="Search roles"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9 pl-10 pr-4 !rounded-full border-0 text-gray-300 placeholder:text-gray-500 text-xs w-full"
                style={{
                  background: "#FFFFFF1A",
                  boxShadow:
                    "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
                }}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
              {/* View Mode Toggle */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={() => setViewMode("table")}
                  size="sm"
                  className="relative h-9 px-4 rounded-full border-0 text-white text-xs hover:bg-[#2F2F2F]/60 transition-all flex-1 sm:flex-none flex items-center justify-center overflow-hidden"
                  style={{
                    background: viewMode === "table" ? "#FFFFFF1A" : "#FFFFFF0D",
                    boxShadow:
                      "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
                  }}
                >
                  {viewMode === "table" && (
                    <span
                      className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-[120px] h-[120px] rounded-full pointer-events-none opacity-60 blur-[26px]"
                      style={{
                        background:
                          "linear-gradient(180deg, #67B0B7 0%, #4066B3 100%)",
                      }}
                    />
                  )}
                  <Table className="h-4 w-4 mr-2 relative z-10" />
                  <span className="relative z-10">Table</span>
                </Button>
                <Button
                  type="button"
                  onClick={() => setViewMode("chart")}
                  size="sm"
                  className="relative h-9 px-4 rounded-full border-0 text-white text-xs hover:bg-[#2F2F2F]/60 transition-all flex-1 sm:flex-none flex items-center justify-center overflow-hidden"
                  style={{
                    background: viewMode === "chart" ? "#FFFFFF1A" : "#FFFFFF0D",
                    boxShadow:
                      "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
                  }}
                >
                  {viewMode === "chart" && (
                    <span
                      className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-[120px] h-[120px] rounded-full pointer-events-none opacity-60 blur-[26px]"
                      style={{
                        background:
                          "linear-gradient(180deg, #67B0B7 0%, #4066B3 100%)",
                      }}
                    />
                  )}
                  <Network className="h-4 w-4 mr-2 relative z-10" />
                  <span className="relative z-10">Chart</span>
                </Button>
              </div>
              <Button
                type="button"
                onClick={() => navigate("/users")}
                className="relative h-9 px-4 rounded-full border-0 text-white text-xs hover:bg-[#2F2F2F]/60 transition-all w-full sm:w-auto lg:flex-shrink-0 overflow-hidden"
                style={{
                  background: "#FFFFFF1A",
                  boxShadow:
                    "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
                }}
              >
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-[120px] h-[120px] rounded-full pointer-events-none opacity-60 blur-[26px]"
                  style={{
                    background:
                      "linear-gradient(180deg, #67B0B7 0%, #4066B3 100%)",
                  }}
                />
                <Users className="h-5 w-5 relative z-10" />
                <span className="hidden sm:block relative z-10">
                  Team
                </span>
                <span className="sm:hidden relative z-10">Team</span>
              </Button>
              <Button
                type="button"
                onClick={() => navigate("/roles/create")}
                className="relative h-9 px-4 rounded-full border-0 text-white text-xs hover:bg-[#2F2F2F]/60 transition-all w-full sm:w-auto lg:flex-shrink-0 overflow-hidden"
                style={{
                  background: "#FFFFFF1A",
                  boxShadow:
                    "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
                }}
              >
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-[120px] h-[120px] rounded-full pointer-events-none opacity-60 blur-[26px]"
                  style={{
                    background:
                      "linear-gradient(180deg, #67B0B7 0%, #4066B3 100%)",
                  }}
                />
                <Plus className="h-5 w-5 relative z-10" />
                <span className="hidden sm:block relative z-10">
                  Create Role
                </span>
                <span className="sm:hidden relative z-10">Create</span>
              </Button>
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.55)] overflow-hidden relative" style={{
          background: "linear-gradient(173.83deg, rgba(255, 255, 255, 0.08) 4.82%, rgba(255, 255, 255, 0) 38.08%, rgba(255, 255, 255, 0) 56.68%, rgba(255, 255, 255, 0.02) 95.1%)"
        }}>
          <div className="hidden lg:grid grid-cols-[1.5fr_1fr_1fr_1.4fr_0.6fr] items-center gap-4 p-6 pt-12 border-b border-white/10 text-white/75 text-sm font-medium relative z-10" style={{
            background: "linear-gradient(173.83deg, rgba(255, 255, 255, 0.08) 4.82%, rgba(255, 255, 255, 0) 38.08%, rgba(255, 255, 255, 0) 56.68%, rgba(255, 255, 255, 0.02) 95.1%)"
          }}>
            <span>Role</span>
            <span>Type</span>
            <span>Status</span>
            <span>Permissions</span>
            <span className="text-center">Actions</span>
          </div>

          <div className="min-h-[420px] relative z-10">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-10 h-10 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mb-4" />
                <p className="text-white/60 text-sm">Loading roles...</p>
              </div>
            ) : viewMode === "chart" ? (
              <div className="py-8">
                <OrgChart
                  roles={filteredRoles}
                  modules={modules}
                  onEdit={(roleId) => navigate(`/roles/${roleId}/edit`)}
                  onDelete={handleDelete}
                />
              </div>
            ) : filteredRoles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-5">
                  <Shield className="w-8 h-8 text-white/25" />
                </div>
                <p className="text-lg font-semibold text-white/80 mb-2">
                  {searchTerm ? "No roles found" : "No roles yet"}
                </p>
                <p className="text-sm text-white/60 max-w-lg">
                  {searchTerm
                    ? "Try a different search to locate the role you need."
                    : "Roles you configure will show up here so you can align permissions quickly."}
                </p>
              </div>
            ) : (
              <>
                <div className="hidden lg:block">
                  {filteredRoles.map((role, index) => (
                    <div
                      key={role._id}
                      className="grid grid-cols-[1.5fr_1fr_1fr_1.4fr_0.6fr] items-center gap-4 px-6 py-5 text-sm border-b border-white/5"
                    >
                      <div>
                        <div className="font-medium text-white">
                          {role.displayName}
                        </div>
                        <div className="text-white/50 text-xs">{role.name}</div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {role.type === "system" && (
                          <Badge className="bg-white/10 text-white/70 border border-white/20 rounded-full px-3 py-1 text-xs">
                            System
                          </Badge>
                        )}
                        {role.type === "default" && (
                          <Badge className="bg-white/10 text-white/70 border border-white/20 rounded-full px-3 py-1 text-xs">
                            Default
                          </Badge>
                        )}
                        {role.type === "custom" && (
                          <Badge className="bg-white/10 text-white/70 border border-white/20 rounded-full px-3 py-1 text-xs">
                            Custom
                          </Badge>
                        )}
                      </div>
                      <div>
                        {role.isActive ? (
                          <Badge className="bg-white/10 text-white/70 border border-white/20 rounded-full px-4 py-1 text-xs">
                            Active
                          </Badge>
                        ) : (
                          <Badge className="bg-white/10 text-white/70 border border-white/20 rounded-full px-4 py-1 text-xs">
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <div className="text-white/70">
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
                            className="bg-[rgba(30,30,30,0.95)] border border-white/10 text-white shadow-lg rounded-lg w-44 backdrop-blur"
                          >
                            <DropdownMenuItem
                              onClick={() =>
                                navigate(`/roles/${role._id}/edit`)
                              }
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

                <div className="lg:hidden space-y-4 p-4">
                  {filteredRoles.map((role) => (
                    <div
                      key={role._id}
                      className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4 shadow-[0_15px_35px_rgba(0,0,0,0.35)]"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-lg font-semibold truncate">
                            {role.displayName}
                          </p>
                          <p className="text-white/60 text-sm truncate">
                            {role.name}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="rounded-full border border-white/25 bg-white/5 text-white/80 p-2 hover:bg-white/10 transition">
                              <MoreVertical className="h-5 w-5" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="bg-[rgba(30,30,30,0.95)] border border-white/10 text-white shadow-lg rounded-lg w-44 backdrop-blur"
                          >
                            <DropdownMenuItem
                              onClick={() =>
                                navigate(`/roles/${role._id}/edit`)
                              }
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
                          <Badge className="bg-white/10 text-white/70 border border-white/20 rounded-full px-3 py-1 text-xs">
                            System
                          </Badge>
                        )}
                        {role.type === "default" && (
                          <Badge className="bg-white/10 text-white/70 border border-white/20 rounded-full px-3 py-1 text-xs">
                            Default
                          </Badge>
                        )}
                        {role.type === "custom" && (
                          <Badge className="bg-white/10 text-white/70 border border-white/20 rounded-full px-3 py-1 text-xs">
                            Custom
                          </Badge>
                        )}
                        {role.isActive ? (
                          <Badge className="bg-white/10 text-white/70 border border-white/20 rounded-full px-4 py-1 text-xs">
                            Active
                          </Badge>
                        ) : (
                          <Badge className="bg-white/10 text-white/70 border border-white/20 rounded-full px-4 py-1 text-xs">
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-white/60 border-t border-white/10 pt-3">
                        Permissions: {role.permissions.length} module
                        {role.permissions.length !== 1 ? "s" : ""}
                      </div>
                      {role.description && (
                        <p className="text-white/50 text-xs">
                          {role.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      </main>
    </DashboardLayout>
  );
};

export default RoleList;
