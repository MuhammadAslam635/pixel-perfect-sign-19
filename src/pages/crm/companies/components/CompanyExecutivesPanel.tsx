import { FC, useState, useEffect } from "react";
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
        <button
          onClick={() => {
            setActiveTab("executives");
            setShowLeads(true);
          }}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
            activeTab === "executives"
              ? "bg-white/10 text-white"
              : "text-white/60 hover:text-white hover:bg-white/5"
          }`}
        >
          <Users className="w-4 h-4" />
          <span className="text-sm font-medium">Executives</span>
        </button>
        <button
          onClick={() => {
            setActiveTab("details");
            setShowLeads(false);
          }}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
            activeTab === "details"
              ? "bg-white/10 text-white"
              : "text-white/60 hover:text-white hover:bg-white/5"
          }`}
        >
          <Info className="w-4 h-4" />
          <span className="text-sm font-medium">Company Details</span>
        </button>
      </div>

      {/* Executives Tab Content */}
      {activeTab === "executives" && (
        <>
          {showLeads && company ? (
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
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground/60">
                No executives found for this company.
              </p>
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
        </>
      )}

      {/* Company Details Tab Content */}
      {activeTab === "details" && company && (
        <Card className="bg-gradient-to-r from-[#1f3032] via-[#243f42] to-[#1b2c2d] border border-white/15 p-4">
          {/* Logo and Name in same row */}
          <div className="flex items-start gap-3 mb-4">
            <CompanyLogoFallback
              name={company.name}
              logo={company.logo}
              size="md"
            />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-1">
                {company.name}
              </h3>
              {/* Website below name */}
              {company.website && (
                <div className="flex items-center gap-2 text-white/80">
                  {/* <Globe className="w-4 h-4" /> */}
                  <a
                    href={getFullUrl(company.website)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm hover:text-white hover:underline"
                  >
                    {formatWebsiteUrl(company.website)}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Social Icons */}
          {(hasLinkedIn || hasFacebook || hasPhone) && (
            <div className="flex items-center gap-3 mb-4">
              {hasLinkedIn && (
                <a
                  href={getFullUrl(companyLinkedIn || undefined)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-8 h-8 rounded-full border border-white bg-white text-gray-900 transition-colors"
                  title="LinkedIn"
                >
                  <Linkedin className="w-4 h-4" />
                </a>
              )}
              {hasFacebook && (
                <a
                  href={getFullUrl(company.facebook || undefined)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-8 h-8 rounded-full border border-white bg-white text-gray-900 transition-colors"
                  title="Facebook"
                >
                  <Facebook className="w-4 h-4" />
                </a>
              )}
              {hasPhone && (
                <a
                  href={`tel:${company.phone}`}
                  className="flex items-center justify-center w-8 h-8 rounded-full border border-white bg-white text-gray-900 transition-colors"
                  title={company.phone || "Phone"}
                >
                  <Phone className="w-4 h-4" />
                </a>
              )}
            </div>
          )}

          {/* Description */}
          {(company.description || company.about) && (
            <div className="mb-4">
              <p className="text-sm text-white/80 leading-relaxed">
                {company.description || company.about}
              </p>
            </div>
          )}

          {/* Address */}
          {company.address && (
            <div className="mb-4">
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
                <div
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
                </div>
              )}
            </div>
          )}

          {/* Additional Details */}
          <div className="space-y-2">
            {company.employees && (
              <div className="flex items-center gap-2 text-sm text-white/70">
                <Users className="w-4 h-4" />
                <span>{company.employees} employees</span>
              </div>
            )}

            {company.foundedYear && (
              <div className="flex items-center gap-2 text-sm text-white/70">
                <Building2 className="w-4 h-4" />
                <span>Founded: {company.foundedYear}</span>
              </div>
            )}

            {company.marketCap && (
              <div className="flex items-center gap-2 text-sm text-white/70">
                <span>Market Cap: {company.marketCap as string}</span>
              </div>
            )}

            {getRevenue() && (
              <div className="flex items-center gap-2 text-sm text-white/70">
                <span>Revenue: {getRevenue()}</span>
              </div>
            )}
          </div>
        </Card>
      )}
    </>
  );
};

export default CompanyExecutivesPanel;
