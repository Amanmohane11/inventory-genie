import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Expense, seedExpenses } from "../seedData";

type State = { expenses: Expense[] };
const initialState: State = { expenses: seedExpenses };

const expenseSlice = createSlice({
  name: "expenses",
  initialState,
  reducers: {
    addExpense: (s, a: PayloadAction<Expense>) => { s.expenses.unshift(a.payload); },
    deleteExpense: (s, a: PayloadAction<string>) => {
      s.expenses = s.expenses.filter(e => e.id !== a.payload);
    },
  },
});

export const { addExpense, deleteExpense } = expenseSlice.actions;
export default expenseSlice.reducer;
