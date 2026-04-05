import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  CircularProgress,
  Chip,
  Button,
  IconButton,
} from "@mui/material";
import {
  TrendingUp,
  TrendingDown,
  Add,
  Notifications,
  Delete,
  Pause,
  PlayArrow,
} from "@mui/icons-material";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { subscriptions, analytics } from "../services/api";
import { useSocket } from "../context/SocketContext";

interface Subscription {
  id: string;
  name: string;
  amount: number;
  currency: string;
  billingCycle: string;
  nextBillingDate: string;
  status: string;
  category: string;
}

interface MonthlySpend {
  month: string;
  total: number;
}

interface CategoryData {
  category: string;
  total: number;
  count: number;
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [subscriptionsList, setSubscriptionsList] = useState<Subscription[]>(
    [],
  );
  const [monthlySpend, setMonthlySpend] = useState<MonthlySpend[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [totalMonthly, setTotalMonthly] = useState<{
    total: number;
    currency: string;
  }>({ total: 0, currency: "INR" });
  const [upcoming, setUpcoming] = useState<Subscription[]>([]);
  const [stats, setStats] = useState({ totalActive: 0, totalPaused: 0 });
  const { socket } = useSocket();

  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884d8",
    "#82ca9d",
  ];

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on("subscription:created", (sub: Subscription) => {
        setSubscriptionsList((prev) => [...prev, sub]);
      });
      socket.on("subscription:updated", (sub: Subscription) => {
        setSubscriptionsList((prev) =>
          prev.map((s) => (s.id === sub.id ? sub : s)),
        );
      });
      socket.on("subscription:deleted", ({ id }: { id: string }) => {
        setSubscriptionsList((prev) => prev.filter((s) => s.id !== id));
      });
    }
    return () => {
      socket?.removeAllListeners();
    };
  }, [socket]);

  const fetchData = async () => {
    try {
      const [subsRes, monthlyRes, catRes, totalRes, upcomingRes, statsRes] =
        await Promise.all([
          subscriptions.getAll(),
          analytics.monthlySpend(6),
          analytics.categoryBreakdown(),
          analytics.totalMonthlySpend(),
          subscriptions.upcoming(7),
          analytics.subscriptionStats(),
        ]);
      setSubscriptionsList(subsRes.data);
      setMonthlySpend(monthlyRes.data);
      setCategoryData(catRes.data);
      setTotalMonthly(totalRes.data);
      setUpcoming(upcomingRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePause = async (id: string) => {
    try {
      await subscriptions.pause(id);
    } catch (error) {
      console.error("Failed to pause:", error);
    }
  };

  const handleResume = async (id: string) => {
    try {
      await subscriptions.resume(id);
    } catch (error) {
      console.error("Failed to resume:", error);
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Dashboard
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card
            sx={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
            }}
          >
            <CardContent>
              <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>
                Monthly Spend
              </Typography>
              <Typography variant="h3" fontWeight="bold">
                {totalMonthly.currency} {totalMonthly.total.toLocaleString()}
              </Typography>
              <Box display="flex" alignItems="center" mt={1}>
                <TrendingDown fontSize="small" />
                <Typography variant="body2" ml={0.5}>
                  vs last month
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Active Subscriptions
              </Typography>
              <Typography variant="h3" fontWeight="bold" color="primary">
                {stats.totalActive}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Paused
              </Typography>
              <Typography variant="h3" fontWeight="bold" color="warning.main">
                {stats.totalPaused}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Upcoming (7 days)
              </Typography>
              <Typography variant="h3" fontWeight="bold" color="info.main">
                {upcoming.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Monthly Spend Trend
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={monthlySpend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#667eea"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Spending by Category
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="total"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                  >
                    {categoryData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={2}
              >
                <Typography variant="h6">Upcoming Renewals</Typography>
                <Chip
                  icon={<Notifications />}
                  label={upcoming.length}
                  color="primary"
                  size="small"
                />
              </Box>
              {upcoming.map((sub) => (
                <Box
                  key={sub.id}
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  py={1}
                  borderBottom="1px solid #eee"
                >
                  <Box>
                    <Typography fontWeight="medium">{sub.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(sub.nextBillingDate).toLocaleDateString()}
                    </Typography>
                  </Box>
                  <Typography fontWeight="bold">
                    {sub.currency} {sub.amount}
                  </Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                All Subscriptions
              </Typography>
              {subscriptionsList.slice(0, 5).map((sub) => (
                <Box
                  key={sub.id}
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  py={1}
                  borderBottom="1px solid #eee"
                >
                  <Box>
                    <Typography fontWeight="medium">{sub.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {sub.category || "Uncategorized"}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Chip
                      label={sub.status}
                      size="small"
                      color={sub.status === "active" ? "success" : "default"}
                    />
                    <Typography fontWeight="bold">
                      {sub.currency} {sub.amount}/{sub.billingCycle}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
