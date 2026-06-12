'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/components/ThemeContext';
import { useAuth } from '@/components/AuthGuard';
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  Filter,
  Send,
  BarChart3,
  Sparkles,
  RefreshCw,
  Cpu,
  Sun,
  Moon,
  LogOut,
  Menu,
  X
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [channelStatus, setChannelStatus] = useState('checking');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Check Channel Service Health periodically
  const checkChannelHealth = async () => {
    try {
      const channelServiceUrl = process.env.NEXT_PUBLIC_CHANNEL_SERVICE_URL || 'http://localhost:3001';
      const res = await fetch(`${channelServiceUrl}/health`, {
        mode: 'cors',
        signal: AbortSignal.timeout(2000)
      });
      if (res.ok) {
        setChannelStatus('online');
      } else {
        setChannelStatus('offline');
      }
    } catch (err) {
      setChannelStatus('offline');
    }
  };

  useEffect(() => {
    checkChannelHealth();
    const interval = setInterval(checkChannelHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  // Close mobile menu on path changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Customers', path: '/customers', icon: Users },
    { name: 'Orders', path: '/orders', icon: ShoppingBag },
    { name: 'Segments', path: '/segments', icon: Filter },
    { name: 'Campaigns', path: '/campaigns', icon: Send },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'AI Copilot', path: '/ai-copilot', icon: Sparkles, badge: 'Agent' },
  ];

  const publicNavItems = [
    { name: 'Home', path: '/' },
    { name: 'Features', path: '/#features' },
    { name: 'Architecture', path: '/#architecture' },
    { name: 'AI Planner', path: '/#ai' }
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 dark:border-zinc-800/60 bg-white/70 dark:bg-[#060913]/70 backdrop-blur-md transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-4 xl:gap-8 flex-shrink-0">
            <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
              <div className="p-1.5 bg-indigo-600/10 rounded-lg border border-indigo-500/30 group-hover:scale-105 transition-transform duration-200 flex-shrink-0">
                <Cpu className="w-5 h-5 text-indigo-500" />
              </div>
              <div className="flex flex-col flex-shrink-0">
                <span className="font-extrabold text-sm tracking-wide text-slate-900 dark:text-white leading-none whitespace-nowrap">Xeno CRM</span>
                <span className="text-[9px] text-indigo-500 font-extrabold tracking-widest uppercase whitespace-nowrap mt-0.5">AI-Native</span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            {user && (
              <nav className="hidden xl:flex items-center space-x-1">
                {navItems.map((item) => {
                  const isActive = pathname === item.path;
                  return (
                    <Link
                      key={item.name}
                      href={item.path}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 ${
                        isActive
                          ? 'bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 font-bold border-b-2 border-indigo-500 dark:border-indigo-500 rounded-b-none'
                          : 'hover:bg-slate-100 dark:hover:bg-zinc-800/10 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <item.icon className="w-3.5 h-3.5" />
                      <span>{item.name}</span>
                      {item.badge && (
                        <span className="text-[8px] bg-indigo-500/20 text-indigo-500 px-1 py-0.2 rounded font-bold uppercase tracking-wider scale-90">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            )}

            {!user && (
              <nav className="hidden md:flex items-center space-x-6">
                {publicNavItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.path}
                    className="text-xs font-bold text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    {item.name}
                  </Link>
                ))}
              </nav>
            )}
          </div>

          {/* Right Header Options */}
          <div className="flex items-center gap-4">
            {/* Health / System Status */}
            {user && (
              <div className="hidden sm:flex items-center gap-2 bg-slate-100/60 dark:bg-zinc-900/40 border border-slate-200/50 dark:border-zinc-800/50 rounded-lg px-2.5 py-1 text-[10.5px]">
                <span className="text-slate-500 dark:text-zinc-500 font-medium">Channel Simulator:</span>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  channelStatus === 'online' ? 'bg-emerald-500 animate-pulse' :
                  channelStatus === 'offline' ? 'bg-rose-500' : 'bg-amber-500'
                }`} />
                <span className={`font-bold capitalize ${
                  channelStatus === 'online' ? 'text-emerald-500' :
                  channelStatus === 'offline' ? 'text-rose-500' : 'text-amber-500'
                }`}>
                  {channelStatus === 'checking' ? '...' : channelStatus}
                </span>
              </div>
            )}

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900/60 dark:hover:bg-zinc-900 border border-slate-200/50 dark:border-zinc-800/50 rounded-lg cursor-pointer transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-500" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-500" />
              )}
            </button>

            {/* Auth Buttons */}
            {user ? (
              <div className="flex items-center gap-3">
                <span className="hidden md:inline text-[11px] font-bold text-slate-700 dark:text-zinc-300">
                  Hi, <span className="text-indigo-600 dark:text-indigo-400">{user.name.split(' ')[0]}</span>
                </span>
                <button
                  onClick={logout}
                  className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/25 text-rose-500 border border-rose-500/20 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <Link
                href="/dashboard"
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-extrabold shadow-md shadow-indigo-600/10 hover:scale-102 transition-all cursor-pointer"
              >
                Launch App
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            {user && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="xl:hidden p-2 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {user && mobileMenuOpen && (
        <div className="xl:hidden border-t border-slate-200/80 dark:border-zinc-800/80 bg-white dark:bg-[#060913] px-4 py-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.name}
                href={item.path}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 font-bold border-l-2 border-indigo-500'
                    : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/20'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.name}</span>
                {item.badge && (
                  <span className="ml-auto text-[8px] bg-indigo-500/20 text-indigo-500 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
          
          {/* Mobile Status Bar */}
          <div className="border-t border-slate-200/60 dark:border-zinc-850 pt-3 mt-2 flex items-center justify-between px-4 text-xs">
            <span className="text-slate-500">Channel Status</span>
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${
                channelStatus === 'online' ? 'bg-emerald-500 animate-pulse' :
                channelStatus === 'offline' ? 'bg-rose-500' : 'bg-amber-500'
              }`} />
              <span className={`font-bold capitalize ${
                channelStatus === 'online' ? 'text-emerald-500' :
                channelStatus === 'offline' ? 'text-rose-500' : 'text-amber-500'
              }`}>
                {channelStatus}
              </span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
