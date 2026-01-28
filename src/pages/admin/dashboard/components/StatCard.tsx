import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    trend?: string;
}


export const StatCard = ({ title, value, icon: Icon, trend }: StatCardProps) => (
    <Card className="bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] border-white/10 hover:border-white/20 transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/70">{title}</CardTitle>
            <Icon className="h-4 w-4 text-cyan-400" />
        </CardHeader>
        <CardContent className="p-6 pt-0">
            <div className="text-2xl font-bold text-white">{value}</div>
            {trend && <p className="text-xs text-white/60">{trend}</p>}
        </CardContent>
    </Card>
);
