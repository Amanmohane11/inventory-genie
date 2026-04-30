import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Bill, seedBills } from "../seedData";

type State = { bills: Bill[] };
const initialState: State = { bills: seedBills };

const billSlice = createSlice({
  name: "bills",
  initialState,
  reducers: {
    addBill: (s, a: PayloadAction<Bill>) => {
      s.bills.unshift(a.payload);
    },
    updateBill: (s, a: PayloadAction<Bill>) => {
      const i = s.bills.findIndex((b) => b.id === a.payload.id);
      if (i >= 0) s.bills[i] = a.payload;
    },
    deleteBill: (s, a: PayloadAction<string>) => {
      s.bills = s.bills.filter((b) => b.id !== a.payload);
    },
    convertEstimateToSale: (
      s,
      a: PayloadAction<{ id: string; paymentMode: "upi" | "card" | "cash" }>,
    ) => {
      const b = s.bills.find((x) => x.id === a.payload.id);
      if (!b || b.type !== "estimate") return;
      b.type = "sales";
      b.id = `s-${Date.now()}`;
      b.date = new Date().toISOString();
      b.paymentMode = a.payload.paymentMode;
      b.paid = true;
      b.expiryDate = undefined;
    },
  },
});

export const { addBill, updateBill, deleteBill, convertEstimateToSale } = billSlice.actions;
export default billSlice.reducer;
