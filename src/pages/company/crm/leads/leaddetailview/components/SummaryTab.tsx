import React, { useMemo } from 'react';
import { RefreshCcw, Loader2 } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';

import { Lead } from '@/services/leads.service';
import {
    leadSummaryService,
    LeadSummaryResponse,
} from '@/services/leadSummary.service';
import { useToast } from '@/hooks/use-toast';

interface SummaryTabProps {
    lead?: Lead;
}

const SummaryTab: React.FC<SummaryTabProps> = ({ lead }) => {
    const leadId = lead?._id;
    const { toast } = useToast();


    const {
        data: leadSummaryResponse,
        isLoading,
        isFetching,
        refetch,
    } = useQuery<LeadSummaryResponse>({
        queryKey: ['lead-summary', leadId],
        queryFn: () => {
            if (!leadId) {
                throw new Error('Lead ID is required');
            }
            return leadSummaryService.getSummary(leadId);
        },
        enabled: Boolean(leadId),
        refetchInterval: (query) => {
            if (query.state.data?.data?.status === 'pending') {
                return 5000;
            }
            return 30000;
        },
        refetchOnWindowFocus: true,
        staleTime: 0,
        refetchOnMount: true,
    });

    const refreshLeadSummaryMutation = useMutation<
        LeadSummaryResponse,
        Error,
        void
    >({
        mutationFn: async () => {
            if (!leadId) {
                throw new Error('Lead ID is required');
            }
            return leadSummaryService.refreshSummary(leadId);
        },
        onSuccess: (response) => {
            toast({
                title: 'Summary refreshed',
                description:
                    response?.message ||
                    'AI summary updated with the latest WhatsApp, SMS, call, and email activity.',
            });
            refetch();
        },
        onError: (error: any) => {
            toast({
                title: 'Failed to refresh summary',
                description:
                    error?.response?.data?.message ||
                    error?.message ||
                    'Please try again.',
                variant: 'destructive',
            });
        },
    });


    const leadSummary = leadSummaryResponse?.data ?? null;

    const summaryParagraphs = useMemo(() => {
        if (!leadSummary?.summary) {
            return [];
        }
        return leadSummary.summary
            .split(/\n+/)
            .map((line) => line.trim())
            .filter(Boolean);
    }, [leadSummary?.summary]);

    const summaryStatusLabel = useMemo(() => {
        if (!leadSummary?.status) {
            return 'Summary will generate automatically within 24h.';
        }
        if (leadSummary.status === 'completed') {
            return leadSummary.lastGeneratedAt
                ? `Updated ${formatDistanceToNow(
                    new Date(leadSummary.lastGeneratedAt),
                    { addSuffix: true }
                )}`
                : 'Summary ready';
        }
        if (leadSummary.status === 'failed') {
            return leadSummary.failureReason
                ? `Last run failed: ${leadSummary.failureReason}`
                : 'Unable to generate summary.';
        }
        return 'Generating the latest summary...';
    }, [
        leadSummary?.status,
        leadSummary?.lastGeneratedAt,
        leadSummary?.failureReason,
    ]);

    const summaryScoreValue =
        typeof leadSummary?.momentumScore === 'number'
            ? Math.max(0, Math.min(100, Math.round(leadSummary.momentumScore)))
            : null;

    const summaryProgress = (summaryScoreValue ?? 0) / 100;
    const summaryCircleRadius = 45;
    const summaryCircumference = 2 * Math.PI * summaryCircleRadius;
    const summaryDashoffset =
        summaryCircumference *
        (1 - Math.min(1, Math.max(0, summaryProgress)));

    const isSummaryBusy =
        isLoading ||
        isFetching ||
        refreshLeadSummaryMutation.isPending ||
        leadSummary?.status === 'pending';

    const handleRefreshLeadSummary = () => {
        if (!leadId || refreshLeadSummaryMutation.isPending) {
            return;
        }
        refreshLeadSummaryMutation.mutate();
    };

    return (
        <div className="flex flex-col items-center">
            {/* Circular Progress Indicator */}
            <div className="relative w-48 h-48 mb-4">
                <svg
                    className="w-full h-full transform -rotate-90"
                    viewBox="0 0 100 100"
                >
                    <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="#1a1a1a"
                        strokeWidth="8"
                    />
                    <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="url(#gradient)"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={summaryCircumference}
                        strokeDashoffset={summaryDashoffset}
                    />
                    <defs>
                        <linearGradient
                            id="gradient"
                            x1="0%"
                            y1="0%"
                            x2="100%"
                            y2="100%"
                        >
                            <stop offset="0%" stopColor="#3b82f6" />
                            <stop offset="100%" stopColor="#06b6d4" />
                        </linearGradient>
                    </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-4xl font-bold text-white">
                        {summaryScoreValue !== null ? `${summaryScoreValue}%` : '--'}
                    </span>
                </div>
            </div>

            <p className="text-white text-center mb-8 text-xs text-white/70">
                {summaryScoreValue !== null
                    ? 'Based on recent WhatsApp, SMS, email, and call activity.'
                    : 'Run the AI summary to compute the engagement score.'}
            </p>

            <div
                className="w-full rounded-lg p-4"
                style={{
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    background: 'rgba(255, 255, 255, 0.02)',
                }}
            >
                <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                    <h3 className="text-white text-xs sm:text-sm font-semibold">
                        AI Summary
                    </h3>
                    <button
                        onClick={handleRefreshLeadSummary}
                        disabled={!leadId || refreshLeadSummaryMutation.isPending}
                        className="h-8 w-8 p-0 flex items-center justify-center text-white/70 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <RefreshCcw className="w-3.5 h-3.5" />
                    </button>
                </div>

                <p className="text-[11px] leading-tight text-white/50 mb-3 whitespace-nowrap overflow-hidden text-ellipsis">
                    {summaryStatusLabel}
                </p>

                <div className="text-white/80 text-xs space-y-3 leading-relaxed min-h-[140px]">
                    {isSummaryBusy ? (
                        <div className="flex items-center text-white/60 text-xs">
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Generating the latest insights...
                        </div>
                    ) : summaryParagraphs.length > 0 ? (
                        summaryParagraphs.map((paragraph, index) => (
                            <p key={index}>{paragraph}</p>
                        ))
                    ) : (
                        <div className="text-white/60 text-xs">
                            No WhatsApp, SMS, email, or call activity recorded for{' '}
                            {lead?.name || 'this lead'} in the last 30 day(s).
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SummaryTab;
