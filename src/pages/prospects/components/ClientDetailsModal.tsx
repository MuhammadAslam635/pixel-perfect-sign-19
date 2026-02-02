import React from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ClockIcon,
  MessageSquareIcon,
  ActivityIcon,
  CalendarIcon,
  UserIcon,
  MailIcon,
  PhoneIcon,
} from "lucide-react";
import type { Client } from "@/services/clients.service";

interface ClientDetailsModalProps {
  client: Client | null;
  isOpen: boolean;
  onClose: () => void;
  viewType?: "sessions" | "prospects" | "queries";
}

const ClientDetailsModal: React.FC<ClientDetailsModalProps> = ({
  client,
  isOpen,
  onClose,
  viewType = "sessions",
}) => {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800 hover:bg-green-200";
      case "Active":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200";
      case "Idle Timeout":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
      case "Disconnected":
        return "bg-red-100 text-red-800 hover:bg-red-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes} minutes ${secs} seconds`;
  };

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
        className="w-full sm:max-w-2xl lg:max-w-4xl overflow-hidden p-0 text-white border-0 bg-[#0a0a0a] border-l border-white/10 [&>button]:z-50 [&>button]:bg-white/10 [&>button]:hover:bg-white/20 [&>button]:text-white [&>button]:border-white/20"
      >
        {/* Background for sheet */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 pointer-events-none" />

        <div className="relative z-10 overflow-y-auto scrollbar-hide h-full p-6">
          <div>
            <SheetHeader className="mb-6 pb-4 border-b border-white/10 px-6 pt-6">
              <SheetTitle className="text-2xl font-bold text-white drop-shadow-lg">
                Session Details
              </SheetTitle>
              <SheetDescription className="text-gray-300/80 mt-2">
                Complete information about this{" "}
                {viewType === "queries" ? "query" : "session"}
              </SheetDescription>
            </SheetHeader>
          </div>

          <div className="space-y-6">
            {/* Contact Information - Only show for queries view */}
            {viewType === "queries" && contactInfo && (
              <div>
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
                        <p className="text-sm text-gray-300/80 flex items-center gap-2">
                          <UserIcon className="w-4 h-4" />
                          Name
                        </p>
                        <p className="text-sm text-white mt-1">
                          {contactInfo.name || "N/A"}
                        </p>
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
              </div>
            )}

            {/* Session Information */}
            <div>
              <Card className="bg-white/5 backdrop-blur-sm border-white/10 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-white drop-shadow-md">
                    <ActivityIcon className="w-5 h-5" />
                    Session Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-300/80">Session ID</p>
                      <p className="font-mono text-xs text-white break-all">
                        {client.sessionId}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-300/80">Status</p>
                      <Badge
                        className={`${getStatusColor(
                          client.status
                        )} rounded-full`}
                      >
                        {client.status}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-gray-300/80">Start Time</p>
                      <p className="text-sm text-white">
                        {formatDate(client.startTime)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-300/80">End Time</p>
                      <p className="text-sm text-white">
                        {formatDate(client.endTime)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-300/80">Duration</p>
                      <p className="text-sm text-white">
                        {formatDuration(client.duration)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-300/80">Airtable ID</p>
                      <p className="font-mono text-xs text-white">
                        {client.airtableId}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Metrics */}
            <div>
              <Card className="bg-white/5 backdrop-blur-sm border-white/10 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-white drop-shadow-md">
                    <MessageSquareIcon className="w-5 h-5" />
                    Session Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div
                      className="text-center p-4 bg-white/5 border border-white/10 rounded-lg"
                    >
                      <p className="text-2xl font-bold text-white">
                        {client.messagesTotal}
                      </p>
                      <p className="text-sm text-gray-300/80">Total Messages</p>
                    </div>
                    <div
                      className="text-center p-4 bg-white/5 border border-white/10 rounded-lg"
                    >
                      <p className="text-2xl font-bold text-white">
                        {client.averageResponse}ms
                      </p>
                      <p className="text-sm text-gray-300/80">Avg Response</p>
                    </div>
                    <div
                      className="text-center p-4 bg-white/5 border border-white/10 rounded-lg"
                    >
                      <p className="text-2xl font-bold text-green-400">
                        {client.toolCallsSuccess}
                      </p>
                      <p className="text-sm text-gray-300/80">
                        Tool Calls (Success)
                      </p>
                    </div>
                    <div
                      className="text-center p-4 bg-white/5 border border-white/10 rounded-lg"
                    >
                      <p className="text-2xl font-bold text-red-400">
                        {client.toolCallsFailed}
                      </p>
                      <p className="text-sm text-gray-300/80">
                        Tool Calls (Failed)
                      </p>
                    </div>
                    <div
                      className="text-center p-4 bg-white/5 border border-white/10 rounded-lg col-span-2"
                    >
                      <p className="text-2xl font-bold text-white">
                        {client.averageToolDuration}ms
                      </p>
                      <p className="text-sm text-gray-300/80">
                        Avg Tool Duration
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Transcript */}
            <div>
              <Card className="bg-white/5 backdrop-blur-sm border-white/10 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-white drop-shadow-md">
                    <MessageSquareIcon className="w-5 h-5" />
                    Conversation Transcript
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className="bg-white/5 border border-white/10 p-4 rounded-lg max-h-64 overflow-y-auto scrollbar-hide"
                  >
                    <pre className="text-sm whitespace-pre-wrap font-sans text-gray-300">
                      {client.transcript || "No transcript available"}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Events */}
            {events.length > 0 && (
              <div>
                <Card className="bg-white/5 backdrop-blur-sm border-white/10 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-white drop-shadow-md">
                      <CalendarIcon className="w-5 h-5" />
                      Session Events
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div
                      className="space-y-2 max-h-64 overflow-y-auto scrollbar-hide"
                    >
                      {events.map((event: any, index: number) => (
                        <div
                          key={index}
                          className="p-3 bg-white/5 rounded-lg border border-white/10"
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
                                {event.timestamp
                                  ? formatDate(event.timestamp)
                                  : "N/A"}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Timestamps */}
            <div>
              <Card className="bg-white/5 backdrop-blur-sm border-white/10 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-white drop-shadow-md">
                    <ClockIcon className="w-5 h-5" />
                    Timestamps
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div
                      className="flex justify-between"
                    >
                      <span className="text-gray-300/80">
                        Created in System:
                      </span>
                      <span className="text-white">
                        {formatDate(client.createdAt)}
                      </span>
                    </div>
                    <div
                      className="flex justify-between"
                    >
                      <span className="text-gray-300/80">Last Updated:</span>
                      <span className="text-white">
                        {formatDate(client.updatedAt)}
                      </span>
                    </div>
                    <div
                      className="flex justify-between"
                    >
                      <span className="text-gray-300/80">
                        Airtable Created:
                      </span>
                      <span className="text-white">
                        {formatDate(client.airtableCreatedTime)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ClientDetailsModal;
