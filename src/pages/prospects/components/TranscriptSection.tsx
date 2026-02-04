import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquareIcon } from "lucide-react";
import type { Client } from "@/services/clients.service";

interface TranscriptSectionProps {
    client: Client;
}

const TranscriptSection: React.FC<TranscriptSectionProps> = ({ client }) => {
    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.6 }}
        >
            <Card className="bg-white/5 backdrop-blur-sm border-white/10 shadow-lg">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-white drop-shadow-md">
                        <MessageSquareIcon className="w-5 h-5" />
                        Conversation Transcript
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <motion.div
                        className="bg-white/5 border border-white/10 p-4 rounded-lg max-h-64 overflow-y-auto scrollbar-hide"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.4, delay: 0.8 }}
                    >
                        <pre className="text-sm whitespace-pre-wrap font-sans text-gray-300">
                            {client.transcript || "No transcript available"}
                        </pre>
                    </motion.div>
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default TranscriptSection;