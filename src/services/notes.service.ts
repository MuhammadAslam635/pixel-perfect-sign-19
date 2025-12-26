import API from "@/utils/api";
import {
  Note,
  CreateNotePayload,
  UpdateNotePayload,
  NotesResponse,
  NoteResponse,
} from "@/types/notes.types";

export const notesService = {
  /**
   * Get all notes for a specific lead
   */
  getNotesByLeadId: async (leadId: string): Promise<NotesResponse> => {
    const response = await API.get<NotesResponse>(`/notes/lead/${leadId}`);
    return response.data;
  },

  /**
   * Get a single note by ID
   */
  getNoteById: async (noteId: string): Promise<NoteResponse> => {
    const response = await API.get<NoteResponse>(`/notes/${noteId}`);
    return response.data;
  },

  /**
   * Create a new note
   */
  createNote: async (payload: CreateNotePayload): Promise<NoteResponse> => {
    const response = await API.post<NoteResponse>("/notes", payload);
    return response.data;
  },

  /**
   * Update an existing note
   */
  updateNote: async (
    noteId: string,
    payload: UpdateNotePayload
  ): Promise<NoteResponse> => {
    const response = await API.put<NoteResponse>(`/notes/${noteId}`, payload);
    return response.data;
  },

  /**
   * Delete a note
   */
  deleteNote: async (noteId: string): Promise<{ success: boolean }> => {
    const response = await API.delete<{ success: boolean }>(`/notes/${noteId}`);
    return response.data;
  },
};
