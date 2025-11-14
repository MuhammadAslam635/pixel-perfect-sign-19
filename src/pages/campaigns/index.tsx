import { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Plus, Search, Calendar as CalendarIcon } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format } from 'date-fns';

const CampaignsPage = () => {
  const [date, setDate] = useState<Date>();
  return (
    <DashboardLayout>
      <main className="relative px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-[66px] pt-24 sm:pt-28 lg:pt-32 pb-8 flex flex-col gap-6 text-white flex-1 overflow-y-auto">
        {/* Top Stats Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          {/* Facebook Ads Card */}
          <div className="relative">
            {/* Gradient glow behind card - more spread out and diffused */}
            <div className="absolute -inset-4 lg:-inset-8 bg-gradient-to-r from-[#1877F2]/30 via-[#1877F2]/15 to-transparent blur-3xl opacity-60" />
            <Card
              className="relative border-[#FFFFFF4D] shadow-2xl"
              style={{
                background: 'linear-gradient(173.83deg, rgba(255, 255, 255, 0.08) 4.82%, rgba(255, 255, 255, 0.00002) 38.08%, rgba(255, 255, 255, 0.00002) 56.68%, rgba(255, 255, 255, 0.02) 95.1%)'
              }}
            >
              <CardContent className="p-4 sm:p-5 lg:p-6">
                <div className="flex items-center justify-between mb-4 sm:mb-5 lg:mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[#1877F2] rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-white">Facebook Ads</h3>
                  </div>
                  <Select defaultValue="last-month">
                    <SelectTrigger className="w-[130px] h-9 bg-[#252525] border-[#3a3a3a] text-gray-300 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                      <SelectItem value="last-7-days" className="text-gray-300 focus:text-white focus:bg-white/10">Last 7 Days</SelectItem>
                      <SelectItem value="last-week" className="text-gray-300 focus:text-white focus:bg-white/10">Last Week</SelectItem>
                      <SelectItem value="last-month" className="text-gray-300 focus:text-white focus:bg-white/10">Last Month</SelectItem>
                      <SelectItem value="last-3-months" className="text-gray-300 focus:text-white focus:bg-white/10">Last 3 Months</SelectItem>
                      <SelectItem value="last-year" className="text-gray-300 focus:text-white focus:bg-white/10">Last Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                  <div>
                    <div className="text-2xl sm:text-3xl font-bold text-white mb-0.5 sm:mb-1">1.2M</div>
                    <div className="text-xs text-gray-500 mb-1 sm:mb-1.5">Impressions</div>
                    <div className="text-xs font-medium text-green-500">↑ 12%</div>
                  </div>
                  <div>
                    <div className="text-2xl sm:text-3xl font-bold text-white mb-0.5 sm:mb-1">845K</div>
                    <div className="text-xs text-gray-500 mb-1 sm:mb-1.5">Reach</div>
                    <div className="text-xs font-medium text-green-500">↑ 8%</div>
                  </div>
                  <div>
                    <div className="text-2xl sm:text-3xl font-bold text-white mb-0.5 sm:mb-1">32.5K</div>
                    <div className="text-xs text-gray-500 mb-1 sm:mb-1.5">Clicks</div>
                    <div className="text-xs font-medium text-red-500">↓ 3%</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Google Ads Card */}
          <div className="relative">
            {/* Gradient glow behind card - more spread out and diffused */}
            <div className="absolute -inset-4 lg:-inset-8 bg-gradient-to-r from-[#4285F4]/25 via-[#34A853]/20 to-transparent blur-3xl opacity-60" />
            <Card
              className="relative border-[#FFFFFF4D] shadow-2xl"
              style={{
                background: 'linear-gradient(173.83deg, rgba(255, 255, 255, 0.08) 4.82%, rgba(255, 255, 255, 0.00002) 38.08%, rgba(255, 255, 255, 0.00002) 56.68%, rgba(255, 255, 255, 0.02) 95.1%)'
              }}
            >
              <CardContent className="p-4 sm:p-5 lg:p-6">
                <div className="flex items-center justify-between mb-4 sm:mb-5 lg:mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white rounded-lg flex items-center justify-center p-1.5 flex-shrink-0">
                      <svg className="w-full h-full" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-white">Google Ads</h3>
                  </div>
                  <Select defaultValue="last-month">
                    <SelectTrigger className="w-[130px] h-9 bg-[#252525] border-[#3a3a3a] text-gray-300 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                      <SelectItem value="last-7-days" className="text-gray-300 focus:text-white focus:bg-white/10">Last 7 Days</SelectItem>
                      <SelectItem value="last-week" className="text-gray-300 focus:text-white focus:bg-white/10">Last Week</SelectItem>
                      <SelectItem value="last-month" className="text-gray-300 focus:text-white focus:bg-white/10">Last Month</SelectItem>
                      <SelectItem value="last-3-months" className="text-gray-300 focus:text-white focus:bg-white/10">Last 3 Months</SelectItem>
                      <SelectItem value="last-year" className="text-gray-300 focus:text-white focus:bg-white/10">Last Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                  <div>
                    <div className="text-2xl sm:text-3xl font-bold text-white mb-0.5 sm:mb-1">980K</div>
                    <div className="text-xs text-gray-500 mb-1 sm:mb-1.5">Impressions</div>
                    <div className="text-xs font-medium text-green-500">↑ 15%</div>
                  </div>
                  <div>
                    <div className="text-2xl sm:text-3xl font-bold text-white mb-0.5 sm:mb-1">765K</div>
                    <div className="text-xs text-gray-500 mb-1 sm:mb-1.5">Reach</div>
                    <div className="text-xs font-medium text-green-500">↑ 10%</div>
                  </div>
                  <div>
                    <div className="text-2xl sm:text-3xl font-bold text-white mb-0.5 sm:mb-1">28.3K</div>
                    <div className="text-xs text-gray-500 mb-1 sm:mb-1.5">Clicks</div>
                    <div className="text-xs font-medium text-red-500">↓ 2%</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Campaigns Section */}
        <div className="flex flex-col">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <h2 className="text-xl sm:text-2xl font-bold text-white">Recent Campaigns</h2>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              {/* Platform Select Dropdown */}
              <div className="relative">
                <Select defaultValue="all">
                  <SelectTrigger
                    className="h-9 pl-10 pr-4 rounded-full border-0 text-gray-300 text-xs min-w-[140px]"
                    style={{
                      background: '#FFFFFF1A',
                      boxShadow: '0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset'
                    }}
                  >
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                      <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none">
                        <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                        <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                        <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                        <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </div>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a] rounded-xl">
                    <SelectItem value="all" className="text-gray-300 focus:text-white focus:bg-white/10">All Platforms</SelectItem>
                    <SelectItem value="facebook" className="text-gray-300 focus:text-white focus:bg-white/10">Facebook</SelectItem>
                    <SelectItem value="google" className="text-gray-300 focus:text-white focus:bg-white/10">Google</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date Input */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="relative h-9 pl-10 pr-4 rounded-full border-0 text-gray-400 hover:opacity-80 text-xs min-w-[140px] justify-start"
                    style={{
                      background: '#FFFFFF1A',
                      boxShadow: '0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset'
                    }}
                  >
                    <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <span>{date ? format(date, 'PPP') : 'Select Date'}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-[#1a1a1a] border-[#2a2a2a]" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    className="rounded-md border-0"
                    classNames={{
                      months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                      month: "space-y-4",
                      caption: "flex justify-center pt-1 relative items-center text-white",
                      caption_label: "text-sm font-medium",
                      nav: "space-x-1 flex items-center",
                      nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 text-white",
                      nav_button_previous: "absolute left-1",
                      nav_button_next: "absolute right-1",
                      table: "w-full border-collapse space-y-1",
                      head_row: "flex",
                      head_cell: "text-gray-500 rounded-md w-9 font-normal text-[0.8rem]",
                      row: "flex w-full mt-2",
                      cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                      day: "h-9 w-9 p-0 font-normal text-gray-300 hover:bg-white/10 hover:text-white rounded-md aria-selected:opacity-100",
                      day_range_end: "day-range-end",
                      day_selected: "bg-white/20 text-white hover:bg-white/30 hover:text-white focus:bg-white/20 focus:text-white",
                      day_today: "bg-accent text-accent-foreground",
                      day_outside: "day-outside text-gray-600 opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
                      day_disabled: "text-gray-600 opacity-50",
                      day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                      day_hidden: "invisible",
                    }}
                  />
                </PopoverContent>
              </Popover>

              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10" />
                <Input
                  type="text"
                  placeholder="Search campaigns..."
                  className="h-9 pl-10 pr-4 !rounded-full border-0 text-gray-300 placeholder:text-gray-500 text-xs min-w-[160px]"
                  style={{
                    background: '#FFFFFF1A',
                    boxShadow: '0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset'
                  }}
                />
              </div>

              {/* Create Campaign Button */}
              <Button
                size="sm"
                className="relative h-9 px-4 rounded-full border-0 text-white text-xs overflow-hidden"
                style={{
                  background: 'radial-gradient(circle at left, #66AFB7 0%, #5a9fa2 50%, #69B4B7 100%)',
                  boxShadow: '0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset'
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Campaign
              </Button>
            </div>
          </div>

          {/* Campaigns Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Campaign Card 1 */}
            <Card
              className="border-[#FFFFFF0D] hover:border-[#3a3a3a] transition-all duration-200"
              style={{
                background: 'linear-gradient(173.83deg, rgba(255, 255, 255, 0.08) 4.82%, rgba(255, 255, 255, 0.00002) 38.08%, rgba(255, 255, 255, 0.00002) 56.68%, rgba(255, 255, 255, 0.02) 95.1%)'
              }}
            >
              <CardContent className="p-4 sm:p-5 flex flex-col h-full">
                <div className="flex items-start justify-between mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 bg-[#1877F2] rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </div>
                  <div className="flex items-center gap-1.5 bg-[#252525] rounded-md px-2 py-1 flex-shrink-0">
                    <MapPin className="w-3 h-3 text-gray-500" />
                    <span className="text-xs text-gray-400">USA</span>
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-white mb-2 leading-tight">Marketing Switch CSS</h3>
                <p className="text-xs text-gray-500 mb-4 flex-grow line-clamp-2 leading-relaxed">Promote new CSS framework to developers and designers</p>
                <div className="flex items-center justify-between mt-auto pt-2">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Budget</div>
                    <div className="text-sm font-bold text-white">$1200</div>
                  </div>
                  <Button size="sm" variant="outline" className="bg-[#252525] border-[#333333] text-gray-300 hover:bg-[#2a2a2a] hover:text-white h-7 text-xs px-3 rounded-md">
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Campaign Card 2 */}
            <Card
              className="border-[#FFFFFF0D] hover:border-[#3a3a3a] transition-all duration-200"
              style={{
                background: 'linear-gradient(173.83deg, rgba(255, 255, 255, 0.08) 4.82%, rgba(255, 255, 255, 0.00002) 38.08%, rgba(255, 255, 255, 0.00002) 56.68%, rgba(255, 255, 255, 0.02) 95.1%)'
              }}
            >
              <CardContent className="p-4 sm:p-5 flex flex-col h-full">
                <div className="flex items-start justify-between mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 bg-white rounded-lg flex items-center justify-center p-1.5 flex-shrink-0">
                    <svg className="w-full h-full" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  </div>
                  <div className="flex items-center gap-1.5 bg-[#252525] rounded-md px-2 py-1 flex-shrink-0">
                    <MapPin className="w-3 h-3 text-gray-500" />
                    <span className="text-xs text-gray-400">UK</span>
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-white mb-2 leading-tight">Marketing Switch CSS</h3>
                <p className="text-xs text-gray-500 mb-4 flex-grow line-clamp-2 leading-relaxed">Target tech professionals with Google Search ads</p>
                <div className="flex items-center justify-between mt-auto pt-2">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Budget</div>
                    <div className="text-sm font-bold text-white">$1500</div>
                  </div>
                  <Button size="sm" variant="outline" className="bg-[#252525] border-[#333333] text-gray-300 hover:bg-[#2a2a2a] hover:text-white h-7 text-xs px-3 rounded-md">
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Campaign Card 3 - Combined Icons */}
            <Card
              className="border-[#FFFFFF0D] hover:border-[#3a3a3a] transition-all duration-200"
              style={{
                background: 'linear-gradient(173.83deg, rgba(255, 255, 255, 0.08) 4.82%, rgba(255, 255, 255, 0.00002) 38.08%, rgba(255, 255, 255, 0.00002) 56.68%, rgba(255, 255, 255, 0.02) 95.1%)'
              }}
            >
              <CardContent className="p-4 sm:p-5 flex flex-col h-full">
                <div className="flex items-start justify-between mb-3 sm:mb-4">
                  <div className="flex gap-1.5">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 bg-[#1877F2] rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    </div>
                    <div className="w-10 h-10 sm:w-11 sm:h-11 bg-white rounded-lg flex items-center justify-center p-1 flex-shrink-0">
                      <svg className="w-full h-full" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 bg-[#252525] rounded-md px-2 py-1 flex-shrink-0">
                    <MapPin className="w-3 h-3 text-gray-500" />
                    <span className="text-xs text-gray-400">Canada</span>
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-white mb-2 leading-tight">Holiday Season Campaign</h3>
                <p className="text-xs text-gray-500 mb-4 flex-grow line-clamp-2 leading-relaxed">Multi-platform holiday promotion across FB and Google</p>
                <div className="flex items-center justify-between mt-auto pt-2">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Budget</div>
                    <div className="text-sm font-bold text-white">$2500</div>
                  </div>
                  <Button size="sm" variant="outline" className="bg-[#252525] border-[#333333] text-gray-300 hover:bg-[#2a2a2a] hover:text-white h-7 text-xs px-3 rounded-md">
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Campaign Card 4 */}
            <Card
              className="border-[#FFFFFF0D] hover:border-[#3a3a3a] transition-all duration-200"
              style={{
                background: 'linear-gradient(173.83deg, rgba(255, 255, 255, 0.08) 4.82%, rgba(255, 255, 255, 0.00002) 38.08%, rgba(255, 255, 255, 0.00002) 56.68%, rgba(255, 255, 255, 0.02) 95.1%)'
              }}
            >
              <CardContent className="p-4 sm:p-5 flex flex-col h-full">
                <div className="flex items-start justify-between mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 bg-[#1877F2] rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </div>
                  <div className="flex items-center gap-1.5 bg-[#252525] rounded-md px-2 py-1 flex-shrink-0">
                    <MapPin className="w-3 h-3 text-gray-500" />
                    <span className="text-xs text-gray-400">Australia</span>
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-white mb-2 leading-tight">Summer Launch 2025</h3>
                <p className="text-xs text-gray-500 mb-4 flex-grow line-clamp-2 leading-relaxed">Summer product launch campaign targeting millennials</p>
                <div className="flex items-center justify-between mt-auto pt-2">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Budget</div>
                    <div className="text-sm font-bold text-white">$1800</div>
                  </div>
                  <Button size="sm" variant="outline" className="bg-[#252525] border-[#333333] text-gray-300 hover:bg-[#2a2a2a] hover:text-white h-7 text-xs px-3 rounded-md">
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Campaign Card 5 */}
            <Card
              className="border-[#FFFFFF0D] hover:border-[#3a3a3a] transition-all duration-200"
              style={{
                background: 'linear-gradient(173.83deg, rgba(255, 255, 255, 0.08) 4.82%, rgba(255, 255, 255, 0.00002) 38.08%, rgba(255, 255, 255, 0.00002) 56.68%, rgba(255, 255, 255, 0.02) 95.1%)'
              }}
            >
              <CardContent className="p-4 sm:p-5 flex flex-col h-full">
                <div className="flex items-start justify-between mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 bg-[#1877F2] rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </div>
                  <div className="flex items-center gap-1.5 bg-[#252525] rounded-md px-2 py-1 flex-shrink-0">
                    <MapPin className="w-3 h-3 text-gray-500" />
                    <span className="text-xs text-gray-400">Germany</span>
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-white mb-2 leading-tight">Product Retargeting</h3>
                <p className="text-xs text-gray-500 mb-4 flex-grow line-clamp-2 leading-relaxed">Retarget visitors who viewed but didn't purchase</p>
                <div className="flex items-center justify-between mt-auto pt-2">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Budget</div>
                    <div className="text-sm font-bold text-white">$950</div>
                  </div>
                  <Button size="sm" variant="outline" className="bg-[#252525] border-[#333333] text-gray-300 hover:bg-[#2a2a2a] hover:text-white h-7 text-xs px-3 rounded-md">
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Campaign Card 6 */}
            <Card
              className="border-[#FFFFFF0D] hover:border-[#3a3a3a] transition-all duration-200"
              style={{
                background: 'linear-gradient(173.83deg, rgba(255, 255, 255, 0.08) 4.82%, rgba(255, 255, 255, 0.00002) 38.08%, rgba(255, 255, 255, 0.00002) 56.68%, rgba(255, 255, 255, 0.02) 95.1%)'
              }}
            >
              <CardContent className="p-4 sm:p-5 flex flex-col h-full">
                <div className="flex items-start justify-between mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 bg-white rounded-lg flex items-center justify-center p-1.5 flex-shrink-0">
                    <svg className="w-full h-full" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  </div>
                  <div className="flex items-center gap-1.5 bg-[#252525] rounded-md px-2 py-1 flex-shrink-0">
                    <MapPin className="w-3 h-3 text-gray-500" />
                    <span className="text-xs text-gray-400">France</span>
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-white mb-2 leading-tight">Brand Awareness Q4</h3>
                <p className="text-xs text-gray-500 mb-4 flex-grow line-clamp-2 leading-relaxed">Q4 brand awareness push on Google Display Network</p>
                <div className="flex items-center justify-between mt-auto pt-2">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Budget</div>
                    <div className="text-sm font-bold text-white">$3200</div>
                  </div>
                  <Button size="sm" variant="outline" className="bg-[#252525] border-[#333333] text-gray-300 hover:bg-[#2a2a2a] hover:text-white h-7 text-xs px-3 rounded-md">
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Campaign Card 7 */}
            <Card
              className="border-[#FFFFFF0D] hover:border-[#3a3a3a] transition-all duration-200"
              style={{
                background: 'linear-gradient(173.83deg, rgba(255, 255, 255, 0.08) 4.82%, rgba(255, 255, 255, 0.00002) 38.08%, rgba(255, 255, 255, 0.00002) 56.68%, rgba(255, 255, 255, 0.02) 95.1%)'
              }}
            >
              <CardContent className="p-4 sm:p-5 flex flex-col h-full">
                <div className="flex items-start justify-between mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 bg-white rounded-lg flex items-center justify-center p-1.5 flex-shrink-0">
                    <svg className="w-full h-full" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  </div>
                  <div className="flex items-center gap-1.5 bg-[#252525] rounded-md px-2 py-1 flex-shrink-0">
                    <MapPin className="w-3 h-3 text-gray-500" />
                    <span className="text-xs text-gray-400">Spain</span>
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-white mb-2 leading-tight">Lead Generation</h3>
                <p className="text-xs text-gray-500 mb-4 flex-grow line-clamp-2 leading-relaxed">Generate quality leads through Google search campaigns</p>
                <div className="flex items-center justify-between mt-auto pt-2">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Budget</div>
                    <div className="text-sm font-bold text-white">$2100</div>
                  </div>
                  <Button size="sm" variant="outline" className="bg-[#252525] border-[#333333] text-gray-300 hover:bg-[#2a2a2a] hover:text-white h-7 text-xs px-3 rounded-md">
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Campaign Card 8 */}
            <Card
              className="border-[#FFFFFF0D] hover:border-[#3a3a3a] transition-all duration-200"
              style={{
                background: 'linear-gradient(173.83deg, rgba(255, 255, 255, 0.08) 4.82%, rgba(255, 255, 255, 0.00002) 38.08%, rgba(255, 255, 255, 0.00002) 56.68%, rgba(255, 255, 255, 0.02) 95.1%)'
              }}
            >
              <CardContent className="p-4 sm:p-5 flex flex-col h-full">
                <div className="flex items-start justify-between mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 bg-[#1877F2] rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </div>
                  <div className="flex items-center gap-1.5 bg-[#252525] rounded-md px-2 py-1 flex-shrink-0">
                    <MapPin className="w-3 h-3 text-gray-500" />
                    <span className="text-xs text-gray-400">Italy</span>
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-white mb-2 leading-tight">Black Friday Special</h3>
                <p className="text-xs text-gray-500 mb-4 flex-grow line-clamp-2 leading-relaxed">High-budget Black Friday sales campaign on Facebook</p>
                <div className="flex items-center justify-between mt-auto pt-2">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Budget</div>
                    <div className="text-sm font-bold text-white">$4500</div>
                  </div>
                  <Button size="sm" variant="outline" className="bg-[#252525] border-[#333333] text-gray-300 hover:bg-[#2a2a2a] hover:text-white h-7 text-xs px-3 rounded-md">
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
};

export default CampaignsPage;
