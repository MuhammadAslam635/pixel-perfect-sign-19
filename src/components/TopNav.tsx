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
  { icon: Users, label: 'Team', url: '/dashboard/team' },
  { icon: Rocket, label: 'Projects', url: '/dashboard/projects' },
  { icon: Car, label: 'Fleet', url: '/dashboard/fleet' },
  { icon: Map, label: 'Map', url: '/dashboard/map' },
  { icon: Settings, label: 'Settings', url: '/dashboard/settings' },
];

export function TopNav() {
  return (
    <header className="h-16 border-b border-border/50 bg-card/30 backdrop-blur-sm flex items-center px-6 gap-4">
      <Logo />
      
      <nav className="flex items-center gap-2 flex-1">
        {navItems.map((item) => (
          <NavLink
            key={item.url}
            to={item.url}
            end
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-muted/50 transition-smooth text-muted-foreground"
            activeClassName="bg-primary/20 text-primary"
          >
            <item.icon className="w-5 h-5" />
          </NavLink>
        ))}
      </nav>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
        </Button>
        
        <div className="flex items-center gap-3 bg-muted/20 rounded-full pl-3 pr-4 py-1.5">
          <Avatar className="w-8 h-8">
            <AvatarImage src="" />
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">ZK</AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium">Zubair Khan</span>
        </div>
      </div>
    </header>
  );
}
