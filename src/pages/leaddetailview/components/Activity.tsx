import { FC, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const Activity: FC = () => {
  const [activeTab, setActiveTab] = useState("summary");

  return (
    <Card
      className="w-full flex-1 min-h-0 flex flex-col"
      style={{
        background:
          "linear-gradient(173.83deg, rgba(255, 255, 255, 0.08) 4.82%, rgba(255, 255, 255, 2e-05) 38.08%, rgba(255, 255, 255, 2e-05) 56.68%, rgba(255, 255, 255, 0.02) 95.1%)",
        boxShadow:
          "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
        borderRadius: "20px",
        border: "1px solid #FFFFFF1A",
      }}
    >
      <CardContent className="p-6 flex-1 min-h-0 overflow-y-auto scrollbar-hide">
        {/* Title */}
        <h2 className="text-xl font-bold text-white mb-6">Activity</h2>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="bg-transparent p-0 h-auto gap-4 border-none">
            <TabsTrigger
              value="summary"
              className="px-0 py-2 text-white/70 data-[state=active]:text-white data-[state=active]:bg-transparent data-[state=active]:shadow-none border-none rounded-none data-[state=active]:border-b-2 data-[state=active]:border-white font-medium"
            >
              Summary
            </TabsTrigger>
            <TabsTrigger
              value="calendar"
              className="px-0 py-2 text-white/70 data-[state=active]:text-white data-[state=active]:bg-transparent data-[state=active]:shadow-none border-none rounded-none data-[state=active]:border-b-2 data-[state=active]:border-white font-medium"
            >
              Calendar
            </TabsTrigger>
            <TabsTrigger
              value="campaigns"
              className="px-0 py-2 text-white/70 data-[state=active]:text-white data-[state=active]:bg-transparent data-[state=active]:shadow-none border-none rounded-none data-[state=active]:border-b-2 data-[state=active]:border-white font-medium"
            >
              Campaigns
            </TabsTrigger>
          </TabsList>

          {/* Summary Tab Content */}
          <TabsContent value="summary" className="mt-6">
            <div className="flex flex-col items-center">
              {/* Circular Progress Indicator */}
              <div className="relative w-48 h-48 mb-4">
                <svg
                  className="w-full h-full transform -rotate-90"
                  viewBox="0 0 100 100"
                >
                  {/* Background circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="#1a1a1a"
                    strokeWidth="8"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="url(#gradient)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 45}`}
                    strokeDashoffset={`${2 * Math.PI * 45 * (1 - 0.65)}`}
                  />
                  {/* Gradient definition */}
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
                {/* Percentage text */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-4xl font-bold text-white">65%</span>
                </div>
              </div>

              {/* Text below circle */}
              <p className="text-white text-center mb-8">Lorem Ipsum lorem</p>

              {/* AI Summary Section */}
              <div
                className="w-full rounded-lg p-4"
                style={{
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  background: "rgba(255, 255, 255, 0.02)",
                }}
              >
                <h3 className="text-white font-bold mb-3">AI Summary</h3>
                <div className="text-white/70 text-sm space-y-2 leading-relaxed">
                  <p>
                    Lorem Ipsum is simply dummy text of the printing and
                    typesetting industry. Lorem Ipsum has been the industry's
                    standard dummy text ever since the 1500s, when an unknown
                    printer took a galley of type and scrambled it to make a
                    type specimen book.
                  </p>
                  <p>
                    It has survived not only five centuries, but also the leap
                    into electronic typesetting, remaining essentially
                    unchanged. It was popularised in the 1960s with the release
                    of Letraset sheets containing Lorem Ipsum passages.
                  </p>
                  <p>
                    More recently with desktop publishing software like Aldus
                    PageMaker including versions of Lorem Ipsum.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Calendar Tab Content */}
          <TabsContent value="calendar" className="mt-6">
            <div className="text-white/70 text-center py-8">
              Calendar content coming soon...
            </div>
          </TabsContent>

          {/* Campaigns Tab Content */}
          <TabsContent value="campaigns" className="mt-6">
            <div className="text-white/70 text-center py-8">
              Campaigns content coming soon...
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default Activity;
