import { useEffect, useState, useMemo, useCallback } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Search,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Building2,
} from "lucide-react";
import { adminService, Company, CompanyAdmin } from "@/services/admin.service";
import { toast } from "sonner";

const MembersPermissions = () => {
  const authState = useSelector((state: RootState) => state.auth);

  // Get user's role name - prioritize roleId over legacy role
  // Note: Admin role is intentionally kept as legacy system role (not roleId-based)
  const getUserRoleName = (): string | null => {
    const user = authState.user;
    if (!user) return null;

    // PRIORITY 1: Check populated roleId (new RBAC system)
    if (user.roleId && typeof user.roleId === "object") {
      return (user.roleId as any).name;
    }

    // PRIORITY 2: Fallback to legacy role string
    if (user.role && typeof user.role === "string") {
      return user.role;
    }

    return null;
  };

  const userRoleName = getUserRoleName();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [expandedCompanies, setExpandedCompanies] = useState<Set<string>>(new Set());
  const [companyAdmins, setCompanyAdmins] = useState<Record<string, CompanyAdmin[]>>({});
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [loadingAdmins, setLoadingAdmins] = useState<Record<string, boolean>>({});
  const [companyStatusUpdating, setCompanyStatusUpdating] = useState<Record<string, boolean>>({});
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const limit = 10;

  // Check if user is Admin
  useEffect(() => {
    if (userRoleName !== "Admin") {
      toast.error("Access denied. Admin access required.");
    }
  }, [userRoleName]);

  const fetchCompanies = useCallback(
    async (resetPage = false) => {
      if (userRoleName !== "Admin") return;

      setLoadingCompanies(true);
      try {
        const currentPage = resetPage ? 1 : page;
        const response = await adminService.getCompanies({
          page: currentPage,
          limit,
          search: searchTerm,
          trashed: false,
        });

        if (response.success && response.data) {
          setCompanies(response.data.companies);
          setPage(response.data.page);
          setTotalPages(response.data.totalPages);
        } else {
          setCompanies([]);
        }
      } catch (error: any) {
        console.error("Error fetching companies:", error);
        setCompanies([]);
        toast.error(error?.response?.data?.message || "Failed to fetch companies");
      } finally {
        setLoadingCompanies(false);
      }
    },
    [page, searchTerm, limit, userRoleName]
  );

  const fetchCompanyAdmins = useCallback(
    async (companyId: string) => {
      if (userRoleName !== "Admin") return;

      setLoadingAdmins((prev) => ({ ...prev, [companyId]: true }));
      try {
        const response = await adminService.getCompanyUsers(companyId, {
          page: 1,
          limit: 100, // Get all admins for a company
          search: "",
          trashed: false,
        });

        if (response.success && response.data) {
          // Filter only CompanyAdmin role users
          const admins = response.data.users.filter(
            (user) => user.role === "CompanyAdmin"
          );
          setCompanyAdmins((prev) => ({ ...prev, [companyId]: admins }));
        }
      } catch (error: any) {
        console.error("Error fetching company admins:", error);
        toast.error(error?.response?.data?.message || "Failed to fetch company admins");
        setCompanyAdmins((prev) => ({ ...prev, [companyId]: [] }));
      } finally {
        setLoadingAdmins((prev) => ({ ...prev, [companyId]: false }));
      }
    },
    [userRoleName]
  );

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const handleToggleCompany = (companyId: string) => {
    setExpandedCompanies((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(companyId)) {
        newSet.delete(companyId);
      } else {
        newSet.add(companyId);
        // Fetch admins when expanding if not already loaded
        if (!companyAdmins[companyId]) {
          fetchCompanyAdmins(companyId);
        }
      }
      return newSet;
    });
  };

  const handleStatusToggle = async (
    companyId: string,
    userId: string,
    currentStatus: string
  ) => {
    if (userRoleName !== "Admin") return;

    const newStatus = currentStatus === "active" ? "inactive" : "active";
    
    try {
      // Get the user data first to preserve other fields
      const user = companyAdmins[companyId]?.find((u) => u._id === userId);
      if (!user) {
        toast.error("User not found");
        return;
      }

      await adminService.updateCompanyUserStatus(companyId, userId, {
        name: user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim(),
        email: user.email,
        role: user.role,
        status: newStatus,
      });

      toast.success(
        `Company admin status updated to ${newStatus === "active" ? "Active" : "Inactive"}`
      );

      // Update local state
      setCompanyAdmins((prev) => ({
        ...prev,
        [companyId]: prev[companyId]?.map((u) =>
          u._id === userId ? { ...u, status: newStatus } : u
        ) || [],
      }));
    } catch (error: any) {
      console.error("Error updating status:", error);
      toast.error(error?.response?.data?.message || "Failed to update status");
    }
  };

  const handleCompanyStatusUpdate = async (
    companyId: string,
    newStatus: "active" | "inactive"
  ) => {
    if (userRoleName !== "Admin") return;

    const targetCompany = companies.find((c) => c._id === companyId);
    if (!targetCompany) {
      toast.error("Company not found");
      return;
    }

    const companyName =
      targetCompany.company ||
      targetCompany.name ||
      targetCompany.email?.split("@")[0] ||
      "Unnamed Company";

    setCompanyStatusUpdating((prev) => ({ ...prev, [companyId]: true }));
    try {
      await adminService.updateCompanyStatus(companyId, {
        company: companyName,
        email: targetCompany.email,
        status: newStatus,
        isVerified: targetCompany.isVerified,
      });

      setCompanies((prev) =>
        prev.map((company) =>
          company._id === companyId ? { ...company, status: newStatus } : company
        )
      );

      toast.success(
        newStatus === "active"
          ? "Company approved successfully."
          : "Company status updated."
      );
    } catch (error: any) {
      console.error("Error updating company status:", error);
      toast.error(error?.response?.data?.message || "Failed to update company status");
    } finally {
      setCompanyStatusUpdating((prev) => ({ ...prev, [companyId]: false }));
    }
  };

  const filteredAdmins = useMemo(() => {
    return Object.entries(companyAdmins).reduce((acc, [companyId, admins]) => {
      let filtered = admins;
      
      if (statusFilter === "active") {
        filtered = admins.filter((a) => a.status === "active");
      } else if (statusFilter === "inactive") {
        filtered = admins.filter((a) => a.status === "inactive");
      }

      if (filtered.length > 0) {
        acc[companyId] = filtered;
      }
      return acc;
    }, {} as Record<string, CompanyAdmin[]>);
  }, [companyAdmins, statusFilter]);

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

  if (userRoleName !== "Admin") {
    return (
      <DashboardLayout>
        <main className="relative px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-[66px] mt-20 sm:mt-20 lg:mt-24 xl:mt-28 mb-0 flex flex-col gap-6 text-white flex-1 overflow-y-auto">
          <div className="flex flex-col items-center justify-center py-16">
            <XCircle className="w-16 h-16 text-red-400 mb-4" />
            <p className="text-white/70 text-lg font-medium mb-2">Access Denied</p>
            <p className="text-white/50 text-sm">Admin access required to view this page.</p>
          </div>
        </main>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <main className="relative px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-[66px] mt-20 sm:mt-20 lg:mt-24 xl:mt-28 mb-0 flex flex-col gap-6 text-white flex-1 overflow-y-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-white mb-2">
              Members & Permissions
            </h1>
            <p className="text-white/60 text-xs sm:text-sm">
              Manage company admin status and permissions
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="rounded-2xl border border-white/10 bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] p-4 sm:p-6 shadow-[0_20px_34px_rgba(0,0,0,0.38)] backdrop-blur">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="flex-1 relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/50" />
              <Input
                placeholder="Search companies..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    fetchCompanies(true);
                  }
                }}
                className="pl-10 w-full rounded-full bg-black/35 border border-white/10 text-white placeholder:text-white/50 focus:ring-2 focus:ring-cyan-400/40 text-sm sm:text-base"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                className={`${
                  statusFilter === "all"
                    ? "bg-gradient-to-r from-cyan-500/60 to-[#1F4C55] text-white hover:from-[#30cfd0] hover:to-[#2a9cb3]"
                    : "bg-black/35 border border-white/10 text-white/70 hover:text-white"
                }`}
                onClick={() => setStatusFilter("all")}
              >
                All
              </Button>
              <Button
                variant={statusFilter === "active" ? "default" : "outline"}
                className={`${
                  statusFilter === "active"
                    ? "bg-gradient-to-r from-cyan-500/60 to-[#1F4C55] text-white hover:from-[#30cfd0] hover:to-[#2a9cb3]"
                    : "bg-black/35 border border-white/10 text-white/70 hover:text-white"
                }`}
                onClick={() => setStatusFilter("active")}
              >
                Active
              </Button>
              <Button
                variant={statusFilter === "inactive" ? "default" : "outline"}
                className={`${
                  statusFilter === "inactive"
                    ? "bg-gradient-to-r from-cyan-500/60 to-[#1F4C55] text-white hover:from-[#30cfd0] hover:to-[#2a9cb3]"
                    : "bg-black/35 border border-white/10 text-white/70 hover:text-white"
                }`}
                onClick={() => setStatusFilter("inactive")}
              >
                Inactive
              </Button>
            </div>
          </div>
        </div>

        {/* Companies List */}
        <div className="rounded-2xl border border-white/10 bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] shadow-[0_20px_34px_rgba(0,0,0,0.38)] backdrop-blur overflow-hidden">
          <div className="min-h-[400px]">
            {loadingCompanies ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-8 h-8 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mb-3" />
                <p className="text-white/60 text-sm">Loading companies...</p>
              </div>
            ) : companies.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                  <Building2 className="w-6 h-6 text-white/30" />
                </div>
                <p className="text-white/70 text-base font-medium mb-1">
                  {searchTerm ? "No companies found" : "No companies available"}
                </p>
                <p className="text-white/50 text-sm text-center max-w-md">
                  {searchTerm
                    ? "Try adjusting your search terms or clear the filter to see all companies."
                    : "There are no companies in the database yet."}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {companies.map((company) => {
                  const isExpanded = expandedCompanies.has(company._id);
                  const admins = filteredAdmins[company._id] || [];
                  const isLoading = loadingAdmins[company._id];

                  return (
                    <div key={company._id} className="hover:bg-white/5 transition-colors">
                      {/* Company Header */}
                      <div
                        className="flex items-center justify-between p-4 sm:p-6 cursor-pointer"
                        onClick={() => handleToggleCompany(company._id)}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {isExpanded ? (
                            <ChevronDown className="h-5 w-5 text-white/70 flex-shrink-0" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-white/70 flex-shrink-0" />
                          )}
                          <Building2 className="h-5 w-5 text-cyan-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-white truncate">
                              {company.company || company.name || "Unnamed Company"}
                            </h3>
                            <p className="text-white/60 text-sm truncate">{company.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <Badge
                            className={`${
                              company.status === "active"
                                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                                : "bg-red-600/20 text-red-300 border border-red-600/30"
                            } rounded-full px-3 py-1 text-xs`}
                          >
                            {company.status === "active" ? "Active" : "Inactive"}
                          </Badge>
                          {company.isVerified && (
                            <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full px-3 py-1 text-xs">
                              Verified
                            </Badge>
                          )}
                          <Badge className="bg-white/10 text-white/70 border border-white/20 rounded-full px-3 py-1 text-xs">
                            {companyAdmins[company._id]?.length || 0} Admin
                            {companyAdmins[company._id]?.length !== 1 ? "s" : ""}
                          </Badge>
                          {company.status !== "active" && (
                            <Button
                              size="sm"
                              className="bg-gradient-to-r from-cyan-500/60 to-[#1F4C55] text-white hover:from-[#30cfd0] hover:to-[#2a9cb3] rounded-full px-4 py-2 text-xs"
                              disabled={companyStatusUpdating[company._id]}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCompanyStatusUpdate(company._id, "active");
                              }}
                            >
                              {companyStatusUpdating[company._id] ? "Activating..." : "Activate"}
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Company Admins List */}
                      {isExpanded && (
                        <div className="bg-black/20 border-t border-white/10">
                          {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                              <div className="w-6 h-6 border-3 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
                            </div>
                          ) : admins.length === 0 ? (
                            <div className="p-6 text-center">
                              <p className="text-white/50 text-sm">
                                No company admins found for this company.
                              </p>
                            </div>
                          ) : (
                            <div className="divide-y divide-white/5">
                              {admins.map((admin) => (
                                <div
                                  key={admin._id}
                                  className="p-4 sm:p-6 pl-8 sm:pl-12 hover:bg-white/5 transition-colors"
                                >
                                  <div className="flex items-center justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-medium text-white mb-1">
                                        {admin.name ||
                                          `${admin.firstName || ""} ${admin.lastName || ""}`.trim() ||
                                          admin.email.split("@")[0]}
                                      </h4>
                                      <p className="text-white/60 text-sm truncate">
                                        {admin.email}
                                      </p>
                                      {admin.createdAt && (
                                        <p className="text-white/40 text-xs mt-1">
                                          Created: {new Date(admin.createdAt).toLocaleDateString()}
                                        </p>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-3 flex-shrink-0">
                                      {admin.status === "active" ? (
                                        <Badge className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-full px-3 py-1 text-xs">
                                          Active
                                        </Badge>
                                      ) : (
                                        <Badge className="bg-red-600/20 text-red-400 border border-red-600/30 rounded-full px-3 py-1 text-xs">
                                          Inactive
                                        </Badge>
                                      )}
                                      <Button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleStatusToggle(
                                            company._id,
                                            admin._id,
                                            admin.status || "inactive"
                                          );
                                        }}
                                        className={`${
                                          admin.status === "active"
                                            ? "bg-red-600/20 text-red-400 border border-red-600/30 hover:bg-red-600/30"
                                            : "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30"
                                        } rounded-full px-4 py-2 text-xs`}
                                      >
                                        {admin.status === "active" ? (
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
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && !loadingCompanies && (
          <Pagination className="mt-4 sm:mt-6">
            <PaginationContent className="flex-wrap gap-2">
              <PaginationItem>
                <PaginationPrevious
                  onClick={handlePrevious}
                  className={
                    page === 1
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer text-sm sm:text-base"
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
                  <PaginationLink isActive={true} className="cursor-pointer">
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
                      : "cursor-pointer text-sm sm:text-base"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </main>
    </DashboardLayout>
  );
};

export default MembersPermissions;

