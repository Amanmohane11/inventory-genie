import { useMemo, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, Search, Package } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store";
import { addItem, updateItem, deleteItem } from "@/store/slices/itemSlice";
import { Item } from "@/store/seedData";
import { toast } from "sonner";

const empty: Item = {
  id: "", name: "", code: "", category: "", stock: 0, costPrice: 0, salePrice: 0,
};

export default function Items() {
  const items = useAppSelector((s) => s.items.items);
  const dispatch = useAppDispatch();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Item>(empty);
  const editing = !!draft.id;

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return items;
    return items.filter(
      (i) =>
        i.name.toLowerCase().includes(t) ||
        i.code.toLowerCase().includes(t) ||
        i.category.toLowerCase().includes(t)
    );
  }, [items, q]);

  const lowStock = items.filter((i) => i.stock < 25).length;

  const onSave = () => {
    if (!draft.name || !draft.code) {
      toast.error("Name and code are required");
      return;
    }
    if (editing) {
      dispatch(updateItem(draft));
      toast.success("Item updated");
    } else {
      dispatch(addItem({ ...draft, id: `i-${Date.now()}` }));
      toast.success("Item added");
    }
    setOpen(false);
    setDraft(empty);
  };

  const onEdit = (i: Item) => {
    setDraft(i);
    setOpen(true);
  };

  const onDelete = (id: string) => {
    dispatch(deleteItem(id));
    toast.success("Item deleted");
  };

  return (
    <AppLayout>
      <PageHeader
        title="Items"
        description={`${items.length} items · ${lowStock} low stock`}
        actions={
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setDraft(empty); }}>
            <DialogTrigger asChild>
              <Button onClick={() => setDraft(empty)}>
                <Plus className="h-4 w-4" /> Add Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? "Edit Item" : "Add Item"}</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Name">
                  <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
                </Field>
                <Field label="Code">
                  <Input value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value })} />
                </Field>
                <Field label="Category">
                  <Input value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} />
                </Field>
                <Field label="Stock">
                  <Input type="number" value={draft.stock} onChange={(e) => setDraft({ ...draft, stock: +e.target.value })} />
                </Field>
                <Field label="Cost Price">
                  <Input type="number" value={draft.costPrice} onChange={(e) => setDraft({ ...draft, costPrice: +e.target.value })} />
                </Field>
                <Field label="Sale Price">
                  <Input type="number" value={draft.salePrice} onChange={(e) => setDraft({ ...draft, salePrice: +e.target.value })} />
                </Field>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={onSave}>{editing ? "Save" : "Add"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <Card className="p-4 card-elevated">
        <div className="flex items-center gap-2 mb-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, code or category"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="max-w-sm"
          />
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    No items found
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((i) => (
                <TableRow key={i.id}>
                  <TableCell className="font-medium">{i.name}</TableCell>
                  <TableCell className="text-muted-foreground">{i.code}</TableCell>
                  <TableCell>{i.category}</TableCell>
                  <TableCell className="text-right">
                    {i.stock < 25 ? (
                      <Badge variant="destructive">{i.stock}</Badge>
                    ) : (
                      <span>{i.stock}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">₹{i.costPrice}</TableCell>
                  <TableCell className="text-right font-medium">₹{i.salePrice}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => onEdit(i)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onDelete(i.id)}>
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
