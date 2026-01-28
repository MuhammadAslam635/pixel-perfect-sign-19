import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import "react-quill/dist/quill.snow.css";
import { Company } from "@/services/admin.service";
import {
  type PromptType,
  type PromptCategory,
  type PromptStage,
  connectionMessagesService,
  type AIModel,
} from "@/services/connectionMessages.service";
import { toast } from "sonner";
import { PromptVariables } from "./PromptVariables";
import { PromptTypeSection } from "./PromptTypeSection";
import { PromptSettingsRow } from "./PromptSettingsRow";
import { PromptEditor } from "./PromptEditor";

interface PromptFormData {
  promptType: PromptType;
  promptCategory: PromptCategory;
  stage?: PromptStage;
  content: string;
  name: string;
  description: string;
  metadata?: {
    model?: string;
    temperature?: number;
    [key: string]: any;
  };
}

interface PromptFormProps {
  formData: PromptFormData;
  selectedCompanyForPrompt: Company | null;
  companies: Company[];
  companiesLoading: boolean;
  onFormDataChange: (field: keyof PromptFormData, value: any) => void;
  onCompanySelect: (company: Company | null) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isEditing: boolean;
}

export const PromptForm = ({
  formData,
  selectedCompanyForPrompt,
  companies,
  companiesLoading,
  onFormDataChange,
  onCompanySelect,
  onSubmit,
  onCancel,
  isEditing,
}: PromptFormProps) => {
  const [availableModels, setAvailableModels] = useState<AIModel[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);

  // Fetch available models on component mount
  useEffect(() => {
    const fetchModels = async () => {
      try {
        setModelsLoading(true);
        const response = await connectionMessagesService.getAvailableModels();
        setAvailableModels(response.data.models);

        if (response.data.isFallback) {
          toast.warning(
            "Using fallback model list - OpenAI API may be unavailable"
          );
        }
      } catch (error) {
        console.error("Failed to fetch available models:", error);
        toast.error("Unable to load available AI models. Please try again.");
        // Set fallback models
        setAvailableModels([
          { id: "gpt-4o", name: "gpt-4o" },
          { id: "gpt-4o-mini", name: "gpt-4o-mini" },
          { id: "gpt-4-turbo", name: "gpt-4-turbo" },
          { id: "gpt-4", name: "gpt-4" },
          { id: "gpt-3.5-turbo", name: "gpt-3.5-turbo" },
        ]);
      } finally {
        setModelsLoading(false);
      }
    };

    fetchModels();
  }, []);

  return (
    <div className="space-y-6">
      {/* Info Card */}
      <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-lg p-4 border border-cyan-500/20">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <h3 className="text-white/90 font-semibold text-sm mb-1">
              Prompt Configuration
            </h3>
            <p className="text-white/60 text-xs leading-relaxed">
              <strong className="text-cyan-300">Global Prompts:</strong> Leave
              "Company" as "Global" to apply this prompt to all companies.
              <br />
              <strong className="text-blue-300">Company-Specific:</strong>{" "}
              Select a specific company to create a custom prompt that overrides
              the global prompt for that company only.
            </p>
          </div>
        </div>
      </div>

      {/* Prompt Type, Category & Stage */}
      <PromptTypeSection formData={formData} onChange={onFormDataChange} />
      {/* Settings Row */}
      <PromptSettingsRow
        formData={formData}
        companies={companies}
        selectedCompany={selectedCompanyForPrompt}
        companiesLoading={companiesLoading}
        modelsLoading={modelsLoading}
        availableModels={availableModels}
        onFormDataChange={onFormDataChange}
        onCompanySelect={onCompanySelect}
      />

      {/* Two-Column Layout: Prompt Editor and Variables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Column: Prompt Editor */}
        <div className="space-y-4">
          <div>
            <Label
              htmlFor="content"
              className="text-white/80 mb-2 flex items-center gap-2"
            >
              <span>Prompt Content</span>
              <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 text-xs">
                Required
              </Badge>
            </Label>
            <div className="bg-white/5 rounded-lg border border-white/10 overflow-hidden">
              <PromptEditor value={formData.content}
                onChange={(val) => onFormDataChange("content", val)}
                isEditing={isEditing}
                promptKey={`${formData.promptType}-${formData.promptCategory}`} />
            </div>
          </div>
        </div>

        {/* Right Column: Available Variables */}
        <div className="space-y-4">
          <PromptVariables promptType={formData.promptType} />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-white/10">
        <Button
          variant="outline"
          onClick={onCancel}
          className="w-full sm:w-auto bg-black/30 border-white/10 text-white hover:bg-white/10 hover:border-white/20 transition-all"
        >
          Cancel
        </Button>
        <Button
          onClick={onSubmit}
          className="w-full sm:w-auto bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-semibold shadow-lg hover:shadow-cyan-500/20 transition-all"
        >
          {isEditing ? "Update Prompt" : "Create Prompt"}
        </Button>
      </div>
    </div>
  );
};