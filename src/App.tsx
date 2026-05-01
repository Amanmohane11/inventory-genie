import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { store, persistor } from "./store";
import { muiTheme } from "./theme/muiTheme";
import { NotifyProvider } from "./components/NotifyProvider";
import { RequireAuth, RequireRole, RedirectIfAuthed } from "./components/auth/Guards";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Items from "./pages/Items.tsx";
import Parties from "./pages/Parties.tsx";
import BillForm from "./pages/BillForm.tsx";
import BillsList from "./pages/BillsList.tsx";
import BillsHistory from "./pages/BillsHistory.tsx";
import DebitNote from "./pages/DebitNote.tsx";
import Reports from "./pages/Reports.tsx";
import Payroll from "./pages/Payroll.tsx";
import Settings from "./pages/Settings.tsx";
import Login from "./pages/Login.tsx";
import SuperAdminHome from "./pages/admin/SuperAdminHome.tsx";

const ClientOnly = ({ children }: { children: React.ReactNode }) => (
  <RequireAuth><RequireRole role="client_admin">{children}</RequireRole></RequireAuth>
);
const SuperOnly = ({ children }: { children: React.ReactNode }) => (
  <RequireAuth><RequireRole role="super_admin">{children}</RequireRole></RequireAuth>
);

const App = () => (
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <NotifyProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<RedirectIfAuthed><Login /></RedirectIfAuthed>} />

                {/* Super Admin */}
                <Route path="/admin" element={<SuperOnly><SuperAdminHome /></SuperOnly>} />

                {/* Client Admin */}
                <Route path="/" element={<ClientOnly><Index /></ClientOnly>} />
                <Route path="/parties" element={<ClientOnly><Parties /></ClientOnly>} />
                <Route path="/items" element={<ClientOnly><Items /></ClientOnly>} />
                <Route path="/bills/sales" element={<ClientOnly><BillsList kind="sales" /></ClientOnly>} />
                <Route path="/bills/sales/new" element={<ClientOnly><BillForm type="sales" /></ClientOnly>} />
                <Route path="/bills/sales/:id/edit" element={<ClientOnly><BillForm type="sales" /></ClientOnly>} />
                <Route path="/bills/estimate" element={<ClientOnly><BillsList kind="estimate" /></ClientOnly>} />
                <Route path="/bills/estimate/new" element={<ClientOnly><BillForm type="estimate" /></ClientOnly>} />
                <Route path="/bills/purchase" element={<ClientOnly><BillsList kind="purchase" /></ClientOnly>} />
                <Route path="/bills/purchase/new" element={<ClientOnly><BillForm type="purchase" /></ClientOnly>} />
                <Route path="/bills/history" element={<ClientOnly><BillsHistory /></ClientOnly>} />
                <Route path="/debit-note" element={<ClientOnly><DebitNote /></ClientOnly>} />
                <Route path="/reports" element={<ClientOnly><Reports /></ClientOnly>} />
                <Route path="/payroll" element={<ClientOnly><Payroll /></ClientOnly>} />
                <Route path="/settings" element={<ClientOnly><Settings /></ClientOnly>} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </NotifyProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </PersistGate>
  </Provider>
);

export default App;
