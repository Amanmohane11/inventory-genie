import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type Gender = "male" | "female" | "other";

export type Staff = {
  id: string;
  name: string;
  role: string;
  salary: number;          // monthly salary
  perDaySalary?: number;   // per-day rate (optional override)
  joinedAt: string;
  phone?: string;
  email?: string;
  aadhaar?: string;
  address?: string;
  age?: number;
  gender?: Gender;
  imageDataUrl?: string;
};
export type Payment = {
  id: string;
  staffId: string;
  staffName: string;
  amount: number;
  date: string;
  note?: string;
};
export type AttendanceStatus = "present" | "absent" | "half";
export type AttendanceRecord = {
  staffId: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
};

type State = { staff: Staff[]; payments: Payment[]; attendance: AttendanceRecord[] };
const initialState: State = {
  staff: [
    {
      id: "st1", name: "Rohan Kumar", role: "Cashier", salary: 18000, perDaySalary: 600,
      joinedAt: new Date().toISOString(), phone: "9000000010", email: "rohan@example.com",
      aadhaar: "1234 5678 9012", address: "Kothrud, Pune", age: 24, gender: "male",
    },
    {
      id: "st2", name: "Sneha Patil", role: "Sales", salary: 22000, perDaySalary: 750,
      joinedAt: new Date().toISOString(), phone: "9000000011", email: "sneha@example.com",
      aadhaar: "2345 6789 0123", address: "Baner, Pune", age: 27, gender: "female",
    },
  ],
  payments: [],
  attendance: [],
};

const slice = createSlice({
  name: "payroll",
  initialState,
  reducers: {
    addStaff: (s, a: PayloadAction<Staff>) => { s.staff.push(a.payload); },
    updateStaff: (s, a: PayloadAction<Staff>) => {
      const i = s.staff.findIndex((x) => x.id === a.payload.id);
      if (i >= 0) s.staff[i] = a.payload;
    },
    deleteStaff: (s, a: PayloadAction<string>) => {
      s.staff = s.staff.filter((x) => x.id !== a.payload);
      s.attendance = s.attendance.filter((r) => r.staffId !== a.payload);
    },
    addPayment: (s, a: PayloadAction<Payment>) => { s.payments.unshift(a.payload); },
    deletePayment: (s, a: PayloadAction<string>) => {
      s.payments = s.payments.filter((p) => p.id !== a.payload);
    },
    setAttendance: (s, a: PayloadAction<AttendanceRecord>) => {
      const i = s.attendance.findIndex((r) => r.staffId === a.payload.staffId && r.date === a.payload.date);
      if (i >= 0) s.attendance[i] = a.payload;
      else s.attendance.push(a.payload);
    },
  },
});

export const {
  addStaff, updateStaff, deleteStaff, addPayment, deletePayment, setAttendance,
} = slice.actions;
export default slice.reducer;
