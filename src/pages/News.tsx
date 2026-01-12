import { motion } from "framer-motion";
import { useEffect } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

const NewsPage = () => {
  useEffect(() => {
    // Try to add padding to RssGrid element inside iframe and apply theme colors
    const style = document.createElement('style');
    style.textContent = `
      /* Try to target RssGrid class within iframe */
      iframe[src*="rss.app"] .RssGrid {
        padding-top: 40px !important;
      }

      /* Alternative selectors for RssGrid */
      .RssGrid,
      div.RssGrid,
      [class*="RssGrid"] {
        padding-top: 40px !important;
      }

      /* Apply app theme colors to iframe content */
      iframe[src*="rss.app"] {
        /* Background colors */
        background: linear-gradient(173.83deg, rgba(255,255,255,0.08) 4.82%, rgba(255,255,255,0) 38.08%, rgba(255,255,255,0) 56.68%, rgba(255,255,255,0.02) 95.1%) !important;
        background-color: rgba(26, 26, 26, 0.95) !important;
      }

      /* Text colors - white text like the app */
      iframe[src*="rss.app"] * {
        color: #ffffff !important;
      }

      /* Headings */
      iframe[src*="rss.app"] h1,
      iframe[src*="rss.app"] h2,
      iframe[src*="rss.app"] h3,
      iframe[src*="rss.app"] h4,
      iframe[src*="rss.app"] h5,
      iframe[src*="rss.app"] h6 {
        color: #ffffff !important;
      }

      /* Links */
      iframe[src*="rss.app"] a {
        color: #67B0B7 !important; /* Cyan/teal color from app gradient */
      }

      iframe[src*="rss.app"] a:hover {
        color: #ffffff !important;
      }

      /* Borders and accents */
      iframe[src*="rss.app"] .border,
      iframe[src*="rss.app"] [class*="border"] {
        border-color: rgba(255, 255, 255, 0.1) !important;
      }

      /* Cards and containers */
      iframe[src*="rss.app"] .card,
      iframe[src*="rss.app"] [class*="card"],
      iframe[src*="rss.app"] article,
      iframe[src*="rss.app"] .post {
        background: rgba(255, 255, 255, 0.02) !important;
        border: 1px solid rgba(255, 255, 255, 0.1) !important;
        border-radius: 12px !important;
      }

      /* Buttons and interactive elements */
      iframe[src*="rss.app"] button,
      iframe[src*="rss.app"] [class*="button"] {
        background: linear-gradient(180deg, #67B0B7 0%, #4066B3 100%) !important;
        color: #ffffff !important;
        border: none !important;
        border-radius: 8px !important;
      }

      /* Global dark theme overrides */
      iframe[src*="rss.app"] body,
      iframe[src*="rss.app"] html {
        background: rgba(26, 26, 26, 0.95) !important;
        color: #ffffff !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  return (
    <DashboardLayout>
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="relative mt-32 mb-8 flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-[66px] text-white"
      >
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, ease: "easeOut", delay: 0.1 }}
          className="mx-auto flex flex-col gap-2.5 space-y-3 pt-3 sm:pt-4 pb-6 px-3 sm:px-6 rounded-xl sm:rounded-[30px] w-full border-0 sm:border sm:border-white/10 bg-transparent sm:bg-[linear-gradient(173.83deg,_rgba(255,255,255,0.08)_4.82%,_rgba(255,255,255,0)_38.08%,_rgba(255,255,255,0)_56.68%,_rgba(255,255,255,0.02)_95.1%)] min-h-[600px] flex-1"
        >
          <header className="flex flex-col gap-2">
            <motion.h1
              className="text-3xl font-semibold tracking-tight text-white sm:text-4xl"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              News
            </motion.h1>
            <motion.p
              className="max-w-2xl text-sm text-white/70 sm:text-base"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              Stay updated with the latest industry news and trends.
            </motion.p>
          </header>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="-mt-3 flex-1 rounded-3xl border border-white/10 bg-white/[0.02] p-4 backdrop-blur sm:p-6"
            style={{
              minHeight: "1600px", // Set container height to 1600px
            }}
          >
            <iframe
              src="https://rss.app/embed/v1/magazine/tpBEhxBRMkMCEw3I"
              frameBorder="0"
              style={{
                width: "100%",
                height: "1600px", // Set iframe height to 1600px
                border: 0,
              }}
              title="News Feed"
            ></iframe>
          </motion.div>
        </motion.section>
      </motion.main>
    </DashboardLayout>
  );
};

export default NewsPage;