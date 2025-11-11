import { useEffect, useRef, useState } from 'react';
import { TopNav } from '@/components/TopNav';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Building2, Filter, Users, ArrowRight, Linkedin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const companiesData = [
  {
    id: 1,
    name: 'Cyberify',
    type: 'AI Agency',
    description:
      'AI consulting studio helping brands automate customer outreach and personalize inbound workflows with custom GPT copilots.',
    teamSize: '11-50 Team Members',
    linkedin: 'linkedin.com/company/cyberify',
    website: 'cyberify.co',
    email: 'hello@cyberify.co',
    executives: [
      { name: 'Naeem Bhatti', role: 'Founder & CTO', email: 'naeem@cyberify.co' },
      { name: 'Sarah Chen', role: 'Head of Product', email: 'sarah@cyberify.co' },
      { name: 'Felix Moore', role: 'VP Sales', email: 'felix@cyberify.co' },
    ],
  },
  {
    id: 2,
    name: 'Northwind Labs',
    type: 'B2B SaaS',
    description:
      'Provides revenue intelligence dashboards for mid-market finance teams, consolidating CRM, billing, and pipeline data streams.',
    teamSize: '51-100 Team Members',
    linkedin: 'linkedin.com/company/northwindlabs',
    website: 'northwindlabs.io',
    email: 'team@northwindlabs.io',
    executives: [
      { name: 'Saad Naeem', role: 'CEO', email: 'saad@northwindlabs.io' },
      { name: 'Jacob Miles', role: 'CFO', email: 'jacob@northwindlabs.io' },
      { name: 'Priya Patel', role: 'VP Customer Success', email: 'priya@northwindlabs.io' },
    ],
  },
  {
    id: 3,
    name: 'LumenX Studios',
    type: 'Creative Agency',
    description:
      'Specializes in interactive AR/VR product launches and immersive brand storytelling for consumer electronics companies.',
    teamSize: '101-250 Team Members',
    linkedin: 'linkedin.com/company/lumenx',
    website: 'lumenx.studio',
    email: 'contact@lumenx.studio',
    executives: [
      { name: 'Zubair Khan', role: 'Chief Creative Officer', email: 'zubair@lumenx.studio' },
      { name: 'Isabella Ruiz', role: 'Executive Producer', email: 'isabella@lumenx.studio' },
      { name: 'Mateo Li', role: 'Head of Engineering', email: 'mateo@lumenx.studio' },
    ],
  },
  {
    id: 4,
    name: 'Atlas Logistics',
    type: 'Supply Chain',
    description:
      'Freight orchestration platform that optimizes last-mile delivery routes using predictive analytics and IoT tracking.',
    teamSize: '501-1000 Team Members',
    linkedin: 'linkedin.com/company/atlaslogistics',
    website: 'atlaslogistics.com',
    email: 'ops@atlaslogistics.com',
    executives: [
      { name: 'Ashar Maqbool', role: 'COO', email: 'ashar@atlaslogistics.com' },
      { name: 'Hamza Rafique', role: 'Head of Partnerships', email: 'hamza@atlaslogistics.com' },
      { name: 'Linda Park', role: 'VP Operations', email: 'linda@atlaslogistics.com' },
    ],
  },
];

const statsCards = [
  { title: 'Total Companies', value: '512', icon: Building2, link: 'View All' },
  { title: 'Total leads', value: '8542', icon: Filter, link: 'View All' },
  { title: 'Total Outreach', value: '5236', icon: Users, link: 'View All' },
  { title: 'Total Response', value: '3256', icon: Users, link: 'View All' },
];

const CompanyDetail = () => {
  type TabKey = 'companies' | 'leads';
  const tabs: { id: TabKey; label: string }[] = [
    { id: 'companies', label: 'Companies' },
    { id: 'leads', label: 'Leads' },
  ];

  const [activeTab, setActiveTab] = useState<TabKey>('companies');
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const tabRefs = useRef<Record<TabKey, HTMLButtonElement | null>>({
    companies: null,
    leads: null,
  });
  const [indicatorStyles, setIndicatorStyles] = useState({ width: 0, left: 0 });

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
    window.addEventListener('resize', updateIndicator);

    return () => {
      window.removeEventListener('resize', updateIndicator);
    };
  }, [activeTab]);

  const handleCompanyClick = (companyId: number) => {
    setSelectedCompanyId((prev) => (prev === companyId ? null : companyId));
  };

  const isSidebarOpen = selectedCompanyId !== null;
  const selectedCompany = companiesData.find((company) => company.id === selectedCompanyId);

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
                className={`relative z-10 rounded-full px-6 py-2 text-sm font-medium transition-colors duration-200 ${activeTab === tab.id
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground/80'
                  }`}
              >
                {tab.label}
              </Button>
            ))}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {statsCards.map((stat) => (
              <div className="px-2 py-3 bg-gradient-to-r from-[#1d1d1d50] via-cyan-500/5 to-[#2c2c2c31] border-[#1d1d1d50] rounded-2xl">
              <Card
                key={stat.title}
                className="border-none bg-transparent overflow-hidden transition-shadow duration-300 hover:shadow-lg"
              >
                <div className="relative flex flex-col justify-between rounded-[20px] border border-white/10 bg-gradient-to-b from-[#ffffff20] via-[#ffffff00] to-[#ffffff10] p-4 backdrop-blur-xl min-h-[150px] shadow-inner shadow-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-white/70 font-medium">{stat.title}</p>
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
                    <p className="text-3xl font-bold text-white">{stat.value}</p>
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>

          {/* Split View */}
          <div className="flex gap-6">
            {/* Left: Companies List */}
            <div className="flex-1">
              <h2 className="text-lg font-medium text-foreground mb-4">Companies</h2>
              <div className="space-y-3 bg-[#222B2C] p-6 rounded-2xl">
                {companiesData.map((company) => {
                  const isActive = selectedCompanyId === company.id;

                  return (
                    <Card
                      key={company.id}
                      onClick={() => handleCompanyClick(company.id)}
                      className={`bg-gradient-to-b from-[#2d4041] to-[#283637] backdrop-blur-sm border ${isActive ? 'border-primary/60 shadow-[0_0_0_1px_rgba(0,0,0,0.2)]' : 'border-[#3A3A3A]'} p-4 hover:bg-[#3A3A3A]/50 transition-smooth cursor-pointer`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-base font-medium text-white">{company.name}</h3>
                            <span className="text-sm text-muted-foreground/">| {company.type}</span>
                          </div>
                          <p className="text-xs text-white/70 mb-3 leading-relaxed">
                            {company.description}
                          </p>
                          <div className="flex items-center gap-4">
                            <Badge className="bg-[#BEC3C3] text-[#283637] border-0 text-xs font-normal">
                              {company.teamSize}
                            </Badge>
                            <div className="flex items-center gap-1 text-xs">
                              <div className="p-2 mr-2 rounded-full bg-foreground text-[#283637] flex items-center justify-center">
                              <Linkedin className="w-3 h-3" />
                              </div>
                              <span className="text-foreground">{company.linkedin}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right text-white/70 text-xs space-y-1">
                          <p>{company.website}</p>
                          <p>{company.email}</p>
                        </div>
                      </div>
                      <div className="flex justify-end mt-3">
                        <Button
                          size="sm"
                          className="bg-black/10 hover:bg-black/20 text-white text-xs rounded-2xl backdrop-blur-sm border border-white/10 shadow">
                          View Executives <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Right: Executives Panel */}
            <div
              className={`flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-[400px] opacity-100' : 'w-0 opacity-0 pointer-events-none'
                }`}
            >
              <Card
                className={`bg-[#222B2C] border-[#3A3A3A] p-5 h-full transition-all duration-300 ease-in-out ${isSidebarOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-6'
                  }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-4 mr-2 rounded-full bg-black/10 hover:bg-black/20 text-white flex items-center justify-center">
                    <Users className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-medium text-foreground">Executives</h3>
                  </div>
                  <Button variant="link" className="h-auto p-0 text-xs text-foreground/60 hover:text-foreground/80">
                    View All <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>

                <div className="space-y-3">
                  {selectedCompany ? (
                    selectedCompany.executives.map((exec, index) => (
                      <div
                        key={index}
                        className="p-3 rounded-lg bg-gradient-to-b from-[#2d4041] to-[#283637]  hover:bg-[#4A4A4A]/40 transition-smooth border-l-4 border-primary/50"
                      >
                        <p className="text-sm font-medium text-foreground mb-0.5">{exec.name} </p>
                        <p className="text-xs text-muted-foreground/60 mb-1">{exec.role} | {exec.email}</p>
                        <div className="mt-2 flex justify-end">
                          <Button size="icon" variant="ghost" className="w-6 h-6 rounded-full hover:bg-[#5A5A5A]/50">
                            <Linkedin className="w-3.5 h-3.5 text-primary" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground/60">Select a company to view its executives.</p>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CompanyDetail;
