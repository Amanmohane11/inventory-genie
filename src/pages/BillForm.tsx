import { useEffect, useMemo, useRef, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Plus, Minus, Trash2, Phone, Search, FileText, Wallet, CreditCard,
  Banknote, CalendarIcon, ChevronRight, ShoppingBag,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store";
import { addBill } from "@/store/slices/billSlice";
import { adjustStock } from "@/store/slices/itemSlice";
import { addCustomer } from "@/store/slices/partySlice";
import { Bill, BillItem } from "@/store/seedData";
import { toast } from "sonner";
import { useNavigate, NavLink, useLocation } from "react-router-dom";

type BillKind = "sales" | "purchase" | "estimate";

export default function BillForm({ type }: { type: BillKind }) {
  // Sales & Estimate use the POS UI; Purchase keeps the simpler form.
  if (type === "purchase") return <PurchaseForm />;
  return <PosBillPage initialType={type} />;
}

/* ========================================================================
 * POS-style Sales / Estimate form
 * ====================================================================== */
function PosBillPage({ initialType }: { initialType: BillKind }) {
  const nav = useNavigate();
  const { pathname } = useLocation();
  const dispatch = useAppDispatch();

  const items = useAppSelector((s) => s.items.items);
  const customers = useAppSelector((s) => s.parties.customers);
  const billsCount = useAppSelector((s) => s.bills.bills.length);

  const isEstimate = initialType === "estimate";
  const billNumber = useMemo(
    () => `${isEstimate ? "EST" : "INV"}-${String(billsCount + 1).padStart(5, "0")}`,
    [billsCount, isEstimate],
  );

  // Customer state
  const [phone, setPhone] = useState("");
  const [customer, setCustomer] = useState<{ name: string; phone: string; email?: string } | null>(null);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCust, setNewCust] = useState({ name: "", phone: "", email: "" });
  const phoneRef = useRef<HTMLInputElement>(null);

  useEffect(() => { phoneRef.current?.focus(); }, []);

  const phoneMatches = useMemo(() => {
    if (!phone.trim() || customer) return [];
    return customers
      .filter((c) => c.phone.includes(phone.trim()) || c.name.toLowerCase().includes(phone.trim().toLowerCase()))
      .slice(0, 5);
  }, [phone, customers, customer]);

  const handlePhoneSubmit = () => {
    if (!phone.trim()) {
      toast.error("Enter phone number");
      shakeEl(phoneRef.current?.parentElement);
      return;
    }
    const found = customers.find((c) => c.phone === phone.trim());
    if (found) {
      setCustomer({ name: found.name, phone: found.phone, email: found.email });
      toast.success(`Welcome back, ${found.name}`);
    } else {
      setNewCust({ name: "", phone: phone.trim(), email: "" });
      setShowNewCustomer(true);
    }
  };

  const saveNewCustomer = () => {
    if (!newCust.name.trim() || !newCust.phone.trim()) {
      toast.error("Name and phone required");
      return;
    }
    const c = {
      id: `c-${Date.now()}`,
      name: newCust.name.trim(),
      phone: newCust.phone.trim(),
      email: newCust.email.trim() || undefined,
      createdAt: new Date().toISOString(),
      lastTxn: new Date().toISOString(),
      visits: 1,
      totalSpend: 0,
    };
    dispatch(addCustomer(c));
    setCustomer({ name: c.name, phone: c.phone, email: c.email });
    setShowNewCustomer(false);
    toast.success("Customer saved");
  };

  // Lines
  const [lines, setLines] = useState<BillItem[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQ, setPickerQ] = useState("");

  const filteredItems = useMemo(() => {
    const q = pickerQ.trim().toLowerCase();
    return items.filter((i) => !q || i.name.toLowerCase().includes(q) || i.code.toLowerCase().includes(q));
  }, [items, pickerQ]);

  const addLine = (itemId: string) => {
    const it = items.find((x) => x.id === itemId);
    if (!it) return;
    if (lines.find((l) => l.itemId === it.id)) {
      toast.error("Item already added");
      return;
    }
    setLines((ls) => [
      ...ls,
      { itemId: it.id, name: it.name, qty: 1, price: it.salePrice, gstRate: 18, discount: 0 },
    ]);
    setPickerQ("");
    setPickerOpen(false);
  };

  const updateLine = (idx: number, patch: Partial<BillItem>) =>
    setLines((ls) => ls.map((l, i) => (i === idx ? { ...l, ...patch } : l)));

  const removeLine = (idx: number) => setLines((ls) => ls.filter((_, i) => i !== idx));

  const incQty = (idx: number) => {
    const l = lines[idx];
    const it = items.find((x) => x.id === l.itemId);
    if (!isEstimate && it && l.qty + 1 > it.stock) {
      toast.error(`Only ${it.stock} in stock`);
      return;
    }
    updateLine(idx, { qty: l.qty + 1 });
  };
  const decQty = (idx: number) => {
    const l = lines[idx];
    if (l.qty <= 1) return;
    updateLine(idx, { qty: l.qty - 1 });
  };

  // Notes / payment / expiry
  const [notesOpen, setNotesOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [paymentMode, setPaymentMode] = useState<"upi" | "card" | "cash">("upi");
  const [expiry, setExpiry] = useState<Date | undefined>();

  // Totals
  const totals = useMemo(() => {
    let sub = 0, gst = 0, disc = 0;
    for (const l of lines) {
      const lineSub = l.price * l.qty - l.discount;
      sub += lineSub;
      gst += (lineSub * l.gstRate) / 100;
      disc += l.discount;
    }
    return { sub, gst, disc, grand: sub + gst };
  }, [lines]);

  // Submit
  const submit = () => {
    if (!customer) {
      toast.error("Add a customer first");
      shakeEl(phoneRef.current?.parentElement);
      return;
    }
    if (lines.length === 0) {
      toast.error("Add at least one item");
      return;
    }
    if (!isEstimate) {
      for (const l of lines) {
        const it = items.find((x) => x.id === l.itemId);
        if (it && l.qty > it.stock) {
          toast.error(`${it.name}: only ${it.stock} in stock`);
          return;
        }
      }
    }
    if (isEstimate && !expiry) {
      toast.error("Pick an expiry date for the estimate");
      return;
    }

    const bill: Bill = {
      id: `${isEstimate ? "e" : "s"}-${Date.now()}`,
      type: isEstimate ? "estimate" : "sales",
      date: new Date().toISOString(),
      partyName: customer.name,
      partyPhone: customer.phone,
      partyEmail: customer.email,
      items: lines,
      paymentMode: isEstimate ? undefined : paymentMode,
      paid: isEstimate ? false : true,
      notes: notes.trim() || undefined,
      expiryDate: isEstimate ? expiry?.toISOString() : undefined,
    };
    dispatch(addBill(bill));
    if (!isEstimate) {
      for (const l of lines) dispatch(adjustStock({ id: l.itemId, delta: -l.qty }));
    }
    toast.success(isEstimate ? "Estimate saved" : "Sales bill created");
    nav("/bills/history");
  };

  // Tab indicator
  const tabsRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });
  useEffect(() => {
    const el = tabsRef.current?.querySelector<HTMLAnchorElement>("a.is-active");
    if (el && tabsRef.current) {
      const c = tabsRef.current.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      setIndicator({ left: r.left - c.left, width: r.width });
    }
  }, [pathname]);

  return (
    <AppLayout>
      <div className="pos-theme -mx-4 -my-6 px-4 py-6 sm:-mx-6 sm:px-6 min-h-[calc(100vh-4rem)]">
        {/* Header + tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Billing</h1>
            <p className="text-sm" style={{ color: "hsl(var(--pos-muted))" }}>
              Fast point-of-sale workflow
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-lg text-xs font-mono pos-badge-yellow">
              {billNumber}
            </span>
            <span className="px-3 py-1.5 rounded-lg text-xs font-medium pos-glass">
              {format(new Date(), "dd MMM yyyy")}
            </span>
          </div>
        </div>

        <div ref={tabsRef} className="relative inline-flex gap-1 mb-6 pos-glass p-1">
          {[
            { to: "/bills/sales", label: "Sales Bill" },
            { to: "/bills/estimate", label: "Estimate" },
          ].map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              className={({ isActive }) =>
                cn(
                  "relative px-4 py-2 text-sm font-medium rounded-md transition-colors",
                  isActive ? "is-active text-white" : "text-white/60 hover:text-white",
                )
              }
            >
              {t.label}
            </NavLink>
          ))}
          <span
            className="pos-tab-indicator absolute bottom-0"
            style={{ transform: `translateX(${indicator.left}px)`, width: indicator.width }}
          />
        </div>

        {isEstimate && (
          <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg pos-badge-yellow text-xs font-semibold">
            <FileText className="h-3.5 w-3.5" />
            Estimate (No Stock Deduction)
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-4">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-4">
            {/* Customer */}
            <div className="pos-glass p-5 pos-slide-up">
              <div className="flex items-center gap-2 mb-3">
                <Phone className="h-4 w-4" style={{ color: "hsl(var(--pos-highlight))" }} />
                <h3 className="font-semibold">Customer</h3>
              </div>

              {customer ? (
                <div className="flex items-center justify-between gap-3 p-3 rounded-lg pos-row">
                  <div>
                    <div className="font-semibold">{customer.name}</div>
                    <div className="text-xs" style={{ color: "hsl(var(--pos-muted))" }}>
                      {customer.phone}{customer.email ? ` · ${customer.email}` : ""}
                    </div>
                  </div>
                  <button
                    className="pos-btn-ghost px-3 py-1.5 rounded-lg text-xs"
                    onClick={() => { setCustomer(null); setPhone(""); setTimeout(() => phoneRef.current?.focus(), 50); }}
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "hsl(var(--pos-muted))" }} />
                      <input
                        ref={phoneRef}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handlePhoneSubmit()}
                        placeholder="Search phone or name…"
                        className="pos-input w-full pl-9 pr-3 py-2.5 rounded-lg text-sm"
                      />
                    </div>
                    <button onClick={handlePhoneSubmit} className="pos-btn-primary px-4 py-2.5 rounded-lg text-sm font-medium">
                      Continue
                    </button>
                  </div>

                  {phoneMatches.length > 0 && (
                    <div className="absolute z-20 left-0 right-0 mt-2 pos-glass p-1 pos-slide-up">
                      {phoneMatches.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => { setCustomer({ name: m.name, phone: m.phone, email: m.email }); setPhone(""); }}
                          className="w-full text-left px-3 py-2 rounded-md text-sm pos-row flex justify-between"
                        >
                          <span className="font-medium">{m.name}</span>
                          <span style={{ color: "hsl(var(--pos-muted))" }}>{m.phone}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Products */}
            <div className="pos-glass p-5 pos-slide-up">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4" style={{ color: "hsl(var(--pos-highlight))" }} />
                  <h3 className="font-semibold">Products</h3>
                </div>
                <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
                  <PopoverTrigger asChild>
                    <button className="pos-fab h-10 w-10 rounded-full flex items-center justify-center font-bold">
                      <Plus className="h-5 w-5" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-80 p-2 bg-[hsl(222_39%_13%)] border-[hsl(222_20%_24%)]">
                    <input
                      autoFocus
                      placeholder="Search items…"
                      value={pickerQ}
                      onChange={(e) => setPickerQ(e.target.value)}
                      className="pos-input w-full px-3 py-2 rounded-md text-sm mb-2"
                    />
                    <div className="max-h-64 overflow-y-auto">
                      {filteredItems.length === 0 && (
                        <div className="text-center text-xs py-6" style={{ color: "hsl(var(--pos-muted))" }}>
                          No items
                        </div>
                      )}
                      {filteredItems.map((it) => (
                        <button
                          key={it.id}
                          onClick={() => addLine(it.id)}
                          className="w-full text-left px-3 py-2 rounded-md text-sm pos-row flex justify-between"
                        >
                          <span>
                            <span className="font-medium text-white">{it.name}</span>
                            <span className="ml-2 text-xs" style={{ color: "hsl(var(--pos-muted))" }}>
                              {it.code}
                            </span>
                          </span>
                          <span className="text-xs" style={{ color: "hsl(var(--pos-muted))" }}>
                            ₹{it.salePrice} · {it.stock}
                          </span>
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="overflow-x-auto -mx-2">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wider" style={{ color: "hsl(var(--pos-muted))" }}>
                      <th className="px-3 py-2">Product</th>
                      <th className="px-2 py-2">MRP</th>
                      <th className="px-2 py-2">Disc</th>
                      <th className="px-2 py-2">GST%</th>
                      <th className="px-2 py-2 text-center">Qty</th>
                      <th className="px-2 py-2 text-right">Total</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center py-10" style={{ color: "hsl(var(--pos-muted))" }}>
                          No products added — tap the yellow + button
                        </td>
                      </tr>
                    )}
                    {lines.map((l, idx) => {
                      const lineSub = l.price * l.qty - l.discount;
                      const lineTotal = lineSub + (lineSub * l.gstRate) / 100;
                      return (
                        <tr key={l.itemId} className="pos-row">
                          <td className="px-3 py-2 font-medium">{l.name}</td>
                          <td className="px-2 py-2">
                            <input
                              type="number" value={l.price}
                              onChange={(e) => updateLine(idx, { price: +e.target.value })}
                              className="pos-input w-20 px-2 py-1 rounded-md text-sm"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="number" value={l.discount}
                              onChange={(e) => updateLine(idx, { discount: +e.target.value })}
                              className="pos-input w-20 px-2 py-1 rounded-md text-sm"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="number" value={l.gstRate}
                              onChange={(e) => updateLine(idx, { gstRate: +e.target.value })}
                              className="pos-input w-16 px-2 py-1 rounded-md text-sm"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={() => decQty(idx)} className="pos-btn-ghost h-7 w-7 rounded-md inline-flex items-center justify-center">
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <span className="w-8 text-center font-semibold">{l.qty}</span>
                              <button onClick={() => incQty(idx)} className="pos-btn-ghost h-7 w-7 rounded-md inline-flex items-center justify-center">
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                          <td className="px-2 py-2 text-right font-semibold">₹{lineTotal.toFixed(2)}</td>
                          <td className="px-2 py-2">
                            <button onClick={() => removeLine(idx)} className="text-white/50 hover:text-[hsl(var(--pos-accent))] transition-colors">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Notes */}
            <div className="pos-glass p-5 pos-slide-up">
              <button
                onClick={() => setNotesOpen((v) => !v)}
                className="flex items-center gap-2 text-sm font-semibold w-full"
              >
                <ChevronRight className={cn("h-4 w-4 transition-transform", notesOpen && "rotate-90")} />
                Notes
              </button>
              <div
                className="grid transition-all duration-300 ease-out"
                style={{ gridTemplateRows: notesOpen ? "1fr" : "0fr" }}
              >
                <div className="overflow-hidden">
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Add a note for this bill…"
                    className="pos-input w-full mt-3 px-3 py-2 rounded-lg text-sm resize-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right column: summary */}
          <div className="space-y-4">
            <div className="pos-glass p-5 pos-slide-up sticky top-20">
              <h3 className="font-semibold mb-3">Bill Summary</h3>
              <SumRow label="Subtotal" value={`₹${totals.sub.toFixed(2)}`} />
              <SumRow label="Discount" value={`-₹${totals.disc.toFixed(2)}`} />
              <SumRow label="GST" value={`₹${totals.gst.toFixed(2)}`} />
              <div className="my-3 h-px" style={{ background: "hsl(var(--pos-border))" }} />
              <div className="flex justify-between items-baseline mb-4">
                <span className="text-sm" style={{ color: "hsl(var(--pos-muted))" }}>Final Total</span>
                <span className="text-2xl font-bold" style={{ color: "hsl(var(--pos-highlight))" }}>
                  ₹{totals.grand.toFixed(2)}
                </span>
              </div>

              {isEstimate ? (
                <div className="mb-4">
                  <label className="text-xs mb-1.5 block" style={{ color: "hsl(var(--pos-muted))" }}>
                    Expiry Date
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="pos-input w-full px-3 py-2.5 rounded-lg text-sm flex items-center justify-between">
                        <span>{expiry ? format(expiry, "PPP") : "Pick a date"}</span>
                        <CalendarIcon className="h-4 w-4 opacity-60" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-[hsl(222_39%_13%)] border-[hsl(222_20%_24%)]" align="end">
                      <Calendar
                        mode="single"
                        selected={expiry}
                        onSelect={setExpiry}
                        disabled={(d) => d < new Date(new Date().setHours(0,0,0,0))}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              ) : (
                <>
                  <div className="text-xs mb-2" style={{ color: "hsl(var(--pos-muted))" }}>Payment Mode</div>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {[
                      { k: "upi", label: "UPI", Icon: Wallet },
                      { k: "card", label: "Card", Icon: CreditCard },
                      { k: "cash", label: "Cash", Icon: Banknote },
                    ].map(({ k, label, Icon }) => (
                      <button
                        key={k}
                        data-active={paymentMode === k}
                        onClick={() => setPaymentMode(k as any)}
                        className="pos-pay rounded-lg py-2.5 flex flex-col items-center gap-1 text-xs font-medium"
                      >
                        <Icon className="h-4 w-4" />
                        {label}
                      </button>
                    ))}
                  </div>
                </>
              )}

              <button
                onClick={submit}
                className="pos-btn-primary w-full py-3 rounded-xl font-semibold tracking-wide"
              >
                {isEstimate ? "Create Estimate" : "Create Bill"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* New customer modal */}
      <Dialog open={showNewCustomer} onOpenChange={setShowNewCustomer}>
        <DialogContent className="bg-[hsl(222_39%_13%)] border-[hsl(222_20%_24%)] text-white">
          <DialogHeader>
            <DialogTitle>New Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pos-theme">
            <Field label="Name">
              <input className="pos-input w-full px-3 py-2 rounded-lg text-sm"
                value={newCust.name} onChange={(e) => setNewCust({ ...newCust, name: e.target.value })} />
            </Field>
            <Field label="Phone">
              <input className="pos-input w-full px-3 py-2 rounded-lg text-sm"
                value={newCust.phone} onChange={(e) => setNewCust({ ...newCust, phone: e.target.value })} />
            </Field>
            <Field label="Email (optional)">
              <input className="pos-input w-full px-3 py-2 rounded-lg text-sm"
                value={newCust.email} onChange={(e) => setNewCust({ ...newCust, email: e.target.value })} />
            </Field>
          </div>
          <DialogFooter>
            <button onClick={() => setShowNewCustomer(false)} className="px-4 py-2 rounded-lg text-sm text-muted-foreground">
              Cancel
            </button>
            <button onClick={saveNewCustomer} className="pos-btn-primary px-4 py-2 rounded-lg text-sm font-medium pos-theme">
              Save & Continue
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

function SumRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1 text-sm">
      <span style={{ color: "hsl(var(--pos-muted))" }}>{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs" style={{ color: "hsl(var(--pos-muted))" }}>{label}</label>
      {children}
    </div>
  );
}

function shakeEl(el: HTMLElement | null | undefined) {
  if (!el) return;
  el.classList.remove("pos-shake");
  void el.offsetWidth;
  el.classList.add("pos-shake");
}

/* ========================================================================
 * Purchase form (kept simple — preserves prior functionality)
 * ====================================================================== */
function PurchaseForm() {
  const items = useAppSelector((s) => s.items.items);
  const { dealers } = useAppSelector((s) => s.parties);
  const dispatch = useAppDispatch();
  const nav = useNavigate();

  const [partyName, setPartyName] = useState("");
  const [lines, setLines] = useState<BillItem[]>([]);
  const [pickerId, setPickerId] = useState("");

  const addLine = () => {
    if (!pickerId) return;
    const it = items.find((x) => x.id === pickerId);
    if (!it) return;
    if (lines.find((l) => l.itemId === it.id)) return toast.error("Item already added");
    setLines([...lines, { itemId: it.id, name: it.name, qty: 1, price: it.costPrice, gstRate: 18, discount: 0 }]);
    setPickerId("");
  };
  const updateLine = (idx: number, patch: Partial<BillItem>) =>
    setLines((ls) => ls.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  const removeLine = (idx: number) => setLines((ls) => ls.filter((_, i) => i !== idx));

  const totals = useMemo(() => {
    let sub = 0, gst = 0;
    for (const l of lines) {
      const s = l.price * l.qty - l.discount;
      sub += s; gst += (s * l.gstRate) / 100;
    }
    return { sub, gst, grand: sub + gst };
  }, [lines]);

  const save = () => {
    if (!partyName) return toast.error("Select a dealer");
    if (lines.length === 0) return toast.error("Add at least one item");
    const bill: Bill = {
      id: `p-${Date.now()}`, type: "purchase", date: new Date().toISOString(),
      partyName, items: lines, paid: true,
    };
    dispatch(addBill(bill));
    for (const l of lines) dispatch(adjustStock({ id: l.itemId, delta: l.qty }));
    toast.success("Purchase bill saved");
    nav("/bills/history");
  };

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">New Purchase Bill</h1>
        <p className="text-sm text-muted-foreground">Record a purchase from a dealer</p>
      </div>
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-lg border bg-card p-4 card-elevated">
          <div className="mb-3">
            <Label className="text-xs">Dealer</Label>
            <Select value={partyName} onValueChange={setPartyName}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select dealer" /></SelectTrigger>
              <SelectContent>
                {dealers.map((d) => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 mb-3">
            <Select value={pickerId} onValueChange={setPickerId}>
              <SelectTrigger className="flex-1"><SelectValue placeholder="Pick an item to add..." /></SelectTrigger>
              <SelectContent>
                {items.map((i) => <SelectItem key={i.id} value={i.id}>{i.name} ({i.code})</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={addLine}><Plus className="h-4 w-4" /> Add</Button>
          </div>
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground">
              <tr><th className="py-2">Item</th><th>Qty</th><th>Cost</th><th>GST%</th><th className="text-right">Total</th><th></th></tr>
            </thead>
            <tbody>
              {lines.length === 0 && (
                <tr><td colSpan={6} className="text-center text-muted-foreground py-8">No items added</td></tr>
              )}
              {lines.map((l, idx) => {
                const sub = l.price * l.qty - l.discount;
                const total = sub + (sub * l.gstRate) / 100;
                return (
                  <tr key={l.itemId} className="border-t">
                    <td className="py-2 font-medium">{l.name}</td>
                    <td><Input type="number" value={l.qty} onChange={(e) => updateLine(idx, { qty: +e.target.value })} className="w-20" /></td>
                    <td><Input type="number" value={l.price} onChange={(e) => updateLine(idx, { price: +e.target.value })} className="w-24" /></td>
                    <td><Input type="number" value={l.gstRate} onChange={(e) => updateLine(idx, { gstRate: +e.target.value })} className="w-16" /></td>
                    <td className="text-right font-medium">₹{total.toFixed(2)}</td>
                    <td><Button variant="ghost" size="icon" onClick={() => removeLine(idx)}><Trash2 className="h-4 w-4 text-destructive" /></Button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="rounded-lg border bg-card p-4 card-elevated h-fit">
          <h3 className="font-semibold mb-3">Summary</h3>
          <div className="flex justify-between text-sm py-1"><span className="text-muted-foreground">Subtotal</span><span>₹{totals.sub.toFixed(2)}</span></div>
          <div className="flex justify-between text-sm py-1"><span className="text-muted-foreground">GST</span><span>₹{totals.gst.toFixed(2)}</span></div>
          <div className="border-t my-2" />
          <div className="flex justify-between font-semibold"><span>Grand Total</span><span>₹{totals.grand.toFixed(2)}</span></div>
          <Button className="w-full mt-4" onClick={save}>Save Purchase</Button>
        </div>
      </div>
    </AppLayout>
  );
}
