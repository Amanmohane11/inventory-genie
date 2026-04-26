import { useMemo, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, Search, Users } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  addCustomer, updateCustomer, deleteCustomer,
  addDealer, updateDealer, deleteDealer,
  Customer, Dealer,
} from "@/store/slices/partySlice";
import { toast } from "sonner";

const blankCustomer: Customer = {
  id: "", name: "", phone: "", email: "", address: "",
  createdAt: new Date().toISOString(), visits: 0, totalSpend: 0,
};
const blankDealer: Dealer = {
  id: "", name: "", phone: "", email: "", company: "", productCategory: "",
};

const isActive = (lastTxn?: string) => {
  if (!lastTxn) return false;
  const days = (Date.now() - new Date(lastTxn).getTime()) / 86400000;
  return days <= 45;
};

export default function Parties() {
  const { customers, dealers } = useAppSelector((s) => s.parties);
  const dispatch = useAppDispatch();
  const [q, setQ] = useState("");

  const [cOpen, setCOpen] = useState(false);
  const [cDraft, setCDraft] = useState<Customer>(blankCustomer);
  const [dOpen, setDOpen] = useState(false);
  const [dDraft, setDDraft] = useState<Dealer>(blankDealer);

  const filteredCustomers = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return customers;
    return customers.filter(
      (c) => c.name.toLowerCase().includes(t) || c.phone.includes(t)
    );
  }, [customers, q]);

  const filteredDealers = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return dealers;
    return dealers.filter(
      (d) => d.name.toLowerCase().includes(t) || d.phone.includes(t) || d.company.toLowerCase().includes(t)
    );
  }, [dealers, q]);

  const saveCustomer = () => {
    if (!cDraft.name || !cDraft.phone) return toast.error("Name and phone required");
    if (cDraft.id) {
      dispatch(updateCustomer(cDraft));
      toast.success("Customer updated");
    } else {
      dispatch(addCustomer({ ...cDraft, id: `c-${Date.now()}`, createdAt: new Date().toISOString() }));
      toast.success("Customer added");
    }
    setCOpen(false); setCDraft(blankCustomer);
  };

  const saveDealer = () => {
    if (!dDraft.name || !dDraft.phone) return toast.error("Name and phone required");
    if (dDraft.id) {
      dispatch(updateDealer(dDraft));
      toast.success("Dealer updated");
    } else {
      dispatch(addDealer({ ...dDraft, id: `d-${Date.now()}` }));
      toast.success("Dealer added");
    }
    setDOpen(false); setDDraft(blankDealer);
  };

  return (
    <AppLayout>
      <PageHeader title="Parties" description="Manage customers and dealers" />

      <Tabs defaultValue="customers">
        <div className="flex flex-wrap gap-3 items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="customers">Customers ({customers.length})</TabsTrigger>
            <TabsTrigger value="dealers">Dealers ({dealers.length})</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 border rounded-md px-2 bg-card">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="border-0 shadow-none focus-visible:ring-0 px-0 w-48"
              />
            </div>
          </div>
        </div>

        <TabsContent value="customers">
          <Card className="p-4 card-elevated">
            <div className="flex justify-end mb-3">
              <Dialog open={cOpen} onOpenChange={(o) => { setCOpen(o); if (!o) setCDraft(blankCustomer); }}>
                <DialogTrigger asChild>
                  <Button onClick={() => setCDraft(blankCustomer)}>
                    <Plus className="h-4 w-4" /> Add Customer
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{cDraft.id ? "Edit Customer" : "Add Customer"}</DialogTitle>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Name"><Input value={cDraft.name} onChange={(e) => setCDraft({ ...cDraft, name: e.target.value })} /></Field>
                    <Field label="Phone"><Input value={cDraft.phone} onChange={(e) => setCDraft({ ...cDraft, phone: e.target.value })} /></Field>
                    <Field label="Email"><Input value={cDraft.email} onChange={(e) => setCDraft({ ...cDraft, email: e.target.value })} /></Field>
                    <Field label="Address"><Input value={cDraft.address} onChange={(e) => setCDraft({ ...cDraft, address: e.target.value })} /></Field>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCOpen(false)}>Cancel</Button>
                    <Button onClick={saveCustomer}>{cDraft.id ? "Save" : "Add"}</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Visits</TableHead>
                    <TableHead className="text-right">Total Spend</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                        <Users className="h-8 w-8 mx-auto mb-2 opacity-50" /> No customers
                      </TableCell>
                    </TableRow>
                  )}
                  {filteredCustomers.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell>{c.phone}</TableCell>
                      <TableCell>
                        {isActive(c.lastTxn) ? (
                          <Badge className="bg-success text-success-foreground hover:bg-success/90">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">{c.visits}</TableCell>
                      <TableCell className="text-right">₹{c.totalSpend.toLocaleString("en-IN")}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => { setCDraft(c); setCOpen(true); }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => { dispatch(deleteCustomer(c.id)); toast.success("Deleted"); }}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="dealers">
          <Card className="p-4 card-elevated">
            <div className="flex justify-end mb-3">
              <Dialog open={dOpen} onOpenChange={(o) => { setDOpen(o); if (!o) setDDraft(blankDealer); }}>
                <DialogTrigger asChild>
                  <Button onClick={() => setDDraft(blankDealer)}>
                    <Plus className="h-4 w-4" /> Add Dealer
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{dDraft.id ? "Edit Dealer" : "Add Dealer"}</DialogTitle>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Name"><Input value={dDraft.name} onChange={(e) => setDDraft({ ...dDraft, name: e.target.value })} /></Field>
                    <Field label="Phone"><Input value={dDraft.phone} onChange={(e) => setDDraft({ ...dDraft, phone: e.target.value })} /></Field>
                    <Field label="Company"><Input value={dDraft.company} onChange={(e) => setDDraft({ ...dDraft, company: e.target.value })} /></Field>
                    <Field label="Category"><Input value={dDraft.productCategory} onChange={(e) => setDDraft({ ...dDraft, productCategory: e.target.value })} /></Field>
                    <Field label="Email"><Input value={dDraft.email} onChange={(e) => setDDraft({ ...dDraft, email: e.target.value })} /></Field>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDOpen(false)}>Cancel</Button>
                    <Button onClick={saveDealer}>{dDraft.id ? "Save" : "Add"}</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDealers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">No dealers</TableCell>
                    </TableRow>
                  )}
                  {filteredDealers.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">{d.name}</TableCell>
                      <TableCell>{d.phone}</TableCell>
                      <TableCell>{d.company}</TableCell>
                      <TableCell>{d.productCategory}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => { setDDraft(d); setDOpen(true); }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => { dispatch(deleteDealer(d.id)); toast.success("Deleted"); }}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
