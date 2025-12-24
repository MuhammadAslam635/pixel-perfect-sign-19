import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Building2,
  Users,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import leadEnrichmentService from "@/services/leadEnrichment.service";
import type { EnrichmentMode, EnrichmentStatus } from "@/types/leadEnrichment";

interface EnrichmentProgressTrackerProps {
  searchId: string;
  estimatedTime: string;
  mode: EnrichmentMode;
  onComplete: () => void;
}

const EnrichmentProgressTracker = ({
  searchId,
  estimatedTime,
  mode,
  onComplete,
}: EnrichmentProgressTrackerProps) => {
  const [status, setStatus] = useState<EnrichmentStatus>("running");
  const [itemsProcessed, setItemsProcessed] = useState(0);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Start polling for status
    const pollStatus = async () => {
      try {
        const response = await leadEnrichmentService.getEnrichmentStatus(
          searchId
        );
        setStatus(response.data.status);
        setItemsProcessed(response.data.itemsProcessed);
        setQuery(response.data.query);

        // Calculate progress (rough estimate)
        if (response.data.status === "completed") {
          setProgress(100);
          onComplete();
        } else if (response.data.status === "failed") {
          setError("Enrichment failed. Please try again.");
        } else {
          // Estimate progress based on time
          const estimatedMinutes = parseInt(estimatedTime.split("-")[1]) || 10;
          const elapsedMinutes =
            (Date.now() - new Date(response.data.createdAt).getTime()) /
            60000;
          const estimatedProgress = Math.min(
            (elapsedMinutes / estimatedMinutes) * 100,
            95
          );
          setProgress(estimatedProgress);
        }
      } catch (err) {
        console.error("Failed to poll status:", err);
      }
    };

    // Poll every 5 seconds
    const intervalId = setInterval(pollStatus, 5000);
    pollStatus(); // Initial poll

    return () => clearInterval(intervalId);
  }, [searchId, estimatedTime, onComplete]);

  const getStatusIcon = () => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-8 h-8 text-green-400" />;
      case "failed":
        return <AlertCircle className="w-8 h-8 text-red-400" />;
      default:
        return (
          <motion.div
            className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        );
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "completed":
        return "Enrichment Complete!";
      case "failed":
        return "Enrichment Failed";
      case "running":
        return "Enriching Companies...";
      default:
        return "Processing...";
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "completed":
        return "text-green-400";
      case "failed":
        return "text-red-400";
      default:
        return "text-blue-400";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-6"
    >
      {/* Status Header */}
      <div className="flex flex-col items-center justify-center space-y-4 py-8">
        {getStatusIcon()}
        <div className="text-center space-y-2">
          <h3 className={`text-2xl font-bold ${getStatusColor()}`}>
            {getStatusText()}
          </h3>
          <p className="text-sm text-gray-400">
            {mode === "domain"
              ? "Direct domain enrichment in progress"
              : "AI-powered company discovery and enrichment"}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      {status === "running" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-300">Progress</span>
            <span className="text-blue-400 font-medium">
              {Math.round(progress)}%
            </span>
          </div>
          <Progress value={progress} className="h-2 bg-gray-800" />
          <p className="text-xs text-gray-400 text-center">
            Estimated time remaining: ~{estimatedTime}
          </p>
        </div>
      )}

      {/* Info Cards */}
      <div className="grid grid-cols-2 gap-4">
        {/* Search ID */}
        <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-medium text-gray-400">Search ID</span>
          </div>
          <p className="text-sm text-gray-200 font-mono truncate">{searchId}</p>
        </div>

        {/* Items Processed */}
        <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-medium text-gray-400">
              Items Processed
            </span>
          </div>
          <p className="text-2xl font-bold text-blue-400">{itemsProcessed}</p>
        </div>
      </div>

      {/* Query Display */}
      {query && (
        <div className="p-4 bg-purple-900/20 rounded-lg border border-purple-500/30">
          <div className="flex items-center gap-2 mb-2">
            {mode === "query" ? (
              <Sparkles className="w-4 h-4 text-purple-400" />
            ) : (
              <Building2 className="w-4 h-4 text-blue-400" />
            )}
            <span className="text-xs font-medium text-gray-300">Search Query</span>
          </div>
          <p className="text-sm text-gray-200">{query}</p>
        </div>
      )}

      {/* Error Alert */}
      {status === "failed" && error && (
        <Alert className="bg-red-900/20 border-red-500/30">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <AlertDescription className="text-gray-300 text-sm">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Success Message */}
      {status === "completed" && (
        <Alert className="bg-green-900/20 border-green-500/30">
          <CheckCircle2 className="w-4 h-4 text-green-400" />
          <AlertDescription className="text-gray-300 text-sm">
            <strong className="text-green-400">Success!</strong> Companies have
            been enriched with decision-makers. You can now view them in your
            companies list.
          </AlertDescription>
        </Alert>
      )}

      {/* Process Steps */}
      {status === "running" && (
        <div className="space-y-3">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            Processing Steps
          </p>
          <div className="space-y-2">
            <ProcessStep
              icon={<Building2 className="w-4 h-4" />}
              label="Stage 1: Company Enrichment"
              status="completed"
            />
            <ProcessStep
              icon={<Users className="w-4 h-4" />}
              label="Stage 2: Finding Decision Makers (RapidAPI)"
              status={progress > 25 ? "completed" : "running"}
            />
            <ProcessStep
              icon={<Users className="w-4 h-4" />}
              label="Stage 3: People Discovery (Apollo)"
              status={progress > 50 ? "completed" : progress > 25 ? "running" : "pending"}
            />
            <ProcessStep
              icon={<Users className="w-4 h-4" />}
              label="Stage 4: Contact Enrichment"
              status={progress > 75 ? "completed" : progress > 50 ? "running" : "pending"}
            />
          </div>
        </div>
      )}

      {/* Action Button */}
      {status === "completed" && (
        <div className="flex justify-center pt-4">
          <Button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            View Companies
          </Button>
        </div>
      )}
    </motion.div>
  );
};

// Process Step Component
const ProcessStep = ({
  icon,
  label,
  status,
}: {
  icon: React.ReactNode;
  label: string;
  status: "pending" | "running" | "completed";
}) => {
  const getStatusColor = () => {
    switch (status) {
      case "completed":
        return "text-green-400 border-green-500/50 bg-green-900/20";
      case "running":
        return "text-blue-400 border-blue-500/50 bg-blue-900/20";
      default:
        return "text-gray-500 border-gray-700 bg-gray-800/20";
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case "running":
        return (
          <motion.div
            className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        );
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg border ${getStatusColor()}`}
    >
      <div className="flex-shrink-0">{icon}</div>
      <div className="flex-1 text-sm font-medium">{label}</div>
      <div className="flex-shrink-0">{getStatusIcon()}</div>
    </div>
  );
};

export default EnrichmentProgressTracker;
