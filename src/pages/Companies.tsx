import { useState } from 'react';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Download, Plus, Trash2, MoreVertical, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const companiesData = [
  {
    id: 1,
    name: 'Tamimi-PEB',
    email: 'tamimi.peb@yopmail.com',
    accountType: 'Free',
    isVerified: true,
    joinedDate: '17/10/2025',
    lastLogin: '2025-10-18 06:32:51',
  },
  {
    id: 2,
    name: 'Tamimi-PEB',
    email: 'tamimi.peb@yopmail.com',
    accountType: 'Free',
    isVerified: true,
    joinedDate: '17/10/2025',
    lastLogin: '2025-10-18 06:32:51',
  },
  {
    id: 3,
    name: 'Tamimi-PEB',
    email: 'tamimi.peb@yopmail.com',
    accountType: 'Free',
    isVerified: true,
    joinedDate: '17/10/2025',
    lastLogin: '2025-10-18 06:32:51',
  },
  {
    id: 4,
    name: 'Tamimi-PEB',
    email: 'tamimi.peb@yopmail.com',
    accountType: 'Free',
    isVerified: true,
    joinedDate: '17/10/2025',
    lastLogin: '2025-10-18 06:32:51',
  },
  {
    id: 5,
    name: 'Tamimi-PEB',
    email: 'tamimi.peb@yopmail.com',
    accountType: 'Free',
    isVerified: true,
    joinedDate: '17/10/2025',
    lastLogin: '2025-10-18 06:32:51',
  },
];

const Companies = () => {
  const [activeTab, setActiveTab] = useState<'companies' | 'leads'>('companies');
  const navigate = useNavigate();

  const handleRowClick = (companyId: number) => {
    navigate(`/dashboard/companies/${companyId}`);
  };

  return (
    <div className="min-h-screen w-full bg-[#1A1A1A] flex flex-col overflow-x-hidden">
      <DashboardHeader />

      <main className="flex-1 p-6 bg-[#1A1A1A] mt-20">
        <div className="max-w-[1600px] mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-4xl font-semibold text-foreground">Companies</h1>
            
            <div className="flex items-center gap-3">
              <Button className="bg-[#3A3A3A] hover:bg-[#4A4A4A] text-foreground border-0 rounded-xl">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button className="bg-[#3A3A3A] hover:bg-[#4A4A4A] text-foreground border-0 rounded-xl">
                <Plus className="w-4 h-4 mr-2" />
                Create Company
              </Button>
            </div>
          </div>

          {/* Table Card */}
          <div className="bg-[#2A2A2A] rounded-2xl border border-[#3A3A3A] overflow-hidden">
            {/* Search and Filters */}
            <div className="p-6 flex items-center justify-between border-b border-[#3A3A3A]">
              <div className="relative w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                <Input 
                  placeholder="Search Companies"
                  className="pl-10 bg-[#1A1A1A] border-[#3A3A3A] text-foreground placeholder:text-muted-foreground/50"
                />
              </div>
              
              <div className="flex items-center gap-3">
                <Button variant="ghost" className="bg-[#3A3A3A]/60 hover:bg-[#4A4A4A]/50 text-foreground rounded-lg">
                  Verified
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
                <Button variant="ghost" className="bg-[#3A3A3A]/60 hover:bg-[#4A4A4A]/50 text-foreground rounded-lg">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Show Trash
                </Button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#3A3A3A]">
                    <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground/70">Company Name</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground/70">Email</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground/70">Account Type</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground/70">Is Verified</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground/70">Joined Date</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground/70">Last Login</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground/70">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {companiesData.map((company) => (
                    <tr 
                      key={company.id}
                      onClick={() => handleRowClick(company.id)}
                      className="border-b border-[#3A3A3A] hover:bg-[#3A3A3A]/30 transition-smooth cursor-pointer"
                    >
                      <td className="px-6 py-4 text-sm text-foreground">{company.name}</td>
                      <td className="px-6 py-4 text-sm text-foreground">{company.email}</td>
                      <td className="px-6 py-4 text-sm text-foreground">{company.accountType}</td>
                      <td className="px-6 py-4">
                        <Badge className="bg-[#3A3A3A] text-foreground border border-[#4A4A4A] text-xs">
                          ✓ Verified
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground">{company.joinedDate}</td>
                      <td className="px-6 py-4 text-sm text-foreground">{company.lastLogin}</td>
                      <td className="px-6 py-4">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="hover:bg-[#4A4A4A]/50"
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                        >
                          <MoreVertical className="w-4 h-4 text-foreground/70" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Companies;
