import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent, CardActions, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Chip, IconButton, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import { Add, Edit, Delete, Pause, PlayArrow } from '@mui/icons-material';
import { subscriptions as subsApi } from '../services/api';
import { useSocket } from '../context/SocketContext';

interface Subscription {
  id: string;
  name: string;
  amount: number;
  currency: string;
  billingCycle: string;
  intervalCount: number;
  nextBillingDate: string;
  status: string;
  category: string;
  description: string;
}

const billingCycles = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom'];
const currencies = ['INR', 'USD', 'EUR', 'GBP'];

export default function Subscriptions() {
  const [list, setList] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<Subscription | null>(null);
  const [form, setForm] = useState({
    name: '', amount: '', currency: 'INR', billingCycle: 'monthly', intervalCount: '1', nextBillingDate: '', category: '', description: ''
  });
  const { socket } = useSocket();

  const fetchData = async () => {
    try {
      const { data } = await subsApi.getAll();
      setList(data);
    } catch (error) {
      console.error('Failed to fetch:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('subscription:created', (sub: Subscription) => setList((prev) => [...prev, sub]));
      socket.on('subscription:updated', (sub: Subscription) => setList((prev) => prev.map((s) => (s.id === sub.id ? sub : s))));
      socket.on('subscription:deleted', ({ id }: { id: string }) => setList((prev) => prev.filter((s) => s.id !== id)));
      socket.on('subscription:paused', (sub: Subscription) => setList((prev) => prev.map((s) => (s.id === sub.id ? sub : s))));
      socket.on('subscription:resumed', (sub: Subscription) => setList((prev) => prev.map((s) => (s.id === sub.id ? sub : s))));
    }
    return () => { socket?.removeAllListeners(); };
  }, [socket]);

  const handleSubmit = async () => {
    try {
      const data = {
        name: form.name,
        amount: parseInt(form.amount),
        currency: form.currency,
        billingCycle: form.billingCycle,
        intervalCount: parseInt(form.intervalCount),
        nextBillingDate: new Date(form.nextBillingDate).toISOString(),
        category: form.category || undefined,
        description: form.description || undefined,
      };
      if (editItem) {
        await subsApi.update(editItem.id, data);
      } else {
        await subsApi.create(data);
      }
      setOpen(false);
      setEditItem(null);
      setForm({ name: '', amount: '', currency: 'INR', billingCycle: 'monthly', intervalCount: '1', nextBillingDate: '', category: '', description: '' });
      fetchData();
    } catch (error) {
      console.error('Failed to save:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this subscription?')) {
      await subsApi.delete(id);
    }
  };

  const handlePause = async (id: string) => {
    await subsApi.pause(id);
  };

  const handleResume = async (id: string) => {
    await subsApi.resume(id);
  };

  const openEdit = (sub: Subscription) => {
    setEditItem(sub);
    setForm({
      name: sub.name,
      amount: sub.amount.toString(),
      currency: sub.currency,
      billingCycle: sub.billingCycle,
      intervalCount: sub.intervalCount.toString(),
      nextBillingDate: sub.nextBillingDate.split('T')[0],
      category: sub.category || '',
      description: sub.description || '',
    });
    setOpen(true);
  };

  const openAdd = () => {
    setEditItem(null);
    setForm({ name: '', amount: '', currency: 'INR', billingCycle: 'monthly', intervalCount: '1', nextBillingDate: '', category: '', description: '' });
    setOpen(true);
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">Subscriptions</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openAdd}>Add Subscription</Button>
      </Box>

      <Grid container spacing={3}>
        {list.map((sub) => (
          <Grid size={{ xs: 12, md: 4 }} key={sub.id}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="start">
                  <Typography variant="h6">{sub.name}</Typography>
                  <Chip label={sub.status} color={sub.status === 'active' ? 'success' : 'warning'} size="small" />
                </Box>
                <Typography variant="h5" fontWeight="bold" color="primary" mt={1}>
                  {sub.currency} {sub.amount}
                  <Typography component="span" variant="body2">/{sub.billingCycle}</Typography>
                </Typography>
                <Typography variant="body2" color="text.secondary" mt={1}>
                  Next: {new Date(sub.nextBillingDate).toLocaleDateString()}
                </Typography>
                {sub.category && <Chip label={sub.category} size="small" sx={{ mt: 1 }} />}
              </CardContent>
              <CardActions>
                <IconButton size="small" onClick={() => openEdit(sub)}><Edit /></IconButton>
                <IconButton size="small" onClick={() => sub.status === 'active' ? handlePause(sub.id) : handleResume(sub.id)}>
                  {sub.status === 'active' ? <Pause /> : <PlayArrow />}
                </IconButton>
                <IconButton size="small" color="error" onClick={() => handleDelete(sub.id)}><Delete /></IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editItem ? 'Edit Subscription' : 'Add Subscription'}</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} margin="dense" />
          <TextField fullWidth label="Amount" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} margin="dense" />
          <FormControl fullWidth margin="dense">
            <InputLabel>Currency</InputLabel>
            <Select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} label="Currency">
              {currencies.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="dense">
            <InputLabel>Billing Cycle</InputLabel>
            <Select value={form.billingCycle} onChange={(e) => setForm({ ...form, billingCycle: e.target.value })} label="Billing Cycle">
              {billingCycles.map((b) => <MenuItem key={b} value={b}>{b}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField fullWidth label="Next Billing Date" type="date" value={form.nextBillingDate} onChange={(e) => setForm({ ...form, nextBillingDate: e.target.value })} margin="dense" InputLabelProps={{ shrink: true }} />
          <TextField fullWidth label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} margin="dense" />
          <TextField fullWidth label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} margin="dense" multiline rows={2} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">{editItem ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}