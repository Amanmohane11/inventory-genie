import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { store, persistor } from "./store";
import { muiTheme } from "./theme/muiTheme";
import { NotifyProvider } from "./components/NotifyProvider";
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

const App = () => (
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <NotifyProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/parties" element={<Parties />} />
                <Route path="/items" element={<Items />} />
                <Route path="/bills/sales" element={<BillsList kind="sales" />} />
                <Route path="/bills/sales/new" element={<BillForm type="sales" />} />
                <Route path="/bills/sales/:id/edit" element={<BillForm type="sales" />} />
                <Route path="/bills/estimate" element={<BillsList kind="estimate" />} />
                <Route path="/bills/estimate/new" element={<BillForm type="estimate" />} />
                <Route path="/bills/purchase" element={<BillsList kind="purchase" />} />
                <Route path="/bills/purchase/new" element={<BillForm type="purchase" />} />
                <Route path="/bills/history" element={<BillsHistory />} />
                <Route path="/debit-note" element={<DebitNote />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/payroll" element={<Payroll />} />
                <Route path="/settings" element={<Settings />} />
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
