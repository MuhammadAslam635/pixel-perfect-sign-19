import { FC, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Company, CompaniesResponse, companiesService } from "@/services/companies.service";
import CompanyExecutivesPanel from "./CompanyExecutivesPanel";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import RenderCompanyCard from "./RenderCompanyCard";
import { renderEmpty, renderLoading } from "./RenderLoading";
import PageSizeAndPagination from "./PageSizeAndPagination";
import MobileExecutivesView from "./MobileExecutivesView";

type ViewMode = "compact" | "detailed" | "card";

type CompaniesListProps = {
  companies: Company[];
  loading: boolean;
  selectedCompanyId: string | null;
  onSelectCompany: (companyId: string) => void;
  onDesktopExecutivesFocus?: () => void;
  search?: string;
  onSearchChange?: (search: string) => void;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  totalCompanies?: number;
  showFilters?: boolean;
  selectedCompany?: Company;
  onViewAllLeads?: () => void;
  onExecutiveSelect?: (executive: unknown) => void;
  onMobileExecutivesViewChange?: (isOpen: boolean) => void;
  pageSize?: number;
  pageSizeOptions?: number[];
  onPageSizeChange?: (size: number) => void;
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
};

const CompaniesList: FC<CompaniesListProps> = ({
  companies,
  loading,
  selectedCompanyId,
  onSelectCompany,
  search = "",
  page = 1,
  totalPages = 1,
  onPageChange,
  totalCompanies,
  selectedCompany,
  onViewAllLeads,
  onExecutiveSelect,
  onMobileExecutivesViewChange,
  onDesktopExecutivesFocus,
  pageSize = 10,
  pageSizeOptions = [10, 25, 50, 100],
  onPageSizeChange,
  viewMode = "detailed",
  onViewModeChange,
}) => {
  const queryClient = useQueryClient();
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const deleteMutation = useMutation({
    mutationFn: (companyId: string) =>
      companiesService.deleteCompany(companyId),
    onMutate: async (companyId) => {
      await queryClient.cancelQueries({ queryKey: ["companies"] });
      const previousCompanies = queryClient.getQueryData(["companies"]);
      queryClient.setQueryData(
        ["companies"],
        (old: CompaniesResponse | undefined) => {
          if (!old) return old;
          return {
            ...old,
            data: {
              ...old.data,
              docs: old.data.docs.filter(
                (company: Company) => company._id !== companyId
              ),
              totalDocs: old.data.totalDocs - 1,
            },
          };
        }
      );
      return { previousCompanies };
    },
    onSuccess: (data, companyId) => {
      toast.success(data?.message || "Company and associated leads deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["company-crm-stats"] });
      queryClient.invalidateQueries({ queryKey: ["crm-stats"] });
      setShowDeleteDialog(false);
      if (selectedCompanyId === companyId) {
        onSelectCompany("");
        setMobileExecutivesView(false);
      }
      setCompanyToDelete(null);
    },
    onError: (error: any, companyId, context) => {
      if (context?.previousCompanies) {
        queryClient.setQueryData(["companies"], context.previousCompanies);
      }
      const errorMessage = error.response?.data?.message || error.message || "Failed to delete company";
      toast.error(errorMessage);
    },
  });
  const handleDeleteClick = (company: Company, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setCompanyToDelete(company);
    setShowDeleteDialog(true);
  };
  const confirmDelete = () => {
    if (companyToDelete) deleteMutation.mutate(companyToDelete._id);
  };
  const [mobileExecutivesView, setMobileExecutivesView] = useState(false);
  useEffect(() => onMobileExecutivesViewChange?.(mobileExecutivesView), [mobileExecutivesView, onMobileExecutivesViewChange]);
  useEffect(() => onMobileExecutivesViewChange?.(false), [onMobileExecutivesViewChange]);
  const [isMobile, setIsMobile] = useState(false);
  const [visibleCount, setVisibleCount] = useState(2);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const newVisibleCount = isMobile ? Math.min(2, companies.length) : companies.length;
    setVisibleCount(newVisibleCount);
  }, [isMobile, companies.length]);

  const handleLoadMore = () => setVisibleCount((prev) => Math.min(prev + 2, companies.length));

  const displayedCompanies = isMobile ? companies.slice(0, visibleCount) : companies;

  const calculatedTotalPages = useMemo(() => {
    if (totalCompanies !== undefined && totalCompanies > 0) {
      return Math.ceil(totalCompanies / pageSize);
    }
    return totalPages;
  }, [totalCompanies, pageSize, totalPages]);

  const paginationPages = useMemo<(number | "ellipsis")[] | null>(() => {
    const pagesToUse = calculatedTotalPages;
    if (pagesToUse <= 1) return null;
    if (pagesToUse <= 4) {
      return Array.from({ length: pagesToUse }, (_, i) => i + 1);
    }
    let startPage = Math.max(1, page - 1);
    let endPage = startPage + 2;

    if (endPage > pagesToUse) {
      endPage = pagesToUse;
      startPage = endPage - 2;
    }

    const pages: (number | "ellipsis")[] = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    if (endPage < pagesToUse) {
      if (endPage < pagesToUse - 1) {
        pages.push("ellipsis");
      }
      pages.push(pagesToUse);
    }

    return pages;
  }, [page, calculatedTotalPages]);

  if (mobileExecutivesView && selectedCompany) {
    return <MobileExecutivesView company={selectedCompany} onBack={() => {
      setMobileExecutivesView(false);
      onSelectCompany("");
    }} onViewAllLeads={onViewAllLeads} onExecutiveSelect={onExecutiveSelect} />;
  }

  return (
    <div className={`flex flex-col h-full ${viewMode === "card" ? "px-2" : ""}`}>
      <PageSizeAndPagination position="top" page={page} pageSize={pageSize} totalCompanies={totalCompanies ?? companies.length} calculatedTotalPages={calculatedTotalPages} paginationPages={paginationPages}
        pageSizeOptions={pageSizeOptions}
        viewMode={viewMode}
        onViewModeChange={onViewModeChange}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
      <div className="w-full pb-4 flex-1 min-h-0 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <AnimatePresence mode="wait">
          <motion.div key={viewMode} className="w-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2, ease: "easeInOut" }} layout>
            <AnimatePresence mode="wait">
              {(() => {
                if (loading) return renderLoading(viewMode); if (displayedCompanies.length === 0) return renderEmpty(search);
                return (
                  <motion.div key={`companies-grid-${displayedCompanies.length}`} initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: 0.4, ease: "easeOut" }, }} exit={{ opacity: 0, transition: { duration: 0.2, ease: "easeIn" }, }} className={viewMode === "card" ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3" : "space-y-4"} layout>
                    {displayedCompanies.map((company, index) => (
                      <motion.div key={company._id} layout initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -20, scale: 0.95 }} transition={{ duration: 0.3, ease: "easeOut", delay: index * 0.05 }}>
                        <RenderCompanyCard company={company} selectedCompanyId={selectedCompanyId || ""} onSelectCompany={onSelectCompany} onDesktopExecutivesFocus={onDesktopExecutivesFocus} viewMode={viewMode} setMobileExecutivesView={setMobileExecutivesView} handleDeleteClick={handleDeleteClick} />
                        <AnimatePresence>
                          {selectedCompanyId === company._id &&
                            viewMode !== "card" && (
                              <motion.div
                                className="block lg:hidden mt-2 mb-2"
                                initial={{ opacity: 0, height: 0, y: -10 }}
                                animate={{ opacity: 1, height: "auto", y: 0 }}
                                exit={{ opacity: 0, height: 0, y: -10 }}
                                transition={{
                                  duration: 0.35,
                                  ease: [0.4, 0, 0.2, 1],
                                }}
                              >
                                <Card className="bg-[#1f3032] border-[#3A3A3A] p-3 sm:p-4">
                                  <CompanyExecutivesPanel
                                    company={selectedCompany}
                                    onViewAllLeads={
                                      onViewAllLeads || (() => { })
                                    }
                                    onExecutiveSelect={onExecutiveSelect}
                                  />
                                </Card>
                              </motion.div>
                            )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
                  </motion.div>
                );
              })()}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </div>

      {isMobile && companies.length > 2 && (
        <div className="flex flex-col items-center gap-2 pb-4">
          <p className="text-xs text-white/70">Showing 1 - {Math.min(visibleCount, companies.length)} of {companies.length} Companies</p>
          {visibleCount < companies.length && <Button onClick={handleLoadMore} className="rounded-md px-6 py-2 text-sm font-medium text-white bg-[#596C6D] shadow-[0px_20px_40px_rgba(0,0,0,0.45)]">Load More</Button>}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog open={showDeleteDialog} title="Delete Company" description={`Are you sure you want to delete ${companyToDelete?.name
        }? This will also delete all ${companyToDelete?.people?.length || 0
        } associated ${(companyToDelete?.people?.length || 0) === 1 ? "lead" : "leads"
        }. This action cannot be undone.`}
        confirmText="Yes, Delete"
        cancelText="Cancel"
        isPending={deleteMutation.isPending}
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDeleteDialog(false);
          setCompanyToDelete(null);
        }}
      />
    </div>
  );
};

export default CompaniesList;