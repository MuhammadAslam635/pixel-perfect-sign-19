import { Home, BarChart3, Target, MessageCircle, Calendar, FileText, Users, Rocket, Car, Map, Settings } from 'lucide-react';
import Logo from './Logo';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Bell } from 'lucide-react';
import { NavLink } from '@/components/NavLink';

const navItems = [
  { icon: Home, label: 'Home', url: '/dashboard' },
  { icon: BarChart3, label: 'Analytics', url: '/dashboard/analytics' },
  { icon: Target, label: 'Goals', url: '/dashboard/goals' },
  { icon: MessageCircle, label: 'Messages', url: '/dashboard/messages' },
  { icon: Calendar, label: 'Calendar', url: '/dashboard/calendar' },
  { icon: FileText, label: 'Files', url: '/dashboard/files' },
  { icon: Users, label: 'Team', url: '/dashboard/companies' },
  { icon: Rocket, label: 'Projects', url: '/dashboard/projects' },
  { icon: Car, label: 'Fleet', url: '/dashboard/fleet' },
  { icon: Map, label: 'Map', url: '/dashboard/map' },
  { icon: Settings, label: 'Settings', url: '/dashboard/settings' },
];

export function TopNav() {
  return (
    <header className="h-16 bg-[#2A2A2A] backdrop-blur-sm flex items-center px-6 gap-4">
      <Logo />
      
      <nav className="flex items-center justify-center gap-2 flex-1">
        {navItems.map((item) => (
          <NavLink
            key={item.url}
            to={item.url}
            end
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#3A3A3A]/60 border border-[#4A4A4A]/40 hover:bg-[#4A4A4A]/50 transition-smooth text-muted-foreground/70 shadow-sm"
            activeClassName="bg-[#5B8FA9] text-foreground border-[#5B8FA9]"
          >
            <item.icon className="w-4 h-4" />
            <span className="text-sm font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="flex items-center gap-3 bg-[#3A3A3A]/60 rounded-full pl-4 pr-4 py-2 border border-[#4A4A4A]/40">
        <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-[#4A4A4A]/50 w-9 h-9">
          <Bell className="w-5 h-5 text-muted-foreground/70" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
        </Button>
        
        <div className="w-px h-6 bg-[#4A4A4A]/50" />
        
        <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-smooth">
          <Avatar className="w-8 h-8">
            <AvatarImage src="" />
            <AvatarFallback className="bg-primary/20 text-primary text-sm">ZK</AvatarFallback>
          </Avatar>
          <span className="text-sm font-normal text-foreground">Zubair Khan</span>
        </div>
      </div>
    </header>
  );
}
