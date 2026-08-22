import React, { useState } from 'react';
import { ActiveTab, PlayerState, Track } from '../types';
import { Search, Sparkles, FolderHeart, Activity, Plus, Menu, X, History, Radio } from 'lucide-react';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  playerState: PlayerState;
  favoritesCount: number;
  onOpenImportModal: () => void;
  onOpenRecentlyPlayed: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  playerState,
  favoritesCount,
  onOpenImportModal,
  onOpenRecentlyPlayed
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const historyCount = playerState?.history?.length || 0;

  const navItems = [
    { id: 'home' as ActiveTab, label: 'SEARCH', icon: Search },
    { id: 'recommended' as ActiveTab, label: 'RECOMMENDED', icon: Sparkles },
    { id: 'library' as ActiveTab, label: `LIBRARY ${favoritesCount > 0 ? `[${favoritesCount}]` : ''}`, icon: FolderHeart },
    { id: 'visualizer' as ActiveTab, label: 'KINETIC', icon: Activity }
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white/[0.08] backdrop-blur-2xl border-b border-white/20 transition-colors shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Brand Logo & Live Engine Badge */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          <button
            id="nav-brand-logo"
            onClick={() => setActiveTab('home')}
            className="flex items-center space-x-3 text-left group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-white text-black flex items-center justify-center font-display font-black text-sm tracking-tighter transition-all group-hover:scale-105 group-hover:bg-[#E2FF66] shadow-md">
              ifu
            </div>
            <div>
              <span className="font-display font-black text-xl tracking-tight text-white block leading-none group-hover:text-[#E2FF66] transition-colors drop-shadow-sm">
                ifu listener
              </span>
              <span className="font-mono text-[9px] tracking-[0.25em] text-neutral-300 block mt-0.5 uppercase font-medium">
                SONIC EXPLORATION ENGINE
              </span>
            </div>
          </button>

          {/* Live Status Pill */}
          <div className="hidden lg:flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 border border-white/20">
            <span
              className={`w-2 h-2 rounded-full ${
                playerState?.isPlaying ? 'bg-[#E2FF66] animate-ping' : 'bg-neutral-400'
              }`}
            />
            <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-200 font-semibold">
              {playerState?.isPlaying
                ? 'STREAMING // LIVE'
                : playerState?.status === 'buffering'
                ? 'SYNCING...'
                : 'STANDBY'}
            </span>
          </div>
        </div>

        {/* Desktop Navigation Tabs (Visible Top Nav) */}
        <nav className="hidden md:flex items-center space-x-1 bg-white/10 p-1.5 rounded-full border border-white/20 shadow-inner">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id || (item.id === 'library' && (activeTab === 'playlists' || activeTab === 'favorites'));
            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full font-mono text-xs tracking-wider transition-all duration-300 cursor-pointer ${
                  isActive
                    ? 'bg-white text-black font-bold shadow-md scale-[1.02]'
                    : 'text-neutral-200 hover:text-white hover:bg-white/15'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-black' : 'text-neutral-300'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Header Actions: Recently Played + Import YouTube Playlist */}
        <div className="hidden md:flex items-center space-x-2.5">
          {/* Recently Played Button directly in top nav */}
          <button
            id="nav-btn-recently-played"
            onClick={onOpenRecentlyPlayed}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white font-mono text-xs tracking-wider border border-white/20 hover:border-white/40 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm cursor-pointer"
            title="Open Recently Played History"
          >
            <History className="w-3.5 h-3.5 text-[#E2FF66]" />
            <span>RECENTLY PLAYED {historyCount > 0 ? `(${historyCount})` : ''}</span>
          </button>

          {/* Import Playlist Button */}
          <button
            id="btn-import-yt-playlist"
            onClick={onOpenImportModal}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white font-mono text-xs tracking-wider border border-white/20 hover:border-white/40 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-white" />
            <span>IMPORT</span>
          </button>
        </div>

        {/* Mobile Action Controls */}
        <div className="flex md:hidden items-center space-x-2">
          <button
            id="btn-mobile-recent"
            onClick={onOpenRecentlyPlayed}
            className="min-w-[42px] min-h-[42px] flex items-center justify-center p-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white border border-white/20 transition-all cursor-pointer"
            title="Recently Played"
          >
            <History className="w-4 h-4 text-[#E2FF66]" />
          </button>

          <button
            id="btn-mobile-import"
            onClick={onOpenImportModal}
            className="min-w-[42px] min-h-[42px] flex items-center justify-center p-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white border border-white/20 transition-all cursor-pointer"
            title="Import YouTube Playlist"
          >
            <Plus className="w-4 h-4 text-white" />
          </button>

          <button
            id="btn-mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="min-w-[42px] min-h-[42px] flex items-center justify-center p-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white border border-white/20 transition-all cursor-pointer"
            title="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>

      </div>

      {/* Mobile Drawer (White Glass) */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white/[0.14] backdrop-blur-2xl border-b border-white/20 px-4 py-4 space-y-2 animate-in slide-in-from-top duration-200 shadow-2xl text-white">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id || (item.id === 'library' && (activeTab === 'playlists' || activeTab === 'favorites'));
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full min-h-[48px] flex items-center space-x-3 px-4 py-3 rounded-xl font-mono text-xs tracking-wider transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white text-black font-bold shadow-md'
                    : 'text-neutral-100 hover:text-white bg-white/10 hover:bg-white/20 border border-white/15'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="font-bold">{item.label}</span>
              </button>
            );
          })}

          <div className="pt-2 border-t border-white/15 space-y-2">
            <button
              onClick={() => {
                onOpenRecentlyPlayed();
                setMobileMenuOpen(false);
              }}
              className="w-full min-h-[48px] flex items-center space-x-3 px-4 py-3 rounded-xl font-mono text-xs text-[#E2FF66] bg-white/10 hover:bg-white/20 border border-white/20 transition-all cursor-pointer font-bold"
            >
              <History className="w-5 h-5 shrink-0" />
              <span>RECENTLY PLAYED ({historyCount})</span>
            </button>

            <button
              onClick={() => {
                onOpenImportModal();
                setMobileMenuOpen(false);
              }}
              className="w-full min-h-[48px] flex items-center space-x-3 px-4 py-3 rounded-xl font-mono text-xs text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-all cursor-pointer font-bold"
            >
              <Plus className="w-5 h-5 shrink-0" />
              <span>IMPORT YOUTUBE PLAYLIST</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
