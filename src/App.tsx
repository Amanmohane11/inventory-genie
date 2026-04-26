import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { store, persistor } from "./store";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Items from "./pages/Items.tsx";
import Parties from "./pages/Parties.tsx";
import BillForm from "./pages/BillForm.tsx";
import BillsHistory from "./pages/BillsHistory.tsx";
import DebitNote from "./pages/DebitNote.tsx";
import Reports from "./pages/Reports.tsx";
import Payroll from "./pages/Payroll.tsx";
import Settings from "./pages/Settings.tsx";

const queryClient = new QueryClient();

const App = () => (
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/parties" element={<Parties />} />
              <Route path="/items" element={<Items />} />
              <Route path="/bills/sales" element={<BillForm type="sales" />} />
              <Route path="/bills/estimate" element={<BillForm type="estimate" />} />
              <Route path="/bills/purchase" element={<BillForm type="purchase" />} />
              <Route path="/bills/history" element={<BillsHistory />} />
              <Route path="/debit-note" element={<DebitNote />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/payroll" element={<Payroll />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </PersistGate>
  </Provider>
);

export default App;

