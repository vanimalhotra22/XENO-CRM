"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Send,
  Play,
  CheckCircle2,
  Cpu,
  RefreshCw,
  Bot,
} from "lucide-react";

export default function AICopilotPage() {
  // Chat States
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        'Hello! I am your AI Marketing Copilot. Ask me how to increase repeat purchases, reward VIPs, or draft an engagement campaign. \n\nYou can also query the database directly in natural language! Try typing: "show VIP customers" or "find shoppers in Mumbai".',
    },
  ]);
  const [input, setInput] = useState("");
  const [sendingChat, setSendingChat] = useState(false);
  const messagesEndRef = useRef(null);

  // Agent States
  const [agentGoal, setAgentGoal] = useState("");
  const [runningAgent, setRunningAgent] = useState(false);
  const [activeRunId, setActiveRunId] = useState(null);
  const [activeRun, setActiveRun] = useState(null);

  const [installingRec, setInstallingRec] = useState(null);
  const [installSuccess, setInstallSuccess] = useState(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Polling for Agent Run steps
  useEffect(() => {
    if (!activeRunId) return;

    const checkRunStatus = async () => {
      try {
        const res = await fetch(`/api/copilot?runId=${activeRunId}`);
        const data = await res.json();
        if (data.success && data.run) {
          setActiveRun(data.run);
          if (data.run.status !== "RUNNING") {
            setRunningAgent(false);
            setActiveRunId(null); // Stop polling
          }
        }
      } catch (err) {
        console.error("Error polling agent status:", err);
      }
    };

    const pollInterval = setInterval(checkRunStatus, 1500);
    return () => clearInterval(pollInterval);
  }, [activeRunId]);

  // Send Chat message
  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!input.trim() || sendingChat) return;

    const userMsg = input.trim();
    setInput("");
    setSendingChat(true);

    const updatedHistory = [...messages, { role: "user", content: userMsg }];
    setMessages(updatedHistory);

    try {
      const res = await fetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "chat",
          message: userMsg,
          history: updatedHistory
            .slice(0, -1)
            .map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.reply,
            recommendation: data.recommendation,
            queryResult: data.queryResult,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "Sorry, I encountered an issue while processing your request. Please try again.",
          },
        ]);
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Network error. Make sure your local servers are running.",
        },
      ]);
    } finally {
      setSendingChat(false);
    }
  };

  // Launch AI Agent
  const handleLaunchAgent = async () => {
    if (!agentGoal.trim() || runningAgent) return;
    setRunningAgent(true);
    setActiveRun(null);
    setActiveRunId(null);

    try {
      const res = await fetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "agent",
          goal: agentGoal.trim(),
        }),
      });
      const data = await res.json();
      if (data.success && data.runId) {
        setActiveRunId(data.runId);
        setAgentGoal("");
      } else {
        setRunningAgent(false);
      }
    } catch (err) {
      console.error(err);
      setRunningAgent(false);
    }
  };

  // Execute recommendation
  const handleExecuteRec = async (rec, idx) => {
    const key = `rec-${idx}`;
    setInstallingRec(key);
    setInstallSuccess(null);

    try {
      // Step 1: Create the segment
      const segRes = await fetch("/api/segments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: rec.segmentName,
          description: `Copilot segment for: ${rec.name}`,
          query: rec.segmentQuery,
        }),
      });
      const segData = await segRes.json();
      if (!segData.success) throw new Error(segData.error);

      // Step 2: Create the campaign
      const campRes = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: rec.name,
          segmentId: segData.segment.id,
          channel: rec.channel,
          message: rec.message,
        }),
      });
      const campData = await campRes.json();
      if (!campData.success) throw new Error(campData.error);

      // Step 3: Launch it!
      const launchRes = await fetch(
        `/api/campaigns/${campData.campaign.id}/send`,
        {
          method: "POST",
        },
      );
      const launchData = await launchRes.json();
      if (!launchData.success) throw new Error(launchData.error);

      setInstallSuccess(
        `Campaign "${rec.name}" launched successfully! targeting ${launchData.count} shoppers.`,
      );
    } catch (err) {
      console.error(err);
      alert(`Execution failed: ${err.message}`);
    } finally {
      setInstallingRec(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
          AI Marketing Hub{" "}
          <Sparkles className="w-8 h-8 text-indigo-500 animate-pulse" />
        </h1>
        <p className="text-muted-custom text-xs mt-1 font-medium">
          Converse with the Copilot to query databases or draft campaigns, or
          delegate goals to the autonomous agent.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left column: AI Copilot Chat Interface */}
        <div className="glass-panel rounded-xl flex flex-col h-[70vh] border border-zinc-800/10">
          {/* Brand header */}
          <div className="p-4 border-b border-zinc-800/10 bg-zinc-900/5 flex items-center gap-2.5">
            <Bot className="w-5 h-5 text-indigo-500" />
            <div>
              <h2 className="font-bold text-sm text-slate-900 dark:text-white">
                Marketing Copilot Chat
              </h2>
              <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
                Natural Language Database-attuned
              </span>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-xl p-3.5 text-xs leading-relaxed space-y-3 ${
                    m.role === "user"
                      ? "bg-indigo-600 text-white rounded-br-none shadow-lg shadow-indigo-600/10"
                      : "bg-zinc-800/10 border border-zinc-800/10 text-slate-800 dark:text-zinc-300 rounded-bl-none"
                  }`}
                >
                  <p className="whitespace-pre-wrap font-medium">{m.content}</p>

                  {/* Render Natural Language DB Query Table Results */}
                  {m.queryResult && m.queryResult.length > 0 && (
                    <div className="overflow-x-auto border border-zinc-800/10 rounded-lg mt-2 bg-zinc-800/5">
                      <table className="w-full text-left text-[10px] border-collapse">
                        <thead>
                          <tr className="bg-black/5 border-b border-zinc-800/10 font-bold text-zinc-500 uppercase">
                            {Object.keys(m.queryResult[0]).map((key) => (
                              <th key={key} className="p-2 capitalize">
                                {key.replace(/([A-Z])/g, " $1").trim()}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-850/10">
                          {m.queryResult.map((row, rIdx) => (
                            <tr key={rIdx} className="hover:bg-zinc-800/5">
                              {Object.keys(row).map((key) => {
                                const val = row[key];
                                return (
                                  <td
                                    key={key}
                                    className={`p-2 ${
                                      key === "totalSpent" ||
                                      key === "revenue" ||
                                      key === "Revenue" ||
                                      key === "Spent"
                                        ? "font-bold text-emerald-500"
                                        : "text-slate-800 dark:text-zinc-300"
                                    }`}
                                  >
                                    {typeof val === "number" &&
                                    (key === "totalSpent" ||
                                      key === "revenue" ||
                                      key === "Revenue" ||
                                      key === "Spent")
                                      ? `₹${val.toLocaleString("en-IN")}`
                                      : String(val)}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Recommendation Card */}
                  {m.recommendation && (
                    <div className="bg-black/50 border border-indigo-500/20 rounded-lg p-3 space-y-3 mt-2 text-[11px]">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-white text-gradient-indigo-cyan">
                            {m.recommendation.name}
                          </h4>
                          <p className="text-[10px] text-zinc-500 mt-0.5">
                            Segment: {m.recommendation.segmentName}
                          </p>
                        </div>
                        <span className="text-[9px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.2 rounded font-bold uppercase">
                          {m.recommendation.channel}
                        </span>
                      </div>

                      <div className="p-2 bg-black/45 rounded font-sans italic text-zinc-300 leading-normal border border-zinc-800/40">
                        {m.recommendation.message}
                      </div>

                      {installSuccess &&
                      installSuccess.includes(m.recommendation.name) ? (
                        <div className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> {installSuccess}
                        </div>
                      ) : (
                        <button
                          onClick={() =>
                            handleExecuteRec(m.recommendation, idx)
                          }
                          disabled={installingRec !== null}
                          className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded font-bold text-[10px] cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Play className="w-3 h-3 fill-current" />{" "}
                          {installingRec === `rec-${idx}`
                            ? "Launching Campaign..."
                            : "1-Click Launch Campaign"}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {sendingChat && (
              <div className="flex justify-start">
                <div className="bg-zinc-800/15 border border-zinc-800/10 text-zinc-500 rounded-xl rounded-bl-none p-3 text-xs flex items-center gap-2 animate-pulse">
                  <Cpu className="w-4 h-4 animate-spin" /> Fetching records...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Form */}
          <form
            onSubmit={handleSendChat}
            className="p-3 border-t border-zinc-800/10 bg-zinc-900/5 flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask: 'show VIP shoppers' or 'find shoppers in Mumbai'"
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 placeholder-zinc-600"
            />

            <button
              type="submit"
              disabled={sendingChat || !input.trim()}
              className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Right column: Level 5 Autonomous Agent Workflow */}
        <div className="space-y-6">
          {/* Agent Goal Input Panel */}
          <div className="glass-panel p-6 rounded-xl space-y-4 border border-zinc-800/10">
            <div className="flex items-center gap-2.5">
              <Cpu className="w-6 h-6 text-indigo-500" />
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Autonomous AI Agent
                </h2>
                <span className="text-[10px] text-zinc-500 font-bold tracking-wider uppercase block">
                  Level 5 End-to-End Campaign Solver
                </span>
              </div>
            </div>
            <p className="text-muted-custom text-xs">
              Delegate a broad goal. The AI agent will brainstorm target
              criteria, register the segment, write the copy, choose the
              channel, launch the campaign, and start tracking outcomes.
            </p>

            <div className="space-y-3">
              <textarea
                value={agentGoal}
                onChange={(e) => setAgentGoal(e.target.value)}
                placeholder="E.g., Bring back high spenders who haven't ordered in 45 days. Gift them 20% off."
                rows={3}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-indigo-500 placeholder-zinc-600 font-sans"
              />

              <button
                onClick={handleLaunchAgent}
                disabled={runningAgent || !agentGoal.trim()}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/10"
              >
                <Cpu className="w-4 h-4" /> Launch Campaign Agent
              </button>
            </div>
          </div>

          {/* Live Agent Execution Monitor */}
          {(activeRun || runningAgent) && (
            <div className="glass-panel-glow p-6 rounded-xl space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Agent Live Monitor
                  </h3>
                  {activeRun && (
                    <span className="text-[10px] text-zinc-500 font-medium">
                      Goal: "{activeRun.goal}"
                    </span>
                  )}
                </div>
                {runningAgent && (
                  <span className="flex items-center gap-1.5 text-xs text-indigo-500 font-bold">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> RUNNING
                  </span>
                )}
                {activeRun?.status === "COMPLETED" && (
                  <span className="text-xs text-emerald-500 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> COMPLETED
                  </span>
                )}
              </div>

              {/* Checklist Visualization */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-zinc-950/40 border border-zinc-900 rounded-lg text-[10.5px] font-semibold text-zinc-400">
                {[
                  {
                    name: "Analyze customer data",
                    checked: activeRun?.steps.some(
                      (s) =>
                        s.message.includes("Scanning") ||
                        s.message.includes("Research"),
                    ),
                  },
                  {
                    name: "Identify target audience",
                    checked: activeRun?.steps.some(
                      (s) =>
                        s.message.includes("Research Complete") ||
                        s.message.includes("Creating CRM"),
                    ),
                  },
                  {
                    name: "Generate campaign copy",
                    checked: activeRun?.steps.some(
                      (s) =>
                        s.message.includes("Copywriting") ||
                        s.message.includes("Optimal channel"),
                    ),
                  },
                  {
                    name: "Select optimal channel",
                    checked: activeRun?.steps.some(
                      (s) =>
                        s.message.includes("Optimal channel") ||
                        s.message.includes("launching"),
                    ),
                  },
                  {
                    name: "Launch campaign queue",
                    checked: activeRun?.steps.some(
                      (s) =>
                        s.message.includes("launching") ||
                        s.message.includes("Dispatching"),
                    ),
                  },
                  {
                    name: "Monitor real-time callbacks",
                    checked: activeRun?.steps.some(
                      (s) =>
                        s.message.includes("dispatched") ||
                        s.message.includes("completed"),
                    ),
                  },
                  {
                    name: "Generate campaign summary",
                    checked: activeRun?.status === "COMPLETED",
                  },
                ].map((chk, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span
                      className={`w-3.5 h-3.5 rounded flex items-center justify-center font-bold text-[9px] ${
                        chk.checked
                          ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 font-bold"
                          : "bg-zinc-800 text-zinc-500 border border-zinc-700/50"
                      }`}
                    >
                      {chk.checked ? "✓" : ""}
                    </span>
                    <span
                      className={
                        chk.checked
                          ? "text-zinc-300 font-bold"
                          : "text-zinc-500"
                      }
                    >
                      {chk.name}
                    </span>
                  </div>
                ))}
              </div>

              {/* Steps Timeline */}
              <div className="space-y-4 relative pl-4 border-l border-zinc-800 mt-2">
                {activeRun?.steps.map((step, idx) => (
                  <div key={idx} className="relative space-y-1">
                    {/* Bullet marker */}
                    <span
                      className={`absolute -left-[21px] top-0.5 w-3.5 h-3.5 rounded-full border-2 ${
                        step.status === "success"
                          ? "bg-emerald-500 border-emerald-500"
                          : step.status === "error"
                            ? "bg-rose-500 border-rose-500"
                            : "bg-indigo-500 border-indigo-500 animate-pulse"
                      }`}
                    />

                    <p
                      className={`text-xs font-bold leading-none ${
                        step.status === "success"
                          ? "text-emerald-500"
                          : step.status === "error"
                            ? "text-rose-500"
                            : "text-indigo-600 dark:text-indigo-300"
                      }`}
                    >
                      {step.message}
                    </p>
                    <span className="text-[9px] text-zinc-500 block">
                      {new Date(step.time).toLocaleTimeString()}
                    </span>
                  </div>
                ))}

                {runningAgent &&
                  activeRun &&
                  activeRun.steps[activeRun.steps.length - 1]?.status ===
                    "success" && (
                    <div className="relative pl-0.5 text-xs text-zinc-500 italic animate-pulse">
                      Computing next logical agent step...
                    </div>
                  )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
