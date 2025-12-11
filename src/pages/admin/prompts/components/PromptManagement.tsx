import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Settings,
  MessageSquare,
  Phone,
  Mail,
  Trash2,
  Edit,
  Plus,
} from "lucide-react";
import {
  type Prompt,
  type PromptType,
} from "@/services/connectionMessages.service";

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
        return <MessageSquare className="w-4 h-4" />;
      case "email":
        return <Mail className="w-4 h-4" />;
      case "phone":
        return <Phone className="w-4 h-4" />;
    }
  };

  const filteredPrompts = prompts.filter(
    (prompt) => prompt.promptType === activeTab
  );

  // Helper function to check if a prompt is global (no companyId)
  const isGlobalPrompt = (prompt: Prompt): boolean => {
    // Explicitly check for null or undefined
    if (prompt.companyId === null || prompt.companyId === undefined) {
      return true;
    }

    // If companyId is an object
    if (typeof prompt.companyId === "object") {
      // Check if it's a valid populated company object with _id
      const hasId = !!(prompt.companyId as any)?._id;
      // If it has _id, it's company-specific (not global)
      // If it doesn't have _id, it might be an empty object, treat as global
      return !hasId;
    }

    // If it's a string (non-empty), it's company-specific (not global)
    if (typeof prompt.companyId === "string") {
      return prompt.companyId.trim().length === 0;
    }

    // For any other type, treat as global
    return true;
  };

  // Filter global prompts (no companyId or null companyId)
  const globalPrompts = filteredPrompts.filter((prompt) =>
    isGlobalPrompt(prompt)
  );

  // Filter company-specific prompts (has valid companyId)
  const companyPrompts = filteredPrompts.filter((prompt) => {
    // Explicitly exclude null and undefined
    if (prompt.companyId === null || prompt.companyId === undefined) {
      return false;
    }

    // If it's an object, check if it has _id (valid populated company)
    if (typeof prompt.companyId === "object") {
      return !!(prompt.companyId as any)?._id;
    }

    // If it's a string ID (non-empty), it's company-specific
    if (typeof prompt.companyId === "string") {
      return prompt.companyId.trim().length > 0;
    }

    // Any other type is not company-specific
    return false;
  });

  // Debug logging
  console.log(`🔍 ${activeTab.toUpperCase()} Tab - Filtering Results:`);
  console.log(`   Total prompts for ${activeTab}:`, filteredPrompts.length);
  console.log(`   Global prompts:`, globalPrompts.length);
  console.log(`   Company-specific prompts:`, companyPrompts.length);

  // Detailed debug info
  console.log(
    `   📋 Sample prompt companyId values:`,
    filteredPrompts.slice(0, 3).map((p) => ({
      id: p._id,
      category: p.promptCategory,
      companyIdType: typeof p.companyId,
      companyIdValue: p.companyId,
      companyIdIsNull: p.companyId === null,
      companyIdIsUndefined: p.companyId === undefined,
      hasCompanyField: !!p.company,
      companyName: p.company?.name,
    }))
  );

  if (companyPrompts.length > 0) {
    console.log(
      `   🏢 Company prompts details:`,
      companyPrompts.map((p) => {
        const companyIdValue =
          p.companyId && typeof p.companyId === "object"
            ? (p.companyId as any)?._id || p.companyId
            : p.companyId;
        const companyNameValue =
          p.company?.name ||
          (p.companyId && typeof p.companyId === "object"
            ? (p.companyId as any)?.name
            : "NO NAME");
        return {
          id: p._id,
          category: p.promptCategory,
          companyId: companyIdValue,
          companyName: companyNameValue,
          hasCompanyField: !!p.company,
        };
      })
    );
  }

  if (globalPrompts.length > 0) {
    console.log(
      `   🌐 Global prompts details:`,
      globalPrompts.map((p) => ({
        id: p._id,
        category: p.promptCategory,
        companyId: p.companyId,
        companyIdType: typeof p.companyId,
        companyIdIsNull: p.companyId === null,
      }))
    );
  }

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
            <TabsTrigger
              value="linkedin"
              className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg border border-white/20 text-white/60 transition-all duration-300 hover:border-[#67B0B7] hover:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#67B0B7] data-[state=active]:to-[#4066B3] data-[state=active]:border-transparent data-[state=active]:text-white data-[state=active]:shadow-[0_5px_18px_rgba(103,176,183,0.35)]"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">LinkedIn</span>
            </TabsTrigger>
            <TabsTrigger
              value="email"
              className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg border border-white/20 text-white/60 transition-all duration-300 hover:border-[#67B0B7] hover:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#67B0B7] data-[state=active]:to-[#4066B3] data-[state=active]:border-transparent data-[state=active]:text-white data-[state=active]:shadow-[0_5px_18px_rgba(103,176,183,0.35)]"
            >
              <Mail className="w-4 h-4" />
              <span className="hidden sm:inline">Email</span>
            </TabsTrigger>
            <TabsTrigger
              value="phone"
              className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg border border-white/20 text-white/60 transition-all duration-300 hover:border-[#67B0B7] hover:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#67B0B7] data-[state=active]:to-[#4066B3] data-[state=active]:border-transparent data-[state=active]:text-white data-[state=active]:shadow-[0_5px_18px_rgba(103,176,183,0.35)]"
            >
              <Phone className="w-4 h-4" />
              <span className="hidden sm:inline">Phone</span>
            </TabsTrigger>
            <TabsTrigger
              value="whatsapp"
              className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg border border-white/20 text-white/60 transition-all duration-300 hover:border-[#67B0B7] hover:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#67B0B7] data-[state=active]:to-[#4066B3] data-[state=active]:border-transparent data-[state=active]:text-white data-[state=active]:shadow-[0_5px_18px_rgba(103,176,183,0.35)]"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">WhatsApp</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            <div className="space-y-6">
              {/* Global Prompts Section - ALWAYS SHOW */}
              <div>
                <div className="bg-gradient-to-br from-green-500/5 to-emerald-500/5 rounded-xl p-6 border border-green-500/20">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <div className="w-4 h-4 bg-green-400 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold text-lg">
                        Global Prompts ({globalPrompts.length})
                      </h3>
                      <p className="text-white/50 text-xs">
                        Default prompts used by all companies unless overridden
                      </p>
                    </div>
                    <Badge className="bg-green-600/20 text-green-300 border-green-600/40 px-3 py-1 text-xs font-bold">
                      DEFAULT
                    </Badge>
                  </div>

                  {globalPrompts.length === 0 ? (
                    <div className="text-center py-8 text-white/50 text-sm">
                      No global prompts for {activeTab}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {globalPrompts.map((prompt) => (
                        <div
                          key={prompt._id}
                          className="bg-black/20 rounded-lg p-4 border border-green-500/20 hover:border-green-500/40 transition-all duration-200 shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-white/70 font-medium capitalize text-sm">
                                  {prompt.promptCategory.replace("_", " ")}
                                </span>
                                {prompt.name && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs border-white/20"
                                  >
                                    {prompt.name}
                                  </Badge>
                                )}
                              </div>
                              {prompt.description && (
                                <p className="text-white/50 text-sm mb-2">
                                  {prompt.description}
                                </p>
                              )}
                              <p className="text-white/60 text-sm line-clamp-2 break-words">
                                {prompt.content.substring(0, 150)}...
                              </p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onEditPrompt(prompt)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onDeletePrompt(prompt)}
                                className="text-red-400 hover:text-red-300 h-8 w-8 p-0"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* SEPARATOR */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t-2 border-dashed border-white/10"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-[rgba(28,30,40,0.94)] px-4 text-xs text-white/40 font-semibold">
                    COMPANY OVERRIDES
                  </span>
                </div>
              </div>

              {/* Company-Specific Prompts Section - ALWAYS SHOW */}
              <div>
                <div className="bg-gradient-to-br from-blue-500/5 to-cyan-500/5 rounded-xl p-6 border border-blue-500/20">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <div className="w-4 h-4 bg-blue-400 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold text-lg">
                        Company-Specific Prompts ({companyPrompts.length})
                      </h3>
                      <p className="text-white/50 text-xs">
                        Custom prompts that override global defaults for
                        specific companies
                      </p>
                    </div>
                    <Badge className="bg-blue-600/20 text-blue-300 border-blue-600/40 px-3 py-1 text-xs font-bold">
                      OVERRIDE
                    </Badge>
                  </div>

                  {companyPrompts.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-white/50 text-sm mb-2">
                        No company-specific prompts for {activeTab}
                      </p>
                      <p className="text-white/30 text-xs">
                        Click "Add Prompt" and select a company to create an
                        override
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {companyPrompts.map((prompt) => (
                        <div
                          key={prompt._id}
                          className="bg-black/20 rounded-lg p-4 border border-blue-500/20 hover:border-blue-500/40 transition-all duration-200 shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <span className="text-white/70 font-medium capitalize text-sm">
                                  {prompt.promptCategory.replace("_", " ")}
                                </span>
                                {prompt.company?.name && (
                                  <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/40 text-xs font-semibold px-2.5 py-0.5">
                                    🏢 {prompt.company.name}
                                  </Badge>
                                )}
                                {prompt.name && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs border-white/20 text-white/70"
                                  >
                                    {prompt.name}
                                  </Badge>
                                )}
                              </div>
                              {prompt.description && (
                                <p className="text-white/50 text-sm mb-2">
                                  {prompt.description}
                                </p>
                              )}
                              <p className="text-white/60 text-sm line-clamp-2 break-words">
                                {prompt.content.substring(0, 150)}...
                              </p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onEditPrompt(prompt)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onDeletePrompt(prompt)}
                                className="text-red-400 hover:text-red-300 h-8 w-8 p-0"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Removed old info card - now both sections always show */}
              {false &&
                globalPrompts.length > 0 &&
                companyPrompts.length === 0 && (
                  <div className="bg-gradient-to-br from-blue-500/5 to-cyan-500/5 rounded-xl p-6 border border-blue-500/20 border-dashed">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg
                          className="w-5 h-5 text-blue-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-semibold text-base mb-2">
                          No Company-Specific Prompts
                        </h3>
                        <p className="text-white/60 text-sm leading-relaxed mb-3">
                          All companies are currently using the global default
                          prompts. You can create company-specific prompts to
                          override the defaults for individual companies.
                        </p>
                        <div className="flex items-start gap-2 bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
                          <svg
                            className="w-4 h-4 text-blue-300 flex-shrink-0 mt-0.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                            />
                          </svg>
                          <p className="text-blue-200 text-xs leading-relaxed">
                            <strong className="font-semibold">
                              How to create:
                            </strong>{" "}
                            Click "Add Prompt" above and select a specific
                            company from the dropdown menu to create a custom
                            prompt for that company.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              {globalPrompts.length === 0 && companyPrompts.length === 0 && (
                <div className="flex flex-col items-center justify-center text-center py-12">
                  <div className="text-white/50 mb-4">
                    {getPromptIcon(activeTab)}
                  </div>
                  <p className="text-white/50 text-lg font-medium">
                    No prompts configured for {activeTab} messages
                  </p>
                  <p className="text-white/30 text-base mt-2">
                    Create global prompts to apply to all companies, or
                    company-specific prompts for customization
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
