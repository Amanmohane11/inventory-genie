import { subDays, format } from "date-fns";

export type Item = {
  id: string;
  name: string;
  code: string;
  category: string;
  stock: number;
  costPrice: number;
  salePrice: number;
};

export type BillItem = {
  itemId: string;
  name: string;
  qty: number;
  price: number;       // unit sale or purchase price (excl GST)
  gstRate: number;     // %
  discount: number;    // amount
};

export type Bill = {
  id: string;
  type: "sales" | "purchase" | "estimate";
  date: string;        // ISO
  partyName: string;
  items: BillItem[];
  paymentMode?: "upi" | "card" | "cash";
  paid?: boolean;
};

export type Expense = {
  id: string;
  date: string;
  category: string;
  amount: number;
  note?: string;
};

const ITEMS: Item[] = [
  { id: "i1", name: "Wireless Mouse", code: "WM-001", category: "Electronics", stock: 42, costPrice: 320, salePrice: 599 },
  { id: "i2", name: "USB-C Cable",     code: "UC-002", category: "Electronics", stock: 120, costPrice: 80,  salePrice: 199 },
  { id: "i3", name: "Notebook A5",     code: "NB-003", category: "Stationery",  stock: 200, costPrice: 35,  salePrice: 99 },
  { id: "i4", name: "Gel Pen Pack",    code: "GP-004", category: "Stationery",  stock: 350, costPrice: 25,  salePrice: 75 },
  { id: "i5", name: "Desk Lamp",       code: "DL-005", category: "Home",        stock: 18,  costPrice: 540, salePrice: 999 },
  { id: "i6", name: "Water Bottle 1L", code: "WB-006", category: "Home",        stock: 85,  costPrice: 120, salePrice: 249 },
  { id: "i7", name: "Bluetooth Speaker", code: "BS-007", category: "Electronics", stock: 22, costPrice: 850, salePrice: 1499 },
  { id: "i8", name: "Backpack 25L",    code: "BP-008", category: "Accessories", stock: 30,  costPrice: 600, salePrice: 1199 },
];

// Deterministic pseudo-random for stable seed
function rand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function genBills(): Bill[] {
  const r = rand(42);
  const bills: Bill[] = [];
  // 180 days of history
  for (let d = 0; d < 180; d++) {
    const date = subDays(new Date(), d).toISOString();
    const salesCount = Math.floor(r() * 4) + 1;
    for (let i = 0; i < salesCount; i++) {
      const it = ITEMS[Math.floor(r() * ITEMS.length)];
      const qty = Math.floor(r() * 4) + 1;
      bills.push({
        id: `s-${d}-${i}`,
        type: "sales",
        date,
        partyName: ["Walk-in", "Aman", "Riya", "Karan", "Neha"][Math.floor(r() * 5)],
        paymentMode: (["upi", "card", "cash"] as const)[Math.floor(r() * 3)],
        paid: r() > 0.15,
        items: [{
          itemId: it.id, name: it.name, qty,
          price: it.salePrice, gstRate: 18, discount: 0,
        }],
      });
    }
    if (d % 3 === 0) {
      const it = ITEMS[Math.floor(r() * ITEMS.length)];
      const qty = Math.floor(r() * 20) + 5;
      bills.push({
        id: `p-${d}`,
        type: "purchase",
        date,
        partyName: ["Acme Distributors", "Globex Supply", "Initech Traders"][Math.floor(r() * 3)],
        items: [{
          itemId: it.id, name: it.name, qty,
          price: it.costPrice, gstRate: 18, discount: 0,
        }],
      });
    }
  }
  return bills;
}

function genExpenses(): Expense[] {
  const r = rand(7);
  const out: Expense[] = [];
  for (let d = 0; d < 180; d += 2) {
    out.push({
      id: `e-${d}`,
      date: subDays(new Date(), d).toISOString(),
      category: ["Rent", "Utilities", "Salaries", "Marketing", "Misc"][Math.floor(r() * 5)],
      amount: Math.floor(r() * 2000) + 200,
    });
  }
  return out;
}

export const seedItems = ITEMS;
export const seedBills = genBills();
export const seedExpenses = genExpenses();

export const todayLabel = format(new Date(), "PPP");
