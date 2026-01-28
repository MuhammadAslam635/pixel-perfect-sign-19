import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { type PromptType } from "@/services/connectionMessages.service";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { Variable, variablesByType } from "./PromptVariableData";

interface PromptVariablesProps {
  promptType: PromptType;
}

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
            <span>Available Variables</span>
          </CardTitle>
          <Badge
            variant="outline"
            className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 text-xs px-2 py-0.5"
          >
            {variables.length} total
          </Badge>
        </div>
        <p className="text-white/50 text-xs mb-3">
          {promptType.charAt(0).toUpperCase() + promptType.slice(1)} prompt
          variables
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
      <CardContent className="max-h-[500px] overflow-y-auto hide-scrollbar">
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
                          <span className="text-white/40 text-xs flex-shrink-0">
                            Example:
                          </span>
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
              <p className="text-white/50 text-sm">
                No variables found matching "{searchTerm}"
              </p>
            </div>
          )}
        </div>
        <div className="mt-6 pt-4 border-t border-white/10">
          <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-lg p-3 border border-cyan-500/20">
            <p className="text-white/70 text-xs flex items-start gap-2">
              <span>
                <strong className="text-cyan-300">Quick Tip:</strong> Click on
                any variable card to copy it instantly. Paste it directly into
                your prompt content where you want the dynamic value to appear.
              </span>
            </p>
          </div>
        </div>
      </CardContent>
      <style>{`
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
          width: 0;
          height: 0;
        }
      `}</style>
    </Card>
  );
};
