import { useState, useEffect } from "react";
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
import { notificationService } from "@/services/notification.service";

export const NotificationsTab = () => {
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState<any>({
    meeting: { scheduled: true, created: true },
    email: { sent: true, followUp: true },
    followup: {
      generated: true,
    },
    campaign: {
      created: true,
      launched: true,
      progress: true,
      ready: true,
      error: true,
      deleted: true,
    },
    leadEnrichment: { completed: true },
  });

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const response = await notificationService.getPreferences();
      if (response && response.data) {
        // Merge with defaults to ensure all keys exist
        setPreferences((prev: any) => ({
          ...prev,
          ...response.data,
          // Deep merge for nested objects if needed, but simple spread works if backend sends full structure
          // Or we can rely on backend defaults.
          meeting: { ...prev.meeting, ...response.data.meeting },
          email: { ...prev.email, ...response.data.email },
          campaign: { ...prev.campaign, ...response.data.campaign },
          followup: { ...prev.followup, ...response.data.followup },
          leadEnrichment: { ...prev.leadEnrichment, ...response.data.leadEnrichment },
        }));
      }
    } catch (error) {
      console.error("Failed to fetch preferences:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load notification preferences.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (category: string, key: string, checked: boolean) => {
    setPreferences((prev: any) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: checked,
      },
    }));
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await notificationService.updatePreferences(preferences);
      toast({
        title: "Notification preferences updated",
        description: "Your notification preferences have been saved.",
      });
    } catch (error) {
      console.error("Failed to update preferences:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save notification preferences.",
      });
    }
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
        <CardContent className="p-6">
          {/* Scrollable container with fixed height */}
          <div className="max-h-[400px] overflow-y-auto scrollbar-hide space-y-5 pr-2">

            {/* Calendar/Meeting Notifications */}
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <Label htmlFor="meeting-scheduled" className="text-white/80">
                  Meetings
                </Label>
                <p className="text-sm text-white/50">
                  Get notified when meetings are scheduled or created with leads.
                </p>
              </div>
              <Switch
                id="meeting-scheduled"
                checked={preferences.meeting?.scheduled}
                onCheckedChange={(checked) => {
                  handleToggle('meeting', 'scheduled', checked);
                  // Also update 'created' for backward compatibility/sync
                  handleToggle('meeting', 'created', checked);
                }}
              />
            </div>

            {/* Email & Follow-up Notifications */}
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <Label htmlFor="email-sent" className="text-white/80">
                  Email Sent
                </Label>
                <p className="text-sm text-white/50">
                  Get notified when emails are successfully sent.
                </p>
              </div>
              <Switch
                id="email-sent"
                checked={preferences.email?.sent}
                onCheckedChange={(checked) => handleToggle('email', 'sent', checked)}
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <Label htmlFor="follow-up-sent" className="text-white/80">
                  Follow-up Sent
                </Label>
                <p className="text-sm text-white/50">
                  Alerts when follow-up emails are sent to leads.
                </p>
              </div>
              <Switch
                id="follow-up-sent"
                checked={preferences.email?.followUp}
                onCheckedChange={(checked) => handleToggle('email', 'followUp', checked)}
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <Label htmlFor="follow-up-generated" className="text-white/80">
                  Follow-up Generated
                </Label>
                <p className="text-sm text-white/50">
                  Alerts when suggested follow-ups are ready.
                </p>
              </div>
              <Switch
                id="follow-up-generated"
                checked={preferences.followup?.generated}
                onCheckedChange={(checked) => handleToggle('followup', 'generated', checked)}
              />
            </div>

            {/* Campaign Notifications */}
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <Label htmlFor="campaign-created" className="text-white/80">
                  Campaign Created
                </Label>
                <p className="text-sm text-white/50">
                  Get notified when new campaigns are created.
                </p>
              </div>
              <Switch
                id="campaign-created"
                checked={preferences.campaign?.created}
                onCheckedChange={(checked) => handleToggle('campaign', 'created', checked)}
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <Label htmlFor="campaign-launched" className="text-white/80">
                  Campaign Launched
                </Label>
                <p className="text-sm text-white/50">
                  Alerts when campaigns are successfully launched.
                </p>
              </div>
              <Switch
                id="campaign-launched"
                checked={preferences.campaign?.launched}
                onCheckedChange={(checked) => handleToggle('campaign', 'launched', checked)}
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <Label htmlFor="campaign-progress" className="text-white/80">
                  Campaign Progress
                </Label>
                <p className="text-sm text-white/50">
                  Updates during campaign workflow steps.
                </p>
              </div>
              <Switch
                id="campaign-progress"
                checked={preferences.campaign?.progress}
                onCheckedChange={(checked) => handleToggle('campaign', 'progress', checked)}
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <Label htmlFor="campaign-ready" className="text-white/80">
                  Campaign Ready
                </Label>
                <p className="text-sm text-white/50">
                  Get notified when campaigns are ready to launch.
                </p>
              </div>
              <Switch
                id="campaign-ready"
                checked={preferences.campaign?.ready}
                onCheckedChange={(checked) => handleToggle('campaign', 'ready', checked)}
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <Label htmlFor="campaign-error" className="text-white/80">
                  Campaign Errors
                </Label>
                <p className="text-sm text-white/50">
                  Alerts when campaign errors occur.
                </p>
              </div>
              <Switch
                id="campaign-error"
                checked={preferences.campaign?.error}
                onCheckedChange={(checked) => handleToggle('campaign', 'error', checked)}
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <Label htmlFor="campaign-deleted" className="text-white/80">
                  Campaign Deleted
                </Label>
                <p className="text-sm text-white/50">
                  Get notified when campaigns are deleted.
                </p>
              </div>
              <Switch
                id="campaign-deleted"
                checked={preferences.campaign?.deleted}
                onCheckedChange={(checked) => handleToggle('campaign', 'deleted', checked)}
              />
            </div>

            {/* Lead Generation Notifications */}
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <Label htmlFor="web-scraping" className="text-white/80">
                  Lead Enrichment
                </Label>
                <p className="text-sm text-white/50">
                  Get notified when lead enrichment and web scraping completes.
                </p>
              </div>
              <Switch
                id="web-scraping"
                checked={preferences.leadEnrichment?.completed}
                onCheckedChange={(checked) => handleToggle('leadEnrichment', 'completed', checked)}
              />
            </div>

          </div>
        </CardContent>
        <CardFooter className="justify-end border-t border-white/10 bg-white/[0.02]">
          <Button
            type="submit"
            disabled={loading}
            className="mt-4 bg-gradient-to-r from-cyan-500/60 to-[#1F4C55] text-white hover:from-[#30cfd0] hover:to-[#2a9cb3]"
            style={{
              boxShadow:
                "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
            }}
          >
            {loading ? "Saving..." : "Save Preferences"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
};

export default NotificationsTab;
