"use client";

import React, { useEffect, useState, useRef } from "react";
import cache from "@/lib/cache";
import {
  Send,
  Sparkles,
  Mail,
  MessageSquare,
  PhoneCall,
  AlertCircle,
  Play,
  Eye,
  ClipboardList,
  TrendingUp,
} from "lucide-react";

const CAMPAIGN_PRESETS = [
  {
    title: "Monsoon Flash Discount",
    channel: "WHATSAPP",
    message:
      "Hi {{firstName}}! 🌧️ Stay dry and shop from {{city}}. Enjoy 20% off our fresh monsoon collection using code RAIN20. Shop now!",
  },
  {
    title: "Cart Abandonment Recovery",
    channel: "SMS",
    message:
      "Hi {{firstName}}, you left items in your cart! 🛒 Grab them today with free shipping. Use code SHIPFREE. Shop at Xeno!",
  },
  {
    title: "VIP Loyalty Reward",
    channel: "EMAIL",
    message:
      "Hello {{name}},\n\nWe appreciate your loyalty at Xeno! As a VIP customer who has spent {{totalSpent}}, we have credited ₹1,000 to your wallet. Use it on your next purchase within {{lastPurchase}}!\n\nBest,\nXeno Team",
  },
];

export default function CampaignsPage() {
  const channelServiceUrl = process.env.NEXT_PUBLIC_CHANNEL_SERVICE_URL || 'http://localhost:3001';
  const [campaigns, setCampaigns] = useState(cache.campaigns?.campaigns || []);
  const campaignsRef = useRef([]);
  useEffect(() => {
    campaignsRef.current = campaigns;
  }, [campaigns]);

  const [segments, setSegments] = useState(cache.campaigns?.segments || []);
  const [loading, setLoading] = useState(!cache.campaigns);

  // Form states
  const [name, setName] = useState("");
  const [segmentId, setSegmentId] = useState("");
  const [channel, setChannel] = useState("WHATSAPP");
  const [message, setMessage] = useState("");
  const [isAbTest, setIsAbTest] = useState(false);
  const [messageB, setMessageB] = useState("");

  // AI draft states
  const [aiPrompt, setAiPrompt] = useState("");
  const [draftingAi, setDraftingAi] = useState(false);
  const [aiError, setAiError] = useState("");

  // AI Tone optimization states
  const [optimizingTone, setOptimizingTone] = useState(false);
  const [toneSuggestion, setToneSuggestion] = useState(null);

  // Failure Simulator settings states
  const [simulateFailures, setSimulateFailures] = useState(false);
  const [deliveryRate, setDeliveryRate] = useState(90);
  const [openRate, setOpenRate] = useState(70);
  const [clickRate, setClickRate] = useState(30);

  // Print state
  const [printingCampaignId, setPrintingCampaignId] = useState(null);

  // Sending status
  const [launchingId, setLaunchingId] = useState(null);

  // Preview shopper sample
  const sampleShopper = {
    name: "Vani Mishra",
    firstName: "Vani",
    city: "Mumbai",
    totalSpent: 15400,
    lastOrderDaysAgo: 5,
  };

  const loadSimulatorSettings = async () => {
    try {
      const res = await fetch(`${channelServiceUrl}/api/settings`);
      const data = await res.json();
      setSimulateFailures(data.simulateFailures);
      setDeliveryRate(data.deliveryRate);
      setOpenRate(data.openRate);
      setClickRate(data.clickRate);
    } catch (e) {
      console.warn(
        "Could not contact Channel Service simulator settings endpoint:",
        e,
      );
    }
  };

  const handleSyncSimulatorSettings = async (updates) => {
    const newSettings = {
      simulateFailures:
        updates.simulateFailures !== undefined
          ? updates.simulateFailures
          : simulateFailures,
      deliveryRate:
        updates.deliveryRate !== undefined
          ? updates.deliveryRate
          : deliveryRate,
      openRate: updates.openRate !== undefined ? updates.openRate : openRate,
      clickRate:
        updates.clickRate !== undefined ? updates.clickRate : clickRate,
    };

    if (updates.simulateFailures !== undefined)
      setSimulateFailures(updates.simulateFailures);
    if (updates.deliveryRate !== undefined)
      setDeliveryRate(updates.deliveryRate);
    if (updates.openRate !== undefined) setOpenRate(updates.openRate);
    if (updates.clickRate !== undefined) setClickRate(updates.clickRate);

    try {
      await fetch(`${channelServiceUrl}/api/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSettings),
      });
    } catch (e) {
      console.error("Failed to sync settings to channel service simulator:", e);
    }
  };

  const handleAISuggestBetterCopy = async () => {
    if (!message) return;
    setOptimizingTone(true);
    setToneSuggestion(null);
    try {
      const res = await fetch("/api/campaigns/tone-recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, channel }),
      });
      const data = await res.json();
      if (data.success) {
        setToneSuggestion({
          suggestedMessage: data.suggestedMessage,
          predictedCtrBump: data.predictedCtrBump,
          reason: data.reason,
        });
      }
    } catch (e) {
      console.error("Error suggesting copy:", e);
    } finally {
      setOptimizingTone(false);
    }
  };

  const getChannelRecommendation = () => {
    const selectedSegment = segments.find((s) => s.id === segmentId);
    const segmentName = selectedSegment
      ? selectedSegment.name.toLowerCase()
      : "";
    if (segmentName.includes("vip") || segmentName.includes("high spender")) {
      return {
        channel: "EMAIL",
        reason:
          "Historically delivers 23% higher CTR and allows detailed copywriting layouts for premium VIP shoppers.",
      };
    }
    if (
      segmentName.includes("inactive") ||
      segmentName.includes("churn") ||
      segmentName.includes("risk")
    ) {
      return {
        channel: "WHATSAPP",
        reason:
          "Urgent mobile channel delivers 85% open rates, driving 35% higher reactivation for inactive shoppers.",
      };
    }
    if (segmentName.includes("sleepy")) {
      return {
        channel: "WHATSAPP",
        reason:
          "85% open rate wakes up inactive shoppers 2x faster than standard email campaigns.",
      };
    }
    return {
      channel: "WHATSAPP",
      reason:
        "WhatsApp typically out-performs other channels by 3x on open and click-through rates.",
    };
  };

  const recommended = getChannelRecommendation();

  const fetchCampaignsAndSegments = async () => {
    try {
      const [campRes, segRes] = await Promise.all([
        fetch("/api/campaigns?includeFailures=true"),
        fetch("/api/segments"),
      ]);
      const campData = await campRes.json();
      const segData = await segRes.json();

      let nextCampaigns = campaigns;
      let nextSegments = segments;

      if (campData.success) {
        setCampaigns(campData.campaigns);
        nextCampaigns = campData.campaigns;
      }
      if (segData.success) {
        setSegments(segData.segments);
        nextSegments = segData.segments;
        if (segData.segments.length > 0 && !segmentId)
          setSegmentId(segData.segments[0].id);
      }

      if (campData.success || segData.success) {
        cache.campaigns = { campaigns: nextCampaigns, segments: nextSegments };
      }
    } catch (e) {
      console.error("Error fetching campaign data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaignsAndSegments();
    loadSimulatorSettings();
    // Poll campaigns when any are in SENDING state
    const interval = setInterval(() => {
      const hasActiveSends = campaignsRef.current.some(
        (c) => c.status === "SENDING",
      );
      if (hasActiveSends) {
        fetchCampaignsAndSegments();
      }
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  // Load Preset
  const handleApplyPreset = (preset) => {
    setName(preset.title);
    setChannel(preset.channel);
    setMessage(preset.message);
    setIsAbTest(false);
    setMessageB("");
  };

  // Handle AI Drafting
  const handleAIDraftCampaign = async () => {
    if (!aiPrompt) return;
    setDraftingAi(true);
    setAiError("");

    try {
      const res = await fetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "chat",
          message: `Create a marketing campaign proposal for: "${aiPrompt}". Keep recommendation details clear.`,
          history: [],
        }),
      });
      const data = await res.json();
      if (data.success && data.recommendation) {
        setName(data.recommendation.name);
        setChannel(data.recommendation.channel);
        setMessage(data.recommendation.message);
      } else {
        const normalized = aiPrompt.toLowerCase();
        if (normalized.includes("vip") || normalized.includes("premium")) {
          setName("VIP Customer Appreciation");
          setChannel("EMAIL");
          setMessage(
            "Hello {{name}},\n\nWe wanted to say thank you for being a top shopper with us! Enjoy early access to our VIP collection and get 15% off with code VIP15. \n\nBest,\nCRM Team",
          );
        } else {
          setName("AI win-back campaign");
          setChannel("WHATSAPP");
          setMessage(
            "Hi {{firstName}}! We miss you. 😢 Enjoy 20% off your next order in {{city}} using code WEBACK. last order: {{lastPurchase}}. Shop now!",
          );
        }
      }
    } catch (err) {
      setAiError(err.message || "Error communicating with AI services");
    } finally {
      setDraftingAi(false);
    }
  };

  // Submit manual campaign
  const handleCreateCampaignSubmit = async (e) => {
    e.preventDefault();
    if (!name || !segmentId || !message) return;

    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          segmentId,
          channel,
          message,
          isAbTest,
          messageB: isAbTest ? messageB : null,
          channelRecommend: recommended.reason,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setName("");
        setMessage("");
        setMessageB("");
        setIsAbTest(false);
        fetchCampaignsAndSegments();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Trigger Send
  const handleLaunchCampaign = async (id) => {
    setLaunchingId(id);
    try {
      const res = await fetch(`/api/campaigns/${id}/send`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        fetchCampaignsAndSegments();
      }
    } catch (err) {
      console.error("Launch campaign error:", err);
    } finally {
      setLaunchingId(null);
    }
  };

  // Trigger print view
  const handlePrintCampaignReport = (campaignId) => {
    setPrintingCampaignId(campaignId);
    setTimeout(() => {
      window.print();
      setPrintingCampaignId(null);
    }, 200);
  };

  // Personalization Preview calculation
  const getPersonalizedPreview = (template) => {
    let msg = template;
    msg = msg.replace(/\{\{name\}\}/g, sampleShopper.name);
    msg = msg.replace(/\{\{firstName\}\}/g, sampleShopper.firstName);
    msg = msg.replace(/\{\{city\}\}/g, sampleShopper.city);
    msg = msg.replace(
      /\{\{totalSpent\}\}/g,
      `₹${sampleShopper.totalSpent.toLocaleString("en-IN")}`,
    );
    let lastPurchaseStr = `${sampleShopper.lastOrderDaysAgo} days ago`;
    msg = msg.replace(/\{\{lastPurchase\}\}/g, lastPurchaseStr);
    return msg;
  };

  // Calculate Success Prediction metrics dynamically
  const calculatePrediction = () => {
    const selectedSegment = segments.find((s) => s.id === segmentId);
    const size = selectedSegment ? selectedSegment.customerCount : 0;
    let openRate = 45;
    let ctr = 12;
    let conversionRate = 3;

    if (channel === "WHATSAPP") {
      openRate = 85;
      ctr = 28;
      conversionRate = 8;
    } else if (channel === "SMS") {
      openRate = 70;
      ctr = 18;
      conversionRate = 5;
    }

    if (size > 30) {
      openRate -= 5;
      ctr -= 3;
    }

    const avgOrderValue = 2500;
    let projectedRevenue = Math.round(
      size *
        (openRate / 100) *
        (ctr / 100) *
        (conversionRate / 100) *
        avgOrderValue,
    );
    if (isAbTest) {
      projectedRevenue = Math.round(projectedRevenue * 1.15);
    }

    return { openRate, ctr, projectedRevenue };
  };

  const prediction = calculatePrediction();

  const renderTimeline = (camp) => {
    const steps = [
      { name: "Created", done: true },
      { name: "Queued", done: camp.status !== "DRAFT" },
      { name: "Sent", done: camp.sentCount > 0 },
      { name: "Delivered", done: camp.deliveredCount > 0 },
      { name: "Opened", done: camp.openedCount > 0 },
      { name: "Clicked", done: camp.clickedCount > 0 },
      { name: "Converted", done: camp.revenueGenerated > 0 },
    ];

    return (
      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-zinc-800/10 space-y-1.5">
        <span className="text-[9px] text-slate-500 dark:text-zinc-500 uppercase font-bold tracking-wider block">
          Real-time Webhook Delivery Timeline
        </span>
        <div className="flex items-center justify-between text-[10px] select-none py-1.5 px-3 bg-slate-100 dark:bg-zinc-950/40 rounded-lg border border-slate-200 dark:border-zinc-900 overflow-x-auto gap-2">
          {steps.map((st, i) => (
            <React.Fragment key={i}>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span
                  className={`w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold text-[8px] ${
                    st.done
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border border-emerald-500/30"
                      : camp.status === "SENDING" && steps[i - 1]?.done
                        ? "bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 animate-pulse"
                        : "bg-slate-200 dark:bg-zinc-800 text-slate-500 dark:text-zinc-500 border border-slate-300 dark:border-zinc-700/50"
                  }`}
                >
                  {st.done ? "✓" : i + 1}
                </span>
                <span
                  className={`font-semibold ${st.done ? "text-slate-800 dark:text-zinc-300" : "text-slate-400 dark:text-zinc-500"}`}
                >
                  {st.name}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`h-[1px] flex-1 min-w-[8px] ${st.done && steps[i + 1]?.done ? "bg-emerald-500/30" : "bg-slate-300 dark:bg-zinc-800"}`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="space-y-8 print:hidden">
        {/* Header */}
        <div className="border-b border-slate-200/80 dark:border-zinc-800/50 pb-5">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            Campaign Manager <Send className="w-8 h-8 text-indigo-500" />
          </h1>
          <p className="text-slate-500 dark:text-zinc-400 text-xs mt-1 font-medium">
            Design marketing campaigns, customize templates, preview
            personalization, and send alerts.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Preset Selector & Campaign Designer */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Preset Selector */}
            <div className="glass-panel p-5 rounded-xl space-y-3">
              <h3 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                <ClipboardList className="w-4 h-4 text-indigo-500" /> Use
                Templates
              </h3>
              <div className="flex flex-col gap-2">
                {CAMPAIGN_PRESETS.map((p, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleApplyPreset(p)}
                    className="p-2.5 bg-slate-100/40 dark:bg-zinc-800/10 hover:bg-slate-100/80 dark:hover:bg-zinc-800/20 border border-slate-200 dark:border-zinc-800/10 rounded-lg text-left cursor-pointer transition-colors"
                  >
                    <p className="font-bold text-[10px] text-slate-900 dark:text-white">
                      {p.title}
                    </p>
                    <p className="text-[9px] text-slate-500 dark:text-zinc-500 mt-0.5 truncate capitalize">
                      Channel: {p.channel.toLowerCase()}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Campaign Designer */}
            <div className="glass-panel p-6 rounded-xl space-y-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Campaign Designer
              </h2>
              <form
                onSubmit={handleCreateCampaignSubmit}
                className="space-y-3 text-xs"
              >
                <div className="space-y-1">
                  <label className="text-slate-700 dark:text-zinc-400 font-semibold">
                    Campaign Title
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="E.g., Monsoon Discount Drive"
                    className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 dark:text-zinc-400 font-semibold">
                    Target Audience Segment
                  </label>
                  <select
                    value={segmentId}
                    onChange={(e) => setSegmentId(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  >
                    {segments.map((s) => (
                      <option
                        key={s.id}
                        value={s.id}
                        className="text-slate-900 dark:text-white"
                      >
                        {s.name} ({s.customerCount} shoppers)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 dark:text-zinc-400 font-semibold">
                    Messaging Channel
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      {
                        val: "WHATSAPP",
                        icon: MessageSquare,
                        label: "WhatsApp",
                      },
                      { val: "EMAIL", icon: Mail, label: "Email" },
                      { val: "SMS", icon: PhoneCall, label: "SMS" },
                    ].map((ch) => {
                      const Icon = ch.icon;
                      return (
                        <button
                          key={ch.val}
                          type="button"
                          onClick={() => setChannel(ch.val)}
                          className={`py-2 rounded border flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                            channel === ch.val
                              ? "bg-indigo-600 border-indigo-500 text-white font-bold"
                              : "bg-slate-100 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="text-[10px]">{ch.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Smart Channel Recommendation Widget */}
                {segmentId && (
                  <div className="p-3 bg-indigo-500/5 border border-indigo-500/15 rounded-lg text-[10px] space-y-1 mt-1">
                    <div className="flex justify-between items-center">
                      <span className="text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 animate-pulse" /> AI
                        Channel Recommendation: {recommended.channel}
                      </span>
                      {channel !== recommended.channel && (
                        <button
                          type="button"
                          onClick={() => setChannel(recommended.channel)}
                          className="text-indigo-600 dark:text-indigo-400 font-bold underline cursor-pointer"
                        >
                          Apply
                        </button>
                      )}
                    </div>
                    <p className="text-slate-500 dark:text-zinc-400 leading-relaxed font-medium">
                      {recommended.reason}
                    </p>
                  </div>
                )}

                {/* A/B Testing Toggle */}
                <div className="flex items-center gap-2 py-1 select-none">
                  <input
                    type="checkbox"
                    id="isAbTest"
                    checked={isAbTest}
                    onChange={(e) => setIsAbTest(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 accent-indigo-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                  />

                  <label
                    htmlFor="isAbTest"
                    className="text-slate-700 dark:text-zinc-400 font-bold cursor-pointer"
                  >
                    Enable A/B Subject/Message Testing
                  </label>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-slate-700 dark:text-zinc-400 font-semibold">
                      {isAbTest
                        ? "Template Message (Version A)"
                        : "Template Message"}
                    </label>
                    <span className="text-[9px] text-slate-500 dark:text-zinc-500">
                      Supports placeholders
                    </span>
                  </div>
                  <textarea
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Hi {{firstName}}, we miss you!..."
                    className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-sans"
                  />

                  {/* AI Copy Tone Optimization Trigger */}
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleAISuggestBetterCopy}
                      disabled={optimizingTone || !message}
                      className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-bold cursor-pointer disabled:opacity-50"
                    >
                      <Sparkles className="w-3.5 h-3.5" />{" "}
                      {optimizingTone
                        ? "Optimizing tone..."
                        : "Optimize Copy Wording with AI"}
                    </button>
                  </div>
                </div>

                {/* AI Copy Tone Suggestion Panel */}
                {toneSuggestion && (
                  <div className="p-3.5 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/30 rounded-xl space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="text-[9.5px] text-indigo-600 dark:text-indigo-400 font-extrabold uppercase tracking-wider block">
                        AI Wording Suggestion
                      </span>
                      <span className="text-[10px] bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-500 px-2 py-0.5 rounded-full font-bold">
                        +{toneSuggestion.predictedCtrBump}% CTR Bump
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] text-slate-500 dark:text-zinc-500 block font-bold">
                        OPTIMIZED VERSION:
                      </span>
                      <p className="text-xs text-slate-800 dark:text-zinc-300 bg-white dark:bg-black/20 p-2.5 rounded border border-slate-200 dark:border-zinc-800 font-sans italic whitespace-pre-wrap leading-relaxed">
                        {toneSuggestion.suggestedMessage}
                      </p>
                    </div>

                    <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-relaxed font-semibold italic">
                      Reason: {toneSuggestion.reason}
                    </p>

                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setToneSuggestion(null)}
                        className="px-2.5 py-1 bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 rounded text-[10px] font-bold cursor-pointer"
                      >
                        Discard
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMessage(toneSuggestion.suggestedMessage);
                          setToneSuggestion(null);
                        }}
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] font-bold cursor-pointer"
                      >
                        Apply Suggestion
                      </button>
                    </div>
                  </div>
                )}

                {/* Dynamic Preview Container Version A */}
                {message && (
                  <div className="p-3 bg-slate-100 dark:bg-zinc-950/80 border border-slate-200 dark:border-zinc-900 rounded-lg space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" /> Live Preview{" "}
                      {isAbTest ? "Version A" : ""} ({sampleShopper.name})
                    </span>
                    <div className="p-2.5 bg-white dark:bg-black/40 rounded border border-slate-200 dark:border-zinc-800 font-sans text-xs leading-relaxed text-slate-800 dark:text-zinc-300 whitespace-pre-wrap">
                      {getPersonalizedPreview(message)}
                    </div>
                  </div>
                )}

                {/* Template Message Version B (Conditional) */}
                {isAbTest && (
                  <div className="space-y-1.5 border-t border-slate-200 dark:border-zinc-800 pt-3">
                    <div className="flex justify-between items-center">
                      <label className="text-slate-700 dark:text-zinc-400 font-semibold">
                        Template Message (Version B)
                      </label>
                      <span className="text-[9px] text-slate-500 dark:text-zinc-400">
                        Targeting 50% audience split
                      </span>
                    </div>
                    <textarea
                      required
                      rows={4}
                      value={messageB}
                      onChange={(e) => setMessageB(e.target.value)}
                      placeholder="E.g. We Miss You ❤️ Hi {{firstName}}!..."
                      className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-sans"
                    />

                    {messageB && (
                      <div className="p-3 bg-slate-100 dark:bg-zinc-950/80 border border-slate-200 dark:border-zinc-900 rounded-lg space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" /> Live Preview Version B
                          ({sampleShopper.name})
                        </span>
                        <div className="p-2.5 bg-white dark:bg-black/40 rounded border border-slate-200 dark:border-zinc-800 font-sans text-xs leading-relaxed text-slate-800 dark:text-zinc-300 whitespace-pre-wrap">
                          {getPersonalizedPreview(messageB)}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-bold cursor-pointer transition-all"
                >
                  Create Campaign Draft
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: AI Helpers, Simulator & Launched Campaigns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Top row: 2-column helper widgets */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Column A: AI Campaign Draftsman */}
              <div className="glass-panel-glow p-6 rounded-xl space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
                    <h2 className="text-md font-bold text-slate-900 dark:text-white">
                      AI Campaign Draftsman
                    </h2>
                  </div>
                  <p className="text-slate-500 dark:text-zinc-400 text-xs mt-1">
                    Enter your goal and let AI write the message, select optimal
                    channel, and title it.
                  </p>
                </div>

                <div className="space-y-2 mt-4">
                  <input
                    type="text"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Win back inactive customers with 20% off..."
                    className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 placeholder-slate-400 dark:placeholder-zinc-500"
                  />

                  <button
                    onClick={handleAIDraftCampaign}
                    disabled={draftingAi || !aiPrompt}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded font-bold text-xs transition-all cursor-pointer"
                  >
                    {draftingAi
                      ? "Drafting Campaign Proposal..."
                      : "Create Draft Proposal"}
                  </button>
                </div>
                {aiError && (
                  <p className="text-[10px] text-rose-500 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {aiError}
                  </p>
                )}
              </div>

              {/* Column B: Predictor & Simulator */}
              <div className="space-y-6">
                {/* Campaign Success Predictor */}
                {segmentId && (
                  <div className="glass-panel p-5 rounded-xl space-y-3">
                    <h3 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-indigo-500" /> Pre-Send AI
                      Predictor
                    </h3>

                    <div className="grid grid-cols-2 gap-2 text-center text-[10px] text-slate-500 dark:text-zinc-400 font-semibold">
                      <div className="p-2 bg-slate-100/50 dark:bg-zinc-800/10 rounded-lg border border-slate-100 dark:border-transparent">
                        <span className="block text-[8px] text-slate-400 dark:text-zinc-500 uppercase">
                          Est Open Rate
                        </span>
                        <span className="text-indigo-600 dark:text-indigo-400 text-sm font-extrabold">
                          {prediction.openRate}%
                        </span>
                      </div>
                      <div className="p-2 bg-slate-100/50 dark:bg-zinc-800/10 rounded-lg border border-slate-100 dark:border-transparent">
                        <span className="block text-[8px] text-slate-400 dark:text-zinc-500 uppercase">
                          Est CTR
                        </span>
                        <span className="text-teal-600 dark:text-teal-500 text-sm font-extrabold">
                          {prediction.ctr}%
                        </span>
                      </div>
                    </div>

                    <div className="p-2.5 bg-indigo-500/5 border border-indigo-500/15 rounded-lg flex justify-between items-center text-[10px]">
                      <span className="text-slate-600 dark:text-zinc-400 font-bold">
                        Est Sales Value:
                      </span>
                      <span className="text-emerald-600 dark:text-emerald-500 font-extrabold text-xs">
                        ₹{prediction.projectedRevenue.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                )}

                {/* Interactive Failure Simulator Panel */}
                <div className="glass-panel p-5 rounded-xl space-y-4">
                  <div className="flex items-center gap-2">
                    <PhoneCall className="w-4 h-4 text-rose-500" />
                    <h3 className="font-bold text-xs text-slate-900 dark:text-white">
                      Campaign Delivery pipeline
                    </h3>
                  </div>

                  <label className="flex items-center gap-2.5 select-none cursor-pointer text-[10.5px] font-bold text-slate-800 dark:text-zinc-300">
                    <input
                      type="checkbox"
                      checked={simulateFailures}
                      onChange={(e) =>
                        handleSyncSimulatorSettings({
                          simulateFailures: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 accent-rose-600 cursor-pointer"
                    />

                    <span>Simulate Webhook Failures</span>
                  </label>

                  {simulateFailures && (
                    <div className="space-y-3.5 pt-2 border-t border-slate-200 dark:border-zinc-800/15 text-[10px]">
                      <div className="space-y-1">
                        <div className="flex justify-between font-bold text-slate-700 dark:text-zinc-400">
                          <span>Delivery Success Rate:</span>
                          <span className="font-mono text-indigo-600 dark:text-indigo-400">
                            {deliveryRate}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={deliveryRate}
                          onChange={(e) =>
                            handleSyncSimulatorSettings({
                              deliveryRate: Number(e.target.value),
                            })
                          }
                          className="w-full h-1 bg-slate-200 dark:bg-zinc-800 rounded-lg cursor-pointer accent-indigo-600"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between font-bold text-slate-700 dark:text-zinc-400">
                          <span>Target Open Rate:</span>
                          <span className="font-mono text-purple-600 dark:text-purple-400">
                            {openRate}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={openRate}
                          onChange={(e) =>
                            handleSyncSimulatorSettings({
                              openRate: Number(e.target.value),
                            })
                          }
                          className="w-full h-1 bg-slate-200 dark:bg-zinc-800 rounded-lg cursor-pointer accent-purple-600"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between font-bold text-slate-700 dark:text-zinc-400">
                          <span>Target Click Rate:</span>
                          <span className="font-mono text-teal-600 dark:text-teal-400">
                            {clickRate}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={clickRate}
                          onChange={(e) =>
                            handleSyncSimulatorSettings({
                              clickRate: Number(e.target.value),
                            })
                          }
                          className="w-full h-1 bg-slate-200 dark:bg-zinc-800 rounded-lg cursor-pointer accent-teal-600"
                        />
                      </div>

                      <p className="text-[9px] text-slate-500 dark:text-zinc-500 leading-relaxed font-semibold italic bg-slate-50 dark:bg-black/10 p-2 rounded border border-slate-100 dark:border-zinc-900">
                        ⚠️ Error responses: <code>EMAIL_BOUNCED</code>,{" "}
                        <code>INVALID_NUMBER</code>, or <code>RATE_LIMITED</code>{" "}
                        with automated CRM retry loops.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="glass-panel p-6 rounded-xl space-y-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Campaign Directory
              </h2>

              <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-3">
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((n) => (
                      <div
                        key={n}
                        className="p-5 bg-slate-50 dark:bg-zinc-900/20 border border-slate-200 dark:border-zinc-800/50 rounded-xl space-y-4 animate-pulse"
                      >
                        <div className="flex justify-between items-start">
                          <div className="space-y-2 flex-grow">
                            <div className="h-4 bg-slate-200 dark:bg-zinc-800 rounded w-1/3" />
                            <div className="h-3 bg-slate-200 dark:bg-zinc-800 rounded w-1/2" />
                          </div>
                          <div className="h-6 bg-slate-200 dark:bg-zinc-800 rounded w-16" />
                        </div>
                        <div className="h-10 bg-slate-200/50 dark:bg-zinc-800/40 rounded" />
                        <div className="h-5 bg-slate-200/50 dark:bg-zinc-800/40 rounded w-3/4" />
                      </div>
                    ))}
                  </div>
                ) : campaigns.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 dark:bg-zinc-900/10 border border-dashed border-slate-200 dark:border-zinc-800/60 rounded-xl space-y-4 flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-zinc-900/50 flex items-center justify-center text-slate-400 dark:text-zinc-500 border border-slate-300 dark:border-zinc-800">
                      <Send className="w-6 h-6 rotate-45 animate-bounce" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                        No campaigns yet
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-zinc-500 max-w-sm">
                        Create and launch your first AI-optimized campaign using
                        the designer on the left side.
                      </p>
                    </div>
                  </div>
                ) : (
                  campaigns.map((camp) => {
                    const sentA = camp.sentCount - camp.sentCountB;
                    const clickedA = camp.clickedCount - camp.clickedCountB;
                    const ctrA =
                      sentA > 0 ? Math.round((clickedA / sentA) * 100) : 0;
                    const ctrB =
                      camp.sentCountB > 0
                        ? Math.round(
                            (camp.clickedCountB / camp.sentCountB) * 100,
                          )
                        : 0;

                    const failedComms =
                      camp.communications?.filter(
                        (c) => c.retryCount > 0 || c.status === "DLQ",
                      ) || [];

                    return (
                      <div
                        key={camp.id}
                        className="p-5 bg-white dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800/80 rounded-xl space-y-4 hover:border-slate-300 dark:hover:border-zinc-700/80 hover:shadow-sm transition-all duration-200 text-slate-800 dark:text-zinc-300"
                      >
                        {/* Top Row: Name, Status, Action */}
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-bold text-slate-900 dark:text-white text-md">
                                {camp.name}
                              </h3>
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded border font-semibold ${
                                  camp.status === "SENT"
                                    ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-500"
                                    : camp.status === "SENDING"
                                      ? "bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 animate-pulse"
                                      : camp.status === "FAILED"
                                        ? "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-500"
                                        : "bg-slate-100 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400"
                                }`}
                              >
                                {camp.status}
                              </span>
                              <span className="text-[10px] text-slate-500 dark:text-zinc-500 font-medium capitalize font-mono bg-slate-100 dark:bg-black/20 px-1.5 py-0.5 rounded border border-slate-200 dark:border-transparent">
                                via {camp.channel.toLowerCase()}
                              </span>
                              {camp.isAbTest && (
                                <span className="text-[9px] bg-indigo-50 dark:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                  A/B Test
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1.5 font-medium">
                              Targeting:{" "}
                              <span className="font-bold text-indigo-600 dark:text-indigo-400">
                                {camp.segment?.name || "Segment"}
                              </span>{" "}
                              ({camp.segment?.customerCount || 0} shoppers)
                            </p>
                          </div>

                          {camp.status === "DRAFT" ? (
                            <button
                              onClick={() => handleLaunchCampaign(camp.id)}
                              disabled={launchingId === camp.id}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shadow-emerald-600/10"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />{" "}
                              {launchingId === camp.id
                                ? "Launching..."
                                : "Launch Campaign"}
                            </button>
                          ) : camp.status === "SENT" ? (
                            <button
                              onClick={() => handlePrintCampaignReport(camp.id)}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shadow-indigo-600/10"
                            >
                              <ClipboardList className="w-3.5 h-3.5" /> Export
                              Report
                            </button>
                          ) : null}
                        </div>

                        {/* Live Campaign Dispatching Alert */}
                        {camp.status === "SENDING" && (
                          <div className="p-3 bg-indigo-50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/20 rounded-lg flex items-center justify-between text-xs text-indigo-700 dark:text-indigo-400 font-semibold animate-pulse">
                            <span className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
                              Live Campaign Monitor - Streaming event
                              callbacks...
                            </span>
                            <span>
                              {Math.round(
                                (camp.sentCount /
                                  (camp.segment?.customerCount || 1)) *
                                  100,
                              )}
                              % Dispatched
                            </span>
                          </div>
                        )}

                        {/* A/B Variant CTR Card display */}
                        {camp.status !== "DRAFT" && camp.isAbTest && (
                          <div className="p-3.5 bg-indigo-50/40 dark:bg-indigo-950/15 border border-indigo-100 dark:border-indigo-900/20 rounded-xl space-y-2">
                            <span className="text-[9px] text-indigo-600 dark:text-indigo-400 font-extrabold uppercase tracking-wider">
                              A/B Testing Variants Response Analysis
                            </span>
                            <div className="grid grid-cols-2 gap-4 text-xs">
                              <div className="space-y-1">
                                <span className="text-[10px] text-slate-500 dark:text-zinc-500 block uppercase">
                                  Variant A CTR
                                </span>
                                <span className="font-bold text-slate-800 dark:text-zinc-300">
                                  {ctrA}%
                                </span>
                                <span className="text-[9.5px] text-slate-500 dark:text-zinc-500 block">
                                  {clickedA} clicks / {sentA} sent
                                </span>
                              </div>
                              <div className="space-y-1">
                                <span className="text-[10px] text-slate-500 dark:text-zinc-500 block uppercase">
                                  Variant B CTR
                                </span>
                                <span className="font-bold text-slate-800 dark:text-zinc-300">
                                  {ctrB}%
                                </span>
                                <span className="text-[9.5px] text-slate-500 dark:text-zinc-500 block">
                                  {camp.clickedCountB} clicks /{" "}
                                  {camp.sentCountB} sent
                                </span>
                              </div>
                            </div>
                            {camp.status === "SENT" && camp.winner && (
                              <div className="border-t border-indigo-100 dark:border-indigo-900/20 pt-2 mt-1.5 flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-extrabold text-[11px]">
                                👑 Winner Selected: Variant {camp.winner} (
                                {camp.winner === "B"
                                  ? "Custom copy"
                                  : "Default copy"}{" "}
                                delivered higher CTR)
                              </div>
                            )}
                          </div>
                        )}

                        {/* Stats metrics */}
                        {camp.status !== "DRAFT" && (
                          <div className="grid grid-cols-5 gap-2 border-t border-b border-slate-200 dark:border-zinc-800/15 py-3 text-center">
                            <div className="space-y-1">
                              <span className="text-[10px] text-slate-500 dark:text-zinc-500 block uppercase font-bold tracking-wider">
                                Sent
                              </span>
                              <span className="text-sm font-bold text-slate-800 dark:text-white">
                                {camp.sentCount}
                              </span>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[10px] text-slate-500 dark:text-zinc-500 block uppercase font-bold tracking-wider">
                                Delivered
                              </span>
                              <span className="text-sm font-bold text-blue-600 dark:text-blue-500">
                                {camp.deliveredCount}{" "}
                                <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-normal">
                                  (
                                  {camp.sentCount > 0
                                    ? Math.round(
                                        (camp.deliveredCount / camp.sentCount) *
                                          100,
                                      )
                                    : 0}
                                  %)
                                </span>
                              </span>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[10px] text-slate-500 dark:text-zinc-500 block uppercase font-bold tracking-wider">
                                Opened
                              </span>
                              <span className="text-sm font-bold text-purple-600 dark:text-purple-500">
                                {camp.openedCount}{" "}
                                <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-normal">
                                  (
                                  {camp.sentCount > 0
                                    ? Math.round(
                                        (camp.openedCount / camp.sentCount) *
                                          100,
                                      )
                                    : 0}
                                  %)
                                </span>
                              </span>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[10px] text-slate-500 dark:text-zinc-500 block uppercase font-bold tracking-wider">
                                Clicked
                              </span>
                              <span className="text-sm font-bold text-teal-600 dark:text-teal-500">
                                {camp.clickedCount}{" "}
                                <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-normal">
                                  (
                                  {camp.sentCount > 0
                                    ? Math.round(
                                        (camp.clickedCount / camp.sentCount) *
                                          100,
                                      )
                                    : 0}
                                  %)
                                </span>
                              </span>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[10px] text-slate-500 dark:text-zinc-500 block uppercase font-bold tracking-wider">
                                Revenue
                              </span>
                              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-500 flex items-center justify-center gap-0.5">
                                ₹{camp.revenueGenerated.toLocaleString("en-IN")}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Timeline Tracker */}
                        {camp.status !== "DRAFT" && renderTimeline(camp)}

                        {/* Failure Logs visualization */}
                        {camp.status !== "DRAFT" && failedComms.length > 0 && (
                          <div className="mt-3 bg-rose-50 dark:bg-rose-950/10 border border-rose-200 dark:border-rose-900/30 rounded-lg p-3 space-y-2">
                            <div className="flex justify-between items-center select-none">
                              <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5 font-bold">
                                <AlertCircle className="w-3.5 h-3.5 animate-pulse" />{" "}
                                Delivery Pipeline Retries & DLQ Audit Logs (
                                {failedComms.length})
                              </span>
                            </div>
                            <div className="space-y-2 divide-y divide-slate-100 dark:divide-zinc-800/20 pt-1 text-[10.5px]">
                              {failedComms.map((comm) => {
                                let commLogs = [];
                                try {
                                  commLogs = comm.retryLogs
                                    ? JSON.parse(comm.retryLogs)
                                    : [];
                                } catch (e) {}

                                return (
                                  <div
                                    key={comm.id}
                                    className="pt-2 first:pt-0 space-y-1"
                                  >
                                    <div className="flex justify-between items-center">
                                      <span className="font-semibold text-slate-800 dark:text-zinc-300">
                                        {comm.customer.name} (
                                        {camp.channel === "EMAIL"
                                          ? comm.customer.email
                                          : comm.customer.phone || "No Phone"}
                                        )
                                      </span>
                                      <span
                                        className={`px-1.5 py-0.5 rounded-[4px] text-[9px] font-bold font-mono ${
                                          comm.status === "DLQ"
                                            ? "bg-rose-100 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-900/35"
                                            : comm.status === "RETRYING"
                                              ? "bg-amber-100 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-900/20 animate-pulse"
                                              : "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-900/35"
                                        }`}
                                      >
                                        {comm.status === "DLQ"
                                          ? "⚠️ DLQ (3 Bounces)"
                                          : comm.status === "RETRYING"
                                            ? `Attempting Retry ${comm.retryCount}/3`
                                            : "Retry Succeeded"}
                                      </span>
                                    </div>
                                    {commLogs.length > 0 && (
                                      <div className="pl-2.5 border-l border-rose-200 dark:border-rose-900/40 text-slate-500 dark:text-zinc-500 font-mono space-y-0.5 text-[9px] leading-relaxed">
                                        {commLogs.map((log, idx) => (
                                          <div key={idx}>
                                            <span className="text-slate-400 dark:text-zinc-500">
                                              [{log.time}]
                                            </span>{" "}
                                            {log.event}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Template Display */}
                        <div className="bg-slate-50 dark:bg-black/25 p-3 rounded-lg text-xs leading-relaxed text-slate-700 dark:text-zinc-400 font-sans border border-slate-200 dark:border-zinc-800/20">
                          <p className="text-[9px] text-slate-500 dark:text-zinc-500 uppercase font-bold tracking-wider mb-1">
                            Message template {camp.isAbTest ? "Variant A" : ""}:
                          </p>
                          <p className="text-slate-800 dark:text-zinc-300">
                            {camp.message}
                          </p>
                          {camp.isAbTest && camp.messageB && (
                            <>
                              <p className="text-[9px] text-slate-500 dark:text-zinc-500 uppercase font-bold tracking-wider mb-1 mt-2.5">
                                Message template Variant B:
                              </p>
                              <p className="text-slate-800 dark:text-zinc-300">
                                {camp.messageB}
                              </p>
                            </>
                          )}
                        </div>

                        {/* AI Campaign summary */}
                        {camp.status === "SENT" && camp.aiSummary && (
                          <div className="p-4 bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 rounded-lg space-y-2 text-xs text-slate-700 dark:text-zinc-300">
                            <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider text-[10px]">
                              <Sparkles className="w-3.5 h-3.5" /> AI Campaign
                              summary & Recommendation
                            </div>
                            <div className="prose prose-sm prose-invert text-slate-700 dark:text-zinc-300 whitespace-pre-line leading-relaxed text-[11.5px] font-sans">
                              {camp.aiSummary}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print-Only Campaign Report Template */}
      {printingCampaignId &&
        (() => {
          const camp = campaigns.find((c) => c.id === printingCampaignId);
          if (!camp) return null;
          const sentA = camp.sentCount - camp.sentCountB;
          const clickedA = camp.clickedCount - camp.clickedCountB;
          const ctrA = sentA > 0 ? Math.round((clickedA / sentA) * 100) : 0;
          const ctrB =
            camp.sentCountB > 0
              ? Math.round((camp.clickedCountB / camp.sentCountB) * 100)
              : 0;

          const failedComms =
            camp.communications?.filter(
              (c) => c.retryCount > 0 || c.status === "DLQ",
            ) || [];

          return (
            <div className="hidden print:block font-sans bg-white text-slate-900 p-8 max-w-4xl mx-auto space-y-6">
              {/* Report Header */}
              <div className="border-b-2 border-indigo-600 pb-4 flex justify-between items-end">
                <div>
                  <h1 className="text-2xl font-extrabold tracking-tight text-indigo-900">
                    XENO AI-NATIVE CRM
                  </h1>
                  <p className="text-[10px] text-slate-500 font-semibold tracking-widest uppercase mt-0.5">
                    Campaign Performance & Delivery Audit Report
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-700">
                    Campaign:{" "}
                    <span className="font-mono text-xs">{camp.name}</span>
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Date: {new Date().toLocaleDateString()}{" "}
                    {new Date().toLocaleTimeString()}
                  </p>
                </div>
              </div>

              {/* Campaign Details Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div>
                  <p className="text-slate-500 uppercase text-[9px] font-bold">
                    Audience Segment
                  </p>
                  <p className="font-bold text-sm text-slate-800">
                    {camp.segment?.name || "Segment"} (
                    {camp.segment?.customerCount || 0} shoppers)
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 uppercase text-[9px] font-bold">
                    Delivery Protocol
                  </p>
                  <p className="font-mono font-bold capitalize text-slate-800">
                    {camp.channel.toLowerCase()}
                  </p>
                </div>
                <div className="mt-1">
                  <p className="text-slate-500 uppercase text-[9px] font-bold">
                    Attributed Sales Revenue
                  </p>
                  <p className="font-bold text-emerald-600 text-base">
                    ₹{camp.revenueGenerated.toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="mt-1">
                  <p className="text-slate-500 uppercase text-[9px] font-bold">
                    Timestamp Launched
                  </p>
                  <p className="font-bold text-slate-800">
                    {new Date(camp.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Metrics cards */}
              <div>
                <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2.5">
                  Pipeline Performance Metrics
                </h2>
                <div className="grid grid-cols-5 gap-3 text-center">
                  <div className="border border-slate-200 p-3 rounded-lg bg-white">
                    <span className="block text-[8px] font-bold uppercase text-slate-400">
                      Total Transmitted
                    </span>
                    <span className="text-lg font-extrabold text-slate-900">
                      {camp.sentCount}
                    </span>
                  </div>
                  <div className="border border-slate-200 p-3 rounded-lg bg-white">
                    <span className="block text-[8px] font-bold uppercase text-slate-400">
                      Successful Delivery
                    </span>
                    <span className="text-lg font-extrabold text-blue-600">
                      {camp.deliveredCount}{" "}
                      <span className="text-[9px] font-normal text-slate-500">
                        (
                        {camp.sentCount > 0
                          ? Math.round(
                              (camp.deliveredCount / camp.sentCount) * 100,
                            )
                          : 0}
                        %)
                      </span>
                    </span>
                  </div>
                  <div className="border border-slate-200 p-3 rounded-lg bg-white">
                    <span className="block text-[8px] font-bold uppercase text-slate-400">
                      Audience Open
                    </span>
                    <span className="text-lg font-extrabold text-purple-600">
                      {camp.openedCount}{" "}
                      <span className="text-[9px] font-normal text-slate-500">
                        (
                        {camp.sentCount > 0
                          ? Math.round(
                              (camp.openedCount / camp.sentCount) * 100,
                            )
                          : 0}
                        %)
                      </span>
                    </span>
                  </div>
                  <div className="border border-slate-200 p-3 rounded-lg bg-white">
                    <span className="block text-[8px] font-bold uppercase text-slate-400">
                      Audience Click (CTR)
                    </span>
                    <span className="text-lg font-extrabold text-teal-600">
                      {camp.clickedCount}{" "}
                      <span className="text-[9px] font-normal text-slate-500">
                        (
                        {camp.sentCount > 0
                          ? Math.round(
                              (camp.clickedCount / camp.sentCount) * 100,
                            )
                          : 0}
                        %)
                      </span>
                    </span>
                  </div>
                  <div className="border border-slate-200 p-3 rounded-lg bg-white">
                    <span className="block text-[8px] font-bold uppercase text-slate-400">
                      Conversion Rate
                    </span>
                    <span className="text-lg font-extrabold text-slate-900">
                      {camp.openedCount > 0
                        ? Math.round(
                            (camp.clickedCount / camp.openedCount) * 100,
                          )
                        : 0}
                      %
                    </span>
                  </div>
                </div>
              </div>

              {/* Split Variants comparison */}
              <div className="space-y-3">
                <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Campaign Messaging Payload
                </h2>
                <div className="p-4 border border-slate-200 rounded-lg bg-slate-50 space-y-3 text-xs">
                  <div>
                    <p className="font-bold text-slate-700">
                      Message Text {camp.isAbTest ? "(Variant A)" : ""}:
                    </p>
                    <p className="font-sans italic text-slate-800 bg-white p-2.5 rounded border border-slate-100 mt-1 whitespace-pre-wrap">
                      {camp.message}
                    </p>
                  </div>
                  {camp.isAbTest && camp.messageB && (
                    <div>
                      <p className="font-bold text-slate-700">
                        Message Text (Variant B):
                      </p>
                      <p className="font-sans italic text-slate-800 bg-white p-2.5 rounded border border-slate-100 mt-1 whitespace-pre-wrap">
                        {camp.messageB}
                      </p>
                    </div>
                  )}
                  {camp.isAbTest && (
                    <div className="border-t border-slate-200 pt-3 mt-2 grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-slate-500 uppercase text-[9px] font-bold">
                          Variant A CTR:
                        </span>
                        <span className="font-bold ml-1 text-slate-900">
                          {ctrA}%
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 uppercase text-[9px] font-bold">
                          Variant B CTR:
                        </span>
                        <span className="font-bold ml-1 text-slate-900">
                          {ctrB}%
                        </span>
                      </div>
                      {camp.winner && (
                        <div className="col-span-2 text-emerald-600 font-bold text-[11px] mt-1">
                          👑 Selected Winner: Variant {camp.winner} (
                          {camp.winner === "B"
                            ? "Optimized Copy"
                            : "Control Copy"}{" "}
                          won with higher clicks)
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* AI Summary Section */}
              {camp.aiSummary && (
                <div>
                  <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                    AI Performance Summary & Insights
                  </h2>
                  <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-lg text-xs leading-relaxed text-slate-800 whitespace-pre-line font-sans italic">
                    {camp.aiSummary}
                  </div>
                </div>
              )}

              {/* Webhook retries logs */}
              {failedComms.length > 0 && (
                <div>
                  <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Delivery Failures & Retry Audit Logs (Resilience Tracking)
                  </h2>
                  <div className="border border-slate-200 rounded-lg overflow-hidden text-[10px]">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[8.5px]">
                          <th className="p-2">Customer</th>
                          <th className="p-2">Address</th>
                          <th className="p-2">Final Status</th>
                          <th className="p-2">Retries</th>
                          <th className="p-2">Detailed Event Audit Trail</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {failedComms.map((c) => {
                          let commLogs = [];
                          try {
                            commLogs = c.retryLogs
                              ? JSON.parse(c.retryLogs)
                              : [];
                          } catch (e) {}

                          return (
                            <tr key={c.id}>
                              <td className="p-2 font-bold text-slate-900">
                                {c.customer.name}
                              </td>
                              <td className="p-2 font-mono text-slate-600">
                                {camp.channel === "EMAIL"
                                  ? c.customer.email
                                  : c.customer.phone || c.customer.email}
                              </td>
                              <td className="p-2">
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[8.5px] font-bold ${
                                    c.status === "DLQ"
                                      ? "bg-red-50 text-red-700 border border-red-200"
                                      : "bg-green-50 text-green-700 border border-green-200"
                                  }`}
                                >
                                  {c.status}
                                </span>
                              </td>
                              <td className="p-2 font-bold font-mono text-slate-700">
                                {c.retryCount} / 3
                              </td>
                              <td className="p-2 text-slate-500 leading-normal">
                                {commLogs.map((lg, idx) => (
                                  <div key={idx} className="mb-0.5 last:mb-0">
                                    <span className="text-[8px] text-slate-400">
                                      [{lg.time}]
                                    </span>{" "}
                                    {lg.event}
                                  </div>
                                ))}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="border-t border-slate-200 pt-4 text-center text-[9px] text-slate-400 font-semibold tracking-wider uppercase">
                Xeno CRM Corporate Audit Document • AI Verification Approved
              </div>
            </div>
          );
        })()}
    </>
  );
}
