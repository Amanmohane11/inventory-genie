import { useMemo, useState, SyntheticEvent } from "react";
import {
  Box, Button, Card, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  IconButton, InputAdornment, Stack, Tab, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Tabs, TextField, Tooltip, Typography,
} from "@mui/material";
import {
  Search, Delete, Visibility, Receipt, SwapHoriz,
} from "@mui/icons-material";
import { MuiLayout } from "@/components/MuiLayout";
import { useAppDispatch, useAppSelector } from "@/store";
import { deleteBill, convertEstimateToSale } from "@/store/slices/billSlice";
import { adjustStock } from "@/store/slices/itemSlice";
import { Bill } from "@/store/seedData";
import { format } from "date-fns";
import { useNotify } from "@/components/NotifyProvider";

const tabs = ["all", "sales", "estimate", "purchase"] as const;
type TabKey = typeof tabs[number];

export default function BillsHistory() {
  const bills = useAppSelector((s) => s.bills.bills);
  const items = useAppSelector((s) => s.items.items);
  const dispatch = useAppDispatch();
  const notify = useNotify();
  const [tab, setTab] = useState<TabKey>("all");
  const [q, setQ] = useState("");
  const [view, setView] = useState<Bill | null>(null);
  const [confirmConvert, setConfirmConvert] = useState<Bill | null>(null);

  const doConvert = () => {
    const b = confirmConvert;
    if (!b) return;
    for (const l of b.items) {
      const it = items.find((x) => x.id === l.itemId);
      if (it && l.qty > it.stock) {
        notify(`${it.name}: only ${it.stock} in stock`, "error");
        setConfirmConvert(null);
        return;
      }
    }
    dispatch(convertEstimateToSale({ id: b.id, paymentMode: "upi" }));
    for (const l of b.items) dispatch(adjustStock({ id: l.itemId, delta: -l.qty }));
    notify("Estimate converted to sale — stock deducted", "success");
    setConfirmConvert(null);
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
    <MuiLayout>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}
        sx={{ justifyContent: "space-between", alignItems: { sm: "center" }, mb: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Bill History</Typography>
          <Typography variant="body2" color="text.secondary">{bills.length} bills total</Typography>
        </Box>
        <TextField
          size="small" placeholder="Search party or ID"
          value={q} onChange={(e) => setQ(e.target.value)}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> } }}
          sx={{ width: { xs: "100%", sm: 280 } }}
        />
      </Stack>

      <Card>
        <Tabs value={tab} onChange={(_e: SyntheticEvent, v: TabKey) => setTab(v)} sx={{ px: 2, borderBottom: 1, borderColor: "divider" }}>
          <Tab value="all" label="All" />
          <Tab value="sales" label="Sales" />
          <Tab value="estimate" label="Estimate" />
          <Tab value="purchase" label="Purchase" />
          <Tab value="return" label="Return" />
        </Tabs>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Bill #</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Party</TableCell>
                <TableCell align="right">Items</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6, color: "text.secondary" }}>
                    <Receipt sx={{ fontSize: 36, opacity: 0.4, display: "block", mx: "auto", mb: 1 }} />
                    No bills
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((b) => (
                <TableRow key={b.id} hover>
                  <TableCell sx={{ fontFamily: "monospace", fontSize: 12 }}>{b.id}</TableCell>
                  <TableCell>{format(new Date(b.date), "dd MMM yy")}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={b.type}
                      color={b.type === "sales" ? "primary" : b.type === "estimate" ? "warning" : "default"}
                      variant={b.type === "purchase" ? "outlined" : "filled"}
                      sx={{ textTransform: "capitalize" }}
                    />
                  </TableCell>
                  <TableCell>{b.partyName}</TableCell>
                  <TableCell align="right">{b.items.length}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>₹{total(b).toFixed(2)}</TableCell>
                  <TableCell>
                    {b.type === "sales"
                      ? <Chip size="small" color={b.paid ? "success" : "error"} label={b.paid ? "Paid" : "Unpaid"} />
                      : b.type === "estimate"
                        ? <Chip size="small" color="warning" variant="outlined" label="Estimate" />
                        : <Chip size="small" variant="outlined" label="—" />}
                  </TableCell>
                  <TableCell align="right">
                    {b.type === "estimate" && (
                      <Tooltip title="Convert to original (sales) bill">
                        <Button
                          size="small"
                          variant="outlined"
                          color="success"
                          startIcon={<SwapHoriz />}
                          onClick={() => setConfirmConvert(b)}
                          sx={{ mr: 1 }}
                        >
                          Convert
                        </Button>
                      </Tooltip>
                    )}
                    <Tooltip title="View">
                      <IconButton size="small" onClick={() => setView(b)}>
                        <Visibility fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error"
                        onClick={() => { dispatch(deleteBill(b.id)); notify("Bill deleted", "info"); }}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={!!view} onClose={() => setView(null)} fullWidth maxWidth="md">
        <DialogTitle>Bill {view?.id}</DialogTitle>
        <DialogContent dividers>
          {view && (
            <>
              <Stack direction="row" spacing={3} sx={{ mb: 2, flexWrap: "wrap" }}>
                <Info label="Party" value={view.partyName} />
                <Info label="Date" value={format(new Date(view.date), "PPP")} />
                <Info label="Type" value={view.type} />
                {view.paymentMode && <Info label="Payment" value={view.paymentMode} />}
              </Stack>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Item</TableCell>
                    <TableCell align="right">Qty</TableCell>
                    <TableCell align="right">Price</TableCell>
                    <TableCell align="right">GST</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {view.items.map((l, i) => {
                    const sub = l.price * l.qty - l.discount;
                    const tot = sub + (sub * l.gstRate) / 100;
                    return (
                      <TableRow key={i}>
                        <TableCell>{l.name}</TableCell>
                        <TableCell align="right">{l.qty}</TableCell>
                        <TableCell align="right">₹{l.price}</TableCell>
                        <TableCell align="right">{l.gstRate}%</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>₹{tot.toFixed(2)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <Typography variant="h6" sx={{ textAlign: "right", mt: 2 }}>
                Total: ₹{total(view).toFixed(2)}
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setView(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!confirmConvert} onClose={() => setConfirmConvert(null)} fullWidth maxWidth="xs">
        <DialogTitle>Convert estimate to sales bill?</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2">
            This will convert <b>{confirmConvert?.id}</b> ({confirmConvert?.partyName}) into a final
            Sales Bill. Inventory will be deducted and it will appear in Sales Bill history.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmConvert(null)}>Cancel</Button>
          <Button variant="contained" color="success" onClick={doConvert}>Confirm Convert</Button>
        </DialogActions>
      </Dialog>
    </MuiLayout>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 600, textTransform: "capitalize" }}>{value}</Typography>
    </Box>
  );
}
