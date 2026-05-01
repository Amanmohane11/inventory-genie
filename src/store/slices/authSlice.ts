import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type Role = "super_admin" | "client_admin";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  businessId?: string; // for client_admin
};

type AuthState = {
  user: AuthUser | null;
};

// Dummy local credential database (mock auth, no backend).
// Passwords are intentionally plain — this is a local mock only.
export const MOCK_CREDENTIALS: Array<{ password: string } & AuthUser> = [
  {
    id: "u-super-1",
    email: "superadmin@inventra.app",
    password: "super123",
    name: "Super Admin",
    role: "super_admin",
  },
  {
    id: "u-client-1",
    email: "admin@business.app",
    password: "client123",
    name: "Business Admin",
    role: "client_admin",
    businessId: "BRN-2026-00451",
  },
];

const initialState: AuthState = { user: null };

const slice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginSuccess: (s, a: PayloadAction<AuthUser>) => {
      s.user = a.payload;
    },
    logout: (s) => {
      s.user = null;
    },
  },
});

export const { loginSuccess, logout } = slice.actions;
export default slice.reducer;
