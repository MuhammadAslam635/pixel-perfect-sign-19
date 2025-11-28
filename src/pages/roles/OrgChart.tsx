import React, { useState, useEffect } from "react";
import { Role, PermissionAction, Module } from "@/types/rbac.types";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ChevronRight,
  Shield,
  Eye,
  Plus,
  Edit,
  Trash2,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface OrgChartProps {
  roles: Role[];
  modules: Module[];
  onEdit: (roleId: string) => void;
  onDelete: (roleId: string, roleName: string) => void;
}

interface TreeNodeProps {
  role: Role;
  modules: Module[];
  onEdit: (roleId: string) => void;
  onDelete: (roleId: string, roleName: string) => void;
  isFocused: boolean;
  onFocus: (roleId: string | null) => void;
  hasFocusedRole: boolean;
}

interface ModuleNodeProps {
  module: Module;
  actions: PermissionAction[];
  onEdit: (roleId: string) => void;
  onDelete: (roleId: string, roleName: string) => void;
  roleId: string;
  roleName: string;
}

const getActionIcon = (action: PermissionAction) => {
  switch (action) {
    case "view":
      return <Eye className="h-3 w-3" />;
    case "create":
      return <Plus className="h-3 w-3" />;
    case "edit":
      return <Edit className="h-3 w-3" />;
    case "delete":
      return <Trash2 className="h-3 w-3" />;
    default:
      return null;
  }
};

const getActionColor = (action: PermissionAction) => {
  switch (action) {
    case "view":
      return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    case "create":
      return "bg-green-500/20 text-green-400 border-green-500/30";
    case "edit":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    case "delete":
      return "bg-red-500/20 text-red-400 border-red-500/30";
    default:
      return "bg-gray-500/20 text-gray-400 border-gray-500/30";
  }
};

const ModuleNode: React.FC<ModuleNodeProps> = ({
  module,
  actions,
  onEdit,
  onDelete,
  roleId,
  roleName,
}) => {
  return (
    <div className="flex flex-col items-center">
      <div className="bg-white/5 border border-white/10 rounded-lg p-3 sm:p-4 min-w-[180px] sm:min-w-[200px] shadow-lg backdrop-blur">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-cyan-400" />
            <h4 className="text-white font-medium text-sm">
              {module.displayName}
            </h4>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition">
                <ChevronDown className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="bg-[rgba(30,30,30,0.95)] border border-white/10 text-white shadow-lg rounded-lg w-36 backdrop-blur"
            >
              <DropdownMenuItem
                onClick={() => onEdit(roleId)}
                className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-white/10"
              >
                <Edit size={14} /> Edit Role
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(roleId, roleName)}
                className="flex items-center gap-2 px-3 py-2 hover:bg-red-600/30 text-red-400 cursor-pointer"
              >
                <Trash2 size={14} /> Delete Role
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {module.description && (
          <p className="text-white/60 text-xs mb-3 line-clamp-2">
            {module.description}
          </p>
        )}
        <div className="flex flex-wrap gap-1 sm:gap-1">
          {actions.map((action) => (
            <Badge
              key={action}
              className={`text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 ${getActionColor(
                action
              )}`}
            >
              <div className="flex items-center gap-1">
                {getActionIcon(action)}
                <span className="capitalize text-xs">{action}</span>
              </div>
            </Badge>
          ))}
        </div>
      </div>
      {/* Connection line to actions */}
      {actions.length > 0 && (
        <div className="w-px h-4 bg-gradient-to-b from-white/20 to-transparent mt-2" />
      )}
    </div>
  );
};

const TreeNode: React.FC<TreeNodeProps> = ({
  role,
  modules,
  onEdit,
  onDelete,
  isFocused,
  onFocus,
  hasFocusedRole,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Auto-expand when focused
  useEffect(() => {
    if (isFocused) {
      setIsExpanded(true);
    }
  }, [isFocused]);

  const getRoleColor = () => {
    if (!role.isActive) return "border-red-500/30 bg-red-500/10";
    switch (role.type) {
      case "system":
        return "border-blue-500/30 bg-blue-500/10";
      case "default":
        return "border-purple-500/30 bg-purple-500/10";
      case "custom":
        return "border-cyan-500/30 bg-cyan-500/10";
      default:
        return "border-white/20 bg-white/5";
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering background click
    if (!isFocused) {
      setIsExpanded(!isExpanded);
    }
    onFocus(isFocused ? null : role._id);
  };

  return (
    <div className="flex flex-col items-center transition-all duration-300">
      {/* Role Node */}
      <div
        className={`rounded-xl border-2 p-4 sm:p-6 min-w-[250px] sm:min-w-[280px] shadow-2xl backdrop-blur cursor-pointer transition-all hover:scale-105 relative ${getRoleColor()}`}
        onClick={handleClick}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-cyan-400" />
            <div>
              <h3 className="text-white font-semibold text-lg">
                {role.displayName}
              </h3>
              <p className="text-white/60 text-sm">{role.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              className={`text-xs ${
                role.isActive
                  ? "bg-green-500/20 text-green-400 border-green-500/30"
                  : "bg-red-500/20 text-red-400 border-red-500/30"
              }`}
            >
              {role.isActive ? "Active" : "Inactive"}
            </Badge>
            {isExpanded ? (
              <ChevronDown className="h-5 w-5 text-white/60" />
            ) : (
              <ChevronRight className="h-5 w-5 text-white/60" />
            )}
            {isFocused && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onFocus(null);
                }}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition border border-white/20"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <Badge
            className={`text-xs ${
              role.type === "system"
                ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                : role.type === "default"
                ? "bg-purple-500/20 text-purple-400 border-purple-500/30"
                : "bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
            }`}
          >
            {role.type === "system"
              ? "System"
              : role.type === "default"
              ? "Default"
              : "Custom"}
          </Badge>
          <span className="text-white/60 text-sm">
            {role.permissions.length} module
            {role.permissions.length !== 1 ? "s" : ""}
          </span>
        </div>

        {role.description && (
          <p className="text-white/70 text-sm line-clamp-2">
            {role.description}
          </p>
        )}
      </div>

      {/* Connection line */}
      {isExpanded && role.permissions.length > 0 && (
        <div className="w-px h-8 bg-gradient-to-b from-cyan-400/50 to-transparent mt-4" />
      )}

      {/* Modules */}
      {isExpanded && (
        <div className="flex flex-wrap justify-center gap-4 sm:gap-6 lg:gap-8 mt-6 sm:mt-8">
          {role.permissions.map((permission, index) => {
            const module = modules.find(
              (m) =>
                m._id ===
                (typeof permission.module === "string"
                  ? permission.module
                  : permission.module._id)
            );

            if (!module) return null;

            return (
              <div key={module._id} className="flex flex-col items-center">
                {/* Horizontal connection line for multiple modules */}
                {index > 0 && (
                  <div className="absolute h-px bg-gradient-to-r from-transparent via-white/20 to-transparent w-full -translate-y-4" />
                )}
                <ModuleNode
                  module={module}
                  actions={permission.actions}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  roleId={role._id}
                  roleName={role.displayName}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const OrgChart: React.FC<OrgChartProps> = ({
  roles,
  modules,
  onEdit,
  onDelete,
}) => {
  const [focusedRoleId, setFocusedRoleId] = useState<string | null>(null);

  const handleFocus = (roleId: string | null) => {
    setFocusedRoleId(roleId);
  };

  return (
    <div className="w-full">
      {/* Background overlay when focused */}
      {focusedRoleId && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-10"
          onClick={() => setFocusedRoleId(null)}
        />
      )}

      {focusedRoleId ? (
        /* Focused layout - centered and contained */
        <div className="fixed inset-0 z-30 flex items-center justify-center p-6">
          <div className="max-h-full overflow-y-auto w-full max-w-7xl p-4">
            {roles
              .filter((role) => role._id === focusedRoleId)
              .map((role) => (
                <TreeNode
                  key={role._id}
                  role={role}
                  modules={modules}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  isFocused={true}
                  onFocus={handleFocus}
                  hasFocusedRole={true}
                />
              ))}
          </div>
        </div>
      ) : (
        /* Normal grid layout */
        <div className="grid gap-12 md:gap-16 lg:gap-20 place-items-center transition-all duration-300">
          {roles.map((role) => (
            <TreeNode
              key={role._id}
              role={role}
              modules={modules}
              onEdit={onEdit}
              onDelete={onDelete}
              isFocused={false}
              onFocus={handleFocus}
              hasFocusedRole={false}
            />
          ))}
        </div>
      )}

      {roles.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-5">
            <Shield className="w-8 h-8 text-white/25" />
          </div>
          <p className="text-lg font-semibold text-white/80 mb-2">
            No roles yet
          </p>
          <p className="text-sm text-white/60 max-w-lg">
            Roles you configure will show up here so you can visualize
            permissions in an organizational chart.
          </p>
        </div>
      )}
    </div>
  );
};

export default OrgChart;
