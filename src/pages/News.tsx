import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

const NewsPage = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

      /* Hide scrollbars on news iframe container */
      .news-iframe-container {
        scrollbar-width: none !important; /* Firefox */
        -ms-overflow-style: none !important; /* IE and Edge */
        overflow-y: auto !important;
        overflow-x: hidden !important;
      }

      .news-iframe-container::-webkit-scrollbar {
        display: none !important; /* Chrome, Safari, Opera */
        width: 0 !important;
        height: 0 !important;
      }

      .news-iframe-container::-webkit-scrollbar-track {
        display: none !important;
      }

      .news-iframe-container::-webkit-scrollbar-thumb {
        display: none !important;
      }

      /* Hide scrollbars on iframe element */
      iframe[src*="rss.app"] {
        scrollbar-width: none !important; /* Firefox */
        -ms-overflow-style: none !important; /* IE and Edge */
      }

      /* Hide scrollbars on section and main containers */
      section[class*="rounded"],
      main[class*="px-4"] {
        scrollbar-width: none !important; /* Firefox */
        -ms-overflow-style: none !important; /* IE and Edge */
      }

      section[class*="rounded"]::-webkit-scrollbar,
      main[class*="px-4"]::-webkit-scrollbar {
        display: none !important;
        width: 0 !important;
        height: 0 !important;
      }
    `;
    document.head.appendChild(style);

    // Function to calculate and set iframe height dynamically
    const calculateIframeHeight = () => {
      if (containerRef.current && iframeRef.current) {
        const container = containerRef.current;
        const viewportHeight = window.innerHeight;
        const containerTop = container.getBoundingClientRect().top;
        const availableHeight = viewportHeight - containerTop - 20; // 20px padding
        
        // Set container height to fit viewport - this stays fixed on screen
        container.style.height = `${availableHeight}px`;
        container.style.maxHeight = `${availableHeight}px`;
        
        // Set iframe to a large height to accommodate all content
        // The container will scroll the iframe content (scrollbars hidden)
        iframeRef.current.style.height = '5000px'; // Large enough for all content
        iframeRef.current.style.width = '100%';
      }
    };

    // Calculate on mount and resize
    calculateIframeHeight();
    window.addEventListener('resize', calculateIframeHeight);

    return () => {
      // Restore body scrolling when component unmounts
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';

      window.removeEventListener('resize', calculateIframeHeight);

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
        className="relative px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-[66px] mt-20 sm:mt-20 lg:mt-24 xl:mt-28 mb-10 flex flex-col text-white flex-1 min-h-0 max-w-full"
      >
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, ease: "easeOut", delay: 0.1 }}
          className="relative mx-auto flex flex-col pt-3 sm:pt-4 rounded-xl sm:rounded-[30px] w-full h-full border-0 sm:border sm:border-white/10 bg-transparent sm:bg-[linear-gradient(173.83deg,_rgba(255,255,255,0.08)_4.82%,_rgba(255,255,255,0)_38.08%,_rgba(255,255,255,0)_56.68%,_rgba(255,255,255,0.02)_95.1%)] flex-1 min-w-0 min-h-0"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          <header className="flex flex-col gap-2 flex-shrink-0 pb-3 px-3 sm:px-6">
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
            ref={containerRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="news-iframe-container flex-1 min-h-0 rounded-3xl border border-white/10 bg-white/[0.02] p-0 backdrop-blur overflow-x-hidden scrollbar-hide"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              overflowY: "auto",
            }}
          >
            <iframe
              ref={iframeRef}
              src="https://rss.app/embed/v1/wall/tpBEhxBRMkMCEw3I"
              frameBorder="0"
              className="w-full border-0 block"
              style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
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