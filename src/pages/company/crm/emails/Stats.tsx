import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { CrmNavigation } from "../shared/components/CrmNavigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { emailService } from "@/services/email.service";
import { Mail, MailOpen, Send, Inbox, Star, MessageSquare } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const EmailStatsPage = () => {
  const { data: statsData, isLoading } = useQuery({
    queryKey: ["emailStats"],
    queryFn: () => emailService.getEmailStats(),
  });

  const stats = statsData?.data;

  const statCards = [
    {
      title: "Total Emails",
      value: stats?.totalEmails || 0,
      icon: Mail,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Unread Emails",
      value: stats?.unreadEmails || 0,
      icon: MailOpen,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
    {
      title: "Sent Emails",
      value: stats?.sentEmails || 0,
      icon: Send,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Received Emails",
      value: stats?.receivedEmails || 0,
      icon: Inbox,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "Starred Emails",
      value: stats?.starredEmails || 0,
      icon: Star,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
    },
    {
      title: "Total Threads",
      value: stats?.totalThreads || 0,
      icon: MessageSquare,
      color: "text-cyan-500",
      bgColor: "bg-cyan-500/10",
    },
  ];

  const readRate = stats
    ? ((stats.totalEmails - stats.unreadEmails) / stats.totalEmails) * 100
    : 0;
  const sentReceivedRatio = stats
    ? stats.receivedEmails > 0
      ? (stats.sentEmails / stats.receivedEmails) * 100
      : 0
    : 0;

  return (
    <DashboardLayout>
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16 pt-20 sm:pt-24 md:pt-28 lg:pt-32 pb-6 sm:pb-8 flex flex-col gap-4 sm:gap-6 text-white min-h-screen overflow-x-hidden"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          className="max-w-[1600px] mx-auto w-full min-h-0"
        >
          {/* Wrapper with space-between */}
          <div className="flex items-center justify-between mb-4">
            {/* Page Header with Navigation */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }}
            >
              <CrmNavigation />
            </motion.div>
          </div>

          <div className="relative flex w-full flex-1 min-h-0 max-h-[calc(100vh-6rem)] justify-center overflow-hidden px-4 pb-6 sm:px-6 md:px-10 lg:px-12 xl:px-16">
            <div className="flex w-full flex-1 min-h-0 flex-col gap-6 overflow-hidden">
              <div>
                <h1 className="text-3xl font-bold text-white">Email Statistics</h1>
                <p className="text-muted-foreground mt-1">Overview of your email activity</p>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-32" />
                  ))}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {statCards.map((stat) => {
                      const Icon = stat.icon;
                      return (
                        <Card key={stat.title}>
                          <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                              {stat.title}
                            </CardTitle>
                            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                              <Icon className={`h-5 w-5 ${stat.color}`} />
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="text-3xl font-bold">{stat.value}</div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Email Read Rate</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Read Rate</span>
                            <span className="text-2xl font-bold">{readRate.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-4">
                            <div
                              className="bg-primary h-4 rounded-full transition-all"
                              style={{ width: `${readRate}%` }}
                            />
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Read: </span>
                              <span className="font-semibold">
                                {stats ? stats.totalEmails - stats.unreadEmails : 0}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Unread: </span>
                              <span className="font-semibold">{stats?.unreadEmails || 0}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Email Activity</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Send className="h-4 w-4 text-green-500" />
                              <span className="text-sm">Sent</span>
                            </div>
                            <span className="text-lg font-semibold">{stats?.sentEmails || 0}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Inbox className="h-4 w-4 text-purple-500" />
                              <span className="text-sm">Received</span>
                            </div>
                            <span className="text-lg font-semibold">{stats?.receivedEmails || 0}</span>
                          </div>
                          <div className="pt-2 border-t">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Sent/Received Ratio</span>
                              <span className="text-lg font-semibold">
                                {sentReceivedRatio.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </motion.main>
    </DashboardLayout>
  );
};

export default EmailStatsPage;