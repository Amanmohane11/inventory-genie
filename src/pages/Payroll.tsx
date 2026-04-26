import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store";
import { addStaff, deleteStaff, addPayment, deletePayment, Staff, Payment } from "@/store/slices/payrollSlice";
import { format } from "date-fns";
import { toast } from "sonner";

const blankStaff: Staff = { id: "", name: "", role: "", salary: 0, joinedAt: new Date().toISOString() };

export default function Payroll() {
  const { staff, payments } = useAppSelector((s) => s.payroll);
  const dispatch = useAppDispatch();
  const [sOpen, setSOpen] = useState(false);
  const [pOpen, setPOpen] = useState(false);
  const [sDraft, setSDraft] = useState<Staff>(blankStaff);
  const [payAmount, setPayAmount] = useState(0);
  const [payStaffId, setPayStaffId] = useState("");
  const [payNote, setPayNote] = useState("");

  const saveStaff = () => {
    if (!sDraft.name) return toast.error("Name required");
    dispatch(addStaff({ ...sDraft, id: `st-${Date.now()}`, joinedAt: new Date().toISOString() }));
    toast.success("Staff added");
    setSOpen(false); setSDraft(blankStaff);
  };

  const savePayment = () => {
    const st = staff.find((x) => x.id === payStaffId);
    if (!st) return toast.error("Select staff");
    if (!payAmount) return toast.error("Enter amount");
    const p: Payment = {
      id: `pay-${Date.now()}`,
      staffId: st.id, staffName: st.name,
      amount: payAmount, date: new Date().toISOString(), note: payNote,
    };
    dispatch(addPayment(p));
    toast.success("Payment recorded");
    setPOpen(false); setPayAmount(0); setPayStaffId(""); setPayNote("");
  };

  return (
    <AppLayout>
      <PageHeader title="Payroll" description="Staff and salary payments" />

      <Tabs defaultValue="staff">
        <TabsList className="mb-4">
          <TabsTrigger value="staff">Staff ({staff.length})</TabsTrigger>
          <TabsTrigger value="payments">Payments ({payments.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="staff">
          <Card className="p-4 card-elevated">
            <div className="flex justify-end mb-3">
              <Dialog open={sOpen} onOpenChange={(o) => { setSOpen(o); if (!o) setSDraft(blankStaff); }}>
                <DialogTrigger asChild>
                  <Button><Plus className="h-4 w-4" /> Add Staff</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add Staff</DialogTitle></DialogHeader>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Name"><Input value={sDraft.name} onChange={(e) => setSDraft({ ...sDraft, name: e.target.value })} /></Field>
                    <Field label="Role"><Input value={sDraft.role} onChange={(e) => setSDraft({ ...sDraft, role: e.target.value })} /></Field>
                    <Field label="Monthly Salary"><Input type="number" value={sDraft.salary} onChange={(e) => setSDraft({ ...sDraft, salary: +e.target.value })} /></Field>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setSOpen(false)}>Cancel</Button>
                    <Button onClick={saveStaff}>Add</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Salary</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>{s.role}</TableCell>
                    <TableCell>{format(new Date(s.joinedAt), "dd MMM yy")}</TableCell>
                    <TableCell className="text-right">₹{s.salary.toLocaleString("en-IN")}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => { dispatch(deleteStaff(s.id)); toast.success("Deleted"); }}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card className="p-4 card-elevated">
            <div className="flex justify-end mb-3">
              <Dialog open={pOpen} onOpenChange={setPOpen}>
                <DialogTrigger asChild>
                  <Button><Plus className="h-4 w-4" /> New Payment</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
                  <div className="grid gap-3">
                    <Field label="Staff">
                      <Select value={payStaffId} onValueChange={setPayStaffId}>
                        <SelectTrigger><SelectValue placeholder="Select staff" /></SelectTrigger>
                        <SelectContent>
                          {staff.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Amount"><Input type="number" value={payAmount} onChange={(e) => setPayAmount(+e.target.value)} /></Field>
                    <Field label="Note"><Input value={payNote} onChange={(e) => setPayNote(e.target.value)} /></Field>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setPOpen(false)}>Cancel</Button>
                    <Button onClick={savePayment}>Record</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Staff</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No payments yet</TableCell></TableRow>
                )}
                {payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{format(new Date(p.date), "dd MMM yy")}</TableCell>
                    <TableCell>{p.staffName}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{p.note}</TableCell>
                    <TableCell className="text-right font-medium">₹{p.amount.toLocaleString("en-IN")}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => { dispatch(deletePayment(p.id)); toast.success("Deleted"); }}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
