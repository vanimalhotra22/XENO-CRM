"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Cpu,
  Zap,
  Layers,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Sliders,
  Play,
  Mail,
  MessageSquare,
  Smartphone,
  ChevronRight
} from "lucide-react";

export default function LandingPage() {
  // Playground state
  const [originalText, setOriginalText] = useState("Hi customer, here's a 20% discount on your next checkout.");
  const [selectedTone, setSelectedTone] = useState("hype");
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState({
    text: "🔥 Limited Time Offer! Hi Vani, we noticed you've been away. Enjoy 20% OFF before midnight! 🛒✨",
    ctrBoost: "+12.4%",
    explanation: "Using time-sensitivity, emojis, and name personalization boosts urgency."
  });

  const handleToneRecommend = (e) => {
    e.preventDefault();
    setLoadingSuggestion(true);
    
    // Simulate instantaneous AI recommended suggestion
    setTimeout(() => {
      if (selectedTone === "hype") {
        setAiSuggestion({
          text: `🔥 Limited Time Offer! We noticed you've been away. Claim your 20% OFF before midnight! 🛒✨`,
          ctrBoost: "+12.4%",
          explanation: "High energy combined with urgency drives conversion rates."
        });
      } else if (selectedTone === "friendly") {
        setAiSuggestion({
          text: `Hey there! We miss having you around. Here's a special 20% discount just for you. Happy shopping! 😊`,
          ctrBoost: "+7.8%",
          explanation: "Warm and inviting tone builds loyalty and brand trust."
        });
      } else if (selectedTone === "urgent") {
        setAiSuggestion({
          text: `⚠️ LAST CALL: Your 20% discount expires in 2 hours. Complete your purchase now.`,
          ctrBoost: "+14.6%",
          explanation: "Strong FOMO language with a direct Call To Action triggers immediate buying behavior."
        });
      } else if (selectedTone === "professional") {
        setAiSuggestion({
          text: `We appreciate your preference. Enjoy a complimentary 20% reduction on your next purchase with our compliments.`,
          ctrBoost: "+3.2%",
          explanation: "Polished and formal tone appropriate for premium corporate audience segments."
        });
      }
      setLoadingSuggestion(false);
    }, 450);
  };

  return (
    <div className="space-y-24 py-6 md:py-12 relative">
      {/* Decorative neon background glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse-slow pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] animate-pulse-slow pointer-events-none" />

      {/* Hero Section */}
      <section className="text-center space-y-8 max-w-4xl mx-auto pt-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 text-xs font-bold uppercase tracking-wider animate-bounce">
          <Sparkles className="w-3.5 h-3.5" /> Next-Gen AI-Native CRM
        </div>
        
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight text-slate-900 dark:text-white">
          The Intelligent CRM That <span className="text-gradient-indigo-cyan font-black">Never Sleeps</span>
        </h1>
        
        <p className="text-base sm:text-lg text-muted-custom max-w-2xl mx-auto leading-relaxed">
          Unify shopper profiles, build dynamic segments with natural language, model real-world provider errors in our simulated pipeline, and boost engagement with AI wording recommendations.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-8 py-3.5 bg-indigo-650 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-650/20 hover:scale-102 transition-all cursor-pointer"
          >
            Launch CRM Workspace <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="#features"
            className="w-full sm:w-auto px-8 py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900/60 dark:hover:bg-zinc-900 border border-slate-200/50 dark:border-zinc-800/50 text-slate-800 dark:text-zinc-300 rounded-xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            Explore Features
          </a>
        </div>

        {/* Mini stats showcase */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto pt-8 text-left">
          {[
            { label: "Segment Target Speed", value: "< 50ms" },
            { label: "AI CTR Improvement", value: "+12.4% Avg" },
            { label: "Queue Resilience", value: "99.99%" },
            { label: "Attribution Engine", value: "1-Click" }
          ].map((stat, idx) => (
            <div key={idx} className="glass-panel p-4 rounded-xl border border-slate-200/40 dark:border-zinc-800/25">
              <p className="text-[10px] text-muted-custom font-bold uppercase tracking-wider">{stat.label}</p>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">{stat.value}</h3>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Grid Section */}
      <section id="features" className="space-y-12 scroll-mt-20">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">Core Capabilities</h2>
          <p className="text-xs sm:text-sm text-muted-custom">Engineered to simulate real production workflows and drive sales.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Card 1: AI Wording Recommender */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-200/40 dark:border-zinc-800/25 flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-500">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">AI Wording & Tone Recommender</h3>
              <p className="text-xs text-muted-custom leading-relaxed">
                Automatically analyze message copies and generate tailored suggestions to match shopper demographics and boost click-through rates.
              </p>
            </div>

            {/* Interactive Mock UI */}
            <div className="bg-slate-100/60 dark:bg-zinc-900/60 border border-slate-200/50 dark:border-zinc-800/40 rounded-xl p-4 space-y-3.5 text-xs">
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-muted-custom uppercase">Original text:</span>
                <p className="p-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-slate-700 dark:text-zinc-400">
                  Hi customer, here's a discount.
                </p>
              </div>
              <div className="flex justify-center">
                <div className="px-2.5 py-1 bg-indigo-500/10 text-indigo-500 rounded-full font-bold text-[9px] tracking-wide flex items-center gap-1 animate-pulse">
                  <Cpu className="w-3 h-3" /> Optimizing Tone...
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-bold text-indigo-500 uppercase">AI Suggestion:</span>
                  <span className="text-[9px] font-black text-emerald-500 bg-emerald-500/10 px-1.5 py-0.2 rounded">CTR: +12.4%</span>
                </div>
                <p className="p-2.5 bg-indigo-500/5 border border-indigo-500/20 rounded-lg text-slate-800 dark:text-zinc-200 font-medium">
                  🔥 Limited Time Offer! Hi Vani, we noticed you've been away. Enjoy 20% OFF before midnight!
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: Simulated Failures Pipeline */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-200/40 dark:border-zinc-800/25 flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="w-10 h-10 bg-cyan-500/10 border border-cyan-500/20 rounded-xl flex items-center justify-center text-cyan-400">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Interactive Simulator Failures</h3>
              <p className="text-xs text-muted-custom leading-relaxed">
                Model provider disruptions (bounces, rate limits, network timeouts) to test campaign queue recovery, automatic retries, and DLQ handling.
              </p>
            </div>

            {/* Interactive Mock Logs */}
            <div className="bg-slate-100/60 dark:bg-zinc-900/60 border border-slate-200/50 dark:border-zinc-800/40 rounded-xl p-4 space-y-3 text-xs font-mono">
              <div className="flex justify-between text-[9px] font-bold text-muted-custom pb-2 border-b border-slate-200/60 dark:border-zinc-800/40">
                <span>KPI TARGET</span>
                <span>FAILURES ACTIVE</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                <div className="p-1.5 bg-white dark:bg-zinc-900 rounded border border-slate-200 dark:border-zinc-800">
                  <span className="block text-slate-500 dark:text-zinc-500 text-[8px]">Delivery</span>
                  <span className="font-bold text-emerald-500">90%</span>
                </div>
                <div className="p-1.5 bg-white dark:bg-zinc-900 rounded border border-slate-200 dark:border-zinc-800">
                  <span className="block text-slate-500 dark:text-zinc-500 text-[8px]">Open</span>
                  <span className="font-bold text-indigo-500">70%</span>
                </div>
                <div className="p-1.5 bg-white dark:bg-zinc-900 rounded border border-slate-200 dark:border-zinc-800">
                  <span className="block text-slate-500 dark:text-zinc-500 text-[8px]">Click</span>
                  <span className="font-bold text-cyan-500">30%</span>
                </div>
              </div>
              <div className="space-y-1.5 pt-1 text-[9.5px]">
                <div className="flex justify-between items-center text-amber-500 bg-amber-500/5 px-2 py-1 rounded">
                  <span>[QUEUE] Dispatching campaign ID: camp_912</span>
                  <span className="animate-spin"><RefreshCw className="w-3 h-3" /></span>
                </div>
                <div className="flex justify-between items-center text-rose-500 bg-rose-500/5 px-2 py-1 rounded">
                  <span>[SMS_PROVIDER] rate_limited (429)</span>
                  <span className="font-bold">RETRYING</span>
                </div>
                <div className="flex justify-between items-center text-emerald-500 bg-emerald-500/5 px-2 py-1 rounded">
                  <span>[QUEUE] Retry 1 success. Delivered to user_409</span>
                  <span className="font-bold">DELIVERED</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Architecture pipeline illustration */}
      <section id="architecture" className="space-y-12 scroll-mt-20">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">Resilient Campaign Pipeline</h2>
          <p className="text-xs sm:text-sm text-muted-custom">How shopper messages propagate from CRM segment builders to target cellphones.</p>
        </div>

        <div className="glass-panel p-8 rounded-2xl border border-slate-200/40 dark:border-zinc-800/25 relative overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-center text-center text-xs relative z-10">
            {/* Step 1 */}
            <div className="space-y-3 p-4 bg-slate-100/60 dark:bg-zinc-900/40 rounded-xl border border-slate-200/60 dark:border-zinc-800/20">
              <span className="font-bold text-indigo-500">01</span>
              <h4 className="font-bold text-slate-900 dark:text-white">CRM Segment</h4>
              <p className="text-[10px] text-muted-custom">Filter audience profiles using SQL/JSON.</p>
            </div>
            
            <div className="hidden md:flex justify-center text-indigo-500">
              <ChevronRight className="w-6 h-6" />
            </div>

            {/* Step 2 */}
            <div className="space-y-3 p-4 bg-slate-100/60 dark:bg-zinc-900/40 rounded-xl border border-slate-200/60 dark:border-zinc-800/20">
              <span className="font-bold text-indigo-500">02</span>
              <h4 className="font-bold text-slate-900 dark:text-white">AI Copilot</h4>
              <p className="text-[10px] text-muted-custom">Enhance subject line wording dynamically.</p>
            </div>

            <div className="hidden md:flex justify-center text-indigo-500">
              <ChevronRight className="w-6 h-6" />
            </div>

            {/* Step 3 */}
            <div className="space-y-3 p-4 bg-slate-100/60 dark:bg-zinc-900/40 rounded-xl border border-slate-200/60 dark:border-zinc-800/20">
              <span className="font-bold text-indigo-500">03</span>
              <h4 className="font-bold text-slate-900 dark:text-white">Provider Simulator</h4>
              <p className="text-[10px] text-muted-custom">Simulate bounces & rate-limiting states.</p>
            </div>
          </div>

          <div className="mt-8 border-t border-slate-200/60 dark:border-zinc-800/40 pt-8 grid grid-cols-1 md:grid-cols-2 gap-8 text-xs leading-relaxed">
            <div className="space-y-2">
              <h4 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Automatic Retry Engine
              </h4>
              <p className="text-muted-custom text-[11px]">
                Provider network downtime triggers temporary failures. Our scheduler automatically queue-retries messages using backoff logic, avoiding client-side drops.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" /> Dead Letter Queue (DLQ)
              </h4>
              <p className="text-muted-custom text-[11px]">
                Persistent errors (invalid mobile numbers, permanent address bounces) exit the retry cycle directly into the CRM Dead Letter logs for manual cleanup.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* AI Tone Recommender Playground */}
      <section id="ai" className="space-y-12 scroll-mt-20">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">AI Tone Sandbox</h2>
          <p className="text-xs sm:text-sm text-muted-custom">Try our AI copywriting tuner live. Enhance your conversion before launching campaigns.</p>
        </div>

        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-200/40 dark:border-zinc-800/25 max-w-4xl mx-auto space-y-6">
          <form onSubmit={handleToneRecommend} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Draft Campaign Copy</label>
              <textarea
                value={originalText}
                onChange={(e) => setOriginalText(e.target.value)}
                placeholder="Type message here..."
                rows="3"
                className="w-full text-xs bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-lg p-3 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <span className="text-[10px] text-muted-custom font-bold uppercase mr-1">Desired Tone:</span>
                {[
                  { id: "hype", label: "Hype 🔥" },
                  { id: "friendly", label: "Friendly 😊" },
                  { id: "urgent", label: "Urgent ⚠️" },
                  { id: "professional", label: "Professional 👔" }
                ].map((tone) => (
                  <button
                    key={tone.id}
                    type="button"
                    onClick={() => setSelectedTone(tone.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedTone === tone.id
                        ? "bg-indigo-650 text-white"
                        : "bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300"
                    }`}
                  >
                    {tone.label}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                disabled={loadingSuggestion || !originalText.trim()}
                className="w-full sm:w-auto px-6 py-2.5 bg-indigo-650 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-650/10 cursor-pointer"
              >
                {loadingSuggestion ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Tuning...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" /> Optimize copy
                  </>
                )}
              </button>
            </div>
          </form>

          {/* AI Result Card */}
          <div className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-xl space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1.5 text-xs text-indigo-500 font-extrabold uppercase">
                <Cpu className="w-4 h-4" /> AI Tune Result
              </div>
              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded font-black text-xs">
                {aiSuggestion.ctrBoost} Projected CTR
              </span>
            </div>

            <p className="text-xs text-slate-800 dark:text-zinc-200 font-medium leading-relaxed italic">
              "{aiSuggestion.text}"
            </p>

            <p className="text-[10px] text-muted-custom font-semibold">
              <strong className="text-slate-800 dark:text-zinc-300">Strategy:</strong> {aiSuggestion.explanation}
            </p>
          </div>
        </div>
      </section>

      {/* CTA Footer Section */}
      <section className="text-center space-y-6 max-w-2xl mx-auto pb-12">
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">Ready to engage your customers?</h2>
        <p className="text-xs text-muted-custom">
          Step into our high-performance marketer environment and start sending simulated campaigns.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-indigo-650 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-650/20 hover:scale-102 transition-all cursor-pointer"
        >
          Launch Xeno App <ArrowRight className="w-4 h-4 animate-pulse" />
        </Link>
      </section>
    </div>
  );
}
