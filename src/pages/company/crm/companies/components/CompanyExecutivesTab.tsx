import { motion } from "framer-motion";
import { Users, Linkedin, Loader2 } from "lucide-react";
import { Company, CompanyPerson } from "@/services/companies.service";
import { AvatarFallback } from "@/components/ui/avatar-fallback";

type Props = {
    displayCompany?: Company;
    showLeads: boolean;
    onExecutiveSelect?: (executive: CompanyPerson) => void;
};

const CompanyExecutivesTab = ({ displayCompany, showLeads, onExecutiveSelect }: Props) => {
    if (!displayCompany) {
        return <p className="text-sm text-muted-foreground/60">Select a company to view its executives.</p>;
    }

    return (
        <motion.div
            key="executives"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="relative"
        >
            {showLeads && (
                <>
                    {(displayCompany.leadsGenerationStatus === "in_progress" ||
                        displayCompany.leadsGenerationStatus === "pending") && (
                            <div className="flex items-center justify-center gap-3 py-4 px-3 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 mb-3">
                                <Loader2 className="w-5 h-5 text-primary animate-spin" />
                                <p className="text-sm font-medium text-white">
                                    {displayCompany.people?.length
                                        ? "Still finding more executives..."
                                        : "Searching for executives..."}
                                </p>
                            </div>
                        )}

                    {displayCompany.people?.length > 0 && (
                        <div className="space-y-2 mb-3">
                            {displayCompany.people.map((exec, index) => {
                                const hasLinkedin = Boolean(exec.linkedin);

                                return (
                                    <div
                                        key={exec._id || exec.id || index}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => onExecutiveSelect?.(exec)}
                                        className="relative overflow-hidden rounded-xl border border-white/15 bg-gradient-to-r from-[#1f3032] via-[#243f42] to-[#1b2c2d] px-3 py-2 h-14 cursor-pointer"
                                    >
                                        <div className="flex items-center gap-2 h-full">
                                            <AvatarFallback
                                                name={exec.name || "N/A"}
                                                pictureUrl={(exec.pictureUrl || exec.photo_url || exec.image) as string}
                                                size="xs"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-semibold text-white truncate">
                                                    {exec.name || "N/A"}
                                                </p>
                                                <p className="text-[10px] text-white/60 truncate">
                                                    {exec.title || exec.position || "N/A"}
                                                </p>
                                            </div>
                                            <button
                                                disabled={!hasLinkedin}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (hasLinkedin) window.open(exec.linkedin!, "_blank");
                                                }}
                                                className="h-7 w-7 rounded-full border border-white/15 flex items-center justify-center"
                                            >
                                                <Linkedin className="h-3 w-3 text-white" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            )}
        </motion.div>
    );
};

export default CompanyExecutivesTab;
