import { useMemo, useState } from "react";
import {
  Box, Button, Card, CardContent, Chip, Stack, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, ToggleButton, ToggleButtonGroup,
  Typography, Grid, Avatar,
} from "@mui/material";
import {
  TrendingUp, TrendingDown, AccountBalanceWallet, Receipt, PictureAsPdf,
} from "@mui/icons-material";
import jsPDF from "jspdf";
import { MuiLayout } from "@/components/MuiLayout";
import { useAppSelector } from "@/store";
import { makeSelectTotals, Range } from "@/store/selectors";
import { useNotify } from "@/components/NotifyProvider";

const fmt = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

export default function Reports() {
  const [range, setRange] = useState<Range>("monthly");
  const totals = useAppSelector(useMemo(() => makeSelectTotals(range), [range]));
  const items = useAppSelector((s) => s.items.items);
  const expenses = useAppSelector((s) => s.expenses.expenses);
  const settings = useAppSelector((s) => s.settings);
  const notify = useNotify();

  const downloadPdf = () => {
    const doc = new jsPDF();
    let y = 15;
    doc.setFontSize(16); doc.setFont("helvetica", "bold");
    doc.text(`${settings.businessName} — Business Report`, 14, y); y += 8;
    doc.setFont("helvetica", "normal"); doc.setFontSize(10);
    doc.text(`Range: ${range} · Generated: ${new Date().toLocaleString()}`, 14, y); y += 10;

    doc.setFontSize(12); doc.setFont("helvetica", "bold");
    doc.text("Summary", 14, y); y += 6;
    doc.setFont("helvetica", "normal"); doc.setFontSize(10);
    [
      ["Total Sales", fmt(totals.totalSales)],
      ["Total Purchase", fmt(totals.totalPurchase)],
      ["Expenses", fmt(totals.totalExpenses)],
      ["Net Profit", fmt(totals.netProfit)],
      ["Payments Received", fmt(totals.paymentsReceived)],
    ].forEach(([k, v]) => { doc.text(`${k}: ${v}`, 18, y); y += 5; });
    y += 4;

    doc.setFont("helvetica", "bold"); doc.setFontSize(12);
    doc.text("Stock Valuation", 14, y); y += 6;
    doc.setFont("helvetica", "normal"); doc.setFontSize(10);
    items.slice(0, 25).forEach((i) => {
      if (y > 280) { doc.addPage(); y = 15; }
      doc.text(`${i.name} — Stock ${i.stock} — ${fmt(i.stock * i.costPrice)}`, 18, y); y += 5;
    });

    doc.save(`report-${range}-${Date.now()}.pdf`);
    notify("PDF downloaded", "success");
  };

  return (
    <MuiLayout>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}
        sx={{ justifyContent: "space-between", alignItems: { sm: "center" }, mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Reports</Typography>
          <Typography variant="body2" color="text.secondary">Business performance overview</Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <ToggleButtonGroup size="small" exclusive value={range} onChange={(_e, v) => v && setRange(v)} color="primary">
            <ToggleButton value="weekly">Weekly</ToggleButton>
            <ToggleButton value="monthly">Monthly</ToggleButton>
            <ToggleButton value="yearly">Yearly</ToggleButton>
          </ToggleButtonGroup>
          <Button variant="contained" startIcon={<PictureAsPdf />} onClick={downloadPdf}>Download PDF</Button>
        </Stack>
      </Stack>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <KPI label="Total Sales" value={fmt(totals.totalSales)} icon={<TrendingUp />} color="primary" />
        <KPI label="Total Purchase" value={fmt(totals.totalPurchase)} icon={<TrendingDown />} color="warning" />
        <KPI label="Expenses" value={fmt(totals.totalExpenses)} icon={<Receipt />} color="error" />
        <KPI label="Net Profit" value={fmt(totals.netProfit)} icon={<AccountBalanceWallet />} color={totals.netProfit >= 0 ? "success" : "error"} />
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Stock Valuation</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Item</TableCell>
                      <TableCell align="right">Stock</TableCell>
                      <TableCell align="right">Value</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.map((i) => (
                      <TableRow key={i.id} hover>
                        <TableCell>{i.name}</TableCell>
                        <TableCell align="right">{i.stock}</TableCell>
                        <TableCell align="right">{fmt(i.stock * i.costPrice)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Recent Expenses</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Category</TableCell>
                      <TableCell align="right">Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {expenses.slice(0, 12).map((e) => (
                      <TableRow key={e.id} hover>
                        <TableCell><Chip size="small" label={e.category} variant="outlined" /></TableCell>
                        <TableCell align="right">{fmt(e.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </MuiLayout>
  );
}

function KPI({
  label, value, icon, color,
}: { label: string; value: string; icon: React.ReactNode; color: "primary" | "warning" | "success" | "error" }) {
  return (
    <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
      <Card>
        <CardContent>
          <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
            <Avatar sx={{ bgcolor: `${color}.main` }}>{icon}</Avatar>
            <Box>
              <Typography variant="caption" color="text.secondary">{label}</Typography>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>{value}</Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Grid>
  );
}
