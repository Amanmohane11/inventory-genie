import { useMemo } from "react";
import {
  Box, Card, CardContent, Grid, Stack, Typography, Avatar, Chip, Divider,
  Table, TableBody, TableCell, TableHead, TableRow, TableContainer,
} from "@mui/material";
import {
  Business, MonetizationOn, Verified, HourglassEmpty, ErrorOutlined,
} from "@mui/icons-material";
import { AdminLayout } from "@/components/AdminLayout";
import { useAppSelector } from "@/store";
import { getClientStatus } from "@/store/slices/clientsSlice";
import { planDays } from "@/store/slices/subscriptionSlice";

const fmt = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

export default function AdminDashboard() {
  const clients = useAppSelector((s) => s.clients.items);
  const plans = useAppSelector((s) => s.subscriptions.plans);

  const stats = useMemo(() => {
    let active = 0, trial = 0, inactive = 0, revenue = 0;
    const byPlan = new Map<string, number>();
    clients.forEach((c) => {
      const st = getClientStatus(c);
      if (st === "active") active++;
      else if (st === "trial") trial++;
      else inactive++;
      if (st === "active" && c.subscriptionPlanId) {
        const p = plans.find((x) => x.id === c.subscriptionPlanId);
        if (p) {
          revenue += p.price;
          byPlan.set(p.name, (byPlan.get(p.name) ?? 0) + 1);
        }
      }
    });
    return { active, trial, inactive, revenue, byPlan: Array.from(byPlan.entries()) };
  }, [clients, plans]);

  return (
    <AdminLayout>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Overview</Typography>
          <Typography variant="body2" color="text.secondary">
            Platform-wide metrics across all client businesses
          </Typography>
        </Box>

        <Grid container spacing={2}>
          <KPI label="Total Businesses" value={String(clients.length)} icon={<Business />} color="primary" />
          <KPI label="Active" value={String(stats.active)} icon={<Verified />} color="success" />
          <KPI label="Trial" value={String(stats.trial)} icon={<HourglassEmpty />} color="warning" />
          <KPI label="Inactive" value={String(stats.inactive)} icon={<ErrorOutlined />} color="error" />
        </Grid>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 5 }}>
            <Card>
              <CardContent>
                <Stack direction="row" spacing={2} sx={{ alignItems: "center", mb: 1 }}>
                  <Avatar sx={{ bgcolor: "primary.main", color: "primary.contrastText" }}>
                    <MonetizationOn />
                  </Avatar>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Total Subscription Revenue
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 800 }}>{fmt(stats.revenue)}</Typography>
                  </Box>
                </Stack>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>By Plan</Typography>
                <Stack spacing={1}>
                  {stats.byPlan.length === 0 && (
                    <Typography variant="body2" color="text.secondary">No active subscriptions</Typography>
                  )}
                  {stats.byPlan.map(([name, count]) => (
                    <Stack key={name} direction="row" sx={{ justifyContent: "space-between" }}>
                      <Chip size="small" label={name} variant="outlined" />
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{count} active</Typography>
                    </Stack>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 7 }}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Recent Businesses</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Business</TableCell>
                        <TableCell>Owner</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Plan</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {clients.slice(0, 8).map((c) => {
                        const st = getClientStatus(c);
                        const plan = plans.find((p) => p.id === c.subscriptionPlanId);
                        return (
                          <TableRow key={c.id} hover>
                            <TableCell sx={{ fontWeight: 600 }}>{c.businessName}</TableCell>
                            <TableCell>{c.ownerName}</TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                label={st}
                                color={st === "active" ? "success" : st === "trial" ? "warning" : "default"}
                              />
                            </TableCell>
                            <TableCell>{plan ? `${plan.name} · ${planDays(plan)}d` : "—"}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Stack>
    </AdminLayout>
  );
}

function KPI({
  label, value, icon, color,
}: { label: string; value: string; icon: React.ReactNode; color: "primary" | "warning" | "success" | "error" }) {
  return (
    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
      <Card>
        <CardContent>
          <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
            <Avatar sx={{ bgcolor: `${color}.main` }}>{icon}</Avatar>
            <Box>
              <Typography variant="caption" color="text.secondary">{label}</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>{value}</Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Grid>
  );
}
