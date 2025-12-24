import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AdminLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FolderTree,
  Plus,
  Edit,
  Trash2,
  Search,
  ChevronRight,
  ChevronDown,
  Building2,
  Users,
  RefreshCw,
  X,
  Folder,
  FolderOpen,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  industryCategoryService,
  IndustryCategory,
  CreateCategoryData,
} from "@/services/industryCategory.service";
import { toast } from "sonner";

const AdminIndustryCategories = () => {
  const [categoryTree, setCategoryTree] = useState<IndustryCategory[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<IndustryCategory | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<IndustryCategory | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateCategoryData>({
    name: "",
    description: "",
    parentId: null,
    metadata: {
      dnbCode: "",
      naicsCode: "",
      sicCode: "",
      isicCode: "",
    },
    keywords: [],
    isActive: true,
    sortOrder: 0,
  });

  // Statistics
  const [statistics, setStatistics] = useState({
    totalCategories: 0,
    level1: 0,
    level2: 0,
    level3: 0,
    activeCategories: 0,
    inactiveCategories: 0,
  });

  // Fetch category tree
  const fetchCategoryTree = useCallback(async () => {
    setLoading(true);
    try {
      const response = await industryCategoryService.getCategoryTree(true);
      if (response.success && response.data) {
        // Backend returns { data: { tree: [...], totalCategories: number } }
        const treeData = Array.isArray(response.data) ? response.data : (response.data.tree || []);
        setCategoryTree(treeData);
        calculateStatistics(treeData);
      }
    } catch (error: any) {
      console.error("Error fetching category tree:", error);
      toast.error(error?.response?.data?.message || "Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategoryTree();
  }, [fetchCategoryTree]);

  // Calculate statistics
  const calculateStatistics = (categories: IndustryCategory[]) => {
    let total = 0;
    let level1 = 0;
    let level2 = 0;
    let level3 = 0;
    let active = 0;
    let inactive = 0;

    const countCategories = (cats: IndustryCategory[]) => {
      cats.forEach((cat) => {
        total++;
        if (cat.level === 1) level1++;
        if (cat.level === 2) level2++;
        if (cat.level === 3) level3++;
        if (cat.isActive) active++;
        else inactive++;

        if (cat.children && cat.children.length > 0) {
          countCategories(cat.children);
        }
      });
    };

    countCategories(categories);

    setStatistics({
      totalCategories: total,
      level1,
      level2,
      level3,
      activeCategories: active,
      inactiveCategories: inactive,
    });
  };

  // Toggle category expansion
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  // Expand all categories
  const expandAll = () => {
    const allIds = new Set<string>();
    const collectIds = (categories: IndustryCategory[]) => {
      categories.forEach((cat) => {
        allIds.add(cat._id);
        if (cat.children && cat.children.length > 0) {
          collectIds(cat.children);
        }
      });
    };
    collectIds(categoryTree);
    setExpandedCategories(allIds);
  };

  // Collapse all categories
  const collapseAll = () => {
    setExpandedCategories(new Set());
  };

  // Handle create category
  const handleCreate = () => {
    setFormData({
      name: "",
      description: "",
      parentId: selectedCategory?._id || null,
      metadata: {
        dnbCode: "",
        naicsCode: "",
        sicCode: "",
        isicCode: "",
      },
      keywords: [],
      isActive: true,
      sortOrder: 0,
    });
    setIsCreateDialogOpen(true);
  };

  // Handle edit category
  const handleEdit = (category: IndustryCategory) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
      parentId: category.parentId || null,
      metadata: category.metadata || {},
      keywords: category.keywords || [],
      isActive: category.isActive,
      sortOrder: category.sortOrder,
    });
    setIsEditDialogOpen(true);
  };

  // Handle delete category
  const handleDelete = (category: IndustryCategory) => {
    setCategoryToDelete(category);
    setIsDeleteDialogOpen(true);
  };

  // Submit create
  const submitCreate = async () => {
    try {
      const response = await industryCategoryService.createCategory(formData);
      if (response.success) {
        toast.success("Category created successfully");
        setIsCreateDialogOpen(false);
        fetchCategoryTree();
      }
    } catch (error: any) {
      console.error("Error creating category:", error);
      toast.error(error?.response?.data?.message || "Failed to create category");
    }
  };

  // Submit edit
  const submitEdit = async () => {
    if (!selectedCategory) return;

    try {
      const response = await industryCategoryService.updateCategory(
        selectedCategory._id,
        formData
      );
      if (response.success) {
        toast.success("Category updated successfully");
        setIsEditDialogOpen(false);
        fetchCategoryTree();
      }
    } catch (error: any) {
      console.error("Error updating category:", error);
      toast.error(error?.response?.data?.message || "Failed to update category");
    }
  };

  // Submit delete
  const submitDelete = async () => {
    if (!categoryToDelete) return;

    try {
      const response = await industryCategoryService.deleteCategory(categoryToDelete._id);
      if (response.success) {
        toast.success("Category deleted successfully");
        setIsDeleteDialogOpen(false);
        setCategoryToDelete(null);
        fetchCategoryTree();
      }
    } catch (error: any) {
      console.error("Error deleting category:", error);
      toast.error(error?.response?.data?.message || "Failed to delete category");
    }
  };

  // Filter categories by search
  const filterCategories = (
    categories: IndustryCategory[],
    search: string
  ): IndustryCategory[] => {
    if (!search) return categories;

    const searchLower = search.toLowerCase();
    return categories.filter((cat) => {
      const matchesName = cat.name.toLowerCase().includes(searchLower);
      const matchesDescription = cat.description?.toLowerCase().includes(searchLower);
      const matchesChildren =
        cat.children && cat.children.length > 0
          ? filterCategories(cat.children, search).length > 0
          : false;

      return matchesName || matchesDescription || matchesChildren;
    });
  };

  const filteredCategoryTree = filterCategories(categoryTree, searchTerm);

  // Render category tree item
  const renderCategoryItem = (category: IndustryCategory, depth = 0) => {
    const isExpanded = expandedCategories.has(category._id);
    const hasChildren = category.children && category.children.length > 0;

    return (
      <div key={category._id} className="w-full">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className={`flex items-center gap-2 p-3 rounded-lg border border-white/10 hover:border-white/20 transition-all bg-gradient-to-br from-gray-800/30 to-gray-900/20 ${
            selectedCategory?._id === category._id ? "border-[#69B4B7]" : ""
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
                className={`text-xs ${
                  category.isActive
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
            {/* {category.stats && (
              <div className="flex items-center gap-4 mt-1 text-xs text-white/50">
                <span className="flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  {category.stats.totalCompanies} companies
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {category.stats.totalLeads} leads
                </span>
              </div>
            )} */}
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
            {category.children!.map((child) => renderCategoryItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <AdminLayout>
      <main className="relative px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-[66px] mt-20 sm:mt-20 lg:mt-24 xl:mt-28 mb-0 flex flex-col gap-6 text-white flex-1 overflow-y-auto scrollbar-hide">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white my-2 flex items-center gap-2">
              <FolderTree className="w-6 h-6" />
              Industry Categories
            </h1>
            <p className="text-white/60">
              Manage hierarchical industry classification for companies and leads
            </p>
          </div>
          <Button
            onClick={handleCreate}
            className="bg-gradient-to-r from-[#69B4B7] to-[#3E64B4] hover:from-[#69B4B7]/80 hover:to-[#3E64B4]/80"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Category
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 sm:gap-6 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
          <Card className="bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] border-white/10 hover:border-white/20 transition-all duration-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-white/70 flex items-center gap-2 text-sm">
                <FolderTree className="w-4 h-4" />
                Total
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="text-2xl sm:text-3xl font-bold text-white">
                {statistics.totalCategories}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] border-white/10 hover:border-white/20 transition-all duration-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-white/70 flex items-center gap-2 text-sm">
                Level 1
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="text-2xl sm:text-3xl font-bold text-[#69B4B7]">
                {statistics.level1}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] border-white/10 hover:border-white/20 transition-all duration-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-white/70 flex items-center gap-2 text-sm">
                Level 2
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="text-2xl sm:text-3xl font-bold text-blue-400">
                {statistics.level2}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] border-white/10 hover:border-white/20 transition-all duration-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-white/70 flex items-center gap-2 text-sm">
                Level 3
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="text-2xl sm:text-3xl font-bold text-purple-400">
                {statistics.level3}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] border-white/10 hover:border-white/20 transition-all duration-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-white/70 flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4" />
                Active
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="text-2xl sm:text-3xl font-bold text-green-400">
                {statistics.activeCategories}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] border-white/10 hover:border-white/20 transition-all duration-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-white/70 flex items-center gap-2 text-sm">
                <XCircle className="w-4 h-4" />
                Inactive
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="text-2xl sm:text-3xl font-bold text-red-400">
                {statistics.inactiveCategories}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <Card className="bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] border-white/10">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/50" />
                <Input
                  placeholder="Search categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full rounded-full bg-black/35 border border-white/10 text-white placeholder:text-white/50 focus:ring-2 focus:ring-cyan-400/40"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={expandAll}
                  className="bg-black/35 border border-white/10 text-white/70 hover:text-white hover:bg-white/5"
                >
                  Expand All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={collapseAll}
                  className="bg-black/35 border border-white/10 text-white/70 hover:text-white hover:bg-white/5"
                >
                  Collapse All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchCategoryTree}
                  className="bg-black/35 border border-white/10 text-white/70 hover:text-white hover:bg-white/5"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                {searchTerm && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSearchTerm("")}
                    className="bg-black/35 border border-white/10 text-white/70 hover:text-white hover:bg-white/5"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category Tree */}
        <Card className="bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] border-white/10">
          <CardHeader>
            <CardTitle className="text-white/70 flex items-center gap-2">
              <FolderTree className="w-5 h-5" />
              Category Hierarchy
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-8 h-8 border-4 border-[#69B4B7]/30 border-t-[#69B4B7] rounded-full animate-spin mb-3" />
                <p className="text-white/60 text-sm">Loading categories...</p>
              </div>
            ) : filteredCategoryTree.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <FolderTree className="w-12 h-12 text-white/30 mb-4" />
                <p className="text-white/70 text-base font-medium mb-1">
                  {searchTerm ? "No categories found" : "No categories yet"}
                </p>
                <p className="text-white/50 text-sm text-center max-w-md">
                  {searchTerm
                    ? "Try adjusting your search terms."
                    : "Get started by creating your first industry category."}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredCategoryTree.map((category) => renderCategoryItem(category))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="bg-gradient-to-br from-gray-800/95 to-gray-900/95 border border-white/20 text-white max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-hide">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Create Industry Category</DialogTitle>
              <DialogDescription className="text-white/60">
                Add a new industry category to the hierarchy
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-white/70 mb-2 block">
                  Category Name *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Technology, Manufacturing, Healthcare"
                  className="bg-gradient-to-br from-gray-800/50 to-gray-900/30 border border-white/10 text-white"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-white/70 mb-2 block">
                  Description
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this category"
                  rows={3}
                  className="bg-gradient-to-br from-gray-800/50 to-gray-900/30 border border-white/10 text-white scrollbar-hide"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-white/70 mb-2 block">
                    NAICS Code
                  </label>
                  <Input
                    value={formData.metadata?.naicsCode || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        metadata: { ...formData.metadata, naicsCode: e.target.value },
                      })
                    }
                    placeholder="e.g., 541512"
                    className="bg-gradient-to-br from-gray-800/50 to-gray-900/30 border border-white/10 text-white"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-white/70 mb-2 block">
                    SIC Code
                  </label>
                  <Input
                    value={formData.metadata?.sicCode || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        metadata: { ...formData.metadata, sicCode: e.target.value },
                      })
                    }
                    placeholder="e.g., 7372"
                    className="bg-gradient-to-br from-gray-800/50 to-gray-900/30 border border-white/10 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-white/70 mb-2 block">
                    Sort Order
                  </label>
                  <Input
                    type="number"
                    value={formData.sortOrder || 0}
                    onChange={(e) =>
                      setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })
                    }
                    className="bg-gradient-to-br from-gray-800/50 to-gray-900/30 border border-white/10 text-white"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-white/70 mb-2 block">
                    Status
                  </label>
                  <Select
                    value={formData.isActive ? "active" : "inactive"}
                    onValueChange={(value) =>
                      setFormData({ ...formData, isActive: value === "active" })
                    }
                  >
                    <SelectTrigger className="bg-gradient-to-br from-gray-800/50 to-gray-900/30 border border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                className="border border-white/10 text-white/70 hover:bg-white/5"
              >
                Cancel
              </Button>
              <Button
                onClick={submitCreate}
                disabled={!formData.name}
                className="bg-gradient-to-r from-[#69B4B7] to-[#3E64B4] hover:from-[#69B4B7]/80 hover:to-[#3E64B4]/80"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Category
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="bg-gradient-to-br from-gray-800/95 to-gray-900/95 border border-white/20 text-white max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-hide">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Edit Industry Category</DialogTitle>
              <DialogDescription className="text-white/60">
                Update category information
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-white/70 mb-2 block">
                  Category Name *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Technology, Manufacturing, Healthcare"
                  className="bg-gradient-to-br from-gray-800/50 to-gray-900/30 border border-white/10 text-white"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-white/70 mb-2 block">
                  Description
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this category"
                  rows={3}
                  className="bg-gradient-to-br from-gray-800/50 to-gray-900/30 border border-white/10 text-white scrollbar-hide"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-white/70 mb-2 block">
                    NAICS Code
                  </label>
                  <Input
                    value={formData.metadata?.naicsCode || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        metadata: { ...formData.metadata, naicsCode: e.target.value },
                      })
                    }
                    placeholder="e.g., 541512"
                    className="bg-gradient-to-br from-gray-800/50 to-gray-900/30 border border-white/10 text-white"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-white/70 mb-2 block">
                    SIC Code
                  </label>
                  <Input
                    value={formData.metadata?.sicCode || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        metadata: { ...formData.metadata, sicCode: e.target.value },
                      })
                    }
                    placeholder="e.g., 7372"
                    className="bg-gradient-to-br from-gray-800/50 to-gray-900/30 border border-white/10 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-white/70 mb-2 block">
                    Sort Order
                  </label>
                  <Input
                    type="number"
                    value={formData.sortOrder || 0}
                    onChange={(e) =>
                      setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })
                    }
                    className="bg-gradient-to-br from-gray-800/50 to-gray-900/30 border border-white/10 text-white"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-white/70 mb-2 block">
                    Status
                  </label>
                  <Select
                    value={formData.isActive ? "active" : "inactive"}
                    onValueChange={(value) =>
                      setFormData({ ...formData, isActive: value === "active" })
                    }
                  >
                    <SelectTrigger className="bg-gradient-to-br from-gray-800/50 to-gray-900/30 border border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                className="border border-white/10 text-white/70 hover:bg-white/5"
              >
                Cancel
              </Button>
              <Button
                onClick={submitEdit}
                disabled={!formData.name}
                className="bg-gradient-to-r from-[#69B4B7] to-[#3E64B4] hover:from-[#69B4B7]/80 hover:to-[#3E64B4]/80"
              >
                <Edit className="w-4 h-4 mr-2" />
                Update Category
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="bg-gradient-to-br from-gray-800/95 to-gray-900/95 border border-white/20 text-white">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-red-400">
                Delete Category
              </DialogTitle>
              <DialogDescription className="text-white/60">
                Are you sure you want to delete this category?
              </DialogDescription>
            </DialogHeader>

            {categoryToDelete && (
              <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                <p className="text-white font-medium mb-1">{categoryToDelete.name}</p>
                {categoryToDelete.description && (
                  <p className="text-white/60 text-sm">{categoryToDelete.description}</p>
                )}
                <p className="text-red-400 text-sm mt-3">
                  ⚠️ This action cannot be undone. All child categories will also be deleted.
                </p>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteDialogOpen(false);
                  setCategoryToDelete(null);
                }}
                className="border border-white/10 text-white/70 hover:bg-white/5"
              >
                Cancel
              </Button>
              <Button
                onClick={submitDelete}
                className="bg-red-600/20 text-red-400 border border-red-600/30 hover:bg-red-600/30"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Category
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </AdminLayout>
  );
};

export default AdminIndustryCategories;
