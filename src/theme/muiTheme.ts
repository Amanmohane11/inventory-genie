import { createTheme } from "@mui/material/styles";

// Yellow + White theme
export const muiTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#F5B400",       // Yellow
      light: "#FFD24D",
      dark: "#C68A00",
      contrastText: "#1A1A1A",
    },
    secondary: {
      main: "#1F1F1F",       // Dark gray/black for text accents
      contrastText: "#FFFFFF",
    },
    error: { main: "#D32F2F" },
    warning: { main: "#F59E0B" },
    success: { main: "#16A34A" },
    background: {
      default: "#FFFFFF",
      paper: "#FFFFFF",
    },
    text: {
      primary: "#1F1F1F",
      secondary: "#5F6368",
    },
    divider: "rgba(0,0,0,0.08)",
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: '"Inter","Roboto","Helvetica","Arial",sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { textTransform: "none", fontWeight: 600 },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 10, paddingInline: 16 },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          border: "1px solid rgba(0,0,0,0.06)",
          boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)",
        },
      },
    },
    MuiPaper: {
      styleOverrides: { rounded: { borderRadius: 12 } },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "#FFFFFF",
          color: "#1F1F1F",
          borderBottom: "1px solid rgba(0,0,0,0.08)",
        },
      },
    },
    MuiTextField: {
      defaultProps: { size: "small", variant: "outlined" },
    },
    MuiTableCell: {
      styleOverrides: {
        head: { fontWeight: 600, backgroundColor: "#FFFBEA" },
      },
    },
  },
});
