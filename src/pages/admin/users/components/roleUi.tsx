type RoleLike = {
    _id: string;
    name: string;
    displayName?: string;
};

type UserWithRole = {
    role?: string | null;
    roleId?: string | RoleLike | null;
};

export const getUserRoleDisplayName = (
    user: UserWithRole,
    availableRoles: RoleLike[] = []
): string => {
    if (user.roleId && typeof user.roleId === "object") {
        return user.roleId.displayName || user.roleId.name;
    }

    if (user.roleId && typeof user.roleId === "string") {
        const role = availableRoles.find((r) => r._id === user.roleId);
        if (role) {
            return role.displayName || role.name;
        }
    }

    switch (user.role) {
        case "Company":
            return "Company Owner";
        case "CompanyAdmin":
            return "Company Admin";
        case "CompanyUser":
            return "Company User";
        case "CompanyViewer":
            return "Company Viewer";
        case "Admin":
            return "System Admin";
        default:
            return user.role || "No Role";
    }
};

export const getUserRoleBadgeClass = (role?: string | null): string => {
    switch (role) {
        case "Admin":
            return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
        case "Company":
            return "bg-green-500/20 text-green-300 border-green-500/30";
        case "CompanyAdmin":
            return "bg-cyan-500/20 text-cyan-300 border-cyan-500/30";
        case "CompanyUser":
            return "bg-blue-500/20 text-blue-300 border-blue-500/30";
        case "CompanyViewer":
            return "bg-purple-500/20 text-purple-300 border-purple-500/30";
        default:
            return "bg-white/10 text-white/70 border-white/20";
    }
};
