import { ActiveTab } from '../../types';
import {
  Compass,
  Search,
  Users,
  ListMusic,
  History,
  Tv,
  ExternalLink,
  Radio,
  CheckCircle2,
  AlertCircle,
  Mic2,
} from 'lucide-react';

interface OperatorSidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  queueCount: number;
  participantsCount: number;
  isAudienceOnline: boolean;
  onOpenAudienceWindow: () => void;
}

export function OperatorSidebar({
  activeTab,
  onTabChange,
  queueCount,
  participantsCount,
  isAudienceOnline,
  onOpenAudienceWindow,
}: OperatorSidebarProps) {
  const navItems = [
    { id: 'discover' as ActiveTab, label: 'Discover', icon: Compass },
    { id: 'search' as ActiveTab, label: 'Search', icon: Search },
    {
      id: 'participants' as ActiveTab,
      label: 'Participants',
      icon: Users,
      badge: participantsCount,
    },
    {
      id: 'queue' as ActiveTab,
      label: 'Queue',
      icon: ListMusic,
      badge: queueCount,
    },
    { id: 'history' as ActiveTab, label: 'History', icon: History },
  ];

  return (
    <aside className="w-64 bg-zinc-950 border-r border-zinc-800/80 flex flex-col h-full shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-zinc-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Mic2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-wide">KARAOKE PRO</h1>
            <p className="text-[11px] font-mono text-zinc-400">Operator Dashboard</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="px-3 py-4 flex-1 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
          Menu Utama
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-amber-500/15 text-amber-300 font-semibold border border-amber-500/25'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-zinc-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-amber-500 text-zinc-950'
                      : 'bg-zinc-800 text-zinc-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Audience Screen Status Box */}
      <div className="p-3.5 m-3 rounded-2xl bg-zinc-900/70 border border-zinc-800/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tv className="w-4 h-4 text-zinc-400" />
            <span className="text-xs font-semibold text-zinc-300">Audience Screen</span>
          </div>
          <div
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              isAudienceOnline
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isAudienceOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
              }`}
            />
            {isAudienceOnline ? 'ONLINE' : 'OFFLINE'}
          </div>
        </div>

        <p className="text-[11px] text-zinc-400 leading-relaxed">
          {isAudienceOnline
            ? 'Layar panggung terhubung dan siap menerima playback.'
            : 'Buka layar Audience di jendela/tab terpisah untuk proyektor.'}
        </p>

        <button
          onClick={onOpenAudienceWindow}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Buka Audience Screen</span>
        </button>
      </div>

      {/* Footer Info */}
      <div className="p-3.5 border-t border-zinc-800/80 text-[11px] text-zinc-400 flex items-center justify-between font-mono">
        <span>No Player on Operator</span>
        <span className="text-amber-500 font-bold">100% Authoritative</span>
      </div>
    </aside>
  );
}
