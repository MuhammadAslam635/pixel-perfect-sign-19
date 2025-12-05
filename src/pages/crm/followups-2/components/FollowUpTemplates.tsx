import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  Calendar,
  Clock,
  Mail,
  MessageSquare,
  Phone,
  MoreVertical,
} from "lucide-react";

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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            {/* Tab Buttons */}
            <div className="flex items-center gap-1 bg-white/5 rounded-lg p-0.5">
              <button
                onClick={() => setActiveTab("templates")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  activeTab === "templates"
                    ? "bg-[#5B9FA5] text-white"
                    : "text-white/60 hover:text-white/80"
                }`}
              >
                Follow-up Templates
              </button>
              <button
                onClick={() => setActiveTab("plans")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  activeTab === "plans"
                    ? "bg-[#5B9FA5] text-white"
                    : "text-white/60 hover:text-white/80"
                }`}
              >
                Active Followup Plans
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input
                type="text"
                placeholder="Search Template"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40 h-9 text-sm rounded-lg"
              />
            </div>
            <Button
              className="bg-white/5 backdrop-blur-sm border border-white/40 text-white shadow-[0_16px_28px_rgba(0,0,0,0.35)] hover:bg-[#2F2F2F]/60 transition-all h-9 px-4 text-sm"
              style={{
                background:
                  "radial-gradient(circle at left, rgba(64, 102, 179, 0.4) 0%, rgba(103, 176, 183, 0.3) 50%, transparent 70%)",
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Template
            </Button>
          </div>
        </div>

        {/* Campaign Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockCampaigns.map((campaign, index) => (
            <Card
              key={campaign.id}
              className="bg-white/5 border-white/10 hover:border-white/20 transition-all duration-300 hover:shadow-lg hover:shadow-white/5"
            >
              <CardContent className="p-4 space-y-3">
                {/* Card Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-white font-medium text-sm mb-1">
                      {campaign.name}
                    </h4>
                    <p className="text-white/50 text-xs">
                      Update {campaign.updatedAt}
                    </p>
                  </div>
                  <button className="text-white/40 hover:text-white/60 transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>

                {/* Stats Row 1: Run Time and Date */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-xs">
                    <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    </div>
                    <span className="text-white/70">
                      Run Time: {campaign.runTime}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center">
                      <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                    </div>
                    <span className="text-white/70">{campaign.dateRange}</span>
                  </div>
                </div>

                {/* Stats Row 2: Communication Channels */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-xs">
                    <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center">
                      <Mail className="w-3.5 h-3.5 text-cyan-400" />
                    </div>
                    <span className="text-white/70">
                      {campaign.emails.toString().padStart(2, "0")} Emails
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center">
                      <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                    </div>
                    <span className="text-white/70">
                      {campaign.messages.toString().padStart(2, "0")} Message
                    </span>
                  </div>
                </div>

                {/* Stats Row 3: Calls */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-xs">
                    <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center">
                      <Phone className="w-3.5 h-3.5 text-cyan-400" />
                    </div>
                    <span className="text-white/70">
                      {campaign.calls.toString().padStart(2, "0")} Calls
                    </span>
                  </div>
                </div>

                {/* Footer: Day Time and Run Button */}
                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                  <span className="text-xs text-white/50">
                    Day time: 14:00 (8:00 UTC)
                  </span>
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-[#69B4B7] via-[#5486D0] to-[#3E64B3] text-white hover:brightness-110 transition-all h-8 px-4 text-xs"
                  >
                    Run Templates
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FollowUpTemplates;
