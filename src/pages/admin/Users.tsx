import { useEffect, useState, useMemo, useCallback } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { AdminLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  UserCheck,
  Shield,
  Crown,
  Search,
  Building2,
  CheckCircle2,
  XCircle,
  X,
  UserCog,
} from "lucide-react";
import { adminService, CompanyAdmin, Company } from "@/services/admin.service";
import { rbacService } from "@/services/rbac.service";
import { Role } from "@/types/rbac.types";
import { toast } from "sonner";

interface UserWithCompany extends CompanyAdmin {
  companyName?: string;
  companyId?: string;
  roleId?: Role | string;
}

const AdminUsers = () => {
  const authState = useSelector((state: RootState) => state.auth);

  // Get user's role name
  const getUserRoleName = (): string | null => {
    const user = authState.user;
    if (!user) return null;

    if (user.roleId && typeof user.roleId === "object") {
      return (user.roleId as any).name;
    }

    if (user.role && typeof user.role === "string") {
      return user.role;
    }

    return null;
  };

  const userRoleName = getUserRoleName();

  const [allUsers, setAllUsers] = useState<UserWithCompany[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [statisticsLoading, setStatisticsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeRoleTab, setActiveRoleTab] = useState<string>("all");

  const [statistics, setStatistics] = useState({
    totalUsers: 0,
    activeUsers: 0,
    admins: 0,
    companyAdmins: 0,
    companyUsers: 0,
    companyViewers: 0,
  });

  // Check if user is Admin
  useEffect(() => {
    if (userRoleName !== "Admin") {
      toast.error("Access denied. Admin access required.");
    }
  }, [userRoleName]);

  // Fetch companies for company name lookup
  const fetchCompanies = useCallback(async () => {
    try {
      const response = await adminService.getCompanies({
        page: 1,
        limit: 1000,
        trashed: false,
      });
      if (response.success && response.data) {
        setCompanies(response.data.companies);
      }
    } catch (error: any) {
      console.error("Error fetching companies:", error);
    }
  }, []);

  // Fetch roles
  const fetchRoles = useCallback(async () => {
    try {
      const response = await rbacService.getAllRoles();
      if (response.success && response.data) {
        setAvailableRoles(response.data);
      }
    } catch (error: any) {
      console.error("Error fetching roles:", error);
    }
  }, []);

  // Fetch all users globally
  const fetchAllUsers = useCallback(async () => {
    if (userRoleName !== "Admin") return;

    setLoading(true);
    try {
      // Fetch all companies first, then their users
      const companiesResponse = await adminService.getCompanies({
        page: 1,
        limit: 1000,
        trashed: false,
      });

      if (companiesResponse.success && companiesResponse.data) {
        const usersList: UserWithCompany[] = [];
        const companiesList = companiesResponse.data.companies;

        // Fetch users from each company
        for (const company of companiesList) {
          try {
            const usersResponse = await adminService.getCompanyUsers(
              company._id,
              {
                page: 1,
                limit: 1000,
                search: "",
                trashed: false,
              }
            );

            if (usersResponse.success && usersResponse.data) {
              const companyUsers = usersResponse.data.users.map((user) => ({
                ...user,
                companyName: company.name || company.email?.split("@")[0],
                companyId: company._id,
              }));

              usersList.push(...companyUsers);
            }
          } catch (error) {
            console.error(
              `Error fetching users for company ${company._id}:`,
              error
            );
          }
        }

        setAllUsers(usersList);
      }
    } catch (error: any) {
      console.error("Error fetching users:", error);
      toast.error(error?.response?.data?.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  }, [userRoleName]);

  // Calculate statistics
  const calculateStatistics = useCallback(async () => {
    if (userRoleName !== "Admin") return;

    setStatisticsLoading(true);
    try {
      const companiesResponse = await adminService.getCompanies({
        page: 1,
        limit: 1000,
        trashed: false,
      });

      if (companiesResponse.success && companiesResponse.data) {
        let totalUsers = 0;
        let activeUsers = 0;
        let admins = 0;
        let companyAdmins = 0;
        let companyUsers = 0;
        let companyViewers = 0;

        for (const company of companiesResponse.data.companies) {
          try {
            const usersResponse = await adminService.getCompanyUsers(
              company._id,
              {
                page: 1,
                limit: 1000,
                trashed: false,
              }
            );

            if (usersResponse.success && usersResponse.data) {
              const companyUsersList = usersResponse.data.users;
              totalUsers += companyUsersList.length;
              activeUsers += companyUsersList.filter(
                (u) => u.status === "active"
              ).length;
              admins += companyUsersList.filter(
                (u) => u.role === "Admin"
              ).length;
              companyAdmins += companyUsersList.filter(
                (u) => u.role === "CompanyAdmin"
              ).length;
              companyUsers += companyUsersList.filter(
                (u) => u.role === "CompanyUser"
              ).length;
              companyViewers += companyUsersList.filter(
                (u) => u.role === "CompanyViewer"
              ).length;
            }
          } catch (error) {
            console.error(
              `Error fetching stats for company ${company._id}:`,
              error
            );
          }
        }

        setStatistics({
          totalUsers,
          activeUsers,
          admins,
          companyAdmins,
          companyUsers,
          companyViewers,
        });
      }
    } catch (error: any) {
      console.error("Error calculating statistics:", error);
    } finally {
      setStatisticsLoading(false);
    }
  }, [userRoleName]);

  useEffect(() => {
    fetchCompanies();
    fetchRoles();
    fetchAllUsers();
    calculateStatistics();
  }, [fetchCompanies, fetchRoles, fetchAllUsers, calculateStatistics]);

  const handleStatusToggle = async (
    companyId: string,
    userId: string,
    currentStatus: string
  ) => {
    if (userRoleName !== "Admin") return;

    const newStatus = currentStatus === "active" ? "inactive" : "active";

    try {
      const user = allUsers.find((u) => u._id === userId);
      if (!user) {
        toast.error("User not found");
        return;
      }

      await adminService.updateCompanyUserStatus(companyId, userId, {
        name:
          user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim(),
        email: user.email,
        role: user.role,
        status: newStatus,
      });

      toast.success(
        `User status updated to ${
          newStatus === "active" ? "Active" : "Inactive"
        }`
      );

      // Refresh data
      fetchAllUsers();
      calculateStatistics();
    } catch (error: any) {
      console.error("Error updating status:", error);
      toast.error(error?.response?.data?.message || "Failed to update status");
    }
  };

  const getRoleDisplayName = (user: UserWithCompany): string => {
    // Check if roleId is populated
    if (user.roleId && typeof user.roleId === "object") {
      return (user.roleId as Role).displayName || (user.roleId as Role).name;
    }

    // Check if roleId is a string and find in availableRoles
    if (user.roleId && typeof user.roleId === "string") {
      const role = availableRoles.find((r) => r._id === user.roleId);
      if (role) {
        return role.displayName || role.name;
      }
    }

    // Fallback to legacy role
    if (user.role === "CompanyAdmin") return "Company Admin";
    if (user.role === "CompanyUser") return "Company User";
    if (user.role === "CompanyViewer") return "Company Viewer";
    if (user.role === "Admin") return "System Admin";
    return user.role || "No Role";
  };

  const getRoleBadgeColor = (role: string): string => {
    if (role === "Admin")
      return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
    if (role === "CompanyAdmin")
      return "bg-cyan-500/20 text-cyan-300 border-cyan-500/30";
    if (role === "CompanyUser")
      return "bg-blue-500/20 text-blue-300 border-blue-500/30";
    if (role === "CompanyViewer")
      return "bg-purple-500/20 text-purple-300 border-purple-500/30";
    return "bg-white/10 text-white/70 border-white/20";
  };

  // Group users by role
  const groupedUsersByRole = useMemo(() => {
    const groups: Record<string, UserWithCompany[]> = {};

    allUsers.forEach((user) => {
      const roleName = user.role || "No Role";
      if (!groups[roleName]) {
        groups[roleName] = [];
      }
      groups[roleName].push(user);
    });

    return groups;
  }, [allUsers]);

  // Filter users based on search and status
  const filteredUsers = useMemo(() => {
    const roleToShow = activeRoleTab === "all" ? null : activeRoleTab;
    let users = roleToShow ? groupedUsersByRole[roleToShow] || [] : allUsers;

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      users = users.filter(
        (user) =>
          user.email.toLowerCase().includes(searchLower) ||
          user.name?.toLowerCase().includes(searchLower) ||
          `${user.firstName || ""} ${user.lastName || ""}`
            .toLowerCase()
            .includes(searchLower) ||
          user.companyName?.toLowerCase().includes(searchLower)
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      users = users.filter((user) => user.status === statusFilter);
    }

    return users;
  }, [allUsers, groupedUsersByRole, activeRoleTab, searchTerm, statusFilter]);

  // Get role tabs
  const roleTabs = useMemo(() => {
    const tabs = [
      { value: "all", label: "All Users", count: allUsers.length },
      { value: "Admin", label: "System Admins", count: statistics.admins },
      {
        value: "CompanyAdmin",
        label: "Company Admins",
        count: statistics.companyAdmins,
      },
      {
        value: "CompanyUser",
        label: "Company Users",
        count: statistics.companyUsers,
      },
      {
        value: "CompanyViewer",
        label: "Company Viewers",
        count: statistics.companyViewers,
      },
    ];

    // Add custom roles from RBAC
    availableRoles.forEach((role) => {
      if (
        !["Admin", "CompanyAdmin", "CompanyUser", "CompanyViewer"].includes(
          role.name
        )
      ) {
        const count = allUsers.filter(
          (u) =>
            (u.roleId &&
              typeof u.roleId === "object" &&
              (u.roleId as Role)._id === role._id) ||
            u.roleId === role._id
        ).length;
        if (count > 0) {
          tabs.push({
            value: role.name,
            label: role.displayName || role.name,
            count,
          });
        }
      }
    });

    return tabs;
  }, [allUsers, statistics, availableRoles]);

  if (userRoleName !== "Admin") {
    return (
      <AdminLayout>
        <main className="relative px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-[66px] mt-20 sm:mt-20 lg:mt-24 xl:mt-28 mb-0 flex flex-col gap-6 text-white flex-1 overflow-y-auto">
          <div className="flex flex-col items-center justify-center py-16">
            <XCircle className="w-16 h-16 text-red-400 mb-4" />
            <p className="text-white/70 text-lg font-medium mb-2">
              Access Denied
            </p>
            <p className="text-white/50 text-sm">
              Admin access required to view this page.
            </p>
          </div>
        </main>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <main className="relative px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-[66px] mt-20 sm:mt-20 lg:mt-24 xl:mt-28 mb-0 flex flex-col gap-6 text-white flex-1 overflow-y-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white my-2">
              User Management
            </h1>
            <p className="text-white/60">
              Manage users across all companies by roles and permissions
            </p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <Card className="bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] border-white/10 hover:border-white/20 transition-all duration-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-white/70 flex items-center gap-2 text-sm">
                <Users className="w-4 h-4" />
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl sm:text-3xl font-bold text-white">
                {statisticsLoading ? (
                  <div className="animate-pulse">...</div>
                ) : (
                  statistics.totalUsers.toLocaleString()
                )}
              </div>
              <p className="text-xs text-white/60 mt-1">All registered</p>
            </CardContent>
          </Card>

          <Card className="bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] border-white/10 hover:border-white/20 transition-all duration-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-white/70 flex items-center gap-2 text-sm">
                <UserCheck className="w-4 h-4" />
                Active Users
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl sm:text-3xl font-bold text-green-400">
                {statisticsLoading ? (
                  <div className="animate-pulse">...</div>
                ) : (
                  statistics.activeUsers.toLocaleString()
                )}
              </div>
              <p className="text-xs text-white/60 mt-1">
                {statistics.totalUsers > 0
                  ? `${Math.round(
                      (statistics.activeUsers / statistics.totalUsers) * 100
                    )}% active`
                  : "No users"}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] border-white/10 hover:border-white/20 transition-all duration-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-white/70 flex items-center gap-2 text-sm">
                <Crown className="w-4 h-4" />
                System Admins
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl sm:text-3xl font-bold text-yellow-400">
                {statisticsLoading ? (
                  <div className="animate-pulse">...</div>
                ) : (
                  statistics.admins.toLocaleString()
                )}
              </div>
              <p className="text-xs text-white/60 mt-1">Global access</p>
            </CardContent>
          </Card>

          <Card className="bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] border-white/10 hover:border-white/20 transition-all duration-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-white/70 flex items-center gap-2 text-sm">
                <Shield className="w-4 h-4" />
                Company Admins
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl sm:text-3xl font-bold text-cyan-400">
                {statisticsLoading ? (
                  <div className="animate-pulse">...</div>
                ) : (
                  statistics.companyAdmins.toLocaleString()
                )}
              </div>
              <p className="text-xs text-white/60 mt-1">Company admins</p>
            </CardContent>
          </Card>

          <Card className="bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] border-white/10 hover:border-white/20 transition-all duration-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-white/70 flex items-center gap-2 text-sm">
                <UserCog className="w-4 h-4" />
                Company Users
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl sm:text-3xl font-bold text-blue-400">
                {statisticsLoading ? (
                  <div className="animate-pulse">...</div>
                ) : (
                  statistics.companyUsers.toLocaleString()
                )}
              </div>
              <p className="text-xs text-white/60 mt-1">Standard users</p>
            </CardContent>
          </Card>

          <Card className="bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] border-white/10 hover:border-white/20 transition-all duration-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-white/70 flex items-center gap-2 text-sm">
                <Users className="w-4 h-4" />
                Company Viewers
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl sm:text-3xl font-bold text-purple-400">
                {statisticsLoading ? (
                  <div className="animate-pulse">...</div>
                ) : (
                  statistics.companyViewers.toLocaleString()
                )}
              </div>
              <p className="text-xs text-white/60 mt-1">Read-only access</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] border-white/10">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/50" />
                <Input
                  placeholder="Search users by name, email, or company..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full rounded-full bg-black/35 border border-white/10 text-white placeholder:text-white/50 focus:ring-2 focus:ring-cyan-400/40"
                />
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px] bg-black/35 border border-white/10 text-white">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                {(searchTerm || statusFilter !== "all") && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchTerm("");
                      setStatusFilter("all");
                    }}
                    className="bg-black/35 border border-white/10 text-white/70 hover:text-white"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users List by Role */}
        <Card className="bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] border-white/10">
          <CardHeader>
            <CardTitle className="text-white/70 flex items-center gap-2">
              <UserCog className="w-5 h-5" />
              Users by Role
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-8 h-8 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mb-3" />
                <p className="text-white/60 text-sm">Loading users...</p>
              </div>
            ) : (
              <Tabs
                value={activeRoleTab}
                onValueChange={setActiveRoleTab}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 mb-6 bg-transparent p-0 gap-2">
                  {roleTabs.map((tab) => (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg border border-white/20 text-white/60 transition-all duration-300 hover:border-[#67B0B7] hover:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#67B0B7] data-[state=active]:to-[#4066B3] data-[state=active]:border-transparent data-[state=active]:text-white data-[state=active]:shadow-[0_5px_18px_rgba(103,176,183,0.35)] group"
                    >
                      {tab.label}
                      <Badge className="ml-2 bg-white/10 text-white/70 group-data-[state=active]:bg-white/20 group-data-[state=active]:text-white transition-colors">
                        {tab.count}
                      </Badge>
                    </TabsTrigger>
                  ))}
                </TabsList>

                {roleTabs.map((tab) => (
                  <TabsContent
                    key={tab.value}
                    value={tab.value}
                    className="mt-0"
                  >
                    {filteredUsers.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 px-4">
                        <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                          <Users className="w-6 h-6 text-white/30" />
                        </div>
                        <p className="text-white/70 text-base font-medium mb-1">
                          {searchTerm || statusFilter !== "all"
                            ? "No users found"
                            : `No ${tab.label.toLowerCase()} found`}
                        </p>
                        <p className="text-white/50 text-sm text-center max-w-md">
                          {searchTerm || statusFilter !== "all"
                            ? "Try adjusting your filters or search terms."
                            : `There are no users with the ${tab.label.toLowerCase()} role.`}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-white/10">
                                <th className="text-left py-3 px-4 text-white/70 text-sm font-medium">
                                  User
                                </th>
                                <th className="text-left py-3 px-4 text-white/70 text-sm font-medium">
                                  Company
                                </th>
                                <th className="text-left py-3 px-4 text-white/70 text-sm font-medium">
                                  Role
                                </th>
                                <th className="text-left py-3 px-4 text-white/70 text-sm font-medium">
                                  Status
                                </th>
                                <th className="text-left py-3 px-4 text-white/70 text-sm font-medium">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredUsers.map((user) => (
                                <tr
                                  key={user._id}
                                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                                >
                                  <td className="py-4 px-4">
                                    <div>
                                      <p className="text-white font-medium">
                                        {user.name ||
                                          `${user.firstName || ""} ${
                                            user.lastName || ""
                                          }`.trim() ||
                                          user.email.split("@")[0]}
                                      </p>
                                      <p className="text-white/60 text-sm">
                                        {user.email}
                                      </p>
                                    </div>
                                  </td>
                                  <td className="py-4 px-4">
                                    <div className="flex items-center gap-2">
                                      <Building2 className="h-4 w-4 text-white/50" />
                                      <span className="text-white/70 text-sm">
                                        {user.companyName || "Unknown"}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="py-4 px-4">
                                    <Badge
                                      className={`${getRoleBadgeColor(
                                        user.role || ""
                                      )} rounded-full px-3 py-1 text-xs`}
                                    >
                                      {getRoleDisplayName(user)}
                                    </Badge>
                                  </td>
                                  <td className="py-4 px-4">
                                    {user.status === "active" ? (
                                      <Badge className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-full px-3 py-1 text-xs">
                                        Active
                                      </Badge>
                                    ) : (
                                      <Badge className="bg-red-600/20 text-red-300 border border-red-600/30 rounded-full px-3 py-1 text-xs">
                                        Inactive
                                      </Badge>
                                    )}
                                  </td>
                                  <td className="py-4 px-4">
                                    {user.companyId && (
                                      <Button
                                        onClick={() =>
                                          handleStatusToggle(
                                            user.companyId!,
                                            user._id,
                                            user.status || "inactive"
                                          )
                                        }
                                        className={`${
                                          user.status === "active"
                                            ? "bg-red-600/20 text-red-400 border border-red-600/30 hover:bg-red-600/30"
                                            : "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30"
                                        } rounded-full px-4 py-2 text-xs`}
                                        size="sm"
                                      >
                                        {user.status === "active" ? (
                                          <>
                                            <XCircle className="h-4 w-4 mr-2" />
                                            Deactivate
                                          </>
                                        ) : (
                                          <>
                                            <CheckCircle2 className="h-4 w-4 mr-2" />
                                            Activate
                                          </>
                                        )}
                                      </Button>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </CardContent>
        </Card>
      </main>
    </AdminLayout>
  );
};

export default AdminUsers;
