export default function Loading() {
  return (
    <div className="w-full min-h-[50vh] flex flex-col items-center justify-center space-y-6">
      {/* Top linear progress indicator */}
      <div className="fixed top-0 left-0 w-full h-[3px] bg-slate-200 dark:bg-zinc-850 overflow-hidden z-[9999]">
        <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 animate-loading-bar"></div>
      </div>
      
      {/* Central Premium Glowing Spinner */}
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-indigo-500/10 dark:border-indigo-500/5"></div>
        <div className="absolute inset-0 rounded-full border-4 border-t-indigo-500 border-r-cyan-400 animate-spin"></div>
        <div className="absolute inset-3 rounded-full bg-indigo-500/10 blur-[8px] animate-pulse"></div>
      </div>
      
      {/* Loading Text */}
      <div className="text-center space-y-1">
        <p className="text-sm font-bold text-slate-800 dark:text-zinc-200 tracking-wide">
          Syncing workspace data...
        </p>
        <p className="text-[10px] text-indigo-500 font-extrabold uppercase tracking-widest animate-pulse">
          AI CRM Core Engine
        </p>
      </div>
    </div>
  );
}
