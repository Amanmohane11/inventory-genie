import { useMemo, useState } from "react";
import {
  Box, Button, Card, Chip, IconButton, InputAdornment, Stack, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TextField, Typography, Dialog,
  DialogTitle, DialogContent, DialogActions, Grid,
} from "@mui/material";
import { Add, Edit, Delete, Search, Inventory2 } from "@mui/icons-material";
import { MuiLayout } from "@/components/MuiLayout";
import { useAppDispatch, useAppSelector } from "@/store";
import { addItem, updateItem, deleteItem } from "@/store/slices/itemSlice";
import { Item } from "@/store/seedData";
import { useNotify } from "@/components/NotifyProvider";

const empty: Item = {
  id: "", name: "", code: "", category: "", stock: 0, costPrice: 0, salePrice: 0,
  barcode: "", openingStock: 0, unit: "pcs", hsn: "",
};

export default function Items() {
  const items = useAppSelector((s) => s.items.items);
  const dispatch = useAppDispatch();
  const notify = useNotify();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Item>(empty);
  const editing = !!draft.id;

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return items;
    return items.filter(
      (i) =>
        i.name.toLowerCase().includes(t) ||
        i.code.toLowerCase().includes(t) ||
        i.category.toLowerCase().includes(t),
    );
  }, [items, q]);

  const lowStock = items.filter((i) => i.stock < 25).length;

  const onSave = () => {
    if (!draft.name || !draft.code) return notify("Name and code are required", "error");
    if (editing) {
      dispatch(updateItem(draft));
      notify("Item updated", "success");
    } else {
      const stock = draft.stock || draft.openingStock || 0;
      dispatch(addItem({ ...draft, id: `i-${Date.now()}`, stock, openingStock: draft.openingStock ?? stock }));
      notify("Item added", "success");
    }
    setOpen(false);
    setDraft(empty);
  };

  return (
    <MuiLayout>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{ justifyContent: "space-between", alignItems: { sm: "center" }, mb: 3 }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Items</Typography>
          <Typography variant="body2" color="text.secondary">
            {items.length} items · {lowStock} low stock
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => { setDraft(empty); setOpen(true); }}>
          Add Item
        </Button>
      </Stack>

      <Card sx={{ p: 2 }}>
        <TextField
          placeholder="Search by name, code or category"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          sx={{ maxWidth: 360, mb: 2 }}
          slotProps={{
            input: {
              startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>,
            },
          }}
        />
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Item</TableCell>
                <TableCell>Code</TableCell>
                <TableCell>Category</TableCell>
                <TableCell align="right">Stock</TableCell>
                <TableCell align="right">Cost</TableCell>
                <TableCell align="right">Price</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6, color: "text.secondary" }}>
                    <Inventory2 sx={{ fontSize: 36, opacity: 0.4, display: "block", mx: "auto", mb: 1 }} />
                    No items found
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((i) => (
                <TableRow key={i.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{i.name}</TableCell>
                  <TableCell sx={{ color: "text.secondary" }}>{i.code}</TableCell>
                  <TableCell>{i.category}</TableCell>
                  <TableCell align="right">
                    {i.stock < 25
                      ? <Chip size="small" color="error" label={i.stock} />
                      : <span>{i.stock}</span>}
                  </TableCell>
                  <TableCell align="right">₹{i.costPrice}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>₹{i.salePrice}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => { setDraft(i); setOpen(true); }}>
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => { dispatch(deleteItem(i.id)); notify("Item deleted", "info"); }}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>{editing ? "Edit Item" : "Add Item"}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="Name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="Code" value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="Category" value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField fullWidth label="Unit" value={draft.unit ?? ""} onChange={(e) => setDraft({ ...draft, unit: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField fullWidth label="HSN" value={draft.hsn ?? ""} onChange={(e) => setDraft({ ...draft, hsn: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth label="Barcode (scan or enter)" value={draft.barcode ?? ""}
                onChange={(e) => setDraft({ ...draft, barcode: e.target.value })}
                placeholder="Scan with barcode reader or type"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth type="number" label="Opening Stock" value={draft.openingStock ?? 0} onChange={(e) => setDraft({ ...draft, openingStock: +e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField fullWidth type="number" label="Current Stock" value={draft.stock} onChange={(e) => setDraft({ ...draft, stock: +e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField fullWidth type="number" label="Cost Price" value={draft.costPrice} onChange={(e) => setDraft({ ...draft, costPrice: +e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField fullWidth type="number" label="Sale Price" value={draft.salePrice} onChange={(e) => setDraft({ ...draft, salePrice: +e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={onSave}>{editing ? "Save" : "Add"}</Button>
        </DialogActions>
      </Dialog>
    </MuiLayout>
  );
}
