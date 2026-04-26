import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type Settings = {
  businessName: string;
  ownerName: string;
  phone: string;
  email: string;
  address: string;
  gstin: string;
  defaultGst: number;
  invoicePrefix: string;
  currency: string;
};

const initialState: Settings = {
  businessName: "Inventra Store",
  ownerName: "Admin",
  phone: "",
  email: "",
  address: "",
  gstin: "",
  defaultGst: 18,
  invoicePrefix: "INV",
  currency: "INR",
};

const slice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    updateSettings: (_s, a: PayloadAction<Settings>) => a.payload,
  },
});

export const { updateSettings } = slice.actions;
export default slice.reducer;
