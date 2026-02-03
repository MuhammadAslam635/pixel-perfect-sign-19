import React from "react";
import { motion } from "framer-motion";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserIcon, MailIcon, PhoneIcon, } from "lucide-react";
import type { Client } from "@/services/clients.service";
import MetricsSection from "./MetricsSection";
import TranscriptSection from "./TranscriptSection";
import TimestampsSection from "./TimestampsSection";
import EventsSection from "./EventsSection";
import SessionInformation from "./SessionInformation";

interface ClientDetailsModalProps {
  client: Client | null;
  isOpen: boolean;
  onClose: () => void;
  viewType?: "sessions" | "prospects" | "queries";
}

const ClientDetailsModal: React.FC<ClientDetailsModalProps> = ({ client, isOpen, onClose, viewType = "sessions", }) => {
  if (!client) return null;
  // Parse personalContactInfo for queries view
  let contactInfo = null;
  if (viewType === "queries" && client.personalContactInfo?.value) {
    try {
      contactInfo = JSON.parse(client.personalContactInfo.value);
    } catch (e) {
      console.error("Error parsing personalContactInfo:", e);
    }
  }

  const parseEvents = (eventsJSON: string) => {
    try {
      return JSON.parse(eventsJSON);
    } catch (error) {
      return [];
    }
  };
  const events = parseEvents(client.eventsJSON);
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl lg:max-w-4xl overflow-hidden p-0 text-white border-0 bg-[#0a0a0a] border-l border-white/10 [&>button]:z-50 [&>button]:bg-white/10 [&>button]:hover:bg-white/20 [&>button]:text-white [&>button]:border-white/20">
        {/* Background for sheet */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 pointer-events-none" />

        <div className="relative z-10 overflow-y-auto scrollbar-hide h-full p-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
          >
            <SheetHeader className="mb-6 pb-4 border-b border-white/10 px-6 pt-6">
              <SheetTitle className="text-2xl font-bold text-white drop-shadow-lg">
                Session Details
              </SheetTitle>
              <SheetDescription className="text-gray-300/80 mt-2">
                Complete information about this{" "}
                {viewType === "queries" ? "query" : "session"}
              </SheetDescription>
            </SheetHeader>
          </motion.div>
          <div className="space-y-6">
            {/* Contact Information - Only show for queries view */}
            {viewType === "queries" && contactInfo && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
              >
                <Card className="bg-white/5 backdrop-blur-sm border-white/10 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-white drop-shadow-md">
                      <UserIcon className="w-5 h-5" />
                      Contact Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-300/80 flex items-center gap-2"><UserIcon className="w-4 h-4" />Name</p>
                        <p className="text-sm text-white mt-1">{contactInfo.name || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-300/80 flex items-center gap-2">
                          <MailIcon className="w-4 h-4" />
                          Email
                        </p>
                        <p className="text-sm text-white mt-1 break-all">
                          {contactInfo.email || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-300/80 flex items-center gap-2">
                          <PhoneIcon className="w-4 h-4" />
                          Phone
                        </p>
                        <p className="text-sm text-white mt-1">
                          {contactInfo.phone || "N/A"}
                        </p>
                      </div>
                      {client.personalContactInfo?.state && (
                        <div>
                          <p className="text-sm text-gray-300/80">Status</p>
                          <Badge className="mt-1 bg-blue-100 text-blue-800 rounded-full">
                            {client.personalContactInfo.state}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Session Information */}
            <SessionInformation client={client} />

            {/* Metrics */}
            <MetricsSection client={client} />

            {/* Transcript */}
            <TranscriptSection client={client} />

            {/* Events */}
            <EventsSection events={events} />
            {/* Timestamps */}
            <TimestampsSection client={client} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ClientDetailsModal;