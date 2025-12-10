import { useState } from "react";
import { Clock } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store/store";
import { selectRunningTasksCount, setTasksVisible, toggleTasksVisible } from "@/store/slices/longRunningTasksSlice";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import LongRunningTasksList from "./LongRunningTasksList";

const LongRunningTasksButton = () => {
  const dispatch = useDispatch();
  const runningTasksCount = useSelector(selectRunningTasksCount);
  const isTasksVisible = useSelector((state: RootState) => state.longRunningTasks.isVisible);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleClick = () => {
    dispatch(toggleTasksVisible());
  };

  const handleOpenChange = (open: boolean) => {
    setIsDropdownOpen(open);
    if (!open) {
      dispatch(setTasksVisible(false));
    }
  };

  if (runningTasksCount === 0) {
    return null;
  }

  return (
    <DropdownMenu open={isDropdownOpen} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white transition"
          onClick={handleClick}
          aria-label={`${runningTasksCount} long running tasks`}
        >
          <Clock className="h-5 w-5" />
          {runningTasksCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold shadow-[0_0_8px_rgba(239,68,68,0.6)]">
              {runningTasksCount > 9 ? '9+' : runningTasksCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-80 bg-[#1A1A1A] border border-white/10 text-white"
        sideOffset={8}
      >
        <LongRunningTasksList />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LongRunningTasksButton;
