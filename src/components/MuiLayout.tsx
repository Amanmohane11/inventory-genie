import { ReactNode, useState, MouseEvent } from "react";
import {
  AppBar, Toolbar, Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText,
  IconButton, Typography, Divider, Collapse, Chip, Badge, Menu, MenuItem,
  useMediaQuery, useTheme,
} from "@mui/material";
import {
  Menu as MenuIcon, Dashboard as DashboardIcon, People, Inventory2,
  ReceiptLong, AssignmentReturn, Assessment, Groups, Settings as SettingsIcon,
  ExpandLess, ExpandMore, ShoppingCart, ShoppingBag, History as HistoryIcon,
  Notifications as NotificationsIcon, Description,
} from "@mui/icons-material";
import { NavLink, useLocation } from "react-router-dom";
import { useAppSelector } from "@/store";

const DRAWER_WIDTH = 248;

const main = [
  { title: "Dashboard", url: "/", icon: <DashboardIcon /> },
  { title: "Parties", url: "/parties", icon: <People /> },
  { title: "Items", url: "/items", icon: <Inventory2 /> },
];

const billChildren = [
  { title: "Sales Bills", url: "/bills/sales", icon: <ShoppingCart fontSize="small" /> },
  { title: "Return Sales Bill", url: "/bills/return", icon: <AssignmentReturn fontSize="small" /> },
  { title: "Estimate", url: "/bills/estimate", icon: <Description fontSize="small" /> },
  { title: "Purchase Bills", url: "/bills/purchase", icon: <ShoppingBag fontSize="small" /> },
  { title: "History", url: "/bills/history", icon: <HistoryIcon fontSize="small" /> },
];

const more = [
  { title: "Debit Note", url: "/debit-note", icon: <AssignmentReturn /> },
  { title: "Reports", url: "/reports", icon: <Assessment /> },
  { title: "Payroll", url: "/payroll", icon: <Groups /> },
  { title: "Settings", url: "/settings", icon: <SettingsIcon /> },
];

export function MuiLayout({ children }: { children: ReactNode }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();
  const billsActive = pathname.startsWith("/bills");
  const [billsOpen, setBillsOpen] = useState(billsActive);
  const settings = useAppSelector((s) => s.settings);
  const [notifAnchor, setNotifAnchor] = useState<HTMLElement | null>(null);

  const drawer = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Toolbar sx={{ gap: 1.5, borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
        <Box sx={{
          width: 36, height: 36, borderRadius: 1.5, bgcolor: "primary.main",
          color: "primary.contrastText", display: "grid", placeItems: "center", fontWeight: 800,
        }}>
          I
        </Box>
        <Box>
          <Typography variant="subtitle2" sx={{ lineHeight: 1.1, fontWeight: 700 }}>
            Inventra
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Inventory Suite
          </Typography>
        </Box>
      </Toolbar>
      <List sx={{ flex: 1, px: 1, py: 1.5 }} dense>
        {main.map((m) => (
          <NavItem key={m.url} to={m.url} icon={m.icon} label={m.title} onClick={() => isMobile && setMobileOpen(false)} />
        ))}

        <ListItemButton onClick={() => setBillsOpen((v) => !v)} sx={navBtnSx(billsActive)}>
          <ListItemIcon sx={{ minWidth: 36, color: "inherit" }}><ReceiptLong /></ListItemIcon>
          <ListItemText primary="Bills" slotProps={{ primary: { sx: { fontSize: 14, fontWeight: 600 } } }} />
          {billsOpen ? <ExpandLess /> : <ExpandMore />}
        </ListItemButton>
        <Collapse in={billsOpen} unmountOnExit>
          <List dense disablePadding sx={{ pl: 2 }}>
            {billChildren.map((c) => (
              <NavItem key={c.url} to={c.url} icon={c.icon} label={c.title} dense onClick={() => isMobile && setMobileOpen(false)} />
            ))}
          </List>
        </Collapse>

        {more.map((m) => (
          <NavItem key={m.url} to={m.url} icon={m.icon} label={m.title} onClick={() => isMobile && setMobileOpen(false)} />
        ))}
      </List>
      <Divider />
      <Box sx={{ p: 1.5 }}>
        <Typography variant="caption" color="text.secondary">
          {settings.businessName}
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
        }}
      >
        <Toolbar sx={{ gap: 2 }}>
          <IconButton
            edge="start"
            onClick={() => setMobileOpen(true)}
            sx={{ display: { md: "none" } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flex: 1, fontWeight: 700 }}>
            {pageTitle(pathname)}
          </Typography>
          <Chip
            label={`Business ID: ${settings.businessRegisterId}`}
            color="primary"
            variant="outlined"
            sx={{ fontWeight: 600, display: { xs: "none", sm: "inline-flex" } }}
          />
          <IconButton onClick={(e: MouseEvent<HTMLElement>) => setNotifAnchor(e.currentTarget)}>
            <Badge color="primary" variant="dot">
              <NotificationsIcon />
            </Badge>
          </IconButton>
          <Menu
            anchorEl={notifAnchor}
            open={Boolean(notifAnchor)}
            onClose={() => setNotifAnchor(null)}
            slotProps={{ paper: { sx: { width: 300 } } }}
          >
            <MenuItem disabled sx={{ opacity: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Notifications</Typography>
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => setNotifAnchor(null)}>
              <ListItemText primary="Welcome to Inventra" secondary="System ready" />
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: "block", md: "none" }, "& .MuiDrawer-paper": { width: DRAWER_WIDTH } }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          open
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

function NavItem({
  to, icon, label, dense, onClick,
}: { to: string; icon: ReactNode; label: string; dense?: boolean; onClick?: () => void }) {
  const { pathname } = useLocation();
  const active = to === "/" ? pathname === "/" : pathname === to;
  return (
    <ListItemButton
      component={NavLink}
      to={to}
      onClick={onClick}
      sx={navBtnSx(active, dense)}
    >
      <ListItemIcon sx={{ minWidth: 36, color: "inherit" }}>{icon}</ListItemIcon>
      <ListItemText primary={label} slotProps={{ primary: { sx: { fontSize: dense ? 13 : 14, fontWeight: active ? 700 : 500 } } }} />
    </ListItemButton>
  );
}

const navBtnSx = (active: boolean, dense?: boolean) => ({
  borderRadius: 2,
  mb: 0.5,
  py: dense ? 0.5 : 0.75,
  color: active ? "secondary.main" : "text.secondary",
  bgcolor: active ? "rgba(245,180,0,0.18)" : "transparent",
  "&:hover": { bgcolor: active ? "rgba(245,180,0,0.28)" : "rgba(0,0,0,0.04)" },
});

function pageTitle(p: string): string {
  if (p === "/") return "Dashboard";
  if (p.startsWith("/bills/sales/new")) return "Create Sales Bill";
  if (p.startsWith("/bills/sales")) return "Sales Bills";
  if (p.startsWith("/bills/return")) return "Return Sales Bill";
  if (p.startsWith("/bills/estimate")) return "Estimate Bill";
  if (p.startsWith("/bills/purchase/new")) return "Create Purchase Bill";
  if (p.startsWith("/bills/purchase")) return "Purchase Bills";
  if (p.startsWith("/bills/history")) return "Bills History";
  if (p.startsWith("/debit-note")) return "Debit Note";
  if (p.startsWith("/reports")) return "Reports";
  if (p.startsWith("/payroll")) return "Payroll";
  if (p.startsWith("/parties")) return "Parties";
  if (p.startsWith("/items")) return "Items";
  if (p.startsWith("/settings")) return "Settings";
  return "Inventra";
}
