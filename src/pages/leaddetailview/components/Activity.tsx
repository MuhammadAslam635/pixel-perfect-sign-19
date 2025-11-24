import { FC, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const Activity: FC = () => {
  const [activeTab, setActiveTab] = useState("summary");
  const [currentDate, setCurrentDate] = useState(new Date(2025, 10, 1)); // November 2025

  // Dates with meetings - Nov 1 (already done), Nov 25-27 (available)
  const meetingDoneDates = [1];
  const availableMeetingDates = [25, 26, 27];

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    return firstDay.getDay();
  };

  const handlePrevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  const getCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days: (number | null)[] = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  return (
    <Card
      className="w-full flex-1 min-h-0 flex flex-col rounded-3xl"
      style={{
        background:
          "linear-gradient(173.83deg, rgba(255, 255, 255, 0.08) 4.82%, rgba(255, 255, 255, 2e-05) 38.08%, rgba(255, 255, 255, 2e-05) 56.68%, rgba(255, 255, 255, 0.02) 95.1%)",
        border: "1px solid #FFFFFF0D",
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
            <div className="space-y-6">
              {/* Calendar Widget */}
              <div
                className="rounded-lg p-6"
                style={{
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                }}
              >
                {/* Month Navigation */}
                <div className="flex items-center justify-between mb-6">
                  <button
                    onClick={handlePrevMonth}
                    className="text-white/70 hover:text-white transition-colors p-1"
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12.5 15L7.5 10L12.5 5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  <h3 className="text-white font-semibold text-lg">
                    {monthNames[currentDate.getMonth()]}{" "}
                    {currentDate.getFullYear()}
                  </h3>
                  <button
                    onClick={handleNextMonth}
                    className="text-white/70 hover:text-white transition-colors p-1"
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M7.5 15L12.5 10L7.5 5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>

                {/* Days of Week */}
                <div className="grid grid-cols-7 gap-2 mb-2">
                  {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map(
                    (day) => (
                      <div
                        key={day}
                        className="text-center text-white/50 text-xs font-medium py-2"
                      >
                        {day}
                      </div>
                    )
                  )}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-2">
                  {getCalendarDays().map((day, index) => {
                    if (day === null) {
                      return <div key={index} className="aspect-square" />;
                    }

                    const isMeetingDone =
                      currentDate.getMonth() === 10 &&
                      meetingDoneDates.includes(day);
                    const isAvailableMeeting =
                      currentDate.getMonth() === 10 &&
                      availableMeetingDates.includes(day);

                    return (
                      <div
                        key={index}
                        className={`aspect-square flex items-center justify-center relative ${
                          isMeetingDone || isAvailableMeeting
                            ? ""
                            : "text-white/70"
                        }`}
                      >
                        {isMeetingDone && (
                          <div
                            className="absolute inset-0 rounded-full"
                            style={{
                              background: "rgba(6, 182, 212, 0.3)",
                              border: "2px solid #06b6d4",
                            }}
                          />
                        )}
                        {isAvailableMeeting && (
                          <div
                            className="absolute inset-0 rounded-full"
                            style={{
                              background: "rgba(59, 130, 246, 0.3)",
                              border: "2px solid #3b82f6",
                            }}
                          />
                        )}
                        <span
                          className={`relative z-10 ${
                            isMeetingDone || isAvailableMeeting
                              ? "text-white font-medium"
                              : ""
                          }`}
                        >
                          {day}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Calendar Legend */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{
                      background: "rgba(6, 182, 212, 0.3)",
                      border: "2px solid #06b6d4",
                    }}
                  />
                  <span className="text-white/70 text-sm">
                    Already meeting done
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{
                      background: "rgba(59, 130, 246, 0.3)",
                      border: "2px solid #3b82f6",
                    }}
                  />
                  <span className="text-white/70 text-sm">
                    Available for meeting
                  </span>
                </div>
              </div>

              {/* Meeting Notes Section */}
              <div>
                <h3 className="text-white font-bold mb-4">Meeting Notes</h3>
                <div className="space-y-3">
                  {[1, 2, 3].map((index) => (
                    <div
                      key={index}
                      className="rounded-lg p-4"
                      style={{
                        background: "rgba(255, 255, 255, 0.03)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                      }}
                    >
                      <h4 className="text-white font-semibold mb-2">
                        Proposal for projects
                      </h4>
                      <p className="text-white/70 text-sm">
                        Lorem Ipsum is simply dummy text of the printing.
                      </p>
                    </div>
                  ))}
                </div>
              </div>
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
