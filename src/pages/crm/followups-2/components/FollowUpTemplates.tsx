import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Calendar,
  Clock,
  Mail,
  MessageSquare,
  Phone,
  MoreVertical,
} from "lucide-react";
import { SearchInput } from "../../shared/components";
import ActiveFollowUpPlans from "./ActiveFollowUpPlans";

// Mock data for demo purposes
const mockCampaigns = Array(9)
  .fill(null)
  .map((_, index) => ({
    id: `campaign-${index + 1}`,
    name: "Demo Follow up campaign",
    updatedAt: "2 days ago",
    runTime: "10 days",
    dateRange: "03 - Dec - 2025",
    emails: 6,
    messages: 6,
    calls: 4,
  }));

const FollowUpTemplates = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"templates" | "plans">(
    "templates"
  );

  return (
    <div className="space-y-6">
      {/* Header Section */}

      {/* Active Followup Plan Section with Tabs and Search */}
      <div>
        <div className="flex items-center justify-between mb-0">
          <div className="flex items-center gap-4">
            {/* Tab Buttons */}
            <div className="flex items-center gap-1 rounded-lg p-0.5">
              <div className="relative pb-3">
                <button
                  onClick={() => setActiveTab("templates")}
                  className={`px-3 py-1.5 rounded-md text-2xl font-medium transition-all ${
                    activeTab === "templates"
                      ? "text-white"
                      : "text-[#FFFFFF4D] hover:text-white/80"
                  }`}
                >
                  Follow-up Templates
                </button>
                <p
                  className={`px-3 py-0.5 rounded-md text-[10px] font-light transition-all ${
                    activeTab === "templates"
                      ? "text-white/70"
                      : "text-[#FFFFFF4D]"
                  }`}
                >
                  Centralize touchpoints for every prospect across emails,
                  calls, and whatsapp
                </p>
              </div>
              <div className="relative pb-3">
                <button
                  onClick={() => setActiveTab("plans")}
                  className={`px-3 py-1 rounded-md text-2xl font-medium transition-all ${
                    activeTab === "plans"
                      ? "text-white"
                      : "text-[#FFFFFF4D] hover:text-white/80"
                  }`}
                >
                  Active Followup Plans
                </button>
                <p
                  className={`px-3 py-0.5 rounded-md text-[10px] font-light transition-all ${
                    activeTab === "plans" ? "text-white/70" : "text-[#FFFFFF4D]"
                  }`}
                >
                  View and manage your active followup campaigns
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <SearchInput
              placeholder="Search templates..."
              value={searchQuery}
              onChange={setSearchQuery}
              className="sm:min-w-[320px] lg:min-w-[320px]"
            />
            <Button
              variant="ghost"
              size="sm"
              className="relative h-9 px-4 rounded-full border-0 text-white text-xs hover:bg-[#2F2F2F]/60 transition-all w-full sm:w-auto lg:flex-shrink-0 overflow-hidden"
              style={{
                background: "#FFFFFF1A",
                boxShadow:
                  "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
              }}
            >
              {/* radial element 150px 150px */}
              <div
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-[150px] h-[150px] rounded-full pointer-events-none"
                style={{
                  background:
                    "radial-gradient(circle, #66AFB7 0%, transparent 70%)",
                  backdropFilter: "blur(50px)",
                  WebkitBackdropFilter: "blur(50px)",
                  zIndex: -1,
                }}
              ></div>
              <Plus className="w-4 h-4 mr-0 relative z-10" />
              <span className="relative z-10">New Template</span>
            </Button>
          </div>
        </div>

        {/* Bottom Border with Active Tab Indicator */}
        <div className="relative border-b border-white/20 mb-4">
          <div
            className={`absolute bottom-0 h-[2px] bg-white transition-all duration-300 ${
              activeTab === "templates"
                ? "left-0 w-[380px]"
                : "left-[420px] w-[300px]"
            }`}
          />
        </div>

        {/* Conditional Content Based on Active Tab */}
        {activeTab === "templates" ? (
          /* Campaign Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockCampaigns.map((campaign, index) => (
              <Card
                key={campaign.id}
                className="relative border-0 hover:bg-[#2F2F2F] transition-all duration-300 rounded-2xl overflow-hidden"
                style={{
                  background: "#2A2A2A",
                }}
              >
                {/* Gradient overlay from top to bottom */}
                <div
                  className="absolute top-0 left-0 right-0 pointer-events-none rounded-sm"
                  style={{
                    height: "calc(100% - 190px)",
                    background:
                      "linear-gradient(173.83deg, rgba(255, 255, 255, 0.16) 4.82%, rgba(255, 255, 255, 4e-05) 38.08%, rgba(255, 255, 255, 4e-05) 56.68%, rgba(255, 255, 255, 0.04) 95.1%)",
                    zIndex: 1,
                  }}
                ></div>
                <CardContent className="relative p-5 space-y-4 z-10">
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="text-white font-medium text-base mb-1.5">
                        {campaign.name}
                      </h4>
                      <p className="text-white/40 text-xs">
                        Update {campaign.updatedAt}
                      </p>
                    </div>
                    <button className="text-white/40 hover:text-white/60 transition-colors">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="border-b border-white/30"></div>
                  {/* Stats Grid - Horizontal Layout */}
                  <div className="flex items-start gap-3 flex-wrap">
                    {/* Run Time */}
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-9 h-9 rounded-full bg-[#4A6B6D]/30 flex items-center justify-center flex-shrink-0">
                        <Clock className="w-4 h-4 text-[#6B9FA1]" />
                      </div>
                      <span className="text-white/80 text-sm">
                        Run Time: {campaign.runTime}
                      </span>
                    </div>

                    {/* Calendar */}
                    <div className="flex items-center gap-2 text-sm ml-auto">
                      <div className="w-9 h-9 rounded-full bg-[#4A6B6D]/30 flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-4 h-4 text-[#6B9FA1]" />
                      </div>
                      <span className="text-white/80 text-sm">
                        {campaign.dateRange}
                      </span>
                    </div>
                  </div>

                  {/* Communication Channels Row */}
                  <div className="flex items-center gap-6">
                    {/* Emails */}
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-9 h-9 rounded-full bg-[#4A6B6D]/30 flex items-center justify-center flex-shrink-0">
                        <Mail className="w-4 h-4 text-[#6B9FA1]" />
                      </div>
                      <span className="text-white/80 text-sm">
                        {campaign.emails.toString().padStart(2, "0")} Emails
                      </span>
                    </div>

                    {/* Messages */}
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-9 h-9 rounded-full bg-[#4A6B6D]/30 flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="w-4 h-4 text-[#6B9FA1]" />
                      </div>
                      <span className="text-white/80 text-sm">
                        {campaign.messages.toString().padStart(2, "0")} Message
                      </span>
                    </div>

                    {/* Calls */}
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-9 h-9 rounded-full bg-[#4A6B6D]/30 flex items-center justify-center flex-shrink-0">
                        <Phone className="w-4 h-4 text-[#6B9FA1]" />
                      </div>
                      <span className="text-white/80 text-sm">
                        {campaign.calls.toString().padStart(2, "0")} Calls
                      </span>
                    </div>
                  </div>

                  {/* Footer: Day Time and Run Button */}
                  <div className="flex items-center justify-between pt-3">
                    <span className="text-sm text-white/50">
                      Day time: 14:00 (9:00 UTC)
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="relative h-9 px-4 rounded-full border-0 text-white text-xs hover:bg-[#2F2F2F]/60 transition-all overflow-hidden"
                      style={{
                        background: "#FFFFFF1A",
                        boxShadow:
                          "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
                      }}
                    >
                      {/* gradient element left to right */}
                      <div
                        className="absolute left-0 top-0 bottom-0 right-0 pointer-events-none rounded-full"
                        style={{
                          background:
                            "linear-gradient(to right, #66AFB7 0%, transparent 60%)",
                          zIndex: 0,
                        }}
                      ></div>
                      <span className="relative z-10">Run Templates</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <ActiveFollowUpPlans />
        )}
      </div>
    </div>
  );
};

export default FollowUpTemplates;
