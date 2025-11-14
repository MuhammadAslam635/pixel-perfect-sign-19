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
      <Card className="border border-white/15 bg-gradient-to-br from-[#1f3032] via-[#243f42] to-[#1b2c2d] shadow-[0_24px_55px_-30px_rgba(19,82,87,0.65)]">
        <CardHeader>
          <CardTitle className="text-2xl">Company Onboarding</CardTitle>
          <p className="text-sm text-white/70">
            Follow these steps so we can activate your account and calibrate the
            right AI copilots for your team.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            {onboardingSteps.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.title}
                  className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-5"
                >
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-cyan-200">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-base font-semibold">{step.title}</h3>
                    <p className="mt-1 text-sm text-white/70">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-[#3aa7b3]/20 via-[#2d6f8a]/20 to-transparent px-6 py-5">
            <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-100/80">
              Need a hand?
            </h4>
            <p className="mt-3 text-sm text-white/70">
              Our onboarding team is ready to walk through requirements, help
              with configuration, or answer any workflow questions.
            </p>
            <Button
              className="mt-4 bg-gradient-to-r from-cyan-500/60 to-[#1F4C55] text-white hover:from-[#30cfd0] hover:to-[#2a9cb3]"
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
