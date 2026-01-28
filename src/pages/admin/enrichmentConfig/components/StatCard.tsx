import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, XCircle, Edit, Trash2 } from "lucide-react";

interface StatCardProps {
    title: string;
    value: number | string;
    className?: string;
}

interface ConfigMetadata {
    code?: string;
    region?: string;
    value?: string | number;
    min?: number;
    max?: number;
    unit?: string;
}

export interface ConfigType {
    _id: string;
    sortOrder: number;
    label: string;
    name: string;
    isActive: boolean;
    description?: string;
    metadata?: ConfigMetadata;
}

interface ConfigListCardProps {
    title: string;
    description?: string;
    icon?: React.ComponentType<{ className?: string }>;
    items: ConfigType[];
    loading?: boolean;
    onEdit?: (config: ConfigType) => void;
    onDelete?: (config: ConfigType) => void;
}

export const StatCard: React.FC<StatCardProps> = ({
    title,
    value,
    className = "",
}) => {
    return (
        <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className={`text-2xl font-bold ${className}`}>
                    {value}
                </div>
            </CardContent>
        </Card>
    );
};


export const ConfigListCard: React.FC<ConfigListCardProps> = ({
    title,
    description,
    icon: Icon,
    items,
    loading = false,
    onEdit,
    onDelete,
}) => {
    return (
        <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
            <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                    {Icon && <Icon className="w-5 h-5" />}
                    {title}
                    <Badge variant="outline" className="ml-2 border-gray-600 text-gray-300">
                        {items.length} items
                    </Badge>
                </CardTitle>
                {description && <p className="text-sm text-gray-400 mt-1">{description}</p>}
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="text-center py-8 text-gray-400">Loading...</div>
                ) : items.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                        No configurations found. Click "Add New" to create one.
                    </div>
                ) : (
                    <div className="space-y-2">
                        <AnimatePresence>
                            {items.map((config) => (
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
                                                    {config.metadata?.code && <span>• Code: {config.metadata.code}</span>}
                                                    {config.metadata?.region && <span>• Region: {config.metadata.region}</span>}
                                                    {config.metadata?.value && <span>• Value: {config.metadata.value}</span>}
                                                    {config.metadata?.min !== undefined && (
                                                        <span>
                                                            • Range: {config.metadata.min}
                                                            {config.metadata?.max ? ` - ${config.metadata.max}` : "+"}
                                                            {config.metadata?.unit || ""}
                                                        </span>
                                                    )}
                                                </div>
                                                {config.description && <p className="text-xs text-gray-500 mt-1">{config.description}</p>}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        {onEdit && (
                                            <Button
                                                onClick={() => onEdit(config)}
                                                size="sm"
                                                variant="ghost"
                                                className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                        )}
                                        {onDelete && (
                                            <Button
                                                onClick={() => onDelete(config)}
                                                size="sm"
                                                variant="ghost"
                                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
