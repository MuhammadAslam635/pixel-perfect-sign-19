import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { FollowupTemplate } from "@/services/followupTemplates.service";
import { MoreHorizontal, Pencil, Copy, Trash2, MessageSquare, Phone, Mail, Clock } from "lucide-react";

interface FollowupTemplatesProps {
  templates: FollowupTemplate[];
  isLoading: boolean;
  isError: boolean;
  onEdit: (template: FollowupTemplate) => void;
  onDelete: (template: FollowupTemplate) => void;
  onDuplicate: (template: FollowupTemplate) => void;
}

const FollowupTemplates = ({
  templates,
  isLoading,
  isError,
  onEdit,
  onDelete,
  onDuplicate,
}: FollowupTemplatesProps) => {
  if (isLoading) {
    return (
      <div className="col-span-full text-center text-white/60 py-10">
        Loading templates...
      </div>
    );
  }
  if (isError) {
    return (
      <div className="col-span-full text-center text-red-400 py-10">
        Error loading templates. Please try again.
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="col-span-full text-center text-white/60 py-10">
        No templates found. Create your first template to get started.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-10">
      {templates.map((template) => {
        // Format updated date
        const updatedDate = new Date(template.updatedAt);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - updatedDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const updatedAt = diffDays <= 1 ? "today" : `${diffDays} days ago`;

        return (
          <Card
            key={template._id}
            className="relative border-0 hover:bg-[#2F2F2F] transition-all duration-300 rounded-2xl overflow-hidden"
            style={{ background: "#2A2A2A" }}
          >
            {/* Gradient overlay from top to bottom */}
            <div
              className="absolute top-0 left-0 right-0 pointer-events-none rounded-sm"
              style={{
                height: "calc(100% - 120px)",
                background:
                  "linear-gradient(173.83deg, rgba(255, 255, 255, 0.16) 4.82%, rgba(255, 255, 255, 4e-05) 38.08%, rgba(255, 255, 255, 4e-05) 56.68%, rgba(255, 255, 255, 0.04) 95.1%)",
                zIndex: 1,
              }}
            ></div>
            <CardContent className="relative p-4 space-y-2 z-10">
              {/* Card Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4
                    className="mb-1"
                    style={{
                      fontFamily: "Poppins",
                      fontWeight: 500,
                      fontStyle: "Medium",
                      fontSize: "14px",
                    }}
                  >
                    {template.title}
                  </h4>
                  <p className="text-white/40 text-xs">Update {updatedAt}</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="text-white/80 hover:text-white/100 transition-colors">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="bg-[#1a1a1a] border-white/10 text-white"
                  >
                    <DropdownMenuItem
                      onClick={() => onEdit(template)}
                      className="cursor-pointer hover:bg-white/10 focus:bg-white/10"
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDuplicate(template)}
                      className="cursor-pointer hover:bg-white/10 focus:bg-white/10"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete(template)}
                      className="cursor-pointer hover:bg-red-500/20 focus:bg-red-500/20 text-red-400"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="border-b border-white/30"></div>
              <div className="flex items-start gap-3 flex-wrap">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-5 h-5 text-[#5A9EA1]" strokeWidth={2} />
                  <span
                    className="text-sm"
                    style={{
                      fontFamily: "Inter",
                      fontWeight: 400,
                      fontStyle: "Regular",
                      fontSize: "12px",
                      color: "#FFFFFF99",
                    }}
                  >
                    Run Time: {template.numberOfDaysToRun} days
                  </span>
                </div>
              </div>
              {/* Communication Channels Row */}
              <div className="flex items-center justify-between gap-6">
                {/* Emails */}
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-5 h-5 text-[#5A9EA1]" strokeWidth={2} />
                  <span
                    className="text-sm"
                    style={{
                      fontFamily: "Inter",
                      fontWeight: 400,
                      fontStyle: "Regular",
                      fontSize: "12px",
                      color: "#FFFFFF99",
                    }}
                  >
                    {template.numberOfEmails.toString().padStart(2, "0")} Emails
                  </span>
                </div>

                {/* Messages */}
                <div className="flex items-center gap-2 text-sm">
                  <MessageSquare
                    className="w-5 h-5 text-[#5A9EA1]"
                    strokeWidth={2}
                  />
                  <span
                    className="text-sm"
                    style={{
                      fontFamily: "Inter",
                      fontWeight: 400,
                      fontStyle: "Regular",
                      fontSize: "12px",
                      color: "#FFFFFF99",
                    }}
                  >
                    {template.numberOfWhatsappMessages
                      .toString()
                      .padStart(2, "0")}{" "}
                    Message
                  </span>
                </div>

                {/* Calls */}
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-5 h-5 text-[#5A9EA1]" strokeWidth={2} />
                  <span
                    className="text-sm"
                    style={{
                      fontFamily: "Inter",
                      fontWeight: 400,
                      fontStyle: "Regular",
                      fontSize: "12px",
                      color: "#FFFFFF99",
                    }}
                  >
                    {template.numberOfCalls.toString().padStart(2, "0")} Calls
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default FollowupTemplates;