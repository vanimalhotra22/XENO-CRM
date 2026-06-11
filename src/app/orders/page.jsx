"use client";

import React, { useEffect, useState } from "react";
import {
  ShoppingBag,
  User,
  Package,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ShoppingCart,
} from "lucide-react";

const PRODUCT_PRESETS = [
  { name: "Oversized Cotton Hoodie", price: 2200 },
  { name: "Classic Leather Boots", price: 4500 },
  { name: "V-Neck Summer Dress", price: 1800 },
  { name: "Ceramic Coffee Mug", price: 650 },
  { name: "Bluetooth Running Earbuds", price: 3200 },
  { name: "Gourmet Coffee Beans 1kg", price: 1200 },
  { name: "VIP Smartwatch Pro", price: 12500 },
];

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState(10);

  // Simulator Form States
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);
  const [customAmount, setCustomAmount] = useState("");
  const [customItemName, setCustomItemName] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [simStatus, setSimStatus] = useState(null);

  const fetchOrdersAndCustomers = async () => {
    try {
      const ordRes = await fetch("/api/orders");
      const ordData = await ordRes.json();
      const custRes = await fetch("/api/customers");
      const custData = await custRes.json();

      if (ordData.success) {
        setOrders(ordData.orders);
      }
      if (custData.success && custData.customers.length > 0) {
        setCustomers(custData.customers);
        setSelectedCustomerId(custData.customers[0].id);
      }
    } catch (e) {
      console.error("Error fetching orders:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrdersAndCustomers();
  }, []);

  const parseItems = (itemsStr) => {
    try {
      return JSON.parse(itemsStr);
    } catch (e) {
      return [{ name: itemsStr, quantity: 1, price: 0 }];
    }
  };

  // Submit simulated checkout
  const handleSimulateCheckout = async (e) => {
    e.preventDefault();
    if (!selectedCustomerId || simulating) return;

    setSimulating(true);
    setSimStatus(null);

    const amount = useCustom
      ? parseFloat(customAmount)
      : PRODUCT_PRESETS[selectedPresetIndex].price;
    const items = useCustom
      ? [
          {
            name: customItemName || "Simulated Product",
            quantity: 1,
            price: parseFloat(customAmount),
          },
        ]
      : [
          {
            name: PRODUCT_PRESETS[selectedPresetIndex].name,
            quantity: 1,
            price: PRODUCT_PRESETS[selectedPresetIndex].price,
          },
        ];

    if (isNaN(amount) || amount <= 0) {
      setSimStatus({
        type: "error",
        message: "Please enter a valid purchase amount.",
      });
      setSimulating(false);
      return;
    }

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedCustomerId,
          amount,
          items,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSimStatus({
          type: "success",
          message: `Order placed! Attributed to campaigns of targeted shopper.`,
        });
        // Clear inputs if custom
        if (useCustom) {
          setCustomAmount("");
          setCustomItemName("");
        }
        // Reload order log
        const ordRes = await fetch("/api/orders");
        const ordData = await ordRes.json();
        if (ordData.success) setOrders(ordData.orders);
      } else {
        setSimStatus({
          type: "error",
          message: data.error || "Failed to place mock order",
        });
      }
    } catch (err) {
      setSimStatus({
        type: "error",
        message: err.message || "Server network error",
      });
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
          Order Transactions <ShoppingBag className="w-8 h-8 text-indigo-500" />
        </h1>
        <p className="text-slate-500 dark:text-zinc-400 text-xs mt-1 font-medium">
          Logs of all shopper purchases, basket contents, and delivery tracking
          status.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column: Orders Table Panel */}
        <div className="glass-panel rounded-xl lg:col-span-2 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/60 dark:border-zinc-800/15 pb-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Purchase History Ledger
            </h2>
            <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 dark:text-zinc-400">
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
            ) : orders.length > 0 ? (
              <table className="w-full text-left border-collapse table-fixed">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-zinc-800/20 text-[10.5px] font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider bg-slate-100/50 dark:bg-zinc-800/20">
                    <th className="py-3 px-4 w-[12%] text-left">Order ID</th>
                    <th className="py-3 px-4 w-[25%] text-left">Customer</th>
                    <th className="py-3 px-4 w-[30%] text-left">
                      Items Purchased
                    </th>
                    <th className="py-3 px-4 w-[11%] text-right">Amount</th>
                    <th className="py-3 px-4 w-[11%] text-center">Status</th>
                    <th className="py-3 px-4 w-[11%] text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/10 text-xs">
                  {orders.slice(0, limit).map((o) => {
                    const items = parseItems(o.items);
                    return (
                      <tr
                        key={o.id}
                        className="hover:bg-slate-50 dark:hover:bg-zinc-800/5 transition-colors"
                      >
                        <td className="py-3 px-4 text-left">
                          <code className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">
                            {o.id.substring(0, 8)}
                          </code>
                        </td>

                        <td className="py-3 px-4 text-left">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-200/50 dark:bg-zinc-800/10 border border-slate-200 dark:border-zinc-700/10 flex items-center justify-center text-[10px] text-slate-500 dark:text-zinc-400 flex-shrink-0">
                              <User className="w-3.5 h-3.5" />
                            </div>
                            <div className="truncate">
                              <p className="font-bold text-slate-900 dark:text-white truncate">
                                {o.customer?.name || "Unknown"}
                              </p>
                              <p className="text-[10px] text-slate-500 dark:text-zinc-400 truncate">
                                {o.customer?.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-left max-w-xs">
                          <div className="space-y-1">
                            {items.map((item, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-1 text-xs text-slate-700 dark:text-zinc-400"
                              >
                                <Package className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-600 flex-shrink-0" />
                                <span className="font-semibold text-slate-800 dark:text-zinc-300 truncate">
                                  {item.name}
                                </span>
                                <span className="text-slate-500 dark:text-zinc-500">
                                  x{item.quantity}
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>

                        <td className="py-3 px-4 text-right font-extrabold text-emerald-600 dark:text-emerald-500">
                          ₹{o.amount.toLocaleString("en-IN")}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                              o.status === "DELIVERED"
                                ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-500"
                                : "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-500"
                            }`}
                          >
                            {o.status === "DELIVERED" ? (
                              <CheckCircle2 className="w-3 h-3" />
                            ) : (
                              <XCircle className="w-3 h-3" />
                            )}
                            {o.status}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right text-[10px] text-slate-500 dark:text-zinc-400">
                          <div className="flex items-center justify-end gap-1 font-semibold">
                            {new Date(o.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center h-80 text-center space-y-2">
                <ShoppingBag className="w-12 h-12 text-slate-400" />
                <p className="text-slate-800 dark:text-zinc-400 font-semibold">
                  No transactions recorded
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right column: Interactive Checkout Simulator */}
        <div className="glass-panel p-6 rounded-xl space-y-6 self-start">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-indigo-500" /> Checkout
              Simulator
            </h2>
            <p className="text-slate-500 dark:text-zinc-500 text-xs mt-1">
              Place simulated orders for customers. If they were targeted in
              active campaigns, conversion stats & attributed revenue will
              update instantly.
            </p>
          </div>

          <form onSubmit={handleSimulateCheckout} className="space-y-4 text-xs">
            {/* Customer Dropdown */}
            <div className="space-y-1">
              <label className="text-slate-700 dark:text-zinc-400 font-semibold">
                Select Customer
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              >
                {customers.map((c) => (
                  <option
                    key={c.id}
                    value={c.id}
                    className="text-slate-900 dark:text-white"
                  >
                    {c.name} ({c.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Custom vs Preset Toggle */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setUseCustom(false)}
                className={`flex-1 py-1.5 rounded text-center border text-[11px] font-bold transition-colors cursor-pointer ${
                  !useCustom
                    ? "bg-indigo-600 border-indigo-500 text-white"
                    : "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Presets
              </button>
              <button
                type="button"
                onClick={() => setUseCustom(true)}
                className={`flex-1 py-1.5 rounded text-center border text-[11px] font-bold transition-colors cursor-pointer ${
                  useCustom
                    ? "bg-indigo-600 border-indigo-500 text-white"
                    : "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Custom
              </button>
            </div>

            {!useCustom ? (
              /* Presets Selector */
              <div className="space-y-1">
                <label className="text-slate-700 dark:text-zinc-400 font-semibold">
                  Select Product Preset
                </label>
                <select
                  value={selectedPresetIndex}
                  onChange={(e) =>
                    setSelectedPresetIndex(parseInt(e.target.value))
                  }
                  className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                >
                  {PRODUCT_PRESETS.map((p, idx) => (
                    <option
                      key={idx}
                      value={idx}
                      className="text-slate-900 dark:text-white"
                    >
                      {p.name} (₹{p.price.toLocaleString("en-IN")})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              /* Custom Inputs */
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-slate-700 dark:text-zinc-400 font-semibold">
                    Product Name
                  </label>
                  <input
                    type="text"
                    required
                    value={customItemName}
                    onChange={(e) => setCustomItemName(e.target.value)}
                    placeholder="E.g., Winter Wool Coat"
                    className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-700 dark:text-zinc-400 font-semibold">
                    Checkout Amount (₹)
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-slate-400 dark:text-zinc-500 font-bold">
                      ₹
                    </span>
                    <input
                      type="number"
                      required
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      placeholder="Amount..."
                      className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded pl-7 pr-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Simulating Output Alerts */}
            {simStatus && (
              <div
                className={`p-3 rounded border flex items-start gap-2 ${
                  simStatus.type === "success"
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-500"
                    : "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-500"
                }`}
              >
                {simStatus.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600 dark:text-rose-500" />
                )}
                <span className="leading-relaxed">{simStatus.message}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={simulating}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-bold cursor-pointer disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/10"
            >
              <ShoppingCart className="w-4 h-4" />{" "}
              {simulating ? "Processing Checkout..." : "Place Simulated Order"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
