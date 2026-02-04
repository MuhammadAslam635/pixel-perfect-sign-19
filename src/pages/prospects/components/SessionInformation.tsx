import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ActivityIcon } from "lucide-react";
import type { Client } from "@/services/clients.service";
import { formatDate, formatDuration, getStatusColorClientDetails } from "@/utils/commonFunctions";

interface SessionInformationProps {
    client: Client;
}

const SessionInformation: React.FC<SessionInformationProps> = ({ client }) => {
    const sessionDetails = [
        { label: "Session ID", value: client.sessionId, isCode: true },
        { label: "Status", value: client.status, isBadge: true },
        { label: "Start Time", value: formatDate(client.startTime) },
        { label: "End Time", value: formatDate(client.endTime) },
        { label: "Duration", value: formatDuration(client.duration) },
        { label: "Airtable ID", value: client.airtableId, isCode: true },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }}
        >
            <Card className="bg-white/5 backdrop-blur-sm border-white/10 shadow-lg">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-white drop-shadow-md">
                        <ActivityIcon className="w-5 h-5" />
                        Session Information
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {sessionDetails.map((detail, index) => (
                            <div key={index}>
                                <p className="text-sm text-gray-300/80">{detail.label}</p>
                                {detail.isBadge ? (
                                    <Badge
                                        className={`${getStatusColorClientDetails(detail.value)} rounded-full`}
                                    >
                                        {detail.value}
                                    </Badge>
                                ) : detail.isCode ? (
                                    <p className="font-mono text-xs text-white break-all">
                                        {detail.value}
                                    </p>
                                ) : (
                                    <p className="text-sm text-white">{detail.value}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default SessionInformation;