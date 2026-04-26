import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type DebitNote = {
  id: string;
  date: string;
  dealerName: string;
  itemName: string;
  qty: number;
  amount: number;
  reason: string;
};

type State = { notes: DebitNote[] };
const initialState: State = { notes: [] };

const slice = createSlice({
  name: "debitNotes",
  initialState,
  reducers: {
    addNote: (s, a: PayloadAction<DebitNote>) => { s.notes.unshift(a.payload); },
    deleteNote: (s, a: PayloadAction<string>) => {
      s.notes = s.notes.filter((n) => n.id !== a.payload);
    },
  },
});

export const { addNote, deleteNote } = slice.actions;
export default slice.reducer;
