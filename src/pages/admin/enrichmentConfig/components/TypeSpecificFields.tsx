import React from "react";
import { Input } from "@/components/ui/input";

interface TypeSpecificFieldsProps {
    formData: any;
    setFormData: React.Dispatch<React.SetStateAction<any>>;
}

const TypeSpecificFields: React.FC<TypeSpecificFieldsProps> = ({ formData, setFormData }) => {
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

export default TypeSpecificFields;
