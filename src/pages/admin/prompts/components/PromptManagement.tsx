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
  const globalPrompts = filteredPrompts.filter((prompt) => !prompt.companyId);
  const companyPrompts = filteredPrompts.filter((prompt) => prompt.companyId);

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
          <TabsList className="grid w-full grid-cols-4 h-auto">
            <TabsTrigger
              value="linkedin"
              className="flex items-center gap-2 py-2"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">LinkedIn</span>
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center gap-2 py-2">
              <Mail className="w-4 h-4" />
              <span className="hidden sm:inline">Email</span>
            </TabsTrigger>
            <TabsTrigger value="phone" className="flex items-center gap-2 py-2">
              <Phone className="w-4 h-4" />
              <span className="hidden sm:inline">Phone</span>
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="flex items-center gap-2 py-2">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">WhatsApp</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            <div className="space-y-6">
              {/* Global Prompts */}
              {globalPrompts.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-4 h-4 bg-green-400 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    <h4 className="text-white/70 font-medium">
                      Global Prompts ({globalPrompts.length})
                    </h4>
                    <Badge className="bg-green-600/20 text-green-400 border-green-600/30">
                      Applies to all companies
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    {globalPrompts.map((prompt) => (
                      <div
                        key={prompt._id}
                        className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-white/20 transition-all duration-200"
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
                </div>
              )}

              {/* Company-specific Prompts */}
              {companyPrompts.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-4 h-4 bg-blue-400 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    <h4 className="text-white/70 font-medium">
                      Company-Specific Prompts ({companyPrompts.length})
                    </h4>
                    <Badge className="bg-blue-600/20 text-blue-400 border-blue-600/30">
                      Company override
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    {companyPrompts.map((prompt) => (
                      <div
                        key={prompt._id}
                        className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-white/20 transition-all duration-200"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-white/70 font-medium capitalize text-sm">
                                {prompt.promptCategory.replace("_", " ")}
                              </span>
                              {prompt.company?.name && (
                                <Badge
                                  variant="outline"
                                  className="text-xs border-blue-500/30 text-blue-300"
                                >
                                  {prompt.company.name}
                                </Badge>
                              )}
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
