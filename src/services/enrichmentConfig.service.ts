import API from "@/utils/api";

export type ConfigType = "region" | "country" | "seniority" | "revenue_range" | "employee_range";

export interface EnrichmentConfig {
  _id: string;
  type: ConfigType;
  name: string;
  label: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
  metadata?: {
    code?: string;
    region?: string;
    value?: string;
    min?: number;
    max?: number;
    unit?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface ConfigsResponse {
  success: boolean;
  message?: string;
  data: EnrichmentConfig[];
}

export interface ConfigResponse {
  success: boolean;
  message?: string;
  data: EnrichmentConfig;
}

export interface CreateConfigData {
  type: ConfigType;
  name: string;
  label: string;
  description?: string;
  isActive?: boolean;
  sortOrder?: number;
  metadata?: {
    code?: string;
    region?: string;
    value?: string;
    min?: number;
    max?: number;
    unit?: string;
  };
}

export interface UpdateConfigData extends Partial<Omit<CreateConfigData, "type">> {}

export interface BulkCreateResponse {
  success: boolean;
  message: string;
  data: {
    created: number;
    failed: number;
    errors: Array<{ name: string; error: string }>;
  };
}

export const enrichmentConfigService = {
  /**
   * Get all configs (optionally filtered by type)
   */
  getConfigs: async (params: {
    type?: ConfigType;
    includeInactive?: boolean;
  } = {}): Promise<ConfigsResponse> => {
    try {
      const queryParams = new URLSearchParams();
      if (params.type) queryParams.append("type", params.type);
      if (params.includeInactive) queryParams.append("includeInactive", "true");

      const response = await API.get(`/admin/enrichment-configs?${queryParams.toString()}`);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Get config by ID
   */
  getConfigById: async (id: string): Promise<ConfigResponse> => {
    try {
      const response = await API.get(`/admin/enrichment-configs/${id}`);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Get configs by type (convenience method)
   * Uses public endpoint for better accessibility
   */
  getConfigsByType: async (type: ConfigType, includeInactive = false): Promise<ConfigsResponse> => {
    try {
      // Use public endpoint for active configs (no admin required)
      if (!includeInactive) {
        const response = await API.get(`/leads/enrichment/configs?type=${type}`);
        return response.data;
      }
      // Use admin endpoint if inactive configs are requested
      return enrichmentConfigService.getConfigs({ type, includeInactive });
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Get all regions
   */
  getRegions: async (includeInactive = false): Promise<ConfigsResponse> => {
    return enrichmentConfigService.getConfigsByType("region", includeInactive);
  },

  /**
   * Get all countries
   */
  getCountries: async (includeInactive = false): Promise<ConfigsResponse> => {
    return enrichmentConfigService.getConfigsByType("country", includeInactive);
  },

  /**
   * Get all seniority levels
   */
  getSeniorityLevels: async (includeInactive = false): Promise<ConfigsResponse> => {
    return enrichmentConfigService.getConfigsByType("seniority", includeInactive);
  },

  /**
   * Get all revenue ranges
   */
  getRevenueRanges: async (includeInactive = false): Promise<ConfigsResponse> => {
    return enrichmentConfigService.getConfigsByType("revenue_range", includeInactive);
  },

  /**
   * Get all employee ranges
   */
  getEmployeeRanges: async (includeInactive = false): Promise<ConfigsResponse> => {
    return enrichmentConfigService.getConfigsByType("employee_range", includeInactive);
  },

  /**
   * Create new config
   */
  createConfig: async (data: CreateConfigData): Promise<ConfigResponse> => {
    try {
      const response = await API.post("/admin/enrichment-configs", data);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Update config
   */
  updateConfig: async (id: string, data: UpdateConfigData): Promise<ConfigResponse> => {
    try {
      const response = await API.put(`/admin/enrichment-configs/${id}`, data);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Delete config
   */
  deleteConfig: async (id: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await API.delete(`/admin/enrichment-configs/${id}`);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Bulk create configs
   */
  bulkCreateConfigs: async (configs: CreateConfigData[]): Promise<BulkCreateResponse> => {
    try {
      const response = await API.post("/admin/enrichment-configs/bulk", { configs });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },
};

export default enrichmentConfigService;
