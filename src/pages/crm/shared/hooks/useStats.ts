import CompaniesIcon from "@/components/icons/CompaniesIcon";
import LeadsIcon from "@/components/icons/LeadsIcon";
import OutreachIcon from "@/components/icons/OutreachIcon";
import ResponseIcon from "@/components/icons/ResponseIcon";
import { ClientsIcon } from "@/components/icons/ClientsIcon";
import ChatIcon from "@/components/icons/ChatIcon";

export interface StatCard {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  link: string;
}

export const defaultStatsCards: StatCard[] = [
  {
    title: "Total Companies",
    value: "0",
    icon: CompaniesIcon,
    link: "View All",
  },
  { title: "Total leads", value: "0", icon: LeadsIcon, link: "View All" },
  { title: "Total Outreach", value: "0", icon: OutreachIcon, link: "View All" },
  { title: "Total Response", value: "0", icon: ResponseIcon, link: "View All" },
  { title: "Active Clients", value: "0", icon: ClientsIcon, link: "View All" },
  { title: "Messages Sent", value: "0", icon: ChatIcon, link: "View All" },
];

const parseStatValue = (value: number | undefined, fallback: string) =>
  value === undefined ? fallback : value.toString();

export const buildStats = (
  totalCompanies?: number,
  totalLeads?: number,
  baseCards = defaultStatsCards
): StatCard[] => [
  {
    ...baseCards[0],
    value: parseStatValue(totalCompanies, baseCards[0].value),
  },
  {
    ...baseCards[1],
    value: parseStatValue(totalLeads, baseCards[1].value),
  },
  { ...baseCards[2] },
  { ...baseCards[3] },
  { ...baseCards[4] },
  { ...baseCards[5] },
];
