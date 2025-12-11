import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { type PromptType } from "@/services/connectionMessages.service";
import { Copy, Check } from "lucide-react";
import { useState } from "react";

interface PromptVariablesProps {
  promptType: PromptType;
}

interface Variable {
  name: string;
  description: string;
  example: string;
  category: string;
}

const variablesByType: Record<PromptType, Variable[]> = {
  email: [
    {
      name: "{{person.name}}",
      description: "Recipient's full name",
      example: "John Doe",
      category: "Person",
    },
    {
      name: "{{person.firstName}}",
      description: "Recipient's first name",
      example: "John",
      category: "Person",
    },
    {
      name: "{{person.position}}",
      description: "Recipient's job title/position",
      example: "CEO",
      category: "Person",
    },
    {
      name: "{{person.email}}",
      description: "Recipient's email address",
      example: "john@example.com",
      category: "Person",
    },
    {
      name: "{{person.location}}",
      description: "Recipient's location",
      example: "New York, NY",
      category: "Person",
    },
    {
      name: "{{person.description}}",
      description: "Recipient's bio/description",
      example: "Experienced executive...",
      category: "Person",
    },
    {
      name: "{{company.name}}",
      description: "Company name",
      example: "TechCorp Inc.",
      category: "Company",
    },
    {
      name: "{{company.industry}}",
      description: "Company industry",
      example: "Technology",
      category: "Company",
    },
    {
      name: "{{company.description}}",
      description: "Company description/about",
      example: "Leading tech company...",
      category: "Company",
    },
    {
      name: "{{company.website}}",
      description: "Company website URL",
      example: "https://techcorp.com",
      category: "Company",
    },
    {
      name: "{{context}}",
      description: "Brand context and knowledge base",
      example: "Your brand information...",
      category: "Context",
    },
    {
      name: "{{tone}}",
      description: "Email tone (professional, friendly, casual)",
      example: "professional",
      category: "Email Settings",
    },
    {
      name: "{{emailType}}",
      description: "Email type (introduction, follow_up, etc.)",
      example: "introduction",
      category: "Email Settings",
    },
    {
      name: "{{length}}",
      description: "Email length (short, medium, long)",
      example: "medium",
      category: "Email Settings",
    },
    {
      name: "{{userSignature}}",
      description: "User signature (plain text)",
      example: "Best regards,\nJohn",
      category: "Signature",
    },
    {
      name: "{{userSignatureHtml}}",
      description: "User signature (HTML format)",
      example: "<p>Best regards,<br>John</p>",
      category: "Signature",
    },
  ],
  linkedin: [
    {
      name: "{{person.name}}",
      description: "Person's full name",
      example: "John Doe",
      category: "Person",
    },
    {
      name: "{{person.position}}",
      description: "Person's job title",
      example: "CEO",
      category: "Person",
    },
    {
      name: "{{person.companyName}}",
      description: "Person's company name",
      example: "TechCorp Inc.",
      category: "Person",
    },
    {
      name: "{{person.location}}",
      description: "Person's location",
      example: "New York, NY",
      category: "Person",
    },
    {
      name: "{{person.description}}",
      description: "Person's LinkedIn description",
      example: "Experienced executive...",
      category: "Person",
    },
    {
      name: "{{company.name}}",
      description: "Target company name",
      example: "TechCorp Inc.",
      category: "Company",
    },
    {
      name: "{{company.industry}}",
      description: "Company industry",
      example: "Technology",
      category: "Company",
    },
    {
      name: "{{company.description}}",
      description: "Company description",
      example: "Leading tech company...",
      category: "Company",
    },
    {
      name: "{{company.website}}",
      description: "Company website",
      example: "https://techcorp.com",
      category: "Company",
    },
    {
      name: "{{context}}",
      description: "Brand context and knowledge base",
      example: "Your brand information...",
      category: "Context",
    },
    {
      name: "{{tone}}",
      description: "Message tone",
      example: "professional",
      category: "Settings",
    },
  ],
  phone: [
    {
      name: "{{person.name}}",
      description: "Prospect's full name",
      example: "John Doe",
      category: "Person",
    },
    {
      name: "{{person.position}}",
      description: "Prospect's job title",
      example: "CEO",
      category: "Person",
    },
    {
      name: "{{company.name}}",
      description: "Company name",
      example: "TechCorp Inc.",
      category: "Company",
    },
    {
      name: "{{company.industry}}",
      description: "Company industry",
      example: "Technology",
      category: "Company",
    },
    {
      name: "{{company.description}}",
      description: "Company description",
      example: "Leading tech company...",
      category: "Company",
    },
    {
      name: "{{person.location}}",
      description: "Prospect's location",
      example: "New York, NY",
      category: "Person",
    },
    {
      name: "{{callerContext}}",
      description: "Caller information (your name, company)",
      example: "Your Name, Your Company",
      category: "Caller",
    },
    {
      name: "{{callObjective}}",
      description: "Call objective/purpose",
      example: "introduction",
      category: "Call Settings",
    },
    {
      name: "{{scriptLength}}",
      description: "Script length (short, medium, long)",
      example: "medium",
      category: "Call Settings",
    },
    {
      name: "{{length.intro}}",
      description: "Introduction duration",
      example: "30 seconds",
      category: "Call Settings",
    },
    {
      name: "{{length.total}}",
      description: "Total script duration",
      example: "2-3 minutes",
      category: "Call Settings",
    },
    {
      name: "{{brandContext}}",
      description: "Brand context and knowledge base",
      example: "Your brand information...",
      category: "Context",
    },
    {
      name: "{{additionalInstructions}}",
      description: "Custom call instructions",
      example: "Focus on pricing...",
      category: "Call Settings",
    },
  ],
  whatsapp: [
    {
      name: "{{person.name}}",
      description: "Recipient's full name",
      example: "John Doe",
      category: "Person",
    },
    {
      name: "{{person.firstName}}",
      description: "Recipient's first name",
      example: "John",
      category: "Person",
    },
    {
      name: "{{person.position}}",
      description: "Recipient's job title",
      example: "CEO",
      category: "Person",
    },
    {
      name: "{{person.phone}}",
      description: "Recipient's phone number",
      example: "+1234567890",
      category: "Person",
    },
    {
      name: "{{company.name}}",
      description: "Company name",
      example: "TechCorp Inc.",
      category: "Company",
    },
    {
      name: "{{company.industry}}",
      description: "Company industry",
      example: "Technology",
      category: "Company",
    },
    {
      name: "{{context}}",
      description: "Brand context and knowledge base",
      example: "Your brand information...",
      category: "Context",
    },
    {
      name: "{{tone}}",
      description: "Message tone",
      example: "friendly",
      category: "Settings",
    },
  ],
};

export const PromptVariables = ({ promptType }: PromptVariablesProps) => {
  const [copiedVar, setCopiedVar] = useState<string | null>(null);

  const variables = variablesByType[promptType] || [];

  const copyToClipboard = (variable: string) => {
    navigator.clipboard.writeText(variable);
    setCopiedVar(variable);
    setTimeout(() => setCopiedVar(null), 2000);
  };

  const groupedVariables = variables.reduce((acc, variable) => {
    if (!acc[variable.category]) {
      acc[variable.category] = [];
    }
    acc[variable.category].push(variable);
    return acc;
  }, {} as Record<string, Variable[]>);

  return (
    <Card className="bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] border-white/10">
      <CardHeader>
        <CardTitle className="text-white/70 text-sm flex items-center gap-2">
          <span>
            Available Variables for{" "}
            {promptType.charAt(0).toUpperCase() + promptType.slice(1)}
          </span>
          <Badge variant="outline" className="text-xs">
            {variables.length} variables
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(groupedVariables).map(([category, vars]) => (
            <div key={category}>
              <h4 className="text-white/60 text-xs font-medium mb-2 uppercase tracking-wide">
                {category}
              </h4>
              <div className="grid grid-cols-1 gap-2">
                {vars.map((variable) => (
                  <div
                    key={variable.name}
                    className="bg-white/5 rounded-lg p-3 border border-white/10 hover:border-white/20 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <code className="text-cyan-400 text-xs font-mono">
                            {variable.name}
                          </code>
                          <button
                            onClick={() => copyToClipboard(variable.name)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/10 rounded"
                            title="Copy variable"
                          >
                            {copiedVar === variable.name ? (
                              <Check className="w-3 h-3 text-green-400" />
                            ) : (
                              <Copy className="w-3 h-3 text-white/50" />
                            )}
                          </button>
                        </div>
                        <p className="text-white/60 text-xs mb-1">
                          {variable.description}
                        </p>
                        <p className="text-white/40 text-xs font-mono">
                          Example: {variable.example}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-white/50 text-xs">
            💡 Tip: Click on any variable to copy it, then paste it into your
            prompt content.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
