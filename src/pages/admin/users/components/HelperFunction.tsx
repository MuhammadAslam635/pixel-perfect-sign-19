type RoleLike = {
    _id: string;
    name: string;
};

type UserWithRoles = {
    role?: string | null;
    roleId?: string | RoleLike | null;
};

export const STANDARD_ROLES = [
    "Admin",
    "Company",
    "CompanyAdmin",
    "CompanyUser",
    "CompanyViewer",
];

type Statistics = {
    totalUsers: number;
    activeUsers: number;
    admins: number;
    companyAdmins: number;
    companyUsers: number;
    companyViewers: number;
};


export const extractRoleName = (
    user: UserWithRoles,
    options?: {
        standardRoles?: string[];
        availableRoles?: RoleLike[];
        returnCustomRole?: boolean; // 👈 NEW
    }
): string | null => {
    const {
        standardRoles = [],
        availableRoles = [],
        returnCustomRole = true,
    } = options || {};

    const legacyRole = user.role ?? undefined;

    const resolveRoleName = (roleName?: string): string | null => {
        if (!roleName) return null;

        if (standardRoles.includes(roleName)) {
            return roleName;
        }

        if (legacyRole && standardRoles.includes(legacyRole)) {
            return legacyRole;
        }

        return returnCustomRole ? roleName : null;
    };

    if (user.roleId && typeof user.roleId === "object" && "name" in user.roleId) {
        return resolveRoleName(user.roleId.name);
    }

    if (user.roleId && typeof user.roleId === "string") {
        const role = availableRoles.find((r) => r._id === user.roleId);
        if (role) {
            return resolveRoleName(role.name);
        }
    }

    return legacyRole ?? null;
};



export const calculateUserStatistics = (
    users: any[]
): Statistics => {
    let totalUsers = users.length;
    let activeUsers = users.filter((u) => u.status === "active").length;

    let admins = 0;
    let companyAdmins = 0;
    let companyUsers = 0;
    let companyViewers = 0;

    users.forEach((user) => {
        const roleName = extractRoleName(user, {
            standardRoles: STANDARD_ROLES,
            returnCustomRole: false, // 🔥 stats ke liye
        });

        switch (roleName) {
            case "Admin":
                admins++;
                break;

            case "Company":
            case "CompanyAdmin":
                companyAdmins++;
                break;

            case "CompanyUser":
                companyUsers++;
                break;

            case "CompanyViewer":
                companyViewers++;
                break;
        }
    });

    return {
        totalUsers,
        activeUsers,
        admins,
        companyAdmins,
        companyUsers,
        companyViewers,
    };
};
