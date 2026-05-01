import { useState } from "react";
import {
  Box, Card, CardContent, Stack, Typography, Button, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tab, Tabs,
  Accordion, AccordionSummary, AccordionDetails,
} from "@mui/material";
import { Add, Delete, Done, ExpandMore, Edit } from "@mui/icons-material";
import { format } from "date-fns";
import { AdminLayout } from "@/components/AdminLayout";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  addFaq, updateFaq, deleteFaq, resolveQuery, deleteQuery, Faq,
} from "@/store/slices/supportSlice";
import { useNotify } from "@/components/NotifyProvider";

const blankFaq: Faq = { id: "", question: "", answer: "", createdAt: "" };

export default function QueriesAdmin() {
  const dispatch = useAppDispatch();
  const notify = useNotify();
  const { queries, faqs } = useAppSelector((s) => s.support);
  const [tab, setTab] = useState(0);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Faq>(blankFaq);

  const saveFaq = () => {
    if (!draft.question || !draft.answer) return notify("Question and answer required", "error");
    if (draft.id) {
      dispatch(updateFaq(draft));
      notify("FAQ updated", "success");
    } else {
      dispatch(addFaq({ ...draft, id: `faq-${Date.now()}`, createdAt: new Date().toISOString() }));
      notify("FAQ added", "success");
    }
    setOpen(false); setDraft(blankFaq);
  };

  return (
    <AdminLayout>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Queries & FAQs</Typography>
          <Typography variant="body2" color="text.secondary">
            Respond to client queries and publish FAQs
          </Typography>
        </Box>

        <Card>
          <Tabs value={tab} onChange={(_e, v) => setTab(v)} sx={{ px: 2, borderBottom: 1, borderColor: "divider" }}>
            <Tab label={`Queries (${queries.filter((q) => !q.resolved).length})`} />
            <Tab label={`FAQs (${faqs.length})`} />
          </Tabs>

          {tab === 0 && (
            <Box sx={{ p: 2 }}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Business</TableCell>
                      <TableCell>Contact</TableCell>
                      <TableCell>Message</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {queries.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 4, color: "text.secondary" }}>
                          No queries yet
                        </TableCell>
                      </TableRow>
                    )}
                    {queries.map((q) => (
                      <TableRow key={q.id} hover sx={{ opacity: q.resolved ? 0.55 : 1 }}>
                        <TableCell sx={{ fontWeight: 600 }}>{q.businessName}</TableCell>
                        <TableCell>{q.contact}</TableCell>
                        <TableCell sx={{ maxWidth: 360 }}>{q.message}</TableCell>
                        <TableCell>{format(new Date(q.date), "dd MMM yy, p")}</TableCell>
                        <TableCell align="right">
                          {!q.resolved && (
                            <IconButton size="small" color="success"
                              onClick={() => { dispatch(resolveQuery(q.id)); notify("Marked resolved", "success"); }}
                              title="Mark resolved"
                            ><Done fontSize="small" /></IconButton>
                          )}
                          {q.resolved && <Chip size="small" color="success" label="Resolved" sx={{ mr: 1 }} />}
                          <IconButton size="small" color="error"
                            onClick={() => { dispatch(deleteQuery(q.id)); notify("Deleted", "info"); }}
                          ><Delete fontSize="small" /></IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {tab === 1 && (
            <Box sx={{ p: 2 }}>
              <Stack direction="row" sx={{ justifyContent: "flex-end", mb: 2 }}>
                <Button variant="contained" startIcon={<Add />} onClick={() => { setDraft(blankFaq); setOpen(true); }}>
                  Add FAQ
                </Button>
              </Stack>
              {faqs.length === 0 && (
                <Typography align="center" color="text.secondary" sx={{ py: 4 }}>
                  No FAQs yet
                </Typography>
              )}
              {faqs.map((f) => (
                <Accordion key={f.id}>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography sx={{ fontWeight: 600, flex: 1 }}>{f.question}</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", mb: 2 }}>{f.answer}</Typography>
                    <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
                      <IconButton size="small" onClick={() => { setDraft(f); setOpen(true); }}>
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error"
                        onClick={() => { dispatch(deleteFaq(f.id)); notify("Deleted", "info"); }}
                      ><Delete fontSize="small" /></IconButton>
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          )}
        </Card>
      </Stack>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{draft.id ? "Edit FAQ" : "Add FAQ"}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth label="Question" value={draft.question}
                onChange={(e) => setDraft({ ...draft, question: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth multiline minRows={4} label="Answer" value={draft.answer}
                onChange={(e) => setDraft({ ...draft, answer: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={saveFaq}>{draft.id ? "Save" : "Add"}</Button>
        </DialogActions>
      </Dialog>
    </AdminLayout>
  );
}
