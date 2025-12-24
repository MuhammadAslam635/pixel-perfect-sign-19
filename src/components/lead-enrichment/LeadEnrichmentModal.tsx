import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Building2, Search as SearchIcon } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import DomainSpecificTab from "./tabs/DomainSpecificTab";
import AdvancedQueryTab from "./tabs/AdvancedQueryTab";
import EnrichmentProgressTracker from "./EnrichmentProgressTracker";
import type {
  EnrichmentMode,
  EnrichmentFilters,
  SeniorityLevel,
} from "@/types/leadEnrichment";

interface LeadEnrichmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEnrichmentStart?: (searchId: string, mode: EnrichmentMode) => void;
  onEnrichmentComplete?: (searchId: string) => void;
  selectedSeniorities?: SeniorityLevel[];
}

const LeadEnrichmentModal = ({
  isOpen,
  onClose,
  onEnrichmentStart,
  onEnrichmentComplete,
  selectedSeniorities = [],
}: LeadEnrichmentModalProps) => {
  const [activeTab, setActiveTab] = useState<EnrichmentMode>("domain");
  const [isEnriching, setIsEnriching] = useState(false);
  const [searchId, setSearchId] = useState<string | null>(null);
  const [estimatedTime, setEstimatedTime] = useState<string | null>(null);

  const handleEnrichmentStart = (
    searchId: string,
    estimatedTime: string,
    mode: EnrichmentMode
  ) => {
    setSearchId(searchId);
    setEstimatedTime(estimatedTime);
    setIsEnriching(true);
    onEnrichmentStart?.(searchId, mode);
  };

  const handleEnrichmentComplete = () => {
    setIsEnriching(false);
    if (searchId) {
      onEnrichmentComplete?.(searchId);
    }
    // Keep modal open to show results
  };

  const handleClose = () => {
    if (!isEnriching) {
      onClose();
      // Reset state after modal closes
      setTimeout(() => {
        setActiveTab("domain");
        setSearchId(null);
        setEstimatedTime(null);
      }, 300);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-hidden p-0 bg-gradient-to-br from-gray-800/50 to-gray-900/30 border border-white/10 backdrop-blur-xl"
        hideCloseButton={true}
      >
        {/* Accessibility - Hidden from visual but available to screen readers */}
        <VisuallyHidden>
          <DialogTitle>Lead Enrichment</DialogTitle>
          <DialogDescription>
            Discover and enrich company leads with decision-makers using domain-specific or advanced query methods
          </DialogDescription>
        </VisuallyHidden>

        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-br from-gray-800/50 to-gray-900/30 backdrop-blur-sm border-b border-white/10 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white" aria-hidden="true">
                Lead Enrichment
              </h2>
              <p className="text-sm text-white/50 mt-1" aria-hidden="true">
                Discover and enrich company leads with decision-makers
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              disabled={isEnriching}
              className="text-white/50 hover:text-white hover:bg-white/5 rounded-full"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-20 overflow-y-auto scrollbar-hide max-h-[calc(90vh-100px)]">
          {!isEnriching ? (
            <Tabs
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as EnrichmentMode)}
              className="w-full mt-4"
            >
              {/* Tab Selector */}
              <TabsList className="grid w-full grid-cols-2 bg-gradient-to-br from-gray-800/50 to-gray-900/30 border border-white/10 p-1">
                <TabsTrigger
                  value="domain"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#69B4B7] data-[state=active]:to-[#3E64B4] data-[state=active]:text-white text-white/50 transition-all"
                >
                  Domain Specific
                </TabsTrigger>
                <TabsTrigger
                  value="query"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#69B4B7] data-[state=active]:to-[#3E64B4] data-[state=active]:text-white text-white/50 transition-all"
                >
                  Advanced Query
                </TabsTrigger>
              </TabsList>

              {/* Tab Content */}
              <div className="mt-6">
                <TabsContent value="domain" className="mt-0">
                  <DomainSpecificTab
                    onEnrichmentStart={(searchId, estimatedTime) =>
                      handleEnrichmentStart(searchId, estimatedTime, "domain")
                    }
                    selectedSeniorities={selectedSeniorities}
                  />
                </TabsContent>

                <TabsContent value="query" className="mt-0">
                  <AdvancedQueryTab
                    onEnrichmentStart={(searchId, estimatedTime) =>
                      handleEnrichmentStart(searchId, estimatedTime, "query")
                    }
                  />
                </TabsContent>
              </div>
            </Tabs>
          ) : (
            /* Enrichment in Progress */
            <div className="py-8">
              <EnrichmentProgressTracker
                searchId={searchId!}
                estimatedTime={estimatedTime!}
                mode={activeTab}
                onComplete={handleEnrichmentComplete}
              />
            </div>
          )}
        </div>

        {/* Footer Info */}
        {!isEnriching && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-br from-gray-800/95 to-gray-900/95 backdrop-blur-sm border-t border-white/10 px-6 py-3 z-20">
            <p className="text-xs text-white/50 text-center">
              {activeTab === "domain" ? (
                <>
                  <span className="font-semibold text-[#69B4B7]">
                    Domain Specific:
                  </span>{" "}
                  Direct enrichment without AI search - faster processing
                </>
              ) : (
                <>
                  <span className="font-semibold text-[#69B4B7]">
                    Advanced Query:
                  </span>{" "}
                  AI-powered company discovery with custom filters
                </>
              )}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LeadEnrichmentModal;
