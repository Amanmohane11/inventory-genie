import { useEffect, useMemo, useRef, useState, KeyboardEvent } from "react";
import {
  Alert, Autocomplete, Box, Button, Card, CardContent, Chip, Divider, Grid,
  IconButton, InputAdornment, List, ListItemButton, ListItemText, Paper, Stack,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField,
  ToggleButton, ToggleButtonGroup, Typography,
} from "@mui/material";
import {
  Delete, Phone as PhoneIcon, Search, Description, ShoppingBag, ShoppingCart,
  AssignmentReturn, Save,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { format } from "date-fns";
import { MuiLayout } from "@/components/MuiLayout";
import { useAppDispatch, useAppSelector } from "@/store";
import { addBill, updateBill } from "@/store/slices/billSlice";
import { adjustStock } from "@/store/slices/itemSlice";
import { addCustomer } from "@/store/slices/partySlice";
import { Bill, BillItem, Item } from "@/store/seedData";
import { useNotify } from "@/components/NotifyProvider";
import { useNavigate, useParams } from "react-router-dom";

type BillKind = "sales" | "purchase" | "estimate" | "return";

type Row = BillItem & {
  _key: string;
  productInput: string;
};

const newRow = (): Row => ({
  _key: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  itemId: "",
  name: "",
  qty: 1,
  price: 0,
  gstRate: 18,
  discount: 0,
  unit: "pcs",
  mrp: 0,
  hsn: "",
  batchNo: "",
  expiry: "",
  free: 0,
  productInput: "",
});

export default function BillForm({ type }: { type: BillKind }) {
  const nav = useNavigate();
  const dispatch = useAppDispatch();
  const notify = useNotify();
  const { id: editId } = useParams<{ id?: string }>();

  const items = useAppSelector((s) => s.items.items);
  const customers = useAppSelector((s) => s.parties.customers);
  const dealers = useAppSelector((s) => s.parties.dealers);
  const billsCount = useAppSelector((s) => s.bills.bills.length);
  const existingBill = useAppSelector((s) =>
    editId ? s.bills.bills.find((b) => b.id === editId) : undefined,
  );
  const isEdit = Boolean(editId && existingBill);

  const isEstimate = type === "estimate";
  const isPurchase = type === "purchase";
  const isReturn = type === "return";
  const isSalesLike = type === "sales" || isReturn || isEstimate;

  const billNumber = useMemo(() => {
    if (isEdit && existingBill) return existingBill.billNo || existingBill.id;
    const prefix = isEstimate ? "EST" : isPurchase ? "PUR" : isReturn ? "RET" : "INV";
    return `${prefix}-${String(billsCount + 1).padStart(5, "0")}`;
  }, [billsCount, isEstimate, isPurchase, isReturn, isEdit, existingBill]);

  // -------- Customer (sales/estimate/return) --------
  const [phone, setPhone] = useState("");
  const [party, setParty] = useState<{ name: string; phone: string; email?: string } | null>(null);
  const [draftParty, setDraftParty] = useState({ name: "", email: "", address: "" });
  const phoneRef = useRef<HTMLInputElement>(null);

  useEffect(() => { phoneRef.current?.focus(); }, []);
  useEffect(() => {
    setParty(null); setPhone(""); setRows([newRow()]);
    setDealer(null); setBillNo(""); setBillDate(new Date());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  // Auto-fetch on phone change (no Continue button)
  useEffect(() => {
    if (isPurchase) return;
    const t = phone.trim();
    if (!t) { setParty(null); return; }
    const found = customers.find((c) => c.phone === t);
    if (found) {
      setParty({ name: found.name, phone: found.phone, email: found.email });
    } else {
      setParty(null);
    }
  }, [phone, customers, isPurchase]);

  const commitNewCustomer = () => {
    const t = phone.trim();
    if (!t || !draftParty.name.trim()) return;
    dispatch(addCustomer({
      id: `c-${Date.now()}`,
      name: draftParty.name.trim(),
      phone: t,
      email: draftParty.email.trim() || undefined,
      address: draftParty.address.trim() || undefined,
      createdAt: new Date().toISOString(),
      lastTxn: new Date().toISOString(),
      visits: 1,
      totalSpend: 0,
    }));
    setParty({ name: draftParty.name.trim(), phone: t, email: draftParty.email.trim() || undefined });
    notify("Customer saved", "success");
  };

  // -------- Dealer (purchase) --------
  const [dealer, setDealer] = useState<typeof dealers[number] | null>(null);
  const [billNo, setBillNo] = useState("");
  const [billDate, setBillDate] = useState<Date | null>(new Date());

  // -------- Rows --------
  const [rows, setRows] = useState<Row[]>([newRow()]);

  // Prefill when editing an existing bill (sales OR purchase)
  useEffect(() => {
    if (!isEdit || !existingBill) return;
    if (existingBill.partyPhone) setPhone(existingBill.partyPhone);
    setParty({
      name: existingBill.partyName,
      phone: existingBill.partyPhone ?? "",
      email: existingBill.partyEmail,
    });
    if (existingBill.type === "purchase") {
      // Hydrate dealer fields
      const matched = dealers.find((d) => d.phone === existingBill.partyPhone) ?? null;
      setDealer(matched ?? {
        id: `dealer-${existingBill.id}`, name: existingBill.partyName,
        phone: existingBill.partyPhone ?? "", email: existingBill.partyEmail ?? "",
        company: existingBill.partyName,
      } as any);
      setBillNo(existingBill.billNo ?? existingBill.id);
    }
    setRows(
      existingBill.items.map((bi) => ({
        ...bi,
        _key: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        productInput: bi.name,
      })),
    );
    if (existingBill.paymentMode) setPaymentMode(existingBill.paymentMode);
    setNotes(existingBill.notes ?? "");
    setBillDate(new Date(existingBill.date));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, existingBill?.id]);

  const updateRow = (idx: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r, i) => (i === idx ? { ...r, ...patch } : r)));

  const removeRow = (idx: number) =>
    setRows((rs) => (rs.length === 1 ? [newRow()] : rs.filter((_, i) => i !== idx)));

  const pickProduct = (idx: number, it: Item) => {
    updateRow(idx, {
      itemId: it.id,
      name: it.name,
      productInput: it.name,
      price: isPurchase ? it.costPrice : it.salePrice,
      mrp: it.salePrice,
      unit: it.unit ?? "pcs",
      hsn: it.hsn ?? "",
      gstRate: 18,
    });
  };

  // Validate row before adding next
  const isRowFilled = (r: Row) => r.itemId && r.qty > 0 && r.price >= 0;

  const onRowKeyDown = (e: KeyboardEvent, idx: number) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const r = rows[idx];
    if (!isRowFilled(r)) {
      notify("Fill product and quantity first", "warning");
      return;
    }
    // Stock check for sales (not estimate, not return, not purchase)
    if (type === "sales") {
      const it = items.find((x) => x.id === r.itemId);
      if (it && r.qty > it.stock) {
        notify(`${it.name}: only ${it.stock} in stock`, "error");
        return;
      }
    }
    if (idx === rows.length - 1) {
      setRows((rs) => [...rs, newRow()]);
      // focus next row
      setTimeout(() => {
        const inputs = document.querySelectorAll<HTMLInputElement>("[data-row-product]");
        inputs[inputs.length - 1]?.focus();
      }, 30);
    }
  };

  // Filtered items per row input
  const filterItems = (q: string) => {
    const t = q.trim().toLowerCase();
    if (!t) return items.slice(0, 8);
    return items
      .filter(
        (i) =>
          i.name.toLowerCase().includes(t) ||
          i.code.toLowerCase().includes(t) ||
          (i.barcode ?? "").toLowerCase().includes(t),
      )
      .slice(0, 8);
  };

  const validRows = rows.filter(isRowFilled);

  // -------- Totals --------
  const totals = useMemo(() => {
    let sub = 0, gst = 0, disc = 0;
    for (const l of validRows) {
      const lineSub = l.price * l.qty - l.discount;
      sub += lineSub;
      gst += (lineSub * l.gstRate) / 100;
      disc += l.discount;
    }
    return { sub, gst, disc, grand: sub + gst };
  }, [validRows]);

  const [notes, setNotes] = useState("");
  const [paymentMode, setPaymentMode] = useState<"upi" | "card" | "cash">("upi");
  const [expiry, setExpiry] = useState<Date | null>(null);

  // -------- Submit --------
  const submit = () => {
    if (isPurchase) {
      if (!dealer) return notify("Select a dealer", "error");
      if (!billNo.trim()) return notify("Enter bill number", "error");
      if (!billDate) return notify("Select date", "error");
    } else {
      if (!party) return notify("Enter customer details", "error");
    }
    if (validRows.length === 0) return notify("Add at least one product", "error");
    if (type === "sales") {
      for (const r of validRows) {
        const it = items.find((x) => x.id === r.itemId);
        if (!it) continue;
        // When editing, available stock = current + previously committed qty
        const prevQty = isEdit && existingBill
          ? existingBill.items.filter((x) => x.itemId === r.itemId).reduce((s, x) => s + x.qty, 0)
          : 0;
        const available = it.stock + prevQty;
        if (r.qty > available) return notify(`${it.name}: only ${available} in stock`, "error");
      }
    }
    if (isEstimate && !expiry) return notify("Pick an expiry date", "warning");

    const partyName = isPurchase ? dealer!.name : party!.name;
    const partyPhone = isPurchase ? dealer!.phone : party!.phone;
    const partyEmail = isPurchase ? dealer!.email : party!.email;
    const dateIso = isEdit && existingBill
      ? existingBill.date
      : (isPurchase && billDate ? billDate : new Date()).toISOString();

    const cleanItems: BillItem[] = validRows.map(({ _key, productInput, ...rest }) => rest);

    if (isEdit && existingBill) {
      const updated: Bill = {
        ...existingBill,
        date: dateIso,
        partyName,
        partyPhone,
        partyEmail,
        items: cleanItems,
        paymentMode: isEstimate ? undefined : paymentMode,
        notes: notes.trim() || undefined,
      };
      dispatch(updateBill(updated));

      // Stock diff for sales: restore old qty, deduct new qty per item
      if (existingBill.type === "sales") {
        const prev: Record<string, number> = {};
        existingBill.items.forEach((x) => { prev[x.itemId] = (prev[x.itemId] ?? 0) + x.qty; });
        const next: Record<string, number> = {};
        cleanItems.forEach((x) => { next[x.itemId] = (next[x.itemId] ?? 0) + x.qty; });
        const ids = new Set([...Object.keys(prev), ...Object.keys(next)]);
        ids.forEach((id) => {
          const delta = (prev[id] ?? 0) - (next[id] ?? 0); // qty reduced => positive (add to stock)
          if (delta !== 0) dispatch(adjustStock({ id, delta }));
        });
      }

      notify("Bill updated", "success");
      nav("/bills/sales");
      return;
    }

    const bill: Bill = {
      id: `${type[0]}-${Date.now()}`,
      type,
      date: dateIso,
      partyName,
      partyPhone,
      partyEmail,
      items: cleanItems,
      paymentMode: isEstimate ? undefined : paymentMode,
      paid: isEstimate ? false : true,
      notes: notes.trim() || undefined,
      expiryDate: isEstimate ? expiry?.toISOString() : undefined,
      billNo: isPurchase ? billNo.trim() : billNumber,
    };
    dispatch(addBill(bill));

    // Inventory sync
    if (type === "sales") {
      for (const r of validRows) dispatch(adjustStock({ id: r.itemId, delta: -r.qty }));
    } else if (type === "purchase" || type === "return") {
      for (const r of validRows) dispatch(adjustStock({ id: r.itemId, delta: +r.qty }));
    }

    notify(
      type === "estimate" ? "Estimate saved" :
      type === "purchase" ? "Purchase recorded" :
      type === "return" ? "Return recorded — stock restored" :
      "Sales bill created",
      "success",
    );
    nav(
      type === "purchase" ? "/bills/purchase" :
      type === "estimate" ? "/bills/estimate" :
      "/bills/sales",
    );
  };

  const HeaderIcon = isEstimate ? Description :
    isPurchase ? ShoppingBag :
    isReturn ? AssignmentReturn :
    ShoppingCart;
  const headerLabel =
    isEdit ? "Edit Sales Bill" :
    isEstimate ? "Create Estimate Bill" :
    isPurchase ? "Create Purchase Bill" :
    isReturn ? "Create Return Sales Bill" :
    "Create Sales Bill";

  return (
    <MuiLayout>
      {/* Header */}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}
        sx={{ justifyContent: "space-between", alignItems: { sm: "center" }, mb: 3 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          <Box sx={{
            width: 44, height: 44, borderRadius: 2, bgcolor: "primary.main",
            color: "primary.contrastText", display: "grid", placeItems: "center",
          }}>
            <HeaderIcon />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>{headerLabel}</Typography>
            <Typography variant="body2" color="text.secondary">
              {isPurchase ? "Record stock received from dealer" :
                isEstimate ? "Quote without stock deduction" :
                isReturn ? "Return products and restore inventory" :
                "Fast point-of-sale workflow"}
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={1.5}>
          <Chip label={billNumber} color="primary" variant="outlined" sx={{ fontFamily: "monospace", fontWeight: 700 }} />
          <Chip label={format(new Date(), "dd MMM yyyy")} variant="outlined" />
        </Stack>
      </Stack>

      {isEstimate && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Estimate mode — no stock will be deducted. Set an expiry date below.
        </Alert>
      )}
      {isReturn && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Return mode — products added here will be restored to inventory.
        </Alert>
      )}

      {/* Party */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 2 }}>
            <PhoneIcon color="primary" fontSize="small" />
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {isPurchase ? "Dealer" : "Customer"}
            </Typography>
          </Stack>

          {isPurchase ? (
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Autocomplete
                  options={dealers}
                  value={dealer}
                  onChange={(_, v) => setDealer(v)}
                  getOptionLabel={(o) => o?.name ?? ""}
                  isOptionEqualToValue={(a, b) => a.id === b.id}
                  renderOption={(props, o) => (
                    <li {...props} key={o.id}>
                      <Box>
                        <Typography sx={{ fontWeight: 600 }}>{o.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {o.company} · {o.phone}
                        </Typography>
                      </Box>
                    </li>
                  )}
                  renderInput={(p) => (
                    <TextField {...p} label="Dealer Name" placeholder="Type to search dealer…" autoFocus />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField fullWidth label="Bill No." value={billNo} onChange={(e) => setBillNo(e.target.value)} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <DatePicker
                  label="Date"
                  value={billDate}
                  onChange={(v) => setBillDate(v)}
                  slotProps={{ textField: { fullWidth: true, size: "small" } }}
                />
              </Grid>
              {dealer && (
                <Grid size={{ xs: 12 }}>
                  <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "rgba(245,180,0,0.06)" }}>
                    <Stack direction="row" spacing={3} sx={{ flexWrap: "wrap" }}>
                      <Info label="Company" value={dealer.company} />
                      <Info label="Phone" value={dealer.phone} />
                      {dealer.gstNo && <Info label="GST" value={dealer.gstNo} />}
                      {dealer.fssaiNo && <Info label="FSSAI" value={dealer.fssaiNo} />}
                      {dealer.licenseNo && <Info label="License" value={dealer.licenseNo} />}
                      {dealer.address && <Info label="Address" value={dealer.address} />}
                    </Stack>
                  </Paper>
                </Grid>
              )}
            </Grid>
          ) : (
            <>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth inputRef={phoneRef} value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    label="Phone Number"
                    placeholder="Type customer phone…"
                    autoComplete="off"
                    slotProps={{
                      input: {
                        startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>,
                      },
                    }}
                  />
                </Grid>
                {party ? (
                  <>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField fullWidth label="Name" value={party.name} disabled />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField fullWidth label="Email" value={party.email ?? ""} disabled />
                    </Grid>
                  </>
                ) : phone.trim().length >= 3 ? (
                  <>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField
                        fullWidth label="Name (new customer)" value={draftParty.name}
                        onChange={(e) => setDraftParty({ ...draftParty, name: e.target.value })}
                        onBlur={commitNewCustomer}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField
                        fullWidth label="Email (optional)" value={draftParty.email}
                        onChange={(e) => setDraftParty({ ...draftParty, email: e.target.value })}
                        onBlur={commitNewCustomer}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth label="Address (optional)" value={draftParty.address}
                        onChange={(e) => setDraftParty({ ...draftParty, address: e.target.value })}
                        onBlur={commitNewCustomer}
                      />
                    </Grid>
                  </>
                ) : null}
              </Grid>
              {!party && phone.trim().length >= 3 && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                  No matching customer — fill the form to create one (auto-saved).
                </Typography>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Products — row-based */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Products</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
            Press <b>Enter</b> after filling a row to add a new one.
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ minWidth: 200 }}>Product</TableCell>
                  {isPurchase && <TableCell>HSN</TableCell>}
                  {isPurchase && <TableCell>Batch</TableCell>}
                  {isPurchase && <TableCell>Expiry</TableCell>}
                  {!isPurchase && <TableCell>Unit</TableCell>}
                  <TableCell align="right">MRP</TableCell>
                  <TableCell align="right">Qty</TableCell>
                  {isPurchase && <TableCell align="right">Free</TableCell>}
                  <TableCell align="right">Rate</TableCell>
                  <TableCell align="right">Disc</TableCell>
                  <TableCell align="right">GST%</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((r, idx) => {
                  const lineSub = r.price * r.qty - r.discount;
                  const total = lineSub + (lineSub * r.gstRate) / 100;
                  return (
                    <TableRow key={r._key} hover onKeyDown={(e) => onRowKeyDown(e, idx)}>
                      <TableCell sx={{ position: "relative" }}>
                        <ProductPicker
                          value={r.productInput}
                          onTextChange={(v) => updateRow(idx, { productInput: v, ...(r.itemId ? { itemId: "", name: "" } : {}) })}
                          onPick={(it) => pickProduct(idx, it)}
                          options={filterItems(r.productInput)}
                        />
                      </TableCell>
                      {isPurchase && (
                        <TableCell>
                          <TextField size="small" value={r.hsn ?? ""} onChange={(e) => updateRow(idx, { hsn: e.target.value })} sx={{ width: 80 }} />
                        </TableCell>
                      )}
                      {isPurchase && (
                        <TableCell>
                          <TextField size="small" value={r.batchNo ?? ""} onChange={(e) => updateRow(idx, { batchNo: e.target.value })} sx={{ width: 90 }} />
                        </TableCell>
                      )}
                      {isPurchase && (
                        <TableCell>
                          <TextField size="small" value={r.expiry ?? ""} onChange={(e) => updateRow(idx, { expiry: e.target.value })} placeholder="MM/YY" sx={{ width: 80 }} />
                        </TableCell>
                      )}
                      {!isPurchase && (
                        <TableCell>{r.unit ?? "pcs"}</TableCell>
                      )}
                      <TableCell align="right">
                        <TextField size="small" type="number" value={r.mrp ?? 0}
                          onChange={(e) => updateRow(idx, { mrp: +e.target.value })} sx={{ width: 80 }} />
                      </TableCell>
                      <TableCell align="right">
                        <TextField size="small" type="number" value={r.qty}
                          onChange={(e) => updateRow(idx, { qty: Math.max(0, +e.target.value) })} sx={{ width: 70 }} />
                      </TableCell>
                      {isPurchase && (
                        <TableCell align="right">
                          <TextField size="small" type="number" value={r.free ?? 0}
                            onChange={(e) => updateRow(idx, { free: +e.target.value })} sx={{ width: 60 }} />
                        </TableCell>
                      )}
                      <TableCell align="right">
                        <TextField size="small" type="number" value={r.price}
                          onChange={(e) => updateRow(idx, { price: +e.target.value })} sx={{ width: 90 }} />
                      </TableCell>
                      <TableCell align="right">
                        <TextField size="small" type="number" value={r.discount}
                          onChange={(e) => updateRow(idx, { discount: +e.target.value })} sx={{ width: 70 }} />
                      </TableCell>
                      <TableCell align="right">
                        <TextField size="small" type="number" value={r.gstRate}
                          onChange={(e) => updateRow(idx, { gstRate: +e.target.value })} sx={{ width: 60 }} />
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>₹{total.toFixed(2)}</TableCell>
                      <TableCell align="right">
                        <IconButton size="small" color="error" onClick={() => removeRow(idx)}>
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

      {/* Summary BELOW table */}
      <Card>
        <CardContent>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 7 }}>
              <Stack spacing={2}>
                {!isEstimate && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">Payment Mode</Typography>
                    <ToggleButtonGroup
                      size="small" exclusive value={paymentMode}
                      onChange={(_e, v) => v && setPaymentMode(v)}
                      sx={{ mt: 0.5, display: "flex" }}
                    >
                      <ToggleButton value="upi" sx={{ flex: 1 }}>UPI</ToggleButton>
                      <ToggleButton value="card" sx={{ flex: 1 }}>Card</ToggleButton>
                      <ToggleButton value="cash" sx={{ flex: 1 }}>Cash</ToggleButton>
                    </ToggleButtonGroup>
                  </Box>
                )}
                {isEstimate && (
                  <DatePicker
                    label="Expiry Date"
                    value={expiry}
                    onChange={(v) => setExpiry(v)}
                    slotProps={{ textField: { fullWidth: true, size: "small" } }}
                  />
                )}
                <TextField
                  fullWidth multiline minRows={2} label="Notes"
                  value={notes} onChange={(e) => setNotes(e.target.value)}
                />
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, md: 5 }}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>Summary</Typography>
                <Stack spacing={1}>
                  <SumRow label="Subtotal" value={`₹${totals.sub.toFixed(2)}`} />
                  <SumRow label="Discount" value={`-₹${totals.disc.toFixed(2)}`} />
                  <SumRow label="GST" value={`₹${totals.gst.toFixed(2)}`} />
                  <Divider />
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography sx={{ fontWeight: 700 }}>Grand Total</Typography>
                    <Typography variant="h6" color="primary" sx={{ fontWeight: 800 }}>
                      ₹{totals.grand.toFixed(2)}
                    </Typography>
                  </Stack>
                </Stack>
                <Button fullWidth variant="contained" size="large" startIcon={<Save />} sx={{ mt: 2 }} onClick={submit}>
                  {isEdit ? "Update Bill" :
                    isEstimate ? "Save Estimate" :
                    isPurchase ? "Save Purchase" :
                    isReturn ? "Save Return" :
                    "Create Sales Bill"}
                </Button>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </MuiLayout>
  );
}

function SumRow({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" sx={{ justifyContent: "space-between" }}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>{value}</Typography>
    </Stack>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ minWidth: 120 }}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>{value}</Typography>
    </Box>
  );
}

function ProductPicker({
  value, onTextChange, onPick, options,
}: {
  value: string;
  onTextChange: (v: string) => void;
  onPick: (it: Item) => void;
  options: Item[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <Box sx={{ position: "relative" }}>
      <TextField
        size="small" fullWidth value={value}
        slotProps={{ htmlInput: { "data-row-product": "true" } }}
        placeholder="Search product / scan barcode"
        onChange={(e) => { onTextChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && options.length > 0 && (
        <Paper elevation={6} sx={{ position: "absolute", top: "100%", left: 0, zIndex: 10, mt: 0.5, minWidth: 280, maxHeight: 260, overflowY: "auto" }}>
          <List dense>
            {options.map((it) => (
              <ListItemButton key={it.id} onMouseDown={(e) => { e.preventDefault(); onPick(it); setOpen(false); }}>
                <ListItemText
                  primary={it.name}
                  secondary={`${it.code} · Stock ${it.stock}`}
                />
                <Typography variant="body2" sx={{ fontWeight: 700 }}>₹{it.salePrice}</Typography>
              </ListItemButton>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
}
