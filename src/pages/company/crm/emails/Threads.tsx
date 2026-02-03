import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { CrmNavigation } from "../shared/components/CrmNavigation";
import { EmailThreadItem } from "@/pages/company/crm/emails/components/EmailThreadItem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { emailService } from "@/services/email.service";
import { EmailThread } from "@/types/email.types";
import { Plus, Search, MessageSquare } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const ThreadsPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"all" | "starred">("all");
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data: threadsData, isLoading } = useQuery({
    queryKey: ["threads", filter, page],
    queryFn: () =>
      emailService.getEmailThreads({
        page,
        limit,
        starred: filter === "starred" ? true : undefined,
      }),
  });

  const filteredThreads =
    threadsData?.data?.threads?.filter((thread) => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return (
        thread.subject?.toLowerCase().includes(searchLower) ||
        thread.participants.some(
          (p) =>
            p.email.toLowerCase().includes(searchLower) ||
            p.name?.toLowerCase().includes(searchLower)
        ) ||
        thread.lastMessagePreview?.toLowerCase().includes(searchLower)
      );
    }) || [];

  const handleThreadClick = (thread: EmailThread) => {
    navigate(`/emails/threads/${thread._id}`);
  };

  const handleCompose = () => {
    navigate("/emails/compose");
  };

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
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-white">
                    Email Threads
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    {threadsData?.data?.pagination?.total || 0} conversations
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={handleCompose}
                  className="relative h-10 px-5 rounded-full border-0 text-white text-sm hover:bg-[#2F2F2F]/60 transition-all overflow-hidden"
                  style={{
                    background: "#FFFFFF1A",
                    boxShadow:
                      "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
                  }}
                >
                  {/* radial element 150px 150px */}
                  <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-[150px] h-[150px] rounded-full pointer-events-none"
                    style={{
                      background:
                        "radial-gradient(circle, #66AFB7 0%, transparent 70%)",
                      backdropFilter: "blur(50px)",
                      WebkitBackdropFilter: "blur(50px)",
                      zIndex: -1,
                    }}
                  ></div>
                  <Plus className="w-4 h-4 mr-2 relative z-10" />
                  <span className="relative z-10">Compose</span>
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-300px)] min-h-0">
                <div className="lg:col-span-1">
                  <Card className="h-full">
                    <CardHeader>
                      <CardTitle className="text-lg">Filters</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 overflow-y-auto">
                      <Button
                        variant={filter === "all" ? "default" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => setFilter("all")}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        All Threads
                      </Button>
                      <Button
                        variant={filter === "starred" ? "default" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => setFilter("starred")}
                      >
                        Starred
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                <div className="lg:col-span-3 flex flex-col gap-4 min-h-0">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search threads..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 rounded-full"
                      style={{
                        borderRadius: "9999px",
                      }}
                    />
                  </div>

                  <Card className="h-full flex flex-col min-h-0">
                    <CardHeader className="border-b">
                      <CardTitle className="text-lg">
                        {filter === "all" && "All Threads"}
                        {filter === "starred" && "Starred Threads"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-auto p-4 space-y-3">
                      {isLoading ? (
                        <div className="space-y-3">
                          {[...Array(5)].map((_, i) => (
                            <Skeleton key={i} className="h-32 w-full" />
                          ))}
                        </div>
                      ) : filteredThreads.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center py-12">
                          <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                          <p className="text-muted-foreground text-lg">
                            No threads found
                          </p>
                          <p className="text-muted-foreground text-sm mt-2">
                            {searchTerm
                              ? "Try adjusting your search"
                              : "No email threads yet"}
                          </p>
                        </div>
                      ) : (
                        filteredThreads.map((thread) => (
                          <EmailThreadItem
                            key={thread._id}
                            thread={thread}
                            onClick={() => handleThreadClick(thread)}
                          />
                        ))
                      )}
                    </CardContent>
                  </Card>

                  {threadsData?.data?.pagination &&
                    threadsData.data.pagination.pages > 1 && (
                      <div className="flex items-center justify-between">
                        <Button
                          variant="outline"
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={page === 1}
                        >
                          Previous
                        </Button>
                        <span className="text-sm text-muted-foreground">
                          Page {page} of {threadsData.data.pagination.pages}
                        </span>
                        <Button
                          variant="outline"
                          onClick={() =>
                            setPage((p) =>
                              Math.min(threadsData.data.pagination.pages, p + 1)
                            )
                          }
                          disabled={page === threadsData.data.pagination.pages}
                        >
                          Next
                        </Button>
                      </div>
                    )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.main>
    </DashboardLayout>
  );
};

export default ThreadsPage;