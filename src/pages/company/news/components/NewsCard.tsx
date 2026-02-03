
import { motion } from "framer-motion";
import { ExternalLink, Calendar, User } from "lucide-react";
import { NewsItem } from "@/types/news";
import { formatDistanceToNow } from "date-fns";

interface NewsCardProps {
  item: NewsItem;
  index: number;
}

const NewsCard = ({ item, index }: NewsCardProps) => {
  const timeAgo = formatDistanceToNow(new Date(item.date), { addSuffix: true });
  return (
    <motion.a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: "easeOut" }}
      whileHover={{ scale: 1.01, y: -2 }}
      className="group relative isolate flex flex-col h-full bg-[#1A1A1A] rounded-2xl overflow-hidden hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] transition-colors duration-300 transform-gpu"
      style={{ WebkitMaskImage: "-webkit-radial-gradient(white, black)" }}
    >
      {/* Image Section */}
      <div className="relative h-60 w-full overflow-hidden bg-[#222]">
        {item.originalImage ? (
          <motion.img
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            src={item.originalImage}
            alt={item.title}
            className="w-full h-full object-cover transform-gpu"
            onError={(e) => {
              // Fallback if image fails
              (e.target as HTMLImageElement).src = "https://placehold.co/600x400/1a1a1a/FFF?text=News";
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/20">
            <span className="text-sm">No Image</span>
          </div>
        )}

        {/* Site Badge */}
        {item.site && (
          <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
            <span className="text-xs font-medium text-white/90">{item.site}</span>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="flex flex-col flex-1 p-5 gap-3">
        {/* Meta Info */}
        <div className="flex items-center gap-1.5 text-xs text-white/40">
          <Calendar className="w-3.5 h-3.5" strokeWidth={1.5} />
          <span className="leading-none mt-[1px]">{timeAgo}</span>
        </div>

        {/* Title */}
        <h3 className="text-lg font-medium text-white/90 line-clamp-2 leading-snug group-hover:text-white transition-colors">
          {item.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-white/50 line-clamp-3 leading-relaxed">
          {item.description}
        </p>

        {/* Footer / Read More */}
        <div className="mt-auto pt-4 flex items-center justify-between border-t border-white/5">
          <div className="flex items-center gap-2 text-xs text-white/30">
            {item.author && (
              <span className="truncate max-w-[150px]">By {item.author}</span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs font-semibold text-white/70 group-hover:text-cyan-400 transition-colors">
            Read Article
            <ExternalLink className="w-3 h-3" />
          </div>
        </div>
      </div>

      {/* Overlay Border - Fixes image overflow/bleeding issues by rendering border ON TOP */}
      <div className="absolute inset-0 rounded-2xl border border-white/10 pointer-events-none z-10 group-hover:border-white/20 transition-colors duration-300" />
    </motion.a>
  );
};

export default NewsCard;