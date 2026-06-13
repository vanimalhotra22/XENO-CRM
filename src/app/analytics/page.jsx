"use client";

import React, { useEffect, useState } from "react";
import cache from "@/lib/cache";
import { BarChart3, Sparkles, RefreshCw } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function AnalyticsPage() {
  const [campaigns, setCampaigns] = useState(cache.analytics || []);
  const [loading, setLoading] = useState(cache.analytics === null);

  const fetchCampaigns = async () => {
    try {
      const res = await fetch("/api/campaigns");
      const data = await res.json();
      if (data.success) {
        const activeCampaigns = data.campaigns.filter((c) => c.status !== "DRAFT");
        setCampaigns(activeCampaigns);
        cache.analytics = activeCampaigns;
      }
    } catch (e) {
      console.error("Error fetching analytics campaigns:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  // Compute Aggregates
  const totalSent = campaigns.reduce((sum, c) => sum + c.sentCount, 0);
  const totalDelivered = campaigns.reduce(
    (sum, c) => sum + c.deliveredCount,
    0,
  );
  const totalOpened = campaigns.reduce((sum, c) => sum + c.openedCount, 0);
  const totalClicked = campaigns.reduce((sum, c) => sum + c.clickedCount, 0);
  const totalRevenue = campaigns.reduce(
    (sum, c) => sum + c.revenueGenerated,
    0,
  );

  const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;
  const openRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0;
  const clickRate = totalSent > 0 ? (totalClicked / totalSent) * 100 : 0;
  const conversionRate =
    totalOpened > 0 ? (totalClicked / totalOpened) * 100 : 0;

  // Compute Channel Performance Data
  const channels = ["WHATSAPP", "EMAIL", "SMS"];
  const channelData = channels.map((ch) => {
    const chCamps = campaigns.filter((c) => c.channel === ch);
    const sent = chCamps.reduce((sum, c) => sum + c.sentCount, 0);
    const opened = chCamps.reduce((sum, c) => sum + c.openedCount, 0);
    const clicked = chCamps.reduce((sum, c) => sum + c.clickedCount, 0);
    const revenue = chCamps.reduce((sum, c) => sum + c.revenueGenerated, 0);

    const openRateVal = sent > 0 ? (opened / sent) * 100 : 0;
    const clickRateVal = sent > 0 ? (clicked / sent) * 100 : 0;

    return {
      name:
        ch.toLowerCase() === "whatsapp"
          ? "WhatsApp"
          : ch.toLowerCase() === "email"
            ? "Email"
            : "SMS",
      "Open Rate (%)": Math.round(openRateVal),
      "Click Rate (%)": Math.round(clickRateVal),
      Revenue: revenue,
    };
  });

  // Pie chart variables
  const COLORS = ["#10b981", "#3b82f6", "#f59e0b"];
  const pieData = channelData
    .map((d, idx) => ({
      name: d.name,
      value: d.Revenue,
      color: COLORS[idx],
    }))
    .filter((p) => p.value > 0);

  // Generate automated AI insights
  const generateInsights = () => {
    const insights = [];
    // Insight 1: Best Channel
    const bestChannel = [...channelData].sort(
      (a, b) => b.Revenue - a.Revenue,
    )[0];
    if (bestChannel && bestChannel.Revenue > 0) {
      insights.push({
        title: "Optimal Channel Performance",
        description: `${bestChannel.name} is your highest revenue generator, contributing ₹${bestChannel.Revenue.toLocaleString("en-IN")}. Focus marketing budgets here.`,
        type: "success",
      });
    }

    // Insight 2: Funnel Leak
    if (openRate > 0 && clickRate > 0) {
      const clickDrop = ((totalOpened - totalClicked) / totalOpened) * 100;
      if (clickDrop > 70) {
        insights.push({
          title: "Funnel Friction Point",
          description: `You have a strong open rate of ${Math.round(openRate)}%, but ${Math.round(clickDrop)}% of readers dropped off without clicking. Consider adding clearer Call-to-Actions (CTAs).`,
          type: "warning",
        });
      }
    }

    // Insight 3: Delivery Rate
    if (deliveryRate > 0 && deliveryRate < 90) {
      insights.push({
        title: "Deliverability Warning",
        description: `Your campaign delivery rate is ${Math.round(deliveryRate)}%. High failed dispatches suggest outdated shopper database numbers or emails.`,
        type: "error",
      });
    } else if (deliveryRate >= 90) {
      insights.push({
        title: "Excellent Deliverability",
        description: `Your campaign delivery rate is healthy at ${Math.round(deliveryRate)}%. Database hygiene and webhook channels are performing optimally.`,
        type: "success",
      });
    }

    return insights;
  };

  const insights = generateInsights();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            Campaign Analytics <BarChart3 className="w-8 h-8 text-indigo-500" />
          </h1>
          <p className="text-muted-custom text-xs mt-1 font-medium">
            Aggregated metrics, click funnels, channel comparisons, and
            automated insights.
          </p>
        </div>
        <button
          onClick={fetchCampaigns}
          className="p-2 bg-zinc-800/10 hover:bg-zinc-800/20 border border-zinc-800/10 text-muted-custom hover:text-foreground rounded-lg flex items-center gap-1.5 cursor-pointer text-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Analytics
        </button>
      </div>

      {/* KPI Funnel Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          {
            label: "Delivery Rate",
            value: `${Math.round(deliveryRate)}%`,
            desc: "Sent to Delivered",
          },
          {
            label: "Open Rate (Avg)",
            value: `${Math.round(openRate)}%`,
            desc: "Delivered to Opened",
            color: "text-purple-500",
          },
          {
            label: "Click-Through Rate (CTR)",
            value: `${Math.round(clickRate)}%`,
            desc: "Opened to Clicked",
            color: "text-teal-500",
          },
          {
            label: "Conversion Rate",
            value: `${Math.round(conversionRate)}%`,
            desc: "Clicked to Purchase",
            color: "text-emerald-500",
          },
        ].map((f, i) => (
          <div
            key={i}
            className="glass-panel p-5 rounded-xl space-y-1 relative overflow-hidden"
          >
            <span className="text-[10px] text-zinc-500 block uppercase font-bold tracking-wider">
              {f.label}
            </span>
            <h3
              className={`text-3xl font-black ${f.color || "text-slate-900 dark:text-white"}`}
            >
              {f.value}
            </h3>
            <span className="text-[10px] text-muted-custom block font-medium">
              {f.desc}
            </span>
          </div>
        ))}
      </div>

      {/* Customer Lifecycle Funnel */}
      <div className="glass-panel p-6 rounded-xl space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Customer Lifecycle Funnel
          </h2>
          <p className="text-muted-custom text-xs">
            Conversion funnel from total campaign dispatches down to attributed
            orders.
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-4 max-w-5xl mx-auto text-center font-bold text-xs select-none">
          {/* Step 1: Dispatched */}
          <div className="flex-1 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl space-y-1 relative w-full">
            <span className="text-[10px] text-indigo-400 uppercase tracking-widest block font-bold">
              1. Dispatched
            </span>
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {totalSent}
            </span>
            <span className="text-[10px] text-zinc-500 block">
              100% Audience
            </span>
          </div>

          <div className="text-zinc-600 font-extrabold text-xl md:rotate-0 rotate-90">
            ➔
          </div>

          {/* Step 2: Delivered */}
          <div className="flex-1 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl space-y-1 relative w-full">
            <span className="text-[10px] text-blue-400 uppercase tracking-widest block font-bold">
              2. Delivered
            </span>
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {totalDelivered}
            </span>
            <span className="text-[10.5px] text-zinc-500 block">
              {totalSent > 0
                ? Math.round((totalDelivered / totalSent) * 100)
                : 0}
              % delivery rate
            </span>
          </div>

          <div className="text-zinc-600 font-extrabold text-xl md:rotate-0 rotate-90">
            ➔
          </div>

          {/* Step 3: Opened */}
          <div className="flex-1 p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl space-y-1 relative w-full">
            <span className="text-[10px] text-purple-400 uppercase tracking-widest block font-bold">
              3. Opened
            </span>
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {totalOpened}
            </span>
            <span className="text-[10.5px] text-zinc-500 block">
              {totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0}%
              open rate
            </span>
          </div>

          <div className="text-zinc-600 font-extrabold text-xl md:rotate-0 rotate-90">
            ➔
          </div>

          {/* Step 4: Clicked */}
          <div className="flex-1 p-4 bg-teal-500/10 border border-teal-500/20 rounded-xl space-y-1 relative w-full">
            <span className="text-[10px] text-teal-400 uppercase tracking-widest block font-bold">
              4. Clicked
            </span>
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {totalClicked}
            </span>
            <span className="text-[10.5px] text-zinc-500 block">
              {totalSent > 0 ? Math.round((totalClicked / totalSent) * 100) : 0}
              % CTR
            </span>
          </div>

          <div className="text-zinc-600 font-extrabold text-xl md:rotate-0 rotate-90">
            ➔
          </div>

          {/* Step 5: Purchased */}
          <div className="flex-1 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-1 relative w-full">
            <span className="text-[10px] text-emerald-400 uppercase tracking-widest block font-bold">
              5. Purchased
            </span>
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {campaigns.filter((c) => c.revenueGenerated > 0).length}{" "}
              conversions
            </span>
            <span className="text-[10.5px] text-emerald-500 block font-extrabold">
              ₹{totalRevenue.toLocaleString("en-IN")} total sales
            </span>
          </div>
        </div>
      </div>

      {/* AI Insights Panel */}
      {insights.length > 0 && (
        <div className="glass-panel-glow p-6 rounded-xl space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
            <h2 className="text-md font-bold text-slate-900 dark:text-white">
              AI-Generated Campaign Insights
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {insights.map((ins, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-xl border space-y-2 ${
                  ins.type === "success"
                    ? "bg-emerald-500/5 border-emerald-500/15 text-emerald-500"
                    : ins.type === "warning"
                      ? "bg-amber-500/5 border-amber-500/15 text-amber-500"
                      : "bg-rose-500/5 border-rose-500/15 text-rose-500"
                }`}
              >
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white">
                  {ins.title}
                </h4>
                <p className="text-[11px] text-zinc-400 leading-relaxed font-semibold">
                  {ins.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts: Channel Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Engagement by Channel Bar Chart */}
        <div className="glass-panel p-6 rounded-xl lg:col-span-2 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Engagement Rate by Channel
            </h2>
            <p className="text-zinc-500 text-xs text-muted-custom">
              Comparing user open and click rates across email, SMS, and
              WhatsApp.
            </p>
          </div>
          <div className="h-80 w-full">
            {campaigns.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={channelData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(128,128,128,0.1)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
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
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="Open Rate (%)"
                    fill="#6366f1"
                    radius={[3, 3, 0, 0]}
                  />
                  <Bar
                    dataKey="Click Rate (%)"
                    fill="#06b6d4"
                    radius={[3, 3, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
                No campaign data available
              </div>
            )}
          </div>
        </div>

        {/* Revenue Attributed by Channel Pie Chart */}
        <div className="glass-panel p-6 rounded-xl space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Revenue Split
            </h2>
            <p className="text-zinc-500 text-xs text-muted-custom">
              Share of total purchase revenue generated by channel type.
            </p>
          </div>
          <div className="h-80 w-full flex flex-col items-center justify-center">
            {pieData.length > 0 ? (
              <div className="w-full h-full relative">
                <ResponsiveContainer width="100%" height="90%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) =>
                        `₹${Number(value).toLocaleString("en-IN")}`
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Custom Legend */}
                <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-6 text-xs">
                  {pieData.map((d, i) => (
                    <span
                      key={i}
                      className="flex items-center gap-1.5 text-muted-custom font-semibold"
                    >
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: d.color }}
                      />
                      {d.name}: ₹{d.value.toLocaleString("en-IN")}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-zinc-500 text-sm text-center text-muted-custom">
                No campaign conversions recorded
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Campaign Ledger Table */}
      <div className="glass-panel p-6 rounded-xl space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Campaign Execution Ledger
          </h2>
          <p className="text-zinc-500 text-xs">
            Audit reports of all sent campaigns and their absolute funnel
            metrics.
          </p>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : campaigns.length > 0 ? (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-800/10 font-bold text-muted-custom uppercase tracking-wider pb-3">
                  <th className="pb-3">Campaign</th>
                  <th className="pb-3 text-center">Channel</th>
                  <th className="pb-3 text-center">Sent</th>
                  <th className="pb-3 text-center">Delivered</th>
                  <th className="pb-3 text-center">Opened</th>
                  <th className="pb-3 text-center">Clicked</th>
                  <th className="pb-3 text-center">Failed</th>
                  <th className="pb-3 text-right">Revenue Generated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850/10 text-sm">
                {campaigns.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-zinc-800/5 transition-colors"
                  >
                    <td className="py-4">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white text-xs">
                          {c.name}
                        </p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">
                          Audience: {c.segment?.name}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 text-center text-[10px] font-semibold text-zinc-400">
                      {c.channel}
                    </td>
                    <td className="py-4 text-center font-bold text-slate-800 dark:text-zinc-300">
                      {c.sentCount}
                    </td>
                    <td className="py-4 text-center text-blue-500 font-bold">
                      {c.deliveredCount}{" "}
                      <span className="text-[10px] text-zinc-500 font-normal">
                        (
                        {c.sentCount > 0
                          ? Math.round((c.deliveredCount / c.sentCount) * 100)
                          : 0}
                        %)
                      </span>
                    </td>
                    <td className="py-4 text-center text-purple-500 font-bold">
                      {c.openedCount}{" "}
                      <span className="text-[10px] text-zinc-500 font-normal">
                        (
                        {c.sentCount > 0
                          ? Math.round((c.openedCount / c.sentCount) * 100)
                          : 0}
                        %)
                      </span>
                    </td>
                    <td className="py-4 text-center text-teal-500 font-bold">
                      {c.clickedCount}{" "}
                      <span className="text-[10px] text-zinc-500 font-normal">
                        (
                        {c.sentCount > 0
                          ? Math.round((c.clickedCount / c.sentCount) * 100)
                          : 0}
                        %)
                      </span>
                    </td>
                    <td className="py-4 text-center text-rose-500 font-bold">
                      {c.failedCount}
                    </td>
                    <td className="py-4 text-right font-extrabold text-emerald-500">
                      ₹{c.revenueGenerated.toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-center text-zinc-500">
              <p className="text-sm font-semibold">
                No campaign statistics available
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
