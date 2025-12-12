import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";

export const NotificationsTab = () => {
  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();
    toast({
      title: "Notification preferences updated",
      description: "Your notification preferences have been saved.",
    });
  };

  return (
    <form onSubmit={handleSave}>
      <Card className="border-white/10 bg-white/[0.04] backdrop-blur-xl text-white">
        <CardHeader className="border-b border-white/10 bg-white/[0.02]">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <CardTitle className="text-white text-lg font-semibold">
              Notification Preferences
            </CardTitle>
            <CardDescription className="text-white/60">
              Choose how you want to stay informed.
            </CardDescription>
          </motion.div>
        </CardHeader>
        <CardContent className="space-y-5 p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <Label htmlFor="daily-digest" className="text-white/80">
                Daily Digest
              </Label>
              <p className="text-sm text-white/50">
                Receive a daily summary of activity.
              </p>
            </div>
            <Switch id="daily-digest" defaultChecked />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <Label htmlFor="lead-notifications" className="text-white/80">
                New Leads
              </Label>
              <p className="text-sm text-white/50">
                Get notified when new leads are captured.
              </p>
            </div>
            <Switch id="lead-notifications" defaultChecked />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <Label
                htmlFor="appointment-notifications"
                className="text-white/80"
              >
                Appointments
              </Label>
              <p className="text-sm text-white/50">
                Reminders for upcoming appointments.
              </p>
            </div>
            <Switch id="appointment-notifications" defaultChecked />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <Label
                htmlFor="milestone-notifications"
                className="text-white/80"
              >
                Milestones
              </Label>
              <p className="text-sm text-white/50">
                Updates when key milestones are reached.
              </p>
            </div>
            <Switch id="milestone-notifications" defaultChecked />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <Label htmlFor="request-updates" className="text-white/80">
                Request Updates
              </Label>
              <p className="text-sm text-white/50">
                Alerts when request statuses change.
              </p>
            </div>
            <Switch id="request-updates" defaultChecked />
          </div>
        </CardContent>
        <CardFooter className="justify-end border-t border-white/10 bg-white/[0.02]">
          <Button
            type="submit"
            className="mt-4 bg-gradient-to-r from-cyan-500/60 to-[#1F4C55] text-white hover:from-[#30cfd0] hover:to-[#2a9cb3]"
            style={{
              boxShadow:
                "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
            }}
          >
            Save Preferences
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
};

export default NotificationsTab;
