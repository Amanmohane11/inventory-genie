import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type Duration = "monthly" | "yearly" | "custom";

export type Plan = {
  id: string;
  name: string;
  price: number;
  duration: Duration;
  customDays?: number; // when duration === "custom"
  features?: string;
};

type State = { plans: Plan[] };

const initialState: State = {
  plans: [
    { id: "plan-basic", name: "Basic", price: 499, duration: "monthly", features: "Single user, basic reports" },
    { id: "plan-pro", name: "Pro", price: 4999, duration: "yearly", features: "Up to 3 users, full reports, payroll" },
    { id: "plan-enterprise", name: "Enterprise", price: 19999, duration: "custom", customDays: 365, features: "Unlimited users, priority support" },
  ],
};

const slice = createSlice({
  name: "subscriptions",
  initialState,
  reducers: {
    addPlan: (s, a: PayloadAction<Plan>) => { s.plans.unshift(a.payload); },
    updatePlan: (s, a: PayloadAction<Plan>) => {
      const i = s.plans.findIndex((p) => p.id === a.payload.id);
      if (i >= 0) s.plans[i] = a.payload;
    },
    deletePlan: (s, a: PayloadAction<string>) => {
      s.plans = s.plans.filter((p) => p.id !== a.payload);
    },
  },
});

export const { addPlan, updatePlan, deletePlan } = slice.actions;
export default slice.reducer;

export function planDays(p: Plan): number {
  if (p.duration === "monthly") return 30;
  if (p.duration === "yearly") return 365;
  return p.customDays ?? 30;
}
