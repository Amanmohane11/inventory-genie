import { useMemo, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Search, Trash2, Eye, Receipt, ArrowRightLeft } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store";
import { deleteBill, convertEstimateToSale } from "@/store/slices/billSlice";
import { adjustStock } from "@/store/slices/itemSlice";
import { Bill } from "@/store/seedData";
import { format } from "date-fns";
import { toast } from "sonner";

export default function BillsHistory() {
  const bills = useAppSelector((s) => s.bills.bills);
  const items = useAppSelector((s) => s.items.items);
  const dispatch = useAppDispatch();
  const [tab, setTab] = useState<"all" | "sales" | "purchase" | "estimate">("all");
  const [q, setQ] = useState("");
  const [view, setView] = useState<Bill | null>(null);

  const handleConvert = (b: Bill) => {
    for (const l of b.items) {
      const it = items.find((x) => x.id === l.itemId);
      if (it && l.qty > it.stock) {
        toast.error(`${it.name}: only ${it.stock} in stock`);
        return;
      }
    }
    dispatch(convertEstimateToSale({ id: b.id, paymentMode: "upi" }));
    for (const l of b.items) dispatch(adjustStock({ id: l.itemId, delta: -l.qty }));
    toast.success("Estimate converted to sale");
  };

  const filtered = useMemo(() => {
    let list = bills;
    if (tab !== "all") list = list.filter((b) => b.type === tab);
    const t = q.trim().toLowerCase();
    if (t) list = list.filter((b) => b.partyName.toLowerCase().includes(t) || b.id.toLowerCase().includes(t));
    return list.slice(0, 200);
  }, [bills, tab, q]);

  const total = (b: Bill) =>
    b.items.reduce((acc, l) => {
      const sub = l.price * l.qty - l.discount;
      return acc + sub + (sub * l.gstRate) / 100;
    }, 0);

  return (
    <AppLayout>
      <PageHeader title="Bill History" description={`${bills.length} bills total`} />

      <Card className="p-4 card-elevated">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="sales">Sales</TabsTrigger>
              <TabsTrigger value="estimate">Estimate</TabsTrigger>
              <TabsTrigger value="purchase">Purchase</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex items-center gap-2 border rounded-md px-2 bg-card">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search party or ID"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="border-0 shadow-none focus-visible:ring-0 px-0 w-56"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bill #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Party</TableHead>
                <TableHead className="text-right">Items</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    <Receipt className="h-8 w-8 mx-auto mb-2 opacity-50" /> No bills
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-mono text-xs">{b.id}</TableCell>
                  <TableCell>{format(new Date(b.date), "dd MMM yy")}</TableCell>
                  <TableCell>
                    <Badge
                      variant={b.type === "sales" ? "default" : b.type === "estimate" ? "outline" : "secondary"}
                      className={`capitalize ${b.type === "estimate" ? "border-warning text-warning" : ""}`}
                    >
                      {b.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{b.partyName}</TableCell>
                  <TableCell className="text-right">{b.items.length}</TableCell>
                  <TableCell className="text-right font-medium">₹{total(b).toFixed(2)}</TableCell>
                  <TableCell>
                    {b.type === "sales" ? (
                      b.paid ? (
                        <Badge className="bg-success text-success-foreground hover:bg-success/90">Paid</Badge>
                      ) : (
                        <Badge variant="destructive">Unpaid</Badge>
                      )
                    ) : b.type === "estimate" ? (
                      <Badge variant="outline" className="border-warning text-warning">Estimate</Badge>
                    ) : (
                      <Badge variant="outline">—</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {b.type === "estimate" && (
                      <Button
                        variant="ghost" size="icon" title="Convert to sale"
                        onClick={() => handleConvert(b)}
                      >
                        <ArrowRightLeft className="h-4 w-4 text-success" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => setView(b)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost" size="icon"
                      onClick={() => { dispatch(deleteBill(b.id)); toast.success("Bill deleted"); }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={!!view} onOpenChange={(o) => !o && setView(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Bill {view?.id}</DialogTitle></DialogHeader>
          {view && (
            <div>
              <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                <div><span className="text-muted-foreground">Party:</span> {view.partyName}</div>
                <div><span className="text-muted-foreground">Date:</span> {format(new Date(view.date), "PPP")}</div>
                <div><span className="text-muted-foreground">Type:</span> {view.type}</div>
                {view.paymentMode && <div><span className="text-muted-foreground">Payment:</span> {view.paymentMode}</div>}
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">GST</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {view.items.map((l, i) => {
                    const sub = l.price * l.qty - l.discount;
                    const tot = sub + (sub * l.gstRate) / 100;
                    return (
                      <TableRow key={i}>
                        <TableCell>{l.name}</TableCell>
                        <TableCell className="text-right">{l.qty}</TableCell>
                        <TableCell className="text-right">₹{l.price}</TableCell>
                        <TableCell className="text-right">{l.gstRate}%</TableCell>
                        <TableCell className="text-right font-medium">₹{tot.toFixed(2)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <div className="text-right mt-3 font-semibold text-lg">
                Total: ₹{total(view).toFixed(2)}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
