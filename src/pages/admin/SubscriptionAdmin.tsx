import { useState } from "react";
import {
  Box, Card, CardContent, Stack, Typography, Button, Chip, IconButton, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Grid,
} from "@mui/material";
import { Add, Edit, Delete } from "@mui/icons-material";
import { AdminLayout } from "@/components/AdminLayout";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  addPlan, updatePlan, deletePlan, Plan, Duration,
} from "@/store/slices/subscriptionSlice";
import { useNotify } from "@/components/NotifyProvider";

const blank: Plan = { id: "", name: "", price: 0, duration: "monthly", features: "" };

export default function SubscriptionAdmin() {
  const dispatch = useAppDispatch();
  const notify = useNotify();
  const plans = useAppSelector((s) => s.subscriptions.plans);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Plan>(blank);

  const save = () => {
    if (!draft.name) return notify("Plan name required", "error");
    if (draft.price <= 0) return notify("Price must be positive", "error");
    if (draft.duration === "custom" && !draft.customDays) return notify("Set custom days", "error");
    if (draft.id) {
      dispatch(updatePlan(draft));
      notify("Plan updated", "success");
    } else {
      dispatch(addPlan({ ...draft, id: `plan-${Date.now()}` }));
      notify("Plan added", "success");
    }
    setOpen(false); setDraft(blank);
  };

  return (
    <AdminLayout>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}
        sx={{ justifyContent: "space-between", alignItems: { sm: "center" }, mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Subscription Plans</Typography>
          <Typography variant="body2" color="text.secondary">
            Plans you create here are visible to all client businesses
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => { setDraft(blank); setOpen(true); }}>
          Add Plan
        </Button>
      </Stack>

      <Grid container spacing={2}>
        {plans.map((p) => (
          <Grid key={p.id} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card>
              <CardContent>
                <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>{p.name}</Typography>
                  <Chip size="small" color="primary" label={p.duration === "custom" ? `${p.customDays}d` : p.duration} />
                </Stack>
                <Typography variant="h4" sx={{ fontWeight: 800, my: 1 }}>
                  ₹{p.price.toLocaleString("en-IN")}
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Typography variant="body2" color="text.secondary" sx={{ minHeight: 40 }}>
                  {p.features || "No description"}
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 2, justifyContent: "flex-end" }}>
                  <IconButton size="small" onClick={() => { setDraft(p); setOpen(true); }}>
                    <Edit fontSize="small" />
                  </IconButton>
                  <IconButton size="small" color="error"
                    onClick={() => { dispatch(deletePlan(p.id)); notify("Deleted", "info"); }}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{draft.id ? "Edit Plan" : "Add Plan"}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="Plan Name" value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth type="number" label="Price (₹)" value={draft.price}
                onChange={(e) => setDraft({ ...draft, price: +e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField select fullWidth label="Duration" value={draft.duration}
                onChange={(e) => setDraft({ ...draft, duration: e.target.value as Duration })}
              >
                <MenuItem value="monthly">Monthly</MenuItem>
                <MenuItem value="yearly">Yearly</MenuItem>
                <MenuItem value="custom">Custom</MenuItem>
              </TextField>
            </Grid>
            {draft.duration === "custom" && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth type="number" label="Custom Days"
                  value={draft.customDays ?? 0}
                  onChange={(e) => setDraft({ ...draft, customDays: +e.target.value })} />
              </Grid>
            )}
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth multiline minRows={3} label="Features (optional)"
                value={draft.features ?? ""}
                onChange={(e) => setDraft({ ...draft, features: e.target.value })} />
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
