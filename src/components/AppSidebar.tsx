import { List, Edit, BarChart3, MessageSquare, FileText, Users, Settings, Calendar } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar';
import { NavLink } from '@/components/NavLink';

const sidebarItems = [
  { icon: List, url: '/dashboard', tooltip: 'Dashboard' },
  { icon: Edit, url: '/dashboard/edit', tooltip: 'Edit' },
  { icon: BarChart3, url: '/dashboard/analytics', tooltip: 'Analytics' },
  { icon: MessageSquare, url: '/dashboard/messages', tooltip: 'Messages' },
  { icon: FileText, url: '/dashboard/documents', tooltip: 'Documents' },
  { icon: Users, url: '/dashboard/users', tooltip: 'Users' },
  { icon: Calendar, url: '/dashboard/calendar', tooltip: 'Calendar' },
  { icon: Settings, url: '/dashboard/settings', tooltip: 'Settings' },
];

export function AppSidebar() {
  const { state } = useSidebar();

  return (
    <Sidebar className={state === 'collapsed' ? 'w-14' : 'w-20'} collapsible="icon">
      <SidebarContent className="bg-card/80 backdrop-blur-sm border-r border-border/50">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2 mt-4">
              {sidebarItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="flex items-center justify-center w-12 h-12 mx-auto rounded-xl hover:bg-muted/50 transition-smooth"
                      activeClassName="bg-primary/20 text-primary"
                    >
                      <item.icon className="w-5 h-5" />
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
