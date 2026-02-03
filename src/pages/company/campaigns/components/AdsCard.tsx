import { useNavigate } from 'react-router-dom';
import { Card, CardContent, } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/ui/select';
import FacebookIcon from "@/components/icons/FacebookIcon";
import { formatNumber, getDaysFromSelection } from '@/utils/commonFunctions';

type AdsCardProps = {
    platform: string;
    analytics: any;
    onDaysChange: React.Dispatch<React.SetStateAction<number>>;
    onClick?: () => void;
};
const AdsCard: React.FC<AdsCardProps> = ({ platform, analytics, onDaysChange, onClick }) => {
    const navigate = useNavigate();
    const platformConfig = {
        facebook: {
            name: 'Facebook Ads',
            icon: <FacebookIcon className="w-6 h-6 sm:w-7 sm:h-7" />,
            gradient: 'from-[#1877F2]/30 via-[#1877F2]/15 to-transparent',
            navigateTo: '/campaigns/facebook',
        },
        google: {
            name: 'Google Ads',
            icon: (
                <svg className="w-6 h-6 sm:w-7 sm:h-7" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
            ),
            gradient: 'from-[#4285F4]/25 via-[#34A853]/20 to-transparent',
            navigateTo: '/campaigns/google',
        },
    };

    const config = platformConfig[platform];
    const handleSelectChange = (value) => {
        if (onDaysChange) { onDaysChange(getDaysFromSelection(value)); }
    };

    const handleCardClick = () => {
        if (onClick) {
            onClick();
        } else {
            navigate(config.navigateTo);
        }
    };

    return (
        <div className="relative flex-1 w-full">
            <div className={`absolute -inset-4 lg:-inset-8 bg-gradient-to-r ${config.gradient} blur-3xl opacity-60`} />
            <Card
                className="relative border-[#FFFFFF4D] shadow-2xl w-full cursor-pointer hover:border-[#1877F2]/50 transition-all duration-200"
                style={{
                    height: "140px",
                    borderRadius: "16px",
                    opacity: 1,
                    borderWidth: "1px",
                    background:
                        "linear-gradient(173.83deg, rgba(255, 255, 255, 0.08) 4.82%, rgba(255, 255, 255, 0.00002) 38.08%, rgba(255, 255, 255, 0.00002) 56.68%, rgba(255, 255, 255, 0.02) 95.1%)",
                }}
                onClick={handleCardClick}
            >
                <CardContent className="p-2.5 sm:p-3 h-full flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            <div className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center flex-shrink-0">
                                {config.icon}
                            </div>
                            <h3
                                className="text-white"
                                style={{
                                    fontFamily: "Poppins",
                                    fontWeight: 500,
                                    fontSize: "14px",
                                    lineHeight: "100%",
                                    letterSpacing: "0%",
                                }}
                            >
                                {config.name}
                            </h3>
                        </div>

                        <div onClick={(e) => e.stopPropagation()}>
                            <Select
                                defaultValue="last-week"
                                onValueChange={handleSelectChange}
                            >
                                <SelectTrigger className="w-[110px] h-7 bg-[#252525] border-[#3a3a3a] text-gray-300 text-[10px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                                    <SelectItem
                                        value="last-7-days"
                                        className="text-gray-300 focus:text-white focus:bg-white/10"
                                    >
                                        Last 7 Days
                                    </SelectItem>
                                    <SelectItem
                                        value="last-week"
                                        className="text-gray-300 focus:text-white focus:bg-white/10"
                                    >
                                        Last Week
                                    </SelectItem>
                                    <SelectItem
                                        value="last-month"
                                        className="text-gray-300 focus:text-white focus:bg-white/10"
                                    >
                                        Last Month
                                    </SelectItem>
                                    <SelectItem
                                        value="last-3-months"
                                        className="text-gray-300 focus:text-white focus:bg-white/10"
                                    >
                                        Last 3 Months
                                    </SelectItem>
                                    <SelectItem
                                        value="last-year"
                                        className="text-gray-300 focus:text-white focus:bg-white/10"
                                    >
                                        Last Year
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                        {/* Impressions Column */}
                        <div>
                            <div className="text-base sm:text-lg font-bold text-white mb-0.5">
                                {analytics?.data?.[0]
                                    ? formatNumber(analytics.data[0].totalImpressions)
                                    : "0"}
                            </div>
                            <div className="text-[10px] text-gray-500 mb-0.5">
                                Impressions
                            </div>
                            <div className="text-[10px] font-medium text-gray-500">
                                {analytics?.data?.[0]
                                    ? `${formatNumber(analytics.data[0].totalReach)} reach`
                                    : "No data"}
                            </div>
                        </div>

                        {/* Clicks Column */}
                        <div>
                            <div className="text-base sm:text-lg font-bold text-white mb-0.5">
                                {analytics?.data?.[0]
                                    ? formatNumber(analytics.data[0].totalClicks)
                                    : "0"}
                            </div>
                            <div className="text-[10px] text-gray-500 mb-0.5">
                                Clicks
                            </div>
                            <div className="text-[10px] font-medium text-gray-500">
                                {analytics?.data?.[0]
                                    ? `${analytics.data[0].avgCtr?.toFixed(2) || '0.00'}% CTR`
                                    : "No data"}
                            </div>
                        </div>

                        {/* Spend Column */}
                        <div>
                            <div className="text-base sm:text-lg font-bold text-white mb-0.5">
                                $
                                {analytics?.data?.[0]
                                    ? formatNumber(analytics.data[0].totalSpend)
                                    : "0"}
                            </div>
                            <div className="text-[10px] text-gray-500 mb-0.5">
                                Spend
                            </div>
                            <div className="text-[10px] font-medium text-gray-500">
                                {analytics?.data?.[0]
                                    ? `$${analytics.data[0].avgCpc?.toFixed(2) || '0.00'} CPC`
                                    : "No data"}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default AdsCard;