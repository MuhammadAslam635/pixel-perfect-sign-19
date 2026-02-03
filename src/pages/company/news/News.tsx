import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import NewsCard from "@/pages/company/news/components/NewsCard";
import type { NewsItem } from "@/types/news";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";

const NewsPage = () => {
  // Disable body scrolling to match Dashboard behavior
  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, []);

  const fetchNews = async () => {
    const { data } = await axios.get("https://rss.app/api/widget/wall/tpBEhxBRMkMCEw3I");
    if (!data?.feed?.items) {
      throw new Error("Invalid data structure");
    }
    return data.feed.items;
  };

  const { data, isLoading, isError, error, } = useQuery<NewsItem[]>({
    queryKey: ["news"],
    queryFn: fetchNews,
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });

  return (
    <DashboardLayout>
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="relative px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-[66px] mt-28 mb-6 flex flex-col text-white h-[calc(100vh-140px)] max-w-full"
      >
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
          className="relative flex flex-col p-6 sm:p-8 rounded-[30px] w-full border border-white/10 backdrop-blur-xl flex-1 overflow-hidden shadow-2xl"
          style={{
            background: "#0A0A0A",
          }}
        >
          {/* Gradient overlay to match Schedule Meeting dialog */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "linear-gradient(173.83deg, rgba(255, 255, 255, 0.08) 4.82%, rgba(255, 255, 255, 0) 38.08%, rgba(255, 255, 255, 0) 56.68%, rgba(255, 255, 255, 0.02) 95.1%)"
            }}
          />
          {/* Header Section */}
          <header className="flex flex-col gap-1 flex-shrink-0 mb-6 relative z-10">
            <motion.h1
              className="text-3xl font-semibold tracking-tight text-white sm:text-4xl"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              News
            </motion.h1>
            <motion.p
              className="max-w-2xl text-sm text-white/50 sm:text-base font-light"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              Stay updated with the latest industry news and trends.
            </motion.p>
          </header>

          {/* News Feed Grid - Custom Implementation */}
          <div
            className="flex-1 w-full relative overflow-y-auto pr-2 scrollbar-hide z-10"
          >
            {isLoading ? (
              <div className="flex h-full items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
              </div>
            ) : isError ? (
              <div className="flex h-full items-center justify-center text-red-400">
                Error fetching news
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 pb-6 p-2">
                {data.map((item, index) => (
                  <NewsCard key={item.id} item={item} index={index} />
                ))}
              </div>
            )}
          </div>

          {/* Bottom Fade Mask */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/90 to-transparent pointer-events-none z-20" />

        </motion.section>
      </motion.main>
    </DashboardLayout>
  );
};

export default NewsPage;