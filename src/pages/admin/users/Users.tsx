import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { AdminLayout } from "@/components/dashboard/DashboardLayout";
import { Users, UserCheck, Shield, Crown, XCircle, UserCog } from "lucide-react";
import { adminService, CompanyAdmin, Company } from "@/services/admin.service";
import { rbacService } from "@/services/rbac.service";
import { Role } from "@/types/rbac.types";
import { toast } from "sonner";
import { sanitizeErrorMessage } from "@/utils/errorMessages";
import { UserProvisioningModal } from "@/pages/admin/users/components/UserProvisioningModal";
import StatCard from "./components/StatCard";
import { UsersByRoleCard } from "./components/UsersByRoleCard";
import { useQuery } from "@tanstack/react-query";
import { calculateUserStatistics, extractRoleName, STANDARD_ROLES } from "./components/HelperFunction";
import { UserSearchFilter } from "./components/UserSearchFilter";
import { getUserRoleBadgeClass, getUserRoleDisplayName } from "./components/roleUi";

interface UserWithCompany extends CompanyAdmin {
  companyName?: string;
  companyId?: string;
  roleId?: Role | string;
  hasTwilioConfig?: boolean;
  hasElevenLabsConfig?: boolean;
  twilioError?: string | null;
  elevenlabsError?: string | null;
}

const AdminUsers = () => {
  const navigate = useNavigate();
  const authState = useSelector((state: RootState) => state.auth);
  const userRole = authState.user?.role?.toString() ?? (authState.user?.roleId as any)?.name ?? null;
  const [allUsers, setAllUsers] = useState<UserWithCompany[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [statisticsLoading, setStatisticsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [activeRoleTab, setActiveRoleTab] = useState<string>("all");
  const [provisioningModalOpen, setProvisioningModalOpen] = useState(false);
  const [selectedUserForProvisioning, setSelectedUserForProvisioning] = useState<UserWithCompany | null>(null);

  const [statistics, setStatistics] = useState({ totalUsers: 0, activeUsers: 0, admins: 0, companyAdmins: 0, companyUsers: 0, companyViewers: 0 });
  useEffect(() => {
    if (userRole !== "Admin") {
      toast.error("Access denied. Admin access required.");
    }
  }, [userRole]);

  const { data: fetchCompanies } = useQuery({
    queryKey: ["companies"],
    queryFn: () => adminService.getCompanies({ page: 1, limit: 1000, trashed: false }),
    refetchOnWindowFocus: false,
  });
  const { data: fetchRoles } = useQuery({
    queryKey: ["roles"],
    queryFn: () => rbacService.getAllRoles(),
    refetchOnWindowFocus: false,
  });
  useEffect(() => {
    if (fetchCompanies) {
      setCompanies(fetchCompanies.data.companies);
    }
  }, [fetchCompanies]);
  useEffect(() => {
    if (fetchRoles) {
      setAvailableRoles(fetchRoles.data);
    }
  }, [fetchRoles]);

  const fetchAllUsers = useCallback(async () => {
    if (userRole !== "Admin") return;
    setLoading(true);
    try {
      const usersResponse = await adminService.getAllUsers({ page: 1, limit: 10000, trashed: false });
      if (usersResponse.success && usersResponse.data) {
        const companiesResponse = await adminService.getCompanies({ page: 1, limit: 1000, trashed: false });
        const companiesMap = new Map<string, string>();
        if (companiesResponse.success && companiesResponse.data) {
          companiesResponse.data.companies.forEach((company) => { companiesMap.set(company._id, company.name || company.email?.split("@")[0] || "Unknown") })
        }
        const usersList: UserWithCompany[] = usersResponse.data.users.map(
          (user: any) => {
            let companyName = "N/A";
            let companyId = undefined;
            if (user.role === "Company") {
              companyName = user.name || user.email?.split("@")[0] || "Unknown";
              companyId = user._id;
            } else if (user.parentCompany) {
              companyName = companiesMap.get(user.parentCompany) || user.parentCompany.toString();
              companyId = user.parentCompany;
            } else if (user.role === "Admin") {
              companyName = "System";
            }
            return { ...user, companyName, companyId };
          }
        );
        setAllUsers(usersList);
      }
    } catch (error: any) {
      console.error("Error fetching users:", error);
      toast.error(sanitizeErrorMessage(error, "Unable to load users. Please try again."));
    } finally {
      setLoading(false);
    }
  }, [userRole]);

  useEffect(() => {
    fetchAllUsers();
  }, [fetchAllUsers]);

  const calculateStatistics = useCallback(async () => {
    if (userRole !== "Admin") return;
    setStatisticsLoading(true);
    try {
      const usersResponse = await adminService.getAllUsers({ page: 1, limit: 10000, trashed: false });
      if (usersResponse.success && usersResponse.data) {
        const stats = calculateUserStatistics(usersResponse.data.users);
        setStatistics(stats);
      }
    } catch (error: any) {
      console.error("Error calculating statistics:", error);
    } finally {
      setStatisticsLoading(false);
    }
  }, [userRole]);

  useEffect(() => {
    if (availableRoles.length > 0) {
      calculateStatistics();
    }
  }, [availableRoles, calculateStatistics]);

  const handleStatusToggle = async (
    companyId: string,
    userId: string,
    currentStatus: string
  ) => {
    if (userRole !== "Admin") return;
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    try {
      const user = allUsers.find((u) => u._id === userId);
      if (!user) {
        toast.error("User not found");
        return;
      }
      if (user.role === "Company") {
        const response = await adminService.updateCompanyStatus(userId, {
          name: user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim(),
          email: user.email,
          isVerified: newStatus === "active",
          status: newStatus,
        });
        if (response.provisioning) {
          const { twilio, elevenlabs } = response.provisioning;
          if (twilio.success && elevenlabs.success) { toast.success(`Company activated and provisioned successfully! Twilio and ElevenLabs configured.`) }
          else if (twilio.success) { toast.success(`Company activated. Twilio configured. ElevenLabs: ${elevenlabs.error || "Failed"}`) }
          else if (elevenlabs.success) { toast.success(`Company activated. ElevenLabs configured. Twilio: ${twilio.error || "Failed"}`) }
          else { toast.warning(`Company activated but provisioning failed. Twilio: ${twilio.error || "Failed"}, ElevenLabs: ${elevenlabs.error || "Failed"}`) }
        } else { toast.success(`Company status updated to ${newStatus === "active" ? "Active" : "Inactive"}`); }
      } else {
        await adminService.updateCompanyUserStatus(companyId, userId, {
          name: user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim(),
          email: user.email,
          role: user.role,
          status: newStatus,
        });
        toast.success(`User status updated to ${newStatus === "active" ? "Active" : "Inactive"}`);
      }
      fetchAllUsers();
      calculateStatistics();
    } catch (error: any) {
      console.error("Error updating status:", error);
      toast.error(error.response?.data?.message || "Failed to update status");
    }
  };
  const groupedUsersByRole = useMemo(() => {
    const groups: Record<string, UserWithCompany[]> = {};

    allUsers.forEach((user) => {
      const roleName = extractRoleName(user);
      if (!groups[roleName]) {
        groups[roleName] = [];
      }
      groups[roleName].push(user);
    });

    return groups;
  }, [allUsers, availableRoles]);

  const filteredUsers = useMemo(() => {
    const roleToShow = activeRoleTab === "all" ? null : activeRoleTab;
    let users = roleToShow ? groupedUsersByRole[roleToShow] || [] : allUsers;
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      users = users.filter((user) => user.email.toLowerCase().includes(searchLower) || user.name?.toLowerCase().includes(searchLower) || `${user.firstName || ""} ${user.lastName || ""}`.toLowerCase().includes(searchLower) || user.companyName?.toLowerCase().includes(searchLower));
    }
    if (statusFilter !== "all") { users = users.filter((user) => user.status === statusFilter) }
    return users;
  }, [allUsers, groupedUsersByRole, activeRoleTab, searchTerm, statusFilter]);

  const roleTabs = useMemo(() => {
    const tabs = [
      { value: "all", label: "All Users", count: allUsers.length },
      { value: "Admin", label: "System Admins", count: statistics.admins },
      { value: "CompanyAdmin", label: "Company Admins", count: statistics.companyAdmins, },
      { value: "CompanyUser", label: "Company Users", count: statistics.companyUsers, },
      { value: "CompanyViewer", label: "Company Viewers", count: statistics.companyViewers, },
    ];
    // Add custom roles from RBAC
    availableRoles.forEach((role) => {
      if (!STANDARD_ROLES.includes(role.name)) {
        const count = allUsers.filter(
          (user) =>
            extractRoleName(user, {
              standardRoles: STANDARD_ROLES,
              availableRoles,
            }) === role.name
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

  if (userRole !== "Admin") {
    return (
      <AdminLayout>
        <main className="relative px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-[66px] mt-20 sm:mt-20 lg:mt-24 xl:mt-28 mb-0 flex flex-col gap-6 text-white flex-1 overflow-y-auto">
          <div className="flex flex-col items-center justify-center py-16">
            <XCircle className="w-16 h-16 text-red-400 mb-4" />
            <p className="text-white/70 text-lg font-medium mb-2">Access Denied</p>
            <p className="text-white/50 text-sm">Admin access required to view this page.</p>
          </div>
        </main>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <main className="relative px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-[66px] mt-20 sm:mt-20 lg:mt-24 xl:mt-28 mb-0 flex flex-col gap-6 text-white flex-1 overflow-y-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white my-2">User Management</h1>
            <p className="text-white/60">Manage users across all companies by roles and permissions</p>
          </div>
        </div>
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <StatCard title="Total Users" icon={Users} color="text-white" value={statistics.totalUsers} description="All registered" loading={statisticsLoading} />
          <StatCard title="Active Users" icon={UserCheck} color="text-green-400" value={statistics.activeUsers} description={statistics.totalUsers > 0 ? `${Math.round((statistics.activeUsers / statistics.totalUsers) * 100)}% active` : "No users"} loading={statisticsLoading} />
          <StatCard title="System Admins" icon={Crown} color="text-yellow-400" value={statistics.admins} description="Global access" loading={statisticsLoading} />
          <StatCard title="Company Admins" icon={Shield} color="text-cyan-400" value={statistics.companyAdmins} description="Company admins" loading={statisticsLoading} />
          <StatCard title="Company Users" icon={UserCog} color="text-blue-400" value={statistics.companyUsers} description="Standard users" loading={statisticsLoading} />
          <StatCard title="Company Viewers" icon={Users} color="text-purple-400" value={statistics.companyViewers} description="Read-only access" loading={statisticsLoading} />
        </div>
        <UserSearchFilter searchTerm={searchTerm} onSearchChange={setSearchTerm} statusFilter={statusFilter} onStatusChange={setStatusFilter} />
        <UsersByRoleCard loading={loading} roleTabs={roleTabs} filteredUsers={filteredUsers} activeRoleTab={activeRoleTab} setActiveRoleTab={setActiveRoleTab} searchTerm={searchTerm}
          statusFilter={statusFilter}
          handleStatusToggle={handleStatusToggle}
          setSelectedUserForProvisioning={setSelectedUserForProvisioning}
          setProvisioningModalOpen={setProvisioningModalOpen}
          getRoleBadgeColor={getUserRoleBadgeClass}
          getRoleDisplayName={getUserRoleDisplayName}
          navigate={navigate} />
        {selectedUserForProvisioning && (
          <UserProvisioningModal
            open={provisioningModalOpen}
            onOpenChange={(open) => { setProvisioningModalOpen(open); if (!open) { fetchAllUsers(); setSelectedUserForProvisioning(null); } }}
            user={selectedUserForProvisioning}
            onSuccess={() => { fetchAllUsers() }}
          />
        )}
      </main>
    </AdminLayout>
  );
};

export default AdminUsers;