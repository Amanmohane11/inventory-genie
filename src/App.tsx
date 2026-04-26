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
import Stub from "./pages/Stub.tsx";

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
              <Route path="/parties" element={<Stub path="/parties" />} />
              <Route path="/items" element={<Stub path="/items" />} />
              <Route path="/bills/sales" element={<Stub path="/bills/sales" />} />
              <Route path="/bills/purchase" element={<Stub path="/bills/purchase" />} />
              <Route path="/bills/history" element={<Stub path="/bills/history" />} />
              <Route path="/debit-note" element={<Stub path="/debit-note" />} />
              <Route path="/reports" element={<Stub path="/reports" />} />
              <Route path="/payroll" element={<Stub path="/payroll" />} />
              <Route path="/settings" element={<Stub path="/settings" />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </PersistGate>
  </Provider>
);

export default App;

