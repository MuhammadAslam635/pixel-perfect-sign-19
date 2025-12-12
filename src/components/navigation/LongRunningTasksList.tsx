import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Clock, Loader2, MessageCircle, AlertCircle, CheckCircle } from "lucide-react";
import { RootState } from "@/store/store";
import { selectRunningTasks } from "@/store/slices/longRunningTasksSlice";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const LongRunningTasksList = () => {
  const navigate = useNavigate();
  const runningTasks = useSelector(selectRunningTasks);

  const formatDuration = (startTime: number) => {
    const elapsed = Date.now() - startTime;
    const seconds = Math.floor(elapsed / 1000);
    const minutes = Math.floor(seconds / 60);

    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-400" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-400" />;
      case 'cancelled':
        return <Clock className="h-4 w-4 text-gray-400" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'text-blue-400';
      case 'completed':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      case 'cancelled':
        return 'text-gray-400';
      default:
        return 'text-gray-400';
    }
  };

  const handleTaskClick = (chatId: string) => {
    // Navigate to the chat with the long-running task
    navigate(`/chat?chatId=${chatId}`);
  };

  if (runningTasks.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-gray-400">
        No long-running tasks
      </div>
    );
  }

  return (
    <div className="p-2">
      <div className="flex items-center gap-2 px-2 py-1 mb-2">
        <Clock className="h-4 w-4 text-gray-400" />
        <span className="text-sm font-medium text-white">
          Long Running Tasks ({runningTasks.length})
        </span>
      </div>

      <ScrollArea className="max-h-80">
        <div className="space-y-1">
          {runningTasks.map((task) => (
            <Button
              key={task.id}
              variant="ghost"
              className={cn(
                "w-full justify-start p-3 h-auto text-left hover:bg-white/5 whitespace-normal",
                "border border-transparent hover:border-white/10"
              )}
              onClick={() => handleTaskClick(task.chatId)}
            >
              <div className="flex items-start gap-3 w-full">
                <div className="flex-shrink-0 mt-0.5">
                  {getStatusIcon(task.status)}
                </div>

                <div className="flex-1 min-w-0 ">
                  <div className="flex items-start gap-2 mb-1">
                    <MessageCircle className="h-3 w-3 text-gray-400 flex-shrink-0 mt-1" />
                    <span className="text-xs font-medium text-white break-words">
                      {task.title}
                    </span>
                  </div>

                  {task.description && (
                    <p className="text-xs text-gray-400 mb-1 line-clamp-2">
                      {task.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <span className={cn("text-xs", getStatusColor(task.status))}>
                      {task.status === 'running' ? 'Running' : task.status}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDuration(task.startTime)}
                    </span>
                  </div>
                </div>
              </div>
            </Button>
          ))}
        </div>
      </ScrollArea>

      {runningTasks.length > 0 && (
        <div className="mt-3 pt-2 border-t border-white/10">
          <p className="text-xs text-gray-500 text-center">
            Click on a task to navigate to the chat
          </p>
        </div>
      )}
    </div>
  );
};

export default LongRunningTasksList;
