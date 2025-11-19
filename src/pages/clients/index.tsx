import { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { MessageSquare, Users } from 'lucide-react';
import ClientsTable from './components/ClientsTable';
import ProspectsTable from './components/ProspectsTable';
import CustomerSupportQueriesTable from './components/CustomerSupportQueriesTable';

const ClientsPage = () => {
  const [activeTab, setActiveTab] = useState('prospects');

  return (
    <DashboardLayout>
      <main className="relative px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-[66px] pt-24 sm:pt-28 lg:pt-32 pb-8 flex flex-col gap-6 text-white flex-1 overflow-y-auto">
        <div>
          <h1 className="text-3xl font-bold text-white">Clients & Prospects</h1>
          <p className="text-gray-400 mt-2">
            View and manage your clients, prospects, and customer support sessions
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Sidebar Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            orientation="vertical"
            className="flex flex-col lg:flex-row w-full"
          >
            <div className="w-full lg:w-auto p-4 rounded-2xl border border-[#FFFFFF0D] shadow-inner flex flex-col gap-3 max-h-[60vh]"
              style={{
                background: 'linear-gradient(173.83deg, rgba(255, 255, 255, 0.08) 4.82%, rgba(255, 255, 255, 0.00002) 38.08%, rgba(255, 255, 255, 0.00002) 56.68%, rgba(255, 255, 255, 0.02) 95.1%)'
              }}
            >
              <TabsList className="flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible items-start gap-3 bg-transparent border-0 p-0">
                <TabsTrigger
                  value="prospects"
                  className="flex !justify-start whitespace-nowrap lg:w-full gap-2 py-3 px-4 rounded-full text-gray-300 font-medium
                            data-[state=active]:text-white
                            data-[state=active]:bg-white/5
                            data-[state=active]:shadow-[0px_3.43px_3.43px_0px_#FFFFFF29_inset,0px_-3.43px_3.43px_0px_#FFFFFF29_inset]
                            transition-all duration-300"
                >
                  <Users size={18} />
                  <span>Prospects</span>
                </TabsTrigger>

                <TabsTrigger
                  value="sessions"
                  className="flex !justify-start whitespace-nowrap lg:w-full gap-2 py-3 px-4 rounded-full text-gray-300 font-medium
                            data-[state=active]:text-white
                            data-[state=active]:bg-white/5
                            data-[state=active]:shadow-[0px_3.43px_3.43px_0px_#FFFFFF29_inset,0px_-3.43px_3.43px_0px_#FFFFFF29_inset]
                            transition-all duration-300"
                >
                  <MessageSquare size={18} />
                  <span>Customer Support Sessions</span>
                </TabsTrigger>

                <TabsTrigger
                  value="queries"
                  className="flex !justify-start whitespace-nowrap lg:w-full gap-2 py-3 px-4 rounded-full text-gray-300 font-medium
                            data-[state=active]:text-white
                            data-[state=active]:bg-white/5
                            data-[state=active]:shadow-[0px_3.43px_3.43px_0px_#FFFFFF29_inset,0px_-3.43px_3.43px_0px_#FFFFFF29_inset]
                            transition-all duration-300"
                >
                  <MessageSquare size={18} />
                  <span>Customer Support Queries</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Tab Content Area */}
            <div className="flex-1 lg:ml-4">
              <TabsContent value="prospects" className="mt-0">
                <ProspectsTable />
              </TabsContent>

              <TabsContent value="sessions" className="mt-0">
                <ClientsTable viewType="sessions" />
              </TabsContent>

              <TabsContent value="queries" className="mt-0">
                <CustomerSupportQueriesTable />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </main>
    </DashboardLayout>
  );
};

export default ClientsPage;

