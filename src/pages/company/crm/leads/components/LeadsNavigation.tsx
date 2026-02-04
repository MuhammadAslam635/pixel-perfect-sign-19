// components/leads/LeadsNavigation.tsx
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { MultiSelect } from "@/components/ui/multi-select";
import { Layers, Sparkles } from "lucide-react";
import SeniorityQuickSelector from "@/pages/company/crm/leads/lead-enrichment/SeniorityQuickSelector";
import type { SeniorityLevel, SeniorityOption } from "@/types/leadEnrichment";
import { Company } from "@/services/companies.service";
import { CrmNavigation } from "../../shared/components/CrmNavigation";
import { FilterButton, LeadsFiltersInline, SearchInput } from "../../shared/components";

interface LeadsNavigationProps {
    // CRM Navigation
    canCreate: boolean;
    // Seniority & Enrichment
    selectedSeniorities: SeniorityLevel[];
    onSenioritiesChange: (seniorities: SeniorityLevel[]) => void;
    seniorityOptions: SeniorityOption[];
    onEnrichmentClick: () => void;
    // Search & Filters
    leadsSearch: string;
    onSearchChange: (search: string) => void;
    // Company Filter
    leadsCompanyFilter: string[];
    onCompanyFilterChange: (filter: string[]) => void;
    allCompaniesForFilter: Company[];
    // Advanced Filters
    leadFiltersOpen: boolean;
    onFiltersOpenChange: (open: boolean) => void;
    hasLeadAdvancedFilters: boolean;
    // Filter States
    leadsCountryFilter: string[];
    onCountryFilterChange: (filter: string[]) => void;
    leadsSeniorityFilter: string[];
    onSeniorityFilterChange: (filter: string[]) => void;
    leadsStageFilter: string[];
    onStageFilterChange: (filter: string[]) => void;
    leadsSortBy: string;
    onSortByChange: (sortBy: string) => void;
    leadsHasEmailFilter: boolean;
    onHasEmailFilterChange: (filter: boolean) => void;
    leadsHasPhoneFilter: boolean;
    onHasPhoneFilterChange: (filter: boolean) => void;
    leadsHasLinkedinFilter: boolean;
    onHasLinkedinFilterChange: (filter: boolean) => void;
    leadsHasFavouriteFilter: boolean;
    onHasFavouriteFilterChange: (filter: boolean) => void;
    // Reset
    onResetFilters: () => void;
}

export const LeadsNavigation = ({
    canCreate,
    selectedSeniorities,
    onSenioritiesChange,
    seniorityOptions,
    onEnrichmentClick,
    leadsSearch,
    onSearchChange,
    leadsCompanyFilter,
    onCompanyFilterChange,
    allCompaniesForFilter,
    leadFiltersOpen,
    onFiltersOpenChange,
    hasLeadAdvancedFilters,
    leadsCountryFilter,
    onCountryFilterChange,
    leadsSeniorityFilter,
    onSeniorityFilterChange,
    leadsStageFilter,
    onStageFilterChange,
    leadsSortBy,
    onSortByChange,
    leadsHasEmailFilter,
    onHasEmailFilterChange,
    leadsHasPhoneFilter,
    onHasPhoneFilterChange,
    leadsHasLinkedinFilter,
    onHasLinkedinFilterChange,
    leadsHasFavouriteFilter,
    onHasFavouriteFilterChange,
    onResetFilters,
}: LeadsNavigationProps) => {
    return (
        <div className="flex items-center justify-between gap-4 mb-4">
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }}
                className="flex-shrink-0"
            >
                <CrmNavigation />
            </motion.div>

            {/* Filters Bar */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }}
                className="flex flex-col sm:flex-row justify-end items-stretch sm:items-center gap-1.5 sm:gap-2 md:gap-3 min-w-0 flex-1"
            >
                {/* Enrich Leads Section - Always Visible */}
                <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Seniority Quick Selector - Show only if user has create permission for leads */}
                    {canCreate && (
                        <SeniorityQuickSelector
                            selectedSeniorities={selectedSeniorities}
                            onChange={onSenioritiesChange}
                            seniorityOptions={seniorityOptions}
                        />
                    )}

                    {/* Enrich Leads Button */}
                    {canCreate && (
                        <Button
                            onClick={onEnrichmentClick}
                            className="bg-gradient-to-r from-[#69B4B7] to-[#3E64B4] hover:from-[#69B4B7]/80 hover:to-[#3E64B4]/80 text-white font-semibold rounded-full px-4 sm:px-6 h-10 shadow-[0_5px_18px_rgba(103,176,183,0.35)] hover:shadow-[0_8px_24px_rgba(103,176,183,0.45)] transition-all whitespace-nowrap"
                        >
                            <Sparkles className="w-4 h-4" />
                            <span className="hidden sm:inline">Find Leads</span>
                            <span className="sm:hidden">Find</span>
                        </Button>
                    )}
                </div>

                {/* Controls Container */}
                <div className="flex flex-col sm:flex-row flex-1 items-stretch sm:items-center gap-1.5 sm:gap-2 md:gap-3 order-1 lg:order-2">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 sm:gap-2 flex-1">
                        <div className="flex w-full flex-wrap items-center justify-end gap-1.5 sm:gap-2">
                            {/* Search Input */}
                            <SearchInput
                                placeholder="Search leads by name, email, or company..."
                                value={leadsSearch}
                                onChange={onSearchChange}
                            />

                            {/* Company Filter Dropdown */}
                            <div className="relative w-56">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
                                    <Layers className="w-4 h-4 text-gray-400" />
                                </div>
                                <MultiSelect
                                    options={allCompaniesForFilter.map((company) => ({
                                        value: company._id,
                                        label: company.name,
                                    }))}
                                    value={leadsCompanyFilter}
                                    onChange={onCompanyFilterChange}
                                    placeholder="All Companies"
                                    searchPlaceholder="Search companies..."
                                    emptyMessage="No companies found."
                                    className="pl-10 h-9 text-xs"
                                    maxDisplayItems={1}
                                    popoverWidth="w-[320px]"
                                    showCount={true}
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <AnimatePresence mode="wait">
                                    {!leadFiltersOpen ? (
                                        <motion.div
                                            key="filter-button"
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ duration: 0.15 }}
                                        >
                                            <FilterButton
                                                hasFilters={hasLeadAdvancedFilters}
                                                onClick={() => onFiltersOpenChange(true)}
                                            />
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="filters-inline"
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ duration: 0.2, ease: "easeOut" }}
                                            className="flex items-center gap-2"
                                        >
                                            <LeadsFiltersInline
                                                countryFilter={leadsCountryFilter}
                                                onCountryFilterChange={onCountryFilterChange}
                                                seniorityFilter={leadsSeniorityFilter}
                                                onSeniorityFilterChange={onSeniorityFilterChange}
                                                stageFilter={leadsStageFilter}
                                                onStageFilterChange={onStageFilterChange}
                                                sortBy={leadsSortBy}
                                                onSortByChange={onSortByChange}
                                                hasEmailFilter={leadsHasEmailFilter}
                                                onHasEmailFilterChange={onHasEmailFilterChange}
                                                hasPhoneFilter={leadsHasPhoneFilter}
                                                onHasPhoneFilterChange={onHasPhoneFilterChange}
                                                hasLinkedinFilter={leadsHasLinkedinFilter}
                                                onHasLinkedinFilterChange={onHasLinkedinFilterChange}
                                                hasFavouriteFilter={leadsHasFavouriteFilter}
                                                onHasFavouriteFilterChange={onHasFavouriteFilterChange}
                                                hasFilters={hasLeadAdvancedFilters}
                                                onResetFilters={onResetFilters}
                                            />
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: 0.1, duration: 0.15 }}
                                            >
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-8 w-8 p-0 bg-accent text-white hover:bg-accent/80 rounded-full flex items-center justify-center"
                                                    onClick={() => onFiltersOpenChange(false)}
                                                >
                                                    <svg
                                                        className="w-4 h-4"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M6 18L18 6M6 6l12 12"
                                                        />
                                                    </svg>
                                                </Button>
                                            </motion.div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};