import { FormEvent, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box, Card, CardContent, Typography, TextField, Button, Stack,
  Alert, Divider, Chip,
} from "@mui/material";
import { LockOutlined } from "@mui/icons-material";
import { useAppDispatch } from "@/store";
import { loginSuccess, MOCK_CREDENTIALS } from "@/store/slices/authSlice";
import { useNotify } from "@/components/NotifyProvider";

export default function Login() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const notify = useNotify();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const found = MOCK_CREDENTIALS.find(
      (c) => c.email.toLowerCase() === email.trim().toLowerCase() && c.password === password
    );
    if (!found) {
      setError("Invalid email or password.");
      return;
    }
    const { password: _pw, ...user } = found;
    dispatch(loginSuccess(user));
    notify(`Welcome, ${user.name}`, "success");
    const from = (location.state as { from?: string } | null)?.from;
    const home = user.role === "super_admin" ? "/admin" : "/";
    navigate(from && from !== "/login" ? from : home, { replace: true });
  };

  const fill = (e: string, p: string) => { setEmail(e); setPassword(p); };

  return (
    <Box sx={{
      minHeight: "100vh", display: "grid", placeItems: "center",
      bgcolor: "background.default", p: 2,
    }}>
      <Card sx={{ width: "100%", maxWidth: 420 }}>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Stack spacing={1} sx={{ mb: 2, alignItems: "center" }}>
            <Box sx={{
              width: 48, height: 48, borderRadius: 2, bgcolor: "primary.main",
              color: "primary.contrastText", display: "grid", placeItems: "center",
            }}>
              <LockOutlined />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>Sign in to Inventra</Typography>
            <Typography variant="body2" color="text.secondary">
              Use your role-based credentials
            </Typography>
          </Stack>

          <Box component="form" onSubmit={onSubmit}>
            <Stack spacing={2}>
              {error && <Alert severity="error">{error}</Alert>}
              <TextField
                label="Email" type="email" fullWidth required autoFocus
                value={email} onChange={(e) => setEmail(e.target.value)}
              />
              <TextField
                label="Password" type="password" fullWidth required
                value={password} onChange={(e) => setPassword(e.target.value)}
              />
              <Button type="submit" variant="contained" size="large" fullWidth>
                Sign in
              </Button>
            </Stack>
          </Box>

          <Divider sx={{ my: 3 }}>
            <Chip label="Demo accounts" size="small" />
          </Divider>

          <Stack spacing={1}>
            <DemoRow
              label="Super Admin"
              email="superadmin@inventra.app"
              password="super123"
              onUse={() => fill("superadmin@inventra.app", "super123")}
            />
            <DemoRow
              label="Client Admin"
              email="admin@business.app"
              password="client123"
              onUse={() => fill("admin@business.app", "client123")}
            />
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}

function DemoRow({
  label, email, password, onUse,
}: { label: string; email: string; password: string; onUse: () => void }) {
  return (
    <Box sx={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      gap: 1, p: 1.25, borderRadius: 2, border: "1px solid rgba(0,0,0,0.08)",
    }}>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" color="text.secondary">{label}</Typography>
        <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{email}</Typography>
        <Typography variant="caption" color="text.secondary">pwd: {password}</Typography>
      </Box>
      <Button size="small" variant="outlined" onClick={onUse}>Use</Button>
    </Box>
  );
}
