import { ReactNode, useState, MouseEvent } from "react";
import {
  AppBar, Toolbar, Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText,
  IconButton, Typography, Divider, Chip, useMediaQuery, useTheme, Menu, MenuItem,
  Badge,
} from "@mui/material";
import {
  Menu as MenuIcon, Dashboard as DashboardIcon, Business, QuestionAnswer,
  CardMembership, Logout as LogoutIcon, Notifications as NotificationsIcon,
} from "@mui/icons-material";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store";
import { logout } from "@/store/slices/authSlice";

const DRAWER_WIDTH = 248;

const items = [
  { title: "Dashboard", url: "/admin", icon: <DashboardIcon /> },
  { title: "Clients", url: "/admin/clients", icon: <Business /> },
  { title: "Queries", url: "/admin/queries", icon: <QuestionAnswer /> },
  { title: "Subscription", url: "/admin/subscription", icon: <CardMembership /> },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const queries = useAppSelector((s) => s.support.queries);
  const openCount = queries.filter((q) => !q.resolved).length;
  const [notifAnchor, setNotifAnchor] = useState<HTMLElement | null>(null);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login", { replace: true });
  };

  const drawer = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Toolbar sx={{ gap: 1.5, borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
        <Box sx={{
          width: 36, height: 36, borderRadius: 1.5, bgcolor: "primary.main",
          color: "primary.contrastText", display: "grid", placeItems: "center", fontWeight: 800,
        }}>S</Box>
        <Box>
          <Typography variant="subtitle2" sx={{ lineHeight: 1.1, fontWeight: 700 }}>
            Inventra Admin
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Super Admin Panel
          </Typography>
        </Box>
      </Toolbar>
      <List sx={{ flex: 1, px: 1, py: 1.5 }} dense>
        {items.map((m) => {
          const active = m.url === "/admin" ? pathname === "/admin" : pathname.startsWith(m.url);
          return (
            <ListItemButton
              key={m.url} component={NavLink} to={m.url}
              onClick={() => isMobile && setMobileOpen(false)}
              sx={{
                borderRadius: 2, mb: 0.5,
                color: active ? "secondary.main" : "text.secondary",
                bgcolor: active ? "rgba(245,180,0,0.18)" : "transparent",
                "&:hover": { bgcolor: active ? "rgba(245,180,0,0.28)" : "rgba(0,0,0,0.04)" },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36, color: "inherit" }}>{m.icon}</ListItemIcon>
              <ListItemText primary={m.title} slotProps={{ primary: { sx: { fontSize: 14, fontWeight: active ? 700 : 500 } } }} />
            </ListItemButton>
          );
        })}
      </List>
      <Divider />
      <Box sx={{ p: 1.5 }}>
        <Typography variant="caption" color="text.secondary">
          {user?.email}
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar position="fixed" elevation={0}
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
        }}
      >
        <Toolbar sx={{ gap: 2 }}>
          <IconButton edge="start" onClick={() => setMobileOpen(true)} sx={{ display: { md: "none" } }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flex: 1, fontWeight: 700 }}>
            {pageTitle(pathname)}
          </Typography>
          <Chip label="SUPER ADMIN" color="primary" sx={{ fontWeight: 700, display: { xs: "none", sm: "inline-flex" } }} />
          <IconButton onClick={(e: MouseEvent<HTMLElement>) => setNotifAnchor(e.currentTarget)}>
            <Badge color="error" badgeContent={openCount}>
              <NotificationsIcon />
            </Badge>
          </IconButton>
          <Menu
            anchorEl={notifAnchor}
            open={Boolean(notifAnchor)}
            onClose={() => setNotifAnchor(null)}
            slotProps={{ paper: { sx: { width: 320 } } }}
          >
            <MenuItem disabled sx={{ opacity: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Open Queries ({openCount})</Typography>
            </MenuItem>
            <Divider />
            {queries.filter((q) => !q.resolved).slice(0, 5).map((q) => (
              <MenuItem key={q.id} onClick={() => { setNotifAnchor(null); navigate("/admin/queries"); }}>
                <ListItemText
                  primary={q.businessName}
                  secondary={q.message}
                  slotProps={{ secondary: { sx: { whiteSpace: "normal" } } }}
                />
              </MenuItem>
            ))}
            {openCount === 0 && (
              <MenuItem disabled><ListItemText primary="No open queries" /></MenuItem>
            )}
          </Menu>
          <IconButton onClick={handleLogout} title="Sign out"><LogoutIcon /></IconButton>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary" open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: "block", md: "none" }, "& .MuiDrawer-paper": { width: DRAWER_WIDTH } }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent" open
          sx={{ display: { xs: "none", md: "block" }, "& .MuiDrawer-paper": { width: DRAWER_WIDTH, boxSizing: "border-box" } }}
        >
          {drawer}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, width: { md: `calc(100% - ${DRAWER_WIDTH}px)` } }}>
        <Toolbar />
        <Box sx={{ p: { xs: 2, md: 3 } }}>{children}</Box>
      </Box>
    </Box>
  );
}

function pageTitle(p: string) {
  if (p === "/admin") return "Super Admin Dashboard";
  if (p.startsWith("/admin/clients")) return "Clients";
  if (p.startsWith("/admin/queries")) return "Queries & FAQs";
  if (p.startsWith("/admin/subscription")) return "Subscription Plans";
  return "Admin";
}
