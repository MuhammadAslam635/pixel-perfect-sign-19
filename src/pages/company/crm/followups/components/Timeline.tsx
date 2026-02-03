import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { memo } from "react";

const Timeline = memo(({ progress, totalDays }: { progress: number; totalDays: number }) => {
    return (
        <div className="relative py-12 px-4">
            {/* Status Bar */}
            <div className="w-full h-2 bg-white/10 rounded-full" />

            {/* Circular Markers */}
            {Array.from({ length: totalDays }, (_, dayIndex) => {
                const dayNumber = dayIndex + 1;
                const isCompleted = dayNumber <= progress;
                const positionRatio = totalDays > 1 ? dayIndex / (totalDays - 1) : 0;

                return (
                    <Tooltip key={dayNumber}>
                        <TooltipTrigger asChild>
                            <div
                                className="absolute z-10 flex flex-col items-center cursor-pointer"
                                style={{
                                    left: `calc(1rem + ${positionRatio * 100}% - ${positionRatio * 2}rem)`,
                                    top: "52px",
                                    transform: "translateX(-50%)",
                                }}
                            >
                                {/* Circular Marker */}
                                <div className={`w-4 h-4 rounded-full transition-all -mt-2 ${isCompleted ? "bg-cyan-400 border-2 border-cyan-400" : "bg-white border-2 border-white/20"
                                    }`} />
                                {/* Day Label */}
                                <span className={`text-[10px] mt-2 whitespace-nowrap ${isCompleted ? "text-cyan-300" : "text-white/40"
                                    }`}>
                                    Day {dayNumber}
                                </span>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{progress}/{totalDays.toString().padStart(2, "0")}</p>
                        </TooltipContent>
                    </Tooltip>
                );
            })}

            {/* Progress Bar */}
            {progress > 0 && (
                <div
                    className="absolute top-12 left-4 h-2 bg-cyan-400/50 rounded-full transition-all"
                    style={{
                        width: totalDays > 1
                            ? `calc(${((progress - 1) / (totalDays - 1)) * 100} % - ${((progress - 1) / (totalDays - 1)) * 2}rem)`
                            : "0"
                    }}
                />
            )}
        </div>
    );
});

Timeline.displayName = "Timeline";

export default Timeline;