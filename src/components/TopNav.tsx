import { LayoutGrid, BarChart3, Diamond, MessageCircle, Calendar, BookOpen, Users, Megaphone, Mail, Settings } from 'lucide-react';
import Logo from './Logo';
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Bell } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: LayoutGrid, label: 'Home', url: '/dashboard' },
  { icon: BarChart3, label: 'Analytics', url: '/dashboard/analytics' },
  { icon: Diamond, label: 'Premium', url: '/dashboard/premium' },
  { icon: Users, label: 'Team', url: '/dashboard/companies' },
  { icon: MessageCircle, label: 'Messages', url: '/dashboard/messages' },
  { icon: Calendar, label: 'Calendar', url: '/dashboard/calendar' },
  { icon: BookOpen, label: 'Docs', url: '/dashboard/docs' },
  { icon: Megaphone, label: 'Announcements', url: '/dashboard/announcements' },
  { icon: Mail, label: 'Inbox', url: '/dashboard/inbox' },
  { icon: Settings, label: 'Settings', url: '/dashboard/settings' },
];

export function TopNav() {
  const navRef = useRef<HTMLElement>(null);
  const location = useLocation();

  // Ensure the active item is visible/centered, especially on desktop widths
  useEffect(() => {
    const container = navRef.current;
    if (!container) return;
    const centerActive = () => {
      // Only center on desktop (lg and up); on small screens, keep scroll starting at left
      if (window.innerWidth < 1024) return;
      const active = container.querySelector('.is-active') as HTMLElement | null;
      if (active) {
        const offset = 12; // small padding from the left edge
        const targetLeft = active.offsetLeft - offset;
        container.scrollTo({ left: Math.max(0, targetLeft) });
      }
    };
    centerActive();
    window.addEventListener('resize', centerActive);
    return () => window.removeEventListener('resize', centerActive);
  }, [location.pathname]);
  return (
    <header className="bg-transparent flex items-center px-4 sm:px-6 md:px-10 py-3 sm:py-4 gap-3 sm:gap-6">
      <Logo />
      
      {/* Left-aligned on mobile, centered on desktop; horizontal scroll */}
      <nav ref={navRef} className="flex-1 min-w-0 w-full lg:w-[780px] pl-2 sm:pl-3 md:pl-4 pr-2 sm:pr-4 py-2 overflow-x-auto scrollbar-hide scroll-smooth overscroll-x-contain snap-x snap-mandatory flex items-center justify-start lg:justify-center gap-2 flex-nowrap">
        {navItems.map((item) => (
          <NavLink
            key={item.url}
            to={item.url}
            end
            className="group relative overflow-visible flex-none flex items-center justify-center w-10 h-10 rounded-full ring-1 ring-white/40 bg-white/5 transition-all text-white/85 shadow-[0_6px_16px_rgba(0,0,0,0.35)] hover:bg-[#2F2F2F]/60 hover:text-white hover:shadow-[0_16px_28px_rgba(0,0,0,0.35)] hover:z-10 px-0 gap-0 snap-start lg:snap-center before:content-[''] before:absolute before:inset-x-0 before:top-0 before:h-2/5 before:rounded-t-full before:bg-gradient-to-b before:from-white/15 before:to-transparent hover:before:from-white/25 hover:justify-start hover:w-auto hover:h-10 hover:px-2.5 hover:gap-2"
            activeClassName="relative z-10 flex-none rounded-full bg-[#2F2F2F]/60 text-white ring-1 ring-white/40 w-auto h-10 justify-start px-2.5 gap-2 is-active whitespace-nowrap overflow-visible shadow-[0_16px_28px_rgba(0,0,0,0.35)] before:content-[''] before:absolute before:inset-x-0 before:top-0 before:h-2/5 before:rounded-t-full before:bg-gradient-to-b before:from-white/25 before:to-transparent"
          >
            {({ isActive }) => (
              <>
                <item.icon className="w-[20px] h-[20px] flex-shrink-0" />
                <span
                  className={cn(
                    "text-xs sm:text-sm font-medium transition-all duration-200",
                    isActive
                      ? "inline opacity-100 visible ml-2 w-auto"
                      : "hidden group-hover:inline ml-2"
                )}
                >
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="relative flex items-center gap-2 sm:gap-3 bg-[#2F2F2F]/70 rounded-full pl-2 pr-2 py-1 sm:pl-4 sm:pr-4 sm:py-2 ring-1 ring-white/30 glass-bulb pill-glow-cyan-blue pill-glow-strong shadow-[0_6px_16px_rgba(0,0,0,0.35)]">
        <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-[#4A4A4A]/50 w-8 h-8 sm:w-9 sm:h-9">
          <Bell className="w-[23px] h-[23px] text-muted-foreground/70" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
        </Button>
        
        <div className="w-px h-6 bg-[#4A4A4A]/50" />
        
        <div className="flex items-center gap-2 sm:gap-3 cursor-pointer hover:opacity-80 transition-smooth">
          <Avatar className="w-7 h-7 sm:w-8 sm:h-8">
            <AvatarImage src="" />
            <AvatarFallback className="bg-primary/20 text-primary text-sm">ZK</AvatarFallback>
          </Avatar>
          <span className="hidden md:inline text-sm font-normal text-foreground">Zubair Khan</span>
        </div>
      </div>
    </header>
  );
}
