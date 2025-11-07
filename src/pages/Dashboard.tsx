import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { TopNav } from '@/components/TopNav';
import { List, Edit, Sparkles, Send, Bell, ArrowRight, TrendingUp, Phone, Mail, Calendar, Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const Dashboard = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen w-full bg-empa-gradient flex">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col w-full">
          <TopNav />
          
          <main className="flex-1 p-6 overflow-auto">
            <div className="max-w-[1600px] mx-auto grid grid-cols-12 gap-6">
              {/* Left Section - Greeting */}
              <div className="col-span-12 lg:col-span-5">
                <Card className="p-8 bg-card/50 backdrop-blur-sm border-border/50 card-glow h-[400px] flex flex-col justify-center relative overflow-hidden">
                  {/* Decorative icons */}
                  <div className="absolute top-6 left-6 flex gap-3">
                    <Button size="icon" variant="ghost" className="bg-muted/30 rounded-xl">
                      <List className="w-5 h-5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="bg-muted/30 rounded-xl">
                      <Edit className="w-5 h-5" />
                    </Button>
                  </div>

                  {/* Glowing orb effect */}
                  <div className="absolute bottom-10 left-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl" />
                  
                  <div className="relative z-10">
                    <h1 className="text-4xl font-bold mb-3">
                      Good Morning, Zubair!
                    </h1>
                    <p className="text-xl text-muted-foreground">
                      How can I assist You?
                    </p>
                  </div>

                  {/* AI Assistant Input */}
                  <div className="absolute bottom-6 left-6 right-6">
                    <div className="flex items-center gap-2 bg-muted/30 backdrop-blur-sm rounded-2xl px-4 py-3 border border-border/50">
                      <Sparkles className="w-5 h-5 text-primary" />
                      <Input 
                        placeholder="Ask CSOA Assistant"
                        className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                      />
                      <Button size="icon" className="rounded-xl bg-primary hover:bg-primary/90">
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Right Section - Stats & Widgets */}
              <div className="col-span-12 lg:col-span-7 space-y-6">
                {/* Campaign Stats */}
                <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50 card-glow">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Total Campaigns</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-primary/20 text-primary border-0">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          +3.4%
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground mb-1">Campaigns</p>
                      <p className="text-lg font-semibold">200</p>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <h2 className="text-4xl font-bold">220,342.76</h2>
                  </div>

                  {/* Mini Chart Visualization */}
                  <div className="h-20 flex items-end gap-1">
                    {[40, 65, 45, 70, 55, 80, 60, 75, 50, 85, 70, 90].map((height, i) => (
                      <div 
                        key={i} 
                        className="flex-1 bg-gradient-primary rounded-t opacity-60 transition-all hover:opacity-100"
                        style={{ height: `${height}%` }}
                      />
                    ))}
                  </div>
                </Card>

                <div className="grid grid-cols-2 gap-6">
                  {/* Communication Hub */}
                  <Card className="p-5 bg-card/50 backdrop-blur-sm border-border/50 card-glow">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Target className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold">Communication Hub</h3>
                      </div>
                      <Button size="icon" variant="ghost" className="w-8 h-8 rounded-full">
                        <Bell className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="space-y-1 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Recents</span>
                        <Button variant="link" className="h-auto p-0 text-xs">View All</Button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/20 hover:bg-muted/30 transition-smooth">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-primary/20 text-primary text-xs">SJ</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">Call with Sarah Johnson</p>
                          <p className="text-xs text-muted-foreground">3m 45s</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/20 hover:bg-muted/30 transition-smooth">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-secondary/20 text-secondary text-xs">ME</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">Email from Mark Evans</p>
                          <p className="text-xs text-muted-foreground">9:12 AM</p>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Proposals */}
                  <Card className="p-5 bg-card/50 backdrop-blur-sm border-border/50 card-glow">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold">Proposals To Send</h3>
                      <Button variant="link" className="h-auto p-0 text-xs">
                        View All <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>

                    <div className="space-y-3">
                      <div className="p-3 rounded-lg bg-muted/20 hover:bg-muted/30 transition-smooth">
                        <p className="text-sm font-medium mb-1">Send Proposal to ABC Corp</p>
                        <p className="text-xs text-muted-foreground mb-2">Website Redesign</p>
                        <Badge variant="secondary" className="bg-primary/20 text-primary text-xs border-0">
                          Sent ✓
                        </Badge>
                      </div>

                      <div className="p-3 rounded-lg bg-muted/20 hover:bg-muted/30 transition-smooth">
                        <p className="text-sm font-medium mb-1">Prepare Deck for Delta Group</p>
                        <p className="text-xs text-muted-foreground mb-2">Branding Presentation</p>
                        <Badge variant="secondary" className="bg-destructive/20 text-destructive text-xs border-0">
                          Pending
                        </Badge>
                      </div>
                    </div>
                  </Card>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {/* Top Leads */}
                  <Card className="p-5 bg-card/50 backdrop-blur-sm border-border/50 card-glow">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Target className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold">Top Leads</h3>
                      </div>
                      <Button variant="link" className="h-auto p-0 text-xs">
                        View All <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {[
                        { name: 'Sarah Malik', score: 92 },
                        { name: 'John Doe', score: 85 },
                        { name: 'Emily Chen', score: 78 },
                      ].map((lead) => (
                        <div key={lead.name} className="flex items-center justify-between p-2 rounded-lg bg-muted/20">
                          <span className="text-sm font-medium">{lead.name}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-primary rounded-full"
                                style={{ width: `${lead.score}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">Score: {lead.score}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Calendar */}
                  <Card className="p-5 bg-card/50 backdrop-blur-sm border-border/50 card-glow">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold">Calendar</h3>
                      </div>
                      <Button variant="link" className="h-auto p-0 text-xs">
                        View All <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Today</p>
                        <div className="flex items-start gap-3 p-2 rounded-lg bg-muted/20">
                          <div className="w-1 h-12 bg-primary rounded-full" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">Meeting with Sarah Malik</p>
                            <div className="flex items-center gap-1 mt-1">
                              <Avatar className="w-5 h-5">
                                <AvatarFallback className="bg-primary/20 text-primary text-[10px]">SM</AvatarFallback>
                              </Avatar>
                              <span className="text-xs text-muted-foreground">10:00 AM</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Tomorrow</p>
                        <div className="flex items-start gap-3 p-2 rounded-lg bg-muted/20">
                          <div className="w-1 h-12 bg-secondary rounded-full" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">Meeting with Sarah Malik</p>
                            <span className="text-xs text-muted-foreground">2:00 PM</span>
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
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
