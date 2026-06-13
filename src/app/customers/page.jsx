"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  Users,
  Search,
  UserPlus,
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  MapPin,
  Phone,
  X,
  Sparkle,
  UserCheck,
} from "lucide-react";

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [limit, setLimit] = useState(10);
  // Slide-over Customer 360 state
  const [selectedCust, setSelectedCust] = useState(null);

  // Importer states
  const [dragActive, setDragActive] = useState(false);
  const [csvFileContent, setCsvFileContent] = useState(null);
  const [importStatus, setImportStatus] = useState(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

  // Manual Add Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCust, setNewCust] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    gender: "Male",
  });
  const [formError, setFormError] = useState("");

  const fetchCustomers = async (query = "") => {
    try {
      const res = await fetch(
        `/api/customers?search=${encodeURIComponent(query)}`,
      );
      const data = await res.json();
      if (data.success) {
        setCustomers(data.customers);
        if (data.customers.length > 0 && !selectedCust) {
          setSelectedCust(data.customers[0]);
        }
      }
    } catch (e) {
      console.error("Error loading customers:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    fetchCustomers(debouncedSearch);
  }, [debouncedSearch]);

  // CSV Drag and Drop Handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
      setImportStatus({
        type: "error",
        message: "Only standard CSV files (.csv) are supported",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      setCsvFileContent(text);
      setImportStatus(null);
    };
    reader.readAsText(file);
  };

  const triggerImport = async () => {
    if (!csvFileContent) return;
    setImporting(true);
    setImportStatus(null);

    try {
      const res = await fetch("/api/customers/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvText: csvFileContent }),
      });
      const data = await res.json();
      if (data.success) {
        setImportStatus({
          type: "success",
          message: `Successfully imported ${data.importedCount} shoppers! (${data.errorsCount} rows skipped)`,
        });
        setCsvFileContent(null);
        fetchCustomers();
      } else {
        setImportStatus({
          type: "error",
          message: data.error || "Failed to process import",
        });
      }
    } catch (err) {
      setImportStatus({
        type: "error",
        message: err.message || "Server error occurred",
      });
    } finally {
      setImporting(false);
    }
  };

  // Manual Customer Submit
  const handleAddCustomerSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!newCust.name || !newCust.email) {
      setFormError("Name and Email are required.");
      return;
    }

    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCust),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddForm(false);
        setNewCust({
          name: "",
          email: "",
          phone: "",
          city: "",
          gender: "Male",
        });
        fetchCustomers();
      } else {
        setFormError(data.error || "Failed to create customer");
      }
    } catch (err) {
      setFormError(err.message || "Network error occurred");
    }
  };

  // Compute Tags
  const getShopperTags = (c) => {
    const tags = [];
    if (c.totalSpent > 10000)
      tags.push({
        label: "VIP",
        color:
          "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-500",
      });
    else if (c.totalSpent > 5000)
      tags.push({
        label: "High Spender",
        color:
          "bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-500",
      });

    if (c.lastOrderDaysAgo > 45 && c.lastOrderDaysAgo !== 9999)
      tags.push({
        label: "At Risk",
        color:
          "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-500 animate-pulse",
      });
    else if (c.lastOrderDaysAgo > 30 && c.lastOrderDaysAgo <= 45)
      tags.push({
        label: "Sleepy",
        color:
          "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-500",
      });
    else if (c.lastOrderDaysAgo <= 30)
      tags.push({
        label: "Active",
        color:
          "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-500",
      });

    if (c.orderCount === 0)
      tags.push({
        label: "Lead",
        color:
          "bg-zinc-500/10 border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400",
      });
    else if (c.orderCount >= 4)
      tags.push({
        label: "Frequent",
        color:
          "bg-cyan-500/10 border-cyan-500/20 text-cyan-600 dark:text-cyan-500",
      });

    return tags.slice(0, 2);
  };

  // Compute RFM Matrix Scores
  const calculateRFM = (c) => {
    let rScore = "Low Risk";
    let rColor = "text-emerald-600 dark:text-emerald-500";
    if (c.lastOrderDaysAgo === 9999) {
      rScore = "No Purchase";
      rColor = "text-slate-500 dark:text-zinc-500";
    } else if (c.lastOrderDaysAgo > 60) {
      rScore = "High Risk";
      rColor = "text-rose-600 dark:text-rose-500";
    } else if (c.lastOrderDaysAgo > 30) {
      rScore = "Medium Risk";
      rColor = "text-amber-600 dark:text-amber-500";
    }

    let fScore = "Low Loyalty";
    let fColor = "text-slate-500 dark:text-zinc-500";
    if (c.orderCount >= 5) {
      fScore = "VIP Loyal";
      fColor = "text-indigo-600 dark:text-indigo-400";
    } else if (c.orderCount >= 2) {
      fScore = "Active Shopper";
      fColor = "text-emerald-600 dark:text-emerald-500";
    }

    let mScore = "Low LTV";
    let mColor = "text-slate-500 dark:text-zinc-500";
    if (c.totalSpent > 10000) {
      mScore = "High Value";
      mColor = "text-amber-600 dark:text-amber-500";
    } else if (c.totalSpent > 3000) {
      mScore = "Mid Value";
      mColor = "text-emerald-600 dark:text-emerald-500";
    }

    return {
      recency: { label: rScore, color: rColor },
      frequency: { label: fScore, color: fColor },
      monetary: { label: mScore, color: mColor },
    };
  };

  // Simulated AI insights per customer profile
  const getProfileAIInsights = (c) => {
    if (c.orderCount === 0) {
      return {
        recChannel: "EMAIL",
        suggest:
          "Send welcome offer email with 15% discount preset to convert lead.",
        openRate: "45%",
      };
    }
    if (c.lastOrderDaysAgo > 45) {
      return {
        recChannel: "WHATSAPP",
        suggest:
          "Customer is churning. Trigger WhatsApp win-back message with code BACK20.",
        openRate: "88%",
      };
    }
    if (c.totalSpent > 10000) {
      return {
        recChannel: "WHATSAPP",
        suggest:
          "VIP spender. Recommend loyalty preview invitation or wallet credit coupon.",
        openRate: "92%",
      };
    }
    return {
      recChannel: "SMS",
      suggest: "Steady engagement. Recommend seasonal flash deal SMS campaign.",
      openRate: "75%",
    };
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            Customer Directory <Users className="w-8 h-8 text-indigo-500" />
          </h1>
          <p className="text-slate-500 dark:text-zinc-400 text-xs mt-1 font-medium">
            Manage, filter, search, and audit shopper profiles and campaign
            histories.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-indigo-600/10"
          >
            <UserPlus className="w-4 h-4" /> Add Shopper
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Customer Directory Table (2/3 width) */}
        <div className="glass-panel rounded-xl lg:col-span-2 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-100/60 dark:bg-zinc-800/5 border border-slate-200 dark:border-zinc-800/10 rounded-lg px-4 py-2">
            <div className="flex items-center gap-3 w-full sm:w-2/3">
              <Search className="w-5 h-5 text-slate-400 dark:text-zinc-500 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search by name, email, or city..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent border-0 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 text-xs focus:outline-none w-full"
              />
            </div>
            <div className="flex items-center gap-3 w-full sm:w-1/3 justify-end text-xs font-semibold text-slate-700 dark:text-zinc-400">
              <span className="whitespace-nowrap">Show: <strong className="text-indigo-650 dark:text-indigo-400">{limit}</strong> rows</span>
              <input
                type="range"
                min="5"
                max="50"
                step="5"
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="w-24 sm:w-32 h-1 bg-slate-200 dark:bg-zinc-800 rounded-lg cursor-pointer accent-indigo-600"
              />
            </div>
          </div>

          <div className="overflow-x-auto max-h-[500px] overflow-y-auto pr-1">
            {loading ? (
              <div className="flex items-center justify-center h-80">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : customers.length > 0 ? (
              <table className="w-full text-left border-collapse table-fixed">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-zinc-800/20 text-[10.5px] font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider bg-slate-100/50 dark:bg-zinc-800/20">
                    <th className="py-3 px-4 w-[35%] text-left">Shopper</th>
                    <th className="py-3 px-4 w-[27%] text-left">
                      Segment Category
                    </th>
                    <th className="py-3 px-4 w-[15%] text-right">
                      LTV (Spent)
                    </th>
                    <th className="py-3 px-4 w-[10%] text-center">Orders</th>
                    <th className="py-3 px-4 w-[13%] text-center">
                      Last Purchase
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/10 text-xs">
                  {customers.slice(0, limit).map((c) => {
                    const tags = getShopperTags(c);
                    const isSelected = selectedCust?.id === c.id;

                    return (
                      <tr
                        key={c.id}
                        onClick={() => setSelectedCust(c)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-indigo-500/5 dark:bg-indigo-500/10 border-l-2 border-indigo-500"
                            : "hover:bg-slate-50 dark:hover:bg-zinc-800/5"
                        }`}
                      >
                        <td className="py-3 px-4 text-left">
                          <div className="truncate">
                            <p className="font-bold text-slate-900 dark:text-white truncate">
                              {c.name}
                            </p>
                            <p className="text-[10px] text-slate-500 dark:text-zinc-400 truncate">
                              {c.email}
                            </p>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-left">
                          <div className="flex gap-1.5 flex-wrap">
                            {tags.map((t, i) => (
                              <span
                                key={i}
                                className={`text-[8.5px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${t.color}`}
                              >
                                {t.label}
                              </span>
                            ))}
                          </div>
                        </td>

                        <td className="py-3 px-4 text-right font-extrabold text-emerald-600 dark:text-emerald-500">
                          ₹{c.totalSpent.toLocaleString("en-IN")}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-slate-800 dark:text-zinc-300">
                          {c.orderCount}
                        </td>
                        <td className="py-3 px-4 text-center text-slate-500 dark:text-zinc-400">
                          {c.lastOrderDaysAgo === 9999 ? (
                            <span className="text-slate-400 dark:text-zinc-500">
                              Never
                            </span>
                          ) : c.lastOrderDaysAgo === 0 ? (
                            <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                              Today
                            </span>
                          ) : (
                            <span>{c.lastOrderDaysAgo}d ago</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center h-80 text-center space-y-2">
                <Users className="w-12 h-12 text-slate-400" />
                <p className="text-slate-800 dark:text-zinc-400 font-bold">
                  No customers found
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right column: Customer 360° Profile View (1/3 width) */}
        <div className="space-y-6 self-start">
          {selectedCust ? (
            /* Customer 360 detail panel */
            <div className="glass-panel p-6 rounded-xl space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">
                    Customer 360° View
                  </h2>
                  <p className="text-slate-500 dark:text-zinc-400 text-[10px] uppercase font-bold tracking-wider mt-0.5">
                    Profile Diagnostics
                  </p>
                </div>
                <UserCheck className="w-5 h-5 text-indigo-500" />
              </div>

              {/* Shopper Card */}
              <div className="p-4 bg-slate-50 dark:bg-zinc-800/10 border border-slate-200 dark:border-zinc-800/20 rounded-xl space-y-3">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-800 dark:text-white">
                    {selectedCust.name}
                  </h3>
                  <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5">
                    {selectedCust.email}
                  </p>
                </div>

                <div className="space-y-1.5 text-[10px] text-slate-500 dark:text-zinc-500 border-t border-slate-200 dark:border-zinc-800/10 pt-2.5">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" /> {selectedCust.city}
                  </div>
                  {selectedCust.phone && selectedCust.phone !== "N/A" && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" /> {selectedCust.phone}
                    </div>
                  )}
                </div>
              </div>

              {/* RFM Diagnostics */}
              <div className="space-y-2">
                <h4 className="font-bold text-[10px] uppercase text-slate-500 dark:text-zinc-400 tracking-wider">
                  RFM Lifecycle Scoring
                </h4>

                <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                  {/* Recency */}
                  <div className="p-2 bg-slate-100/60 dark:bg-zinc-800/5 border border-slate-200 dark:border-zinc-800/10 rounded-lg space-y-1">
                    <span className="text-[8px] text-slate-500 dark:text-zinc-500 font-bold block uppercase">
                      Recency
                    </span>
                    <span
                      className={`font-bold ${calculateRFM(selectedCust).recency.color}`}
                    >
                      {calculateRFM(selectedCust).recency.label}
                    </span>
                  </div>
                  {/* Frequency */}
                  <div className="p-2 bg-slate-100/60 dark:bg-zinc-800/5 border border-slate-200 dark:border-zinc-800/10 rounded-lg space-y-1">
                    <span className="text-[8px] text-slate-500 dark:text-zinc-500 font-bold block uppercase">
                      Frequency
                    </span>
                    <span
                      className={`font-bold ${calculateRFM(selectedCust).frequency.color}`}
                    >
                      {calculateRFM(selectedCust).frequency.label}
                    </span>
                  </div>
                  {/* Monetary */}
                  <div className="p-2 bg-slate-100/60 dark:bg-zinc-800/5 border border-slate-200 dark:border-zinc-800/10 rounded-lg space-y-1">
                    <span className="text-[8px] text-slate-500 dark:text-zinc-500 font-bold block uppercase">
                      Monetary
                    </span>
                    <span
                      className={`font-bold ${calculateRFM(selectedCust).monetary.color}`}
                    >
                      {calculateRFM(selectedCust).monetary.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Engagement Insights */}
              <div className="space-y-2">
                <h4 className="font-bold text-[10px] uppercase text-slate-500 dark:text-zinc-400 tracking-wider">
                  Predicted Channel Engagement
                </h4>

                <div className="p-3.5 bg-slate-50 dark:bg-zinc-800/10 border border-slate-200 dark:border-zinc-800/20 rounded-xl space-y-2.5 text-[10px]">
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-500 dark:text-zinc-500">
                      Suggested Channel:
                    </span>
                    <span className="text-indigo-600 dark:text-indigo-500 font-extrabold uppercase">
                      {getProfileAIInsights(selectedCust).recChannel}
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-500 dark:text-zinc-500">
                      Predicted Open Rate:
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-500 font-bold">
                      {getProfileAIInsights(selectedCust).openRate}
                    </span>
                  </div>
                </div>
              </div>

              {/* AI Campaign Insights */}
              <div className="p-4 bg-indigo-500/5 border border-indigo-500/15 text-indigo-600 dark:text-indigo-300 rounded-xl space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-[10px] uppercase tracking-wider text-indigo-500">
                  <Sparkle className="w-4 h-4 animate-pulse" /> Copilot Insights
                </div>
                <p className="text-[11px] leading-relaxed font-semibold">
                  {getProfileAIInsights(selectedCust).suggest}
                </p>
              </div>
            </div>
          ) : (
            <div className="glass-panel p-6 rounded-xl text-center text-slate-500 dark:text-zinc-500 text-xs">
              Select a customer profile to view 360° diagnostics.
            </div>
          )}

          {/* CSV Auto-Importer */}
          <div className="glass-panel p-6 rounded-xl space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-indigo-500" /> CSV
                Auto-Importer
              </h2>
              <p className="text-slate-500 dark:text-zinc-500 text-xs mt-1">
                Ingest shopper databases. Spent values automatically create
                matching transaction records.
              </p>
            </div>

            {/* Drag Drop Zone */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200 ${
                dragActive
                  ? "border-indigo-500 bg-indigo-500/5"
                  : "border-slate-200 dark:border-zinc-800/50 hover:border-slate-300 dark:hover:border-zinc-700/80 hover:bg-slate-50 dark:hover:bg-zinc-900/10"
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".csv"
                className="hidden"
              />

              <Upload className="w-8 h-8 text-slate-400 dark:text-zinc-500 mx-auto mb-3" />
              <p className="text-xs font-bold text-slate-700 dark:text-zinc-400">
                Drag & drop CSV customer file
              </p>
              <p className="text-[10px] text-slate-500 dark:text-zinc-500 mt-1">
                or browse local documents
              </p>
            </div>

            {/* CSV Template Preview */}
            <div className="bg-slate-100 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800/30 rounded p-3 text-[10px] font-mono text-slate-700 dark:text-zinc-400 leading-relaxed">
              <span className="text-indigo-600 dark:text-indigo-400 font-bold uppercase block text-[9px] tracking-wider mb-1">
                CSV Column headers required:
              </span>
              name,email,total_spent,phone,city,gender
              <br />
              Vani Malhotra,vani@gmail.com,15000,9876543210,Mumbai,Female
            </div>

            {csvFileContent && (
              <div className="space-y-3">
                <div className="p-3 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
                    <span className="text-xs text-slate-800 dark:text-white font-medium">
                      Ready to import
                    </span>
                  </div>
                  <button
                    onClick={() => setCsvFileContent(null)}
                    className="text-zinc-500 hover:text-zinc-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={triggerImport}
                  disabled={importing}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
                >
                  {importing ? "Processing CSV..." : "Process & Ingest"}
                </button>
              </div>
            )}

            {importStatus && (
              <div
                className={`p-4 rounded-lg flex items-start gap-3 border ${
                  importStatus.type === "success"
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                    : "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400"
                }`}
              >
                {importStatus.type === "success" ? (
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                )}
                <span className="text-xs leading-relaxed">
                  {importStatus.message}
                </span>
              </div>
            )}
          </div>

          {/* Quick Manual Entry Form Modal Overlay */}
          {showAddForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 transition-all duration-200">
              <div className="w-full max-w-md bg-white dark:bg-zinc-950 border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl p-6 relative shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-350 hover:bg-slate-100 dark:hover:bg-zinc-900/60 transition-colors cursor-pointer"
                  aria-label="Close modal"
                >
                  <X className="w-4 h-4" />
                </button>
                
                <div className="space-y-1">
                  <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-indigo-500" /> Add New Shopper
                  </h2>
                  <p className="text-slate-500 dark:text-zinc-450 text-xs">
                    Create a new shopper profile manually in your CRM database.
                  </p>
                </div>

                {formError && (
                  <div className="p-3.5 bg-rose-500/10 border border-rose-500/15 rounded-xl text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2 font-medium">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" /> {formError}
                  </div>
                )}

                <form
                  onSubmit={handleAddCustomerSubmit}
                  className="space-y-4 text-xs mt-2"
                >
                  <div className="space-y-1.5">
                    <label className="text-slate-700 dark:text-zinc-350 font-bold">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={newCust.name}
                      onChange={(e) =>
                        setNewCust({ ...newCust, name: e.target.value })
                      }
                      className="w-full bg-white dark:bg-zinc-900 border border-slate-205 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors text-xs"
                      placeholder="E.g., Vani Malhotra"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-700 dark:text-zinc-350 font-bold">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={newCust.email}
                      onChange={(e) =>
                        setNewCust({ ...newCust, email: e.target.value })
                      }
                      className="w-full bg-white dark:bg-zinc-900 border border-slate-205 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors text-xs"
                      placeholder="E.g., vani@gmail.com"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-700 dark:text-zinc-350 font-bold">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={newCust.phone}
                      onChange={(e) =>
                        setNewCust({ ...newCust, phone: e.target.value })
                      }
                      className="w-full bg-white dark:bg-zinc-900 border border-slate-205 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors text-xs"
                      placeholder="E.g., 9876543210"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-slate-700 dark:text-zinc-355 font-bold">
                        City
                      </label>
                      <input
                        type="text"
                        value={newCust.city}
                        onChange={(e) =>
                          setNewCust({ ...newCust, city: e.target.value })
                        }
                        className="w-full bg-white dark:bg-zinc-900 border border-slate-205 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors text-xs"
                        placeholder="E.g., Mumbai"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-slate-700 dark:text-zinc-355 font-bold">
                        Gender
                      </label>
                      <select
                        value={newCust.gender}
                        onChange={(e) =>
                          setNewCust({ ...newCust, gender: e.target.value })
                        }
                        className="w-full bg-white dark:bg-zinc-900 border border-slate-205 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors text-xs cursor-pointer"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full mt-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold cursor-pointer transition-all shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-1.5"
                  >
                    Save Shopper Profile
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
