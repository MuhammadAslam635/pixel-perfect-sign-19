import { Card } from "@/components/ui/card";
import { CompanyLogoFallback } from "@/components/ui/company-logo-fallback";
import { Company } from "@/services/companies.service";
import {
    Users,
    Building2,
    Phone,
    MapPin,
    DollarSign,
    TrendingUp,
    Linkedin,
    Facebook,
} from "lucide-react";
import {
    formatFinancialValue,
    formatWebsiteUrl,
    getFullUrl,
    getGoogleMapsEmbedUrl,
    getGoogleMapsUrl,
} from "@/utils/commonFunctions";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

type Props = {
    displayCompany?: Company;
    isDescriptionExpanded: boolean;
    setIsDescriptionExpanded: (v: boolean) => void;
};

const CompanyDetailsTab = ({
    displayCompany,
    isDescriptionExpanded,
    setIsDescriptionExpanded,
}: Props) => {
    if (!displayCompany) return null;
    const [mapLoaded, setMapLoaded] = useState(false);
    const companyLinkedIn = displayCompany?.linkedinUrl || displayCompany?.people?.[0]?.linkedin || (displayCompany?.website?.includes("linkedin.com") ? displayCompany.website : null);


    return (
        <Card className="bg-gradient-to-r from-[#1f3032] via-[#243f42] to-[#1b2c2d] border border-white/15 p-4 h-full">
            <div className="flex items-center gap-3 mb-4">
                <CompanyLogoFallback
                    name={displayCompany.name}
                    logo={displayCompany.logo}
                    size="md"
                />
                <div>
                    <h3 className="text-lg font-semibold text-white">{displayCompany.name}</h3>
                    {displayCompany.website && (
                        <a
                            href={getFullUrl(displayCompany.website)}
                            target="_blank"
                            className="text-sm text-white/70 hover:underline"
                        >
                            {formatWebsiteUrl(displayCompany.website)}
                        </a>
                    )}
                </div>
            </div>
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

            {(displayCompany.description || displayCompany.about) && (
                <p
                    onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                    className={`text-sm text-white/80 cursor-pointer ${isDescriptionExpanded ? "" : "line-clamp-3"
                        }`}
                >
                    {displayCompany.description || displayCompany.about}
                </p>
            )}

            <div className="space-y-3 mt-4 text-sm text-white/70">
                {displayCompany.phone && (
                    <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <span>{displayCompany.phone}</span>
                    </div>
                )}

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
                                    if (mapsUrl) window.open(mapsUrl, "_blank");
                                }}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        const mapsUrl = getGoogleMapsUrl(displayCompany.address);
                                        if (mapsUrl) window.open(mapsUrl, "_blank");
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
                                    style={{
                                        border: 0,
                                        opacity: mapLoaded ? 1 : 0,
                                        transition: "opacity 0.3s ease-in",
                                    }}
                                    allowFullScreen
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                    className="pointer-events-none"
                                    onLoad={() => setMapLoaded(true)}
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
                    <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>{displayCompany.employees} employees</span>
                    </div>
                )}

                {displayCompany.foundedYear && (
                    <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        <span>Founded {displayCompany.foundedYear}</span>
                    </div>
                )}

                {displayCompany.marketCap && (
                    <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        <span>
                            Market Cap: ${formatFinancialValue(displayCompany.marketCap as string)}
                        </span>
                    </div>
                )}

                {displayCompany.revenue && (
                    <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        <span>Revenue: ${formatFinancialValue(displayCompany.revenue)}</span>
                    </div>
                )}
            </div>
        </Card>
    );
};

export default CompanyDetailsTab;