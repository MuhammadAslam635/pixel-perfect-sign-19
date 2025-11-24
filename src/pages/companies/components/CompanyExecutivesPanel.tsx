import { FC, useState } from "react";
import { Button } from "@/components/ui/button";
import { Users, Linkedin, ArrowRight, Upload, Loader2 } from "lucide-react";
import { Company, CompanyPerson } from "@/services/companies.service";
import { highlevelService } from "@/services/highlevel.service";
import { toast } from "sonner";

type CompanyExecutivesPanelProps = {
  company?: Company;
  onViewAllLeads: () => void;
  onExecutiveSelect?: (executive: CompanyPerson) => void;
};

const CompanyExecutivesPanel: FC<CompanyExecutivesPanelProps> = ({
  company,
  onViewAllLeads,
  onExecutiveSelect,
}) => {
  const [syncingExecutives, setSyncingExecutives] = useState<
    Record<string, boolean>
  >({});
  const [bulkSyncing, setBulkSyncing] = useState(false);

  const handleSyncExecutiveToGHL = async (
    executive: CompanyPerson,
    companyId: string
  ) => {
    if (!executive._id && !executive.id) {
      toast.error("Cannot sync: Missing executive ID");
      return;
    }

    const execId = executive._id || executive.id!;
    setSyncingExecutives((prev) => ({ ...prev, [execId]: true }));

    try {
      await highlevelService.createContactFromCompanyPerson({
        companyPersonId: execId,
        companyId: companyId,
        type: "lead",
        source: "api v1",
        tags: [],
      });
      toast.success(
        `${executive.name || "Executive"} synced to GoHighLevel successfully!`
      );
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to sync executive to GoHighLevel";
      toast.error(errorMessage);
    } finally {
      setSyncingExecutives((prev) => ({ ...prev, [execId]: false }));
    }
  };

  const handleBulkSyncAllExecutives = async () => {
    if (!company?._id || !company?.people || company.people.length === 0) {
      toast.error("No executives to sync");
      return;
    }

    setBulkSyncing(true);
    try {
      const companyPersonIds = company.people
        .filter((exec) => exec._id || exec.id)
        .map((exec) => exec._id || exec.id!) as string[];

      if (companyPersonIds.length === 0) {
        toast.error("No valid executives to sync");
        return;
      }

      const result = await highlevelService.bulkSyncContacts({
        companyPersonIds,
        type: "lead",
        source: "api v1",
        tags: [],
      });

      if (result.success) {
        toast.success(
          `Bulk sync completed! ${result.data.success} succeeded, ${result.data.failed} failed.`
        );
      } else {
        toast.error(result.message || "Bulk sync failed");
      }
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to bulk sync executives to GoHighLevel";
      toast.error(errorMessage);
    } finally {
      setBulkSyncing(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 sm:p-3 md:p-4 mr-1 sm:mr-2 rounded-full bg-black/10 hover:bg-black/20 text-white flex items-center justify-center">
            <Users className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <h3 className="text-sm sm:text-base font-medium text-foreground">
            Executives
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {company?.people && company.people.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBulkSyncAllExecutives}
              disabled={bulkSyncing}
              className="h-auto px-2 py-1 text-xs text-primary hover:text-primary/80 disabled:opacity-50 flex items-center gap-1"
            >
              {bulkSyncing ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span className="hidden sm:inline">Syncing...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3 h-3" />
                  <span className="hidden sm:inline">
                    Sync All ({company.people.length})
                  </span>
                </>
              )}
            </Button>
          )}
          <Button
            variant="link"
            className="h-auto p-0 text-xs text-foreground/60 hover:text-foreground/80"
            onClick={onViewAllLeads}
          >
            <span className="hidden sm:inline">View All</span>
            <span className="sm:hidden">All</span>
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </div>

      <>
        {company ? (
          company.people && company.people.length > 0 ? (
            company.people.map((exec, index) => {
              const hasLinkedin = Boolean(exec.linkedin);

              return (
                <div
                  key={exec._id || exec.id || index}
                  role="button"
                  tabIndex={0}
                  onClick={() => onExecutiveSelect?.(exec)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onExecutiveSelect?.(exec);
                    }
                  }}
                  className="relative overflow-hidden rounded-xl sm:rounded-2xl border border-white/15 bg-gradient-to-r from-[#1f3032] via-[#243f42] to-[#1b2c2d] px-3 sm:px-4 py-2.5 sm:py-3 mb-2 sm:mb-3 transition-all duration-300 hover:shadow-[0_12px_32px_rgba(0,0,0,0.3)] before:absolute before:content-[''] before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-[55%] before:w-[3px] sm:before:w-[4px] before:rounded-full before:bg-white/70 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/60"
                >
                  <div className="flex items-center justify-between gap-2 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-semibold text-white mb-0.5 truncate">
                        {exec.name || "N/A"}
                      </p>
                      <p className="text-xs text-white/60 mb-1 sm:mb-2 line-clamp-2">
                        {exec.title || exec.position || "N/A"}
                        {exec.email && (
                          <>
                            <span className="hidden sm:inline"> | </span>
                            <span className="block sm:inline truncate">
                              {exec.email}
                            </span>
                          </>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        type="button"
                        disabled={!hasLinkedin}
                        className={`flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-white/15 transition-colors ${
                          hasLinkedin
                            ? "bg-white/15 text-white hover:bg-white/25"
                            : "bg-white/10 text-white/40 cursor-not-allowed"
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!hasLinkedin) return;
                          window.open(
                            exec.linkedin!.startsWith("http")
                              ? exec.linkedin
                              : `https://${exec.linkedin}`,
                            "_blank"
                          );
                        }}
                      >
                        <Linkedin
                          className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${
                            hasLinkedin ? "text-white" : "text-white/50"
                          }`}
                        />
                      </button>
                      {(exec._id || exec.id) && company?._id && (
                        <button
                          type="button"
                          disabled={syncingExecutives[exec._id || exec.id!]}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSyncExecutiveToGHL(exec, company._id);
                          }}
                          className={`flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full border transition-colors ${
                            syncingExecutives[exec._id || exec.id!]
                              ? "bg-primary/50 border-primary/50 text-white cursor-wait"
                              : "bg-primary border-primary text-white hover:bg-primary/80 hover:border-primary/80"
                          }`}
                          title="Sync to GoHighLevel"
                        >
                          {syncingExecutives[exec._id || exec.id!] ? (
                            <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                          ) : (
                            <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-muted-foreground/60">
              No executives found for this company.
            </p>
          )
        ) : (
          <p className="text-sm text-muted-foreground/60">
            Select a company to view its executives.
          </p>
        )}
      </>
    </>
  );
};

export default CompanyExecutivesPanel;
