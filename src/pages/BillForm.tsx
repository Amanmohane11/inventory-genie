import { useMemo, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Save } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store";
import { addBill } from "@/store/slices/billSlice";
import { adjustStock } from "@/store/slices/itemSlice";
import { Bill, BillItem } from "@/store/seedData";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function BillForm({ type }: { type: "sales" | "purchase" }) {
  const items = useAppSelector((s) => s.items.items);
  const { customers, dealers } = useAppSelector((s) => s.parties);
  const dispatch = useAppDispatch();
  const nav = useNavigate();

  const [partyName, setPartyName] = useState(type === "sales" ? "Walk-in" : "");
  const [paymentMode, setPaymentMode] = useState<"upi" | "card" | "cash">("upi");
  const [paid, setPaid] = useState(true);
  const [lines, setLines] = useState<BillItem[]>([]);
  const [pickerId, setPickerId] = useState<string>("");

  const isSales = type === "sales";

  const partyOptions = isSales
    ? ["Walk-in", ...customers.map((c) => c.name)]
    : dealers.map((d) => d.name);

  const addLine = () => {
    if (!pickerId) return;
    const it = items.find((x) => x.id === pickerId);
    if (!it) return;
    if (lines.find((l) => l.itemId === it.id)) {
      toast.error("Item already added");
      return;
    }
    setLines([
      ...lines,
      {
        itemId: it.id,
        name: it.name,
        qty: 1,
        price: isSales ? it.salePrice : it.costPrice,
        gstRate: 18,
        discount: 0,
      },
    ]);
    setPickerId("");
  };

  const updateLine = (idx: number, patch: Partial<BillItem>) => {
    setLines((ls) => ls.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  };
  const removeLine = (idx: number) => setLines((ls) => ls.filter((_, i) => i !== idx));

  const totals = useMemo(() => {
    let sub = 0, gst = 0, disc = 0;
    for (const l of lines) {
      const lineSub = l.price * l.qty - l.discount;
      sub += lineSub;
      gst += (lineSub * l.gstRate) / 100;
      disc += l.discount;
    }
    return { sub, gst, disc, grand: sub + gst };
  }, [lines]);

  const save = () => {
    if (!partyName) return toast.error("Select a party");
    if (lines.length === 0) return toast.error("Add at least one item");

    const bill: Bill = {
      id: `${type[0]}-${Date.now()}`,
      type,
      date: new Date().toISOString(),
      partyName,
      items: lines,
      paymentMode: isSales ? paymentMode : undefined,
      paid: isSales ? paid : true,
    };
    dispatch(addBill(bill));
    // Stock adjust: sales -> reduce, purchase -> increase
    for (const l of lines) {
      dispatch(adjustStock({ id: l.itemId, delta: isSales ? -l.qty : l.qty }));
    }
    toast.success(`${isSales ? "Sales" : "Purchase"} bill saved`);
    nav("/bills/history");
  };

  return (
    <AppLayout>
      <PageHeader
        title={isSales ? "New Sales Bill" : "New Purchase Bill"}
        description={isSales ? "Sell items to a customer" : "Record a purchase from a dealer"}
        actions={
          <Button onClick={save}><Save className="h-4 w-4" /> Save Bill</Button>
        }
      />

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="p-4 lg:col-span-2 card-elevated">
          <div className="grid sm:grid-cols-2 gap-3 mb-4">
            <Field label={isSales ? "Customer" : "Dealer"}>
              <Select value={partyName} onValueChange={setPartyName}>
                <SelectTrigger><SelectValue placeholder="Select party" /></SelectTrigger>
                <SelectContent>
                  {partyOptions.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            {isSales && (
              <Field label="Payment Mode">
                <Select value={paymentMode} onValueChange={(v) => setPaymentMode(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            )}
          </div>

          <div className="flex gap-2 mb-3">
            <Select value={pickerId} onValueChange={setPickerId}>
              <SelectTrigger className="flex-1"><SelectValue placeholder="Pick an item to add..." /></SelectTrigger>
              <SelectContent>
                {items.map((i) => (
                  <SelectItem key={i.id} value={i.id}>
                    {i.name} ({i.code}) · stock {i.stock}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={addLine}><Plus className="h-4 w-4" /> Add</Button>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="w-24">Qty</TableHead>
                  <TableHead className="w-28">Price</TableHead>
                  <TableHead className="w-24">GST%</TableHead>
                  <TableHead className="w-28">Discount</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No items added
                    </TableCell>
                  </TableRow>
                )}
                {lines.map((l, idx) => {
                  const lineSub = l.price * l.qty - l.discount;
                  const lineTotal = lineSub + (lineSub * l.gstRate) / 100;
                  return (
                    <TableRow key={l.itemId}>
                      <TableCell className="font-medium">{l.name}</TableCell>
                      <TableCell><Input type="number" value={l.qty} onChange={(e) => updateLine(idx, { qty: +e.target.value })} /></TableCell>
                      <TableCell><Input type="number" value={l.price} onChange={(e) => updateLine(idx, { price: +e.target.value })} /></TableCell>
                      <TableCell><Input type="number" value={l.gstRate} onChange={(e) => updateLine(idx, { gstRate: +e.target.value })} /></TableCell>
                      <TableCell><Input type="number" value={l.discount} onChange={(e) => updateLine(idx, { discount: +e.target.value })} /></TableCell>
                      <TableCell className="text-right font-medium">₹{lineTotal.toFixed(2)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => removeLine(idx)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>

        <Card className="p-4 card-elevated h-fit">
          <h3 className="font-semibold mb-3">Summary</h3>
          <Row label="Subtotal" value={`₹${totals.sub.toFixed(2)}`} />
          <Row label="Discount" value={`-₹${totals.disc.toFixed(2)}`} />
          <Row label="GST" value={`₹${totals.gst.toFixed(2)}`} />
          <div className="border-t my-2" />
          <Row label="Grand Total" value={`₹${totals.grand.toFixed(2)}`} bold />
          {isSales && (
            <div className="mt-4">
              <Label className="text-xs">Payment Status</Label>
              <Select value={paid ? "paid" : "unpaid"} onValueChange={(v) => setPaid(v === "paid")}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <Button className="w-full mt-4" onClick={save}>
            <Save className="h-4 w-4" /> Save Bill
          </Button>
        </Card>
      </div>
    </AppLayout>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between py-1 text-sm ${bold ? "font-semibold text-base" : ""}`}>
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}
