import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type BillFieldKey =
  | "productName" | "batch" | "hsn" | "expiry" | "mrp"
  | "quantity" | "rate" | "discount" | "gst" | "total" | "free";

export type BillFieldToggles = Record<BillFieldKey, boolean>;

export const DEFAULT_BILL_FIELDS: BillFieldToggles = {
  productName: true, batch: true, hsn: true, expiry: true, mrp: true,
  quantity: true, rate: true, discount: true, gst: true, total: true, free: true,
};

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
  businessRegisterId: string;
  billFields: BillFieldToggles;
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
  businessRegisterId: "BRN-2026-00451",
  billFields: { ...DEFAULT_BILL_FIELDS },
};

const slice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    updateSettings: (s, a: PayloadAction<Partial<Settings>>) => ({
      ...s,
      ...a.payload,
      billFields: { ...DEFAULT_BILL_FIELDS, ...(s.billFields ?? {}), ...(a.payload.billFields ?? {}) },
    }),
    setBillField: (s, a: PayloadAction<{ key: BillFieldKey; value: boolean }>) => {
      if (!s.billFields) s.billFields = { ...DEFAULT_BILL_FIELDS };
      s.billFields[a.payload.key] = a.payload.value;
    },
  },
});

export const { updateSettings, setBillField } = slice.actions;
export default slice.reducer;
