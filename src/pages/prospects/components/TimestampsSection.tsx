import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClockIcon } from "lucide-react";
import type { Client } from "@/services/clients.service";
import { formatDate } from "@/utils/commonFunctions";

interface TimestampsSectionProps {
    client: Client;
}

const TimestampsSection: React.FC<TimestampsSectionProps> = ({ client }) => {
    const timestamps = [
        { label: "Created in System:", value: client.createdAt, delay: 1.0 },
        { label: "Last Updated:", value: client.updatedAt, delay: 1.1 },
        { label: "Airtable Created:", value: client.airtableCreatedTime, delay: 1.2 },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.8 }}
        >
            <Card className="bg-white/5 backdrop-blur-sm border-white/10 shadow-lg">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-white drop-shadow-md">
                        <ClockIcon className="w-5 h-5" />
                        Timestamps
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2 text-sm">
                        {timestamps.map((timestamp, index) => (
                            <motion.div
                                key={index}
                                className="flex justify-between"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.4, delay: timestamp.delay }}
                            >
                                <span className="text-gray-300/80">{timestamp.label}</span>
                                <span className="text-white">{formatDate(timestamp.value)}</span>
                            </motion.div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default TimestampsSection;