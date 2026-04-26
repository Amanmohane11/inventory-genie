import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/store";
import { updateSettings } from "@/store/slices/settingsSlice";
import { Save } from "lucide-react";
import { toast } from "sonner";

export default function Settings() {
  const settings = useAppSelector((s) => s.settings);
  const dispatch = useAppDispatch();
  const [draft, setDraft] = useState(settings);

  useEffect(() => setDraft(settings), [settings]);

  const save = () => {
    dispatch(updateSettings(draft));
    toast.success("Settings saved");
  };

  return (
    <AppLayout>
      <PageHeader
        title="Settings"
        description="Business info, tax and invoice customization"
        actions={<Button onClick={save}><Save className="h-4 w-4" /> Save</Button>}
      />

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-6 card-elevated">
          <h3 className="font-semibold mb-4">Business Info</h3>
          <div className="grid gap-3">
            <Field label="Business Name"><Input value={draft.businessName} onChange={(e) => setDraft({ ...draft, businessName: e.target.value })} /></Field>
            <Field label="Owner Name"><Input value={draft.ownerName} onChange={(e) => setDraft({ ...draft, ownerName: e.target.value })} /></Field>
            <Field label="Phone"><Input value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} /></Field>
            <Field label="Email"><Input value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} /></Field>
            <Field label="Address"><Input value={draft.address} onChange={(e) => setDraft({ ...draft, address: e.target.value })} /></Field>
          </div>
        </Card>

        <Card className="p-6 card-elevated">
          <h3 className="font-semibold mb-4">Tax & Invoice</h3>
          <div className="grid gap-3">
            <Field label="GSTIN"><Input value={draft.gstin} onChange={(e) => setDraft({ ...draft, gstin: e.target.value })} /></Field>
            <Field label="Default GST %"><Input type="number" value={draft.defaultGst} onChange={(e) => setDraft({ ...draft, defaultGst: +e.target.value })} /></Field>
            <Field label="Invoice Prefix"><Input value={draft.invoicePrefix} onChange={(e) => setDraft({ ...draft, invoicePrefix: e.target.value })} /></Field>
            <Field label="Currency"><Input value={draft.currency} onChange={(e) => setDraft({ ...draft, currency: e.target.value })} /></Field>
          </div>
        </Card>
      </div>
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
