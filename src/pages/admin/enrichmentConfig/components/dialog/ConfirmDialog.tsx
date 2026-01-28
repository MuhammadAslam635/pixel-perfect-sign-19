import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Globe, MapPin, Briefcase, DollarSign, Users } from "lucide-react"
import { ConfigType, CreateConfigData } from "@/services/enrichmentConfig.service"

export const CONFIG_TYPES: { value: ConfigType; label: string; icon: any; description: string }[] = [
    { value: "region", label: "Regions", icon: Globe, description: "Geographic regions for targeting" },
    { value: "country", label: "Countries", icon: MapPin, description: "Countries with ISO codes and regions" },
    { value: "seniority", label: "Seniority Levels", icon: Briefcase, description: "Job seniority levels and titles" },
    { value: "revenue_range", label: "Revenue Ranges", icon: DollarSign, description: "Company revenue ranges" },
    { value: "employee_range", label: "Employee Ranges", icon: Users, description: "Company employee count ranges" },
];

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
    title: string
    description: string
    submitLabel: string
    onSubmit: (data: CreateConfigData) => void
    formData: any
    setFormData: (data: any) => void
    renderTypeSpecificFields: () => React.ReactNode
    showTypeSelect?: boolean
}

export function ConfigFormDialog({
    open,
    onOpenChange,
    title,
    description,
    submitLabel,
    onSubmit,
    formData,
    setFormData,
    renderTypeSpecificFields,
    showTypeSelect = false,
}: Props) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription className="text-gray-400">
                        {description}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {showTypeSelect && (
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
                                        <SelectItem
                                            key={type.value}
                                            value={type.value}
                                            className="text-white"
                                        >
                                            {type.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-200">Name</label>
                            <Input
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({ ...formData, name: e.target.value })
                                }
                                className="bg-gray-800/50 border-gray-700 text-white"
                                placeholder="Internal name"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-200">Label</label>
                            <Input
                                value={formData.label}
                                onChange={(e) =>
                                    setFormData({ ...formData, label: e.target.value })
                                }
                                className="bg-gray-800/50 border-gray-700 text-white"
                                placeholder="Label"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-200">Description</label>
                        <Textarea
                            rows={3}
                            value={formData.description}
                            onChange={(e) =>
                                setFormData({ ...formData, description: e.target.value })
                            }
                            className="bg-gray-800/50 border-gray-700 text-white"
                            placeholder="Description"
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
                                    setFormData({
                                        ...formData,
                                        sortOrder: Number(e.target.value),
                                    })
                                }
                                className="bg-gray-800/50 border-gray-700 text-white"
                                placeholder="Sort Order"
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
                        onClick={() => onOpenChange(false)}
                        className="border-gray-700 hover:bg-gray-800"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={() => onSubmit(formData)}
                        className="bg-gradient-to-r from-[#69B4B7] to-[#3E64B4]"
                    >
                        {submitLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
