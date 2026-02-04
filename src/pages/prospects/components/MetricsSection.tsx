import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquareIcon } from "lucide-react";
import type { Client } from "@/services/clients.service";

interface MetricsSectionProps {
    client: Client;
}

const MetricsSection: React.FC<MetricsSectionProps> = ({ client }) => {
    const metrics = [
        {
            label: "Total Messages",
            value: client.messagesTotal,
            color: "text-white",
            delay: 0.6,
        },
        {
            label: "Avg Response",
            value: `${client.averageResponse}ms`,
            color: "text-white",
            delay: 0.7,
        },
        {
            label: "Tool Calls (Success)",
            value: client.toolCallsSuccess,
            color: "text-green-400",
            delay: 0.8,
        },
        {
            label: "Tool Calls (Failed)",
            value: client.toolCallsFailed,
            color: "text-red-400",
            delay: 0.9,
        },
        {
            label: "Avg Tool Duration",
            value: `${client.averageToolDuration}ms`,
            color: "text-white",
            delay: 1.0,
            colSpan: "col-span-2",
        },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.5 }}
        >
            <Card className="bg-white/5 backdrop-blur-sm border-white/10 shadow-lg">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-white drop-shadow-md">
                        <MessageSquareIcon className="w-5 h-5" />
                        Session Metrics
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {metrics.map((metric, index) => (
                            <motion.div
                                key={index}
                                className={`text-center p-4 bg-white/5 border border-white/10 rounded-lg ${metric.colSpan || ""}`}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5, delay: metric.delay }}
                            >
                                <p className={`text-2xl font-bold ${metric.color}`}>
                                    {metric.value}
                                </p>
                                <p className="text-sm text-gray-300/80">{metric.label}</p>
                            </motion.div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default MetricsSection;