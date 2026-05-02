import { useMemo, useState } from "react";
import {
  Box, Card, CardContent, Grid, Stack, Typography, Button, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  ToggleButtonGroup, ToggleButton, Avatar, Divider, FormControlLabel, Checkbox,
  Accordion, AccordionSummary, AccordionDetails,
} from "@mui/material";
import { Add, Edit, Delete, Email, Phone, Place, Business as BusinessIcon, ExpandMore } from "@mui/icons-material";
import { AdminLayout } from "@/components/AdminLayout";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  addClient, updateClient, deleteClient, ClientBusiness, getClientStatus,
  assignSubscription, ALL_CLIENT_PAGES, ClientPageKey,
} from "@/store/slices/clientsSlice";
import { planDays } from "@/store/slices/subscriptionSlice";
import { useNotify } from "@/components/NotifyProvider";

type Filter = "all" | "active" | "trial" | "inactive";

const blank: ClientBusiness = {
  id: "", businessName: "", ownerName: "", email: "", phone: "",
  altPhone: "", gstin: "", licenseNo: "", fssaiNo: "", password: "",
  address: "", category: "", trialDays: 14, createdAt: new Date().toISOString(),
  allowedPages: undefined,
};

export default function ClientsAdmin() {
  const dispatch = useAppDispatch();
  const notify = useNotify();
  const clients = useAppSelector((s) => s.clients.items);
  const plans = useAppSelector((s) => s.subscriptions.plans);
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<ClientBusiness>(blank);

  const filtered = useMemo(() => {
    return clients.filter((c) => filter === "all" || getClientStatus(c) === filter);
  }, [clients, filter]);

  const counts = useMemo(() => ({
    all: clients.length,
    active: clients.filter((c) => getClientStatus(c) === "active").length,
    trial: clients.filter((c) => getClientStatus(c) === "trial").length,
    inactive: clients.filter((c) => getClientStatus(c) === "inactive").length,
  }), [clients]);

  const save = () => {
    if (!draft.businessName) return notify("Business name required", "error");
    if (draft.id) {
      dispatch(updateClient(draft));
      notify("Client updated", "success");
    } else {
      dispatch(addClient({ ...draft, id: `biz-${Date.now()}`, createdAt: new Date().toISOString() }));
      notify("Client added", "success");
    }
    setOpen(false); setDraft(blank);
  };

  const assignPlan = (clientId: string, planId: string) => {
    const p = plans.find((x) => x.id === planId);
    if (!p) return;
    const startedAt = new Date();
    const endsAt = new Date(startedAt.getTime() + planDays(p) * 86400000);
    dispatch(assignSubscription({
      clientId, planId, startedAt: startedAt.toISOString(), endsAt: endsAt.toISOString(),
    }));
    notify(`Plan "${p.name}" assigned`, "success");
  };

  return (
    <AdminLayout>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}
        sx={{ justifyContent: "space-between", alignItems: { sm: "center" }, mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Client Businesses</Typography>
          <Typography variant="body2" color="text.secondary">
            Manage all connected businesses
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => { setDraft(blank); setOpen(true); }}>
          Add New Client
        </Button>
      </Stack>

      <ToggleButtonGroup
        size="small" exclusive value={filter}
        onChange={(_e, v) => v && setFilter(v)}
        color="primary" sx={{ mb: 3 }}
      >
        <ToggleButton value="all">All ({counts.all})</ToggleButton>
        <ToggleButton value="active">Active ({counts.active})</ToggleButton>
        <ToggleButton value="trial">Trial ({counts.trial})</ToggleButton>
        <ToggleButton value="inactive">Inactive ({counts.inactive})</ToggleButton>
      </ToggleButtonGroup>

      <Grid container spacing={2}>
        {filtered.map((c) => {
          const st = getClientStatus(c);
          const plan = plans.find((p) => p.id === c.subscriptionPlanId);
          return (
            <Grid key={c.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card>
                <CardContent>
                  <Stack direction="row" spacing={2} sx={{ alignItems: "center", mb: 2 }}>
                    <Avatar sx={{ bgcolor: "primary.main", color: "primary.contrastText" }}>
                      <BusinessIcon />
                    </Avatar>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography sx={{ fontWeight: 700 }} noWrap>{c.businessName}</Typography>
                      <Typography variant="caption" color="text.secondary">{c.category || "—"}</Typography>
                    </Box>
                    <Chip
                      size="small" label={st}
                      color={st === "active" ? "success" : st === "trial" ? "warning" : "default"}
                    />
                  </Stack>
                  <Divider sx={{ mb: 1.5 }} />
                  <Stack spacing={0.5} sx={{ mb: 1.5 }}>
                    <Row icon={<BusinessIcon sx={{ fontSize: 14 }} />} text={`Owner: ${c.ownerName || "—"}`} />
                    <Row icon={<Phone sx={{ fontSize: 14 }} />} text={c.phone || "—"} />
                    <Row icon={<Email sx={{ fontSize: 14 }} />} text={c.email || "—"} />
                    <Row icon={<Place sx={{ fontSize: 14 }} />} text={c.address || "—"} />
                  </Stack>
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
                    <Chip size="small" variant="outlined" label={`Trial: ${c.trialDays}d`} />
                    {plan ? (
                      <Chip size="small" color="primary" label={`Plan: ${plan.name}`} />
                    ) : (
                      <Chip size="small" variant="outlined" label="No plan" />
                    )}
                  </Stack>
                  <Divider sx={{ my: 1.5 }} />
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                    <TextField
                      select size="small" fullWidth
                      label="Assign plan"
                      value={c.subscriptionPlanId ?? ""}
                      onChange={(e) => assignPlan(c.id, e.target.value)}
                    >
                      {plans.map((p) => (
                        <MenuItem key={p.id} value={p.id}>{p.name} — ₹{p.price}</MenuItem>
                      ))}
                    </TextField>
                    <IconButton size="small" onClick={() => { setDraft(c); setOpen(true); }}>
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error"
                      onClick={() => { dispatch(deleteClient(c.id)); notify("Deleted", "info"); }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
        {filtered.length === 0 && (
          <Grid size={{ xs: 12 }}>
            <Card><CardContent>
              <Typography align="center" color="text.secondary">No businesses in this category.</Typography>
            </CardContent></Card>
          </Grid>
        )}
      </Grid>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{draft.id ? "Edit Client" : "Add New Client"}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="Business Name" value={draft.businessName}
                onChange={(e) => setDraft({ ...draft, businessName: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="Owner Name" value={draft.ownerName}
                onChange={(e) => setDraft({ ...draft, ownerName: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="Email" value={draft.email}
                onChange={(e) => setDraft({ ...draft, email: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="Phone" value={draft.phone}
                onChange={(e) => setDraft({ ...draft, phone: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth label="Address" value={draft.address}
                onChange={(e) => setDraft({ ...draft, address: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="Category" value={draft.category}
                onChange={(e) => setDraft({ ...draft, category: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth type="number" label="Trial Period (days)" value={draft.trialDays}
                onChange={(e) => setDraft({ ...draft, trialDays: Math.max(0, +e.target.value) })}
                helperText="0 = no trial → marked Inactive until subscribed"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={save}>{draft.id ? "Save" : "Add"}</Button>
        </DialogActions>
      </Dialog>
    </AdminLayout>
  );
}

function Row({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: "center", color: "text.secondary" }}>
      {icon}<Typography variant="caption" noWrap>{text}</Typography>
    </Stack>
  );
}
