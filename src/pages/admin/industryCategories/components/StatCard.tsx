import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import React, { ReactNode } from 'react';

interface StatCardProps {
    title: string;
    value?: number | string;
    icon?: React.ComponentType<any>;
    color?: string;
    children?: ReactNode;
    className?: string;
}

const StatCard: React.FC<StatCardProps> = ({
    title,
    value,
    icon: Icon,
    color = 'text-white',
    children,
    className = ''
}) => {
    const gradient = 'rgba(58,62,75,0.82),rgba(28,30,40,0.94)';

    return (
        <Card className={`bg-[linear-gradient(135deg,${gradient})]  border-white/10 hover:border-white/20 transition-all duration-300 ${className}`}>
            <CardHeader className="pb-2">
                <CardTitle className="text-white/70 flex text-lg items-center gap-2 font-semibold">
                    {Icon && <Icon className="w-4 h-4" />}
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {/* Render children if provided, otherwise show value */}
                {children || <div className={`text-3xl  px-4 font-bold ${color}`}>{value}</div>}
            </CardContent>
        </Card>
    );
};

export default StatCard;


