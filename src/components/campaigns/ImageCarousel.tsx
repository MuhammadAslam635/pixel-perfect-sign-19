import React, { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageCarouselProps {
  images: string[];
  onRemove?: (index: number) => void;
  editable?: boolean;
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({
  images,
  onRemove,
  editable = false,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Get backend URL and remove /api if present (static files are served without /api)
  const getBaseUrl = () => {
    const backendUrl =
      import.meta.env.VITE_APP_BACKEND_URL || "http://localhost:3000";
    // Remove /api or /api/ from the end if present
    return backendUrl.replace(/\/api\/?$/, "");
  };

  // Helper function to get the full image URL
  const getImageUrl = (image: string) => {
    // If it's already a full URL (http/https) or base64, return as is
    if (
      image.startsWith("http://") ||
      image.startsWith("https://") ||
      image.startsWith("data:")
    ) {
      return image;
    }
    // Otherwise, construct the URL with backend URL (without /api)
    const baseUrl = getBaseUrl();
    return `${baseUrl}/uploads/${image}`;
  };

  if (!images || images.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-slate-100 dark:bg-slate-800 rounded-lg">
        <p className="text-muted-foreground">No images available</p>
      </div>
    );
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRemove) {
      onRemove(currentIndex);
      if (currentIndex >= images.length - 1) {
        setCurrentIndex(Math.max(0, images.length - 2));
      }
    }
  };

  return (
    <div className="relative group w-full">
      {/* Main Image Display */}
      <div className="relative h-96 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden w-full">
        <img
          src={getImageUrl(images[currentIndex])}
          alt={`Slide ${currentIndex + 1}`}
          className="w-full h-full object-contain"
          onError={(e) => {
            // Fallback if image fails to load
            e.currentTarget.src =
              "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBub3QgZm91bmQ8L3RleHQ+PC9zdmc+";
          }}
        />

        {/* Remove Button (only in edit mode) */}
        {editable && onRemove && (
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 z-10"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        )}

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
              onClick={goToPrevious}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
              onClick={goToNext}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </>
        )}

        {/* Image Counter */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
          {currentIndex + 1} / {images.length}
        </div>
      </div>

      {/* Thumbnail Navigation */}
      {images.length > 1 && (
        <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide w-full">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                index === currentIndex
                  ? "border-blue-500 scale-105"
                  : "border-slate-300 dark:border-slate-600 hover:border-blue-300"
              }`}
            >
              <img
                src={getImageUrl(image)}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src =
                    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjZWVlIi8+PC9zdmc+";
                }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageCarousel;

