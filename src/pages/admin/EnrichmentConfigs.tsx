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
  Settings2,
  Plus,
  Edit,
  Trash2,
  Search,
  RefreshCw,
  Globe,
  MapPin,
  Briefcase,
  DollarSign,
  Users,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  enrichmentConfigService,
  EnrichmentConfig,
  CreateConfigData,
  ConfigType,
} from "@/services/enrichmentConfig.service";

const CONFIG_TYPES: { value: ConfigType; label: string; icon: any; description: string }[] = [
  { value: "region", label: "Regions", icon: Globe, description: "Geographic regions for targeting" },
  { value: "country", label: "Countries", icon: MapPin, description: "Countries with ISO codes and regions" },
  { value: "seniority", label: "Seniority Levels", icon: Briefcase, description: "Job seniority levels and titles" },
  { value: "revenue_range", label: "Revenue Ranges", icon: DollarSign, description: "Company revenue ranges" },
  { value: "employee_range", label: "Employee Ranges", icon: Users, description: "Company employee count ranges" },
];

const AdminEnrichmentConfigs = () => {
  const [configs, setConfigs] = useState<EnrichmentConfig[]>([]);
  const [filteredConfigs, setFilteredConfigs] = useState<EnrichmentConfig[]>([]);
  const [selectedType, setSelectedType] = useState<ConfigType>("region");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<EnrichmentConfig | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateConfigData>({
    type: "region",
    name: "",
    label: "",
    description: "",
    isActive: true,
    sortOrder: 0,
    metadata: {},
  });

  // Statistics
  const [statistics, setStatistics] = useState({
    total: 0,
    byType: {
      region: 0,
      country: 0,
      seniority: 0,
      revenue_range: 0,
      employee_range: 0,
    },
    active: 0,
    inactive: 0,
  });

  // Fetch configs
  const fetchConfigs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await enrichmentConfigService.getConfigs({ includeInactive: true });
      if (response.success && response.data) {
        setConfigs(response.data);
        calculateStatistics(response.data);
      }
    } catch (error: any) {
      console.error("Error fetching configs:", error);
      toast.error(error?.response?.data?.message || "Failed to fetch configurations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  // Filter configs by type and search term
  useEffect(() => {
    let filtered = configs.filter((c) => c.type === selectedType);

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(term) ||
          c.label.toLowerCase().includes(term) ||
          c.description?.toLowerCase().includes(term)
      );
    }

    // Sort by sortOrder then by name
    filtered.sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) {
        return a.sortOrder - b.sortOrder;
      }
      return a.name.localeCompare(b.name);
    });

    setFilteredConfigs(filtered);
  }, [configs, selectedType, searchTerm]);

  // Calculate statistics
  const calculateStatistics = (configList: EnrichmentConfig[]) => {
    const stats = {
      total: configList.length,
      byType: {
        region: 0,
        country: 0,
        seniority: 0,
        revenue_range: 0,
        employee_range: 0,
      },
      active: 0,
      inactive: 0,
    };

    configList.forEach((config) => {
      stats.byType[config.type]++;
      if (config.isActive) {
        stats.active++;
      } else {
        stats.inactive++;
      }
    });

    setStatistics(stats);
  };

  // Handle create
  const handleCreate = () => {
    setFormData({
      type: selectedType,
      name: "",
      label: "",
      description: "",
      isActive: true,
      sortOrder: filteredConfigs.length,
      metadata: {},
    });
    setIsCreateDialogOpen(true);
  };

  // Handle edit
  const handleEdit = (config: EnrichmentConfig) => {
    setSelectedConfig(config);
    setFormData({
      type: config.type,
      name: config.name,
      label: config.label,
      description: config.description || "",
      isActive: config.isActive,
      sortOrder: config.sortOrder,
      metadata: config.metadata || {},
    });
    setIsEditDialogOpen(true);
  };

  // Handle delete
  const handleDelete = (config: EnrichmentConfig) => {
    setSelectedConfig(config);
    setIsDeleteDialogOpen(true);
  };

  // Submit create
  const submitCreate = async () => {
    try {
      const response = await enrichmentConfigService.createConfig(formData);
      if (response.success) {
        toast.success("Configuration created successfully");
        setIsCreateDialogOpen(false);
        fetchConfigs();
      }
    } catch (error: any) {
      console.error("Error creating config:", error);
      toast.error(error?.response?.data?.message || "Failed to create configuration");
    }
  };

  // Submit edit
  const submitEdit = async () => {
    if (!selectedConfig) return;

    try {
      const response = await enrichmentConfigService.updateConfig(selectedConfig._id, formData);
      if (response.success) {
        toast.success("Configuration updated successfully");
        setIsEditDialogOpen(false);
        fetchConfigs();
      }
    } catch (error: any) {
      console.error("Error updating config:", error);
      toast.error(error?.response?.data?.message || "Failed to update configuration");
    }
  };

  // Submit delete
  const submitDelete = async () => {
    if (!selectedConfig) return;

    try {
      const response = await enrichmentConfigService.deleteConfig(selectedConfig._id);
      if (response.success) {
        toast.success("Configuration deleted successfully");
        setIsDeleteDialogOpen(false);
        fetchConfigs();
      }
    } catch (error: any) {
      console.error("Error deleting config:", error);
      toast.error(error?.response?.data?.message || "Failed to delete configuration");
    }
  };

  // Render type-specific form fields
  const renderTypeSpecificFields = () => {
    switch (formData.type) {
      case "country":
        return (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">Country Code (ISO)</label>
              <Input
                value={formData.metadata?.code || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    metadata: { ...formData.metadata, code: e.target.value.toUpperCase() },
                  })
                }
                placeholder="US, GB, DE, etc."
                className="bg-gray-800/50 border-gray-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">Region</label>
              <Input
                value={formData.metadata?.region || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    metadata: { ...formData.metadata, region: e.target.value },
                  })
                }
                placeholder="North America, Europe, etc."
                className="bg-gray-800/50 border-gray-700 text-white"
              />
            </div>
          </>
        );

      case "seniority":
        return (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-200">Value (Identifier)</label>
            <Input
              value={formData.metadata?.value || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  metadata: { ...formData.metadata, value: e.target.value },
                })
              }
              placeholder="c_suite, vp, director, etc."
              className="bg-gray-800/50 border-gray-700 text-white"
            />
          </div>
        );

      case "revenue_range":
      case "employee_range":
        return (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">Min</label>
              <Input
                type="number"
                value={formData.metadata?.min || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    metadata: { ...formData.metadata, min: Number(e.target.value) },
                  })
                }
                placeholder="0"
                className="bg-gray-800/50 border-gray-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">Max</label>
              <Input
                type="number"
                value={formData.metadata?.max || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    metadata: { ...formData.metadata, max: Number(e.target.value) },
                  })
                }
                placeholder="Leave empty for unlimited"
                className="bg-gray-800/50 border-gray-700 text-white"
              />
            </div>
            {formData.type === "revenue_range" && (
              <div className="col-span-2 space-y-2">
                <label className="text-sm font-medium text-gray-200">Unit</label>
                <Input
                  value={formData.metadata?.unit || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      metadata: { ...formData.metadata, unit: e.target.value },
                    })
                  }
                  placeholder="M (millions), K (thousands)"
                  className="bg-gray-800/50 border-gray-700 text-white"
                />
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const currentTypeInfo = CONFIG_TYPES.find((t) => t.value === selectedType);

  return (
    <AdminLayout>
      <main className="relative px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-[66px] mt-20 sm:mt-20 lg:mt-24 xl:mt-28 mb-0 flex flex-col gap-6 text-white flex-1 overflow-y-auto scrollbar-hide">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <Settings2 className="w-8 h-8 text-[#69B4B7]" />
              Enrichment Configurations
            </h1>
            <p className="text-gray-400 mt-1">
              Manage filter values for lead enrichment
            </p>
          </div>
          <Button
            onClick={fetchConfigs}
            variant="outline"
            size="icon"
            className="border-gray-700 hover:bg-gray-800"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total Configs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{statistics.total}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Regions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{statistics.byType.region}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Countries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{statistics.byType.country}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{statistics.active}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Inactive</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{statistics.inactive}</div>
            </CardContent>
          </Card>
        </div>

        {/* Type Selector and Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Select value={selectedType} onValueChange={(value) => setSelectedType(value as ConfigType)}>
              <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                {CONFIG_TYPES.map((type) => {
                  const Icon = type.icon;
                  return (
                    <SelectItem key={type.value} value={type.value} className="text-white">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        <span>{type.label}</span>
                        <span className="text-xs text-gray-400">
                          ({statistics.byType[type.value]})
                        </span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className="pl-9 bg-gray-800/50 border-gray-700 text-white"
              />
            </div>
            <Button
              onClick={handleCreate}
              className="bg-gradient-to-r from-[#69B4B7] to-[#3E64B4] hover:from-[#69B4B7]/80 hover:to-[#3E64B4]/80"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New
            </Button>
          </div>
        </div>

        {/* Config List */}
        <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              {currentTypeInfo && <currentTypeInfo.icon className="w-5 h-5" />}
              {currentTypeInfo?.label}
              <Badge variant="outline" className="ml-2 border-gray-600 text-gray-300">
                {filteredConfigs.length} items
              </Badge>
            </CardTitle>
            {currentTypeInfo && (
              <p className="text-sm text-gray-400 mt-1">{currentTypeInfo.description}</p>
            )}
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-400">Loading...</div>
            ) : filteredConfigs.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                No configurations found. Click "Add New" to create one.
              </div>
            ) : (
              <div className="space-y-2">
                <AnimatePresence>
                  {filteredConfigs.map((config) => (
                    <motion.div
                      key={config._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center justify-between p-4 rounded-lg bg-gray-800/50 border border-gray-700 hover:border-gray-600 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="text-sm text-gray-500">#{config.sortOrder}</div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-white">{config.label}</h3>
                              {config.isActive ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-500" />
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                              <span>Name: {config.name}</span>
                              {config.metadata?.code && (
                                <span>• Code: {config.metadata.code}</span>
                              )}
                              {config.metadata?.region && (
                                <span>• Region: {config.metadata.region}</span>
                              )}
                              {config.metadata?.value && (
                                <span>• Value: {config.metadata.value}</span>
                              )}
                              {config.metadata?.min !== undefined && (
                                <span>
                                  • Range: {config.metadata.min}
                                  {config.metadata?.max ? ` - ${config.metadata.max}` : "+"}
                                  {config.metadata?.unit || ""}
                                </span>
                              )}
                            </div>
                            {config.description && (
                              <p className="text-xs text-gray-500 mt-1">{config.description}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleEdit(config)}
                          size="sm"
                          variant="ghost"
                          className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handleDelete(config)}
                          size="sm"
                          variant="ghost"
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Configuration</DialogTitle>
              <DialogDescription className="text-gray-400">
                Add a new {currentTypeInfo?.label.toLowerCase()} configuration
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-200">Type</label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, type: value as ConfigType })
                  }
                >
                  <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {CONFIG_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value} className="text-white">
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-200">Name</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Internal name"
                    className="bg-gray-800/50 border-gray-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-200">Label</label>
                  <Input
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    placeholder="Display label"
                    className="bg-gray-800/50 border-gray-700 text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-200">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description"
                  className="bg-gray-800/50 border-gray-700 text-white"
                  rows={3}
                />
              </div>

              {renderTypeSpecificFields()}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-200">Sort Order</label>
                  <Input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) =>
                      setFormData({ ...formData, sortOrder: Number(e.target.value) })
                    }
                    className="bg-gray-800/50 border-gray-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-200">Status</label>
                  <Select
                    value={formData.isActive ? "active" : "inactive"}
                    onValueChange={(value) =>
                      setFormData({ ...formData, isActive: value === "active" })
                    }
                  >
                    <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="active" className="text-white">
                        Active
                      </SelectItem>
                      <SelectItem value="inactive" className="text-white">
                        Inactive
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                className="border-gray-700 hover:bg-gray-800"
              >
                Cancel
              </Button>
              <Button
                onClick={submitCreate}
                className="bg-gradient-to-r from-[#69B4B7] to-[#3E64B4] hover:from-[#69B4B7]/80 hover:to-[#3E64B4]/80"
              >
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Configuration</DialogTitle>
              <DialogDescription className="text-gray-400">
                Update the configuration details
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-200">Name</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Internal name"
                    className="bg-gray-800/50 border-gray-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-200">Label</label>
                  <Input
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    placeholder="Display label"
                    className="bg-gray-800/50 border-gray-700 text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-200">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description"
                  className="bg-gray-800/50 border-gray-700 text-white"
                  rows={3}
                />
              </div>

              {renderTypeSpecificFields()}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-200">Sort Order</label>
                  <Input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) =>
                      setFormData({ ...formData, sortOrder: Number(e.target.value) })
                    }
                    className="bg-gray-800/50 border-gray-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-200">Status</label>
                  <Select
                    value={formData.isActive ? "active" : "inactive"}
                    onValueChange={(value) =>
                      setFormData({ ...formData, isActive: value === "active" })
                    }
                  >
                    <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="active" className="text-white">
                        Active
                      </SelectItem>
                      <SelectItem value="inactive" className="text-white">
                        Inactive
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                className="border-gray-700 hover:bg-gray-800"
              >
                Cancel
              </Button>
              <Button
                onClick={submitEdit}
                className="bg-gradient-to-r from-[#69B4B7] to-[#3E64B4] hover:from-[#69B4B7]/80 hover:to-[#3E64B4]/80"
              >
                Update
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="bg-gray-900 border-gray-700 text-white">
            <DialogHeader>
              <DialogTitle>Delete Configuration</DialogTitle>
              <DialogDescription className="text-gray-400">
                Are you sure you want to delete this configuration? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>

            {selectedConfig && (
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                <div className="font-medium text-white">{selectedConfig.label}</div>
                <div className="text-sm text-gray-400 mt-1">{selectedConfig.name}</div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
                className="border-gray-700 hover:bg-gray-800"
              >
                Cancel
              </Button>
              <Button
                onClick={submitDelete}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </AdminLayout>
  );
};

export default AdminEnrichmentConfigs;
