import {
  Home,
  Users,
  Rocket,
  MessageSquare,
  CalendarDays,
  BarChart3,
  BookOpen,
  Settings,
} from "lucide-react";

type QuickAction = {
  id: string;
  label: string;
  icon: typeof Home;
};

const quickActions: QuickAction[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "audiences", label: "Audiences", icon: Users },
  { id: "campaigns", label: "Campaigns", icon: Rocket },
  { id: "chat", label: "Chat", icon: MessageSquare },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "knowledge", label: "Knowledge", icon: BookOpen },
  { id: "settings", label: "Settings", icon: Settings },
];

const ChatQuickActions = () => {
  return (
    <div className="flex w-full flex-wrap items-center justify-center gap-2 rounded-full border border-white/5 bg-black/30 px-4 py-3 backdrop-blur-3xl sm:gap-3 md:px-6">
      {quickActions.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          className="group relative flex h-10 flex-1 items-center justify-center gap-2 rounded-full border border-white/5 bg-white/5 px-3 text-sm font-medium text-white/80 transition-all duration-300 hover:border-primary/40 hover:bg-primary/10 hover:text-white sm:flex-none sm:px-4"
        >
          <Icon className="size-4 shrink-0 text-primary/80 transition-colors group-hover:text-primary" />
          <span className="hidden whitespace-nowrap sm:inline">{label}</span>
          <span className="sm:hidden">{label.charAt(0)}</span>
        </button>
      ))}
    </div>
  );
};

export default ChatQuickActions;
