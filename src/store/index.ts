import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";

import items from "./slices/itemSlice";
import bills from "./slices/billSlice";
import expenses from "./slices/expenseSlice";
import parties from "./slices/partySlice";
import debitNotes from "./slices/debitNoteSlice";
import payroll from "./slices/payrollSlice";
import settings from "./slices/settingsSlice";
import auth from "./slices/authSlice";

const rootReducer = combineReducers({ items, bills, expenses, parties, debitNotes, payroll, settings, auth });

const persistConfig = {
  key: "ims-root",
  version: 3,
  storage,
  whitelist: ["items", "bills", "expenses", "parties", "debitNotes", "payroll", "settings", "auth"],
};

const persisted = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persisted,
  middleware: (getDefault) =>
    getDefault({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
