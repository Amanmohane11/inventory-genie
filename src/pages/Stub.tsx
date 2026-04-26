import { AppLayout } from "@/components/AppLayout";
import { PlaceholderPage } from "./PlaceholderPage";

const titles: Record<string, { t: string; d: string }> = {
  "/parties": { t: "Parties", d: "Manage customers and dealers." },
  "/items": { t: "Items", d: "Manage your inventory items." },
  "/bills/sales": { t: "Sales Bill", d: "Create new sales bills." },
  "/bills/purchase": { t: "Purchase Bill", d: "Record purchases from dealers." },
  "/bills/history": { t: "Bill History", d: "View past sales, purchases and estimates." },
  "/debit-note": { t: "Debit Note", d: "Record purchase returns." },
  "/reports": { t: "Reports", d: "Business overview, sales, purchases and more." },
  "/payroll": { t: "Payroll", d: "Attendance, staff and salary payments." },
  "/settings": { t: "Settings", d: "Business info, tax and invoice customization." },
};

export default function Stub({ path }: { path: string }) {
  const m = titles[path] ?? { t: "Coming soon", d: "" };
  return (
    <AppLayout>
      <PlaceholderPage title={m.t} description={m.d} />
    </AppLayout>
  );
}
