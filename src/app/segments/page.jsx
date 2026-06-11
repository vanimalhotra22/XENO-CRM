"use client";

import React, { useEffect, useState } from "react";
import {
  Filter,
  Sparkles,
  AlertCircle,
  Plus,
  Trash2,
  Database,
} from "lucide-react";

export default function SegmentsPage() {
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(true);
  // Custom segment builder state
  const [segmentName, setSegmentName] = useState("");
  const [segmentDesc, setSegmentDesc] = useState("");
  const [logicalOp, setLogicalOp] = useState("AND");
  const [conditions, setConditions] = useState([
    { field: "totalSpent", operator: "gt", value: 5000 },
  ]);

  // AI builder state
  const [aiPrompt, setAiPrompt] = useState("");
  const [generatingAi, setGeneratingAi] = useState(false);
  const [aiError, setAiError] = useState("");
  const [previewAiRules, setPreviewAiRules] = useState(null);

  const [saving, setSaving] = useState(false);

  // Previews
  const [manualPreview, setManualPreview] = useState({
    count: 0,
    potentialRevenue: 0,
  });
  const [previewLoading, setPreviewLoading] = useState(false);
  const [aiPreview, setAiPreview] = useState(null);
  const [aiPreviewLoading, setAiPreviewLoading] = useState(false);

  useEffect(() => {
    const fetchManualPreview = async () => {
      setPreviewLoading(true);
      try {
        const res = await fetch("/api/segments/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: {
              conditions,
              logicalOperator: logicalOp,
            },
          }),
        });
        const data = await res.json();
        if (data.success) {
          setManualPreview({
            count: data.count,
            potentialRevenue: data.potentialRevenue,
          });
        }
      } catch (err) {
        console.error("Error fetching manual preview:", err);
      } finally {
        setPreviewLoading(false);
      }
    };

    const debounce = setTimeout(fetchManualPreview, 400);
    return () => clearTimeout(debounce);
  }, [conditions, logicalOp]);

  useEffect(() => {
    if (!previewAiRules) {
      setAiPreview(null);
      return;
    }
    const fetchAiPreview = async () => {
      setAiPreviewLoading(true);
      try {
        const res = await fetch("/api/segments/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: {
              conditions: previewAiRules.conditions,
              logicalOperator: previewAiRules.logicalOperator,
            },
          }),
        });
        const data = await res.json();
        if (data.success) {
          setAiPreview({
            count: data.count,
            potentialRevenue: data.potentialRevenue,
          });
        }
      } catch (err) {
        console.error("Error fetching AI preview:", err);
      } finally {
        setAiPreviewLoading(false);
      }
    };
    fetchAiPreview();
  }, [previewAiRules]);

  const fetchSegments = async () => {
    try {
      const res = await fetch("/api/segments");
      const data = await res.json();
      if (data.success) {
        setSegments(data.segments);
      }
    } catch (e) {
      console.error("Error fetching segments:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSegments();
  }, []);

  const handleAddCondition = () => {
    setConditions([
      ...conditions,
      { field: "totalSpent", operator: "gt", value: 0 },
    ]);
  };

  const handleRemoveCondition = (index) => {
    const list = [...conditions];
    list.splice(index, 1);
    setConditions(list);
  };

  const handleConditionChange = (index, key, val) => {
    const list = [...conditions];
    if (key === "field") {
      const field = val;
      let operator = "gt";
      let value = 0;
      if (field === "totalSpent") {
        operator = "gt";
        value = 5000;
      } else if (field === "orderCount") {
        operator = "gt";
        value = 3;
      } else if (field === "lastOrderDaysAgo") {
        operator = "gt";
        value = 30;
      } else if (field === "city") {
        operator = "contains";
        value = "Mumbai";
      } else if (field === "gender") {
        operator = "eq";
        value = "Female";
      }
      list[index] = { field, operator, value };
    } else {
      list[index] = { ...list[index], [key]: val };
    }
    setConditions(list);
  };

  // Submit manual segment
  const handleCreateManualSegment = async (e) => {
    e.preventDefault();
    if (!segmentName) return;
    setSaving(true);

    const query = {
      conditions,
      logicalOperator: logicalOp,
    };

    try {
      const res = await fetch("/api/segments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: segmentName,
          description: segmentDesc || "Manually built criteria segment.",
          query,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSegmentName("");
        setSegmentDesc("");
        setConditions([{ field: "totalSpent", operator: "gt", value: 5000 }]);
        fetchSegments();
      }
    } catch (err) {
      console.error("Error creating segment:", err);
    } finally {
      setSaving(false);
    }
  };

  // Generate Rules with AI
  const handleGenerateWithAi = async () => {
    if (!aiPrompt) return;
    setGeneratingAi(true);
    setAiError("");
    setPreviewAiRules(null);

    try {
      const res = await fetch("/api/segments/builder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt }),
      });
      const data = await res.json();
      if (data.success) {
        setPreviewAiRules(data.rules);
      } else {
        setAiError(data.error || "Failed to generate rules");
      }
    } catch (err) {
      setAiError(err.message || "Error communicating with AI services");
    } finally {
      setGeneratingAi(false);
    }
  };

  // Save generated AI segment
  const handleSaveAiSegment = async () => {
    if (!previewAiRules) return;
    setSaving(true);

    try {
      const res = await fetch("/api/segments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: previewAiRules.name,
          description: previewAiRules.description,
          query: {
            conditions: previewAiRules.conditions,
            logicalOperator: previewAiRules.logicalOperator,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPreviewAiRules(null);
        setAiPrompt("");
        fetchSegments();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const getRuleSummary = (queryStr) => {
    try {
      const query = JSON.parse(queryStr);
      if (!query.conditions || query.conditions.length === 0)
        return "All Customers";
      return query.conditions
        .map((c) => {
          let fieldLabel = c.field;
          if (c.field === "totalSpent") fieldLabel = "Spent";
          else if (c.field === "lastOrderDaysAgo") fieldLabel = "Inactive days";
          else if (c.field === "orderCount") fieldLabel = "Orders";

          let opLabel = c.operator;
          if (c.operator === "gt") opLabel = ">";
          else if (c.operator === "lt") opLabel = "<";
          else if (c.operator === "eq") opLabel = "=";
          else if (c.operator === "contains") opLabel = "contains";

          return `${fieldLabel} ${opLabel} ${c.value}`;
        })
        .join(` ${query.logicalOperator} `);
    } catch (e) {
      return "Custom Criteria";
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
          Segment Builder <Filter className="w-8 h-8 text-indigo-500" />
        </h1>
        <p className="text-muted-custom text-xs mt-1 font-medium">
          Carve target audiences out of shopper databases based on spending,
          city, gender, and purchase frequency.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column: Traditional & AI Builders */}
        <div className="lg:col-span-2 space-y-8">
          {/* AI Segment Builder */}
          <div className="glass-panel-glow p-6 rounded-xl space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                AI Audience Planner
              </h2>
            </div>
            <p className="text-muted-custom text-xs">
              Type what kind of shopper segment you need in natural language. AI
              will define the filters.
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Find big spenders in Mumbai..."
                className="flex-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-4 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 placeholder-slate-400 dark:placeholder-zinc-500"
              />

              <button
                onClick={handleGenerateWithAi}
                disabled={generatingAi || !aiPrompt}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-all cursor-pointer flex items-center gap-2"
              >
                {generatingAi ? "Analyzing..." : "Generate rules"}
              </button>
            </div>

            {aiError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> {aiError}
              </div>
            )}

            {/* AI Preview Card */}
            {previewAiRules && (
              <div className="p-4 bg-slate-100/50 dark:bg-zinc-900/60 border border-slate-200 dark:border-indigo-500/20 rounded-lg space-y-4 text-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-white text-sm text-gradient-indigo-cyan">
                      {previewAiRules.name}
                    </h3>
                    <p className="text-zinc-500 text-[11px] mt-0.5">
                      {previewAiRules.description}
                    </p>
                  </div>
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-500 border border-indigo-500/30 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                    AI Suggestion
                  </span>
                </div>

                {/* AI Size Preview */}
                <div className="grid grid-cols-2 gap-4 p-3 bg-slate-200/50 dark:bg-zinc-950/60 border border-slate-200 dark:border-zinc-800 rounded-lg">
                  <div>
                    <span className="text-zinc-500 block text-[9px] font-bold uppercase tracking-wider">
                      Estimated Audience
                    </span>
                    <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                      {aiPreviewLoading
                        ? "Calculating..."
                        : aiPreview
                          ? `${aiPreview.count} Customers`
                          : "0 Customers"}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[9px] font-bold uppercase tracking-wider">
                      Potential Revenue
                    </span>
                    <span className="text-sm font-extrabold text-emerald-500">
                      {aiPreviewLoading
                        ? "Calculating..."
                        : aiPreview
                          ? `₹${aiPreview.potentialRevenue.toLocaleString()}`
                          : "₹0"}
                    </span>
                  </div>
                </div>

                <div className="space-y-1 bg-slate-100 dark:bg-black/40 p-3 rounded font-mono text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-transparent">
                  <p className="text-[10px] text-zinc-500 mb-1">
                    Generated filters:
                  </p>
                  {previewAiRules.conditions.map((c, idx) => (
                    <div key={idx} className="flex gap-2">
                      <span className="text-indigo-400">{c.field}</span>
                      <span className="text-zinc-500">{c.operator}</span>
                      <span className="text-emerald-400">{c.value}</span>
                      {idx < previewAiRules.conditions.length - 1 && (
                        <span className="text-purple-400 font-bold">
                          {previewAiRules.logicalOperator}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setPreviewAiRules(null)}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 text-slate-700 dark:text-zinc-400 rounded hover:text-slate-900 dark:hover:text-white"
                  >
                    Discard
                  </button>
                  <button
                    onClick={handleSaveAiSegment}
                    disabled={saving || aiPreviewLoading}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold cursor-pointer"
                  >
                    Confirm & Save Segment
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Traditional Segment Builder Form */}
          <div className="glass-panel p-6 rounded-xl space-y-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-500" /> Traditional
              Criteria Builder
            </h2>

            <form
              onSubmit={handleCreateManualSegment}
              className="space-y-4 text-xs"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-700 dark:text-zinc-400 font-semibold">
                    Segment Name
                  </label>
                  <input
                    type="text"
                    required
                    value={segmentName}
                    onChange={(e) => setSegmentName(e.target.value)}
                    placeholder="E.g., High-Value Churn Risk"
                    className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 placeholder-slate-400 dark:placeholder-zinc-705"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-700 dark:text-zinc-400 font-semibold">
                    Description
                  </label>
                  <input
                    type="text"
                    value={segmentDesc}
                    onChange={(e) => setSegmentDesc(e.target.value)}
                    placeholder="E.g., Purchased > ₹5,000 but inactive for 30 days"
                    className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 placeholder-slate-400 dark:placeholder-zinc-705"
                  />
                </div>
              </div>

              {/* Conditions list */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-slate-700 dark:text-zinc-400 font-semibold">
                    Conditions block
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 dark:text-zinc-500 font-bold">
                      Logical Match:
                    </span>
                    <select
                      value={logicalOp}
                      onChange={(e) => setLogicalOp(e.target.value)}
                      className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded px-2 py-0.5 text-slate-900 dark:text-white"
                    >
                      <option value="AND">AND (All match)</option>
                      <option value="OR">OR (Any matches)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  {conditions.map((cond, idx) => (
                    <div
                      key={idx}
                      className="flex gap-2 items-center flex-wrap sm:flex-nowrap"
                    >
                      {/* Field */}
                      <select
                        value={cond.field}
                        onChange={(e) =>
                          handleConditionChange(idx, "field", e.target.value)
                        }
                        className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded px-3 py-2 text-slate-900 dark:text-white flex-1 min-w-[120px] focus:outline-none focus:border-indigo-500"
                      >
                        <option value="totalSpent">Total Spent (₹)</option>
                        <option value="orderCount">Orders Placed</option>
                        <option value="lastOrderDaysAgo">Days Inactive</option>
                        <option value="city">City</option>
                        <option value="gender">Gender</option>
                      </select>

                      {/* Operator */}
                      <select
                        value={cond.operator}
                        onChange={(e) =>
                          handleConditionChange(idx, "operator", e.target.value)
                        }
                        className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded px-3 py-2 text-slate-900 dark:text-white flex-1 min-w-[120px] focus:outline-none focus:border-indigo-500"
                      >
                        <option value="gt">Greater Than (&gt;)</option>
                        <option value="lt">Less Than (&lt;)</option>
                        <option value="eq">Equals (=)</option>
                        <option value="contains">Contains (text)</option>
                      </select>

                      {/* Value Selector (Conditional Slider or Input) */}
                      {[
                        "totalSpent",
                        "orderCount",
                        "lastOrderDaysAgo",
                      ].includes(cond.field) ? (
                        <div className="flex-1 flex items-center gap-2 min-w-[180px]">
                          <input
                            type="range"
                            min={0}
                            max={
                              cond.field === "totalSpent"
                                ? 50000
                                : cond.field === "orderCount"
                                  ? 20
                                  : 180
                            }
                            step={
                              cond.field === "totalSpent"
                                ? 500
                                : cond.field === "orderCount"
                                  ? 1
                                  : 5
                            }
                            value={Number(cond.value) || 0}
                            onChange={(e) =>
                              handleConditionChange(
                                idx,
                                "value",
                                Number(e.target.value),
                              )
                            }
                            className="flex-grow h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-lg cursor-pointer accent-indigo-600"
                          />

                          <input
                            type="number"
                            value={cond.value}
                            onChange={(e) =>
                              handleConditionChange(
                                idx,
                                "value",
                                Number(e.target.value),
                              )
                            }
                            className="w-16 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded px-2 py-1 text-slate-900 dark:text-white text-center focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
                          />
                        </div>
                      ) : (
                        <input
                          type="text"
                          required
                          value={cond.value}
                          onChange={(e) =>
                            handleConditionChange(idx, "value", e.target.value)
                          }
                          placeholder="Value..."
                          className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded px-3 py-2 text-slate-900 dark:text-white flex-1 min-w-[120px] focus:outline-none focus:border-indigo-500"
                        />
                      )}

                      {/* Trash */}
                      {conditions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCondition(idx)}
                          className="p-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:border-rose-300 dark:hover:border-rose-500/30 text-slate-400 dark:text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 rounded flex-shrink-0 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleAddCondition}
                  className="px-3 py-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800/60 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white rounded flex items-center gap-1 cursor-pointer font-bold text-[10px]"
                >
                  <Plus className="w-4 h-4" /> Add Rule Condition
                </button>
              </div>

              {/* Segment Size Preview Card */}
              <div className="p-4 bg-slate-100 dark:bg-zinc-900/20 border border-slate-200 dark:border-zinc-800/60 rounded-lg flex items-center justify-between">
                <div className="space-y-1 w-full">
                  <span className="text-slate-700 dark:text-zinc-300 font-bold block uppercase text-[9px] tracking-wider">
                    Live Audience Preview
                  </span>
                  <div className="flex items-center gap-6 mt-1.5">
                    <div>
                      <span className="text-slate-500 dark:text-zinc-400 block text-[10px] font-semibold">
                        Matches Found
                      </span>
                      <span className="text-sm font-extrabold text-slate-800 dark:text-white">
                        {previewLoading ? (
                          <span className="text-slate-400 dark:text-zinc-500 text-xs font-normal">
                            Calculating...
                          </span>
                        ) : (
                          `${manualPreview.count} Customers`
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-zinc-400 block text-[10px] font-semibold">
                        Potential Revenue
                      </span>
                      <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-500">
                        {previewLoading ? (
                          <span className="text-slate-400 dark:text-zinc-500 text-xs font-normal">
                            Calculating...
                          </span>
                        ) : (
                          `₹${manualPreview.potentialRevenue.toLocaleString()}`
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving || !segmentName}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-bold cursor-pointer transition-all disabled:opacity-50 shadow-lg shadow-indigo-600/10"
              >
                {saving ? "Saving..." : "Register Segment"}
              </button>
            </form>
          </div>
        </div>

        {/* Right column: Segment List */}
        <div className="glass-panel p-6 rounded-xl space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Registered Segments
            </h2>
            <p className="text-slate-500 dark:text-zinc-500 text-xs font-semibold">
              Currently calculated shopper directories in the CRM database.
            </p>
          </div>

          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-3">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="p-4 bg-slate-50 dark:bg-zinc-900/20 border border-slate-200 dark:border-zinc-800/50 rounded-xl space-y-3 animate-pulse"
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-2 flex-grow">
                        <div className="h-4 bg-slate-200 dark:bg-zinc-800 rounded w-1/2" />
                        <div className="h-3 bg-slate-200 dark:bg-zinc-800 rounded w-2/3" />
                      </div>
                      <div className="h-5 bg-slate-200 dark:bg-zinc-800 rounded w-14" />
                    </div>
                    <div className="h-5 bg-slate-200/50 dark:bg-zinc-800/40 rounded w-full" />
                  </div>
                ))}
              </div>
            ) : segments.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 dark:bg-zinc-900/10 border border-dashed border-slate-200 dark:border-zinc-800/60 rounded-xl space-y-3 flex flex-col items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-zinc-900/50 flex items-center justify-center text-slate-400 dark:text-zinc-500 border border-slate-300 dark:border-zinc-800">
                  <Filter className="w-5 h-5 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                    No segments yet
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-zinc-500 max-w-sm">
                    Use the builder rules or AI audience planner to carve your
                    first customer segment.
                  </p>
                </div>
              </div>
            ) : (
              segments.map((seg) => (
                <div
                  key={seg.id}
                  className="p-4 bg-white dark:bg-zinc-800/5 border border-slate-200 dark:border-zinc-800/10 rounded-xl space-y-2 group hover:border-slate-300 dark:hover:border-zinc-700/30 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-indigo-500 transition-colors">
                        {seg.name}
                      </h4>
                      <p className="text-slate-500 dark:text-zinc-500 text-[10px] mt-0.5 font-medium">
                        {seg.description}
                      </p>
                    </div>
                    <span className="text-xs bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-500 border border-indigo-200 dark:border-indigo-500/20 px-2 py-0.5 rounded-full font-bold">
                      {seg.customerCount} matches
                    </span>
                  </div>

                  <div className="bg-slate-100 dark:bg-black/5 p-2 rounded text-[10px] font-mono text-slate-600 dark:text-zinc-500 overflow-x-auto whitespace-nowrap border border-slate-200 dark:border-transparent">
                    {getRuleSummary(seg.query)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
