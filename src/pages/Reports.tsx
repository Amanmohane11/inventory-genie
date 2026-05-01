import { useMemo, useState } from "react";
import {
  Box, Button, Card, CardContent, Chip, Stack, Tab, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Tabs, TextField, Typography, Grid,
} from "@mui/material";
import { PictureAsPdf, GridOn } from "@mui/icons-material";
import { format, parseISO, startOfMonth, endOfMonth, isAfter, isBefore } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { MuiLayout } from "@/components/MuiLayout";
import { useAppSelector } from "@/store";
import { useNotify } from "@/components/NotifyProvider";

const fmt = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

function billTotal(b: { items: { qty: number; price: number; gstRate: number; discount: number }[] }) {
  return b.items.reduce((sum, it) => {
    const sub = it.qty * it.price - (it.discount || 0);
    return sum + sub + sub * (it.gstRate || 0) / 100;
  }, 0);
}

function billGst(b: { items: { qty: number; price: number; gstRate: number; discount: number }[] }) {
  return b.items.reduce((sum, it) => {
    const sub = it.qty * it.price - (it.discount || 0);
    return sum + sub * (it.gstRate || 0) / 100;
  }, 0);
}

function inRange(dateIso: string, start?: string, end?: string) {
  const d = parseISO(dateIso);
  if (start && isBefore(d, parseISO(start))) return false;
  if (end && isAfter(d, parseISO(end + "T23:59:59"))) return false;
  return true;
}

function todayStr() { return format(new Date(), "yyyy-MM-dd"); }

export default function Reports() {
  const [tab, setTab] = useState(0);
  const bills = useAppSelector((s) => s.bills.bills);
  const expenses = useAppSelector((s) => s.expenses.expenses);
  const settings = useAppSelector((s) => s.settings);
  const notify = useNotify();

  // ---- date filters per tab ----
  const [salesStart, setSalesStart] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [salesEnd, setSalesEnd] = useState(todayStr());
  const [purchaseStart, setPurchaseStart] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [purchaseEnd, setPurchaseEnd] = useState(todayStr());
  const [plMonth, setPlMonth] = useState(format(new Date(), "yyyy-MM"));

  const sales = useMemo(
    () => bills.filter((b) => b.type === "sales" && inRange(b.date, salesStart, salesEnd))
      .sort((a, b) => +new Date(b.date) - +new Date(a.date)),
    [bills, salesStart, salesEnd],
  );
  const purchases = useMemo(
    () => bills.filter((b) => b.type === "purchase" && inRange(b.date, purchaseStart, purchaseEnd))
      .sort((a, b) => +new Date(b.date) - +new Date(a.date)),
    [bills, purchaseStart, purchaseEnd],
  );

  const pl = useMemo(() => {
    const monthStart = startOfMonth(parseISO(plMonth + "-01"));
    const monthEnd = endOfMonth(monthStart);
    const within = (d: string) => {
      const dt = parseISO(d);
      return !isBefore(dt, monthStart) && !isAfter(dt, monthEnd);
    };
    const salesB = bills.filter((b) => b.type === "sales" && within(b.date));
    const purchB = bills.filter((b) => b.type === "purchase" && within(b.date));
    const exp = expenses.filter((e) => within(e.date));

    const salesTotal = salesB.reduce((s, b) => s + billTotal(b), 0);
    const purchaseTotal = purchB.reduce((s, b) => s + billTotal(b), 0);
    const expensesTotal = exp.reduce((s, e) => s + e.amount, 0);
    const totalSpending = purchaseTotal + expensesTotal;
    const totalProfit = salesTotal - totalSpending;

    const incomeBy = new Map<string, number>();
    salesB.forEach((b) => incomeBy.set(b.partyName || "Walk-in",
      (incomeBy.get(b.partyName || "Walk-in") ?? 0) + billTotal(b)));

    const spendBy = new Map<string, number>();
    purchB.forEach((b) => spendBy.set(`Purchase: ${b.partyName || "Vendor"}`,
      (spendBy.get(`Purchase: ${b.partyName || "Vendor"}`) ?? 0) + billTotal(b)));
    exp.forEach((e) => spendBy.set(e.category, (spendBy.get(e.category) ?? 0) + e.amount));

    return {
      salesTotal, purchaseTotal, expensesTotal, totalSpending, totalProfit,
      income: Array.from(incomeBy.entries()).sort((a, b) => b[1] - a[1]),
      spending: Array.from(spendBy.entries()).sort((a, b) => b[1] - a[1]),
    };
  }, [bills, expenses, plMonth]);

  // ---- exporters ----
  const exportSalesPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(14); doc.setFont("helvetica", "bold");
    doc.text(`${settings.businessName} — Sales Report`, 14, 14);
    doc.setFont("helvetica", "normal"); doc.setFontSize(9);
    doc.text(`Period: ${salesStart} → ${salesEnd}`, 14, 21);

    autoTable(doc, {
      startY: 26,
      head: [["Date", "Bill #", "Customer", "Items", "GST", "Total"]],
      body: sales.map((b) => [
        format(parseISO(b.date), "dd-MM-yy"),
        b.id,
        b.partyName || "Walk-in",
        String(b.items.length),
        fmt(billGst(b)),
        fmt(billTotal(b)),
      ]),
      foot: [["", "", "", "Total", fmt(sales.reduce((s, b) => s + billGst(b), 0)),
        fmt(sales.reduce((s, b) => s + billTotal(b), 0))]],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [245, 180, 0], textColor: 0 },
      footStyles: { fillColor: [255, 251, 234], textColor: 0, fontStyle: "bold" },
    });
    doc.save(`sales-report-${salesStart}-to-${salesEnd}.pdf`);
    notify("Sales PDF downloaded", "success");
  };

  const exportSalesXlsx = () => {
    const rows = sales.map((b) => ({
      Date: format(parseISO(b.date), "yyyy-MM-dd"),
      "Bill #": b.id,
      Customer: b.partyName || "Walk-in",
      Phone: b.partyPhone || "",
      Items: b.items.length,
      GST: Math.round(billGst(b)),
      Total: Math.round(billTotal(b)),
      "Payment Mode": b.paymentMode || "",
      Paid: b.paid ? "Yes" : "No",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sales");
    XLSX.writeFile(wb, `sales-report-${salesStart}-to-${salesEnd}.xlsx`);
    notify("Sales Excel downloaded", "success");
  };

  const exportPurchasePdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(14); doc.setFont("helvetica", "bold");
    doc.text(`${settings.businessName} — Purchase Report`, 14, 14);
    doc.setFont("helvetica", "normal"); doc.setFontSize(9);
    doc.text(`Period: ${purchaseStart} → ${purchaseEnd}`, 14, 21);

    const body: (string | number)[][] = [];
    purchases.forEach((b) => {
      b.items.forEach((it) => {
        const sub = it.qty * it.price - (it.discount || 0);
        body.push([
          format(parseISO(b.date), "dd-MM-yy"),
          b.partyName || "Vendor",
          it.name, String(it.qty),
          fmt(it.price), fmt(sub * (it.gstRate || 0) / 100),
          fmt(sub + sub * (it.gstRate || 0) / 100),
        ]);
      });
    });
    autoTable(doc, {
      startY: 26,
      head: [["Date", "Vendor", "Item", "Qty", "Rate", "GST", "Amount"]],
      body,
      foot: [["", "", "", "", "Total",
        fmt(purchases.reduce((s, b) => s + billGst(b), 0)),
        fmt(purchases.reduce((s, b) => s + billTotal(b), 0))]],
      styles: { fontSize: 8 },
      headStyles: { fillColor: [245, 180, 0], textColor: 0 },
      footStyles: { fillColor: [255, 251, 234], textColor: 0, fontStyle: "bold" },
    });
    doc.save(`purchase-report-${purchaseStart}-to-${purchaseEnd}.pdf`);
    notify("Purchase PDF downloaded", "success");
  };

  const exportPurchaseXlsx = () => {
    const rows: Record<string, string | number>[] = [];
    purchases.forEach((b) => {
      b.items.forEach((it) => {
        const sub = it.qty * it.price - (it.discount || 0);
        rows.push({
          Date: format(parseISO(b.date), "yyyy-MM-dd"),
          Vendor: b.partyName || "Vendor",
          "Bill #": b.billNo || b.id,
          Item: it.name, Qty: it.qty, Rate: it.price,
          GST: Math.round(sub * (it.gstRate || 0) / 100),
          Amount: Math.round(sub + sub * (it.gstRate || 0) / 100),
        });
      });
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Purchases");
    XLSX.writeFile(wb, `purchase-report-${purchaseStart}-to-${purchaseEnd}.xlsx`);
    notify("Purchase Excel downloaded", "success");
  };

  const exportPlPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(14); doc.setFont("helvetica", "bold");
    doc.text(`${settings.businessName} — Profit & Loss`, 14, 14);
    doc.setFont("helvetica", "normal"); doc.setFontSize(9);
    doc.text(`Month: ${plMonth}`, 14, 21);

    autoTable(doc, {
      startY: 26,
      head: [["Summary", "Amount"]],
      body: [
        ["Total Sales", fmt(pl.salesTotal)],
        ["Total Purchase", fmt(pl.purchaseTotal)],
        ["Other Expenses", fmt(pl.expensesTotal)],
        ["Total Spending", fmt(pl.totalSpending)],
        ["Total Profit", fmt(pl.totalProfit)],
      ],
      headStyles: { fillColor: [245, 180, 0], textColor: 0 },
    });

    autoTable(doc, {
      head: [["Income Source", "Amount"]],
      body: pl.income.map(([k, v]) => [k, fmt(v)]),
      headStyles: { fillColor: [245, 180, 0], textColor: 0 },
    });
    autoTable(doc, {
      head: [["Spending Source", "Amount"]],
      body: pl.spending.map(([k, v]) => [k, fmt(v)]),
      headStyles: { fillColor: [245, 180, 0], textColor: 0 },
    });
    doc.save(`pl-${plMonth}.pdf`);
    notify("P&L PDF downloaded", "success");
  };

  const exportPlXlsx = () => {
    const wb = XLSX.utils.book_new();
    const summary = [
      { Metric: "Total Sales", Amount: Math.round(pl.salesTotal) },
      { Metric: "Total Purchase", Amount: Math.round(pl.purchaseTotal) },
      { Metric: "Other Expenses", Amount: Math.round(pl.expensesTotal) },
      { Metric: "Total Spending", Amount: Math.round(pl.totalSpending) },
      { Metric: "Total Profit", Amount: Math.round(pl.totalProfit) },
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summary), "Summary");
    XLSX.utils.book_append_sheet(wb,
      XLSX.utils.json_to_sheet(pl.income.map(([k, v]) => ({ Source: k, Amount: Math.round(v) }))),
      "Income");
    XLSX.utils.book_append_sheet(wb,
      XLSX.utils.json_to_sheet(pl.spending.map(([k, v]) => ({ Source: k, Amount: Math.round(v) }))),
      "Spending");
    XLSX.writeFile(wb, `pl-${plMonth}.xlsx`);
    notify("P&L Excel downloaded", "success");
  };

  return (
    <MuiLayout>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}
        sx={{ justifyContent: "space-between", alignItems: { sm: "center" }, mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Reports</Typography>
          <Typography variant="body2" color="text.secondary">
            P&L, Sales and Purchase with filters and exports
          </Typography>
        </Box>
      </Stack>

      <Card>
        <Tabs value={tab} onChange={(_e, v) => setTab(v)} sx={{ px: 2, borderBottom: 1, borderColor: "divider" }}>
          <Tab label="Profit & Loss" />
          <Tab label="Sales" />
          <Tab label="Purchase" />
        </Tabs>

        {/* P&L */}
        {tab === 0 && (
          <Box sx={{ p: 2 }}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}
              sx={{ alignItems: { sm: "center" }, justifyContent: "space-between", mb: 2 }}>
              <TextField type="month" label="Month" value={plMonth}
                onChange={(e) => setPlMonth(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }} sx={{ minWidth: 200 }} />
              <Stack direction="row" spacing={1}>
                <Button variant="outlined" startIcon={<PictureAsPdf />} onClick={exportPlPdf}>PDF</Button>
                <Button variant="contained" startIcon={<GridOn />} onClick={exportPlXlsx}>Excel</Button>
              </Stack>
            </Stack>

            <Grid container spacing={2} sx={{ mb: 2 }}>
              <SummaryCard label="Total Sales" value={fmt(pl.salesTotal)} color="success.main" />
              <SummaryCard label="Total Spending" value={fmt(pl.totalSpending)} color="error.main" />
              <SummaryCard label="Total Profit" value={fmt(pl.totalProfit)}
                color={pl.totalProfit >= 0 ? "success.main" : "error.main"} />
            </Grid>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Income Sources</Typography>
                    <SimpleList rows={pl.income} />
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Spending Sources</Typography>
                    <SimpleList rows={pl.spending} />
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Sales */}
        {tab === 1 && (
          <Box sx={{ p: 2 }}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}
              sx={{ alignItems: { sm: "center" }, justifyContent: "space-between", mb: 2 }}>
              <Stack direction="row" spacing={1.5}>
                <TextField type="date" label="Start" value={salesStart}
                  onChange={(e) => setSalesStart(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }} />
                <TextField type="date" label="End" value={salesEnd}
                  onChange={(e) => setSalesEnd(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }} />
              </Stack>
              <Stack direction="row" spacing={1}>
                <Button variant="outlined" startIcon={<PictureAsPdf />} onClick={exportSalesPdf}>PDF</Button>
                <Button variant="contained" startIcon={<GridOn />} onClick={exportSalesXlsx}>Excel</Button>
              </Stack>
            </Stack>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Bill</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell align="right">Items</TableCell>
                    <TableCell align="right">GST</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell>Payment</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sales.length === 0 && (
                    <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: "text.secondary" }}>
                      No sales in selected range
                    </TableCell></TableRow>
                  )}
                  {sales.map((b) => (
                    <TableRow key={b.id} hover>
                      <TableCell>{format(parseISO(b.date), "dd MMM yy")}</TableCell>
                      <TableCell>{b.id}</TableCell>
                      <TableCell>{b.partyName || "Walk-in"}</TableCell>
                      <TableCell align="right">{b.items.length}</TableCell>
                      <TableCell align="right">{fmt(billGst(b))}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>{fmt(billTotal(b))}</TableCell>
                      <TableCell>{b.paymentMode ? <Chip size="small" label={b.paymentMode} /> : "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Purchase */}
        {tab === 2 && (
          <Box sx={{ p: 2 }}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}
              sx={{ alignItems: { sm: "center" }, justifyContent: "space-between", mb: 2 }}>
              <Stack direction="row" spacing={1.5}>
                <TextField type="date" label="Start" value={purchaseStart}
                  onChange={(e) => setPurchaseStart(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }} />
                <TextField type="date" label="End" value={purchaseEnd}
                  onChange={(e) => setPurchaseEnd(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }} />
              </Stack>
              <Stack direction="row" spacing={1}>
                <Button variant="outlined" startIcon={<PictureAsPdf />} onClick={exportPurchasePdf}>PDF</Button>
                <Button variant="contained" startIcon={<GridOn />} onClick={exportPurchaseXlsx}>Excel</Button>
              </Stack>
            </Stack>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Vendor</TableCell>
                    <TableCell>Bill #</TableCell>
                    <TableCell align="right">Items</TableCell>
                    <TableCell align="right">GST Paid</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {purchases.length === 0 && (
                    <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: "text.secondary" }}>
                      No purchases in selected range
                    </TableCell></TableRow>
                  )}
                  {purchases.map((b) => (
                    <TableRow key={b.id} hover>
                      <TableCell>{format(parseISO(b.date), "dd MMM yy")}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{b.partyName || "Vendor"}</TableCell>
                      <TableCell>{b.billNo || b.id}</TableCell>
                      <TableCell align="right">{b.items.length}</TableCell>
                      <TableCell align="right">{fmt(billGst(b))}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>{fmt(billTotal(b))}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </Card>
    </MuiLayout>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <Grid size={{ xs: 12, sm: 4 }}>
      <Card variant="outlined">
        <CardContent>
          <Typography variant="caption" color="text.secondary">{label}</Typography>
          <Typography variant="h5" sx={{ fontWeight: 800, color }}>{value}</Typography>
        </CardContent>
      </Card>
    </Grid>
  );
}

function SimpleList({ rows }: { rows: [string, number][] }) {
  if (rows.length === 0) return <Typography variant="body2" color="text.secondary">No data</Typography>;
  return (
    <Stack divider={<Box sx={{ height: 1, bgcolor: "divider" }} />}>
      {rows.map(([k, v]) => (
        <Stack key={k} direction="row" sx={{ justifyContent: "space-between", py: 0.75 }}>
          <Typography variant="body2">{k}</Typography>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>{fmt(v)}</Typography>
        </Stack>
      ))}
    </Stack>
  );
}
