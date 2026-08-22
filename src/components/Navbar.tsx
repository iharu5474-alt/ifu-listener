import React, { useState, useRef, useEffect } from 'react';
import { User } from 'firebase/auth';
import { ActiveTab, PlayerState } from '../types';
import { Search, Sparkles, FolderHeart, Activity, Plus, Menu, X, History, Cloud, CloudCheck, LogIn, LogOut, User as UserIcon, CheckCircle2 } from 'lucide-react';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  playerState: PlayerState;
  favoritesCount: number;
  onOpenImportModal: () => void;
  onOpenRecentlyPlayed: () => void;
  user: User | null;
  authLoading: boolean;
  onSignIn: () => Promise<any>;
  onSignOut: () => Promise<any>;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  playerState,
  favoritesCount,
  onOpenImportModal,
  onOpenRecentlyPlayed,
  user,
  authLoading,
  onSignIn,
  onSignOut
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const historyCount = playerState?.history?.length || 0;

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
          <div className="hidden xl:flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 border border-white/20">
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

        {/* Header Actions: Recently Played + Import + Firebase Cloud Auth */}
        <div className="hidden md:flex items-center space-x-2.5">
          {/* Recently Played Button directly in top nav */}
          <button
            id="nav-btn-recently-played"
            onClick={onOpenRecentlyPlayed}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white font-mono text-xs tracking-wider border border-white/20 hover:border-white/40 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm cursor-pointer"
            title="Open Recently Played History"
          >
            <History className="w-3.5 h-3.5 text-[#E2FF66]" />
            <span className="hidden lg:inline">RECENTLY PLAYED</span>
            <span>{historyCount > 0 ? `(${historyCount})` : ''}</span>
          </button>

          {/* Import Playlist Button */}
          <button
            id="btn-import-yt-playlist"
            onClick={onOpenImportModal}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white font-mono text-xs tracking-wider border border-white/20 hover:border-white/40 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-white" />
            <span>IMPORT</span>
          </button>

          {/* Firebase Authentication & Cloud Sync Widget */}
          <div className="relative" ref={dropdownRef}>
            {authLoading ? (
              <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse border border-white/20" />
            ) : user ? (
              <div>
                <button
                  id="btn-user-profile-menu"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center space-x-2 p-1.5 pr-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/25 transition-all text-white cursor-pointer group shadow-sm"
                  title="Firebase Cloud Account"
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      className="w-7 h-7 rounded-full object-cover border border-[#E2FF66]/60"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-[#E2FF66] text-black font-bold flex items-center justify-center text-xs">
                      {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#E2FF66] animate-pulse" />
                    <span className="font-mono text-xs max-w-[90px] truncate text-neutral-200 group-hover:text-white">
                      {user.displayName?.split(' ')[0] || 'Synced'}
                    </span>
                  </div>
                </button>

                {/* Account Dropdown */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#0f0f0f]/95 backdrop-blur-2xl border border-white/20 p-3.5 shadow-2xl z-50 text-white animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="flex items-center space-x-3 pb-3 border-b border-white/10">
                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt={user.displayName || ''}
                          className="w-10 h-10 rounded-full border border-[#E2FF66]/40"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#E2FF66] text-black font-bold flex items-center justify-center text-base">
                          {user.displayName?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm truncate">{user.displayName || 'User'}</p>
                        <p className="font-mono text-[10px] text-neutral-400 truncate">{user.email}</p>
                      </div>
                    </div>

                    <div className="my-2.5 py-1 px-2.5 rounded-lg bg-white/[0.05] border border-white/10 flex items-center space-x-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#E2FF66] shrink-0" />
                      <span className="font-mono text-[11px] text-neutral-300">
                        Synced with ifu-listener cloud
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onSignOut();
                      }}
                      className="w-full mt-2 flex items-center justify-center space-x-2 px-3 py-2 rounded-xl bg-white/10 hover:bg-red-500/20 text-neutral-200 hover:text-red-300 font-mono text-xs border border-white/10 hover:border-red-500/30 transition-all cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                id="btn-google-sign-in"
                onClick={onSignIn}
                className="flex items-center space-x-2 px-3.5 py-2 rounded-full bg-[#E2FF66] hover:bg-[#d6f552] text-black font-mono text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md cursor-pointer"
                title="Sign in with Google to sync your playlists and favorites across devices"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>CLOUD SYNC</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Action Controls */}
        <div className="flex md:hidden items-center space-x-1.5">
          {/* User Auth quick mobile button */}
          {user ? (
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="min-w-[38px] min-h-[38px] flex items-center justify-center rounded-xl bg-white/10 text-white border border-white/20 cursor-pointer"
              title="User Account"
            >
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || ''}
                  className="w-6 h-6 rounded-full"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <UserIcon className="w-4 h-4 text-[#E2FF66]" />
              )}
            </button>
          ) : (
            <button
              onClick={onSignIn}
              className="min-w-[38px] min-h-[38px] flex items-center justify-center p-2 rounded-xl bg-[#E2FF66] text-black font-bold cursor-pointer"
              title="Sign In with Google"
            >
              <LogIn className="w-4 h-4" />
            </button>
          )}

          <button
            id="btn-mobile-recent"
            onClick={onOpenRecentlyPlayed}
            className="min-w-[38px] min-h-[38px] flex items-center justify-center p-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white border border-white/20 transition-all cursor-pointer"
            title="Recently Played"
          >
            <History className="w-4 h-4 text-[#E2FF66]" />
          </button>

          <button
            id="btn-mobile-import"
            onClick={onOpenImportModal}
            className="min-w-[38px] min-h-[38px] flex items-center justify-center p-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white border border-white/20 transition-all cursor-pointer"
            title="Import YouTube Playlist"
          >
            <Plus className="w-4 h-4 text-white" />
          </button>

          <button
            id="btn-mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="min-w-[38px] min-h-[38px] flex items-center justify-center p-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white border border-white/20 transition-all cursor-pointer"
            title="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>

      </div>

      {/* Mobile Drawer (White Glass) */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white/[0.14] backdrop-blur-2xl border-b border-white/20 px-4 py-4 space-y-2 animate-in slide-in-from-top duration-200 shadow-2xl text-white">
          {user && (
            <div className="flex items-center justify-between p-3 mb-2 rounded-xl bg-white/10 border border-white/20">
              <div className="flex items-center space-x-3">
                {user.photoURL && (
                  <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
                )}
                <div>
                  <p className="font-semibold text-xs">{user.displayName || 'User'}</p>
                  <p className="font-mono text-[10px] text-neutral-300 truncate max-w-[180px]">{user.email}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  onSignOut();
                  setMobileMenuOpen(false);
                }}
                className="p-1.5 rounded-lg bg-white/10 text-red-300 font-mono text-[10px] cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          )}

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

            {!user && (
              <button
                onClick={() => {
                  onSignIn();
                  setMobileMenuOpen(false);
                }}
                className="w-full min-h-[48px] flex items-center justify-center space-x-2 px-4 py-3 rounded-xl font-mono text-xs text-black bg-[#E2FF66] hover:bg-[#d6f552] transition-all cursor-pointer font-bold"
              >
                <LogIn className="w-4 h-4" />
                <span>SIGN IN WITH GOOGLE (CLOUD SYNC)</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
