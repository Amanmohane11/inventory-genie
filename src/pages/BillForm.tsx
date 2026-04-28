import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert, Box, Button, Card, CardContent, Chip, Dialog, DialogActions,
  DialogContent, DialogTitle, Divider, Grid, IconButton, InputAdornment,
  List, ListItemButton, ListItemText, MenuItem, Paper, Stack, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TextField, ToggleButton,
  ToggleButtonGroup, Typography,
} from "@mui/material";
import {
  Add, Remove, Delete, Phone as PhoneIcon, Search, Description,
  ShoppingBag, ShoppingCart, Save,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { format } from "date-fns";
import { MuiLayout } from "@/components/MuiLayout";
import { useAppDispatch, useAppSelector } from "@/store";
import { addBill } from "@/store/slices/billSlice";
import { adjustStock } from "@/store/slices/itemSlice";
import { addCustomer } from "@/store/slices/partySlice";
import { Bill, BillItem } from "@/store/seedData";
import { useNotify } from "@/components/NotifyProvider";
import { useNavigate } from "react-router-dom";

type BillKind = "sales" | "purchase" | "estimate";

export default function BillForm({ type }: { type: BillKind }) {
  const nav = useNavigate();
  const dispatch = useAppDispatch();
  const notify = useNotify();

  const items = useAppSelector((s) => s.items.items);
  const customers = useAppSelector((s) => s.parties.customers);
  const dealers = useAppSelector((s) => s.parties.dealers);
  const billsCount = useAppSelector((s) => s.bills.bills.length);

  const isEstimate = type === "estimate";
  const isPurchase = type === "purchase";
  const partyList = isPurchase
    ? dealers.map((d) => ({ name: d.name, phone: d.phone, email: d.email }))
    : customers.map((c) => ({ name: c.name, phone: c.phone, email: c.email }));

  const billNumber = useMemo(() => {
    const prefix = isEstimate ? "EST" : isPurchase ? "PUR" : "INV";
    return `${prefix}-${String(billsCount + 1).padStart(5, "0")}`;
  }, [billsCount, isEstimate, isPurchase]);

  // Party state
  const [phone, setPhone] = useState("");
  const [party, setParty] = useState<{ name: string; phone: string; email?: string } | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [draftParty, setDraftParty] = useState({ name: "", phone: "", email: "" });
  const phoneRef = useRef<HTMLInputElement>(null);

  useEffect(() => { phoneRef.current?.focus(); }, []);
  // Reset party state when switching bill type
  useEffect(() => {
    setParty(null); setPhone(""); setLines([]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const phoneMatches = useMemo(() => {
    if (!phone.trim() || party) return [];
    const t = phone.trim().toLowerCase();
    return partyList.filter((p) => p.phone.includes(t) || p.name.toLowerCase().includes(t)).slice(0, 5);
  }, [phone, partyList, party]);

  const onContinue = () => {
    if (!phone.trim()) return notify("Enter phone or name", "warning");
    const found = partyList.find((p) => p.phone === phone.trim());
    if (found) {
      setParty(found);
      notify(`Welcome ${found.name}`, "success");
    } else {
      setDraftParty({ name: "", phone: phone.trim(), email: "" });
      setShowNew(true);
    }
  };

  const saveNewParty = () => {
    if (!draftParty.name.trim() || !draftParty.phone.trim()) return notify("Name and phone required", "error");
    if (!isPurchase) {
      dispatch(addCustomer({
        id: `c-${Date.now()}`,
        name: draftParty.name.trim(),
        phone: draftParty.phone.trim(),
        email: draftParty.email.trim() || undefined,
        createdAt: new Date().toISOString(),
        lastTxn: new Date().toISOString(),
        visits: 1,
        totalSpend: 0,
      }));
    }
    setParty({ name: draftParty.name, phone: draftParty.phone, email: draftParty.email || undefined });
    setShowNew(false);
    notify("Saved", "success");
  };

  // Lines
  const [lines, setLines] = useState<BillItem[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQ, setPickerQ] = useState("");

  const filteredItems = useMemo(() => {
    const q = pickerQ.trim().toLowerCase();
    return items.filter((i) => !q || i.name.toLowerCase().includes(q) || i.code.toLowerCase().includes(q));
  }, [items, pickerQ]);

  const addLine = (itemId: string) => {
    const it = items.find((x) => x.id === itemId);
    if (!it) return;
    if (lines.find((l) => l.itemId === it.id)) return notify("Already added", "warning");
    setLines((ls) => [
      ...ls,
      { itemId: it.id, name: it.name, qty: 1, price: isPurchase ? it.costPrice : it.salePrice, gstRate: 18, discount: 0 },
    ]);
    setPickerQ(""); setPickerOpen(false);
  };

  const updateLine = (idx: number, patch: Partial<BillItem>) =>
    setLines((ls) => ls.map((l, i) => (i === idx ? { ...l, ...patch } : l)));

  const removeLine = (idx: number) => setLines((ls) => ls.filter((_, i) => i !== idx));

  const incQty = (idx: number) => {
    const l = lines[idx];
    const it = items.find((x) => x.id === l.itemId);
    if (!isEstimate && !isPurchase && it && l.qty + 1 > it.stock) {
      return notify(`Only ${it.stock} in stock`, "error");
    }
    updateLine(idx, { qty: l.qty + 1 });
  };
  const decQty = (idx: number) => {
    const l = lines[idx];
    if (l.qty <= 1) return;
    updateLine(idx, { qty: l.qty - 1 });
  };

  const [notes, setNotes] = useState("");
  const [paymentMode, setPaymentMode] = useState<"upi" | "card" | "cash">("upi");
  const [expiry, setExpiry] = useState<Date | null>(null);

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

  const submit = () => {
    if (!party) return notify("Add a party first", "error");
    if (lines.length === 0) return notify("Add at least one item", "error");
    if (!isEstimate && !isPurchase) {
      for (const l of lines) {
        const it = items.find((x) => x.id === l.itemId);
        if (it && l.qty > it.stock) return notify(`${it.name}: only ${it.stock} in stock`, "error");
      }
    }
    if (isEstimate && !expiry) return notify("Pick an expiry date", "warning");

    const bill: Bill = {
      id: `${isEstimate ? "e" : isPurchase ? "p" : "s"}-${Date.now()}`,
      type: isEstimate ? "estimate" : isPurchase ? "purchase" : "sales",
      date: new Date().toISOString(),
      partyName: party.name,
      partyPhone: party.phone,
      partyEmail: party.email,
      items: lines,
      paymentMode: isEstimate ? undefined : paymentMode,
      paid: isEstimate ? false : true,
      notes: notes.trim() || undefined,
      expiryDate: isEstimate ? expiry?.toISOString() : undefined,
    };
    dispatch(addBill(bill));
    if (!isEstimate) {
      const sign = isPurchase ? 1 : -1;
      for (const l of lines) dispatch(adjustStock({ id: l.itemId, delta: sign * l.qty }));
    }
    notify(
      isEstimate ? "Estimate saved" : isPurchase ? "Purchase recorded" : "Sales bill created",
      "success",
    );
    nav("/bills/history");
  };

  const HeaderIcon = isEstimate ? Description : isPurchase ? ShoppingBag : ShoppingCart;
  const headerLabel = isEstimate ? "Estimate Bill" : isPurchase ? "Purchase Bill" : "Sales Bill";

  return (
    <MuiLayout>
      {/* Header */}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}
        sx={{ justifyContent: "space-between", alignItems: { sm: "center" }, mb: 3 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: "primary.main", color: "primary.contrastText", display: "grid", placeItems: "center" }}>
            <HeaderIcon />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>{headerLabel}</Typography>
            <Typography variant="body2" color="text.secondary">
              {isPurchase ? "Record stock received from dealer" : isEstimate ? "Quote without stock deduction" : "Fast point-of-sale workflow"}
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={1.5}>
          <Chip label={billNumber} color="primary" variant="outlined" sx={{ fontFamily: "monospace", fontWeight: 700 }} />
          <Chip label={format(new Date(), "dd MMM yyyy")} variant="outlined" />
        </Stack>
      </Stack>

      {isEstimate && (
        <Alert severity="warning" sx={{ mb: 2 }}>Estimate mode — no stock will be deducted.</Alert>
      )}

      <Grid container spacing={2}>
        {/* Left column */}
        <Grid size={{ xs: 12, lg: 8 }}>
          {/* Party */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 2 }}>
                <PhoneIcon color="primary" fontSize="small" />
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  {isPurchase ? "Dealer" : "Customer"}
                </Typography>
              </Stack>

              {party ? (
                <Paper variant="outlined" sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Box>
                    <Typography sx={{ fontWeight: 700 }}>{party.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {party.phone}{party.email ? ` · ${party.email}` : ""}
                    </Typography>
                  </Box>
                  <Button size="small" onClick={() => { setParty(null); setPhone(""); setTimeout(() => phoneRef.current?.focus(), 50); }}>
                    Change
                  </Button>
                </Paper>
              ) : (
                <Box sx={{ position: "relative" }}>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                    <TextField
                      fullWidth inputRef={phoneRef} value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && onContinue()}
                      placeholder="Search phone or name…"
                      slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> } }}
                    />
                    <Button variant="contained" onClick={onContinue} sx={{ minWidth: 120 }}>Continue</Button>
                  </Stack>
                  {phoneMatches.length > 0 && (
                    <Paper sx={{ position: "absolute", top: "100%", left: 0, right: 0, mt: 0.5, zIndex: 5 }} elevation={6}>
                      <List dense>
                        {phoneMatches.map((m) => (
                          <ListItemButton key={m.phone} onClick={() => { setParty(m); setPhone(""); }}>
                            <ListItemText primary={m.name} secondary={m.phone} />
                          </ListItemButton>
                        ))}
                      </List>
                    </Paper>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Products */}
          <Card>
            <CardContent>
              <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                  <ShoppingBag color="primary" fontSize="small" />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Products</Typography>
                </Stack>
                <Button variant="contained" startIcon={<Add />} onClick={() => setPickerOpen(true)}>Add Item</Button>
              </Stack>

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Product</TableCell>
                      <TableCell align="right">Price</TableCell>
                      <TableCell align="right">Disc</TableCell>
                      <TableCell align="right">GST%</TableCell>
                      <TableCell align="center">Qty</TableCell>
                      <TableCell align="right">Total</TableCell>
                      <TableCell />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {lines.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 6, color: "text.secondary" }}>
                          No products added — click "Add Item"
                        </TableCell>
                      </TableRow>
                    )}
                    {lines.map((l, idx) => {
                      const lineSub = l.price * l.qty - l.discount;
                      const total = lineSub + (lineSub * l.gstRate) / 100;
                      return (
                        <TableRow key={l.itemId} hover>
                          <TableCell sx={{ fontWeight: 600 }}>{l.name}</TableCell>
                          <TableCell align="right">
                            <TextField size="small" type="number" value={l.price}
                              onChange={(e) => updateLine(idx, { price: +e.target.value })}
                              sx={{ width: 90 }} />
                          </TableCell>
                          <TableCell align="right">
                            <TextField size="small" type="number" value={l.discount}
                              onChange={(e) => updateLine(idx, { discount: +e.target.value })}
                              sx={{ width: 80 }} />
                          </TableCell>
                          <TableCell align="right">
                            <TextField size="small" type="number" value={l.gstRate}
                              onChange={(e) => updateLine(idx, { gstRate: +e.target.value })}
                              sx={{ width: 70 }} />
                          </TableCell>
                          <TableCell align="center">
                            <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", justifyContent: "center" }}>
                              <IconButton size="small" onClick={() => decQty(idx)}><Remove fontSize="inherit" /></IconButton>
                              <Typography sx={{ minWidth: 24, textAlign: "center", fontWeight: 600 }}>{l.qty}</Typography>
                              <IconButton size="small" onClick={() => incQty(idx)}><Add fontSize="inherit" /></IconButton>
                            </Stack>
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>₹{total.toFixed(2)}</TableCell>
                          <TableCell align="right">
                            <IconButton size="small" color="error" onClick={() => removeLine(idx)}>
                              <Delete fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Right column */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={{ position: { lg: "sticky" }, top: { lg: 88 } }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Summary</Typography>
              <Stack spacing={1}>
                <Row label="Subtotal" value={`₹${totals.sub.toFixed(2)}`} />
                <Row label="Discount" value={`-₹${totals.disc.toFixed(2)}`} />
                <Row label="GST" value={`₹${totals.gst.toFixed(2)}`} />
                <Divider />
                <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                  <Typography sx={{ fontWeight: 700 }}>Grand Total</Typography>
                  <Typography variant="h6" color="primary" sx={{ fontWeight: 800 }}>
                    ₹{totals.grand.toFixed(2)}
                  </Typography>
                </Stack>
              </Stack>

              {!isEstimate && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" color="text.secondary">Payment Mode</Typography>
                  <ToggleButtonGroup
                    fullWidth size="small" exclusive value={paymentMode}
                    onChange={(_e, v) => v && setPaymentMode(v)}
                    sx={{ mt: 0.5 }}
                  >
                    <ToggleButton value="upi">UPI</ToggleButton>
                    <ToggleButton value="card">Card</ToggleButton>
                    <ToggleButton value="cash">Cash</ToggleButton>
                  </ToggleButtonGroup>
                </Box>
              )}

              {isEstimate && (
                <Box sx={{ mt: 2 }}>
                  <DatePicker
                    label="Expiry Date"
                    value={expiry}
                    onChange={(v) => setExpiry(v)}
                    slotProps={{ textField: { fullWidth: true, size: "small" } }}
                  />
                </Box>
              )}

              <TextField
                fullWidth multiline minRows={2} label="Notes"
                value={notes} onChange={(e) => setNotes(e.target.value)}
                sx={{ mt: 2 }}
              />

              <Button fullWidth variant="contained" size="large" startIcon={<Save />} sx={{ mt: 2 }} onClick={submit}>
                {isEstimate ? "Save Estimate" : isPurchase ? "Save Purchase" : "Create Sales Bill"}
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Item picker */}
      <Dialog open={pickerOpen} onClose={() => setPickerOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add Item</DialogTitle>
        <DialogContent dividers>
          <TextField
            autoFocus fullWidth placeholder="Search items…"
            value={pickerQ} onChange={(e) => setPickerQ(e.target.value)}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> } }}
            sx={{ mb: 2 }}
          />
          <Box sx={{ maxHeight: 360, overflowY: "auto" }}>
            <List dense>
              {filteredItems.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: "center" }}>
                  No items
                </Typography>
              )}
              {filteredItems.map((it) => (
                <ListItemButton key={it.id} onClick={() => addLine(it.id)}>
                  <ListItemText
                    primary={it.name}
                    secondary={`${it.code} · Stock ${it.stock}`}
                  />
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    ₹{isPurchase ? it.costPrice : it.salePrice}
                  </Typography>
                </ListItemButton>
              ))}
            </List>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPickerOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* New party dialog */}
      <Dialog open={showNew} onClose={() => setShowNew(false)} fullWidth maxWidth="xs">
        <DialogTitle>New {isPurchase ? "Dealer" : "Customer"}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <TextField label="Name" value={draftParty.name} onChange={(e) => setDraftParty({ ...draftParty, name: e.target.value })} autoFocus />
            <TextField label="Phone" value={draftParty.phone} onChange={(e) => setDraftParty({ ...draftParty, phone: e.target.value })} />
            <TextField label="Email" value={draftParty.email} onChange={(e) => setDraftParty({ ...draftParty, email: e.target.value })} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowNew(false)}>Cancel</Button>
          <Button variant="contained" onClick={saveNewParty}>Save</Button>
        </DialogActions>
      </Dialog>
    </MuiLayout>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" sx={{ justifyContent: "space-between" }}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>{value}</Typography>
    </Stack>
  );
}
