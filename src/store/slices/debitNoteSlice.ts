import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type DebitNoteItem = {
  itemId: string;
  name: string;
  unit: string;
  mrp: number;
  qty: number;
  rate: number;       // price per unit (excl GST)
  discount: number;   // amount per line
  gstRate: number;    // %
};

export type DebitNote = {
  id: string;
  noteNo: string;
  date: string;
  dueDate: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerAddress?: string;
  items: DebitNoteItem[];
  notes?: string;
  subtotal: number;
  gst: number;
  discount: number;
  total: number;
  status: "open" | "paid";
};

type State = { notes: DebitNote[] };

const seed: DebitNote[] = [
  {
    id: "dn-seed-1",
    noteNo: "DN-00001",
    date: new Date(Date.now() - 5 * 86400000).toISOString(),
    dueDate: new Date(Date.now() + 10 * 86400000).toISOString(),
    customerName: "Aman Verma",
    customerPhone: "9876500001",
    customerEmail: "aman@example.com",
    customerAddress: "12, MG Road, Pune",
    items: [
      { itemId: "i1", name: "Wireless Mouse", unit: "pcs", mrp: 599, qty: 2, rate: 500, discount: 50, gstRate: 18 },
    ],
    notes: "Replacement against damaged unit",
    subtotal: 950, gst: 171, discount: 50, total: 1121,
    status: "open",
  },
  {
    id: "dn-seed-2",
    noteNo: "DN-00002",
    date: new Date(Date.now() - 2 * 86400000).toISOString(),
    dueDate: new Date(Date.now() + 5 * 86400000).toISOString(),
    customerName: "Riya Sharma",
    customerPhone: "9876500002",
    customerAddress: "44, Park Street, Kolkata",
    items: [
      { itemId: "i3", name: "Notebook A5", unit: "pcs", mrp: 99, qty: 5, rate: 90, discount: 0, gstRate: 12 },
    ],
    notes: "",
    subtotal: 450, gst: 54, discount: 0, total: 504,
    status: "open",
  },
];

const initialState: State = { notes: seed };

const slice = createSlice({
  name: "debitNotes",
  initialState,
  reducers: {
    addNote: (s, a: PayloadAction<DebitNote>) => { s.notes.unshift(a.payload); },
    updateNote: (s, a: PayloadAction<DebitNote>) => {
      const i = s.notes.findIndex((n) => n.id === a.payload.id);
      if (i >= 0) s.notes[i] = a.payload;
    },
    deleteNote: (s, a: PayloadAction<string>) => {
      s.notes = s.notes.filter((n) => n.id !== a.payload);
    },
    markPaid: (s, a: PayloadAction<string>) => {
      const n = s.notes.find((x) => x.id === a.payload);
      if (n) n.status = "paid";
    },
    removeNote: (s, a: PayloadAction<string>) => {
      s.notes = s.notes.filter((n) => n.id !== a.payload);
    },
  },
});

export const { addNote, updateNote, deleteNote, markPaid, removeNote } = slice.actions;
export default slice.reducer;
