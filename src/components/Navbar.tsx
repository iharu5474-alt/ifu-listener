import React, { useState } from 'react';
import { ActiveTab, PlayerState, RankedTrack, Track } from '../types';
import { Compass, Search, FolderHeart, Heart, Sparkles, Plus, Menu, X, Play, Flame } from 'lucide-react';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  playerState: PlayerState;
  favoritesCount: number;
  onOpenImportModal: () => void;
  recommendations?: RankedTrack[];
  onPlayTrack?: (track: Track) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  playerState,
  favoritesCount,
  onOpenImportModal,
  recommendations = [],
  onPlayTrack
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'discover' as ActiveTab, label: 'DISCOVER', icon: Compass },
    { id: 'playlists' as ActiveTab, label: 'LIBRARY', icon: FolderHeart },
    { id: 'favorites' as ActiveTab, label: `LIKED [${favoritesCount}]`, icon: Heart },
    { id: 'visualizer' as ActiveTab, label: 'KINETIC', icon: Sparkles }
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white/[0.06] backdrop-blur-2xl border-b border-white/15 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Brand Logo & Live Engine Badge */}
        <div className="flex items-center space-x-4">
          <button
            id="nav-brand-logo"
            onClick={() => setActiveTab('discover')}
            className="flex items-center space-x-3 text-left group"
          >
            <div className="w-9 h-9 rounded-xl bg-white text-black flex items-center justify-center font-display font-black text-sm tracking-tighter transition-all group-hover:scale-105 group-hover:bg-[#E2FF66] shadow-md">
              ifu
            </div>
            <div>
              <span className="font-display font-black text-xl tracking-tight text-white block leading-none group-hover:text-[#E2FF66] transition-colors drop-shadow-sm">
                ifu listener
              </span>
              <span className="font-mono text-[9px] tracking-[0.25em] text-neutral-300 block mt-0.5 uppercase">
                MINIMAL AUDIO // ARCHIVE
              </span>
            </div>
          </button>

          {/* Live Status Pill */}
          <div className="hidden sm:flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 border border-white/20">
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

        {/* Desktop Navigation Tabs (White Glass) */}
        <nav className="hidden md:flex items-center space-x-1 bg-white/10 p-1.5 rounded-full border border-white/20 shadow-inner">
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
                    : 'text-neutral-200 hover:text-white hover:bg-white/15'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-black' : 'text-neutral-300'}`} />
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
            className="flex items-center space-x-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white font-mono text-xs tracking-wider border border-white/20 hover:border-white/40 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm"
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
            className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white border border-white/20 transition-all cursor-pointer"
            title="Import YouTube Playlist"
          >
            <Plus className="w-5 h-5 text-[#E2FF66]" />
          </button>
          <button
            id="btn-mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white border border-white/20 transition-all cursor-pointer"
            title="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

      </div>

      {/* Mobile Drawer (White Glass) */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-black/90 backdrop-blur-2xl border-b border-white/20 px-4 py-4 space-y-4 animate-in slide-in-from-top duration-200">
          <div className="space-y-2">
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
                  className={`w-full min-h-[48px] flex items-center space-x-3 px-4 py-3 rounded-xl font-mono text-xs tracking-wider transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white text-black font-bold shadow-md'
                      : 'text-neutral-200 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10'
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span className="font-bold">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Slide-out Recommended for you Shelf */}
          {recommendations.length > 0 && (
            <div className="pt-3 border-t border-white/15 space-y-2.5">
              <div className="flex items-center space-x-1.5 font-mono text-[11px] text-[#E2FF66] font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>RECOMMENDED FOR YOU</span>
              </div>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {recommendations.slice(0, 4).map((rec) => (
                  <div
                    key={rec.id}
                    onClick={() => {
                      if (onPlayTrack) {
                        onPlayTrack(rec);
                        setMobileMenuOpen(false);
                      }
                    }}
                    className="flex items-center space-x-2.5 p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 cursor-pointer transition-colors"
                  >
                    <div className="relative w-9 h-9 rounded-lg overflow-hidden shrink-0 bg-black/40">
                      <img
                        src={rec.thumbnailUrl}
                        alt={rec.title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <Play className="w-3 h-3 text-white fill-current" />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h5 className="font-sans font-bold text-xs text-white truncate">
                        {rec.title}
                      </h5>
                      <p className="font-mono text-[10px] text-neutral-300 truncate">
                        {rec.artist}
                      </p>
                    </div>
                    {rec.matchScorePercentage && (
                      <span className="shrink-0 font-mono text-[9px] text-[#E2FF66] font-bold px-1.5 py-0.5 rounded bg-black/60 border border-white/10">
                        {rec.matchScorePercentage}%
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

