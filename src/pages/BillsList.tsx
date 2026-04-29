import { useMemo, useState } from "react";
import {
  Box, Button, Card, Chip, IconButton, InputAdornment, Stack, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TextField, Tooltip, Typography,
} from "@mui/material";
import { Add, Search, Delete, Receipt } from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { format, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { useNavigate } from "react-router-dom";
import { MuiLayout } from "@/components/MuiLayout";
import { useAppDispatch, useAppSelector } from "@/store";
import { deleteBill } from "@/store/slices/billSlice";
import { Bill } from "@/store/seedData";
import { useNotify } from "@/components/NotifyProvider";

type Kind = "sales" | "purchase" | "return";

const titleFor = (k: Kind) =>
  k === "sales" ? "Sales Bills" : k === "purchase" ? "Purchase Bills" : "Return Sales Bills";
const createPath = (k: Kind) => `/bills/${k}/new`;

export default function BillsList({ kind }: { kind: Kind }) {
  const bills = useAppSelector((s) => s.bills.bills);
  const dispatch = useAppDispatch();
  const notify = useNotify();
  const nav = useNavigate();

  const [q, setQ] = useState("");
  const [from, setFrom] = useState<Date | null>(null);
  const [to, setTo] = useState<Date | null>(null);
  const [page, setPage] = useState(0);
  const PAGE = 25;

  const filtered = useMemo(() => {
    let list = bills.filter((b) => b.type === kind);
    if (from && to) {
      list = list.filter((b) =>
        isWithinInterval(new Date(b.date), { start: startOfDay(from), end: endOfDay(to) }),
      );
    } else if (from) {
      list = list.filter((b) => new Date(b.date) >= startOfDay(from));
    } else if (to) {
      list = list.filter((b) => new Date(b.date) <= endOfDay(to));
    }
    const t = q.trim().toLowerCase();
    if (t) {
      list = list.filter(
        (b) =>
          b.partyName.toLowerCase().includes(t) ||
          b.id.toLowerCase().includes(t) ||
          (b.billNo ?? "").toLowerCase().includes(t),
      );
    }
    return list;
  }, [bills, kind, q, from, to]);

  const paged = filtered.slice(page * PAGE, page * PAGE + PAGE);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE));

  const sumOf = (b: Bill) =>
    b.items.reduce((acc, l) => {
      const sub = l.price * l.qty - l.discount;
      return acc + sub + (sub * l.gstRate) / 100;
    }, 0);

  return (
    <MuiLayout>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{ justifyContent: "space-between", alignItems: { sm: "center" }, mb: 2 }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>{titleFor(kind)}</Typography>
          <Typography variant="body2" color="text.secondary">
            {filtered.length} bills{from || to ? " (filtered)" : ""}
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => nav(createPath(kind))}>
          Create Bill
        </Button>
      </Stack>

      <Card sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ alignItems: { md: "center" } }}>
          <TextField
            placeholder="Search party, bill #"
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(0); }}
            sx={{ minWidth: 240 }}
            slotProps={{
              input: { startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> },
            }}
          />
          <DatePicker
            label="Start Date"
            value={from}
            onChange={(v) => { setFrom(v); setPage(0); }}
            slotProps={{ textField: { size: "small" }, field: { clearable: true } }}
          />
          <DatePicker
            label="End Date"
            value={to}
            onChange={(v) => { setTo(v); setPage(0); }}
            slotProps={{ textField: { size: "small" }, field: { clearable: true } }}
          />
          {(from || to) && (
            <Button onClick={() => { setFrom(null); setTo(null); setPage(0); }}>Clear dates</Button>
          )}
        </Stack>
      </Card>

      <Card>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Bill #</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>{kind === "purchase" ? "Dealer" : "Customer"}</TableCell>
                <TableCell align="right">Items</TableCell>
                <TableCell align="right">Total</TableCell>
                {kind === "sales" && <TableCell>Status</TableCell>}
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paged.length === 0 && (
                <TableRow>
                  <TableCell colSpan={kind === "sales" ? 7 : 6} align="center" sx={{ py: 6, color: "text.secondary" }}>
                    <Receipt sx={{ fontSize: 36, opacity: 0.4, display: "block", mx: "auto", mb: 1 }} />
                    No bills found
                  </TableCell>
                </TableRow>
              )}
              {paged.map((b) => (
                <TableRow key={b.id} hover>
                  <TableCell sx={{ fontFamily: "monospace", fontSize: 12 }}>
                    {b.billNo || b.id}
                  </TableCell>
                  <TableCell>{format(new Date(b.date), "dd MMM yy")}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{b.partyName}</TableCell>
                  <TableCell align="right">{b.items.length}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>₹{sumOf(b).toFixed(2)}</TableCell>
                  {kind === "sales" && (
                    <TableCell>
                      <Chip size="small" color={b.paid ? "success" : "error"} label={b.paid ? "Paid" : "Unpaid"} />
                    </TableCell>
                  )}
                  <TableCell align="right">
                    <Tooltip title="Delete">
                      <IconButton
                        size="small" color="error"
                        onClick={() => { dispatch(deleteBill(b.id)); notify("Bill deleted", "info"); }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Stack direction="row" spacing={1} sx={{ p: 2, justifyContent: "flex-end", alignItems: "center" }}>
          <Typography variant="caption" color="text.secondary">
            Page {page + 1} of {totalPages}
          </Typography>
          <Button size="small" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Prev</Button>
          <Button size="small" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </Stack>
      </Card>
    </MuiLayout>
  );
}
