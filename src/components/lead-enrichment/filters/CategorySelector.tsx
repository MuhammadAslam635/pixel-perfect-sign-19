import { useState, useEffect } from "react";
import { ChevronRight, ChevronDown, Building2, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import leadEnrichmentService from "@/services/leadEnrichment.service";
import type { IndustryCategoryTree } from "@/types/leadEnrichment";

interface CategorySelectorProps {
  selectedCategories: string[];
  onChange: (categoryIds: string[]) => void;
}

const CategorySelector = ({
  selectedCategories,
  onChange,
}: CategorySelectorProps) => {
  const [categories, setCategories] = useState<IndustryCategoryTree[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await leadEnrichmentService.getIndustryCategoryTree();
      setCategories(response.data.tree);
    } catch (error) {
      console.error("Failed to load categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const toggleCategory = (categoryId: string) => {
    const newSelected = selectedCategories.includes(categoryId)
      ? selectedCategories.filter((id) => id !== categoryId)
      : [...selectedCategories, categoryId];
    onChange(newSelected);
  };

  const getCategoryName = (categoryId: string): string => {
    const findCategory = (
      cats: IndustryCategoryTree[]
    ): IndustryCategoryTree | null => {
      for (const cat of cats) {
        if (cat._id === categoryId) return cat;
        if (cat.children) {
          const found = findCategory(cat.children);
          if (found) return found;
        }
      }
      return null;
    };
    return findCategory(categories)?.name || "";
  };

  const renderCategory = (
    category: IndustryCategoryTree,
    level: number = 0
  ) => {
    const isExpanded = expandedCategories.has(category._id);
    const isSelected = selectedCategories.includes(category._id);
    const hasChildren = category.children && category.children.length > 0;

    return (
      <div key={category._id} className="w-full">
        <div
          className={`flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-gray-800/50 transition-colors ${
            isSelected ? "bg-blue-900/30" : ""
          }`}
          style={{ paddingLeft: `${level * 20 + 12}px` }}
        >
          {/* Expand/Collapse Button */}
          {hasChildren && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => toggleExpand(category._id)}
              className="h-5 w-5 p-0 hover:bg-transparent"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-400" />
              )}
            </Button>
          )}

          {/* Checkbox */}
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => toggleCategory(category._id)}
            className={`${
              !hasChildren ? "ml-5" : ""
            } border-gray-600 data-[state=checked]:bg-blue-600`}
          />

          {/* Category Name */}
          <div className="flex-1 flex items-center gap-2">
            <Building2
              className={`w-4 h-4 ${
                level === 0
                  ? "text-blue-400"
                  : level === 1
                  ? "text-purple-400"
                  : "text-green-400"
              }`}
            />
            <span
              className={`text-sm ${
                isSelected ? "text-white font-medium" : "text-gray-300"
              }`}
            >
              {category.name}
            </span>
          </div>

          {/* Level Badge */}
          <Badge
            variant="outline"
            className={`text-xs ${
              level === 0
                ? "border-blue-500/30 text-blue-400"
                : level === 1
                ? "border-purple-500/30 text-purple-400"
                : "border-green-500/30 text-green-400"
            }`}
          >
            L{level + 1}
          </Badge>
        </div>

        {/* Children */}
        <AnimatePresence>
          {isExpanded && hasChildren && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              {category.children.map((child) =>
                renderCategory(child, level + 1)
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <motion.div
          className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <span className="ml-3 text-sm text-gray-400">Loading categories...</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-200">
          Industry Categories
        </label>
        {selectedCategories.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange([])}
            className="text-xs text-gray-400 hover:text-red-400 h-6"
          >
            Clear ({selectedCategories.length})
          </Button>
        )}
      </div>

      {/* Selected Categories Summary */}
      {selectedCategories.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-gray-800/30 rounded-lg border border-gray-700">
          {selectedCategories.map((catId) => (
            <Badge
              key={catId}
              variant="secondary"
              className="bg-blue-900/40 text-blue-300 border-blue-500/30"
            >
              {getCategoryName(catId)}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => toggleCategory(catId)}
                className="ml-1 h-3 w-3 p-0 hover:bg-transparent"
              >
                <Check className="w-3 h-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* Category Tree */}
      <div className="max-h-[400px] overflow-y-auto scrollbar-hide bg-gray-800/20 rounded-lg border border-gray-700 p-2">
        {categories.length > 0 ? (
          categories.map((category) => renderCategory(category, 0))
        ) : (
          <p className="text-sm text-gray-400 text-center py-4">
            No categories available
          </p>
        )}
      </div>

      {/* Quick Expand All */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            setExpandedCategories(
              new Set(categories.map((c) => c._id))
            )
          }
          className="text-xs border-gray-700 text-gray-400"
        >
          Expand All
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setExpandedCategories(new Set())}
          className="text-xs border-gray-700 text-gray-400"
        >
          Collapse All
        </Button>
      </div>
    </div>
  );
};

export default CategorySelector;
