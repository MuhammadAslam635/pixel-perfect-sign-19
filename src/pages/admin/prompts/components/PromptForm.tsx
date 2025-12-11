import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
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
import { PromptVariables } from "./PromptVariables";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

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
  const [quillValue, setQuillValue] = useState<string>("");

  // Configure Quill editor modules and formats for prompt editing
  const quillModules = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["code-block", "blockquote"],
        ["link"],
        ["clean"],
      ],
    }),
    []
  );

  const quillFormats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "list",
    "bullet",
    "code-block",
    "blockquote",
    "link",
  ];

  // Convert HTML to plain text while preserving structure
  const htmlToPlainText = (html: string): string => {
    if (!html || html.trim() === "" || html === "<p><br></p>") {
      return "";
    }

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;

    // Convert block elements to newlines
    const blockElements = tempDiv.querySelectorAll(
      "p, div, h1, h2, h3, h4, h5, h6, li, blockquote"
    );
    blockElements.forEach((el) => {
      const text = el.textContent || "";
      if (text.trim()) {
        const textNode = document.createTextNode("\n" + text);
        el.replaceWith(textNode);
      } else {
        el.remove();
      }
    });

    // Convert <br> to newlines
    const brElements = tempDiv.querySelectorAll("br");
    brElements.forEach((br) => {
      br.replaceWith(document.createTextNode("\n"));
    });

    // Get text content and clean up
    let text = tempDiv.textContent || tempDiv.innerText || "";
    // Clean up multiple newlines (max 2 consecutive)
    text = text.replace(/\n{3,}/g, "\n\n");
    // Trim whitespace but preserve intentional spacing
    text = text.trim();

    return text;
  };

  // Convert plain text to HTML for ReactQuill display
  const plainTextToHtml = (text: string): string => {
    if (!text) return "";
    // Convert newlines to <p> tags
    return text
      .split("\n")
      .map((line) => `<p>${line || "<br>"}</p>`)
      .join("");
  };

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

  // Sync ReactQuill value with formData.content
  useEffect(() => {
    const htmlValue = plainTextToHtml(formData.content);
    setQuillValue(htmlValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.content]);
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
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
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
        <div className="flex items-center justify-between mb-2">
          <Label htmlFor="content">Prompt Content</Label>
          <Collapsible>
            <CollapsibleTrigger className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors">
              View Available Variables
              <ChevronDown className="w-3 h-3" />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
              <PromptVariables promptType={formData.promptType} />
            </CollapsibleContent>
          </Collapsible>
        </div>
        <div className="bg-white/5 rounded-lg border border-white/10 overflow-hidden">
          <ReactQuill
            key={
              formData.promptType +
              formData.promptCategory +
              (isEditing ? "edit" : "new")
            }
            theme="snow"
            value={quillValue}
            onChange={(value) => {
              setQuillValue(value);
              const plainText = htmlToPlainText(value);
              onFormDataChange("content", plainText);
            }}
            modules={quillModules}
            formats={quillFormats}
            placeholder="Enter the prompt content... You can use template variables like {{person.name}}, {{company.name}}, {{context}}, etc."
            className="bg-transparent"
            style={{
              height: "300px",
            }}
          />
        </div>
        <style>{`
          .ql-container {
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-size: 14px;
            height: 250px;
            background: transparent;
            color: rgba(255, 255, 255, 0.9);
            overflow-y: auto;
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .ql-container::-webkit-scrollbar {
            display: none;
          }
          .ql-editor {
            min-height: 250px;
            color: rgba(255, 255, 255, 0.9);
            overflow-y: auto;
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .ql-editor::-webkit-scrollbar {
            display: none;
          }
          .ql-editor.ql-blank::before {
            color: rgba(255, 255, 255, 0.4);
            font-style: normal;
          }
          .ql-toolbar {
            background: rgba(255, 255, 255, 0.05);
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            border-top: none;
            border-left: none;
            border-right: none;
          }
          .ql-toolbar .ql-stroke {
            stroke: rgba(255, 255, 255, 0.7);
          }
          .ql-toolbar .ql-fill {
            fill: rgba(255, 255, 255, 0.7);
          }
          .ql-toolbar button:hover,
          .ql-toolbar button:focus,
          .ql-toolbar button.ql-active {
            background: rgba(255, 255, 255, 0.1);
          }
          .ql-toolbar button:hover .ql-stroke,
          .ql-toolbar button:focus .ql-stroke,
          .ql-toolbar button.ql-active .ql-stroke {
            stroke: rgba(255, 255, 255, 0.9);
          }
          .ql-toolbar button:hover .ql-fill,
          .ql-toolbar button:focus .ql-fill,
          .ql-toolbar button.ql-active .ql-fill {
            fill: rgba(255, 255, 255, 0.9);
          }
          .ql-container {
            border: none;
          }
          .ql-editor code {
            background: rgba(6, 182, 212, 0.2);
            color: rgb(103, 232, 249);
            padding: 2px 4px;
            border-radius: 3px;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          }
          .ql-snow .ql-code-block-container {
            background: rgba(0, 0, 0, 0.3);
            border-left: 3px solid rgb(6, 182, 212);
          }
        `}</style>
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
