import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type Query = {
  id: string;
  businessName: string;
  contact: string;
  message: string;
  date: string;
  resolved?: boolean;
};

export type Faq = {
  id: string;
  question: string;
  answer: string;
  createdAt: string;
};

type State = { queries: Query[]; faqs: Faq[] };

const initialState: State = {
  queries: [
    {
      id: "q-1", businessName: "Sharma Electronics", contact: "ravi@sharma.in",
      message: "How do I export sales reports as Excel?",
      date: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: "q-2", businessName: "Patel Garments", contact: "9876500002",
      message: "Trial expired but I cannot access dashboard.",
      date: new Date(Date.now() - 86400000).toISOString(),
    },
  ],
  faqs: [
    {
      id: "faq-1",
      question: "How do I add a new product?",
      answer: "Navigate to Items → Add Item, fill the form and click Save.",
      createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    },
    {
      id: "faq-2",
      question: "Can I edit a sales bill after creating it?",
      answer: "Yes — open Bills → Sales, then click the edit icon. Stock is auto-adjusted.",
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    },
  ],
};

const slice = createSlice({
  name: "support",
  initialState,
  reducers: {
    addQuery: (s, a: PayloadAction<Query>) => { s.queries.unshift(a.payload); },
    resolveQuery: (s, a: PayloadAction<string>) => {
      const q = s.queries.find((x) => x.id === a.payload);
      if (q) q.resolved = true;
    },
    deleteQuery: (s, a: PayloadAction<string>) => {
      s.queries = s.queries.filter((q) => q.id !== a.payload);
    },
    addFaq: (s, a: PayloadAction<Faq>) => { s.faqs.unshift(a.payload); },
    updateFaq: (s, a: PayloadAction<Faq>) => {
      const i = s.faqs.findIndex((f) => f.id === a.payload.id);
      if (i >= 0) s.faqs[i] = a.payload;
    },
    deleteFaq: (s, a: PayloadAction<string>) => {
      s.faqs = s.faqs.filter((f) => f.id !== a.payload);
    },
  },
});

export const {
  addQuery, resolveQuery, deleteQuery, addFaq, updateFaq, deleteFaq,
} = slice.actions;
export default slice.reducer;
