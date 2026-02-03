import { FC } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CompanyLogoFallback } from "@/components/ui/company-logo-fallback";
import { ActiveNavButton } from "@/components/ui/primary-btn";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import usePermissions from "@/hooks/usePermissions";
import { Company } from "@/services/companies.service";
import { formatWebsiteUrl, getFullUrl, isCreatedToday } from "@/utils/commonFunctions";
import { Linkedin, Loader2, Trash2, Users } from "lucide-react";

type ViewMode = "compact" | "detailed" | "card";

interface RenderCompanyCardProps {
    company: Company;
    selectedCompanyId: string;
    onSelectCompany: (id: string) => void;
    onDesktopExecutivesFocus?: () => void;
    viewMode?: ViewMode;
    setMobileExecutivesView?: (value: boolean) => void;
    handleDeleteClick?: (company: Company, e: React.MouseEvent<HTMLButtonElement>) => void;
}

const RenderCompanyCard: FC<RenderCompanyCardProps> = ({
    company,
    selectedCompanyId,
    onSelectCompany,
    onDesktopExecutivesFocus,
    viewMode = "detailed",
    setMobileExecutivesView,
    handleDeleteClick,
}) => {
    const { canDelete } = usePermissions();
    const isActive = selectedCompanyId === company._id;
    const employeeCount = company.employees
        ? `${company.employees} employees`
        : "N/A";
    const primaryExecutive = company.people?.[0];
    const primaryEmail =
        primaryExecutive?.email || primaryExecutive?.emails?.[0] || null;
    const primaryLinkedIn = primaryExecutive?.linkedin || null;

    if (viewMode === "card") {
        return (
            <Card
                key={company._id}
                className={`relative flex items-center gap-3 overflow-hidden border-0 rounded-xl p-2 pb-3 transition-all duration-300 hover:bg-white/5 hover:shadow-[0_20px_45px_rgba(0,0,0,0.32)] cursor-pointer backdrop-blur-[22.6px]`}
                style={{
                    background: `linear-gradient(180deg, rgba(104, 177, 184, 0.1) 0%, rgba(104, 177, 184, 0.08) 100%), radial-gradient(50% 100% at 50% 0%, rgba(104, 177, 184, 0.1) 0%, rgba(104, 177, 184, 0) 100%)`,
                }}
                onClick={() => {
                    if (window.innerWidth < 768) {
                        setMobileExecutivesView?.(true);
                        onSelectCompany(company._id);
                    } else {
                        onSelectCompany(company._id);
                        onDesktopExecutivesFocus?.();
                    }
                }}
            >
                {/* Company Logo */}
                <CompanyLogoFallback
                    name={company.name}
                    logo={company.logo}
                    size="md"
                />

                {/* Content */}
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                    {/* First Row: Company Name */}
                    <h3 className="text-xs sm:text-sm font-semibold text-white leading-tight flex items-center gap-2 min-w-0">
                        {company.website ? (
                            <a
                                href={getFullUrl(company.website)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="overflow-hidden text-ellipsis whitespace-nowrap min-w-0 flex-1 hover:underline transition-colors cursor-pointer"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {company.name}
                            </a>
                        ) : (
                            <span className="overflow-hidden text-ellipsis whitespace-nowrap min-w-0 flex-1">
                                {company.name}
                            </span>
                        )}
                        {company.createdAt && isCreatedToday(company.createdAt) && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-green-500 to-emerald-500 text-white flex-shrink-0">
                                NEW
                            </span>
                        )}
                        {company.leadsGenerationStatus === 'in_progress' && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-blue-500 to-cyan-500 text-white flex-shrink-0">
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                        Generating Leads
                                    </span>
                                </TooltipTrigger>
                                <TooltipContent sideOffset={8}>
                                    <p>
                                        {company.leadsGenerationProgress?.current || 0} / {company.leadsGenerationProgress?.total || 0} leads found
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {/* No Leads Found Label */}
                        {company.leadsGenerationStatus === "completed" &&
                            (!company.people || company.people.length === 0) && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-gray-500 to-gray-600 text-white flex-shrink-0 cursor-help" title="Lead enrichment completed but no contacts were found">
                                    NO LEADS FOUND
                                </span>
                            )}
                    </h3>

                    {/* Second Row: Industry */}
                    {company.industry && (
                        <span className="text-white/60 font-normal text-xs block truncate">
                            {company.industry}
                        </span>
                    )}

                    {/* Third Row: Scraping Date */}
                    {company.createdAt && (
                        <div className="flex items-center gap-1 min-w-0 mt-0.5">
                            <span className="text-[9px] sm:text-[10px] text-white/50">
                                {new Date(company.createdAt).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                })}
                            </span>
                        </div>
                    )}
                </div>

                {/* Delete Button */}
                {canDelete("companies") && handleDeleteClick && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                className="absolute top-12 right-2 h-6 w-6 sm:h-7 sm:w-7 rounded-full flex items-center justify-center border border-white bg-white text-gray-900 hover:bg-white/80 hover:text-gray-950 transition-colors duration-200 z-10"
                                onClick={(e) => handleDeleteClick(company, e)}
                                aria-label="Delete company"
                            >
                                <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent sideOffset={8}>
                            <p>Delete company</p>
                        </TooltipContent>
                    </Tooltip>
                )}
            </Card>
        );
    }

    // Default list view (compact/detailed)
    return (
        <Card
            key={company._id}
            className={`relative flex flex-col gap-0.5 sm:gap-1 md:flex-row md:items-center md:justify-between overflow-hidden border-0 mb-1.5 sm:mb-2 rounded-[16px] sm:rounded-[20px] md:rounded-[30px] px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 transition-all duration-300 hover:bg-white/5 hover:shadow-[0_20px_45px_rgba(0,0,0,0.32)] ${viewMode !== "compact" ? "backdrop-blur-[22.6px]" : ""
                }`}
            style={{
                background: `linear-gradient(180deg, rgba(104, 177, 184, 0.1) 0%, rgba(104, 177, 184, 0.08) 100%), radial-gradient(50% 100% at 50% 0%, rgba(104, 177, 184, 0.1) 0%, rgba(104, 177, 184, 0) 100%)`,
            }}
        >
            <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 text-white/90">
                    {company.website ? (
                        <a
                            href={getFullUrl(company.website)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs sm:text-sm font-semibold text-white text-center sm:text-left sm:mx-0 mx-auto hover:underline transition-colors cursor-pointer"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {company.name}
                        </a>
                    ) : (
                        <div className="text-xs sm:text-sm font-semibold text-white text-center sm:text-left sm:mx-0 mx-auto">
                            {company.name}
                        </div>
                    )}
                    {company.createdAt && isCreatedToday(company.createdAt) && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                            NEW
                        </span>
                    )}
                    {company.leadsGenerationStatus === 'in_progress' && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    Generating Leads
                                </span>
                            </TooltipTrigger>
                            <TooltipContent sideOffset={8}>
                                <p>
                                    {company.leadsGenerationProgress?.current || 0} / {company.leadsGenerationProgress?.total || 0} leads found
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    )}
                    {/* No Leads Found Label */}
                    {company.leadsGenerationStatus === "completed" &&
                        (!company.people || company.people.length === 0) && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-gray-500 to-gray-600 text-white flex-shrink-0 cursor-help" title="Lead enrichment completed but no contacts were found">
                                NO LEADS FOUND
                            </span>
                        )}
                    {viewMode === "compact" && (company.industry && (
                        <span className="text-xs text-white/70 font-medium">
                            | {company.industry}
                        </span>
                    ))}
                </div>
                {viewMode === "detailed" && company.industry && (
                    <>
                        <span className="text-white/60 font-normal text-xs">
                            {company.industry}
                        </span>
                    </>
                )}
                {/* Mobile: Side by side layout */}
                {viewMode === "detailed" && (
                    <div className="mt-0.5 sm:mt-1 md:mt-2 md:hidden flex flex-row items-center justify-between gap-3 sm:gap-4">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-white/75">
                            <Badge className="rounded-full bg-white/15 text-white border-white/20 px-3 sm:px-4 py-1 text-xs">
                                {employeeCount}
                            </Badge>
                            {primaryLinkedIn && (
                                <div className="flex items-center gap-1.5 sm:gap-2 bg-white/10 border border-white/20 rounded-full px-2 sm:px-3 py-1 max-w-[150px] sm:max-w-[220px]">
                                    <Linkedin className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-white/85 flex-shrink-0" />
                                    <span className="font-medium text-white/85 truncate text-xs">
                                        {formatWebsiteUrl(primaryLinkedIn)}
                                    </span>
                                </div>
                            )}
                            {primaryEmail && (
                                <span className="rounded-full border border-white/15 bg-white/10 px-3 sm:px-4 py-1 font-medium text-white/80 text-xs truncate max-w-[200px]">
                                    {primaryEmail}
                                </span>
                            )}
                        </div>
                        <div className="flex flex-row gap-2 items-center justify-end text-white/80">
                            {company.address && (
                                <p className="text-xs text-white/55 text-right max-w-[220px]">
                                    {company.address}
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>
            <div className="w-full md:w-[240px] lg:w-[260px] flex flex-col items-center md:items-end gap-0.5 sm:gap-1 md:gap-2 text-white/80 md:ml-4 lg:ml-8">
                {viewMode === "detailed" && (
                    <div className="hidden md:flex flex-row md:flex-col gap-1.5 md:gap-1 items-center md:items-end">
                        {company.country && (
                            <p className="text-xs text-white/55 text-center md:text-right max-w-full md:max-w-[220px] flex-1 md:flex-none">
                                {company.country}
                            </p>
                        )}
                    </div>
                )}
                {/* Scraping Date - Above View Details Button */}
                {company.createdAt && (
                    <p className="text-[10px] sm:text-xs text-white/50 text-center md:text-right">
                        {new Date(company.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                        })}
                    </p>
                )}
                <div className="flex items-center gap-1.5">
                    {canDelete("companies") && handleDeleteClick && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    className="h-7 w-7 sm:h-8 sm:w-8 rounded-full flex items-center justify-center border border-white bg-white text-gray-900 hover:bg-white/80 hover:text-gray-950 transition-colors duration-200"
                                    onClick={(e) => handleDeleteClick(company, e)}
                                    aria-label="Delete company"
                                >
                                    <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent sideOffset={8}>
                                <p>Delete company</p>
                            </TooltipContent>
                        </Tooltip>
                    )}
                    <ActiveNavButton
                        icon={Users}
                        text={isActive ? "Close Details" : "View Details"}
                        onClick={() => {
                            if (window.innerWidth < 768) {
                                setMobileExecutivesView?.(true);
                                onSelectCompany(company._id);
                            } else {
                                onSelectCompany(company._id);
                                onDesktopExecutivesFocus?.();
                            }
                        }}
                        className="w-auto md:w-auto ml-auto md:ml-0 text-[10px] px-1.5 py-0.5 h-6"
                    />
                </div>
            </div>
        </Card>
    );
};

export default RenderCompanyCard;