import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { rbacService } from "@/services/rbac.service";
import {
  Module,
  Role,
  PermissionAction,
  RolePermission,
} from "@/types/rbac.types";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/usePermissions";
import { ArrowLeft, Save, Shield, Search } from "lucide-react";

const AVAILABLE_ACTIONS: PermissionAction[] = [
  "view",
  "create",
  "edit",
  "delete",
];

interface ModulePermissionState {
  module: Module;
  selectedActions: PermissionAction[];
}

const RoleForm = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const { checkPermission } = usePermissions();

  const [loading, setLoading] = useState(false);
  const [modules, setModules] = useState<Module[]>([]);
  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [modulePermissions, setModulePermissions] = useState<
    ModulePermissionState[]
  >([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [rolePermissionData, setRolePermissionData] = useState<
    RolePermission[]
  >([]);

  const hasAccess = checkPermission("roles", ["view"]);

  // Filter modules based on search query
  const filteredModulePermissions = modulePermissions.filter((mp) => {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    return (
      mp.module.displayName?.toLowerCase().includes(query) ||
      mp.module.name?.toLowerCase().includes(query) ||
      (mp.module.description &&
        mp.module.description.toLowerCase().includes(query)) ||
      mp.module.route?.toLowerCase().includes(query)
    );
  });

  useEffect(() => {
    if (!hasAccess) {
      navigate("/dashboard", { replace: true });
      return;
    }

    const initialize = async () => {
      await fetchModules();
      if (isEditMode && id) {
        await fetchRole(id);
      }
    };

    initialize();
  }, [hasAccess, navigate, isEditMode, id]);

  const fetchModules = async () => {
    try {
      const response = await rbacService.getAllModules(false);
      if (response.success && response.data) {
        setModules(response.data);
      }
    } catch (error: any) {
      toast.error("Failed to fetch modules");
    }
  };

  const fetchRole = async (roleId: string) => {
    setLoading(true);
    try {
      const response = await rbacService.getRoleById(roleId);
      if (response.success && response.data) {
        const role = response.data;
        setName(role.name);
        setDisplayName(role.displayName);
        setDescription(role.description || "");
        setRolePermissionData(role.permissions || []);
      }
    } catch (error: any) {
      toast.error("Failed to fetch role details");
      navigate("/roles");
    } finally {
      useEffect(() => {
        if (modules.length === 0) return;

        setModulePermissions(
          modules.map((module) => {
            const rolePermission = rolePermissionData.find(
              (p) =>
                (typeof p.module === "string" ? p.module : p.module._id) ===
                module._id
            );
            return {
              module,
              selectedActions: rolePermission?.actions || [],
            };
          })
        );
      }, [modules, rolePermissionData]);

      setLoading(false);
    }
  };

  const toggleAction = (moduleId: string, action: PermissionAction) => {
    setModulePermissions((prev) =>
      prev.map((mp) => {
        if (mp.module._id === moduleId) {
          const hasAction = mp.selectedActions.includes(action);
          return {
            ...mp,
            selectedActions: hasAction
              ? mp.selectedActions.filter((a) => a !== action)
              : [...mp.selectedActions, action],
          };
        }
        return mp;
      })
    );
  };

  const toggleAllActions = (moduleId: string, checked: boolean) => {
    setModulePermissions((prev) =>
      prev.map((mp) => {
        if (mp.module._id === moduleId) {
          // Get available actions from module permissions
          const availableActions = mp.module.permissions
            ? mp.module.permissions.map((p) => p.action as PermissionAction)
            : [];
          return {
            ...mp,
            selectedActions: checked ? availableActions : [],
          };
        }
        return mp;
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!displayName.trim()) {
      toast.error("Display name is required");
      return;
    }

    if (!name.trim() && !isEditMode) {
      toast.error("Role name is required");
      return;
    }

    // Filter out modules with no permissions selected
    const permissions = modulePermissions
      .filter((mp) => mp.selectedActions.length > 0)
      .map((mp) => ({
        module: mp.module._id,
        actions: mp.selectedActions,
      }));

    if (permissions.length === 0) {
      toast.error("Please select at least one permission");
      return;
    }

    setLoading(true);
    try {
      if (isEditMode && id) {
        await rbacService.updateRole(id, {
          displayName,
          description,
          permissions,
        });
        toast.success("Role updated successfully");
      } else {
        await rbacService.createRole({
          name: name.trim(),
          displayName: displayName.trim(),
          description: description.trim(),
          permissions,
        });
        toast.success("Role created successfully");
      }
      navigate("/roles");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          `Failed to ${isEditMode ? "update" : "create"} role`
      );
    } finally {
      setLoading(false);
    }
  };

  if (!hasAccess) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen mt-20 w-full px-4 sm:px-6 py-4 sm:py-8 overflow-y-auto">
        <div className="max-w-[1100px] mx-auto space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/roles")}
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-white mb-1">
                {isEditMode ? "Edit Role" : "Create New Role"}
              </h1>
              <p className="text-white/60 text-xs sm:text-sm">
                {isEditMode
                  ? "Update role details and permissions"
                  : "Define a new role with specific permissions"}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info Card */}
            <Card className="rounded-2xl border border-white/10 bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] shadow-[0_20px_34px_rgba(0,0,0,0.38)] backdrop-blur">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="h-5 w-5 text-cyan-400" />
                  <h3 className="text-lg font-medium text-white">
                    Basic Information
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-white/90">
                      Role Name{" "}
                      {!isEditMode && <span className="text-red-400">*</span>}
                    </Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., SalesAgent"
                      disabled={isEditMode}
                      className="bg-black/35 border-white/10 text-white placeholder:text-white/40 disabled:opacity-50"
                    />
                    <p className="text-white/50 text-xs">
                      {isEditMode
                        ? "Role name cannot be changed"
                        : "Unique identifier (no spaces)"}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="displayName" className="text-white/90">
                      Display Name <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      id="displayName"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g., Sales Agent"
                      className="bg-black/35 border-white/10 text-white placeholder:text-white/40"
                    />
                    <p className="text-white/50 text-xs">
                      Display name shown in UI
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-white/90">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of this role's purpose..."
                    rows={3}
                    className="bg-black/35 border-white/10 text-white placeholder:text-white/40 resize-none"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Permissions Card */}
            <Card className="rounded-2xl border border-white/10 bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] shadow-[0_20px_34px_rgba(0,0,0,0.38)] backdrop-blur">
              <CardContent className="p-6">
                <h3 className="text-lg font-medium text-white mb-4">
                  Module Permissions
                </h3>
                <p className="text-white/60 text-sm mb-4">
                  Select which actions this role can perform on each module
                </p>

                {/* Search Input */}
                <div className="relative mb-6">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                  <Input
                    type="text"
                    placeholder="Search modules by name, route, or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-black/35 border-white/10 text-white placeholder:text-white/40"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white text-xs"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {filteredModulePermissions.length === 0 ? (
                  <div className="text-center py-8 text-white/60">
                    No modules found matching "{searchQuery}"
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredModulePermissions.map((mp) => {
                      // Get available actions from module permissions
                      const availableActions = mp.module.permissions
                        ? mp.module.permissions.map(
                            (p) => p.action as PermissionAction
                          )
                        : [];
                      const allSelected =
                        mp.selectedActions.length === availableActions.length &&
                        availableActions.length > 0 &&
                        availableActions.every((action) =>
                          mp.selectedActions.includes(action)
                        );
                      const someSelected = mp.selectedActions.length > 0;

                      return (
                        <div
                          key={mp.module._id}
                          className="bg-black/20 rounded-xl border border-white/10 p-4"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <Checkbox
                                  checked={allSelected}
                                  onCheckedChange={(checked) =>
                                    toggleAllActions(
                                      mp.module._id,
                                      checked as boolean
                                    )
                                  }
                                  className="border-white/30 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
                                />
                                <div>
                                  <h4 className="text-white font-medium">
                                    {mp.module.displayName}
                                  </h4>
                                  {mp.module.description && (
                                    <p className="text-white/50 text-sm">
                                      {mp.module.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                            {someSelected && (
                              <span className="text-cyan-400 text-xs font-medium">
                                {mp.selectedActions.length} selected
                              </span>
                            )}
                          </div>

                          <div className="pl-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {mp.module.permissions &&
                            mp.module.permissions.length > 0 ? (
                              mp.module.permissions.map((perm) => {
                                const action = perm.action as PermissionAction;
                                return (
                                  <div
                                    key={action}
                                    className="flex items-center gap-2"
                                  >
                                    <Checkbox
                                      checked={mp.selectedActions.includes(
                                        action
                                      )}
                                      onCheckedChange={() =>
                                        toggleAction(mp.module._id, action)
                                      }
                                      className="border-white/30 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
                                    />
                                    <Label className="text-white/70 text-sm capitalize cursor-pointer">
                                      {perm.displayName || action}
                                    </Label>
                                  </div>
                                );
                              })
                            ) : (
                              <p className="text-white/50 text-sm col-span-full">
                                No permissions available for this module
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/roles")}
                className="bg-white/5 border-white/10 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-cyan-500/60 to-[#1F4C55] text-white hover:from-[#30cfd0] hover:to-[#2a9cb3]"
                style={{
                  boxShadow:
                    "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
                }}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    {isEditMode ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {isEditMode ? "Update Role" : "Create Role"}
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default RoleForm;
