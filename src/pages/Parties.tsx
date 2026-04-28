import { useMemo, useState, SyntheticEvent } from "react";
import {
  Box, Button, Card, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  Grid, IconButton, InputAdornment, Stack, Tab, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Tabs, TextField, Typography,
} from "@mui/material";
import { Add, Delete, Edit, People, Search } from "@mui/icons-material";
import { MuiLayout } from "@/components/MuiLayout";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  addCustomer, updateCustomer, deleteCustomer,
  addDealer, updateDealer, deleteDealer,
  Customer, Dealer,
} from "@/store/slices/partySlice";
import { useNotify } from "@/components/NotifyProvider";

const blankCustomer: Customer = {
  id: "", name: "", phone: "", email: "", address: "",
  createdAt: new Date().toISOString(), visits: 0, totalSpend: 0,
};
const blankDealer: Dealer = {
  id: "", name: "", phone: "", email: "", company: "", productCategory: "",
};

const isActive = (lastTxn?: string) => {
  if (!lastTxn) return false;
  return (Date.now() - new Date(lastTxn).getTime()) / 86400000 <= 45;
};

export default function Parties() {
  const { customers, dealers } = useAppSelector((s) => s.parties);
  const dispatch = useAppDispatch();
  const notify = useNotify();
  const [tab, setTab] = useState(0);
  const [q, setQ] = useState("");

  const [cOpen, setCOpen] = useState(false);
  const [cDraft, setCDraft] = useState<Customer>(blankCustomer);
  const [dOpen, setDOpen] = useState(false);
  const [dDraft, setDDraft] = useState<Dealer>(blankDealer);

  const filteredCustomers = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return customers;
    return customers.filter((c) => c.name.toLowerCase().includes(t) || c.phone.includes(t));
  }, [customers, q]);

  const filteredDealers = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return dealers;
    return dealers.filter((d) =>
      d.name.toLowerCase().includes(t) || d.phone.includes(t) || d.company.toLowerCase().includes(t),
    );
  }, [dealers, q]);

  const saveCustomer = () => {
    if (!cDraft.name || !cDraft.phone) return notify("Name and phone required", "error");
    if (cDraft.id) { dispatch(updateCustomer(cDraft)); notify("Customer updated", "success"); }
    else { dispatch(addCustomer({ ...cDraft, id: `c-${Date.now()}`, createdAt: new Date().toISOString() })); notify("Customer added", "success"); }
    setCOpen(false); setCDraft(blankCustomer);
  };

  const saveDealer = () => {
    if (!dDraft.name || !dDraft.phone) return notify("Name and phone required", "error");
    if (dDraft.id) { dispatch(updateDealer(dDraft)); notify("Dealer updated", "success"); }
    else { dispatch(addDealer({ ...dDraft, id: `d-${Date.now()}` })); notify("Dealer added", "success"); }
    setDOpen(false); setDDraft(blankDealer);
  };

  return (
    <MuiLayout>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{ justifyContent: "space-between", alignItems: { sm: "center" }, mb: 2 }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Parties</Typography>
          <Typography variant="body2" color="text.secondary">Manage customers and dealers</Typography>
        </Box>
        <TextField
          size="small" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> } }}
          sx={{ width: { xs: "100%", sm: 280 } }}
        />
      </Stack>

      <Card>
        <Tabs value={tab} onChange={(_e: SyntheticEvent, v: number) => setTab(v)} sx={{ px: 2, borderBottom: 1, borderColor: "divider" }}>
          <Tab label={`Customers (${customers.length})`} />
          <Tab label={`Dealers (${dealers.length})`} />
        </Tabs>

        {tab === 0 && (
          <Box sx={{ p: 2 }}>
            <Stack direction="row" sx={{ justifyContent: "flex-end", mb: 2 }}>
              <Button variant="contained" startIcon={<Add />} onClick={() => { setCDraft(blankCustomer); setCOpen(true); }}>
                Add Customer
              </Button>
            </Stack>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Visits</TableCell>
                    <TableCell align="right">Total Spend</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredCustomers.length === 0 && (
                    <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6, color: "text.secondary" }}>
                      <People sx={{ fontSize: 36, opacity: 0.4, display: "block", mx: "auto", mb: 1 }} />No customers
                    </TableCell></TableRow>
                  )}
                  {filteredCustomers.map((c) => (
                    <TableRow key={c.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{c.name}</TableCell>
                      <TableCell>{c.phone}</TableCell>
                      <TableCell>
                        {isActive(c.lastTxn)
                          ? <Chip size="small" color="success" label="Active" />
                          : <Chip size="small" label="Inactive" />}
                      </TableCell>
                      <TableCell align="right">{c.visits}</TableCell>
                      <TableCell align="right">₹{c.totalSpend.toLocaleString("en-IN")}</TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => { setCDraft(c); setCOpen(true); }}><Edit fontSize="small" /></IconButton>
                        <IconButton size="small" color="error" onClick={() => { dispatch(deleteCustomer(c.id)); notify("Deleted", "info"); }}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {tab === 1 && (
          <Box sx={{ p: 2 }}>
            <Stack direction="row" sx={{ justifyContent: "flex-end", mb: 2 }}>
              <Button variant="contained" startIcon={<Add />} onClick={() => { setDDraft(blankDealer); setDOpen(true); }}>
                Add Dealer
              </Button>
            </Stack>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Company</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredDealers.length === 0 && (
                    <TableRow><TableCell colSpan={5} align="center" sx={{ py: 6, color: "text.secondary" }}>No dealers</TableCell></TableRow>
                  )}
                  {filteredDealers.map((d) => (
                    <TableRow key={d.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{d.name}</TableCell>
                      <TableCell>{d.phone}</TableCell>
                      <TableCell>{d.company}</TableCell>
                      <TableCell>{d.productCategory}</TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => { setDDraft(d); setDOpen(true); }}><Edit fontSize="small" /></IconButton>
                        <IconButton size="small" color="error" onClick={() => { dispatch(deleteDealer(d.id)); notify("Deleted", "info"); }}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </Card>

      <Dialog open={cOpen} onClose={() => setCOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{cDraft.id ? "Edit Customer" : "Add Customer"}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label="Name" value={cDraft.name} onChange={(e) => setCDraft({ ...cDraft, name: e.target.value })} /></Grid>
            <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label="Phone" value={cDraft.phone} onChange={(e) => setCDraft({ ...cDraft, phone: e.target.value })} /></Grid>
            <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label="Email" value={cDraft.email} onChange={(e) => setCDraft({ ...cDraft, email: e.target.value })} /></Grid>
            <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label="Address" value={cDraft.address} onChange={(e) => setCDraft({ ...cDraft, address: e.target.value })} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={saveCustomer}>{cDraft.id ? "Save" : "Add"}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dOpen} onClose={() => setDOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{dDraft.id ? "Edit Dealer" : "Add Dealer"}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label="Name" value={dDraft.name} onChange={(e) => setDDraft({ ...dDraft, name: e.target.value })} /></Grid>
            <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label="Phone" value={dDraft.phone} onChange={(e) => setDDraft({ ...dDraft, phone: e.target.value })} /></Grid>
            <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label="Company" value={dDraft.company} onChange={(e) => setDDraft({ ...dDraft, company: e.target.value })} /></Grid>
            <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label="Category" value={dDraft.productCategory} onChange={(e) => setDDraft({ ...dDraft, productCategory: e.target.value })} /></Grid>
            <Grid size={{ xs: 12 }}><TextField fullWidth label="Email" value={dDraft.email} onChange={(e) => setDDraft({ ...dDraft, email: e.target.value })} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={saveDealer}>{dDraft.id ? "Save" : "Add"}</Button>
        </DialogActions>
      </Dialog>
    </MuiLayout>
  );
}
