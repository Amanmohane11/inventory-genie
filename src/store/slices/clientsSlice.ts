import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type ClientBusiness = {
  id: string;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  address: string;
  category: string;
  trialDays: number;          // 0 = no trial
  createdAt: string;          // ISO
  subscriptionPlanId?: string;
  subscriptionStartedAt?: string;
  subscriptionEndsAt?: string;
};

type State = { items: ClientBusiness[] };

const now = new Date();
const iso = (d: Date) => d.toISOString();
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400000);

const initialState: State = {
  items: [
    {
      id: "biz-1", businessName: "Sharma Electronics", ownerName: "Ravi Sharma",
      email: "ravi@sharma.in", phone: "9876500001", address: "MG Road, Pune",
      category: "Electronics", trialDays: 14,
      createdAt: iso(addDays(now, -120)),
      subscriptionPlanId: "plan-pro",
      subscriptionStartedAt: iso(addDays(now, -90)),
      subscriptionEndsAt: iso(addDays(now, 275)),
    },
    {
      id: "biz-2", businessName: "Patel Garments", ownerName: "Mina Patel",
      email: "mina@patelg.in", phone: "9876500002", address: "Surat",
      category: "Apparel", trialDays: 7,
      createdAt: iso(addDays(now, -5)),
    },
    {
      id: "biz-3", businessName: "Kumar Stationery", ownerName: "Anil Kumar",
      email: "anil@kstat.in", phone: "9876500003", address: "Delhi",
      category: "Stationery", trialDays: 0,
      createdAt: iso(addDays(now, -30)),
    },
    {
      id: "biz-4", businessName: "Greenleaf Grocers", ownerName: "Sara Iyer",
      email: "sara@greenleaf.in", phone: "9876500004", address: "Bengaluru",
      category: "Grocery", trialDays: 14,
      createdAt: iso(addDays(now, -200)),
      subscriptionPlanId: "plan-basic",
      subscriptionStartedAt: iso(addDays(now, -180)),
      subscriptionEndsAt: iso(addDays(now, -10)), // expired
    },
  ],
};

const slice = createSlice({
  name: "clients",
  initialState,
  reducers: {
    addClient: (s, a: PayloadAction<ClientBusiness>) => { s.items.unshift(a.payload); },
    updateClient: (s, a: PayloadAction<ClientBusiness>) => {
      const i = s.items.findIndex((x) => x.id === a.payload.id);
      if (i >= 0) s.items[i] = a.payload;
    },
    deleteClient: (s, a: PayloadAction<string>) => {
      s.items = s.items.filter((x) => x.id !== a.payload);
    },
    assignSubscription: (
      s,
      a: PayloadAction<{ clientId: string; planId: string; startedAt: string; endsAt: string }>,
    ) => {
      const c = s.items.find((x) => x.id === a.payload.clientId);
      if (!c) return;
      c.subscriptionPlanId = a.payload.planId;
      c.subscriptionStartedAt = a.payload.startedAt;
      c.subscriptionEndsAt = a.payload.endsAt;
    },
  },
});

export const { addClient, updateClient, deleteClient, assignSubscription } = slice.actions;
export default slice.reducer;

// ---- helpers ----
export type ClientStatus = "active" | "trial" | "inactive";

export function getClientStatus(c: ClientBusiness, now = new Date()): ClientStatus {
  // Active subscription wins
  if (c.subscriptionEndsAt && new Date(c.subscriptionEndsAt) > now) return "active";
  // Trial window
  if (c.trialDays > 0) {
    const trialEnd = new Date(new Date(c.createdAt).getTime() + c.trialDays * 86400000);
    if (trialEnd > now) return "trial";
  }
  return "inactive";
}
