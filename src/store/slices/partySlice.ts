import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type Customer = {
  id: string; name: string; phone: string; email?: string;
  address?: string; createdAt: string; lastTxn?: string; visits: number; totalSpend: number;
};
export type Dealer = {
  id: string; name: string; phone: string; email?: string;
  company: string; productCategory: string;
};

type State = { customers: Customer[]; dealers: Dealer[] };
const initialState: State = {
  customers: [
    { id: "c1", name: "Aman Verma", phone: "9876500001", createdAt: new Date().toISOString(), lastTxn: new Date().toISOString(), visits: 12, totalSpend: 18400 },
    { id: "c2", name: "Riya Sharma", phone: "9876500002", createdAt: new Date().toISOString(), lastTxn: new Date(Date.now() - 60 * 86400000).toISOString(), visits: 3, totalSpend: 4200 },
  ],
  dealers: [
    { id: "d1", name: "Acme Distributors", phone: "9000000001", company: "Acme Pvt Ltd", productCategory: "Electronics" },
  ],
};

const slice = createSlice({
  name: "parties",
  initialState,
  reducers: {
    addCustomer: (s, a: PayloadAction<Customer>) => { s.customers.push(a.payload); },
    updateCustomer: (s, a: PayloadAction<Customer>) => {
      const i = s.customers.findIndex(c => c.id === a.payload.id);
      if (i >= 0) s.customers[i] = a.payload;
    },
    deleteCustomer: (s, a: PayloadAction<string>) => {
      s.customers = s.customers.filter(c => c.id !== a.payload);
    },
    addDealer: (s, a: PayloadAction<Dealer>) => { s.dealers.push(a.payload); },
    updateDealer: (s, a: PayloadAction<Dealer>) => {
      const i = s.dealers.findIndex(d => d.id === a.payload.id);
      if (i >= 0) s.dealers[i] = a.payload;
    },
    deleteDealer: (s, a: PayloadAction<string>) => {
      s.dealers = s.dealers.filter(d => d.id !== a.payload);
    },
  },
});

export const { addCustomer, updateCustomer, deleteCustomer, addDealer, updateDealer, deleteDealer } = slice.actions;
export default slice.reducer;
