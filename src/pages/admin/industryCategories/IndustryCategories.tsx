import { useEffect, useState, useCallback } from "react";
import { AdminLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FolderTree, Plus, Search, RefreshCw, X, CheckCircle2, XCircle } from "lucide-react";
import { industryCategoryService, IndustryCategory, CreateCategoryData, UpdateCategoryData } from "@/services/industryCategory.service";
import { toast } from "sonner";
import StatCard from "./components/StatCard";
import { ConfirmDeleteDialog, IndustryCategoryDialog } from "./components/IndustryCategoryDialog";
import { useMutation, useQuery } from "@tanstack/react-query";
import CategoryItem from "./components/RenderCategoryItem";

const AdminIndustryCategories = () => {
  const [categoryTree, setCategoryTree] = useState<IndustryCategory[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<IndustryCategory | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<IndustryCategory | null>(null);

  const [formData, setFormData] = useState<CreateCategoryData>({
    name: "", description: "", parentId: null, metadata: { dnbCode: "", naicsCode: "", sicCode: "", isicCode: "" }, keywords: [], isActive: true, sortOrder: 0
  });
  const [statistics, setStatistics] = useState({ totalCategories: 0, level1: 0, level2: 0, level3: 0, activeCategories: 0, inactiveCategories: 0, });
  const { data: categoryTreeData, isLoading, refetch } = useQuery({
    queryKey: ["category-tree"],
    queryFn: () => industryCategoryService.getCategoryTree(true)
  })
  useEffect(() => {
    if (categoryTreeData?.success && categoryTreeData?.data) {
      const treeData = Array.isArray(categoryTreeData.data) ? categoryTreeData.data : categoryTreeData.data.tree || [];
      setCategoryTree(treeData);
      calculateStatistics(treeData);
    }
  }, [categoryTreeData]);
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

  const collapseAll = () => {
    setExpandedCategories(new Set());
  };

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

  const handleDelete = (category: IndustryCategory) => {
    setCategoryToDelete(category);
    setIsDeleteDialogOpen(true);
  };

  const { mutate: submitCreate } = useMutation({
    mutationFn: (data: CreateCategoryData) => industryCategoryService.createCategory(data),
    onSuccess: () => {
      toast.success("Category created successfully");
      setIsCreateDialogOpen(false);
      refetch();
    },
    onError: (error: any) => {
      console.error("Error creating category", error)
      toast.error(error?.response?.data?.message || "Failed to create category")
    }
  })
  const { mutate: submitEdit } = useMutation({
    mutationFn: (data: UpdateCategoryData) => industryCategoryService.updateCategory(selectedCategory?._id, data),
    onSuccess: () => {
      toast.success("Category updated successfully");
      setIsEditDialogOpen(false);
      refetch();
    },
    onError: (error: any) => {
      console.error("Error updating category", error)
      toast.error(error?.response?.data?.message || "Failed to update category")
    }
  })
  const { mutate: submitDelete } = useMutation({
    mutationFn: () => industryCategoryService.deleteCategory(categoryToDelete?._id),
    onSuccess: () => {
      toast.success("Category deleted successfully");
      setIsDeleteDialogOpen(false);
      setCategoryToDelete(null);
      refetch();
    },
    onError: (error: any) => {
      console.error("Error deleting category", error)
      toast.error(error?.response?.data?.message || "Failed to delete category")
    }
  })

  const filterCategories = (
    categories: IndustryCategory[],
    search: string
  ): IndustryCategory[] => {
    if (!search) return categories;
    const searchLower = search.toLowerCase();
    return categories.filter((cat) => {
      const matchesName = cat.name.toLowerCase().includes(searchLower);
      const matchesDescription = cat.description
        ?.toLowerCase()
        .includes(searchLower);
      const matchesChildren =
        cat.children && cat.children.length > 0
          ? filterCategories(cat.children, search).length > 0
          : false;

      return matchesName || matchesDescription || matchesChildren;
    });
  };
  const filteredCategoryTree = filterCategories(categoryTree, searchTerm);
  const renderCategoryItem = () => {
    return filteredCategoryTree.map((category) =>
      <CategoryItem
        key={category._id}
        category={category}
        depth={0}
        expandedCategories={expandedCategories}
        selectedCategory={selectedCategory}
        toggleCategory={toggleCategory}
        setSelectedCategory={setSelectedCategory}
        handleEdit={handleEdit}
        handleDelete={handleDelete}
      />
    );
  };

  return (
    <AdminLayout>
      <main className="relative px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-[66px] mt-20 sm:mt-20 lg:mt-24 xl:mt-28 mb-0 flex flex-col gap-6 text-white flex-1 overflow-y-auto scrollbar-hide">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white my-2 flex items-center gap-2">
              <FolderTree className="w-6 h-6" />
              Industry Categories
            </h1>
            <p className="text-white/60">
              Manage hierarchical industry classification for companies and
              leads
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
        <div className="grid gap-4 sm:gap-6 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard title="Total" value={statistics.totalCategories} icon={FolderTree} color="text-white" />
          <StatCard title="Level 1" value={statistics.level1} color="text-[#69B4B7]" />
          <StatCard title="Level 2" value={statistics.level2} color="text-blue-400" />
          <StatCard title="Level 3" value={statistics.level3} color="text-purple-400" />
          <StatCard title="Active" value={statistics.activeCategories} icon={CheckCircle2} color="text-green-400" />
          <StatCard title="Inactive" value={statistics.inactiveCategories} icon={XCircle} color="text-red-400" />
        </div>
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
                  onClick={() => refetch()}
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
        <StatCard title="Category Hierarchy" icon={FolderTree}>
          {isLoading ? (
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
              {renderCategoryItem()}
            </div>
          )}
        </StatCard>
        <IndustryCategoryDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} mode="create" formData={formData} setFormData={setFormData} onSubmit={(data) => submitCreate(data)} />
        <IndustryCategoryDialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} mode="edit" formData={formData} setFormData={setFormData} onSubmit={submitEdit} />
        <ConfirmDeleteDialog open={isDeleteDialogOpen} onOpenChange={(open) => { setIsDeleteDialogOpen(open); if (!open) setCategoryToDelete(null) }}
          title="Delete Category" description="Are you sure you want to delete this category?" itemName={categoryToDelete?.name} itemDescription={categoryToDelete?.description}
          warning="This action cannot be undone. All child categories will also be deleted." onConfirm={submitDelete} />
      </main>
    </AdminLayout>
  );
};

export default AdminIndustryCategories;