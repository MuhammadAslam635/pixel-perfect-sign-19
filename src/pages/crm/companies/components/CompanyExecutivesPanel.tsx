import { FC, useState, useEffect } from "react";
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
} from "lucide-react";
import { Company, CompanyPerson } from "@/services/companies.service";
import { CompanyLogoFallback } from "@/components/ui/company-logo-fallback";
import { Card } from "@/components/ui/card";

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
  const [activeTab, setActiveTab] = useState<TabType>("executives");
  const [showLeads, setShowLeads] = useState(false);

  // Automatically show leads when a company is selected
  useEffect(() => {
    if (company?._id) {
      setActiveTab("executives");
      setShowLeads(true);
    }
  }, [company?._id]);

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
        <motion.button
          onClick={() => {
            setActiveTab("details");
            setShowLeads(false);
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
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait" initial={false}>
        {activeTab === "executives" && (
          <motion.div
            key="executives"
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.97, x: -30 }}
            transition={{
              type: "spring",
              stiffness: 350,
              damping: 30,
              mass: 0.6,
            }}
            className="relative"
          >
            {showLeads && company ? (
              company.people && company.people.length > 0 ? (
                company.people.map((exec, index) => {
                  const hasLinkedin = Boolean(exec.linkedin);

                  return (
                    <motion.div
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
                      initial={{ opacity: 0, x: -40, scale: 0.93, y: 10 }}
                      animate={{ opacity: 1, x: 0, scale: 1, y: 0 }}
                      exit={{ opacity: 0, x: 40, scale: 0.93 }}
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 28,
                        mass: 0.6,
                        delay: index * 0.06,
                      }}
                      whileHover={{
                        scale: 1.03,
                        x: 4,
                        transition: { duration: 0.2 },
                      }}
                      whileTap={{ scale: 0.97 }}
                      className="relative overflow-hidden rounded-xl sm:rounded-2xl border border-white/15 bg-gradient-to-r from-[#1f3032] via-[#243f42] to-[#1b2c2d] px-2 sm:px-3 py-2 mb-2 max-w-sm h-14 transition-all duration-300 hover:shadow-[0_12px_32px_rgba(0,0,0,0.3)] sm:before:absolute sm:before:content-[''] sm:before:left-0 sm:before:top-1/2 sm:before:-translate-y-1/2 sm:before:h-[55%] sm:before:w-[3px] lg:before:w-[4px] sm:before:rounded-full sm:before:bg-white/70 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/60"
                    >
                      <div className="flex items-center justify-between gap-2 h-full">
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
                    </motion.div>
                  );
                })
              ) : (
                // Check if leads are being generated OR company was just created
                (company.leadsGenerationStatus === 'in_progress' ||
                 company.leadsGenerationStatus === 'pending' ||
                 // Show loader for new companies (created in last 30 minutes) without leads AND not completed/failed
                 (company.leadsGenerationStatus !== 'completed' &&
                  company.leadsGenerationStatus !== 'failed' &&
                  new Date().getTime() - new Date(company.createdAt).getTime() < 30 * 60 * 1000)) ? (
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
                        {company.leadsGenerationStatus === 'in_progress' || company.leadsGenerationStatus === 'pending'
                          ? 'Generating Leads...'
                          : 'Searching for Executives...'}
                      </p>
                      {company.leadsGenerationProgress && (
                        <p className="text-xs text-white/60">
                          {company.leadsGenerationProgress?.current || 0} / {company.leadsGenerationProgress?.total || 0} leads found
                        </p>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <p className="text-sm text-muted-foreground/60">
                    No executives found for this company.
                  </p>
                )
              )
            ) : company ? (
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
        {activeTab === "details" && company && (
          <motion.div
            key="details"
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.97, x: 30 }}
            transition={{
              type: "spring",
              stiffness: 350,
              damping: 30,
              mass: 0.6,
            }}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.3 }}
            >
              <Card className="bg-gradient-to-r from-[#1f3032] via-[#243f42] to-[#1b2c2d] border border-white/15 p-4">
                {/* Logo and Name in same row */}
                <motion.div
                  className="flex items-start gap-3 mb-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                >
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.25, type: "spring", stiffness: 300 }}
                  >
                    <CompanyLogoFallback
                      name={company.name}
                      logo={company.logo}
                      size="md"
                    />
                  </motion.div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {company.name}
                    </h3>
                    {/* Website below name */}
                    {company.website && (
                      <motion.div
                        className="flex items-center gap-2 text-white/80"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.4 }}
                      >
                        {/* <Globe className="w-4 h-4" /> */}
                        <a
                          href={getFullUrl(company.website)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm hover:text-white hover:underline"
                        >
                          {formatWebsiteUrl(company.website)}
                        </a>
                      </motion.div>
                    )}
                  </div>
                </motion.div>

                {/* Social Icons */}
                {(hasLinkedIn || hasFacebook || hasPhone) && (
                  <motion.div
                    className="flex items-center gap-3 mb-4"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35, duration: 0.4 }}
                  >
                    {hasLinkedIn && (
                      <motion.a
                        href={getFullUrl(companyLinkedIn || undefined)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center w-8 h-8 rounded-full border border-white bg-white text-gray-900 transition-colors"
                        title="LinkedIn"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        whileTap={{ scale: 0.95 }}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{
                          delay: 0.4,
                          type: "spring",
                          stiffness: 400,
                        }}
                      >
                        <Linkedin className="w-4 h-4" />
                      </motion.a>
                    )}
                    {hasFacebook && (
                      <motion.a
                        href={getFullUrl(company.facebook || undefined)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center w-8 h-8 rounded-full border border-white bg-white text-gray-900 transition-colors"
                        title="Facebook"
                        whileHover={{ scale: 1.1, rotate: -5 }}
                        whileTap={{ scale: 0.95 }}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{
                          delay: 0.45,
                          type: "spring",
                          stiffness: 400,
                        }}
                      >
                        <Facebook className="w-4 h-4" />
                      </motion.a>
                    )}
                    {hasPhone && (
                      <motion.a
                        href={`tel:${company.phone}`}
                        className="flex items-center justify-center w-8 h-8 rounded-full border border-white bg-white text-gray-900 transition-colors"
                        title={company.phone || "Phone"}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        whileTap={{ scale: 0.95 }}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{
                          delay: 0.5,
                          type: "spring",
                          stiffness: 400,
                        }}
                      >
                        <Phone className="w-4 h-4" />
                      </motion.a>
                    )}
                  </motion.div>
                )}

                {/* Description */}
                {(company.description || company.about) && (
                  <motion.div
                    className="mb-4"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.4 }}
                  >
                    <p className="text-sm text-white/80 leading-relaxed">
                      {company.description || company.about}
                    </p>
                  </motion.div>
                )}

                {/* Address */}
                {company.address && (
                  <motion.div
                    className="mb-4"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45, duration: 0.4 }}
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <MapPin className="w-4 h-4 text-white/70 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm text-white/80 leading-relaxed">
                          {company.address}
                        </p>
                      </div>
                    </div>
                    {/* Google Maps Embed */}
                    {getGoogleMapsEmbedUrl(company.address) && (
                      <motion.div
                        className="relative w-full h-32 rounded-lg overflow-hidden border border-white/10 cursor-pointer group"
                        onClick={() => {
                          const mapsUrl = getGoogleMapsUrl(company.address);
                          if (mapsUrl) {
                            window.open(mapsUrl, "_blank");
                          }
                        }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            const mapsUrl = getGoogleMapsUrl(company.address);
                            if (mapsUrl) {
                              window.open(mapsUrl, "_blank");
                            }
                          }
                        }}
                        title="Click to open in Google Maps"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                          delay: 0.5,
                          type: "spring",
                          stiffness: 300,
                        }}
                        whileHover={{ scale: 1.02 }}
                      >
                        <iframe
                          src={getGoogleMapsEmbedUrl(company.address) || ""}
                          width="100%"
                          height="100%"
                          style={{ border: 0 }}
                          allowFullScreen
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                          className="pointer-events-none"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                          <span className="text-xs text-white/0 group-hover:text-white/80 font-medium bg-black/50 px-3 py-1.5 rounded-lg">
                            Click to open in Google Maps
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {/* Additional Details */}
                <motion.div
                  className="space-y-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.55, duration: 0.4 }}
                >
                  {company.employees && (
                    <motion.div
                      className="flex items-center gap-2 text-sm text-white/70"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6, duration: 0.3 }}
                    >
                      <Users className="w-4 h-4" />
                      <span>{company.employees} employees</span>
                    </motion.div>
                  )}

                  {company.foundedYear && (
                    <motion.div
                      className="flex items-center gap-2 text-sm text-white/70"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.65, duration: 0.3 }}
                    >
                      <Building2 className="w-4 h-4" />
                      <span>Founded: {company.foundedYear}</span>
                    </motion.div>
                  )}

                  {company.marketCap && (
                    <motion.div
                      className="flex items-center gap-2 text-sm text-white/70"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7, duration: 0.3 }}
                    >
                      <span>Market Cap: {company.marketCap as string}</span>
                    </motion.div>
                  )}

                  {getRevenue() && (
                    <motion.div
                      className="flex items-center gap-2 text-sm text-white/70"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.75, duration: 0.3 }}
                    >
                      <span>Revenue: {getRevenue()}</span>
                    </motion.div>
                  )}
                </motion.div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CompanyExecutivesPanel;
