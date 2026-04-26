import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type Staff = {
  id: string;
  name: string;
  role: string;
  salary: number;
  joinedAt: string;
};
export type Payment = {
  id: string;
  staffId: string;
  staffName: string;
  amount: number;
  date: string;
  note?: string;
};

type State = { staff: Staff[]; payments: Payment[] };
const initialState: State = {
  staff: [
    { id: "st1", name: "Rohan Kumar", role: "Cashier", salary: 18000, joinedAt: new Date().toISOString() },
    { id: "st2", name: "Sneha Patil", role: "Sales", salary: 22000, joinedAt: new Date().toISOString() },
  ],
  payments: [],
};

const slice = createSlice({
  name: "payroll",
  initialState,
  reducers: {
    addStaff: (s, a: PayloadAction<Staff>) => { s.staff.push(a.payload); },
    deleteStaff: (s, a: PayloadAction<string>) => {
      s.staff = s.staff.filter((x) => x.id !== a.payload);
    },
    addPayment: (s, a: PayloadAction<Payment>) => { s.payments.unshift(a.payload); },
    deletePayment: (s, a: PayloadAction<string>) => {
      s.payments = s.payments.filter((p) => p.id !== a.payload);
    },
  },
});

export const { addStaff, deleteStaff, addPayment, deletePayment } = slice.actions;
export default slice.reducer;
