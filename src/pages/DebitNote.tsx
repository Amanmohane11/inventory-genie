import { useEffect, useMemo, useRef, useState, KeyboardEvent } from "react";
import {
  Alert, Autocomplete, Box, Button, Card, CardContent, Chip, Dialog, DialogActions,
  DialogContent, DialogTitle, Divider, Grid, IconButton, InputAdornment, MenuItem,
  Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Typography,
} from "@mui/material";
import {
  Add, Delete, Edit, Search, Phone as PhoneIcon, Receipt, Payments,
  RemoveCircleOutlined,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { format } from "date-fns";
import { MuiLayout } from "@/components/MuiLayout";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  addNote, updateNote, removeNote, DebitNote, DebitNoteItem,
} from "@/store/slices/debitNoteSlice";
import { addCustomer } from "@/store/slices/partySlice";
import { addBill } from "@/store/slices/billSlice";
import { adjustStock } from "@/store/slices/itemSlice";
import { Bill, BillItem, Item } from "@/store/seedData";
import { useNotify } from "@/components/NotifyProvider";

type Row = DebitNoteItem & { _key: string; productInput: string };

const newRow = (): Row => ({
  _key: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  itemId: "", name: "", unit: "pcs", mrp: 0, qty: 1, rate: 0, discount: 0, gstRate: 18,
  productInput: "",
});

const isFilled = (r: Row) => r.itemId && r.qty > 0 && r.rate >= 0;

export default function DebitNotePage() {
  const dispatch = useAppDispatch();
  const notify = useNotify();
  const notes = useAppSelector((s) => s.debitNotes.notes);
  const items = useAppSelector((s) => s.items.items);
  const customers = useAppSelector((s) => s.parties.customers);

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // -------- Customer step --------
  const [phone, setPhone] = useState("");
  const [party, setParty] = useState<{ name: string; phone: string; email?: string; address?: string } | null>(null);
  const [draftParty, setDraftParty] = useState({ name: "", email: "", address: "" });
  const phoneRef = useRef<HTMLInputElement>(null);

  // -------- Form fields --------
  const [date] = useState<Date>(new Date());
  const [dueDate, setDueDate] = useState<Date | null>(new Date(Date.now() + 7 * 86400000));
  const [rows, setRows] = useState<Row[]>([newRow()]);
  const [notesText, setNotesText] = useState("");

  const noteNumber = useMemo(() => {
    if (editId) {
      const n = notes.find((x) => x.id === editId);
      if (n) return n.noteNo;
    }
    return `DN-${String(notes.length + 1).padStart(5, "0")}`;
  }, [notes, editId]);

  // Auto-fetch customer
  useEffect(() => {
    const t = phone.trim();
    if (!t) { setParty(null); return; }
    const found = customers.find((c) => c.phone === t);
    if (found) {
      setParty({ name: found.name, phone: found.phone, email: found.email, address: found.address });
    } else {
      setParty(null);
    }
  }, [phone, customers]);

  const resetForm = () => {
    setEditId(null); setPhone(""); setParty(null);
    setDraftParty({ name: "", email: "", address: "" });
    setRows([newRow()]); setNotesText("");
    setDueDate(new Date(Date.now() + 7 * 86400000));
  };

  const openNew = () => { resetForm(); setOpen(true); setTimeout(() => phoneRef.current?.focus(), 50); };

  const openEdit = (n: DebitNote) => {
    setEditId(n.id);
    setPhone(n.customerPhone);
    setParty({ name: n.customerName, phone: n.customerPhone, email: n.customerEmail, address: n.customerAddress });
    setRows(n.items.map((it) => ({ ...it, _key: `${Date.now()}-${Math.random()}`, productInput: it.name })));
    setNotesText(n.notes ?? "");
    setDueDate(new Date(n.dueDate));
    setOpen(true);
  };

  const commitNewCustomer = () => {
    const t = phone.trim();
    if (!t || !draftParty.name.trim()) return notify("Name and phone required", "error");
    dispatch(addCustomer({
      id: `c-${Date.now()}`,
      name: draftParty.name.trim(),
      phone: t,
      email: draftParty.email.trim() || undefined,
      address: draftParty.address.trim() || undefined,
      createdAt: new Date().toISOString(),
      visits: 0, totalSpend: 0,
    }));
    setParty({ name: draftParty.name.trim(), phone: t, email: draftParty.email.trim() || undefined, address: draftParty.address.trim() || undefined });
    notify("Customer saved", "success");
  };

  const updateRow = (idx: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r, i) => (i === idx ? { ...r, ...patch } : r)));

  const removeRow = (idx: number) =>
    setRows((rs) => (rs.length === 1 ? [newRow()] : rs.filter((_, i) => i !== idx)));

  const pickProduct = (idx: number, it: Item) => {
    updateRow(idx, {
      itemId: it.id, name: it.name, productInput: it.name,
      rate: it.salePrice, mrp: it.salePrice,
      unit: it.unit ?? "pcs", gstRate: 18,
    });
  };

  const onRowKeyDown = (e: KeyboardEvent, idx: number) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const r = rows[idx];
    if (!isFilled(r)) return notify("Fill product and quantity first", "warning");
    if (idx === rows.length - 1) {
      setRows((rs) => [...rs, newRow()]);
      setTimeout(() => {
        const inputs = document.querySelectorAll<HTMLInputElement>("[data-dn-product]");
        inputs[inputs.length - 1]?.focus();
      }, 30);
    }
  };

  const filterItems = (q: string) => {
    const t = q.trim().toLowerCase();
    if (!t) return items.slice(0, 8);
    return items.filter((i) =>
      i.name.toLowerCase().includes(t) || i.code.toLowerCase().includes(t),
    ).slice(0, 8);
  };

  const validRows = rows.filter(isFilled);

  const totals = useMemo(() => {
    let sub = 0, gst = 0, disc = 0;
    for (const l of validRows) {
      const lineSub = l.rate * l.qty - l.discount;
      sub += lineSub;
      gst += (lineSub * l.gstRate) / 100;
      disc += l.discount;
    }
    return { sub, gst, disc, total: sub + gst };
  }, [validRows]);

  const save = () => {
    if (!party) return notify("Enter customer details", "error");
    if (!dueDate) return notify("Select due date", "error");
    if (validRows.length === 0) return notify("Add at least one product", "error");

    const cleanItems: DebitNoteItem[] = validRows.map(({ _key, productInput, ...rest }) => rest);
    const payload: DebitNote = {
      id: editId ?? `dn-${Date.now()}`,
      noteNo: noteNumber,
      date: editId ? notes.find((n) => n.id === editId)!.date : date.toISOString(),
      dueDate: dueDate.toISOString(),
      customerName: party.name,
      customerPhone: party.phone,
      customerEmail: party.email,
      customerAddress: party.address,
      items: cleanItems,
      notes: notesText.trim() || undefined,
      subtotal: totals.sub,
      gst: totals.gst,
      discount: totals.disc,
      total: totals.total,
      status: "open",
    };
    if (editId) { dispatch(updateNote(payload)); notify("Debit note updated", "success"); }
    else { dispatch(addNote(payload)); notify("Debit note created", "success"); }
    setOpen(false); resetForm();
  };

  const payNote = (n: DebitNote) => {
    // Convert to a sales bill (history) and deduct stock
    const billItems: BillItem[] = n.items.map((it) => ({
      itemId: it.itemId, name: it.name, qty: it.qty, price: it.rate,
      gstRate: it.gstRate, discount: it.discount, unit: it.unit, mrp: it.mrp,
    }));
    // stock check
    for (const it of n.items) {
      const stocked = items.find((x) => x.id === it.itemId);
      if (stocked && it.qty > stocked.stock) {
        return notify(`${it.name}: only ${stocked.stock} in stock`, "error");
      }
    }
    const bill: Bill = {
      id: `s-${Date.now()}`,
      type: "sales",
      date: new Date().toISOString(),
      partyName: n.customerName,
      partyPhone: n.customerPhone,
      partyEmail: n.customerEmail,
      items: billItems,
      paymentMode: "cash",
      paid: true,
      notes: `Paid from Debit Note ${n.noteNo}`,
      billNo: `INV-DN-${n.noteNo}`,
    };
    dispatch(addBill(bill));
    for (const it of n.items) dispatch(adjustStock({ id: it.itemId, delta: -it.qty }));
    dispatch(removeNote(n.id));
    notify(`Debit note ${n.noteNo} paid → moved to Sales`, "success");
  };

  return (
    <MuiLayout>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}
        sx={{ justifyContent: "space-between", alignItems: { sm: "center" }, mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Debit Notes</Typography>
          <Typography variant="body2" color="text.secondary">
            Manage credit-side notes for customers and convert paid notes into sales
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={openNew}>
          Create Debit Note
        </Button>
      </Stack>

      <Card>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Note No.</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {notes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6, color: "text.secondary" }}>
                    <RemoveCircleOutlined sx={{ fontSize: 36, opacity: 0.4, display: "block", mx: "auto", mb: 1 }} />
                    No debit notes yet
                  </TableCell>
                </TableRow>
              )}
              {notes.map((n) => (
                <TableRow key={n.id} hover>
                  <TableCell sx={{ fontFamily: "monospace", fontWeight: 700 }}>{n.noteNo}</TableCell>
                  <TableCell>{n.customerName}</TableCell>
                  <TableCell>{n.customerPhone}</TableCell>
                  <TableCell>{format(new Date(n.date), "dd MMM yy")}</TableCell>
                  <TableCell>{format(new Date(n.dueDate), "dd MMM yy")}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>₹{n.total.toFixed(2)}</TableCell>
                  <TableCell sx={{ color: "text.secondary", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {n.notes || `${n.items.length} item${n.items.length > 1 ? "s" : ""}`}
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.5} sx={{ justifyContent: "flex-end" }}>
                      <IconButton size="small" color="primary" onClick={() => openEdit(n)} title="Edit">
                        <Edit fontSize="small" />
                      </IconButton>
                      <Button size="small" variant="contained" color="success"
                        startIcon={<Payments />} onClick={() => payNote(n)}>
                        Pay
                      </Button>
                      <IconButton size="small" color="error" onClick={() => { dispatch(removeNote(n.id)); notify("Deleted", "info"); }} title="Delete">
                        <Delete fontSize="small" />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Create / Edit dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="lg">
        <DialogTitle>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
            <Receipt color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 700, flex: 1 }}>
              {editId ? "Edit Debit Note" : "Create Debit Note"}
            </Typography>
            <Chip label={noteNumber} color="primary" variant="outlined" sx={{ fontFamily: "monospace", fontWeight: 700 }} />
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          {/* Customer */}
          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 2 }}>
                <PhoneIcon color="primary" fontSize="small" />
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Customer</Typography>
              </Stack>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth inputRef={phoneRef} value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    label="Phone Number" placeholder="Type customer phone…"
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
                    <Grid size={{ xs: 12 }}>
                      <TextField fullWidth label="Address" value={party.address ?? ""} disabled />
                    </Grid>
                  </>
                ) : phone.trim().length >= 3 ? (
                  <>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField fullWidth label="Name (new customer)" value={draftParty.name}
                        onChange={(e) => setDraftParty({ ...draftParty, name: e.target.value })} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField fullWidth label="Email" value={draftParty.email}
                        onChange={(e) => setDraftParty({ ...draftParty, email: e.target.value })} />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField fullWidth label="Address" value={draftParty.address}
                        onChange={(e) => setDraftParty({ ...draftParty, address: e.target.value })} />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Button variant="outlined" onClick={commitNewCustomer}>Save Customer & Continue</Button>
                    </Grid>
                  </>
                ) : (
                  <Grid size={{ xs: 12 }}>
                    <Alert severity="info">Enter a phone number to fetch or create a customer.</Alert>
                  </Grid>
                )}
                <Grid size={{ xs: 12, md: 4 }}>
                  <DatePicker
                    label="Due Date" value={dueDate} onChange={(v) => setDueDate(v)}
                    slotProps={{ textField: { fullWidth: true, size: "small" } }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Products */}
          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>Products</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ minWidth: 220 }}>Product</TableCell>
                      <TableCell sx={{ minWidth: 80 }}>Unit</TableCell>
                      <TableCell align="right" sx={{ minWidth: 90 }}>MRP</TableCell>
                      <TableCell align="right" sx={{ minWidth: 80 }}>Qty</TableCell>
                      <TableCell align="right" sx={{ minWidth: 100 }}>Rate</TableCell>
                      <TableCell align="right" sx={{ minWidth: 100 }}>Discount</TableCell>
                      <TableCell align="right" sx={{ minWidth: 90 }}>GST %</TableCell>
                      <TableCell align="right" sx={{ minWidth: 110 }}>Total</TableCell>
                      <TableCell align="right" />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((r, idx) => {
                      const lineSub = r.rate * r.qty - r.discount;
                      const lineTotal = lineSub + (lineSub * r.gstRate) / 100;
                      return (
                        <TableRow key={r._key}>
                          <TableCell>
                            <Autocomplete
                              freeSolo size="small"
                              options={filterItems(r.productInput)}
                              getOptionLabel={(o) => typeof o === "string" ? o : o.name}
                              inputValue={r.productInput}
                              onInputChange={(_, v) => updateRow(idx, { productInput: v })}
                              onChange={(_, v) => { if (v && typeof v !== "string") pickProduct(idx, v); }}
                              renderOption={(props, o) => (
                                <li {...props} key={o.id}>
                                  <Box>
                                    <Typography sx={{ fontWeight: 600 }}>{o.name}</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {o.code} · ₹{o.salePrice} · stock {o.stock}
                                    </Typography>
                                  </Box>
                                </li>
                              )}
                              renderInput={(p) => (
                                <TextField {...p} placeholder="Search product…"
                                  inputProps={{ ...p.inputProps, "data-dn-product": "1" } as any}
                                  onKeyDown={(e) => onRowKeyDown(e, idx)} />
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField size="small" value={r.unit}
                              onChange={(e) => updateRow(idx, { unit: e.target.value })} />
                          </TableCell>
                          <TableCell align="right">
                            <TextField size="small" type="number" value={r.mrp}
                              onChange={(e) => updateRow(idx, { mrp: +e.target.value })} />
                          </TableCell>
                          <TableCell align="right">
                            <TextField size="small" type="number" value={r.qty}
                              onChange={(e) => updateRow(idx, { qty: +e.target.value })}
                              onKeyDown={(e) => onRowKeyDown(e, idx)} />
                          </TableCell>
                          <TableCell align="right">
                            <TextField size="small" type="number" value={r.rate}
                              onChange={(e) => updateRow(idx, { rate: +e.target.value })} />
                          </TableCell>
                          <TableCell align="right">
                            <TextField size="small" type="number" value={r.discount}
                              onChange={(e) => updateRow(idx, { discount: +e.target.value })} />
                          </TableCell>
                          <TableCell align="right">
                            <TextField select size="small" value={r.gstRate}
                              onChange={(e) => updateRow(idx, { gstRate: +e.target.value })}
                              sx={{ minWidth: 80 }}>
                              {[0, 5, 12, 18, 28].map((g) => (
                                <MenuItem key={g} value={g}>{g}%</MenuItem>
                              ))}
                            </TextField>
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>
                            ₹{lineTotal.toFixed(2)}
                          </TableCell>
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
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                Tip: Press Enter on a filled row to add the next one.
              </Typography>
            </CardContent>
          </Card>

          {/* Footer: notes + totals */}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 7 }}>
              <TextField fullWidth multiline minRows={4} label="Notes"
                value={notesText} onChange={(e) => setNotesText(e.target.value)} />
            </Grid>
            <Grid size={{ xs: 12, md: 5 }}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Stack spacing={1}>
                  <Row label="Subtotal" value={totals.sub} />
                  <Row label="Discount" value={-totals.disc} />
                  <Row label="GST" value={totals.gst} />
                  <Divider />
                  <Row label="Final Total" value={totals.total} bold />
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={save}>{editId ? "Save Changes" : "Create Note"}</Button>
        </DialogActions>
      </Dialog>
    </MuiLayout>
  );
}

function Row({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  return (
    <Stack direction="row" sx={{ justifyContent: "space-between" }}>
      <Typography variant={bold ? "subtitle1" : "body2"} sx={{ fontWeight: bold ? 700 : 500 }}>
        {label}
      </Typography>
      <Typography variant={bold ? "subtitle1" : "body2"} sx={{ fontWeight: bold ? 700 : 600 }}>
        ₹{value.toFixed(2)}
      </Typography>
    </Stack>
  );
}
