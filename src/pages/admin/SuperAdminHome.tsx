import { Box, Typography, Card, CardContent, Stack } from "@mui/material";
import { useAppSelector } from "@/store";

export default function SuperAdminHome() {
  const user = useAppSelector((s) => s.auth.user);
  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack spacing={2}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Super Admin Panel
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Signed in as {user?.name} ({user?.email})
        </Typography>
        <Card>
          <CardContent>
            <Typography variant="body1">
              Dashboard, Clients, Queries, and Subscription pages will be built in the
              next step. This screen confirms role-based routing is working — only
              Super Admins can reach <code>/admin</code>.
            </Typography>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}
