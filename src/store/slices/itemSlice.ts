import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Item, seedItems } from "../seedData";

type State = { items: Item[] };
const initialState: State = { items: seedItems };

const itemSlice = createSlice({
  name: "items",
  initialState,
  reducers: {
    addItem: (s, a: PayloadAction<Item>) => { s.items.push(a.payload); },
    updateItem: (s, a: PayloadAction<Item>) => {
      const i = s.items.findIndex(x => x.id === a.payload.id);
      if (i >= 0) s.items[i] = a.payload;
    },
    deleteItem: (s, a: PayloadAction<string>) => {
      s.items = s.items.filter(x => x.id !== a.payload);
    },
    adjustStock: (s, a: PayloadAction<{ id: string; delta: number }>) => {
      const it = s.items.find(x => x.id === a.payload.id);
      if (it) it.stock += a.payload.delta;
    },
  },
});

export const { addItem, updateItem, deleteItem, adjustStock } = itemSlice.actions;
export default itemSlice.reducer;
