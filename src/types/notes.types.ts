export interface Note {
  _id: string;
  content: string;
  leadId: string;
  companyId: string;
  createdBy: {
    _id: string;
    name?: string;
    email?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateNotePayload {
  content: string;
  leadId: string;
  companyId: string;
}

export interface UpdateNotePayload {
  content: string;
}

export interface NotesResponse {
  success: boolean;
  data: Note[];
  total?: number;
}

export interface NoteResponse {
  success: boolean;
  data: Note;
}
