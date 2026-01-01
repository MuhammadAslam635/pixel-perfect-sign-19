import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import axios from "axios";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { getUserData } from "@/utils/authHelpers";
import { companyConfigService } from "@/services/companyConfig.service";
import { Info, RefreshCw, Copy, Check } from "lucide-react";

const DEFAULT_PROMPT = `Conduct comprehensive professional research on the following individual:

Name: {{name}}
Position: {{position}}
Company: {{companyName}}
Industry: {{industry}}
Location: {{location}}
LinkedIn: {{linkedinUrl}}
Bio: {{description}}

Provide a detailed research report in the following JSON format:

{
  "professionalBackground": "A comprehensive 2-3 paragraph summary of their professional background, career trajectory, key achievements, and current role responsibilities.",
  "recentActivities": [
    "Recent professional activity 1 (conferences, speaking engagements, publications, etc.)",
    "Recent professional activity 2",
    "Recent professional activity 3"
  ],
  "news": [
    {
      "title": "Recent news headline mentioning this person or their company",
      "summary": "Brief summary of the news item",
      "date": "Approximate date or timeframe"
    }
  ],
  "painPoints": [
    "Potential business pain point or challenge 1 based on industry trends and company context",
    "Potential pain point 2",
    "Potential pain point 3"
  ],
  "opportunities": [
    "Business opportunity or value proposition 1 that could be relevant",
    "Opportunity 2",
    "Opportunity 3"
  ]
}

IMPORTANT: 
- Return ONLY valid JSON, no markdown formatting or extra text
- If information is not available, use empty arrays [] or brief placeholder text
- Focus on recent information (last 1-2 years)
- Be specific and factual, avoid generic statements
- For pain points and opportunities, consider the industry context and current market trends`;

interface PerplexityPromptTabProps {
  companyId?: string;
  companyName?: string;
}

export const PerplexityPromptTab = ({ companyId, companyName }: PerplexityPromptTabProps) => {
  const user = getUserData();
  // Allow access if admin is managing another company or if user is Company/CompanyAdmin
  const isAdminManagingCompany = Boolean(user?.role === "Admin" && companyId);
  const canManage = Boolean(
    isAdminManagingCompany ||
    user?.role === "Company" ||
    user?.role === "CompanyAdmin" ||
    user?.role === "Admin"
  );

  const [prompt, setPrompt] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [copiedVariable, setCopiedVariable] = useState<string | null>(null);

  const availableVariables = [
    { name: "{{name}}", description: "Lead's full name" },
    { name: "{{position}}", description: "Job title or position" },
    { name: "{{companyName}}", description: "Company name" },
    { name: "{{industry}}", description: "Industry sector" },
    { name: "{{location}}", description: "Geographic location" },
    { name: "{{linkedinUrl}}", description: "LinkedIn profile URL" },
    { name: "{{description}}", description: "Bio or description" },
  ];

  const handleCopyVariable = (variable: string) => {
    navigator.clipboard.writeText(variable);
    setCopiedVariable(variable);
    setTimeout(() => setCopiedVariable(null), 2000);
  };

  const handleInsertVariable = (variable: string) => {
    const textarea = document.getElementById(
      "perplexity-prompt"
    ) as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const textBefore = prompt.substring(0, start);
      const textAfter = prompt.substring(end);
      const newPrompt = textBefore + variable + textAfter;
      setPrompt(newPrompt);
      handlePromptChange(newPrompt);

      // Set cursor position after inserted variable
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(
          start + variable.length,
          start + variable.length
        );
      }, 0);
    }
  };

  const {
    data: configData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: companyId ? ["company-config", companyId] : ["company-config"],
    queryFn: () => companyId 
      ? companyConfigService.getConfigByCompanyId(companyId)
      : companyConfigService.getConfig(),
    enabled: canManage,
    staleTime: 0,
  });

  useEffect(() => {
    if (configData?.data) {
      const currentPrompt = configData.data.perplexityPrompt || DEFAULT_PROMPT;
      setPrompt(currentPrompt);
      setHasChanges(false);
    }
  }, [configData]);

  const handlePromptChange = (value: string) => {
    setPrompt(value);
    const currentPrompt = configData?.data?.perplexityPrompt || DEFAULT_PROMPT;
    setHasChanges(value !== currentPrompt);
  };

  const handleReset = () => {
    setPrompt(DEFAULT_PROMPT);
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!canManage) {
      toast({
        title: "Access restricted",
        description:
          "Only system admins, company owners or company admins can manage Perplexity prompts.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const updatePayload = {
        perplexityPrompt: prompt === DEFAULT_PROMPT ? null : prompt,
      };
      const response = companyId 
        ? await companyConfigService.updateConfigByCompanyId(companyId, updatePayload)
        : await companyConfigService.updateConfig(updatePayload);

      if (response.success) {
        toast({
          title: "Prompt updated",
          description:
            "Perplexity research prompt has been saved successfully.",
        });
        setHasChanges(false);
        refetch();
      } else {
        toast({
          title: "Update failed",
          description: response.message || "Failed to save prompt.",
          variant: "destructive",
        });
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response) {
        if (error.response.status === 401) {
          toast({
            title: "Session expired",
            description: "Please log in again.",
            variant: "destructive",
          });
          return;
        }
        if (error.response.status === 403) {
          toast({
            title: "Access denied",
            description:
              "You don't have permission to manage Perplexity prompts.",
            variant: "destructive",
          });
          return;
        }
        toast({
          title: "Error",
          description:
            (error.response.data as { message?: string })?.message ||
            "Failed to save prompt. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Network error",
          description: "Please check your connection and try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (!canManage) {
    return (
      <Card className="border-white/10 bg-white/[0.04] backdrop-blur-xl text-white">
        <CardHeader className="border-b border-white/10 bg-white/[0.02]">
          <CardTitle className="text-white text-lg font-semibold">
            Perplexity Research Prompt
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-white/60">
            Contact your company admin to manage the Perplexity research prompt.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-white/10 bg-white/[0.04] backdrop-blur-xl text-white">
      <CardHeader className="border-b border-white/10 bg-white/[0.02]">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <CardTitle className="text-white text-lg font-semibold">
            Perplexity Research Prompt {companyName && <span className="text-cyan-400">- {companyName}</span>}
          </CardTitle>
          <CardDescription className="text-white/60">
            {companyName 
              ? `Customize the AI research prompt for ${companyName}. Use`
              : "Customize the prompt used for AI-powered lead research. Use"
            }
            placeholders like{" "}
            <code className="text-cyan-400">{"{{name}}"}</code>,{" "}
            <code className="text-cyan-400">{"{{position}}"}</code>,{" "}
            <code className="text-cyan-400">{"{{companyName}}"}</code>, etc.
          </CardDescription>
        </motion.div>
      </CardHeader>
      <CardContent className="space-y-4 p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-white/60" />
            <span className="ml-2 text-white/60">Loading prompt...</span>
          </div>
        ) : (
          <>
            <div className="rounded-lg bg-blue-500/10 border border-blue-500/30 p-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-3 flex-1">
                  <div>
                    <p className="text-blue-300 font-medium text-sm mb-2">
                      Available Variables
                    </p>
                    <p className="text-blue-200/70 text-xs">
                      Click any variable to insert it into your prompt, or click
                      the copy icon to copy it.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {availableVariables.map((variable) => (
                      <div
                        key={variable.name}
                        className="flex items-center justify-between gap-2 p-2 rounded-md bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group"
                        onClick={() => handleInsertVariable(variable.name)}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <code className="text-cyan-400 font-mono text-xs font-semibold">
                            {variable.name}
                          </code>
                          <span className="text-blue-200/60 text-xs truncate">
                            {variable.description}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyVariable(variable.name);
                          }}
                          className="flex-shrink-0 p-1 rounded hover:bg-white/10 transition-colors"
                          title="Copy variable"
                        >
                          {copiedVariable === variable.name ? (
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="h-3.5 w-3.5 text-blue-300/60 group-hover:text-blue-300" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="text-blue-200/70 text-xs pt-2 border-t border-blue-500/20">
                    These variables will be automatically replaced with actual
                    lead data when research is conducted.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="perplexity-prompt" className="text-white/80">
                  Research Prompt Template
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="text-xs text-white/70 hover:text-white"
                >
                  Reset to Default
                </Button>
              </div>
              <Textarea
                id="perplexity-prompt"
                value={prompt}
                onChange={(e) => handlePromptChange(e.target.value)}
                placeholder="Enter your custom research prompt..."
                className="min-h-[400px] bg-white/[0.06] border-white/10 text-white placeholder:text-white/40 font-mono text-sm [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
              />
              <p className="text-xs text-white/50">
                The prompt must include instructions to return JSON in the
                specified format. Leave empty or use default to use the system
                default prompt.
              </p>
            </div>
          </>
        )}
      </CardContent>
      <CardFooter className="justify-end border-t border-white/10 bg-white/[0.02]">
        <Button
          type="button"
          onClick={handleSave}
          disabled={isSaving || !hasChanges || isLoading}
          className="bg-gradient-to-r from-cyan-500/60 to-[#1F4C55] text-white hover:from-[#30cfd0] hover:to-[#2a9cb3] disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            boxShadow:
              "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
          }}
        >
          {isSaving ? "Saving..." : "Save Prompt"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PerplexityPromptTab;
