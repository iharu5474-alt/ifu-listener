import React, { useState } from 'react';
import { ActiveTab, PlayerState } from '../types';
import { Compass, Search, FolderHeart, Heart, ListMusic, Sparkles, Plus, Radio, Menu, X, Disc } from 'lucide-react';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  playerState: PlayerState;
  favoritesCount: number;
  queueCount: number;
  onOpenImportModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  playerState,
  favoritesCount,
  queueCount,
  onOpenImportModal
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'discover' as ActiveTab, label: 'DISCOVER', icon: Compass },
    { id: 'search' as ActiveTab, label: 'SEARCH', icon: Search },
    { id: 'playlists' as ActiveTab, label: 'LIBRARY', icon: FolderHeart },
    { id: 'favorites' as ActiveTab, label: `LIKED [${favoritesCount}]`, icon: Heart },
    { id: 'queue' as ActiveTab, label: `QUEUE [${queueCount}]`, icon: ListMusic },
    { id: 'visualizer' as ActiveTab, label: 'KINETIC', icon: Sparkles }
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0A0A0A]/90 backdrop-blur-xl border-b border-neutral-900 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Brand Logo & Live Engine Badge */}
        <div className="flex items-center space-x-4">
          <button
            id="nav-brand-logo"
            onClick={() => setActiveTab('discover')}
            className="flex items-center space-x-3 text-left group"
          >
            <div className="w-9 h-9 rounded-xl bg-white text-black flex items-center justify-center font-display font-black text-sm tracking-tighter transition-all group-hover:scale-105 group-hover:bg-[#E2FF66]">
              ifu
            </div>
            <div>
              <span className="font-display font-black text-xl tracking-tight text-white block leading-none group-hover:text-[#E2FF66] transition-colors">
                ifu listener
              </span>
              <span className="font-mono text-[9px] tracking-[0.25em] text-neutral-500 block mt-0.5 uppercase">
                MINIMAL AUDIO // ARCHIVE
              </span>
            </div>
          </button>

          {/* Live Status Pill */}
          <div className="hidden sm:flex items-center space-x-2 px-2.5 py-1 rounded-full bg-neutral-900/80 border border-neutral-800">
            <span
              className={`w-2 h-2 rounded-full ${
                playerState?.isPlaying ? 'bg-[#E2FF66] animate-ping' : 'bg-neutral-600'
              }`}
            />
            <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-300">
              {playerState?.isPlaying
                ? 'STREAMING // LIVE'
                : playerState?.status === 'buffering'
                ? 'SYNCING...'
                : 'STANDBY'}
            </span>
          </div>
        </div>

        {/* Desktop Navigation Tabs */}
        <nav className="hidden md:flex items-center space-x-1 bg-neutral-950/80 p-1.5 rounded-full border border-neutral-800/80 shadow-inner">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full font-mono text-xs tracking-wider transition-all duration-300 ${
                  isActive
                    ? 'bg-white text-black font-bold shadow-md scale-[1.02]'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900/70'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-black' : 'text-neutral-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Action Button: Import YouTube Playlist */}
        <div className="hidden md:flex items-center space-x-3">
          <button
            id="btn-import-yt-playlist"
            onClick={onOpenImportModal}
            className="flex items-center space-x-2 px-4 py-2 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white font-mono text-xs tracking-wider border border-neutral-700 hover:border-neutral-500 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 text-[#E2FF66]" />
            <span>IMPORT PLAYLIST</span>
          </button>
        </div>

        {/* Mobile Menu Toggle Button */}
        <div className="flex md:hidden items-center space-x-2">
          <button
            id="btn-mobile-import"
            onClick={onOpenImportModal}
            className="p-2 rounded-lg bg-neutral-900 text-white border border-neutral-800"
            title="Import YouTube Playlist"
          >
            <Plus className="w-4 h-4 text-[#E2FF66]" />
          </button>
          <button
            id="btn-mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-neutral-900 text-white border border-neutral-800"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-neutral-950 border-b border-neutral-800 px-4 py-4 space-y-2 animate-in slide-in-from-top duration-200">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-mono text-xs tracking-wider transition-colors ${
                  isActive
                    ? 'bg-white text-black font-bold'
                    : 'text-neutral-400 hover:text-white bg-neutral-900/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
