import { useEffect, useRef, useState } from "react";
import { TopNav } from "@/components/TopNav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Building2,
  Filter,
  Users,
  ArrowRight,
  Linkedin,
  Mail,
  Phone,
  Copy,
  MessageCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  companiesService,
  Company,
  CompanyPerson,
} from "@/services/companies.service";
import { leadsService, Lead } from "@/services/leads.service";
import { EmailDraftModal } from "@/components/EmailDraftModal";
import { toast } from "sonner";

const statsCards = [
  { title: "Total Companies", value: "512", icon: Building2, link: "View All" },
  { title: "Total leads", value: "8542", icon: Filter, link: "View All" },
  { title: "Total Outreach", value: "5236", icon: Users, link: "View All" },
  { title: "Total Response", value: "3256", icon: Users, link: "View All" },
];

const CompanyDetail = () => {
  type TabKey = "companies" | "leads";
  const tabs: { id: TabKey; label: string }[] = [
    { id: "companies", label: "Companies" },
    { id: "leads", label: "Leads" },
  ];

  const [activeTab, setActiveTab] = useState<TabKey>("companies");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(
    null
  );
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [leadsLoading, setLeadsLoading] = useState<boolean>(false);
  const [stats, setStats] = useState(statsCards);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const tabRefs = useRef<Record<TabKey, HTMLButtonElement | null>>({
    companies: null,
    leads: null,
  });
  const [indicatorStyles, setIndicatorStyles] = useState({ width: 0, left: 0 });

  // Fetch companies data and leads count
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch companies
        const companiesResponse = await companiesService.getCompanies({
          page: 1,
          limit: 50,
        });

        // Fetch leads to get total count
        const leadsResponse = await leadsService.getLeads();

        if (companiesResponse.success) {
          setCompanies(companiesResponse.data.docs);

          // Update stats with real data including leads count
          const totalLeads = leadsResponse.success
            ? leadsResponse.data.length
            : 0;
          setStats([
            {
              title: "Total Companies",
              value: companiesResponse.data.totalDocs.toString(),
              icon: Building2,
              link: "View All",
            },
            {
              title: "Total leads",
              value: totalLeads.toString(),
              icon: Filter,
              link: "View All",
            },
            {
              title: "Total Outreach",
              value: "5236",
              icon: Users,
              link: "View All",
            },
            {
              title: "Total Response",
              value: "3256",
              icon: Users,
              link: "View All",
            },
          ]);
        }
      } catch (error: any) {
        console.error("Error fetching data:", error);
        toast.error(error.response?.data?.message || "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch leads data when leads tab is active
  useEffect(() => {
    if (activeTab === "leads") {
      const fetchLeads = async () => {
        try {
          setLeadsLoading(true);
          const response = await leadsService.getLeads();

          if (response.success) {
            setLeads(response.data);

            // Update stats with real data
            setStats((prev) => {
              const newStats = [...prev];
              newStats[1] = {
                title: "Total leads",
                value: response.data.length.toString(),
                icon: Filter,
                link: "View All",
              };
              return newStats;
            });
          }
        } catch (error: any) {
          console.error("Error fetching leads:", error);
          toast.error(error.response?.data?.message || "Failed to fetch leads");
        } finally {
          setLeadsLoading(false);
        }
      };

      fetchLeads();
    }
  }, [activeTab]);

  useEffect(() => {
    const updateIndicator = () => {
      const activeEl = tabRefs.current[activeTab];
      const containerEl = containerRef.current;

      if (activeEl && containerEl) {
        const containerRect = containerEl.getBoundingClientRect();
        const activeRect = activeEl.getBoundingClientRect();

        setIndicatorStyles({
          width: activeRect.width,
          left: activeRect.left - containerRect.left,
        });
      }
    };

    updateIndicator();
    window.addEventListener("resize", updateIndicator);

    return () => {
      window.removeEventListener("resize", updateIndicator);
    };
  }, [activeTab]);

  const handleCompanyClick = (companyId: string) => {
    setSelectedCompanyId((prev) => (prev === companyId ? null : companyId));
  };

  const handleLeadClick = (leadId: string) => {
    setSelectedLeadId((prev) => (prev === leadId ? null : leadId));
  };

  const handleEmailClick = (lead: Lead) => {
    setSelectedLead(lead);
    setEmailModalOpen(true);
  };

  const isSidebarOpen =
    activeTab === "companies"
      ? selectedCompanyId !== null
      : selectedLeadId !== null;
  const selectedCompany: Company | undefined = companies.find(
    (company) => company._id === selectedCompanyId
  );
  const selectedLeadDetails: Lead | undefined = leads.find(
    (lead) => lead._id === selectedLeadId
  );

  return (
    <div className="min-h-screen w-full bg-[#1A1A1A] flex flex-col">
      <TopNav />

      <main className="flex-1 p-6 bg-[#1A1A1A]">
        <div className="max-w-[1600px] mx-auto">
          {/* Tabs */}
          <div
            ref={containerRef}
            className="relative mb-6 inline-flex w-fit gap-[10px] items-center rounded-full bg-[#2A2A2A] p-1"
          >
            <div
              className="absolute top-1 bottom-1 left-0 rounded-full bg-[#4A4A4A] transition-all duration-300 ease-out"
              style={{
                width: indicatorStyles.width,
                left: indicatorStyles.left,
                opacity: indicatorStyles.width ? 1 : 0,
              }}
            />
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                ref={(el) => {
                  tabRefs.current[tab.id] = el;
                }}
                onClick={() => setActiveTab(tab.id)}
                variant="ghost"
                className={`relative z-10 rounded-full px-6 py-2 text-sm font-medium transition-colors duration-200 ${
                  activeTab === tab.id
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground/80"
                }`}
              >
                {tab.label}
              </Button>
            ))}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {stats.map((stat) => (
              <div
                key={stat.title}
                className="px-2 py-3 bg-gradient-to-r from-[#1d1d1d50] via-cyan-500/5 to-[#2c2c2c31] border-[#1d1d1d50] rounded-2xl"
              >
                <Card className="border-none bg-transparent overflow-hidden transition-shadow duration-300 hover:shadow-lg">
                  <div className="relative flex flex-col justify-between rounded-[20px] border border-white/10 bg-gradient-to-b from-[#ffffff20] via-[#ffffff00] to-[#ffffff10] p-4 backdrop-blur-xl min-h-[150px] shadow-inner shadow-white/10">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm text-white/70 font-medium">
                        {stat.title}
                      </p>
                      <Button
                        variant="link"
                        className="h-auto p-0 text-xs text-white/60 hover:text-white/90 transition-colors"
                      >
                        {stat.link} <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center border border-white/15 shadow-sm">
                        <stat.icon className="w-6 h-6 text-white/80" />
                      </div>
                      <p className="text-3xl font-bold text-white">
                        {stat.value}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>

          <div className="flex-1">
            <h2 className="text-lg font-medium text-foreground mb-4">
              {activeTab === "companies" ? "Companies" : "Leads"}
            </h2>
          </div>
          {/* Split View */}
          <div className="flex gap-6 items-start">
            {/* Left: Companies/Leads List */}
            <div className="space-y-3 bg-[#222B2C] p-6 rounded-2xl min-h-[600px] flex-1">
              {activeTab === "companies" ? (
                loading ? (
                  <div className="text-center text-white/70 py-8">
                    Loading companies...
                  </div>
                ) : companies.length === 0 ? (
                  <div className="text-center text-white/70 py-8">
                    No companies found
                  </div>
                ) : (
                  companies.map((company) => {
                    const isActive = selectedCompanyId === company._id;
                    const employeeCount = company.employees
                      ? `${company.employees} employees`
                      : "N/A";
                    const primaryExecutive = company.people?.[0];
                    const primaryEmail =
                      primaryExecutive?.email ||
                      primaryExecutive?.emails?.[0] ||
                      null;
                    const companyLinkedIn =
                      primaryExecutive?.linkedin || company.website || null;

                    return (
                      <Card
                        key={company._id}
                        onClick={() => handleCompanyClick(company._id)}
                        className={`relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between overflow-hidden bg-gradient-to-r from-[#13363b] via-[#1f4c55] to-[#16383f] border ${
                          isActive ? "border-primary/60" : "border-[#274a4f]"
                        } rounded-[30px] px-7 py-6 cursor-pointer transition-all duration-300 hover:shadow-[0_20px_45px_rgba(0,0,0,0.32)] before:absolute before:content-[''] before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-[55%] before:w-[5px] before:rounded-full ${
                          isActive ? "before:bg-primary" : "before:bg-white/75"
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 text-white/90">
                            <h3 className="text-xl font-semibold text-white">
                              {company.name}
                            </h3>
                            {company.industry && (
                              <span className="text-sm text-white/70 font-medium">
                                | {company.industry}
                              </span>
                            )}
                          </div>
                          <p className="mt-2 text-xs text-white/65 truncate max-w-[460px]">
                            {company.description ||
                              company.about ||
                              "No description available"}
                          </p>
                          <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-white/75">
                            <Badge className="rounded-full bg-white/15 text-white border-white/20 px-4 py-1">
                              {employeeCount}
                            </Badge>
                            {companyLinkedIn && (
                              <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1 max-w-[220px]">
                                <Linkedin className="w-3.5 h-3.5 text-white/85" />
                                <span className="font-medium text-white/85 truncate">
                                  {companyLinkedIn
                                    .replace(/^https?:\/\//, "")
                                    .replace(/^www\./, "")}
                                </span>
                              </div>
                            )}
                            {primaryEmail && (
                              <span className="rounded-full border border-white/15 bg-white/10 px-4 py-1 font-medium text-white/80">
                                {primaryEmail}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="w-full md:w-[260px] flex flex-col items-center md:items-end gap-3 text-white/80">
                          {(company.website || primaryEmail) && (
                            <p className="text-sm font-semibold text-white/75 text-center md:text-right">
                              {company.website && (
                                <span className="text-white/85">
                                  {company.website}
                                </span>
                              )}
                              {company.website && primaryEmail && (
                                <span className="mx-2 text-white/40">|</span>
                              )}
                              {primaryEmail && (
                                <span className="text-white/70">
                                  {primaryEmail}
                                </span>
                              )}
                            </p>
                          )}
                          {company.address && (
                            <p className="text-xs text-white/55 text-center md:text-right max-w-[220px]">
                              {company.address}
                            </p>
                          )}
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCompanyClick(company._id);
                            }}
                            className="rounded-full bg-white/15 px-6 py-1.5 text-xs font-semibold text-white hover:bg-white/25 border border-white/20"
                          >
                            {isActive ? "Close Executives" : "View Executives"}
                            <ArrowRight className="ml-2 w-3 h-3" />
                          </Button>
                        </div>
                      </Card>
                    );
                  })
                )
              ) : leadsLoading ? (
                <div className="text-center text-white/70 py-8">
                  Loading leads...
                </div>
              ) : leads.length === 0 ? (
                <div className="text-center text-white/70 py-8">
                  No leads found
                </div>
              ) : (
                leads.map((lead) => {
                  const isActive = selectedLeadId === lead._id;
                  const displayEmail = lead.email || "N/A";
                  const displayPhone = lead.phone || "N/A";

                  return (
                    <Card
                      key={lead._id}
                      onClick={() => handleLeadClick(lead._id)}
                      className={`relative bg-gradient-to-r from-[#13363b] via-[#1f4c55] to-[#16383f] border ${
                        isActive ? "border-primary/60" : "border-[#274a4f]"
                      } px-7 py-4 pl-10 rounded-[24px] transition-all duration-300 hover:shadow-[0_16px_38px_rgba(0,0,0,0.28)] before:absolute before:content-[''] before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-[55%] before:w-[5px] before:rounded-full ${
                        isActive ? "before:bg-primary" : "before:bg-white/75"
                      } cursor-pointer`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold text-white">
                              {lead.name}
                            </h3>
                            {lead.companyName && (
                              <span className="text-xs text-white/70">
                                | {lead.companyName}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-white/75">
                            <div className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1 border border-white/20">
                              <Mail className="w-3 h-3" />
                              <span>{displayEmail}</span>
                            </div>
                            <div className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1 border border-white/20">
                              <Linkedin className="w-3 h-3" />
                              <span>{lead.linkedinUrl || "N/A"}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {/* Small circular icon buttons */}
                          <div className="flex items-center gap-1">
                            {/* Phone Icon */}
                            <button
                              className="h-7 w-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (displayPhone !== "N/A") {
                                  window.open(`tel:${displayPhone}`);
                                }
                              }}
                            >
                              <Phone className="w-3.5 h-3.5 text-white/80" />
                            </button>

                            {/* Email Icon */}
                            <button
                              className="h-7 w-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEmailClick(lead);
                              }}
                            >
                              <Mail className="w-3.5 h-3.5 text-white/80" />
                            </button>

                            {/* LinkedIn Icon */}
                            <button
                              className="h-7 w-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (lead.linkedinUrl) {
                                  window.open(
                                    lead.linkedinUrl.startsWith("http")
                                      ? lead.linkedinUrl
                                      : `https://${lead.linkedinUrl}`,
                                    "_blank"
                                  );
                                }
                              }}
                            >
                              <Linkedin className="w-3.5 h-3.5 text-white/80" />
                            </button>

                            {/* WhatsApp Icon */}
                            <button
                              className="h-7 w-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (displayPhone !== "N/A") {
                                  // Format phone for WhatsApp (remove spaces, dashes, etc)
                                  const whatsappPhone = displayPhone.replace(
                                    /\D/g,
                                    ""
                                  );
                                  window.open(
                                    `https://wa.me/${whatsappPhone}`,
                                    "_blank"
                                  );
                                }
                              }}
                            >
                              <MessageCircle className="w-3.5 h-3.5 text-white/80" />
                            </button>
                          </div>

                          {/* View Details Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLeadClick(lead._id);
                            }}
                            className="bg-white/10 hover:bg-white/20 text-white/90 text-xs rounded-full px-4 py-1.5 flex items-center gap-1.5 transition-colors"
                          >
                            View Details
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>

            {/* Right: Executives/Details Panel */}
            <div
              className={`flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out sticky top-6 ${
                isSidebarOpen
                  ? "w-[400px] opacity-100"
                  : "w-0 opacity-0 pointer-events-none"
              }`}
            >
              <Card
                className={`bg-[#222B2C] border-[#3A3A3A] p-5 min-h-[600px] max-h-[calc(100vh-200px)] overflow-y-auto transition-all duration-300 ease-in-out ${
                  isSidebarOpen
                    ? "opacity-100 translate-x-0"
                    : "opacity-0 translate-x-6"
                }`}
              >
                {activeTab === "companies" ? (
                  // Executives Panel
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="p-4 mr-2 rounded-full bg-black/10 hover:bg-black/20 text-white flex items-center justify-center">
                          <Users className="w-5 h-5" />
                        </div>
                        <h3 className="text-base font-medium text-foreground">
                          Executives
                        </h3>
                      </div>
                      <Button
                        variant="link"
                        className="h-auto p-0 text-xs text-foreground/60 hover:text-foreground/80"
                        onClick={() => {
                          setActiveTab("leads");
                        }}
                      >
                        View All <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {selectedCompany ? (
                        selectedCompany.people &&
                        selectedCompany.people.length > 0 ? (
                          selectedCompany.people.map((exec, index) => (
                            <div
                              key={exec._id || exec.id || index}
                              className="relative overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-r from-[#1f3032] via-[#243f42] to-[#1b2c2d] px-4 py-3 transition-all duration-300 hover:shadow-[0_12px_32px_rgba(0,0,0,0.3)] before:absolute before:content-[''] before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-[55%] before:w-[4px] before:rounded-full before:bg-white/70"
                            >
                              <p className="text-sm font-semibold text-white mb-0.5">
                                {exec.name || "N/A"}
                              </p>
                              <p className="text-xs text-white/60 mb-2">
                                {exec.title || exec.position || "N/A"}
                                {exec.email && ` | ${exec.email}`}
                              </p>
                              <div className="flex justify-end">
                                {exec.linkedin && (
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white/70"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      window.open(
                                        exec.linkedin.startsWith("http")
                                          ? exec.linkedin
                                          : `https://${exec.linkedin}`,
                                        "_blank"
                                      );
                                    }}
                                  >
                                    <Linkedin className="w-3.5 h-3.5" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground/60">
                            No executives found for this company.
                          </p>
                        )
                      ) : (
                        <p className="text-sm text-muted-foreground/60">
                          Select a company to view its executives.
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  // Lead Details Panel
                  <>
                    <div className="flex items-center justify-between mb-6 px-4">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-full bg-white/10 text-white flex items-center justify-center">
                          <Users className="w-4 h-4" />
                        </div>
                        <h3 className="text-sm font-medium text-foreground">
                          Details
                        </h3>
                      </div>
                      <div className="flex items-center gap-1">
                        {/* Phone Icon */}
                        <button
                          className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                          onClick={() => {
                            if (selectedLeadDetails?.phone) {
                              window.open(`tel:${selectedLeadDetails.phone}`);
                            }
                          }}
                        >
                          <Phone className="w-3.5 h-3.5 text-white/80" />
                        </button>

                        {/* Email Icon */}
                        <button
                          className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                          onClick={() => {
                            if (selectedLeadDetails) {
                              handleEmailClick(selectedLeadDetails);
                            }
                          }}
                        >
                          <Mail className="w-3.5 h-3.5 text-white/80" />
                        </button>

                        {/* LinkedIn Icon */}
                        <button
                          className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                          onClick={() => {
                            if (selectedLeadDetails?.linkedinUrl) {
                              window.open(
                                selectedLeadDetails.linkedinUrl.startsWith(
                                  "http"
                                )
                                  ? selectedLeadDetails.linkedinUrl
                                  : `https://${selectedLeadDetails.linkedinUrl}`,
                                "_blank"
                              );
                            }
                          }}
                        >
                          <Linkedin className="w-3.5 h-3.5 text-white/80" />
                        </button>

                        {/* WhatsApp Icon */}
                        <button
                          className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                          onClick={() => {
                            if (selectedLeadDetails?.phone) {
                              const whatsappPhone =
                                selectedLeadDetails.phone.replace(/\D/g, "");
                              window.open(
                                `https://wa.me/${whatsappPhone}`,
                                "_blank"
                              );
                            }
                          }}
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-white/80" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4 px-4">
                      {selectedLeadDetails ? (
                        <>
                          {/* Lead Avatar and Name */}
                          <div className="flex flex-col items-center text-center py-8">
                            <Avatar className="h-32 w-32 mb-4 border-4 border-white/10">
                              <AvatarImage
                                src={selectedLeadDetails.pictureUrl}
                                alt={selectedLeadDetails.name}
                              />
                              <AvatarFallback className="bg-[#3d4f51] text-white text-3xl">
                                {selectedLeadDetails.name
                                  .charAt(0)
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <h4 className="text-xl font-semibold text-white mb-2">
                              {selectedLeadDetails.name}
                            </h4>
                            <p className="text-sm text-white/50 mb-1">
                              {selectedLeadDetails.companyName ||
                                "Company not specified"}
                            </p>
                            <p className="text-xs text-white/40">
                              {selectedLeadDetails.position ||
                                "Chief Executive Officer"}
                            </p>
                          </div>
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground/60 text-center py-8">
                          Select a lead to view details.
                        </p>
                      )}
                    </div>
                  </>
                )}
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Email Draft Modal */}
      <EmailDraftModal
        open={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        leadName={selectedLead?.name}
        leadEmail={selectedLead?.email}
      />
    </div>
  );
};

export default CompanyDetail;
