import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import clsx from "clsx";


const StatCard = ({ title, icon: Icon, color, value, description, loading }) => {
    return (
        <Card className="bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] border-white/10 hover:border-white/20 transition-all duration-300">
            <CardHeader className="pb-2">
                <CardTitle className="text-white/70 flex items-center gap-2 text-sm">
                    <Icon className="w-4 h-4" />
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0">
                <div className={clsx("text-2xl sm:text-3xl font-bold", color)}>
                    {loading ? (
                        <div className="animate-pulse">...</div>
                    ) : (
                        value.toLocaleString()
                    )}
                </div>
                <p className="text-xs text-white/60 mt-1">{description}</p>
            </CardContent>
        </Card>
    );
};

export default StatCard;
