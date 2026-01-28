import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, MessageSquare, Phone, Mail, Plus, Linkedin } from "lucide-react";
import { Prompt, PromptType } from "@/services/connectionMessages.service";
import { isCompanyPrompt, isGlobalPrompt } from "@/utils/prompt";
import { IoLogoWhatsapp } from "react-icons/io5";
import { PromptCard } from "./PromptManagementCard";

interface PromptManagementProps {
  prompts: Prompt[];
  activeTab: PromptType;
  onTabChange: (tab: PromptType) => void;
  onAddPrompt: () => void;
  onEditPrompt: (prompt: Prompt) => void;
  onDeletePrompt: (prompt: Prompt) => void;
}

export const PromptManagement = ({
  prompts,
  activeTab,
  onTabChange,
  onAddPrompt,
  onEditPrompt,
  onDeletePrompt,
}: PromptManagementProps) => {
  const getPromptIcon = (type: PromptType) => {
    switch (type) {
      case "linkedin":
        return <Linkedin className="w-4 h-4" />
      case "email":
        return <Mail className="w-4 h-4" />;
      case "phone":
        return <Phone className="w-4 h-4" />;
      case "whatsapp":
        return <IoLogoWhatsapp className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  const filteredPrompts = useMemo(
    () => prompts.filter((p) => p.promptType === activeTab),
    [prompts, activeTab]
  );

  const globalPrompts = useMemo(
    () => filteredPrompts.filter(isGlobalPrompt),
    [filteredPrompts]
  );

  const companyPrompts = useMemo(
    () => filteredPrompts.filter(isCompanyPrompt),
    [filteredPrompts]
  );

  return (
    <Card className="bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] border-white/10 hover:border-white/20 transition-all duration-300">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white/70 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            AI Prompt Management
          </CardTitle>
          <Button
            onClick={onAddPrompt}
            className="bg-cyan-600 hover:bg-cyan-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Prompt
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs
          value={activeTab}
          onValueChange={(value) => onTabChange(value as PromptType)}
        >
          <TabsList className="grid w-full grid-cols-4 h-auto bg-transparent p-0 gap-2">
            {["linkedin", "email", "phone", "whatsapp"].map((type) => (
              <TabsTrigger
                key={type}
                value={type}
                className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg border border-white/20 text-white/60 transition-all hover:border-[#67B0B7] hover:text-white
                data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#67B0B7] data-[state=active]:to-[#4066B3]
                data-[state=active]:border-transparent data-[state=active]:text-white"
              >
                {getPromptIcon(type as PromptType)}
                <span className="hidden sm:inline capitalize">{type}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeTab} className="mt-6 space-y-6">
            <section className="bg-gradient-to-br from-green-500/5 to-emerald-500/5 rounded-xl p-6 border border-green-500/20">
              <Header
                title={`Global Prompts (${globalPrompts.length})`}
                description="Default prompts used by all companies unless overridden"
                indicatorColor="green"
                badgeText="DEFAULT"
              />

              {globalPrompts.length === 0 ? (
                <Empty text={`No global prompts for ${activeTab}`} />
              ) : (
                <div className="space-y-3">
                  {globalPrompts.map((prompt) => (
                    <PromptCard
                      key={prompt._id}
                      prompt={prompt}
                      borderColor="border-green-500/20 hover:border-green-500/40"
                      onEdit={onEditPrompt}
                      onDelete={onDeletePrompt}
                    />
                  ))}
                </div>
              )}
            </section>
            {/* Separator */}
            <Separator />
            {/* Company Prompts */}
            <section className="bg-gradient-to-br from-blue-500/5 to-cyan-500/5 rounded-xl p-6 border border-blue-500/20">
              <Header
                title={`Company-Specific Prompts (${companyPrompts.length})`}
                description="Custom prompts that override global defaults"
                indicatorColor="blue"
                badgeText="OVERRIDE"
              />

              {companyPrompts.length === 0 ? (
                <Empty
                  text={`No company-specific prompts for ${activeTab}`}
                  sub="Click 'Add Prompt' and select a company"
                />
              ) : (
                <div className="space-y-3">
                  {companyPrompts.map((prompt) => (
                    <PromptCard
                      key={prompt._id}
                      prompt={prompt}
                      borderColor="border-blue-500/20 hover:border-blue-500/40"
                      onEdit={onEditPrompt}
                      onDelete={onDeletePrompt}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Final empty state */}
            {globalPrompts.length === 0 && companyPrompts.length === 0 && (
              <div className="flex flex-col items-center text-center py-12 text-white/40">
                {getPromptIcon(activeTab)}
                <p className="mt-3 text-lg">
                  No prompts configured for {activeTab}
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card >
  );
};



interface HeaderProps {
  title: string;
  description?: string;
  indicatorColor?: "green" | "blue";
  badgeText?: string;
  badgeClassName?: string;
}

const Header = ({
  title,
  description,
  indicatorColor = "green",
  badgeText,
  badgeClassName,
}: HeaderProps) => {
  const colorClasses = {
    green: {
      outer: "bg-green-500/20",
      inner: "bg-green-400",
      badge: "bg-green-600/20 text-green-300 border-green-600/40",
    },
    blue: {
      outer: "bg-blue-500/20",
      inner: "bg-blue-400",
      badge: "bg-blue-600/20 text-blue-300 border-blue-600/40",
    },
  };
  const colors = colorClasses[indicatorColor];
  return (
    <div className="flex items-center gap-3 mb-4">
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center ${colors.outer}`}
      >
        <div className={`w-4 h-4 rounded-full flex items-center justify-center ${colors.inner}`}>
          <div className="w-2 h-2 bg-white rounded-full"></div>
        </div>
      </div>
      <div className="flex-1">
        <h3 className="text-white font-semibold text-lg">{title}</h3>
        {description && (
          <p className="text-white/50 text-xs">{description}</p>
        )}
      </div>
      {badgeText && (
        <Badge className={`${badgeClassName ?? colors.badge} px-3 py-1 text-xs font-bold`}>
          {badgeText}
        </Badge>
      )}
    </div>
  );
};

const Empty = ({ text, sub }: { text: string; sub?: string }) => (
  <div className="text-center py-8">
    <p className="text-white/50 text-sm">{text}</p>
    {sub && <p className="text-white/30 text-xs mt-1">{sub}</p>}
  </div>
);

const Separator = () => (
  <div className="relative">
    <div className="absolute inset-0 flex items-center">
      <div className="w-full border-t-2 border-dashed border-white/10" />
    </div>
    <div className="relative flex justify-center">
      <span className="bg-[rgba(28,30,40,0.94)] px-4 text-xs text-white/40 font-semibold">
        COMPANY OVERRIDES
      </span>
    </div>
  </div>
);