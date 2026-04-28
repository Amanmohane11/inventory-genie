import { useState } from "react";
import {
  Box, Button, Card, Dialog, DialogActions, DialogContent, DialogTitle,
  Grid, IconButton, MenuItem, Stack, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, Typography,
} from "@mui/material";
import { Add, Delete, RemoveCircleOutline } from "@mui/icons-material";
import { format } from "date-fns";
import { MuiLayout } from "@/components/MuiLayout";
import { useAppDispatch, useAppSelector } from "@/store";
import { addNote, deleteNote, DebitNote } from "@/store/slices/debitNoteSlice";
import { useNotify } from "@/components/NotifyProvider";

const blank: DebitNote = {
  id: "", date: new Date().toISOString(), dealerName: "", itemName: "",
  qty: 1, amount: 0, reason: "",
};

export default function DebitNotePage() {
  const notes = useAppSelector((s) => s.debitNotes.notes);
  const items = useAppSelector((s) => s.items.items);
  const dealers = useAppSelector((s) => s.parties.dealers);
  const dispatch = useAppDispatch();
  const notify = useNotify();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DebitNote>(blank);

  const save = () => {
    if (!draft.dealerName || !draft.itemName) return notify("Dealer and item required", "error");
    dispatch(addNote({ ...draft, id: `dn-${Date.now()}`, date: new Date().toISOString() }));
    notify("Debit note created", "success");
    setOpen(false); setDraft(blank);
  };

  return (
    <MuiLayout>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}
        sx={{ justifyContent: "space-between", alignItems: { sm: "center" }, mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Debit Notes</Typography>
          <Typography variant="body2" color="text.secondary">Record purchase returns to dealers</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => { setDraft(blank); setOpen(true); }}>
          New Debit Note
        </Button>
      </Stack>

      <Card>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Dealer</TableCell>
                <TableCell>Item</TableCell>
                <TableCell align="right">Qty</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Reason</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {notes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6, color: "text.secondary" }}>
                    <RemoveCircleOutline sx={{ fontSize: 36, opacity: 0.4, display: "block", mx: "auto", mb: 1 }} />
                    No debit notes yet
                  </TableCell>
                </TableRow>
              )}
              {notes.map((n) => (
                <TableRow key={n.id} hover>
                  <TableCell>{format(new Date(n.date), "dd MMM yy")}</TableCell>
                  <TableCell>{n.dealerName}</TableCell>
                  <TableCell>{n.itemName}</TableCell>
                  <TableCell align="right">{n.qty}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>₹{n.amount}</TableCell>
                  <TableCell sx={{ color: "text.secondary" }}>{n.reason}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" color="error" onClick={() => { dispatch(deleteNote(n.id)); notify("Deleted", "info"); }}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>New Debit Note</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField select fullWidth label="Dealer" value={draft.dealerName}
                onChange={(e) => setDraft({ ...draft, dealerName: e.target.value })}>
                {dealers.length === 0 && <MenuItem disabled value="">No dealers</MenuItem>}
                {dealers.map((d) => <MenuItem key={d.id} value={d.name}>{d.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField select fullWidth label="Item" value={draft.itemName}
                onChange={(e) => setDraft({ ...draft, itemName: e.target.value })}>
                {items.map((i) => <MenuItem key={i.id} value={i.name}>{i.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth type="number" label="Qty" value={draft.qty} onChange={(e) => setDraft({ ...draft, qty: +e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth type="number" label="Amount" value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: +e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth label="Reason" value={draft.reason} onChange={(e) => setDraft({ ...draft, reason: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={save}>Create</Button>
        </DialogActions>
      </Dialog>
    </MuiLayout>
  );
}
