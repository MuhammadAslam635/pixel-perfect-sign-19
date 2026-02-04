import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon } from "lucide-react";
import { formatDate } from "@/utils/commonFunctions";

interface EventsSectionProps {
    events: any[];
}

const EventsSection: React.FC<EventsSectionProps> = ({ events }) => {
    if (events.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.7 }}
        >
            <Card className="bg-white/5 backdrop-blur-sm border-white/10 shadow-lg">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-white drop-shadow-md">
                        <CalendarIcon className="w-5 h-5" />
                        Session Events
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <motion.div
                        className="space-y-2 max-h-64 overflow-y-auto scrollbar-hide"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.4, delay: 0.9 }}
                    >
                        {events.map((event: any, index: number) => (
                            <motion.div
                                key={index}
                                className="p-3 bg-white/5 rounded-lg border border-white/10"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    duration: 0.4,
                                    delay: 1.0 + index * 0.05,
                                }}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1">
                                        <p className="font-semibold text-sm text-white">
                                            {event.event || event.type || "Event"}
                                        </p>
                                        {event.role && (
                                            <Badge
                                                variant="outline"
                                                className="mt-1 text-xs border-white/20 text-gray-300 rounded-full"
                                            >
                                                {event.role}
                                            </Badge>
                                        )}
                                        {event.content && (
                                            <p className="text-xs text-gray-400 mt-2 line-clamp-2">
                                                {event.content}
                                            </p>
                                        )}
                                        {event.details && (
                                            <pre className="text-xs text-gray-400 mt-2 whitespace-pre-wrap">
                                                {JSON.stringify(event.details, null, 2)}
                                            </pre>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-400">
                                            {event.timestamp ? formatDate(event.timestamp) : "N/A"}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default EventsSection;