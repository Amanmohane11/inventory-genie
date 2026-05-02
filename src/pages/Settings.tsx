import { useState, useEffect } from "react";
import {
  Box, Button, Card, CardContent, Grid, Stack, TextField, Typography, Switch,
  FormControlLabel, Divider,
} from "@mui/material";
import { Save } from "@mui/icons-material";
import { MuiLayout } from "@/components/MuiLayout";
import { useAppDispatch, useAppSelector } from "@/store";
import { updateSettings, setBillField, BillFieldKey, DEFAULT_BILL_FIELDS } from "@/store/slices/settingsSlice";
import { useNotify } from "@/components/NotifyProvider";

const FIELD_LABELS: { key: BillFieldKey; label: string }[] = [
  { key: "productName", label: "Product Name" },
  { key: "batch", label: "Batch" },
  { key: "hsn", label: "HSN" },
  { key: "expiry", label: "Expiry" },
  { key: "mrp", label: "MRP" },
  { key: "quantity", label: "Quantity" },
  { key: "rate", label: "Rate" },
  { key: "discount", label: "Discount" },
  { key: "gst", label: "GST" },
  { key: "total", label: "Total" },
  { key: "free", label: "Free Qty" },
];

export default function Settings() {
  const settings = useAppSelector((s) => s.settings);
  const dispatch = useAppDispatch();
  const notify = useNotify();
  const [draft, setDraft] = useState(settings);

  useEffect(() => setDraft(settings), [settings]);

  const fields = settings.billFields ?? DEFAULT_BILL_FIELDS;

  const save = () => {
    dispatch(updateSettings(draft));
    notify("Settings saved", "success");
  };

  return (
    <MuiLayout>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}
        sx={{ justifyContent: "space-between", alignItems: { sm: "center" }, mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Settings</Typography>
          <Typography variant="body2" color="text.secondary">Business info, tax and bill field control</Typography>
        </Box>
        <Button variant="contained" startIcon={<Save />} onClick={save}>Save</Button>
      </Stack>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Business Info</Typography>
              <Stack spacing={2}>
                <TextField label="Business Name" value={draft.businessName} onChange={(e) => setDraft({ ...draft, businessName: e.target.value })} />
                <TextField label="Owner Name" value={draft.ownerName} onChange={(e) => setDraft({ ...draft, ownerName: e.target.value })} />
                <TextField label="Phone" value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} />
                <TextField label="Email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} />
                <TextField label="Address" multiline minRows={2} value={draft.address} onChange={(e) => setDraft({ ...draft, address: e.target.value })} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Tax & Invoice</Typography>
              <Stack spacing={2}>
                <TextField label="GSTIN" value={draft.gstin} onChange={(e) => setDraft({ ...draft, gstin: e.target.value })} />
                <TextField type="number" label="Default GST %" value={draft.defaultGst} onChange={(e) => setDraft({ ...draft, defaultGst: +e.target.value })} />
                <TextField label="Invoice Prefix" value={draft.invoicePrefix} onChange={(e) => setDraft({ ...draft, invoicePrefix: e.target.value })} />
                <TextField label="Currency" value={draft.currency} onChange={(e) => setDraft({ ...draft, currency: e.target.value })} />
                <TextField label="Business Register ID" value={draft.businessRegisterId} onChange={(e) => setDraft({ ...draft, businessRegisterId: e.target.value })} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Sales & Purchase Bill — Field Control
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
                Toggle Yes/No to show or hide each field across the bill form and bill history.
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={1}>
                {FIELD_LABELS.map((f) => (
                  <Grid key={f.key} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={fields[f.key]}
                          onChange={(_e, v) => dispatch(setBillField({ key: f.key, value: v }))}
                          color="primary"
                        />
                      }
                      label={
                        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{f.label}</Typography>
                          <Typography variant="caption" color={fields[f.key] ? "success.main" : "error.main"}>
                            {fields[f.key] ? "Yes" : "No"}
                          </Typography>
                        </Stack>
                      }
                    />
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </MuiLayout>
  );
}
