"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    amount: "",
    billingCycle: "monthly",
    nextBillingDate: "",
    category: "",
  });
  const router = useRouter();

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.push("/login");
        return;
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/subscriptions`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setSubscriptions(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/subscriptions`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: formData.name,
            amount: parseFloat(formData.amount),
            billingCycle: formData.billingCycle,
            nextBillingDate: formData.nextBillingDate,
            category: formData.category,
          }),
        },
      );

      if (!res.ok) throw new Error("Failed to create");

      setFormData({
        name: "",
        amount: "",
        billingCycle: "monthly",
        nextBillingDate: "",
        category: "",
      });
      setShowForm(false);
      fetchSubscriptions();
    } catch (error) {
      console.error(error);
    }
  };

  const handlePause = async (id: string) => {
    try {
      const token = localStorage.getItem("accessToken");
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/subscriptions/${id}/pause`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      fetchSubscriptions();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem("accessToken");
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/subscriptions/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchSubscriptions();
    } catch (error) {
      console.error(error);
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
        <h1 className="text-3xl font-bold">Subscriptions</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "Add Subscription"}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>New Subscription</CardTitle>
            <CardDescription>Add a new subscription to track</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="billingCycle">Billing Cycle</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                    value={formData.billingCycle}
                    onChange={(e) =>
                      setFormData({ ...formData, billingCycle: e.target.value })
                    }
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nextBillingDate">Next Billing Date</Label>
                  <Input
                    id="nextBillingDate"
                    type="date"
                    value={formData.nextBillingDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        nextBillingDate: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category (optional)</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                  />
                </div>
              </div>
              <Button type="submit">Create Subscription</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {subscriptions.map((sub) => (
          <Card key={sub.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-lg">{sub.name}</CardTitle>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  sub.status === "active"
                    ? "bg-green-100 text-green-800"
                    : sub.status === "paused"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                }`}
              >
                {sub.status}
              </span>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-medium">
                    {sub.currency} {sub.amount}/{sub.billingCycle}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Next billing</span>
                  <span className="text-sm">
                    {new Date(sub.nextBillingDate).toLocaleDateString()}
                  </span>
                </div>
                {sub.category && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Category</span>
                    <span className="text-sm">{sub.category}</span>
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  {sub.status === "active" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePause(sub.id)}
                    >
                      Pause
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePause(sub.id)}
                    >
                      Resume
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(sub.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {subscriptions.length === 0 && !showForm && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No subscriptions yet</p>
          <Button variant="link" onClick={() => setShowForm(true)}>
            Add your first subscription
          </Button>
        </div>
      )}
    </div>
  );
}
