import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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
  RotateCcw,
} from "lucide-react";
import { userService, User } from "@/services/user.service";
import { toast } from "sonner";

const UserList = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [trashed, setTrashed] = useState(false);
  const [loading, setLoading] = useState(false);
  const limit = 10;

  const fetchUsers = useCallback(
    async (resetPage = false) => {
      setLoading(true);
      try {
        const currentPage = resetPage ? 1 : page;
        const response = await userService.getUsers({
          page: currentPage,
          limit,
          search: searchTerm,
          trashed,
        });

        if (response.success && response.data) {
          setUsers(response.data.users);
          setPage(response.data.page);
          setTotalPages(response.data.totalPages);
        } else {
          setUsers([]);
        }
      } catch (error: any) {
        console.error("Error fetching users:", error);
        setUsers([]);
        toast.error(error?.response?.data?.message || "Failed to fetch users");
      } finally {
        setLoading(false);
      }
    },
    [page, searchTerm, trashed, limit]
  );

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDelete = async (userId: string, userName: string) => {
    if (
      !window.confirm(
        `Are you sure you want to delete user '${userName}'? This action cannot be undone!`
      )
    ) {
      return;
    }

    try {
      await userService.deleteUser(userId);
      toast.success("User deleted successfully");
      const response = await userService.getUsers({
        page: 1,
        limit,
        search: searchTerm,
        trashed,
      });
      if (response.success && response.data) {
        setUsers(response.data.users);
        setPage(response.data.page);
        setTotalPages(response.data.totalPages);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to delete user");
    }
  };

  const handleRestore = async (userId: string) => {
    try {
      await userService.restoreUser(userId);
      toast.success("User restored successfully");
      const response = await userService.getUsers({
        page,
        limit,
        search: searchTerm,
        trashed,
      });
      if (response.success && response.data) {
        setUsers(response.data.users);
        setPage(response.data.page);
        setTotalPages(response.data.totalPages);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to restore user");
    }
  };

  const paginationPages = useMemo(() => {
    if (totalPages <= 1) return null;

    const maxVisible = 5;
    let startPage = Math.max(1, page - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

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

  return (
    <DashboardLayout>
      <div className="min-h-screen mt-20 w-full px-6 py-8 overflow-y-auto">
        <div className="max-w-[1100px] mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-white mb-2">
                Employees
              </h1>
              <p className="text-white/60 text-sm">Manage your employees</p>
            </div>
            <Button
              className="mt-4 bg-gradient-to-r from-cyan-500/60 to-[#1F4C55] text-white hover:from-[#30cfd0] hover:to-[#2a9cb3]"
              style={{
                boxShadow:
                  "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
              }}
              onClick={() => navigate("/users/create")}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Employee
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="rounded-2xl border border-white/10 bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] p-6 shadow-[0_20px_34px_rgba(0,0,0,0.38)] backdrop-blur">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/50" />
                <Input
                  placeholder="Search by name, email..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10 w-full rounded-full bg-black/35 border border-white/10 text-white placeholder:text-white/50 focus:ring-2 focus:ring-cyan-400/40"
                />
              </div>
              <Button
                variant={trashed ? "destructive" : "outline"}
                className="mt-4 bg-gradient-to-r from-cyan-500/60 to-[#1F4C55] text-white hover:from-[#30cfd0] hover:to-[#2a9cb3]"
                style={{
                  boxShadow:
                    "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
                }}
                onClick={() => {
                  setTrashed((t) => !t);
                  setPage(1);
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {trashed ? "Show Active" : "Show Trash"}
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-2xl border border-white/10 bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] shadow-[0_20px_34px_rgba(0,0,0,0.38)] backdrop-blur overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-[1.2fr_1.5fr_0.8fr_0.8fr_1fr_80px] items-center gap-4 px-6 py-4 bg-black/20 border-b border-white/10">
              <div className="text-sm font-medium text-white/70">Name</div>
              <div className="text-sm font-medium text-white/70">Email</div>
              <div className="text-sm font-medium text-white/70">Role</div>
              <div className="text-sm font-medium text-white/70">Status</div>
              <div className="text-sm font-medium text-white/70">
                Created At
              </div>
              <div className="text-sm font-medium text-white/70 text-center">
                Actions
              </div>
            </div>

            {/* Table Body */}
            <div className="min-h-[400px]">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-8 h-8 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mb-3" />
                  <p className="text-white/60 text-sm">Loading users...</p>
                </div>
              ) : users.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4">
                  <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                    <Search className="w-6 h-6 text-white/30" />
                  </div>
                  <p className="text-white/70 text-base font-medium mb-1">
                    {searchTerm ? "No users found" : "No users available"}
                  </p>
                  <p className="text-white/50 text-sm text-center max-w-md">
                    {searchTerm
                      ? "Try adjusting your search terms or clear the filter to see all users."
                      : "There are no users in the database yet."}
                  </p>
                </div>
              ) : (
                users.map((user) => (
                  <div
                    key={user._id}
                    className="grid grid-cols-[1.2fr_1.5fr_0.8fr_0.8fr_1fr_80px] items-center gap-4 px-6 py-4 hover:bg-white/5 transition-colors border-b border-white/5 last:border-b-0"
                  >
                    <div className="font-medium text-white truncate">
                      {user.name ||
                        `${user.firstName || ""} ${
                          user.lastName || ""
                        }`.trim() ||
                        user.email.split("@")[0]}
                    </div>
                    <div className="text-white/70 truncate">{user.email}</div>
                    <div>
                      {user.role === "CompanyAdmin" && (
                        <Badge className="bg-purple-600/20 text-purple-400 border border-purple-600/30 rounded-full px-3 py-1">
                          Company Admin
                        </Badge>
                      )}
                      {user.role === "CompanyUser" && (
                        <Badge className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-full px-3 py-1">
                          Company User
                        </Badge>
                      )}
                      {!user.role && (
                        <Badge className="bg-white/10 text-white/70 border border-white/20 rounded-full px-3 py-1">
                          N/A
                        </Badge>
                      )}
                    </div>
                    <div>
                      {user.status === "active" && (
                        <Badge className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-full px-3 py-1">
                          Active
                        </Badge>
                      )}
                      {user.status === "inactive" && (
                        <Badge className="bg-red-600/20 text-red-400 border border-red-600/30 rounded-full px-3 py-1">
                          Inactive
                        </Badge>
                      )}
                      {!user.status && (
                        <Badge className="bg-white/10 text-white/70 border border-white/20 rounded-full px-3 py-1">
                          N/A
                        </Badge>
                      )}
                    </div>
                    <div className="text-white/60 text-sm">
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString()
                        : "N/A"}
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
                          {!trashed ? (
                            <>
                              <DropdownMenuItem
                                onClick={() =>
                                  navigate(`/users/${user._id}/edit`)
                                }
                                className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-white/10"
                              >
                                <Pencil size={16} /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleDelete(
                                    user._id,
                                    user.name ||
                                      `${user.firstName || ""} ${
                                        user.lastName || ""
                                      }`.trim() ||
                                      user.email
                                  )
                                }
                                className="flex items-center gap-2 px-3 py-2 hover:bg-red-600/30 text-red-400 cursor-pointer"
                              >
                                <Trash2 size={16} /> Delete
                              </DropdownMenuItem>
                            </>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => handleRestore(user._id)}
                              className="flex items-center gap-2 px-3 py-2 hover:bg-cyan-500/30 text-cyan-400 cursor-pointer"
                            >
                              <RotateCcw size={16} /> Restore
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && !loading && (
            <Pagination className="mt-6">
              <PaginationContent>
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
                {paginationPages &&
                  page < paginationPages.endPage - 1 &&
                  totalPages > paginationPages.endPage && (
                    <PaginationItem>
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
      </div>
    </DashboardLayout>
  );
};

export default UserList;
