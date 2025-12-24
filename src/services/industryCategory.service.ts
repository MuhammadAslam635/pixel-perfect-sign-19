import API from "@/utils/api";

export interface IndustryCategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string | null;
  level: number;
  path: string;
  metadata?: {
    dnbCode?: string;
    naicsCode?: string;
    sicCode?: string;
    isicCode?: string;
  };
  isActive: boolean;
  sortOrder: number;
  keywords?: string[];
  relatedCategories?: string[];
  stats?: {
    totalCompanies: number;
    totalLeads: number;
    lastUpdated?: string;
  };
  children?: IndustryCategory[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CategoryTreeResponse {
  success: boolean;
  message?: string;
  data: {
    tree: IndustryCategory[];
    totalCategories: number;
  } | IndustryCategory[];
}

export interface CategoriesResponse {
  success: boolean;
  message: string;
  data: {
    page: number;
    limit: number;
    totalPages: number;
    totalRecords: number;
    categories: IndustryCategory[];
  };
}

export interface CategoryResponse {
  success: boolean;
  message: string;
  data: IndustryCategory;
}

export interface CreateCategoryData {
  name: string;
  slug?: string;
  description?: string;
  parentId?: string | null;
  metadata?: {
    dnbCode?: string;
    naicsCode?: string;
    sicCode?: string;
    isicCode?: string;
  };
  keywords?: string[];
  relatedCategories?: string[];
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateCategoryData extends Partial<CreateCategoryData> {}

export interface SearchCategoriesParams {
  search: string;
  level?: number;
  parentId?: string;
  limit?: number;
}

export const industryCategoryService = {
  /**
   * Get category tree (hierarchical structure)
   */
  getCategoryTree: async (includeInactive = false): Promise<CategoryTreeResponse> => {
    try {
      const params = new URLSearchParams();
      if (includeInactive) params.append("includeInactive", "true");

      const response = await API.get(`/admin/industry-categories/tree?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Get categories (flat list with pagination)
   */
  getCategories: async (
    params: {
      page?: number;
      limit?: number;
      search?: string;
      level?: number;
      parentId?: string | null;
      isActive?: boolean;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
    } = {}
  ): Promise<CategoriesResponse> => {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append("page", params.page.toString());
      if (params.limit) queryParams.append("limit", params.limit.toString());
      if (params.search) queryParams.append("search", params.search);
      if (params.level !== undefined) queryParams.append("level", params.level.toString());
      if (params.parentId !== undefined) queryParams.append("parentId", params.parentId || "null");
      if (params.isActive !== undefined) queryParams.append("isActive", params.isActive.toString());
      if (params.sortBy) queryParams.append("sortBy", params.sortBy);
      if (params.sortOrder) queryParams.append("sortOrder", params.sortOrder);

      const response = await API.get(`/admin/industry-categories?${queryParams.toString()}`);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Get category by ID
   */
  getCategoryById: async (id: string): Promise<CategoryResponse> => {
    try {
      const response = await API.get(`/admin/industry-categories/${id}`);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Create new category
   */
  createCategory: async (data: CreateCategoryData): Promise<CategoryResponse> => {
    try {
      const response = await API.post("/admin/industry-categories", data);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Update category
   */
  updateCategory: async (id: string, data: UpdateCategoryData): Promise<CategoryResponse> => {
    try {
      const response = await API.put(`/admin/industry-categories/${id}`, data);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Delete category
   */
  deleteCategory: async (id: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await API.delete(`/admin/industry-categories/${id}`);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Search categories
   */
  searchCategories: async (params: SearchCategoriesParams): Promise<{ success: boolean; data: IndustryCategory[] }> => {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append("search", params.search);
      if (params.level !== undefined) queryParams.append("level", params.level.toString());
      if (params.parentId) queryParams.append("parentId", params.parentId);
      if (params.limit) queryParams.append("limit", params.limit.toString());

      const response = await API.get(`/admin/industry-categories/search?${queryParams.toString()}`);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Update category statistics
   */
  updateCategoryStats: async (id: string): Promise<CategoryResponse> => {
    try {
      const response = await API.post(`/admin/industry-categories/${id}/update-stats`);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Bulk import categories
   */
  bulkImportCategories: async (categories: CreateCategoryData[]): Promise<{ success: boolean; message: string; data: { created: number; failed: number } }> => {
    try {
      const response = await API.post("/admin/industry-categories/bulk-import", { categories });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },
};

export default industryCategoryService;
