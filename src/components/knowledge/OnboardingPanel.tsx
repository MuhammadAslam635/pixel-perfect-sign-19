import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardCheck, FileText, MessageSquare } from "lucide-react";

const onboardingSteps = [
  {
    icon: ClipboardCheck,
    title: "Complete Requirements",
    description:
      "Share your brand brief, access preferences, and success criteria so we can tailor activation.",
  },
  {
    icon: FileText,
    title: "Upload Supporting Docs",
    description:
      "Provide playbooks, SOPs, or scripts that should inform hand-offs to your AI copilots.",
  },
  {
    icon: MessageSquare,
    title: "Schedule Kickoff",
    description:
      "We’ll review everything together, align timelines, and configure ongoing reporting.",
  },
];

const OnboardingPanel = () => {
  return (
    <div className="space-y-6 text-white">
      <Card className="bg-transparent p-0 border-none">
        <CardHeader className="p-0 mb-4">
          <CardTitle className="text-xs sm:text-sm md:text-base -mb-1">Company Onboarding</CardTitle>
          <p className="text-[10px] text-white/70">
            Follow these steps so we can activate your account and calibrate the
            right AI copilots for your team.
          </p>
        </CardHeader>
        <CardContent className="space-y-4 p-0">
          <div className="grid gap-3 md:grid-cols-3">
            {onboardingSteps.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.title}
                  className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-cyan-200">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <h3 className="text-xs sm:text-sm font-semibold">{step.title}</h3>
                    <p className="mt-0.5 text-[10px] text-white/70">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
            <h4 className="text-[11px] font-semibold uppercase  text-white/60">
              Need a hand?
            </h4>
            <p className="mt-2 text-[10px] text-white/70">
              Our onboarding team is ready to walk through requirements, help
              with configuration, or answer any workflow questions.
            </p>
            <Button
              className="mt-3 text-[10px] h-8 bg-gradient-to-r from-cyan-500/60 to-[#1F4C55] text-white hover:from-[#30cfd0] hover:to-[#2a9cb3]"
              style={{
                boxShadow:
                  "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
              }}
            >
              Talk to onboarding
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OnboardingPanel;
