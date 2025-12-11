import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { AdminLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
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
  Filter,
  X,
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

const AdminMembers = () => {
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

  const [users, setUsers] = useState<UserWithCompany[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [statisticsLoading, setStatisticsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [companyFilter, setCompanyFilter] = useState<string>("all");
  const limit = 20;
  const filtersRef = useRef({
    searchTerm,
    roleFilter,
    statusFilter,
    companyFilter,
  });

  const [statistics, setStatistics] = useState({
    totalUsers: 0,
    activeUsers: 0,
    admins: 0,
    companyAdmins: 0,
    companyUsers: 0,
  });

  // Check if user is Admin
  useEffect(() => {
    if (userRoleName !== "Admin") {
      toast.error("Access denied. Admin access required.");
    }
  }, [userRoleName]);

  // Fetch companies for filter
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
  const fetchUsers = useCallback(
    async (resetPage = false) => {
      if (userRoleName !== "Admin") return;

      setLoading(true);
      try {
        const currentPage = resetPage ? 1 : page;

        // Build query params
        const params: any = {
          page: currentPage,
          limit,
          search: searchTerm,
          trashed: false,
        };

        if (roleFilter !== "all") {
          params.role = roleFilter;
        }
        if (statusFilter !== "all") {
          params.status = statusFilter;
        }
        if (companyFilter !== "all") {
          params.companyId = companyFilter;
        }

        // Fetch users from all companies
        // Since we don't have a global endpoint, we'll fetch from each company
        if (companyFilter === "all") {
          // Fetch all companies first, then their users
          const companiesResponse = await adminService.getCompanies({
            page: 1,
            limit: 1000,
            trashed: false,
          });

          if (companiesResponse.success && companiesResponse.data) {
            const allUsers: UserWithCompany[] = [];
            const companiesList = companiesResponse.data.companies;

            // Fetch users from each company
            for (const company of companiesList) {
              try {
                const usersResponse = await adminService.getCompanyUsers(
                  company._id,
                  {
                    page: 1,
                    limit: 1000,
                    search: searchTerm,
                    trashed: false,
                  }
                );

                if (usersResponse.success && usersResponse.data) {
                  const companyUsers = usersResponse.data.users.map((user) => ({
                    ...user,
                    companyName: company.name || company.email?.split("@")[0],
                    companyId: company._id,
                  }));

                  // Apply filters
                  let filtered = companyUsers;
                  if (roleFilter !== "all") {
                    filtered = filtered.filter((u) => u.role === roleFilter);
                  }
                  if (statusFilter !== "all") {
                    filtered = filtered.filter(
                      (u) => u.status === statusFilter
                    );
                  }

                  allUsers.push(...filtered);
                }
              } catch (error) {
                console.error(
                  `Error fetching users for company ${company._id}:`,
                  error
                );
              }
            }

            // Paginate results
            const startIndex = (currentPage - 1) * limit;
            const endIndex = startIndex + limit;
            const paginatedUsers = allUsers.slice(startIndex, endIndex);

            setUsers(paginatedUsers);
            setTotalRecords(allUsers.length);
            setTotalPages(Math.ceil(allUsers.length / limit));
            setPage(currentPage);
          }
        } else {
          // Fetch users from specific company
          const response = await adminService.getCompanyUsers(companyFilter, {
            page: currentPage,
            limit,
            search: searchTerm,
            trashed: false,
          });

          if (response.success && response.data) {
            const company = companies.find((c) => c._id === companyFilter);
            const usersWithCompany = response.data.users.map((user) => ({
              ...user,
              companyName:
                company?.name || company?.email?.split("@")[0] || "Unknown",
              companyId: companyFilter,
            }));

            // Apply role filter
            let filtered = usersWithCompany;
            if (roleFilter !== "all") {
              filtered = filtered.filter((u) => u.role === roleFilter);
            }
            if (statusFilter !== "all") {
              filtered = filtered.filter((u) => u.status === statusFilter);
            }

            setUsers(filtered);
            setTotalRecords(response.data.totalRecords);
            setTotalPages(response.data.totalPages);
            setPage(response.data.page);
          }
        }
      } catch (error: any) {
        console.error("Error fetching users:", error);
        setUsers([]);
        toast.error(error?.response?.data?.message || "Failed to fetch users");
      } finally {
        setLoading(false);
      }
    },
    [
      page,
      searchTerm,
      roleFilter,
      statusFilter,
      companyFilter,
      limit,
      userRoleName,
      companies,
    ]
  );

  // Calculate statistics
  const calculateStatistics = useCallback(async () => {
    if (userRoleName !== "Admin") return;

    setStatisticsLoading(true);
    try {
      // Fetch all companies
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

        // Count users from all companies
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
    calculateStatistics();
  }, [fetchCompanies, fetchRoles, calculateStatistics]);

  // Fetch users when page or filters change
  useEffect(() => {
    const filtersChanged =
      filtersRef.current.searchTerm !== searchTerm ||
      filtersRef.current.roleFilter !== roleFilter ||
      filtersRef.current.statusFilter !== statusFilter ||
      filtersRef.current.companyFilter !== companyFilter;

    if (filtersChanged) {
      filtersRef.current = {
        searchTerm,
        roleFilter,
        statusFilter,
        companyFilter,
      };
      setPage(1);
      fetchUsers(true);
    } else {
      fetchUsers(false);
    }
  }, [page, searchTerm, roleFilter, statusFilter, companyFilter, fetchUsers]);

  const handleStatusToggle = async (
    companyId: string,
    userId: string,
    currentStatus: string
  ) => {
    if (userRoleName !== "Admin") return;

    const newStatus = currentStatus === "active" ? "inactive" : "active";

    try {
      const user = users.find((u) => u._id === userId);
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
      fetchUsers();
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

  const paginationPages = useMemo(() => {
    if (totalPages <= 1) return null;

    const maxVisible = 5;
    let startPage = Math.max(1, page - Math.floor(maxVisible / 2));
    const endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    const pages: number[] = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return { pages, startPage, endPage };
  }, [page, totalPages]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePrevious = () => {
    if (page > 1) {
      handlePageChange(page - 1);
    }
  };

  const handleNext = () => {
    if (page < totalPages) {
      handlePageChange(page + 1);
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setRoleFilter("all");
    setStatusFilter("all");
    setCompanyFilter("all");
    setPage(1);
  };

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

        {/* Statistics Cards */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card className="bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] border-white/10 hover:border-white/20 transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-white/70 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {statisticsLoading ? (
                  <div className="animate-pulse">...</div>
                ) : (
                  statistics.totalUsers.toLocaleString()
                )}
              </div>
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
              <div className="text-3xl font-bold text-green-400">
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
                    )}% active rate`
                  : "No users"}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] border-white/10 hover:border-white/20 transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-white/70 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Company Admins
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-400">
                {statisticsLoading ? (
                  <div className="animate-pulse">...</div>
                ) : (
                  statistics.companyAdmins.toLocaleString()
                )}
              </div>
              <p className="text-xs text-white/60 mt-1">
                Company administrators
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] border-white/10 hover:border-white/20 transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-white/70 flex items-center gap-2">
                <Crown className="w-5 h-5" />
                System Admins
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white/85">
                {statisticsLoading ? (
                  <div className="animate-pulse">...</div>
                ) : (
                  statistics.admins.toLocaleString()
                )}
              </div>
              <p className="text-xs text-white/60 mt-1">System admins</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] border-white/10">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/50" />
                <Input
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10 w-full rounded-full bg-black/35 border border-white/10 text-white placeholder:text-white/50 focus:ring-2 focus:ring-cyan-400/40"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-[150px] bg-black/35 border border-white/10 text-white">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="Admin">System Admin</SelectItem>
                    <SelectItem value="CompanyAdmin">Company Admin</SelectItem>
                    <SelectItem value="CompanyUser">Company User</SelectItem>
                    <SelectItem value="CompanyViewer">
                      Company Viewer
                    </SelectItem>
                  </SelectContent>
                </Select>
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
                <Select value={companyFilter} onValueChange={setCompanyFilter}>
                  <SelectTrigger className="w-[180px] bg-black/35 border border-white/10 text-white">
                    <SelectValue placeholder="Company" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Companies</SelectItem>
                    {companies.map((company) => (
                      <SelectItem key={company._id} value={company._id}>
                        {company.name || company.email?.split("@")[0]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {(searchTerm ||
                  roleFilter !== "all" ||
                  statusFilter !== "all" ||
                  companyFilter !== "all") && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
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

        {/* Users List */}
        <Card className="bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] border-white/10">
          <CardHeader>
            <CardTitle className="text-white/70 flex items-center gap-2">
              <Users className="w-5 h-5" />
              User Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-8 h-8 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mb-3" />
                <p className="text-white/60 text-sm">Loading users...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-white/30" />
                </div>
                <p className="text-white/70 text-base font-medium mb-1">
                  {searchTerm ||
                  roleFilter !== "all" ||
                  statusFilter !== "all" ||
                  companyFilter !== "all"
                    ? "No users found"
                    : "No users available"}
                </p>
                <p className="text-white/50 text-sm text-center max-w-md">
                  {searchTerm ||
                  roleFilter !== "all" ||
                  statusFilter !== "all" ||
                  companyFilter !== "all"
                    ? "Try adjusting your filters or search terms."
                    : "There are no users in the system yet."}
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
                      {users.map((user) => (
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

                {/* Pagination */}
                {totalPages > 1 && (
                  <Pagination className="mt-6">
                    <PaginationContent className="flex-wrap gap-2">
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={handlePrevious}
                          className={
                            page === 1
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }
                        />
                      </PaginationItem>
                      <div className="hidden sm:flex gap-1">
                        {paginationPages?.pages.map((pageNum) => (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              isActive={page === pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              className="cursor-pointer"
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                      </div>
                      <div className="sm:hidden">
                        <PaginationItem>
                          <PaginationLink isActive={true}>
                            {page} / {totalPages}
                          </PaginationLink>
                        </PaginationItem>
                      </div>
                      {paginationPages &&
                        page < paginationPages.endPage - 1 &&
                        totalPages > paginationPages.endPage && (
                          <PaginationItem className="hidden sm:block">
                            <PaginationEllipsis />
                          </PaginationItem>
                        )}
                      <PaginationItem>
                        <PaginationNext
                          onClick={handleNext}
                          className={
                            page === totalPages
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </AdminLayout>
  );
};

export default AdminMembers;
