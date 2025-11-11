import { useState } from 'react';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
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
    description: 'Lorem ipsum is simply dummy text of the printing and typesetting industry. Lorem ipsum is simply dummy text of the printing and typesetting industry.',
    teamSize: '11-50 Team Members',
    linkedin: 'www.linkedin.com/cyberify/st',
    website: 'www.cyberify.co',
    email: 'info@cyberify.co',
  },
  {
    id: 2,
    name: 'Cyberify',
    type: 'AI Agency',
    description: 'Lorem ipsum is simply dummy text of the printing and typesetting industry. Lorem ipsum is simply dummy text of the printing and typesetting industry.',
    teamSize: '11-50 Team Members',
    linkedin: 'www.linkedin.com/cyberify/st',
    website: 'www.cyberify.co',
    email: 'info@cyberify.co',
  },
  {
    id: 3,
    name: 'Cyberify',
    type: 'AI Agency',
    description: 'Lorem ipsum is simply dummy text of the printing and typesetting industry. Lorem ipsum is simply dummy text of the printing and typesetting industry.',
    teamSize: '11-50 Team Members',
    linkedin: 'www.linkedin.com/cyberify/st',
    website: 'www.cyberify.co',
    email: 'info@cyberify.co',
  },
  {
    id: 4,
    name: 'Cyberify',
    type: 'AI Agency',
    description: 'Lorem ipsum is simply dummy text of the printing and typesetting industry. Lorem ipsum is simply dummy text of the printing and typesetting industry.',
    teamSize: '11-50 Team Members',
    linkedin: 'www.linkedin.com/cyberify/st',
    website: 'www.cyberify.co',
    email: 'info@cyberify.co',
  },
];

const executives = [
  { name: 'Naeem Bhatti', role: 'Founder', email: 'naeem@yopmail.com' },
  { name: 'Saad Naeem', role: 'CEO', email: 'saad@gmail.com' },
  { name: 'Zubair Khan', role: 'CPO + Fullstack', email: 'zubairp@gmail.com' },
  { name: 'Ashar Maqbool', role: 'COO + Fullstack', email: 'ashar@gmail.com' },
  { name: 'Hamza Rafique', role: 'Business Developer', email: 'hvmzaa@outlook.com' },
];

const statsCards = [
  { title: 'Total Companies', value: '512', icon: Building2, link: 'View All' },
  { title: 'Total leads', value: '8542', icon: Filter, link: 'View All' },
  { title: 'Total Outreach', value: '5236', icon: Users, link: 'View All' },
  { title: 'Total Response', value: '3256', icon: Users, link: 'View All' },
];

const CompanyDetail = () => {
  const [activeTab, setActiveTab] = useState<'companies' | 'leads'>('companies');
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-[#1A1A1A] flex flex-col overflow-x-hidden">
      <DashboardHeader />

      <main className="flex-1 p-6 bg-[#1A1A1A] mt-24 sm:mt-20">
        <div className="max-w-[1600px] mx-auto">
          {/* Tabs */}
          <div className="flex items-center gap-3 mb-6">
            <Button
              onClick={() => setActiveTab('companies')}
              className={`rounded-full px-6 py-2 ${
                activeTab === 'companies'
                  ? 'bg-[#4A4A4A] text-foreground'
                  : 'bg-[#2A2A2A] text-muted-foreground hover:bg-[#3A3A3A]'
              }`}
            >
              Companies
            </Button>
            <Button
              onClick={() => setActiveTab('leads')}
              className={`rounded-full px-6 py-2 ${
                activeTab === 'leads'
                  ? 'bg-[#4A4A4A] text-foreground'
                  : 'bg-[#2A2A2A] text-muted-foreground hover:bg-[#3A3A3A]'
              }`}
            >
              Leads
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {statsCards.map((stat) => (
              <Card key={stat.title} className="bg-[#2A2A2A] border-[#3A3A3A] p-6">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-muted-foreground/70">{stat.title}</p>
                  <Button variant="link" className="h-auto p-0 text-xs text-foreground/60 hover:text-foreground/80">
                    {stat.link} <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                    <stat.icon className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                </div>
              </Card>
            ))}
          </div>

          {/* Split View */}
          <div className="flex gap-6">
            {/* Left: Companies List */}
            <div className="flex-1">
              <h2 className="text-lg font-medium text-foreground mb-4">Companies</h2>
              <div className="space-y-3">
                {companiesData.map((company) => (
                  <Card 
                    key={company.id}
                    className="bg-[#2A2A2A] border-[#3A3A3A] p-4 hover:bg-[#3A3A3A]/50 transition-smooth cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-base font-medium text-foreground">{company.name}</h3>
                          <span className="text-sm text-muted-foreground/60">| {company.type}</span>
                        </div>
                        <p className="text-xs text-muted-foreground/60 mb-3 leading-relaxed">
                          {company.description}
                        </p>
                        <div className="flex items-center gap-4">
                          <Badge className="bg-[#3A3A3A] text-foreground border-0 text-xs font-normal">
                            {company.teamSize}
                          </Badge>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground/60">
                            <Linkedin className="w-3 h-3" />
                            <span>{company.linkedin}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right text-xs text-muted-foreground/60 space-y-1">
                        <p>{company.website}</p>
                        <p>{company.email}</p>
                      </div>
                    </div>
                    <div className="flex justify-end mt-3">
                      <Button size="sm" className="bg-[#3A3A3A] hover:bg-[#4A4A4A] text-foreground text-xs rounded-lg">
                        View Executives <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Right: Executives Panel */}
            <div className="w-[400px]">
              <Card className="bg-[#2A2A2A] border-[#3A3A3A] p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-foreground/70" />
                    <h3 className="text-base font-medium text-foreground">Executives</h3>
                  </div>
                  <Button variant="link" className="h-auto p-0 text-xs text-foreground/60 hover:text-foreground/80">
                    View All <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {executives.map((exec, index) => (
                    <div 
                      key={index}
                      className="p-3 rounded-lg bg-[#3A3A3A]/60 hover:bg-[#4A4A4A]/40 transition-smooth border-l-4 border-primary/50"
                    >
                      <p className="text-sm font-medium text-foreground mb-0.5">{exec.name}</p>
                      <p className="text-xs text-muted-foreground/60 mb-1">{exec.role}</p>
                      <p className="text-xs text-muted-foreground/50">{exec.email}</p>
                      <div className="mt-2 flex justify-end">
                        <Button size="icon" variant="ghost" className="w-6 h-6 rounded-full hover:bg-[#5A5A5A]/50">
                          <Linkedin className="w-3.5 h-3.5 text-primary" />
                        </Button>
                      </div>
                    </div>
                  ))}
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
