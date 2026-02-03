import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { useCampaignSuggestions, useRegenerateCampaignSuggestions } from '@/hooks/useCampaigns';
import { CreateCampaignData } from '@/services/campaigns.service';
import { ArrowRightIcon, CircleIcon, Clock, FileText, MapPin, RefreshCw } from 'lucide-react';
import React, { useState } from 'react'

const AICampaignSuggestion = () => {
    const [aiSuggestionsEnabled, setAiSuggestionsEnabled] = useState<boolean>(true);
    const [initialCampaignData, setInitialCampaignData] = useState<Partial<CreateCampaignData> | undefined>(undefined);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
    const { data: suggestionsData, isLoading: suggestionsLoading } = useCampaignSuggestions({ limit: 10, status: "suggested" });
    const { mutate: regenerateSuggestions, isPending: isRegeneratingSuggestions, } = useRegenerateCampaignSuggestions();


    const handleRegenerateSuggestions = () => {
        regenerateSuggestions(undefined, {
            onSuccess: () => {
                toast({ title: "Success", description: "Campaign suggestions are being regenerated. You'll receive a notification when ready.", });
            },
            onError: (error: any) => {
                toast({ title: "Error", description: error?.response?.data?.message || "Failed to regenerate suggestions", variant: "destructive", });
            },
        });
    };

    const handleUseSuggestion = (suggestion: any) => {
        const campaignData: Partial<CreateCampaignData> = {
            name: suggestion.suggestedTitle,
            userRequirements: suggestion.suggestedDescription,
            campaignType: suggestion.suggestedCampaignType,
            platform: suggestion.suggestedPlatform,
            targetAudience: suggestion.suggestedTargetAudience,
            location: suggestion.suggestedLocation,
            estimatedBudget: suggestion.suggestedBudget || 0,
            numberOfDays: suggestion.suggestedDuration || 7,
            status: "draft",
        };
        // Set the initial data and open the modal
        setInitialCampaignData(campaignData);
        setIsCreateModalOpen(true);
    };

    return (
        <>
            {suggestionsData && suggestionsData.data.docs.length > 0 && (
                <div className="flex flex-col">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3">
                            <Button
                                size="sm"
                                onClick={() => setAiSuggestionsEnabled(!aiSuggestionsEnabled)}
                                variant="outline"
                                className="relative h-9 px-4 rounded-full border-0 text-white text-xs hover:bg-[#2F2F2F]/60 transition-all w-full sm:w-auto overflow-hidden"
                                style={{
                                    background: "#FFFFFF1A",
                                    boxShadow:
                                        "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
                                }}
                            >
                                <CircleIcon
                                    className={`w-4 h-4 mr-2 ${aiSuggestionsEnabled ? "fill-green-400" : "fill-gray-500"
                                        } ${aiSuggestionsEnabled ? "text-green-400" : "text-gray-500"}`}
                                />
                                <span>{aiSuggestionsEnabled ? "On" : "Off"}</span>
                            </Button>
                            {aiSuggestionsEnabled && (
                                <h2 className="text-xl sm:text-2xl font-normal text-white flex items-center gap-2">
                                    AI Campaign Suggestions
                                </h2>
                            )}
                        </div>
                        {aiSuggestionsEnabled && (
                            <Button
                                size="sm"
                                onClick={handleRegenerateSuggestions}
                                disabled={isRegeneratingSuggestions}
                                className="relative h-9 px-4 rounded-full border-0 text-white text-xs hover:bg-[#2F2F2F]/60 transition-all w-full sm:w-auto overflow-hidden"
                                style={{
                                    background: "#FFFFFF1A",
                                    boxShadow:
                                        "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
                                }}
                            >
                                <RefreshCw
                                    className={`w-4 h-4 mr-2 ${isRegeneratingSuggestions ? "animate-spin" : ""
                                        }`}
                                />
                                <span>
                                    {isRegeneratingSuggestions ? "Regenerating..." : "Regenerate"}
                                </span>
                            </Button>
                        )}
                    </div>

                    {/* Suggestions Carousel */}
                    {aiSuggestionsEnabled && (
                        <div className="relative -mx-4 sm:mx-0">
                            <div className="overflow-x-auto pb-4 px-4 sm:px-0 scrollbar-hide">
                                <div
                                    className="flex gap-3 sm:gap-4"
                                    style={{ minWidth: "min-content" }}
                                >
                                    {suggestionsData.data.docs.map((suggestion) => (
                                        <Card
                                            key={suggestion._id}
                                            className="relative border-[#FFFFFF4D] shadow-xl w-[280px] sm:w-[320px] lg:w-[340px] flex-shrink-0"
                                            style={{
                                                borderRadius: "16px",
                                                borderWidth: "1px",
                                                background:
                                                    "linear-gradient(173.83deg, rgba(255, 255, 255, 0.08) 4.82%, rgba(255, 255, 255, 0.00002) 38.08%, rgba(255, 255, 255, 0.00002) 56.68%, rgba(255, 255, 255, 0.02) 95.1%)",
                                            }}
                                        >
                                            <CardContent className="p-5">
                                                <div className="flex flex-col gap-3">
                                                    {/* Title and Status Badge */}
                                                    <div className="flex items-start justify-between gap-2">
                                                        <h3 className="text-base font-semibold text-white line-clamp-2">
                                                            {suggestion.suggestedTitle}
                                                        </h3>
                                                        <Badge
                                                            variant="outline"
                                                            className="bg-blue-500/20 text-blue-300 border-blue-400/50 text-xs flex-shrink-0"
                                                        >
                                                            New
                                                        </Badge>
                                                    </div>

                                                    {/* Description */}
                                                    <p className="text-sm text-gray-400 line-clamp-3">
                                                        {suggestion.suggestedDescription}
                                                    </p>

                                                    {/* Details Grid */}
                                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                                        <div className="flex items-center gap-1.5 text-gray-400">
                                                            <FileText className="w-3.5 h-3.5" />
                                                            <span className="capitalize">
                                                                {suggestion.suggestedCampaignType}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-gray-400">
                                                            <MapPin className="w-3.5 h-3.5" />
                                                            <span className="truncate">
                                                                {suggestion.suggestedLocation}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-gray-400">
                                                            <CircleIcon className="w-3.5 h-3.5 fill-current" />
                                                            <span className="capitalize">
                                                                {suggestion.suggestedTargetAudience}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-gray-400">
                                                            <Clock className="w-3.5 h-3.5" />
                                                            <span>
                                                                {suggestion.suggestedDuration || 7} days
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Platform Badges */}
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        {suggestion.suggestedPlatform.map((platform) => (
                                                            <Badge
                                                                key={platform}
                                                                variant="secondary"
                                                                className="bg-white/10 text-gray-300 border-0 text-xs"
                                                            >
                                                                {platform === "facebook"
                                                                    ? "📘 Facebook"
                                                                    : "Google"}
                                                            </Badge>
                                                        ))}
                                                    </div>

                                                    {/* Budget */}
                                                    {suggestion.suggestedBudget && (
                                                        <div className="text-sm font-medium text-white">
                                                            Budget: $
                                                            {suggestion.suggestedBudget.toLocaleString()}
                                                        </div>
                                                    )}

                                                    {/* Action Button */}
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleUseSuggestion(suggestion)}
                                                        className="w-full h-9 rounded-full border-0 text-white text-xs hover:bg-[#2F2F2F]/60 transition-all mt-2"
                                                        style={{
                                                            background:
                                                                "linear-gradient(90deg, #66AFB7 0%, #5A9FA6 100%)",
                                                        }}
                                                    >
                                                        Use This Suggestion
                                                        <ArrowRightIcon className="w-4 h-4 ml-2" />
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </>
    )
}

export default AICampaignSuggestion