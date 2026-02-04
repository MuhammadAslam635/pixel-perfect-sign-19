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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getUserData } from "@/utils/authHelpers";
import { companyConfigService } from "@/services/companyConfig.service";
import { RefreshCw } from "lucide-react";

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

  const availableVariables = [
    { name: "{{name}}", description: "Lead's full name" },
    { name: "{{position}}", description: "Job title or position" },
    { name: "{{companyName}}", description: "Company name" },
    { name: "{{industry}}", description: "Industry sector" },
    { name: "{{location}}", description: "Geographic location" },
    { name: "{{linkedinUrl}}", description: "LinkedIn profile URL" },
    { name: "{{description}}", description: "Bio or description" },
  ];



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
          "Only system admins, company owners or company admins can manage prompts.",
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
            "Research prompt has been saved successfully.",
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
              "You don't have permission to manage prompts.",
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
            Research Prompt
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-white/60">
            Contact your company admin to manage the research prompt.
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
             Research Prompt {companyName && <span className="text-cyan-400">- {companyName}</span>}
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
            <div className="space-y-2">
              <Label htmlFor="perplexity-prompt" className="text-white/80">
                Research Prompt Template
              </Label>
              <div className="flex items-center justify-between gap-3 mb-2">
                <Select
                  onValueChange={(value) => {
                    handleInsertVariable(value);
                  }}
                >
                  <SelectTrigger className="w-[280px] bg-white/[0.06] border-white/10 text-white hover:bg-white/10 transition-colors">
                    <SelectValue placeholder="Insert Variable..." />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1f2e] border-white/10 text-white">
                    {availableVariables.map((variable) => (
                      <SelectItem
                        key={variable.name}
                        value={variable.name}
                        className="hover:bg-white/10 focus:bg-white/10 cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <code className="text-cyan-400 font-mono text-xs font-semibold">
                            {variable.name}
                          </code>
                          <span className="text-white/60 text-xs">
                            - {variable.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
