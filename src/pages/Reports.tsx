import { useMemo, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatCard } from "@/components/StatCard";
import { useAppSelector } from "@/store";
import { makeSelectTotals, Range } from "@/store/selectors";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { TrendingUp, TrendingDown, Wallet, Receipt } from "lucide-react";

export default function Reports() {
  const [range, setRange] = useState<Range>("monthly");
  const totals = useAppSelector(useMemo(() => makeSelectTotals(range), [range]));
  const items = useAppSelector((s) => s.items.items);
  const expenses = useAppSelector((s) => s.expenses.expenses);

  const fmt = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

  return (
    <AppLayout>
      <PageHeader
        title="Reports"
        description="Business overview"
        actions={
          <Tabs value={range} onValueChange={(v) => setRange(v as Range)}>
            <TabsList>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="yearly">Yearly</TabsTrigger>
            </TabsList>
          </Tabs>
        }
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Sales" value={fmt(totals.totalSales)} icon={<TrendingUp className="h-4 w-4" />} accent="primary" />
        <StatCard title="Total Purchase" value={fmt(totals.totalPurchase)} icon={<TrendingDown className="h-4 w-4" />} accent="secondary" />
        <StatCard title="Expenses" value={fmt(totals.totalExpenses)} icon={<Receipt className="h-4 w-4" />} accent="destructive" />
        <StatCard title="Net Profit" value={fmt(totals.netProfit)} icon={<Wallet className="h-4 w-4" />} accent={totals.netProfit >= 0 ? "success" : "destructive"} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-4 card-elevated">
          <h3 className="font-semibold mb-3">Stock Valuation</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead className="text-right">Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((i) => (
                <TableRow key={i.id}>
                  <TableCell>{i.name}</TableCell>
                  <TableCell className="text-right">{i.stock}</TableCell>
                  <TableCell className="text-right">{fmt(i.stock * i.costPrice)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <Card className="p-4 card-elevated">
          <h3 className="font-semibold mb-3">Recent Expenses</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.slice(0, 10).map((e) => (
                <TableRow key={e.id}>
                  <TableCell>{e.category}</TableCell>
                  <TableCell className="text-right">{fmt(e.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </AppLayout>
  );
}
