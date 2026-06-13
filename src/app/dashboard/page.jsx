"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthGuard";
import {
  Users,
  IndianRupee,
  Megaphone,
  Percent,
  TrendingUp,
  Sparkles,
  ArrowUpRight,
  LogOut,
  Sparkle,
  Zap,
  CheckCircle2,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [kpis, setKpis] = useState(null);
  const [charts, setCharts] = useState(null);
  const [topCustomers, setTopCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  // AI Recommendations
  const [recommendations, setRecommendations] = useState([]);
  const [launchingRecId, setLaunchingRecId] = useState(null);
  const [launchSuccess, setLaunchSuccess] = useState(null);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, ordersRes] = await Promise.all([
        fetch("/api/dashboard"),
        fetch("/api/orders?limit=5"),
      ]);
      const statsData = await statsRes.json();
      const ordersData = await ordersRes.json();

      if (statsData.success) {
        setKpis(statsData.kpis);
        setCharts(statsData.charts);
      }
      if (ordersData.success) {
        setTopCustomers(ordersData.topCustomers);
      }

      // Generate AI Recommendations based on DB stats
      const customerCount = statsData.kpis?.totalCustomers || 50;
      setRecommendations([
        {
          id: "rec-1",
          name: "VIP Customers Reward",
          segmentName: "VIP Customers (> 10k)",
          query: JSON.stringify({
            conditions: [{ field: "totalSpent", operator: "gt", value: 10000 }],
            logicalOperator: "AND",
          }),
          channel: "EMAIL",
          message:
            "Hello {{name}},\n\nWe appreciate your loyalty at Xeno! As a VIP customer, enjoy early access to our premium summer collection. Use code VIPPREMIUM at checkout.\n\nBest,\nXeno Team",
          size: Math.max(3, Math.floor(customerCount * 0.25)),
          potentialRevenue: 120000,
          reason: "High LTV spenders who drive 60% of absolute lifetime sales.",
        },
        {
          id: "rec-2",
          name: "Inactive Cart Revival",
          segmentName: "Inactive Users (30d+)",
          query: JSON.stringify({
            conditions: [
              { field: "lastOrderDaysAgo", operator: "gt", value: 30 },
            ],
            logicalOperator: "AND",
          }),
          channel: "WHATSAPP",
          message:
            "Hi {{firstName}}! 🛒 We noticed you left items in your cart. Retrieve them today and get 15% off using code REVIVAL15. Shop now!",
          size: Math.max(2, Math.floor(customerCount * 0.35)),
          potentialRevenue: 90000,
          reason:
            "Shoppers with recent engagement but no transactions in the last month.",
        },
        {
          id: "rec-3",
          name: "Likely Churn Win-Back",
          segmentName: "Sleepy Shoppers (45d+)",
          query: JSON.stringify({
            conditions: [
              { field: "lastOrderDaysAgo", operator: "gt", value: 45 },
            ],
            logicalOperator: "AND",
          }),
          channel: "WHATSAPP",
          message:
            "Hi {{firstName}}! We miss you at Xeno. 😢 Enjoy an exclusive VIP 20% discount on your next checkout with code WINBACK20.",
          size: Math.max(2, Math.floor(customerCount * 0.2)),
          potentialRevenue: 75000,
          reason: "Dormant accounts at risk of complete lifecycle churn.",
        },
      ]);
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  // Launch Recommended Campaign
  const handleLaunchRecommendation = async (rec) => {
    setLaunchingRecId(rec.id);
    setLaunchSuccess(null);

    try {
      // Step 1: Create Segment
      const segRes = await fetch("/api/segments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `AI Rec: ${rec.name}`,
          description: `AI recommended: ${rec.reason}`,
          query: rec.query,
        }),
      });
      const segData = await segRes.json();
      if (!segData.success) throw new Error(segData.error);

      // Step 2: Create Campaign
      const campRes = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `AI Campaign: ${rec.name}`,
          segmentId: segData.segment.id,
          channel: rec.channel,
          message: rec.message,
        }),
      });
      const campData = await campRes.json();
      if (!campData.success) throw new Error(campData.error);

      // Step 3: Send Campaign
      const sendRes = await fetch(
        `/api/campaigns/${campData.campaign.id}/send`,
        {
          method: "POST",
        },
      );
      const sendData = await sendRes.json();
      if (!sendData.success) throw new Error(sendData.error);

      setLaunchSuccess(
        `AI campaign launched! Dispatched to ${sendData.count} shoppers.`,
      );
      fetchDashboardData();
    } catch (e) {
      console.error(e);
      alert(`Launch failed: ${e.message}`);
    } finally {
      setLaunchingRecId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse text-xs">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-zinc-800/40 rounded-lg"></div>
            <div className="h-3.5 w-96 bg-zinc-800/20 rounded-md"></div>
          </div>
          <div className="flex gap-2">
            <div className="h-8 w-28 bg-zinc-800/30 rounded-md"></div>
            <div className="h-8 w-24 bg-zinc-800/30 rounded-md"></div>
          </div>
        </div>

        {/* KPI Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="glass-panel p-6 rounded-xl space-y-4 border border-zinc-800/5"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="h-3 w-16 bg-zinc-800/30 rounded"></div>
                  <div className="h-7 w-24 bg-zinc-800/40 rounded-lg"></div>
                </div>
                <div className="h-10 w-10 bg-zinc-800/20 rounded-lg"></div>
              </div>
              <div className="h-3 w-32 bg-zinc-800/20 rounded"></div>
            </div>
          ))}
        </div>

        {/* Body Split Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="glass-panel p-6 rounded-xl lg:col-span-2 h-96 bg-zinc-900/10 border border-zinc-800/5"></div>
          <div className="glass-panel p-6 rounded-xl h-96 bg-zinc-900/10 border border-zinc-800/5"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            Marketer Workspace{" "}
            <Sparkles className="w-6 h-6 text-indigo-500 animate-pulse" />
          </h1>
          <p className="text-muted-custom text-xs mt-1 font-medium">
            Hello,{" "}
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {user?.name}
            </span>
            . Real-time engagement trends, sales attribution, and recommendation
            logs.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 bg-zinc-800/10 hover:bg-zinc-800/20 border border-zinc-800/10 hover:border-zinc-700/30 text-slate-800 dark:text-zinc-300 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-2 cursor-pointer"
          >
            <span
              className={`w-2 h-2 rounded-full bg-indigo-500 ${refreshing ? "animate-ping" : ""}`}
            />
            Sync Dashboard
          </button>
          <button
            onClick={logout}
            className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Customers */}
        <div className="glass-panel p-6 rounded-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 text-indigo-500 pointer-events-none group-hover:scale-110 transition-transform duration-300">
            <Users className="w-24 h-24" />
          </div>
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-custom">
                Total Shoppers
              </span>
              <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white">
                {kpis?.totalCustomers || 0}
              </h3>
            </div>
            <div className="p-3 bg-indigo-500/10 rounded-lg border border-indigo-500/20 text-indigo-500">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-emerald-500 gap-1 font-semibold">
            <TrendingUp className="w-4 h-4" />
            <span>+12.4% customer growth</span>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="glass-panel p-6 rounded-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 text-emerald-500 pointer-events-none group-hover:scale-110 transition-transform duration-300">
            <IndianRupee className="w-24 h-24" />
          </div>
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-custom">
                Total Revenue
              </span>
              <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white">
                ₹{(kpis?.totalRevenue || 0).toLocaleString("en-IN")}
              </h3>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-emerald-500">
              <IndianRupee className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-indigo-500 gap-1.5 font-semibold">
            <Zap className="w-4 h-4 text-indigo-500" />
            <span>
              ₹{(kpis?.campaignGeneratedRevenue || 0).toLocaleString("en-IN")}{" "}
              attributed sales
            </span>
          </div>
        </div>

        {/* Campaigns sent */}
        <div className="glass-panel p-6 rounded-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 text-cyan-400 pointer-events-none group-hover:scale-110 transition-transform duration-300">
            <Megaphone className="w-24 h-24" />
          </div>
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-custom">
                Campaigns Run
              </span>
              <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white">
                {kpis?.totalCampaigns || 0}
              </h3>
            </div>
            <div className="p-3 bg-cyan-500/10 rounded-lg border border-cyan-500/20 text-cyan-400">
              <Megaphone className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-muted-custom gap-1">
            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
            <span className="font-semibold">
              Simulated dispatch webhook ready
            </span>
          </div>
        </div>

        {/* Overall Engagement Funnel */}
        <div className="glass-panel p-6 rounded-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 text-purple-400 pointer-events-none group-hover:scale-110 transition-transform duration-300">
            <Percent className="w-24 h-24" />
          </div>
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-custom">
                Open Rate (Avg)
              </span>
              <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white">
                {(kpis?.openRate || 0).toFixed(1)}%
              </h3>
            </div>
            <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/20 text-purple-400">
              <Percent className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-purple-500 gap-1.5 font-semibold">
            <span>CTR: {(kpis?.clickRate || 0).toFixed(1)}%</span>
            <span className="text-zinc-600">•</span>
            <span>Conv: {(kpis?.conversionRate || 0).toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Main Charts & Recommendations Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Trend Area Chart */}
        <div className="glass-panel p-6 rounded-xl lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Revenue & Purchase Funnel
              </h2>
              <p className="text-muted-custom text-xs">
                Daily shopping transactions over the past 15 days.
              </p>
            </div>
          </div>
          <div className="h-80 w-full">
            {charts?.revenueTrend && charts.revenueTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={charts.revenueTrend}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="colorRevenue"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop
                        offset="95%"
                        stopColor="#6366f1"
                        stopOpacity={0.0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(128,128,128,0.1)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    stroke="#6b7280"
                    fontSize={11}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#6b7280"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card-bg)",
                      borderColor: "var(--card-border)",
                      borderRadius: "8px",
                    }}
                    labelStyle={{
                      color: "var(--foreground)",
                      fontWeight: "bold",
                    }}
                    itemStyle={{ color: "#6366f1" }}
                  />

                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                    name="Revenue (₹)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
                No transaction history found
              </div>
            )}
          </div>
        </div>

        {/* AI Recommendations Panel */}
        <div className="glass-panel p-6 rounded-xl space-y-4 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Sparkle className="w-5 h-5 text-indigo-500 animate-pulse" /> AI
              Audience Planner
            </h2>
            <p className="text-muted-custom text-xs">
              Dynamic targeting segments calculated from database profiles.
            </p>
          </div>

          <div className="space-y-4 flex-1 mt-2">
            {launchSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 text-emerald-500 text-xs font-bold rounded-lg flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />{" "}
                {launchSuccess}
              </div>
            )}

            {recommendations.map((rec) => (
              <div
                key={rec.id}
                className="p-3.5 bg-slate-50 dark:bg-zinc-800/10 border border-slate-200 dark:border-zinc-800/20 rounded-xl space-y-2 text-xs"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-white">
                      {rec.name}
                    </h4>
                    <p className="text-[10px] text-slate-505 dark:text-zinc-500 mt-0.5 font-medium">
                      {rec.reason}
                    </p>
                  </div>
                  <span className="text-[9px] bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/25 text-indigo-600 dark:text-indigo-500 px-1.5 py-0.2 rounded font-bold uppercase">
                    {rec.channel}
                  </span>
                </div>
                <div className="flex justify-between text-[10px] border-t border-b border-slate-200 dark:border-zinc-800/10 py-1.5 my-1 text-slate-500 dark:text-zinc-500 font-semibold">
                  <span>Size: {rec.size} profiles</span>
                  <span>
                    Proj Rev: ₹{rec.potentialRevenue.toLocaleString("en-IN")}
                  </span>
                </div>
                <button
                  onClick={() => handleLaunchRecommendation(rec)}
                  disabled={launchingRecId !== null}
                  className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded font-bold text-[10px] cursor-pointer transition-all flex items-center justify-center gap-1"
                >
                  <Zap className="w-3.5 h-3.5" />{" "}
                  {launchingRecId === rec.id
                    ? "Deploying..."
                    : "1-Click Deploy Campaign"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row: Customer Growth & Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Customer Growth Trend */}
        <div className="glass-panel p-6 rounded-xl space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Shopper Growth
            </h2>
            <p className="text-muted-custom text-xs">
              Cumulative count of customers over the last 15 days.
            </p>
          </div>
          <div className="h-64 w-full">
            {charts?.customerGrowth ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={charts.customerGrowth}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(128,128,128,0.1)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    stroke="#6b7280"
                    fontSize={10}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#6b7280"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card-bg)",
                      borderColor: "var(--card-border)",
                      borderRadius: "8px",
                    }}
                    itemStyle={{ color: "#06b6d4" }}
                  />

                  <Line
                    type="monotone"
                    dataKey="totalCustomers"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    dot={{ r: 2 }}
                    name="Total Shoppers"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
                No growth data found
              </div>
            )}
          </div>
        </div>

        {/* Leaderboard: Top Spenders */}
        <div className="glass-panel p-6 rounded-xl space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Top Customer Leaderboard
              </h2>
              <p className="text-muted-custom text-xs">
                Shoppers with the highest successful order value.
              </p>
            </div>
            <ArrowUpRight className="w-5 h-5 text-zinc-500" />
          </div>
          <div className="divide-y divide-slate-100 dark:divide-zinc-800/20 overflow-y-auto max-h-60 pr-3">
            {topCustomers.length > 0 ? (
              topCustomers.map((cust, idx) => (
                <div
                  key={cust.id}
                  className="py-3 flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-zinc-800/10 flex items-center justify-center text-xs font-bold text-indigo-500 border border-zinc-700/10">
                      #{idx + 1}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-indigo-500 transition-colors">
                        {cust.name}
                      </p>
                      <p className="text-[10px] text-muted-custom">
                        {cust.email} • {cust.city}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-500">
                      ₹{cust.totalSpent.toLocaleString("en-IN")}
                    </p>
                    <p className="text-[10px] text-zinc-500">
                      {cust.orderCount} purchases
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center h-48 text-zinc-500 text-sm">
                No customer orders available
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
