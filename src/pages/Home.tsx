import { useMemo, useState } from "react";
import { useAppSelector } from "@/store";
import {
  makeSelectTotals, makeSelectChart, makeSelectProductInsights, Range,
} from "@/store/selectors";
import { StatCard } from "@/components/StatCard";
import {
  IndianRupee, ShoppingCart, ShoppingBag, TrendingUp, Wallet,
  ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid,
} from "recharts";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const fmt = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

export default function Home() {
  const [range, setRange] = useState<Range>("monthly");
  const totalsSel = useMemo(() => makeSelectTotals(range), [range]);
  const chartSel = useMemo(() => makeSelectChart(range), [range]);
  const insightsSel = useMemo(() => makeSelectProductInsights(range), [range]);

  const totals = useAppSelector(totalsSel);
  const chart = useAppSelector(chartSel);
  const { top, low } = useAppSelector(insightsSel);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Overview of your business performance.
          </p>
        </div>
        <Tabs value={range} onValueChange={(v) => setRange(v as Range)}>
          <TabsList>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="yearly">Yearly</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Sales"
          value={fmt(totals.totalSales)}
          icon={<ShoppingCart className="h-5 w-5" />}
          accent="primary"
          trend={{ value: "12.4%", positive: true }}
        />
        <StatCard
          label="Total Purchase"
          value={fmt(totals.totalPurchase)}
          icon={<ShoppingBag className="h-5 w-5" />}
          accent="secondary"
          trend={{ value: "4.1%", positive: false }}
        />
        <StatCard
          label="Net Profit"
          value={fmt(totals.netProfit)}
          icon={<TrendingUp className="h-5 w-5" />}
          accent={totals.netProfit >= 0 ? "success" : "destructive"}
          trend={{ value: "8.2%", positive: totals.netProfit >= 0 }}
        />
        <StatCard
          label="Payments Received"
          value={fmt(totals.paymentsReceived)}
          icon={<Wallet className="h-5 w-5" />}
          accent="success"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Sales" subtitle="Revenue over time">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chart} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(v: number) => fmt(v)}
              />
              <Area type="monotone" dataKey="sales" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#salesGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Profit" subtitle="Sales − Purchase − Expenses (excl. GST)">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chart} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(v: number) => fmt(v)}
              />
              <Bar dataKey="profit" radius={[6, 6, 0, 0]} fill="hsl(var(--secondary))" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <InsightsCard
          title="Top Selling"
          icon={<ArrowUpRight className="h-4 w-4 text-success" />}
          rows={top}
          accent="success"
          emptyHint="No sales in this range"
        />
        <InsightsCard
          title="Low Selling"
          icon={<ArrowDownRight className="h-4 w-4 text-destructive" />}
          rows={low}
          accent="destructive"
          emptyHint="No items"
        />
      </div>
    </div>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card p-5 card-elevated">
      <div className="mb-4">
        <h3 className="font-semibold">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function InsightsCard({
  title, icon, rows, accent, emptyHint,
}: {
  title: string;
  icon: React.ReactNode;
  rows: { id: string; name: string; category: string; stock: number; qtySold: number }[];
  accent: "success" | "destructive";
  emptyHint: string;
}) {
  const badge = accent === "success" ? "bg-success-soft text-success" : "bg-destructive-soft text-destructive";
  return (
    <div className="rounded-xl border bg-card p-5 card-elevated">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">{icon}{title}</h3>
        <span className="text-xs text-muted-foreground">Top 5</span>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyHint}</p>
      ) : (
        <ul className="divide-y">
          {rows.map((r, idx) => (
            <li key={r.id} className="flex items-center gap-3 py-3">
              <span className="text-xs font-medium text-muted-foreground w-5">{idx + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{r.name}</p>
                <p className="text-xs text-muted-foreground">{r.category} · Stock {r.stock}</p>
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-md ${badge}`}>
                {r.qtySold} sold
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
