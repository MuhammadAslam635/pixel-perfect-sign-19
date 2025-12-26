import { FC, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Users,
  Linkedin,
  Facebook,
  Building2,
  Globe,
  Info,
  Phone,
  MapPin,
  Loader2,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Company, CompanyPerson, companiesService } from "@/services/companies.service";
import { CompanyLogoFallback } from "@/components/ui/company-logo-fallback";
import { Card } from "@/components/ui/card";
import { AvatarFallback } from "@/components/ui/avatar-fallback";

type CompanyExecutivesPanelProps = {
  company?: Company;
  onViewAllLeads: () => void;
  onExecutiveSelect?: (executive: CompanyPerson) => void;
};

type TabType = "executives" | "details";

const CompanyExecutivesPanel: FC<CompanyExecutivesPanelProps> = ({
  company,
  onViewAllLeads,
  onExecutiveSelect,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>("details");
  const [showLeads, setShowLeads] = useState(false);
  const [showLoadingSkeleton, setShowLoadingSkeleton] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [shouldPoll, setShouldPoll] = useState(false);
  const previousCompanyId = useRef<string | undefined>(undefined);

  // Reset tabs only when switching to a DIFFERENT company
  useEffect(() => {
    const currentCompanyId = company?._id;

    // Only reset if the company ID actually changed (not just a data refresh)
    if (currentCompanyId && currentCompanyId !== previousCompanyId.current) {
      setActiveTab("details");
      setShowLeads(false);
      previousCompanyId.current = currentCompanyId;
    }
  }, [company?._id]);

  // Fetch company details with conditional auto-refresh
  const { data: latestCompany, isLoading: isCompanyLoading } = useQuery({
    queryKey: ["company", company?._id],
    queryFn: () => (company?._id ? companiesService.getCompanyById(company._id) : null),
    enabled: !!company?._id,
    refetchInterval: shouldPoll ? 5000 : false, // Poll every 5 seconds only when generating
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const displayCompany = latestCompany || company;

  // Update polling state based on lead generation status
  useEffect(() => {
    const isGenerating =
      displayCompany?.leadsGenerationStatus === 'in_progress' ||
      displayCompany?.leadsGenerationStatus === 'pending';
    setShouldPoll(isGenerating);
  }, [displayCompany?.leadsGenerationStatus]);

  // Get company LinkedIn URL (from company data or first executive)
  const companyLinkedIn =
    company?.linkedinUrl ||
    company?.people?.[0]?.linkedin ||
    (company?.website?.includes("linkedin.com") ? company.website : null);

  const hasLinkedIn = Boolean(companyLinkedIn);
  const hasFacebook = Boolean(company?.facebook);
  const hasPhone = Boolean(company?.phone);

  // Helper function to get revenue with fallback
  const getRevenue = () => {
    if (company?.revenue) return company.revenue;
    if (company?.organization_revenue_printed)
      return company.organization_revenue_printed;
    if (company?.organization_revenue) return company.organization_revenue;
    return null;
  };

  // Helper function to format website URL
  const formatWebsiteUrl = (url: string | null | undefined): string => {
    if (!url) return "";
    return url.replace(/^https?:\/\//, "").replace(/^www\./, "");
  };

  // Helper function to get full URL with protocol
  const getFullUrl = (url: string | null | undefined): string => {
    if (!url) return "";
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      return `https://${url}`;
    }
    return url;
  };

  // Helper function to generate Google Maps URL
  const getGoogleMapsUrl = (address: string | null | undefined): string => {
    if (!address) return "";
    const encodedAddress = encodeURIComponent(address);
    return `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
  };

  // Helper function to generate Google Maps embed URL
  const getGoogleMapsEmbedUrl = (
    address: string | null | undefined
  ): string | null => {
    if (!address) return null;
    const encodedAddress = encodeURIComponent(address);
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (apiKey) {
      return `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodedAddress}`;
    }
    // Fallback: Use Google Maps search embed URL (works without API key for basic usage)
    return `https://www.google.com/maps?q=${encodedAddress}&output=embed&hl=en`;
  };

  // Helper function to format large financial numbers
  const formatFinancialValue = (value: string | number | null | undefined): string => {
    if (value === null || value === undefined) return "";
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(num)) return value.toString();

    // If it's already a formatted string like "39.0B", just return it
    if (typeof value === "string" && /[KMBT]$/i.test(value)) return value;

    if (num >= 1e12) return (num / 1e12).toFixed(1) + "T";
    if (num >= 1e9) return (num / 1e9).toFixed(1) + "B";
    if (num >= 1e6) return (num / 1e6).toFixed(1) + "M";
    if (num >= 1e3) return (num / 1e3).toFixed(1) + "K";
    return num.toString();
  };

  return (
    <>
      {/* Company Header with LinkedIn */}
      {company && (
        <div className="mb-4 pb-3 border-b border-white/10">
          <div className="flex items-start justify-between gap-1">
            <div className="flex-1 min-w-0">
              <h2 className="text-base sm:text-lg font-semibold text-white truncate">
                {company.name}
              </h2>
              <p className="text-xs text-white/60 line-clamp-2">
                {company.description ||
                  company.about ||
                  "No description available"}
              </p>
            </div>
            {/* {hasLinkedIn && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0A66C2] text-white text-xs font-medium flex-shrink-0">
                <Linkedin className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">LinkedIn</span>
              </div>
            )} */}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
        <motion.button
          onClick={() => {
            setActiveTab("details");
            setShowLeads(false);
            if (activeTab !== "details") {
                setShowLoadingSkeleton(true);
                setMapLoaded(false);
                setTimeout(() => setShowLoadingSkeleton(false), 500);
                // Safety timeout for map: maximum 3s waiting for map, then force show
                setTimeout(() => setMapLoaded(true), 3000);
            }
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
            activeTab === "details"
              ? "bg-white/10 text-white"
              : "text-white/60 hover:text-white hover:bg-white/5"
          }`}
        >
          <motion.div
            animate={{
              rotate: activeTab === "details" ? [0, -10, 10, 0] : 0,
            }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <Info className="w-4 h-4" />
          </motion.div>
          <span className="text-sm font-medium">Company Details</span>
        </motion.button>
        <motion.button
          onClick={() => {
            setActiveTab("executives");
            setShowLeads(true);
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
            activeTab === "executives"
              ? "bg-white/10 text-white"
              : "text-white/60 hover:text-white hover:bg-white/5"
          }`}
        >
          <motion.div
            animate={{
              rotate: activeTab === "executives" ? [0, -10, 10, 0] : 0,
            }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <Users className="w-4 h-4" />
          </motion.div>
          <span className="text-sm font-medium">Executives</span>
        </motion.button>
      </div>

      {/* Tab Content */}
      <div className="relative">
        {activeTab === "executives" && (
          <motion.div
            key="executives"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="relative"
          >
            {showLeads && displayCompany ? (
              <>
                {/* Show loading indicator at top if still generating */}
                {(displayCompany.leadsGenerationStatus === 'in_progress' ||
                  displayCompany.leadsGenerationStatus === 'pending') && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center justify-center gap-3 py-4 px-3 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 mb-3"
                  >
                    <Loader2 className="w-5 h-5 text-primary animate-spin flex-shrink-0" />
                    <div className="text-left flex-1">
                      <p className="text-sm font-medium text-white">
                        {displayCompany.people && displayCompany.people.length > 0
                          ? 'Still finding more executives...'
                          : 'Searching for executives...'}
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Show leads in real-time as they're found */}
                {displayCompany.people && displayCompany.people.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {displayCompany.people.map((exec, index) => {
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
                          className="relative overflow-hidden rounded-xl sm:rounded-2xl border border-white/15 bg-gradient-to-r from-[#1f3032] via-[#243f42] to-[#1b2c2d] px-2 sm:px-3 py-2 max-w-sm h-14 transition-all duration-300 hover:shadow-[0_12px_32px_rgba(0,0,0,0.3)] cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/60"
                        >
                          <div className="flex items-center justify-between gap-2 h-full">
                            <AvatarFallback
                              name={exec.name || "N/A"}
                              pictureUrl={(exec.pictureUrl || exec.photo_url || exec.image) as string}
                              size="xs"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-white mb-0.5 truncate">
                                {exec.name || "N/A"}
                              </p>
                              <p className="text-[10px] text-white/60 line-clamp-2">
                                {exec.title || exec.position || "N/A"}
                                {exec.email && (
                                  <>
                                    <span className="inline"> | </span>
                                    <span className="truncate">{exec.email}</span>
                                  </>
                                )}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button
                                type="button"
                                disabled={!hasLinkedin}
                                className={`flex h-7 w-7 items-center justify-center rounded-full border border-white/15 transition-colors ${
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
                                  className={`h-3 w-3 ${
                                    hasLinkedin ? "text-white" : "text-white/50"
                                  }`}
                                />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Show "No executives" only if completed and no leads found */}
                {displayCompany.leadsGenerationStatus === 'completed' &&
                 (!displayCompany.people || displayCompany.people.length === 0) && (
                  <div className="flex items-center justify-center h-32">
                    <p className="text-sm text-muted-foreground/60">
                      No executives found for this company.
                    </p>
                  </div>
                )}

                {/* Show initial loader for newly created companies without any leads yet */}
                {(!displayCompany.people || displayCompany.people.length === 0) &&
                 displayCompany.leadsGenerationStatus !== 'completed' &&
                 displayCompany.leadsGenerationStatus !== 'failed' &&
                 displayCompany.leadsGenerationStatus !== 'in_progress' &&
                 displayCompany.leadsGenerationStatus !== 'pending' &&
                 new Date().getTime() - new Date(displayCompany.createdAt).getTime() < 30 * 60 * 1000 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-8 gap-3"
                  >
                    <div className="relative">
                      <Loader2 className="w-12 h-12 text-primary animate-spin" />
                      <div className="absolute inset-0 blur-xl bg-primary/30 animate-pulse" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-white mb-1">
                        Searching for Executives...
                      </p>
                    </div>
                  </motion.div>
                )}
              </>
            ) : displayCompany ? (
              <p className="text-sm text-muted-foreground/60">
                Click "Executives" tab to view leads.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground/60">
                Select a company to view its executives.
              </p>
            )}
          </motion.div>
        )}

        {/* Company Details Tab Content */}
        {/* Company Details Tab Content */}
        {/* Company Details Tab Content */}
        {activeTab === "details" && (
          <div className="pt-1 relative min-h-[400px]">
             {/* Skeleton Overlay - Shows during initial load or forced 500ms delay only */}
             {(isCompanyLoading || showLoadingSkeleton) && (
               <Card className="absolute inset-0 z-10 bg-gradient-to-r from-[#1f3032] via-[#243f42] to-[#1b2c2d] border border-white/15 p-4 h-full">
                 <div className="flex items-start gap-3 mb-4">
                   <Skeleton className="h-12 w-12 rounded-lg bg-white/10" />
                   <div className="flex-1 space-y-2">
                     <Skeleton className="h-5 w-1/2 bg-white/10" />
                     <Skeleton className="h-3 w-1/3 bg-white/5" />
                   </div>
                 </div>
                 <div className="flex gap-3 mb-4">
                   <Skeleton className="h-8 w-8 rounded-full bg-white/10" />
                   <Skeleton className="h-8 w-8 rounded-full bg-white/10" />
                 </div>
                 <div className="space-y-2 mb-4">
                   <Skeleton className="h-3 w-full bg-white/5" />
                   <Skeleton className="h-3 w-5/6 bg-white/5" />
                   <Skeleton className="h-3 w-4/6 bg-white/5" />
                 </div>
                 <div className="space-y-2">
                   <Skeleton className="h-32 w-full rounded-lg bg-white/5" />
                 </div>
               </Card>
             )}

             {/* Actual Content */}
             <div className={`${(isCompanyLoading || showLoadingSkeleton) ? 'opacity-0 pointer-events-none absolute inset-0' : 'opacity-100 relative'}`}>
               {displayCompany ? (
                <Card className="bg-gradient-to-r from-[#1f3032] via-[#243f42] to-[#1b2c2d] border border-white/15 p-4 h-full overflow-y-auto">
                {/* Logo and Name in same row */}
                <div className="flex items-center gap-3 mb-4">
                  <div>
                    <CompanyLogoFallback
                      name={displayCompany.name}
                      logo={displayCompany.logo}
                      size="md"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white -mb-1">
                      {displayCompany.name}
                    </h3>
                    {/* Website below name */}
                    {displayCompany.website && (
                      <div className="flex items-center gap-2 text-white/80">
                        {/* <Globe className="w-4 h-4" /> */}
                        <a
                          href={getFullUrl(displayCompany.website)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm hover:text-white hover:underline"
                        >
                          {formatWebsiteUrl(displayCompany.website)}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Social Icons */}
                {(Boolean(companyLinkedIn) || Boolean(displayCompany.facebook) || Boolean(displayCompany.phone)) && (
                  <div className="flex items-center gap-2 mb-4">
                    {Boolean(companyLinkedIn) && (
                      <a
                        href={getFullUrl(companyLinkedIn || undefined)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center w-6 h-6 rounded-full border border-white bg-white text-gray-900 transition-colors hover:bg-white/90"
                        title="LinkedIn"
                      >
                        <Linkedin className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {Boolean(displayCompany.facebook) && (
                      <a
                        href={getFullUrl(displayCompany.facebook || undefined)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center w-6 h-6 rounded-full border border-white bg-white text-gray-900 transition-colors hover:bg-white/90"
                        title="Facebook"
                      >
                        <Facebook className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {/* {Boolean(displayCompany.phone) && (
                      <a
                        href={`tel:${displayCompany.phone}`}
                        className="flex items-center justify-center w-6 h-6 rounded-full border border-white bg-white text-gray-900 transition-colors hover:bg-white/90"
                        title={displayCompany.phone || "Phone"}
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                    )} */}
                  </div>
                )}

                {/* Description */}
                {(displayCompany.description || displayCompany.about) && (
                  <div className="mb-4">
                    <p className="text-sm text-white/80 leading-relaxed line-clamp-3">
                      {displayCompany.description || displayCompany.about}
                    </p>
                  </div>
                )}

                {/* Details List */}
                <div className="space-y-3.5">
                  {/* Phone Number before address as requested */}
                  {displayCompany.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-white/70 flex-shrink-0" />
                      <div className="flex-1">
                        <a
                          href={`tel:${displayCompany.phone}`}
                          className="text-sm text-white/80 hover:text-white hover:underline transition-colors"
                        >
                          {displayCompany.phone}
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Address */}
                  {displayCompany.address && (
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-white/70 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm text-white/80 leading-relaxed">
                            {displayCompany.address}
                          </p>
                        </div>
                      </div>
                      {/* Google Maps Embed */}
                      {getGoogleMapsEmbedUrl(displayCompany.address) && (
                        <div
                          className="relative w-full h-32 rounded-lg overflow-hidden border border-white/10 cursor-pointer group hover:scale-[1.02] transition-transform duration-200"
                          onClick={() => {
                            const mapsUrl = getGoogleMapsUrl(displayCompany.address);
                            if (mapsUrl) {
                              window.open(mapsUrl, "_blank");
                            }
                          }}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              const mapsUrl = getGoogleMapsUrl(displayCompany.address);
                              if (mapsUrl) {
                                window.open(mapsUrl, "_blank");
                              }
                            }
                          }}
                          title="Click to open in Google Maps"
                        >
                           {/* Map Loading Skeleton */}
                           {!mapLoaded && (
                               <Skeleton className="absolute inset-0 z-[5] w-full h-full bg-white/10 animate-pulse" />
                           )}
                          <iframe
                            src={getGoogleMapsEmbedUrl(displayCompany.address) || ""}
                            width="100%"
                            height="100%"
                            style={{ border: 0, opacity: mapLoaded ? 1 : 0, transition: 'opacity 0.3s ease-in' }}
                            allowFullScreen
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            className="pointer-events-none"
                            onLoad={() => {
                                console.log("Map loaded");
                                setMapLoaded(true);
                            }}
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                            <span className="text-xs text-white/0 group-hover:text-white/80 font-medium bg-black/50 px-3 py-1.5 rounded-lg">
                              Click to open in Google Maps
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}


                  {displayCompany.employees && (
                    <div className="flex items-center gap-2 text-sm text-white/70">
                      <Users className="w-4 h-4" />
                      <span>{displayCompany.employees} employees</span>
                    </div>
                  )}

                  {displayCompany.foundedYear && (
                    <div className="flex items-center gap-2 text-sm text-white/70">
                      <Building2 className="w-4 h-4" />
                      <span>Founded: {displayCompany.foundedYear}</span>
                    </div>
                  )}

                  {displayCompany.marketCap && (
                    <div className="flex items-center gap-2 text-sm text-white/70">
                      <TrendingUp className="w-4 h-4" />
                      <span>Market Cap: ${formatFinancialValue(displayCompany.marketCap as string)}</span>
                    </div>
                  )}
                  
                  {getRevenue() && (
                    <div className="flex items-center gap-2 text-sm text-white/70">
                      <DollarSign className="w-4 h-4" />
                      <span>Revenue: ${formatFinancialValue(getRevenue())}</span>
                    </div>
                  )}
                </div>
              </Card>
             ) : null}
             </div>
          </div>
        )}
      </div>
    </>
  );
};

export default CompanyExecutivesPanel;
