import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
    title: string;
    icon: LucideIcon;
    value: number | string;
    label: string;
    valueColor?: string;
}

export const StatCard = ({ title, icon: Icon, value, label, valueColor = "text-white" }: StatCardProps) => {
    return (
        <Card className="bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] border-white/10 hover:border-white/20 transition-all duration-300">
            <CardHeader className="pb-2">
                <CardTitle className="text-white/70 flex items-center gap-2 text-sm">
                    <Icon className="w-4 h-4" />
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0">
                <div className={`text-2xl sm:text-3xl font-bold ${valueColor}`}>
                    {value}
                </div>
                <p className="text-xs text-white/60 mt-1">{label}</p>
            </CardContent>
        </Card>
    );
};
