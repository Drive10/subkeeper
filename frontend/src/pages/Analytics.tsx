import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent, Select, MenuItem, FormControl, InputLabel, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from 'recharts';
import { analytics } from '../services/api';

interface CategoryData {
  category: string;
  total: number;
  count: number;
}

interface UnusedSubscription {
  id: string;
  name: string;
  amount: number;
  currency: string;
  lastBillingDate: string | null;
  daysSinceLastPayment: number | null;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function AnalyticsPage() {
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [unusedData, setUnusedData] = useState<UnusedSubscription[]>([]);
  const [totalSpend, setTotalSpend] = useState<{ total: number; currency: string }>({ total: 0, currency: 'INR' });
  const [months, setMonths] = useState(6);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [months]);

  const fetchData = async () => {
    try {
      const [monthly, cat, unused, total] = await Promise.all([
        analytics.monthlySpend(months),
        analytics.categoryBreakdown(),
        analytics.unusedSubscriptions(60),
        analytics.totalMonthlySpend(),
      ]);
      setMonthlyData(monthly.data);
      setCategoryData(cat.data);
      setUnusedData(unused.data);
      setTotalSpend(total.data);
    } catch (error) {
      console.error('Failed to fetch:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">Analytics</Typography>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Months</InputLabel>
          <Select value={months} onChange={(e) => setMonths(e.target.value as number)} label="Months">
            <MenuItem value={3}>3 Months</MenuItem>
            <MenuItem value={6}>6 Months</MenuItem>
            <MenuItem value={12}>12 Months</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">Total Monthly Spend</Typography>
              <Typography variant="h3" fontWeight="bold" color="primary">
                {totalSpend.currency} {totalSpend.total.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">Categories</Typography>
              <Typography variant="h3" fontWeight="bold">{categoryData.length}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">Unused Subscriptions</Typography>
              <Typography variant="h3" fontWeight="bold" color="warning.main">{unusedData.length}</Typography>
              <Typography variant="body2" color="text.secondary">Last 60 days</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Monthly Spending</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="total" fill="#667eea" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>By Category</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={categoryData} dataKey="total" nameKey="category" cx="50%" cy="50%" outerRadius={100} label>
                    {categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Unused Subscriptions (Not used in 60+ days)</Typography>
              {unusedData.length > 0 ? (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Last Payment</TableCell>
                        <TableCell>Days Since</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {unusedData.map((sub) => (
                        <TableRow key={sub.id}>
                          <TableCell>{sub.name}</TableCell>
                          <TableCell>{sub.currency} {sub.amount}</TableCell>
                          <TableCell>{sub.lastBillingDate ? new Date(sub.lastBillingDate).toLocaleDateString() : 'N/A'}</TableCell>
                          <TableCell>{sub.daysSinceLastPayment || 'N/A'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color="text.secondary">All subscriptions are being used!</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}