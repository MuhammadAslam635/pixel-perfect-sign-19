import { useEffect, useState, useCallback } from "react";
import { AdminLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings2, Plus, Search, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { enrichmentConfigService, EnrichmentConfig, CreateConfigData, ConfigType, UpdateConfigData } from "@/services/enrichmentConfig.service";
import { ConfigListCard, StatCard } from "./components/StatCard";
import { CONFIG_TYPES, ConfigFormDialog } from "./components/dialog/ConfirmDialog";
import { DeleteConfirmDialog } from "./components/dialog/DeleteConfirmDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQuery } from "@tanstack/react-query";
import TypeSpecificFields from "./components/TypeSpecificFields";

const AdminEnrichmentConfigs = () => {
  const [configs, setConfigs] = useState<EnrichmentConfig[]>([]);
  const [filteredConfigs, setFilteredConfigs] = useState<EnrichmentConfig[]>([]);
  const [selectedType, setSelectedType] = useState<ConfigType>("region");
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<EnrichmentConfig | null>(null);
  const [formData, setFormData] = useState<CreateConfigData>({ type: "region", name: "", label: "", description: "", isActive: true, sortOrder: 0, metadata: {} });
  const [statistics, setStatistics] = useState({ total: 0, byType: { region: 0, country: 0, seniority: 0, revenue_range: 0, employee_range: 0, }, active: 0, inactive: 0, });

  const { data: configsData, isLoading, refetch } = useQuery({
    queryKey: ["enrichment-configs"],
    queryFn: () => enrichmentConfigService.getConfigs({ includeInactive: true }),
  });

  useEffect(() => {
    if (configsData?.success && configsData?.data) {
      setConfigs(configsData.data);
      calculateStatistics(configsData.data);
    }
  }, [configsData]);

  useEffect(() => {
    let filtered = configs.filter((c) => c.type === selectedType);
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((c) => c.name.toLowerCase().includes(term) || c.label.toLowerCase().includes(term) || c.description?.toLowerCase().includes(term))
    }
    filtered.sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) {
        return a.sortOrder - b.sortOrder;
      }
      return a.name.localeCompare(b.name);
    });
    setFilteredConfigs(filtered);
  }, [configs, selectedType, searchTerm]);

  const calculateStatistics = (configList: EnrichmentConfig[]) => {
    const stats = {
      total: configList.length,
      byType: { region: 0, country: 0, seniority: 0, revenue_range: 0, employee_range: 0, },
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

  const handleCreate = () => {
    setFormData({ type: selectedType, name: "", label: "", description: "", isActive: true, sortOrder: filteredConfigs.length, metadata: {} });
    setIsCreateDialogOpen(true);
  };

  const handleEdit = (config: EnrichmentConfig) => {
    setSelectedConfig(config);
    setFormData({ type: config.type, name: config.name, label: config.label, description: config.description || "", isActive: config.isActive, sortOrder: config.sortOrder, metadata: config.metadata || {}, });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (config: EnrichmentConfig) => {
    setSelectedConfig(config);
    setIsDeleteDialogOpen(true);
  };
  const { mutate: submitCreateMutation } = useMutation({
    mutationFn: (data: CreateConfigData) => enrichmentConfigService.createConfig(data),
    onSuccess: () => {
      toast.success("Configuration created successfully");
      setIsCreateDialogOpen(false);
      refetch();
    },
    onError: (error: any) => {
      console.error("Error creating config:", error);
      toast.error(error?.response?.data?.message || "Failed to create configuration");
    },
  });
  const { mutate: submitEditMutation } = useMutation({
    mutationFn: (data: UpdateConfigData) => enrichmentConfigService.updateConfig(selectedConfig?._id, data),
    onSuccess: () => {
      toast.success("Configuration updated successfully");
      setIsEditDialogOpen(false);
      refetch();
    },
    onError: (error: any) => {
      console.error("Error updating config:", error);
      toast.error(error?.response?.data?.message || "Failed to update configuration");
    },
  });

  const { mutate: submitDeleteMutation } = useMutation({
    mutationFn: (id: string) => enrichmentConfigService.deleteConfig(id),
    onSuccess: () => {
      toast.success("Configuration deleted successfully");
      setIsDeleteDialogOpen(false);
      refetch();
    },
    onError: (error: any) => {
      console.error("Error deleting config:", error);
      toast.error(error?.response?.data?.message || "Failed to delete configuration");
    },
  });

  const currentTypeInfo = CONFIG_TYPES.find((t) => t.value === selectedType);

  return (
    <AdminLayout>
      <main className="relative px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-[66px] mt-20 sm:mt-20 lg:mt-24 xl:mt-28 mb-0 flex flex-col gap-6 text-white flex-1 overflow-y-auto scrollbar-hide">
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
          <Button onClick={() => refetch()} variant="outline" size="icon" className="border-gray-700 hover:bg-gray-800">
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <StatCard title="Total Configs" value={statistics.total} />
          <StatCard title="Regions" value={statistics.byType.region} />
          <StatCard title="Countries" value={statistics.byType.country} />
          <StatCard title="Active" value={statistics.active} className="text-green-500" />
          <StatCard title="Inactive" value={statistics.inactive} className="text-red-500" />
        </div>
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
        <ConfigListCard
          title={currentTypeInfo?.label || "Configs"}
          description={currentTypeInfo?.description}
          icon={currentTypeInfo?.icon}
          items={filteredConfigs}
          loading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
        <ConfigFormDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          title="Create New Configuration"
          description={`Add a new ${currentTypeInfo?.label.toLowerCase()} configuration`}
          submitLabel="Create"
          onSubmit={(data) => submitCreateMutation(data)}
          formData={formData}
          setFormData={setFormData}
          renderTypeSpecificFields={() => (<TypeSpecificFields formData={formData} setFormData={setFormData} />)}
          showTypeSelect
        />
        <ConfigFormDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          title="Edit Configuration"
          description={`Update the ${currentTypeInfo?.label.toLowerCase()} configuration`}
          submitLabel="Update"
          onSubmit={(data) => submitEditMutation(data)}
          formData={formData}
          setFormData={setFormData}
          renderTypeSpecificFields={() => (<TypeSpecificFields formData={formData} setFormData={setFormData} />)}
          showTypeSelect
        />
        <DeleteConfirmDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          title="Delete Configuration"
          description="Are you sure you want to delete this configuration? This action cannot be undone."
          item={selectedConfig}
          onConfirm={() => submitDeleteMutation(selectedConfig._id)}
        />
      </main>
    </AdminLayout>
  );
};

export default AdminEnrichmentConfigs;