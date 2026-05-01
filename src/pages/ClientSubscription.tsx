import { useMemo } from "react";
import {
  Box, Card, CardContent, Stack, Typography, Grid, Chip, Button, Divider, Alert,
} from "@mui/material";
import { CheckCircle } from "@mui/icons-material";
import { MuiLayout } from "@/components/MuiLayout";
import { useAppDispatch, useAppSelector } from "@/store";
import { planDays } from "@/store/slices/subscriptionSlice";
import { assignSubscription, getClientStatus } from "@/store/slices/clientsSlice";
import { useNotify } from "@/components/NotifyProvider";

export default function ClientSubscription() {
  const dispatch = useAppDispatch();
  const notify = useNotify();
  const plans = useAppSelector((s) => s.subscriptions.plans);
  const user = useAppSelector((s) => s.auth.user);
  const clients = useAppSelector((s) => s.clients.items);

  // Client admin's own business (matched on businessId)
  const myBiz = useMemo(
    () => clients.find((c) => c.id === user?.businessId) ?? clients[0],
    [clients, user],
  );
  const status = myBiz ? getClientStatus(myBiz) : "inactive";
  const currentPlan = plans.find((p) => p.id === myBiz?.subscriptionPlanId);

  const subscribe = (planId: string) => {
    if (!myBiz) return;
    const p = plans.find((x) => x.id === planId);
    if (!p) return;
    const startedAt = new Date();
    const endsAt = new Date(startedAt.getTime() + planDays(p) * 86400000);
    dispatch(assignSubscription({
      clientId: myBiz.id, planId,
      startedAt: startedAt.toISOString(), endsAt: endsAt.toISOString(),
    }));
    notify(`Subscribed to ${p.name}`, "success");
  };

  return (
    <MuiLayout>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Subscription</Typography>
          <Typography variant="body2" color="text.secondary">
            Choose a plan that fits your business
          </Typography>
        </Box>

        <Card>
          <CardContent>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}
              sx={{ justifyContent: "space-between", alignItems: { sm: "center" } }}>
              <Box>
                <Typography variant="caption" color="text.secondary">Current status</Typography>
                <Stack direction="row" spacing={1} sx={{ alignItems: "center", mt: 0.5 }}>
                  <Chip label={status}
                    color={status === "active" ? "success" : status === "trial" ? "warning" : "default"} />
                  {currentPlan && <Chip label={`Plan: ${currentPlan.name}`} variant="outlined" />}
                  {myBiz?.subscriptionEndsAt && (
                    <Typography variant="caption" color="text.secondary">
                      Until {new Date(myBiz.subscriptionEndsAt).toLocaleDateString()}
                    </Typography>
                  )}
                </Stack>
              </Box>
            </Stack>
            {status !== "active" && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                Your subscription is {status}. Pick a plan below to activate full features.
              </Alert>
            )}
          </CardContent>
        </Card>

        <Grid container spacing={2}>
          {plans.map((p) => {
            const isCurrent = currentPlan?.id === p.id && status === "active";
            return (
              <Grid key={p.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <Card sx={{ borderColor: isCurrent ? "primary.main" : undefined, borderWidth: isCurrent ? 2 : 1 }}>
                  <CardContent>
                    <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>{p.name}</Typography>
                      <Chip size="small" color="primary" variant={isCurrent ? "filled" : "outlined"}
                        label={p.duration === "custom" ? `${p.customDays}d` : p.duration} />
                    </Stack>
                    <Typography variant="h4" sx={{ fontWeight: 800, my: 1 }}>
                      ₹{p.price.toLocaleString("en-IN")}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ minHeight: 60 }}>
                      {p.features || "—"}
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <Button
                      fullWidth
                      variant={isCurrent ? "outlined" : "contained"}
                      startIcon={isCurrent ? <CheckCircle /> : undefined}
                      disabled={isCurrent}
                      onClick={() => subscribe(p.id)}
                    >
                      {isCurrent ? "Current Plan" : "Subscribe"}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Stack>
    </MuiLayout>
  );
}
