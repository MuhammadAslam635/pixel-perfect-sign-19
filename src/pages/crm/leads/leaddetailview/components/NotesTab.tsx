import { FC, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notesService } from "@/services/notes.service";
import { Note } from "@/types/notes.types";
import { Lead } from "@/services/leads.service";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Edit2, Trash2, Check, X } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface NotesTabProps {
  lead: Lead;
}

const NotesTab: FC<NotesTabProps> = ({ lead }) => {
  const queryClient = useQueryClient();
  const [newNoteContent, setNewNoteContent] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);

  // Fetch notes for this lead
  const {
    data: notesResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["notes", lead._id],
    queryFn: async () => {
      console.log("Fetching notes for lead:", lead._id);
      try {
        const result = await notesService.getNotesByLeadId(lead._id);
        console.log("Notes fetched successfully:", result);
        return result;
      } catch (err) {
        console.error("Error fetching notes:", err);
        throw err;
      }
    },
    enabled: !!lead._id,
  });

  const notes = notesResponse?.data || [];

  // Create note mutation
  const createNoteMutation = useMutation({
    mutationFn: (content: string) =>
      notesService.createNote({
        content,
        leadId: lead._id,
        companyId: lead.companyId || "",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes", lead._id] });
      setNewNoteContent("");
      setIsAddingNote(false);
      toast.success("Note created successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to create note");
    },
  });

  // Update note mutation
  const updateNoteMutation = useMutation({
    mutationFn: ({ noteId, content }: { noteId: string; content: string }) =>
      notesService.updateNote(noteId, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes", lead._id] });
      setEditingNoteId(null);
      setEditContent("");
      toast.success("Note updated successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to update note");
    },
  });

  // Delete note mutation
  const deleteNoteMutation = useMutation({
    mutationFn: (noteId: string) => notesService.deleteNote(noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes", lead._id] });
      toast.success("Note deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to delete note");
    },
  });

  const handleCreateNote = () => {
    if (!newNoteContent.trim()) {
      toast.error("Please enter a note");
      return;
    }
    createNoteMutation.mutate(newNoteContent);
  };

  const handleUpdateNote = (noteId: string) => {
    if (!editContent.trim()) {
      toast.error("Note cannot be empty");
      return;
    }
    updateNoteMutation.mutate({ noteId, content: editContent });
  };

  const handleDeleteNote = (noteId: string) => {
    if (window.confirm("Are you sure you want to delete this note?")) {
      deleteNoteMutation.mutate(noteId);
    }
  };

  const startEditing = (note: Note) => {
    setEditingNoteId(note._id);
    setEditContent(note.content);
  };

  const cancelEditing = () => {
    setEditingNoteId(null);
    setEditContent("");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
        <span className="ml-2 text-sm text-white/60">Loading notes...</span>
      </div>
    );
  }

  if (error) {
    console.error("Notes error details:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return (
      <div className="text-sm text-red-400 p-4 rounded-lg bg-red-500/10 border border-red-500/20 space-y-2">
        <div>Failed to load notes. Please try again.</div>
        <div className="text-xs text-red-300/70">Error: {errorMessage}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add Note Section */}
      {!isAddingNote ? (
        <Button
          onClick={() => setIsAddingNote(true)}
          className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/30 text-xs"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Note
        </Button>
      ) : (
        <div
          className="rounded-lg p-4 space-y-3"
          style={{
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <Textarea
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            placeholder="Enter your note here..."
            className="min-h-[100px] bg-white/5 border-white/10 text-white placeholder:text-white/40 resize-none"
            autoFocus
          />
          <div className="flex gap-2">
            <Button
              onClick={handleCreateNote}
              disabled={createNoteMutation.isPending || !newNoteContent.trim()}
              className="bg-cyan-500 hover:bg-cyan-600 text-white text-xs"
            >
              {createNoteMutation.isPending ? (
                <>
                  <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-3 h-3 mr-2" />
                  Save Note
                </>
              )}
            </Button>
            <Button
              onClick={() => {
                setIsAddingNote(false);
                setNewNoteContent("");
              }}
              variant="ghost"
              className="text-white/60 hover:text-white hover:bg-white/10 text-xs"
            >
              <X className="w-3 h-3 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Notes List */}
      <div className="space-y-3">
        {notes.length === 0 ? (
          <div
            className="rounded-lg p-6 text-center"
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <p className="text-sm text-white/60">
              No notes yet. Add your first note above.
            </p>
          </div>
        ) : (
          notes.map((note) => (
            <div
              key={note._id}
              className="rounded-lg p-4 space-y-3"
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              {editingNoteId === note._id ? (
                // Edit Mode
                <>
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="min-h-[100px] bg-white/5 border-white/10 text-white placeholder:text-white/40 resize-none"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleUpdateNote(note._id)}
                      disabled={
                        updateNoteMutation.isPending || !editContent.trim()
                      }
                      className="bg-cyan-500 hover:bg-cyan-600 text-white text-xs"
                    >
                      {updateNoteMutation.isPending ? (
                        <>
                          <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Check className="w-3 h-3 mr-2" />
                          Save
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={cancelEditing}
                      variant="ghost"
                      className="text-white/60 hover:text-white hover:bg-white/10 text-xs"
                    >
                      <X className="w-3 h-3 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </>
              ) : (
                // View Mode
                <>
                  <p className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed">
                    {note.content}
                  </p>
                  <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    <div className="text-xs text-white/50">
                      <span>
                        {note.createdBy?.name ||
                          note.createdBy?.email ||
                          "Unknown"}
                      </span>
                      <span className="mx-2">•</span>
                      <span>
                        {formatDistanceToNow(new Date(note.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                      {note.updatedAt !== note.createdAt && (
                        <>
                          <span className="mx-2">•</span>
                          <span className="italic">edited</span>
                        </>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => startEditing(note)}
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-white/60 hover:text-white hover:bg-white/10"
                      >
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button
                        onClick={() => handleDeleteNote(note._id)}
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-red-400/60 hover:text-red-400 hover:bg-red-500/10"
                        disabled={deleteNoteMutation.isPending}
                      >
                        {deleteNoteMutation.isPending &&
                        deleteNoteMutation.variables === note._id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Trash2 className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotesTab;
