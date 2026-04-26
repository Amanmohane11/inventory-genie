import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Bill, seedBills } from "../seedData";

type State = { bills: Bill[] };
const initialState: State = { bills: seedBills };

const billSlice = createSlice({
  name: "bills",
  initialState,
  reducers: {
    addBill: (s, a: PayloadAction<Bill>) => { s.bills.unshift(a.payload); },
    deleteBill: (s, a: PayloadAction<string>) => {
      s.bills = s.bills.filter(b => b.id !== a.payload);
    },
  },
});

export const { addBill, deleteBill } = billSlice.actions;
export default billSlice.reducer;
