import { Check } from "lucide-react";
import { OnboardingStep } from "@/types/onboarding.types";

interface StepIndicatorProps {
  currentStep: number;
  steps: OnboardingStep[];
}

const StepIndicator = ({ currentStep, steps }: StepIndicatorProps) => {
  return (
    <div className="flex items-center justify-center">
      <div className="flex items-center gap-1">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;

          return (
            <div key={step.id} className="flex items-center">
              {/* Step Circle + Title inline */}
              <div className="flex items-center gap-1.5">
                {/* Step Circle - smaller */}
                <div
                  className={`
                    flex items-center justify-center w-5 h-5 rounded-full shrink-0
                    font-medium transition-all duration-300
                    ${
                      isCompleted
                        ? "bg-gradient-to-r from-[#30cfd0] via-[#2a9cb3] to-[#1f6f86] text-white"
                        : isCurrent
                        ? "bg-gradient-to-r from-[#30cfd0] via-[#2a9cb3] to-[#1f6f86] text-white"
                        : "bg-white/5 border border-white/20 text-white/40"
                    }
                  `}
                  style={{ fontSize: '12px' }}
                >
                  {isCompleted ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    stepNumber
                  )}
                </div>

                {/* Step Title - inline, 10px */}
                <span
                  className={`whitespace-nowrap ${
                    isCurrent ? "text-white" : isCompleted ? "text-cyan-400" : "text-white/40"
                  }`}
                  style={{ fontSize: '12px' }}
                >
                  {step.title}
                </span>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={`
                    w-6 h-0.5 mx-2 transition-all duration-300
                    ${isCompleted ? "bg-gradient-to-r from-cyan-500 to-blue-600" : "bg-white/10"}
                  `}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StepIndicator;
