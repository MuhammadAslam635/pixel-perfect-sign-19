import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Bold, Italic, List, Edit, Sparkles } from 'lucide-react';

interface EmailDraftModalProps {
  open: boolean;
  onClose: () => void;
  leadName?: string;
  leadEmail?: string;
}

export const EmailDraftModal = ({ open, onClose, leadName, leadEmail }: EmailDraftModalProps) => {
  const [emailContent, setEmailContent] = useState(
    "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type.\n\nMore recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum."
  );

  const handleSend = () => {
    // Implement send logic here
    console.log('Sending email to:', leadEmail);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-[#1e2829] border-[#3A3A3A] text-white">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold text-white">
                Email Draft
              </DialogTitle>
              <p className="text-sm text-white/60 mt-1">
                Here's a drafted email message Made edits or send as is
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-white/10"
            >
              <Edit className="h-4 w-4 text-white" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Toolbar with Draft with AI button */}
          <div className="flex items-center justify-between gap-2 p-2 bg-[#2A3435]/50 rounded-lg border border-white/5">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 hover:bg-white/10"
              >
                <Bold className="h-3.5 w-3.5 text-white/80" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 hover:bg-white/10"
              >
                <Italic className="h-3.5 w-3.5 text-white/80" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 hover:bg-white/10"
              >
                <List className="h-3.5 w-3.5 text-white/80" />
              </Button>
            </div>

            {/* Draft with AI button */}
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-white/80 hover:bg-white/10 bg-primary/20 rounded-full px-4 h-7 flex items-center gap-1.5"
            >
              <Sparkles className="w-3 h-3" />
              Draft with AI
            </Button>
          </div>

          {/* Email Content */}
          <Textarea
            value={emailContent}
            onChange={(e) => setEmailContent(e.target.value)}
            className="min-h-[220px] bg-[#2A3435]/50 border-white/5 text-white/90 resize-none focus-visible:ring-1 focus-visible:ring-primary/50 text-sm leading-relaxed"
            placeholder="Type your email content here..."
          />

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="ghost"
              onClick={onClose}
              className="bg-[#2A3435] hover:bg-[#364142] text-white border-0 rounded-full px-8 py-2"
            >
              Back
            </Button>
            <Button
              onClick={handleSend}
              className="bg-primary hover:bg-primary/90 text-white rounded-full px-8 py-2"
            >
              Send
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
