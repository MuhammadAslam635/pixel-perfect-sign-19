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
  const [searchTerm, setSearchTerm] = useState("");

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

  // Filter variables based on search term
  const filteredGroupedVariables = Object.entries(groupedVariables).reduce(
    (acc, [category, vars]) => {
      const filtered = vars.filter(
        (v) =>
          v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          v.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (filtered.length > 0) {
        acc[category] = filtered;
      }
      return acc;
    },
    {} as Record<string, Variable[]>
  );


  return (
    <Card className="bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] border-white/10 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-2">
          <CardTitle className="text-white/90 text-base flex items-center gap-2">
            <span>
              Available Variables
            </span>
          </CardTitle>
          <Badge
            variant="outline"
            className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 text-xs px-2 py-0.5"
          >
            {variables.length} total
          </Badge>
        </div>
        <p className="text-white/50 text-xs mb-3">
          {promptType.charAt(0).toUpperCase() + promptType.slice(1)} prompt variables
        </p>
        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search variables..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 pl-9 bg-black/30 border border-white/10 rounded-lg text-white text-sm placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
          />
        </div>
      </CardHeader>
      <CardContent className="max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        <div className="space-y-4">
          {Object.entries(filteredGroupedVariables).map(([category, vars]) => (
            <div key={category}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{category}</span>
                <h4 className="text-white/70 text-sm font-semibold tracking-wide">
                  {category}
                </h4>
                <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent" />
              </div>
              <div className="grid grid-cols-1 gap-2">
                {vars.map((variable) => (
                  <div
                    key={variable.name}
                    className={`relative bg-gradient-to-br rounded-lg p-3 border hover:border-cyan-400/40 transition-all duration-200 group cursor-pointer hover:shadow-lg hover:shadow-cyan-500/10`}
                    onClick={() => copyToClipboard(variable.name)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <code className="text-cyan-300 text-sm font-mono font-semibold px-2 py-0.5 bg-black/20 rounded border border-cyan-500/20">
                            {variable.name}
                          </code>
                          <div className="flex-shrink-0">
                            {copiedVar === variable.name ? (
                              <div className="flex items-center gap-1 text-green-400 text-xs">
                                <Check className="w-3 h-3" />
                                <span>Copied!</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-white/50 text-xs group-hover:text-cyan-300 transition-colors">
                                <Copy className="w-3 h-3" />
                                <span>Click to copy</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <p className="text-white/70 text-xs mb-1.5 leading-relaxed">
                          {variable.description}
                        </p>
                        <div className="flex items-start gap-1.5">
                          <span className="text-white/40 text-xs flex-shrink-0">Example:</span>
                          <code className="text-white/50 text-xs font-mono bg-black/20 px-1.5 py-0.5 rounded">
                            {variable.example}
                          </code>
                        </div>
                      </div>
                    </div>
                    {/* Hover indicator */}
                    <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-cyan-500/0 via-cyan-500/5 to-cyan-500/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  </div>
                ))}
              </div>
            </div>
          ))}
          {Object.keys(filteredGroupedVariables).length === 0 && (
            <div className="text-center py-8">
              <p className="text-white/50 text-sm">No variables found matching "{searchTerm}"</p>
            </div>
          )}
        </div>
        <div className="mt-6 pt-4 border-t border-white/10">
          <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-lg p-3 border border-cyan-500/20">
            <p className="text-white/70 text-xs flex items-start gap-2">
              <span>
                <strong className="text-cyan-300">Quick Tip:</strong> Click on any variable card to copy it instantly.
                Paste it directly into your prompt content where you want the dynamic value to appear.
              </span>
            </p>
          </div>
        </div>
      </CardContent>
      <style>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </Card>
  );
};
