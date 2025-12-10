import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Company } from "@/services/admin.service";
import {
  type PromptType,
  type PromptCategory,
  connectionMessagesService,
  type AIModel,
} from "@/services/connectionMessages.service";
import { toast } from "sonner";

interface PromptFormData {
  promptType: PromptType;
  promptCategory: PromptCategory;
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
        toast.error("Failed to fetch available AI models");
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
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="promptType">Prompt Type</Label>
          <Select
            value={formData.promptType}
            onValueChange={(value: PromptType) =>
              onFormDataChange("promptType", value)
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="linkedin">LinkedIn</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="phone">Phone</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="promptCategory">Category</Label>
          <Select
            value={formData.promptCategory}
            onValueChange={(value: PromptCategory) =>
              onFormDataChange("promptCategory", value)
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="system">System Prompt</SelectItem>
              <SelectItem value="human">Human Prompt</SelectItem>
              <SelectItem value="bulk_system">Bulk System</SelectItem>
              <SelectItem value="bulk_human">Bulk Human</SelectItem>
              <SelectItem value="enhance_system">Enhance System</SelectItem>
              <SelectItem value="enhance_human">Enhance Human</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="company">Company (Optional)</Label>
          <Select
            value={selectedCompanyForPrompt?._id || "global"}
            onValueChange={(value) => {
              if (value === "global") {
                onCompanySelect(null);
              } else {
                const company = companies.find((c) => c._id === value);
                if (company) {
                  onCompanySelect(company);
                }
              }
            }}
            disabled={companiesLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a company (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="global">
                Global Prompt (all companies)
              </SelectItem>
              {companies.map((company) => (
                <SelectItem key={company._id} value={company._id}>
                  {company.name}{" "}
                  {company.industry ? `(${company.industry})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {companiesLoading && (
            <p className="text-white/50 text-xs mt-1">Loading companies...</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="model">AI Model</Label>
          <Select
            value={formData.metadata?.model || "gpt-4o-mini"}
            onValueChange={(value) =>
              onFormDataChange("metadata", {
                ...formData.metadata,
                model: value as any,
              })
            }
            disabled={modelsLoading}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  modelsLoading ? "Loading models..." : "Select a model"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {availableModels.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  {model.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {modelsLoading && (
            <p className="text-white/50 text-xs mt-1">
              Loading available models...
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="temperature">Temperature</Label>
          <Select
            value={formData.metadata?.temperature?.toString() || "0.7"}
            onValueChange={(value) =>
              onFormDataChange("metadata", {
                ...formData.metadata,
                temperature: parseFloat(value),
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0.1">0.1 (Very Focused)</SelectItem>
              <SelectItem value="0.3">0.3 (Focused)</SelectItem>
              <SelectItem value="0.5">0.5 (Balanced)</SelectItem>
              <SelectItem value="0.7">0.7 (Creative)</SelectItem>
              <SelectItem value="0.9">0.9 (Very Creative)</SelectItem>
              <SelectItem value="1.0">1.0 (Highly Creative)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label htmlFor="content">Prompt Content</Label>
        <Textarea
          id="content"
          value={formData.content}
          onChange={(e) => onFormDataChange("content", e.target.value)}
          placeholder="Enter the prompt content..."
          rows={8}
          className="font-mono text-sm"
        />
      </div>
      <div className="flex flex-col sm:flex-row justify-end gap-2">
        <Button
          variant="outline"
          onClick={onCancel}
          className="w-full sm:w-auto"
        >
          Cancel
        </Button>
        <Button
          onClick={onSubmit}
          className="bg-cyan-600 hover:bg-cyan-700 w-full sm:w-auto"
        >
          {isEditing ? "Update" : "Create"} Prompt
        </Button>
      </div>
    </div>
  );
};
