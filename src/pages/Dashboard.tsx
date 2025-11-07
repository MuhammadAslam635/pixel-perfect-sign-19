import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { TopNav } from '@/components/TopNav';
import { List, Edit, Sparkles, Send, Bell, ArrowRight, TrendingUp, Phone, Mail, Calendar, Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const Dashboard = () => {
  return (
    <div className="min-h-screen w-full bg-[#2A2A2A] flex flex-col">
      <TopNav />
      
      <main className="flex-1 flex overflow-hidden bg-[#2A2A2A]">
        <div className="w-full max-w-[1600px] mx-auto flex gap-6 p-6">
          {/* Left Section - Fixed/Sticky */}
          <div className="w-[500px] flex-shrink-0">
            <Card className="p-8 bg-[#3A3A3A]/60 backdrop-blur-sm border-[#4A4A4A]/40 h-full flex flex-col justify-center relative overflow-hidden shadow-lg">
                  {/* Decorative icons */}
                  <div className="absolute top-6 left-6 flex gap-3">
                    <Button size="icon" variant="ghost" className="bg-[#4A4A4A]/50 rounded-xl hover:bg-[#5A5A5A]/50">
                      <List className="w-5 h-5 text-foreground/70" />
                    </Button>
                    <Button size="icon" variant="ghost" className="bg-[#4A4A4A]/50 rounded-xl hover:bg-[#5A5A5A]/50">
                      <Edit className="w-5 h-5 text-foreground/70" />
                    </Button>
                  </div>
                  
                  <div className="relative z-10 text-center">
                    <h1 className="text-[2.5rem] font-semibold mb-2 text-foreground leading-tight">
                      Good Morning, Zubair!
                    </h1>
                    <p className="text-xl text-muted-foreground/80 font-normal">
                      How can I assist You?
                    </p>
                  </div>

                  {/* AI Assistant Input */}
                  <div className="absolute bottom-6 left-6 right-6">
                    <div className="flex items-center gap-3 bg-[#3A3A3A]/80 backdrop-blur-sm rounded-2xl px-4 py-3 border border-[#4A4A4A]/50">
                      <Sparkles className="w-5 h-5 text-primary flex-shrink-0" />
                      <Input 
                        placeholder="Ask CSOA Assistant"
                        className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/50"
                      />
                      <Button size="icon" variant="ghost" className="rounded-xl bg-[#4A4A4A]/50 hover:bg-[#5A5A5A]/50 flex-shrink-0">
                        <Send className="w-4 h-4 text-foreground/70" />
                      </Button>
                      <Button size="icon" className="rounded-xl bg-primary hover:bg-primary/90 flex-shrink-0">
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
          </div>

          {/* Right Section - Scrollable Cards */}
          <div className="flex-1 overflow-y-auto scrollbar-hide space-y-6 pr-2">
                {/* Campaign Stats */}
                <Card className="p-6 bg-[#3A3A3A]/60 backdrop-blur-sm border-[#4A4A4A]/40 shadow-lg">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground/70 mb-2">Total Campaigns</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-[#4A4A4A]/50 text-foreground/80 border-0 text-xs px-2 py-0.5">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          +3.4%
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground/70 mb-1">Campaigns</p>
                      <p className="text-base font-semibold text-foreground">200</p>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <h2 className="text-5xl font-bold text-foreground">220,342.76</h2>
                  </div>

                  {/* Mini Chart Visualization with gradient */}
                  <div className="h-24 relative rounded-lg overflow-hidden bg-gradient-chart p-4">
                    <svg viewBox="0 0 400 80" className="w-full h-full" preserveAspectRatio="none">
                      <path
                        d="M0,60 L30,45 L60,55 L90,35 L120,50 L150,30 L180,45 L210,25 L240,40 L270,20 L300,35 L330,15 L360,30 L400,20"
                        fill="none"
                        stroke="hsl(183 34% 56%)"
                        strokeWidth="3"
                        className="drop-shadow-lg"
                      />
                    </svg>
                  </div>
                </Card>

                <div className="grid grid-cols-2 gap-6">
                  {/* Communication Hub */}
                  <Card className="p-5 bg-[#3A3A3A]/60 backdrop-blur-sm border-[#4A4A4A]/40 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-foreground/50" />
                        <h3 className="font-medium text-sm text-foreground">Communication Hub</h3>
                      </div>
                      <Button size="icon" variant="ghost" className="w-8 h-8 rounded-full bg-[#4A4A4A]/30 hover:bg-[#5A5A5A]/40">
                        <Bell className="w-4 h-4 text-foreground/60" />
                      </Button>
                    </div>

                    <div className="space-y-1 mb-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground/70">Recents</span>
                        <Button variant="link" className="h-auto p-0 text-xs text-foreground/60 hover:text-foreground/80">View All</Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-[#4A4A4A]/40 hover:bg-[#5A5A5A]/40 transition-smooth">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-primary/20 text-primary text-xs">SJ</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-normal text-foreground truncate">Call with Sarah Johnson</p>
                          <p className="text-xs text-muted-foreground/60">3m 45s</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 rounded-lg bg-[#4A4A4A]/40 hover:bg-[#5A5A5A]/40 transition-smooth">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-secondary/20 text-secondary text-xs">ME</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-normal text-foreground truncate">Email from Mark Evans</p>
                          <p className="text-xs text-muted-foreground/60">9:12 AM</p>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Proposals */}
                  <Card className="p-5 bg-[#3A3A3A]/60 backdrop-blur-sm border-[#4A4A4A]/40 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium text-sm text-foreground">Proposals To Send</h3>
                      <Button variant="link" className="h-auto p-0 text-xs text-foreground/60 hover:text-foreground/80">
                        View All <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <div className="p-3 rounded-lg bg-[#4A4A4A]/40 hover:bg-[#5A5A5A]/40 transition-smooth">
                        <p className="text-sm font-normal text-foreground mb-1">Send Proposal to ABC Corp</p>
                        <p className="text-xs text-muted-foreground/60 mb-2">Website Redesign</p>
                        <Badge className="bg-success/20 text-success hover:bg-success/30 text-xs border-0 font-normal">
                          Sent ✓
                        </Badge>
                      </div>

                      <div className="p-3 rounded-lg bg-[#4A4A4A]/40 hover:bg-[#5A5A5A]/40 transition-smooth">
                        <p className="text-sm font-normal text-foreground mb-1">Prepare Deck for Delta Group</p>
                        <p className="text-xs text-muted-foreground/60 mb-2">Branding Presentation</p>
                        <Badge className="bg-destructive/20 text-destructive hover:bg-destructive/30 text-xs border-0 font-normal">
                          Pending
                        </Badge>
                      </div>
                    </div>
                  </Card>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {/* Top Leads */}
                  <Card className="p-5 bg-[#3A3A3A]/60 backdrop-blur-sm border-[#4A4A4A]/40 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-foreground/50" />
                        <h3 className="font-medium text-sm text-foreground">Top Leads</h3>
                      </div>
                      <Button variant="link" className="h-auto p-0 text-xs text-foreground/60 hover:text-foreground/80">
                        View All <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {[
                        { name: 'Sarah Malik', score: 92 },
                        { name: 'John Doe', score: 85 },
                        { name: 'Emily Chen', score: 78 },
                      ].map((lead) => (
                        <div key={lead.name} className="flex items-center justify-between p-3 rounded-lg bg-[#4A4A4A]/40">
                          <span className="text-sm font-normal text-foreground">{lead.name}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-[#2A2A2A] rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-primary rounded-full"
                                style={{ width: `${lead.score}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground/60">Score: {lead.score}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Calendar */}
                  <Card className="p-5 bg-[#3A3A3A]/60 backdrop-blur-sm border-[#4A4A4A]/40 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-foreground/50" />
                        <h3 className="font-medium text-sm text-foreground">Calendar</h3>
                      </div>
                      <Button variant="link" className="h-auto p-0 text-xs text-foreground/60 hover:text-foreground/80">
                        View All <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-muted-foreground/70 mb-2">Today</p>
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-[#4A4A4A]/40">
                          <div className="w-1 h-12 bg-primary rounded-full flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-normal text-foreground">Meeting with Sarah Malik</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Avatar className="w-5 h-5">
                                <AvatarFallback className="bg-primary/20 text-primary text-[10px]">SM</AvatarFallback>
                              </Avatar>
                              <span className="text-xs text-muted-foreground/60">10:00 AM</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground/70 mb-2">Tomorrow</p>
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-[#4A4A4A]/40">
                          <div className="w-1 h-12 bg-secondary rounded-full flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-normal text-foreground">Meeting with Sarah Malik</p>
                            <span className="text-xs text-muted-foreground/60 mt-1 block">2:00 PM</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
