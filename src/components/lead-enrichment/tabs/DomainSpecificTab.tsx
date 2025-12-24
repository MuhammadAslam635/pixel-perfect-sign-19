import { useState } from "react";
import { motion } from "framer-motion";
import { Building2, Plus, X, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import leadEnrichmentService from "@/services/leadEnrichment.service";
import { toast } from "sonner";

interface DomainSpecificTabProps {
  onEnrichmentStart: (searchId: string, estimatedTime: string) => void;
}

const DomainSpecificTab = ({ onEnrichmentStart }: DomainSpecificTabProps) => {
  const [domains, setDomains] = useState<string[]>([]);
  const [domainInput, setDomainInput] = useState("");
  const [bulkInput, setBulkInput] = useState("");
  const [showBulkInput, setShowBulkInput] = useState(false);
  const [invalidDomains, setInvalidDomains] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddDomain = () => {
    const trimmed = domainInput.trim();
    if (!trimmed) return;

    if (leadEnrichmentService.validateDomain(trimmed)) {
      if (!domains.includes(trimmed)) {
        setDomains([...domains, trimmed]);
        setDomainInput("");
        setInvalidDomains(invalidDomains.filter((d) => d !== trimmed));
        toast.success(`Added ${trimmed}`);
      } else {
        toast.error("Domain already added");
      }
    } else {
      toast.error("Invalid domain format");
      if (!invalidDomains.includes(trimmed)) {
        setInvalidDomains([...invalidDomains, trimmed]);
      }
    }
  };

  const handleBulkAdd = () => {
    const { valid, invalid } = leadEnrichmentService.parseDomains(bulkInput);

    if (valid.length > 0) {
      const newDomains = valid.filter((d) => !domains.includes(d));
      setDomains([...domains, ...newDomains]);
      toast.success(`Added ${newDomains.length} domains`);
    }

    if (invalid.length > 0) {
      setInvalidDomains([...invalidDomains, ...invalid]);
      toast.error(`${invalid.length} invalid domains`);
    }

    setBulkInput("");
    setShowBulkInput(false);
  };

  const handleRemoveDomain = (domain: string) => {
    setDomains(domains.filter((d) => d !== domain));
    toast.info(`Removed ${domain}`);
  };

  const handleEnrich = async () => {
    if (domains.length === 0) {
      toast.error("Please add at least one domain");
      return;
    }

    if (domains.length > 50) {
      toast.error("Maximum 50 domains allowed per request");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await leadEnrichmentService.enrichByDomain(domains);

      if (response.success) {
        toast.success(response.message);
        onEnrichmentStart(
          response.data.searchId,
          response.data.estimatedTime
        );
      } else {
        toast.error("Failed to start enrichment");
      }
    } catch (error: any) {
      console.error("Enrichment error:", error);
      toast.error(
        error.response?.data?.message || "Failed to start enrichment"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Description */}
      <Alert className="bg-blue-900/20 border-blue-500/30">
        <Building2 className="w-4 h-4 text-blue-400" />
        <AlertDescription className="text-gray-300 text-sm">
          <strong className="text-blue-400">Direct Domain Enrichment:</strong>{" "}
          Enter company domains to enrich directly without AI search. This
          bypasses Perplexity and sends requests straight to the Apollo
          microservice for faster processing.
        </AlertDescription>
      </Alert>

      {/* Domain Input */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-200 block">
          Add Company Domains
        </label>

        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Enter domain (e.g., microsoft.com)"
            value={domainInput}
            onChange={(e) => setDomainInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleAddDomain()}
            className="flex-1 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
          />
          <Button
            onClick={handleAddDomain}
            disabled={!domainInput.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add
          </Button>
        </div>

        {/* Bulk Input Toggle */}
        {!showBulkInput ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBulkInput(true)}
            className="text-gray-300 border-gray-700 hover:bg-gray-800"
          >
            Or add multiple domains at once
          </Button>
        ) : (
          <div className="space-y-2 p-4 bg-gray-800/30 rounded-lg border border-gray-700">
            <label className="text-xs font-medium text-gray-300 block">
              Bulk Add Domains (comma or newline separated)
            </label>
            <Textarea
              placeholder="example.com, company.com&#10;another-company.com"
              value={bulkInput}
              onChange={(e) => setBulkInput(e.target.value)}
              rows={4}
              className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 font-mono text-sm"
            />
            <div className="flex gap-2">
              <Button
                onClick={handleBulkAdd}
                disabled={!bulkInput.trim()}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Add All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowBulkInput(false);
                  setBulkInput("");
                }}
                className="text-gray-400"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Domain List */}
      {domains.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-200">
              Added Domains ({domains.length}/50)
            </label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDomains([])}
              className="text-xs text-gray-400 hover:text-red-400"
            >
              Clear All
            </Button>
          </div>

          <div className="max-h-[300px] overflow-y-auto bg-gray-800/30 rounded-lg border border-gray-700 p-3 space-y-2">
            {domains.map((domain, index) => (
              <motion.div
                key={domain}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between bg-gray-800/50 rounded px-3 py-2 group hover:bg-gray-800"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Building2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <span className="text-sm text-gray-200 truncate">
                    {domain}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveDomain(domain)}
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-400"
                >
                  <X className="w-3 h-3" />
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Invalid Domains Warning */}
      {invalidDomains.length > 0 && (
        <Alert className="bg-red-900/20 border-red-500/30">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <AlertDescription className="text-gray-300 text-sm">
            <strong className="text-red-400">Invalid domains:</strong>{" "}
            {invalidDomains.join(", ")}
          </AlertDescription>
        </Alert>
      )}

      {/* Submit Button */}
      <div className="pt-4 flex justify-between items-center">
        <div className="text-xs text-gray-400">
          {domains.length > 0 && (
            <span>
              Estimated time: ~
              {Math.ceil(domains.length * 2)}-{Math.ceil(domains.length * 10)}{" "}
              minutes
            </span>
          )}
        </div>
        <Button
          onClick={handleEnrich}
          disabled={domains.length === 0 || isSubmitting}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 px-8"
        >
          {isSubmitting ? (
            <>
              <motion.div
                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              Starting Enrichment...
            </>
          ) : (
            <>
              <Building2 className="w-4 h-4 mr-2" />
              Enrich {domains.length} {domains.length === 1 ? "Company" : "Companies"}
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
};

export default DomainSpecificTab;
