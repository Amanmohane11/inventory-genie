import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type ClientPageKey =
  | "dashboard" | "parties" | "items"
  | "bills_sales" | "bills_estimate" | "bills_purchase" | "bills_history"
  | "debit_note" | "reports" | "payroll" | "subscription" | "support" | "settings";

export const ALL_CLIENT_PAGES: { key: ClientPageKey; label: string; path: string }[] = [
  { key: "dashboard", label: "Dashboard", path: "/" },
  { key: "parties", label: "Parties", path: "/parties" },
  { key: "items", label: "Items", path: "/items" },
  { key: "bills_sales", label: "Sales Bills", path: "/bills/sales" },
  { key: "bills_estimate", label: "Estimate Bills", path: "/bills/estimate" },
  { key: "bills_purchase", label: "Purchase Bills", path: "/bills/purchase" },
  { key: "bills_history", label: "Bills History", path: "/bills/history" },
  { key: "debit_note", label: "Debit Note", path: "/debit-note" },
  { key: "reports", label: "Reports", path: "/reports" },
  { key: "payroll", label: "Payroll", path: "/payroll" },
  { key: "subscription", label: "Subscription", path: "/subscription" },
  { key: "support", label: "Help & Support", path: "/support" },
  { key: "settings", label: "Settings", path: "/settings" },
];

export type ClientBusiness = {
  id: string;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  altPhone?: string;
  gstin?: string;
  licenseNo?: string;
  fssaiNo?: string;
  password?: string;
  address: string;
  category: string;
  trialDays: number;
  createdAt: string;
  subscriptionPlanId?: string;
  subscriptionStartedAt?: string;
  subscriptionEndsAt?: string;
  allowedPages?: ClientPageKey[]; // undefined = all
};

type State = { items: ClientBusiness[] };

const now = new Date();
const iso = (d: Date) => d.toISOString();
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400000);

const initialState: State = {
  items: [
    {
      id: "biz-1", businessName: "Sharma Electronics", ownerName: "Ravi Sharma",
      email: "ravi@sharma.in", phone: "9876500001", altPhone: "9876500011",
      gstin: "27ABCDE1234F1Z5", licenseNo: "LIC-2024-001", fssaiNo: "11223344556677",
      password: "client123",
      address: "MG Road, Pune", category: "Electronics", trialDays: 14,
      createdAt: iso(addDays(now, -120)),
      subscriptionPlanId: "plan-pro",
      subscriptionStartedAt: iso(addDays(now, -90)),
      subscriptionEndsAt: iso(addDays(now, 275)),
    },
    {
      id: "biz-2", businessName: "Patel Garments", ownerName: "Mina Patel",
      email: "mina@patelg.in", phone: "9876500002",
      gstin: "24MINAE2345B1Z9",
      address: "Surat", category: "Apparel", trialDays: 7,
      createdAt: iso(addDays(now, -5)),
      allowedPages: ["dashboard", "items", "bills_sales", "bills_history", "reports", "support", "settings"],
    },
    {
      id: "biz-3", businessName: "Kumar Stationery", ownerName: "Anil Kumar",
      email: "anil@kstat.in", phone: "9876500003",
      address: "Delhi", category: "Stationery", trialDays: 0,
      createdAt: iso(addDays(now, -30)),
    },
    {
      id: "biz-4", businessName: "Greenleaf Grocers", ownerName: "Sara Iyer",
      email: "sara@greenleaf.in", phone: "9876500004", altPhone: "9876500044",
      fssaiNo: "99887766554433",
      address: "Bengaluru", category: "Grocery", trialDays: 14,
      createdAt: iso(addDays(now, -200)),
      subscriptionPlanId: "plan-basic",
      subscriptionStartedAt: iso(addDays(now, -180)),
      subscriptionEndsAt: iso(addDays(now, -10)),
    },
    {
      id: "biz-5", businessName: "Nova Pharmacy", ownerName: "Dr. Rohit Mehta",
      email: "rohit@novapharma.in", phone: "9876500005",
      gstin: "29ROHITP9090Z1Z2", licenseNo: "DL-PH-2023-87", fssaiNo: "55443322110099",
      address: "HSR Layout, Bengaluru", category: "Pharmacy", trialDays: 30,
      createdAt: iso(addDays(now, -10)),
      subscriptionPlanId: "plan-pro",
      subscriptionStartedAt: iso(addDays(now, -8)),
      subscriptionEndsAt: iso(addDays(now, 357)),
    },
    {
      id: "biz-6", businessName: "Mountain Cafe", ownerName: "Priya Nair",
      email: "priya@mountaincafe.in", phone: "9876500006",
      address: "Manali", category: "F&B", trialDays: 14,
      createdAt: iso(addDays(now, -60)),
      subscriptionPlanId: "plan-basic",
      subscriptionStartedAt: iso(addDays(now, -50)),
      subscriptionEndsAt: iso(addDays(now, 300)),
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

export type ClientStatus = "active" | "trial" | "inactive";
export function getClientStatus(c: ClientBusiness, now = new Date()): ClientStatus {
  if (c.subscriptionEndsAt && new Date(c.subscriptionEndsAt) > now) return "active";
  if (c.trialDays > 0) {
    const trialEnd = new Date(new Date(c.createdAt).getTime() + c.trialDays * 86400000);
    if (trialEnd > now) return "trial";
  }
  return "inactive";
}
