import { ChevronDown, ChevronRight, Folder, FolderOpen, Building2, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IndustryCategory } from "@/services/industryCategory.service";
import { motion } from "framer-motion";

interface CategoryItemProps {
    category: IndustryCategory;
    depth: number;
    expandedCategories: Set<string>;
    selectedCategory: IndustryCategory | null;
    toggleCategory: (categoryId: string) => void;
    setSelectedCategory: (category: IndustryCategory) => void;
    handleEdit: (category: IndustryCategory) => void;
    handleDelete: (category: IndustryCategory) => void;
}

const CategoryItem = ({
    category,
    depth,
    expandedCategories,
    selectedCategory,
    toggleCategory,
    setSelectedCategory,
    handleEdit,
    handleDelete,
}: CategoryItemProps) => {
    const isExpanded = expandedCategories.has(category._id);
    const hasChildren = category.children && category.children.length > 0;

    return (
        <div key={category._id} className="w-full">
            <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex items-center gap-2 p-3 rounded-lg border border-white/10 hover:border-white/20 transition-all bg-gradient-to-br from-gray-800/30 to-gray-900/20 ${selectedCategory?._id === category._id ? "border-[#69B4B7]" : ""
                    }`}
                style={{ marginLeft: `${depth * 24}px` }}
            >
                {/* Expand/Collapse Button */}
                <button
                    onClick={() => toggleCategory(category._id)}
                    className="flex-shrink-0"
                    disabled={!hasChildren}
                >
                    {hasChildren ? (
                        isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-[#69B4B7]" />
                        ) : (
                            <ChevronRight className="w-4 h-4 text-white/50" />
                        )
                    ) : (
                        <div className="w-4 h-4" />
                    )}
                </button>

                {/* Folder Icon */}
                {hasChildren ? (
                    isExpanded ? (
                        <FolderOpen className="w-5 h-5 text-[#69B4B7]" />
                    ) : (
                        <Folder className="w-5 h-5 text-white/50" />
                    )
                ) : (
                    <Building2 className="w-4 h-4 text-white/50" />
                )}

                {/* Category Info */}
                <div
                    className="flex-1 cursor-pointer"
                    onClick={() => setSelectedCategory(category)}
                >
                    <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{category.name}</span>
                        <Badge
                            className={`text-xs ${category.isActive
                                ? "bg-green-500/20 text-green-300 border-green-500/30"
                                : "bg-red-500/20 text-red-300 border-red-500/30"
                                }`}
                        >
                            Level {category.level}
                        </Badge>
                        {!category.isActive && (
                            <Badge className="text-xs bg-red-500/20 text-red-300 border-red-500/30">
                                Inactive
                            </Badge>
                        )}
                    </div>
                    {category.description && (
                        <p className="text-xs text-white/50 mt-1 truncate">
                            {category.description}
                        </p>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(category)}
                        className="text-white/70 hover:text-[#69B4B7] hover:bg-white/5"
                    >
                        <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(category)}
                        className="text-white/70 hover:text-red-400 hover:bg-white/5"
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            </motion.div>

            {/* Render Children */}
            {hasChildren && isExpanded && (
                <div className="mt-2 space-y-2">
                    {category.children!.map((child) =>
                        <CategoryItem
                            key={child._id}
                            category={child}
                            depth={depth + 1}
                            expandedCategories={expandedCategories}
                            selectedCategory={selectedCategory}
                            toggleCategory={toggleCategory}
                            setSelectedCategory={setSelectedCategory}
                            handleEdit={handleEdit}
                            handleDelete={handleDelete}
                        />
                    )}
                </div>
            )}
        </div>
    );
};

export default CategoryItem;