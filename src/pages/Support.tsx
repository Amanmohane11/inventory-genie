import { useState } from "react";
import {
  Box, Card, CardContent, Stack, Typography, TextField, Button, Grid, Divider,
  Accordion, AccordionSummary, AccordionDetails, Alert,
} from "@mui/material";
import { ExpandMore, Send } from "@mui/icons-material";
import { MuiLayout } from "@/components/MuiLayout";
import { useAppDispatch, useAppSelector } from "@/store";
import { addQuery } from "@/store/slices/supportSlice";
import { useNotify } from "@/components/NotifyProvider";

export default function Support() {
  const dispatch = useAppDispatch();
  const notify = useNotify();
  const settings = useAppSelector((s) => s.settings);
  const user = useAppSelector((s) => s.auth.user);
  const faqs = useAppSelector((s) => s.support.faqs);
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState(user?.email ?? settings.email ?? "");

  const submit = () => {
    if (!message.trim()) return notify("Please enter your query", "error");
    if (!contact.trim()) return notify("Contact info required", "error");
    dispatch(addQuery({
      id: `q-${Date.now()}`,
      businessName: settings.businessName,
      contact: contact.trim(),
      message: message.trim(),
      date: new Date().toISOString(),
    }));
    notify("Query sent to Super Admin", "success");
    setMessage("");
  };

  return (
    <MuiLayout>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Help & Support</Typography>
          <Typography variant="body2" color="text.secondary">
            Browse FAQs or send a question to our team
          </Typography>
        </Box>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 7 }}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                  Frequently Asked Questions
                </Typography>
                {faqs.length === 0 && (
                  <Alert severity="info">No FAQs published yet.</Alert>
                )}
                {faqs.map((f) => (
                  <Accordion key={f.id} disableGutters>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Typography sx={{ fontWeight: 600 }}>{f.question}</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", color: "text.secondary" }}>
                        {f.answer}
                      </Typography>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 5 }}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                  Send a Query
                </Typography>
                <Stack spacing={2}>
                  <TextField label="Business" fullWidth value={settings.businessName} disabled />
                  <TextField label="Contact (email or phone)" fullWidth value={contact}
                    onChange={(e) => setContact(e.target.value)} />
                  <TextField label="Your message" fullWidth multiline minRows={5}
                    value={message} onChange={(e) => setMessage(e.target.value)} />
                  <Divider />
                  <Button variant="contained" startIcon={<Send />} onClick={submit}>
                    Send to Super Admin
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Stack>
    </MuiLayout>
  );
}
