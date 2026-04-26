import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, FileMinus } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store";
import { addNote, deleteNote, DebitNote } from "@/store/slices/debitNoteSlice";
import { format } from "date-fns";
import { toast } from "sonner";

const blank: DebitNote = {
  id: "", date: new Date().toISOString(), dealerName: "", itemName: "", qty: 1, amount: 0, reason: "",
};

export default function DebitNotePage() {
  const notes = useAppSelector((s) => s.debitNotes.notes);
  const items = useAppSelector((s) => s.items.items);
  const dealers = useAppSelector((s) => s.parties.dealers);
  const dispatch = useAppDispatch();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DebitNote>(blank);

  const save = () => {
    if (!draft.dealerName || !draft.itemName) return toast.error("Dealer and item required");
    dispatch(addNote({ ...draft, id: `dn-${Date.now()}`, date: new Date().toISOString() }));
    toast.success("Debit note created");
    setOpen(false); setDraft(blank);
  };

  return (
    <AppLayout>
      <PageHeader
        title="Debit Notes"
        description="Record purchase returns to dealers"
        actions={
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setDraft(blank); }}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4" /> New Debit Note</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New Debit Note</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Dealer">
                  <Select value={draft.dealerName} onValueChange={(v) => setDraft({ ...draft, dealerName: v })}>
                    <SelectTrigger><SelectValue placeholder="Select dealer" /></SelectTrigger>
                    <SelectContent>
                      {dealers.map((d) => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Item">
                  <Select value={draft.itemName} onValueChange={(v) => setDraft({ ...draft, itemName: v })}>
                    <SelectTrigger><SelectValue placeholder="Select item" /></SelectTrigger>
                    <SelectContent>
                      {items.map((i) => <SelectItem key={i.id} value={i.name}>{i.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Qty"><Input type="number" value={draft.qty} onChange={(e) => setDraft({ ...draft, qty: +e.target.value })} /></Field>
                <Field label="Amount"><Input type="number" value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: +e.target.value })} /></Field>
                <div className="col-span-2">
                  <Field label="Reason"><Input value={draft.reason} onChange={(e) => setDraft({ ...draft, reason: e.target.value })} /></Field>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={save}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <Card className="p-4 card-elevated">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Dealer</TableHead>
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    <FileMinus className="h-8 w-8 mx-auto mb-2 opacity-50" /> No debit notes yet
                  </TableCell>
                </TableRow>
              )}
              {notes.map((n) => (
                <TableRow key={n.id}>
                  <TableCell>{format(new Date(n.date), "dd MMM yy")}</TableCell>
                  <TableCell>{n.dealerName}</TableCell>
                  <TableCell>{n.itemName}</TableCell>
                  <TableCell className="text-right">{n.qty}</TableCell>
                  <TableCell className="text-right font-medium">₹{n.amount}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{n.reason}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => { dispatch(deleteNote(n.id)); toast.success("Deleted"); }}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
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
