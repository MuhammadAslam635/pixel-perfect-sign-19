import {
  Building2,
  Users,
  Send,
  CheckCircle2,
  UserCheck,
  MessageCircle,
} from "lucide-react";

export interface StatCard {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  link: string;
}

export interface CrmStatsValues {
  totalCompanies?: number;
  totalLeads?: number;
  totalOutreach?: number;
  totalDealsClosed?: number;
  activeClients?: number;
  messagesSent?: number;
  totalCompaniesWithPeople?: number;
  totalCompaniesWithWebsite?: number;
}

export const defaultStatsCards: StatCard[] = [
  {
    title: "Total Companies",
    value: "0",
    icon: Building2,
    link: "View All",
  },
  { title: "Total leads", value: "0", icon: Users, link: "View All" },
  { title: "Total Outreach", value: "0", icon: Send, link: "View All" },
  {
    title: "Deal Closed",
    value: "0",
    icon: CheckCircle2,
    link: "View All",
  },
  { title: "Active Clients", value: "0", icon: UserCheck, link: "View All" },
  { title: "Messages Sent", value: "0", icon: MessageCircle, link: "View All" },
];

const parseStatValue = (value: number | undefined, fallback: string) =>
  value === undefined ? fallback : value.toString();

export const buildStats = (
  overrides: CrmStatsValues = {},
  context: "companies" | "leads" | "followups" = "companies",
  baseCards = defaultStatsCards
): StatCard[] => {
  const parseStatValue = (
    value: number | string | undefined,
    fallback: string
  ) => (value === undefined || value === null ? fallback : value.toString());

  if (context === "companies") {
    return [
      {
        ...baseCards[0],
        value: parseStatValue(overrides.totalCompanies, baseCards[0].value),
      },
      {
        ...baseCards[1],
        value: parseStatValue(overrides.totalLeads, baseCards[1].value),
      },
      {
        title: "With People",
        value: parseStatValue(overrides.totalCompaniesWithPeople, "0"),
        icon: Users,
        link: "View All",
      },
      {
        title: "With Website",
        value: parseStatValue(overrides.totalCompaniesWithWebsite, "0"),
        icon: Building2,
        link: "View All",
      },
      {
        title: "Active Clients",
        value: parseStatValue(overrides.activeClients, baseCards[4].value),
        icon: UserCheck,
        link: "View All",
      },
      {
        title: "Messages Sent",
        value: parseStatValue(overrides.messagesSent, baseCards[5].value),
        icon: MessageCircle,
        link: "View All",
      },
    ];
  } else if (context === "leads") {
    return [
      {
        title: "Total Leads",
        value: parseStatValue(overrides.totalLeads, "0"),
        icon: Users,
        link: "View All",
      },
      {
        title: "Total Companies",
        value: parseStatValue(overrides.totalCompanies, baseCards[0].value),
        icon: Building2,
        link: "View All",
      },
      {
        title: "Total Outreach",
        value: parseStatValue(overrides.totalOutreach, baseCards[2].value),
        icon: Send,
        link: "View All",
      },
      {
        title: "Deal Closed",
        value: parseStatValue(overrides.totalDealsClosed, baseCards[3].value),
        icon: CheckCircle2,
        link: "View All",
      },
      {
        title: "Active Clients",
        value: parseStatValue(overrides.activeClients, baseCards[4].value),
        icon: UserCheck,
        link: "View All",
      },
      {
        title: "Messages Sent",
        value: parseStatValue(overrides.messagesSent, baseCards[5].value),
        icon: MessageCircle,
        link: "View All",
      },
    ];
  } else if (context === "followups") {
    // This will be handled separately in the followups page
    return [];
  }

  return baseCards;
};
