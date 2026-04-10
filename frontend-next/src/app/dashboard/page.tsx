"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface DashboardStats {
  totalMonthly: number;
  currency: string;
  totalActive: number;
  totalPaused: number;
  upcomingCount: number;
}

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

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalMonthly: 0,
    currency: "INR",
    totalActive: 0,
    totalPaused: 0,
    upcomingCount: 0,
  });
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.push("/login");
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [statsRes, subsRes] = await Promise.all([
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/analytics/subscription-stats`,
          { headers },
        ),
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/subscriptions?status=active`,
          { headers },
        ),
      ]);

      if (!statsRes.ok || !subsRes.ok) {
        throw new Error("Failed to fetch data");
      }

      const statsData = await statsRes.json();
      const subsData = await subsRes.json();

      setStats(statsData);
      setSubscriptions(subsData);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Button>Add Subscription</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Spend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.currency} {stats.totalMonthly.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">vs last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Subscriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalActive}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paused</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPaused}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Upcoming (7 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Subscriptions</CardTitle>
            <CardDescription>Your active subscriptions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {subscriptions.slice(0, 5).map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0"
                >
                  <div>
                    <p className="font-medium">{sub.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {sub.category || "Uncategorized"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {sub.currency} {sub.amount}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {sub.billingCycle}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Renewals</CardTitle>
            <CardDescription>Subscriptions renewing soon</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {subscriptions
                .filter(
                  (sub) =>
                    new Date(sub.nextBillingDate) <=
                    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                )
                .slice(0, 5)
                .map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between border-b pb-4 last:border-0"
                  >
                    <div>
                      <p className="font-medium">{sub.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(sub.nextBillingDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="font-medium">
                      {sub.currency} {sub.amount}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
