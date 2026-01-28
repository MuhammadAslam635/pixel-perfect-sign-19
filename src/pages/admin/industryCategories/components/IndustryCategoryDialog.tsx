import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CreateCategoryData } from "@/services/industryCategory.service";
import { Pencil, Plus, Trash2 } from "lucide-react";

type IndustryCategoryDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode: "create" | "edit";
    formData: any;
    setFormData: (data: any) => void;
    onSubmit: (data: CreateCategoryData) => void;
};

type ConfirmDeleteDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title?: string;
    description?: string;
    itemName?: string;
    itemDescription?: string;
    warning?: string;
    onConfirm: () => void;
};

export function IndustryCategoryDialog({
    open,
    onOpenChange,
    mode,
    formData,
    setFormData,
    onSubmit,
}: IndustryCategoryDialogProps) {
    const isCreate = mode === "create";

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-gradient-to-br from-gray-800/95 to-gray-900/95 border border-white/20 text-white max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-hide">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">
                        {isCreate ? "Create Industry Category" : "Edit Industry Category"}
                    </DialogTitle>
                    <DialogDescription className="text-white/60">
                        {isCreate
                            ? "Add a new industry category to the hierarchy"
                            : "Update category information"}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-white/70 mb-2 block">
                            Category Name *
                        </label>
                        <Input
                            value={formData.name}
                            onChange={(e) =>
                                setFormData({ ...formData, name: e.target.value })
                            }
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
                            onChange={(e) =>
                                setFormData({ ...formData, description: e.target.value })
                            }
                            placeholder="Brief description of this category"
                            rows={3}
                            className="bg-gradient-to-br from-gray-800/50 to-gray-900/30 border border-white/10 text-white scrollbar-hide"
                        />
                    </div>

                    {/* NAICS + SIC */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-white/70 mb-2 block">
                                NAICS Code
                            </label>
                            <Input
                                value={String(formData.metadata?.naicsCode ?? "")}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        metadata: {
                                            ...formData.metadata,
                                            naicsCode: e.target.value
                                        },
                                    })
                                }
                                placeholder="e.g., 541512"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-white/70 mb-2 block">
                                SIC Code
                            </label>
                            <Input
                                value={String(formData.metadata?.sicCode ?? "")}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        metadata: { ...formData.metadata, sicCode: e.target.value },
                                    })
                                }
                                placeholder="e.g., 7372"
                            />
                        </div>

                    </div>

                    {/* Sort + Status */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-white/70 mb-2 block">
                                Sort Order
                            </label>
                            <Input
                                type="number"
                                value={formData.sortOrder || 0}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        sortOrder: parseInt(e.target.value) || 0,
                                    })
                                }
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium text-white/70 mb-2 block">
                                Status
                            </label>

                            <Select
                                value={formData.isActive ? "active" : "inactive"}
                                onValueChange={(v) =>
                                    setFormData({ ...formData, isActive: v === "active" })
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
                        onClick={() => onOpenChange(false)}
                        className="border border-white/10 text-white/70 hover:bg-white/5"
                    >
                        Cancel
                    </Button>

                    <Button
                        onClick={() => onSubmit(formData)}
                        disabled={!formData.name}
                        className="bg-gradient-to-r from-[#69B4B7] to-[#3E64B4] hover:from-[#69B4B7]/80 hover:to-[#3E64B4]/80"
                    >
                        {isCreate ? <Plus className="w-4 h-4 mr-2" /> : <Pencil className="w-4 h-4 mr-2" />}
                        {isCreate ? "Create Category" : "Update Category"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


export function ConfirmDeleteDialog({
    open,
    onOpenChange,
    title = "Delete Item",
    description = "Are you sure you want to delete this item?",
    itemName,
    itemDescription,
    warning = "This action cannot be undone.",
    onConfirm,
}: ConfirmDeleteDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-gradient-to-br from-gray-800/95 to-gray-900/95 border border-white/20 text-white">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-red-400">
                        {title}
                    </DialogTitle>
                    <DialogDescription className="text-white/60">
                        {description}
                    </DialogDescription>
                </DialogHeader>

                {(itemName || itemDescription) && (
                    <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                        {itemName && (
                            <p className="text-white font-medium mb-1">{itemName}</p>
                        )}
                        {itemDescription && (
                            <p className="text-white/60 text-sm">{itemDescription}</p>
                        )}
                        {warning && (
                            <p className="text-red-400 text-sm mt-3">{warning}</p>
                        )}
                    </div>
                )}

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="border border-white/10 text-white/70 hover:bg-white/5"
                    >
                        Cancel
                    </Button>

                    <Button
                        onClick={onConfirm}
                        className="bg-red-600/20 text-red-400 border border-red-600/30 hover:bg-red-600/30"
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
