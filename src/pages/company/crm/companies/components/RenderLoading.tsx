import { motion } from "framer-motion";
import { Search } from "lucide-react";
type ViewMode = "compact" | "detailed" | "card";

export const renderLoading = (viewMode: ViewMode) => (
    <motion.div
        key="companies-loading"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className={
            viewMode === "card"
                ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
                : "space-y-4"
        }
    >
        {Array.from({ length: viewMode === "card" ? 8 : 5 }).map((_, index) => (
            <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                    duration: 0.4,
                    delay: index * 0.1,
                    ease: "easeOut",
                }}
                className={
                    viewMode === "card"
                        ? "w-full aspect-[3/1] rounded-lg border-0 bg-gradient-to-br from-gray-800/50 to-gray-900/30 border-white/10 overflow-hidden"
                        : "rounded-[16px] sm:rounded-[20px] md:rounded-[26px] border-0 bg-gradient-to-br from-gray-800/50 to-gray-900/30 border-white/10 px-3 sm:px-4 md:px-5 lg:px-7 py-1.5 sm:py-2 pl-3 sm:pl-4 md:pl-5 lg:pl-7"
                }
            >
                <div className="flex flex-col gap-2">
                    {/* Skeleton content */}
                    <div className="flex items-center gap-2">
                        <div
                            className={`h-4 bg-white/10 rounded animate-pulse ${viewMode === "card" ? "w-full" : "w-32"
                                }`}
                        ></div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div
                            className={`h-3 bg-white/5 rounded animate-pulse ${viewMode === "card" ? "w-3/4" : "w-20"
                                }`}
                        ></div>
                        <div
                            className={`h-3 bg-white/10 rounded animate-pulse ${viewMode === "card" ? "w-1/2" : "w-16"
                                }`}
                        ></div>
                    </div>
                    {viewMode === "detailed" && (
                        <>
                            <div className="h-2 bg-white/5 rounded animate-pulse w-full"></div>
                            <div className="flex gap-2">
                                <div className="h-6 w-6 bg-white/10 rounded animate-pulse"></div>
                                <div className="h-6 w-6 bg-white/5 rounded animate-pulse"></div>
                            </div>
                        </>
                    )}
                </div>
            </motion.div>
        ))}
    </motion.div>
);

export const renderEmpty = (search: string) => (
    <motion.div
        key="companies-empty"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center justify-center py-16 px-4"
    >
        <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
            <Search className="w-6 h-6 text-white/30" />
        </div>
        <p className="text-white/70 text-base font-medium mb-1">
            {search ? "No companies found" : "No companies available"}
        </p>
        <p className="text-white/50 text-sm text-center max-w-md">
            {search
                ? "Try adjusting your search terms or clear the filter to see all companies."
                : "There are no companies in the database yet."}
        </p>
    </motion.div>
);