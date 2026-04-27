import { useMemo, useState } from "react";
import {
  Box, Card, CardContent, Typography, Stack, ToggleButton, ToggleButtonGroup,
  Avatar, Chip, Divider, List, ListItem, ListItemText,
} from "@mui/material";
import {
  ShoppingCart, ShoppingBag, TrendingUp, AccountBalanceWallet,
  ArrowUpward, ArrowDownward,
} from "@mui/icons-material";
import { BarChart } from "@mui/x-charts/BarChart";
import { useAppSelector } from "@/store";
import {
  makeSelectTotals, makeSelectChart, makeSelectProductInsights, Range,
} from "@/store/selectors";

const fmt = (n: number) =>
  "₹" + Math.round(n).toLocaleString("en-IN");

export default function MuiDashboard() {
  const [range, setRange] = useState<Range>("monthly");
  const totals = useAppSelector(useMemo(() => makeSelectTotals(range), [range]));
  const chart = useAppSelector(useMemo(() => makeSelectChart(range), [range]));
  const { top, low } = useAppSelector(useMemo(() => makeSelectProductInsights(range), [range]));
  const settings = useAppSelector((s) => s.settings);

  return (
    <Stack spacing={3}>
      <Box sx={{ display: "flex", alignItems: { xs: "flex-start", md: "center" }, flexDirection: { xs: "column", md: "row" }, gap: 2, justifyContent: "space-between" }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Dashboard</Typography>
          <Typography variant="body2" color="text.secondary">
            Overview of your business performance.
          </Typography>
        </Box>
        <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
          <Chip
            color="primary"
            variant="filled"
            label={`Business Register ID: ${settings.businessRegisterId}`}
            sx={{ fontWeight: 600 }}
          />
          <ToggleButtonGroup
            size="small"
            exclusive
            value={range}
            onChange={(_, v) => v && setRange(v)}
            color="primary"
          >
            <ToggleButton value="weekly">Weekly</ToggleButton>
            <ToggleButton value="monthly">Monthly</ToggleButton>
            <ToggleButton value="yearly">Yearly</ToggleButton>
          </ToggleButtonGroup>
        </Stack>
      </Box>

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" } }}>
        <StatCard label="Total Sales" value={fmt(totals.totalSales)} icon={<ShoppingCart />} trend="+12.4%" up />
        <StatCard label="Total Purchase" value={fmt(totals.totalPurchase)} icon={<ShoppingBag />} trend="-4.1%" />
        <StatCard label="Net Profit" value={fmt(totals.netProfit)} icon={<TrendingUp />} trend="+8.2%" up={totals.netProfit >= 0} />
        <StatCard label="Payments Received" value={fmt(totals.paymentsReceived)} icon={<AccountBalanceWallet />} />
      </Box>

      <Card>
        <CardContent>
          <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 1 }}>
            <Box>
              <Typography variant="h6">Sales & Profit</Typography>
              <Typography variant="caption" color="text.secondary">
                Bar chart over time
              </Typography>
            </Box>
          </Stack>
          <Box sx={{ width: "100%", height: 320 }}>
            <BarChart
              dataset={chart as any}
              xAxis={[{ scaleType: "band", dataKey: "label" }]}
              series={[
                { dataKey: "sales", label: "Sales", color: "#D32F2F" },
                { dataKey: "profit", label: "Profit", color: "#212121" },
              ]}
              height={300}
              margin={{ top: 16, right: 16, bottom: 24, left: 56 }}
              borderRadius={6}
            />
          </Box>
        </CardContent>
      </Card>

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" } }}>
        <InsightCard title="Top Selling" rows={top} positive emptyHint="No sales in this range" />
        <InsightCard title="Low Selling" rows={low} positive={false} emptyHint="No items" />
      </Box>
    </Stack>
  );
}

function StatCard({
  label, value, icon, trend, up,
}: { label: string; value: string; icon: React.ReactNode; trend?: string; up?: boolean }) {
  return (
    <Card>
      <CardContent>
        <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
          <Avatar sx={{ bgcolor: "primary.main", width: 44, height: 44 }}>{icon}</Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary">{label}</Typography>
            <Typography variant="h6" sx={{ fontWeight: 700 }} noWrap>{value}</Typography>
          </Box>
          {trend && (
            <Chip
              size="small"
              icon={up ? <ArrowUpward sx={{ fontSize: 14 }} /> : <ArrowDownward sx={{ fontSize: 14 }} />}
              label={trend}
              color={up ? "success" : "error"}
              variant="outlined"
            />
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

function InsightCard({
  title, rows, positive, emptyHint,
}: {
  title: string;
  rows: { id: string; name: string; category: string; stock: number; qtySold: number }[];
  positive: boolean;
  emptyHint: string;
}) {
  return (
    <Card>
      <CardContent>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 1 }}>
          <Typography variant="h6">{title}</Typography>
          <Typography variant="caption" color="text.secondary">Top 5</Typography>
        </Stack>
        <Divider />
        {rows.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>{emptyHint}</Typography>
        ) : (
          <List dense>
            {rows.map((r, idx) => (
              <ListItem key={r.id} disableGutters secondaryAction={
                <Chip
                  size="small"
                  label={`${r.qtySold} sold`}
                  color={positive ? "success" : "error"}
                  variant="outlined"
                />
              }>
                <Typography variant="body2" sx={{ width: 24, color: "text.secondary" }}>{idx + 1}</Typography>
                <ListItemText
                  primary={r.name}
                  secondary={`${r.category} · Stock ${r.stock}`}
                  slotProps={{ primary: { sx: { fontWeight: 600, fontSize: 14 } } }}
                />
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
}
