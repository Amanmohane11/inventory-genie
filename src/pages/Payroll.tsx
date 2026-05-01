import { useMemo, useRef, useState, ChangeEvent, SyntheticEvent } from "react";
import {
  Avatar, Box, Button, Card, CardContent, Chip, Dialog, DialogActions,
  DialogContent, DialogTitle, Divider, Grid, IconButton, MenuItem, Stack, Tab,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tabs,
  TextField, ToggleButton, ToggleButtonGroup, Tooltip, Typography,
} from "@mui/material";
import {
  Add, CameraAlt, Delete, Edit, Email, Event, Phone as PhoneIcon,
} from "@mui/icons-material";
import { format, getDaysInMonth, startOfMonth } from "date-fns";
import { MuiLayout } from "@/components/MuiLayout";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  addPayment, addStaff, deletePayment, deleteStaff, setAttendance, updateStaff,
  AttendanceStatus, Payment, Staff,
} from "@/store/slices/payrollSlice";
import { useNotify } from "@/components/NotifyProvider";

const blankStaff: Staff = {
  id: "", name: "", role: "", salary: 0, perDaySalary: 0,
  joinedAt: new Date().toISOString(),
  phone: "", email: "", aadhaar: "", address: "", age: undefined, gender: undefined,
  imageDataUrl: "",
};

export default function Payroll() {
  const { staff, payments, attendance } = useAppSelector((s) => s.payroll);
  const dispatch = useAppDispatch();
  const notify = useNotify();
  const [tab, setTab] = useState(0);

  // Staff dialog
  const [sOpen, setSOpen] = useState(false);
  const [sDraft, setSDraft] = useState<Staff>(blankStaff);
  const fileRef = useRef<HTMLInputElement>(null);

  // Payment dialog
  const [pOpen, setPOpen] = useState(false);
  const [payAmount, setPayAmount] = useState(0);
  const [payStaffId, setPayStaffId] = useState("");
  const [payNote, setPayNote] = useState("");

  // Attendance month
  const [monthDate, setMonthDate] = useState(() => startOfMonth(new Date()));
  const monthKey = format(monthDate, "yyyy-MM");
  const daysInMonth = getDaysInMonth(monthDate);

  const saveStaff = () => {
    if (!sDraft.name) return notify("Name required", "error");
    if (sDraft.id) { dispatch(updateStaff(sDraft)); notify("Staff updated", "success"); }
    else { dispatch(addStaff({ ...sDraft, id: `st-${Date.now()}`, joinedAt: new Date().toISOString() })); notify("Staff added", "success"); }
    setSOpen(false); setSDraft(blankStaff);
  };

  const handleImage = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 1.5 * 1024 * 1024) return notify("Image too large (max 1.5MB)", "error");
    const reader = new FileReader();
    reader.onload = () => setSDraft((d) => ({ ...d, imageDataUrl: reader.result as string }));
    reader.readAsDataURL(f);
  };

  const savePayment = () => {
    const st = staff.find((x) => x.id === payStaffId);
    if (!st) return notify("Select staff", "error");
    if (!payAmount) return notify("Enter amount", "error");
    const p: Payment = {
      id: `pay-${Date.now()}`, staffId: st.id, staffName: st.name,
      amount: payAmount, date: new Date().toISOString(), note: payNote,
    };
    dispatch(addPayment(p));
    notify("Payment recorded", "success");
    setPOpen(false); setPayAmount(0); setPayStaffId(""); setPayNote("");
  };

  // Salary card stats per staff
  const stats = useMemo(() => {
    return staff.map((st) => {
      const monthRecs = attendance.filter((r) => r.staffId === st.id && r.date.startsWith(monthKey));
      const present = monthRecs.filter((r) => r.status === "present").length;
      const absent = monthRecs.filter((r) => r.status === "absent").length;
      const half = monthRecs.filter((r) => r.status === "half").length;
      const perDay = st.perDaySalary && st.perDaySalary > 0 ? st.perDaySalary : st.salary / daysInMonth;
      // Payable = (present full days × perDay) + (half days × perDay/2)
      const earned = present * perDay + half * (perDay / 2);
      // Cap by monthly salary
      const payable = Math.min(st.salary || earned, earned > 0 ? earned : 0);
      const deduction = Math.max(0, (st.salary || 0) - payable);
      return { staff: st, present, absent, half, perDay, deduction, payable };
    });
  }, [staff, attendance, monthKey, daysInMonth]);

  return (
    <MuiLayout>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}
        sx={{ justifyContent: "space-between", alignItems: { sm: "center" }, mb: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Payroll</Typography>
          <Typography variant="body2" color="text.secondary">Staff, attendance and salary</Typography>
        </Box>
      </Stack>

      <Card sx={{ mb: 2 }}>
        <Tabs value={tab} onChange={(_e: SyntheticEvent, v: number) => setTab(v)} sx={{ px: 2, borderBottom: 1, borderColor: "divider" }}>
          <Tab label={`Staff (${staff.length})`} />
          <Tab label="Attendance" />
          <Tab label={`Payments (${payments.length})`} />
          <Tab label="Salary Cards" />
        </Tabs>

        {/* STAFF */}
        {tab === 0 && (
          <Box sx={{ p: 2 }}>
            <Stack direction="row" sx={{ justifyContent: "flex-end", mb: 2 }}>
              <Button variant="contained" startIcon={<Add />} onClick={() => { setSDraft(blankStaff); setSOpen(true); }}>
                Add Staff
              </Button>
            </Stack>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Member</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Contact</TableCell>
                    <TableCell>Joined</TableCell>
                    <TableCell align="right">Salary</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {staff.map((s) => (
                    <TableRow key={s.id} hover>
                      <TableCell>
                        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                          <Avatar src={s.imageDataUrl} sx={{ width: 36, height: 36 }}>{s.name[0]}</Avatar>
                          <Typography sx={{ fontWeight: 600 }}>{s.name}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>{s.role}</TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ display: "block" }}>{s.phone || "—"}</Typography>
                        <Typography variant="caption" color="text.secondary">{s.email || ""}</Typography>
                      </TableCell>
                      <TableCell>{format(new Date(s.joinedAt), "dd MMM yy")}</TableCell>
                      <TableCell align="right">₹{s.salary.toLocaleString("en-IN")}</TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => { setSDraft(s); setSOpen(true); }}><Edit fontSize="small" /></IconButton>
                        <IconButton size="small" color="error" onClick={() => { dispatch(deleteStaff(s.id)); notify("Deleted", "info"); }}>
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

        {/* ATTENDANCE */}
        {tab === 1 && (
          <Box sx={{ p: 2 }}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}
              sx={{ alignItems: { sm: "center" }, justifyContent: "space-between", mb: 2 }}>
              <TextField
                type="month" size="small" label="Month"
                value={monthKey}
                onChange={(e) => setMonthDate(startOfMonth(new Date(e.target.value + "-01")))}
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <Typography variant="caption" color="text.secondary">
                <Event sx={{ fontSize: 14, verticalAlign: "middle", mr: 0.5 }} />
                {daysInMonth} days · click cells to mark P / A / H
              </Typography>
            </Stack>
            <TableContainer sx={{ maxWidth: "100%" }}>
              <Table size="small" sx={{ "& td, & th": { p: 0.5, textAlign: "center" } }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ position: "sticky", left: 0, bgcolor: "background.paper", textAlign: "left !important", minWidth: 140 }}>
                      Staff
                    </TableCell>
                    {Array.from({ length: daysInMonth }, (_, i) => (
                      <TableCell key={i} sx={{ fontSize: 11 }}>{i + 1}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {staff.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell sx={{ position: "sticky", left: 0, bgcolor: "background.paper", textAlign: "left !important", fontWeight: 600 }}>
                        {s.name}
                      </TableCell>
                      {Array.from({ length: daysInMonth }, (_, i) => {
                        const day = String(i + 1).padStart(2, "0");
                        const date = `${monthKey}-${day}`;
                        const rec = attendance.find((r) => r.staffId === s.id && r.date === date);
                        const next: Record<AttendanceStatus | "none", AttendanceStatus> = {
                          none: "present", present: "absent", absent: "half", half: "present",
                        };
                        const status = rec?.status ?? "none";
                        const color = status === "present" ? "success.main"
                          : status === "absent" ? "error.main"
                          : status === "half" ? "warning.main" : "transparent";
                        const label = status === "present" ? "P" : status === "absent" ? "A" : status === "half" ? "H" : "";
                        return (
                          <TableCell key={i}>
                            <Box
                              onClick={() => dispatch(setAttendance({ staffId: s.id, date, status: next[status] }))}
                              sx={{
                                cursor: "pointer", width: 22, height: 22, mx: "auto",
                                borderRadius: 1, border: "1px solid", borderColor: "divider",
                                bgcolor: color, color: "#fff", fontSize: 11,
                                display: "grid", placeItems: "center", fontWeight: 700,
                                transition: "transform .15s",
                                "&:hover": { transform: "scale(1.15)" },
                              }}
                            >{label}</Box>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
              <Chip size="small" color="success" label="P – Present" />
              <Chip size="small" color="error" label="A – Absent" />
              <Chip size="small" color="warning" label="H – Half day" />
            </Stack>
          </Box>
        )}

        {/* PAYMENTS */}
        {tab === 2 && (
          <Box sx={{ p: 2 }}>
            <Stack direction="row" sx={{ justifyContent: "flex-end", mb: 2 }}>
              <Button variant="contained" startIcon={<Add />} onClick={() => setPOpen(true)}>New Payment</Button>
            </Stack>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Staff</TableCell>
                    <TableCell>Note</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payments.length === 0 && (
                    <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4, color: "text.secondary" }}>No payments yet</TableCell></TableRow>
                  )}
                  {payments.map((p) => (
                    <TableRow key={p.id} hover>
                      <TableCell>{format(new Date(p.date), "dd MMM yy")}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{p.staffName}</TableCell>
                      <TableCell sx={{ color: "text.secondary" }}>{p.note}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>₹{p.amount.toLocaleString("en-IN")}</TableCell>
                      <TableCell align="right">
                        <IconButton size="small" color="error" onClick={() => { dispatch(deletePayment(p.id)); notify("Deleted", "info"); }}>
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

        {/* SALARY CARDS */}
        {tab === 3 && (
          <Box sx={{ p: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
              Showing for {format(monthDate, "MMMM yyyy")} · {daysInMonth} days
            </Typography>
            <Grid container spacing={2}>
              {stats.map(({ staff: s, present, absent, half, deduction, payable }) => (
                <Grid key={s.id} size={{ xs: 12, sm: 6, md: 4 }}>
                  <Card variant="outlined">
                    <CardContent>
                      <Stack direction="row" spacing={2} sx={{ alignItems: "center", mb: 2 }}>
                        <Avatar src={s.imageDataUrl} sx={{ width: 56, height: 56 }}>{s.name[0]}</Avatar>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography sx={{ fontWeight: 700 }} noWrap>{s.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{s.role}</Typography>
                          <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", mt: 0.5 }}>
                            <PhoneIcon sx={{ fontSize: 12, color: "text.secondary" }} />
                            <Typography variant="caption" color="text.secondary">{s.phone || "—"}</Typography>
                          </Stack>
                          <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                            <Email sx={{ fontSize: 12, color: "text.secondary" }} />
                            <Typography variant="caption" color="text.secondary" noWrap>{s.email || "—"}</Typography>
                          </Stack>
                        </Box>
                      </Stack>
                      <Divider sx={{ mb: 1.5 }} />
                      <Stack spacing={0.5}>
                        <Row label="Present" value={String(present)} />
                        <Row label="Absent" value={String(absent)} />
                        <Row label="Half days" value={String(half)} />
                        <Row label="Salary" value={`₹${s.salary.toLocaleString("en-IN")}`} />
                        <Row label="Deduction" value={`-₹${deduction.toFixed(0)}`} color="error.main" />
                        <Divider sx={{ my: 1 }} />
                        <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                          <Typography sx={{ fontWeight: 700 }}>Payable</Typography>
                          <Typography sx={{ fontWeight: 800 }} color="primary">₹{payable.toFixed(0)}</Typography>
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Card>

      {/* Staff dialog */}
      <Dialog open={sOpen} onClose={() => setSOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{sDraft.id ? "Edit Staff" : "Add Staff"}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
              <Avatar src={sDraft.imageDataUrl} sx={{ width: 64, height: 64 }}>{sDraft.name[0] || "?"}</Avatar>
              <Button startIcon={<CameraAlt />} variant="outlined" onClick={() => fileRef.current?.click()}>
                Upload Image
              </Button>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleImage} />
            </Stack>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Name" value={sDraft.name} onChange={(e) => setSDraft({ ...sDraft, name: e.target.value })} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Role" value={sDraft.role} onChange={(e) => setSDraft({ ...sDraft, role: e.target.value })} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Phone" value={sDraft.phone} onChange={(e) => setSDraft({ ...sDraft, phone: e.target.value })} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Email" value={sDraft.email} onChange={(e) => setSDraft({ ...sDraft, email: e.target.value })} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField fullWidth type="number" label="Monthly Salary" value={sDraft.salary} onChange={(e) => setSDraft({ ...sDraft, salary: +e.target.value })} />
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={saveStaff}>{sDraft.id ? "Save" : "Add"}</Button>
        </DialogActions>
      </Dialog>

      {/* Payment dialog */}
      <Dialog open={pOpen} onClose={() => setPOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Record Payment</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <TextField select label="Staff" value={payStaffId} onChange={(e) => setPayStaffId(e.target.value)}>
              {staff.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
            </TextField>
            <TextField type="number" label="Amount" value={payAmount} onChange={(e) => setPayAmount(+e.target.value)} />
            <TextField label="Note" value={payNote} onChange={(e) => setPayNote(e.target.value)} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={savePayment}>Record</Button>
        </DialogActions>
      </Dialog>
    </MuiLayout>
  );
}

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <Stack direction="row" sx={{ justifyContent: "space-between" }}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 600, color }}>{value}</Typography>
    </Stack>
  );
}
