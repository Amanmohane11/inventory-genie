import { useState } from "react";
import {
  Box, Card, Stack, Typography, Button, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tab, Tabs,
  Accordion, AccordionSummary, AccordionDetails, Alert,
} from "@mui/material";
import { Add, Delete, Send, ExpandMore, Edit } from "@mui/icons-material";
import { format } from "date-fns";
import { AdminLayout } from "@/components/AdminLayout";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  addFaq, updateFaq, deleteFaq, answerQuery, deleteQuery, Faq, Query,
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
  const [answering, setAnswering] = useState<Query | null>(null);
  const [answerText, setAnswerText] = useState("");

  const saveFaq = () => {
    if (!draft.question || !draft.answer) return notify("Question and answer required", "error");
    if (draft.id) { dispatch(updateFaq(draft)); notify("FAQ updated", "success"); }
    else { dispatch(addFaq({ ...draft, id: `faq-${Date.now()}`, createdAt: new Date().toISOString() })); notify("FAQ added", "success"); }
    setOpen(false); setDraft(blankFaq);
  };

  const sendAnswer = () => {
    if (!answering) return;
    if (!answerText.trim()) return notify("Type a response first", "error");
    dispatch(answerQuery({ id: answering.id, answer: answerText.trim() }));
    notify("Response sent to client", "success");
    setAnswering(null); setAnswerText("");
  };

  return (
    <AdminLayout>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Queries & FAQs</Typography>
          <Typography variant="body2" color="text.secondary">Respond to client queries and publish FAQs</Typography>
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
                      <TableCell>Response</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {queries.length === 0 && (
                      <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: "text.secondary" }}>No queries yet</TableCell></TableRow>
                    )}
                    {queries.map((q) => (
                      <TableRow key={q.id} hover>
                        <TableCell sx={{ fontWeight: 600 }}>{q.businessName}</TableCell>
                        <TableCell>{q.contact}</TableCell>
                        <TableCell sx={{ maxWidth: 280 }}>{q.message}</TableCell>
                        <TableCell sx={{ maxWidth: 280, color: "text.secondary" }}>
                          {q.answer ? q.answer : <Chip size="small" color="warning" label="Pending" />}
                        </TableCell>
                        <TableCell>{format(new Date(q.date), "dd MMM, p")}</TableCell>
                        <TableCell align="right">
                          <Button size="small" variant="outlined" startIcon={<Send />}
                            onClick={() => { setAnswering(q); setAnswerText(q.answer ?? ""); }}
                            sx={{ mr: 1 }}>
                            {q.answer ? "Update" : "Answer"}
                          </Button>
                          <IconButton size="small" color="error"
                            onClick={() => { dispatch(deleteQuery(q.id)); notify("Deleted", "info"); }}>
                            <Delete fontSize="small" />
                          </IconButton>
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
                <Button variant="contained" startIcon={<Add />} onClick={() => { setDraft(blankFaq); setOpen(true); }}>Add FAQ</Button>
              </Stack>
              {faqs.map((f) => (
                <Accordion key={f.id}>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography sx={{ fontWeight: 600, flex: 1 }}>{f.question}</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", mb: 2 }}>{f.answer}</Typography>
                    <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
                      <IconButton size="small" onClick={() => { setDraft(f); setOpen(true); }}><Edit fontSize="small" /></IconButton>
                      <IconButton size="small" color="error" onClick={() => { dispatch(deleteFaq(f.id)); notify("Deleted", "info"); }}><Delete fontSize="small" /></IconButton>
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
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField fullWidth label="Question" value={draft.question} onChange={(e) => setDraft({ ...draft, question: e.target.value })} />
            <TextField fullWidth multiline minRows={4} label="Answer" value={draft.answer} onChange={(e) => setDraft({ ...draft, answer: e.target.value })} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={saveFaq}>{draft.id ? "Save" : "Add"}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!answering} onClose={() => setAnswering(null)} fullWidth maxWidth="sm">
        <DialogTitle>Respond to Query</DialogTitle>
        <DialogContent dividers>
          {answering && (
            <Stack spacing={2}>
              <Alert severity="info">
                <Typography variant="caption" color="text.secondary">From: {answering.businessName} ({answering.contact})</Typography>
                <Typography variant="body2" sx={{ mt: 1, whiteSpace: "pre-wrap" }}>{answering.message}</Typography>
              </Alert>
              <TextField fullWidth multiline minRows={5} label="Your response"
                value={answerText} onChange={(e) => setAnswerText(e.target.value)} autoFocus />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAnswering(null)}>Cancel</Button>
          <Button variant="contained" startIcon={<Send />} onClick={sendAnswer}>Send Response</Button>
        </DialogActions>
      </Dialog>
    </AdminLayout>
  );
}
