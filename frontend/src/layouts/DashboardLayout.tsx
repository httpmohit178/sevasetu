import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Menu, X, Bell, ChevronDown, LogOut, Settings,
  Sun, Moon, Globe
} from 'lucide-react';
import { useDarkMode } from '@/hooks/useDarkMode';
import { apiRequest } from '@/lib/api-client';
import { useAppLanguage } from '@/hooks/useAppLanguage';

export interface NavItem {
  href: string;
  label: string;
  labelHi: string;
  icon: React.ReactNode;
  badge?: string | number;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  navItems: NavItem[];
  userType: 'user' | 'provider';
  userName?: string;
  userCity?: string;
  lang: 'en' | 'hi';
  onLangToggle: () => void;
  notifications?: number;
}

// ─── Indian-themed Logo ───────────────────────────────────────────────────────
function Logo({ collapsed }: { collapsed: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5 group">
      <svg width="36" height="36" viewBox="0 0 40 40" fill="none" className="shrink-0 group-hover:scale-105 transition-transform">
        <path d="M20 4 A16 16 0 0 1 36 20" stroke="#FF9933" strokeWidth="4" strokeLinecap="round" fill="none"/>
        <path d="M36 20 A16 16 0 0 1 20 36" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" fill="none"/>
        <path d="M20 36 A16 16 0 0 1 4 20" stroke="#138808" strokeWidth="4" strokeLinecap="round" fill="none"/>
        <path d="M4 20 A16 16 0 0 1 20 4" stroke="#000080" strokeWidth="4" strokeLinecap="round" fill="none"/>
        <circle cx="20" cy="20" r="7" fill="#000080"/>
        {[0,45,90,135,180,225,270,315].map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          return <line key={i} x1={20+3*Math.cos(rad)} y1={20+3*Math.sin(rad)} x2={20+6.5*Math.cos(rad)} y2={20+6.5*Math.sin(rad)} stroke="white" strokeWidth="0.8"/>;
        })}
        <circle cx="20" cy="20" r="2" fill="white"/>
        <circle cx="20" cy="20" r="6.5" stroke="white" strokeWidth="0.6" fill="none"/>
      </svg>
      {!collapsed && (
        <div className="flex flex-col leading-tight">
          <span className="text-base font-bold text-foreground" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Seva<span className="text-primary">Setu</span>
          </span>
          <span className="text-[9px] font-semibold" style={{ color: '#FF9933' }}>Connecting Bharat</span>
        </div>
      )}
    </Link>
  );
}

// ─── Main Layout ──────────────────────────────────────────────────────────────
export default function DashboardLayout({
  children, navItems, userType, userName = 'User', userCity = 'India',
  lang, onLangToggle, notifications = 0
}: DashboardLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark, toggle: toggleDark } = useDarkMode();
  const [, setAppLang] = useAppLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const avatarColor = userType === 'provider' ? 'bg-secondary' : 'bg-primary';
  const toggleLanguage = onLangToggle || (() => setAppLang(current => current === 'en' ? 'hi' : 'en'));
  async function logout() {
    try { await apiRequest('/auth/logout', { method: 'POST' }); } catch { /* Local sign-out still works if the API is offline. */ }
    localStorage.removeItem('sevasetu-token');
    localStorage.removeItem('sevasetu-role');
    window.dispatchEvent(new Event('sevasetu-auth-change'));
    navigate('/');
  }

  return (
    <div className="flex h-screen bg-muted/30 overflow-hidden">

      {/* ── Mobile Overlay ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar ────────────────────────────────────────────────────────── */}
      <aside className={`
        fixed lg:relative z-50 lg:z-auto h-full flex flex-col
        bg-background border-r border-border shadow-xl lg:shadow-none
        transition-all duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${sidebarCollapsed ? 'w-16' : 'w-64'}
      `}>
        {/* Logo area */}
        <div className={`flex items-center h-16 border-b border-border px-4 ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
          <Logo collapsed={sidebarCollapsed} />
          {!sidebarCollapsed && (
            <button
              onClick={() => setSidebarCollapsed(true)}
              className="hidden lg:flex w-7 h-7 rounded-md items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
            >
              <X size={14} />
            </button>
          )}
          {sidebarCollapsed && (
            <button
              onClick={() => setSidebarCollapsed(false)}
              className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 rounded-full bg-background border border-border items-center justify-center text-muted-foreground hover:text-primary shadow-sm"
            >
              <Menu size={12} />
            </button>
          )}
        </div>

        {/* User badge */}
        {!sidebarCollapsed && (
          <div className="px-3 py-3 border-b border-border">
            <div className={`flex items-center gap-2.5 px-2 py-2 rounded-xl ${userType === 'provider' ? 'bg-secondary/10' : 'bg-primary/10'}`}>
              <div className={`w-8 h-8 rounded-full ${avatarColor} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground truncate">{userName}</p>
                <p className="text-[10px] text-muted-foreground truncate">{userCity}</p>
              </div>
              <span className={`ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                userType === 'provider' ? 'bg-secondary text-white' : 'bg-primary text-white'
              }`}>
                {userType === 'provider' ? (lang === 'hi' ? 'प्रदाता' : 'PRO') : (lang === 'hi' ? 'यूज़र' : 'USER')}
              </span>
            </div>
          </div>
        )}

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                title={sidebarCollapsed ? (lang === 'hi' ? item.labelHi : item.label) : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative ${
                  isActive
                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                } ${sidebarCollapsed ? 'justify-center' : ''}`}
              >
                <span className="shrink-0">{item.icon}</span>
                {!sidebarCollapsed && (
                  <>
                    <span className="flex-1">{lang === 'hi' ? item.labelHi : item.label}</span>
                    {item.badge !== undefined && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        isActive ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
                {sidebarCollapsed && item.badge !== undefined && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-primary text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="p-3 border-t border-border space-y-1">
          <Link
            to="/settings"
            className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-all ${sidebarCollapsed ? 'justify-center' : ''}`}
          >
            <Settings size={16} />
            {!sidebarCollapsed && <span>{lang === 'hi' ? 'सेटिंग्स' : 'Settings'}</span>}
          </Link>
          <button
            onClick={() => void logout()}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all ${sidebarCollapsed ? 'justify-center' : ''}`}
          >
            <LogOut size={16} />
            {!sidebarCollapsed && <span>{lang === 'hi' ? 'लॉगआउट' : 'Logout'}</span>}
          </button>
        </div>
      </aside>

      {/* ── Main Content ───────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Topbar */}
        <header className="h-16 bg-background border-b border-border flex items-center px-4 gap-3 shrink-0">
          {/* Mobile menu toggle */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
          >
            <Menu size={20} />
          </button>

          {/* Page title area — children can override via context if needed */}
          <div className="flex-1" />

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Lang toggle */}
            <button
              onClick={toggleLanguage}
              className="hidden sm:flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full border border-border text-muted-foreground hover:text-primary hover:border-primary/40 transition-all"
            >
              <Globe size={12} />
              {lang === 'en' ? 'हिं' : 'EN'}
            </button>

            {/* Dark mode */}
            <button
              onClick={toggleDark}
              className="w-9 h-9 rounded-xl flex items-center justify-center border border-border text-muted-foreground hover:text-primary hover:border-primary/40 transition-all"
            >
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {/* Notifications */}
            <button onClick={() => navigate(userType === 'provider' ? '/provider-dashboard' : '/tracker')} aria-label={lang === 'hi' ? 'बुकिंग अपडेट देखें' : 'View booking updates'} title={lang === 'hi' ? 'बुकिंग अपडेट देखें' : 'View booking updates'} className="relative w-9 h-9 rounded-xl flex items-center justify-center border border-border text-muted-foreground hover:text-primary hover:border-primary/40 transition-all">
              <Bell size={15} />
              {notifications > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {notifications > 9 ? '9+' : notifications}
                </span>
              )}
            </button>

            {/* Profile dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(o => !o)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border border-border hover:border-primary/40 hover:bg-muted transition-all"
              >
                <div className={`w-7 h-7 rounded-full ${avatarColor} flex items-center justify-center text-white text-xs font-bold`}>
                  {initials}
                </div>
                <span className="hidden sm:block text-sm font-semibold text-foreground max-w-[100px] truncate">{userName}</span>
                <ChevronDown size={13} className="text-muted-foreground" />
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-48 bg-background border border-border rounded-2xl shadow-xl z-50 overflow-hidden"
                  >
                    <div className="p-3 border-b border-border">
                      <p className="text-sm font-bold text-foreground">{userName}</p>
                      <p className="text-xs text-muted-foreground">{userCity}</p>
                    </div>
                    <div className="p-1.5">
                      <Link to="/settings" className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-all" onClick={() => setProfileOpen(false)}>
                        <Settings size={14} /> {lang === 'hi' ? 'सेटिंग्स' : 'Settings'}
                      </Link>
                      <button onClick={() => { setProfileOpen(false); void logout(); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all">
                        <LogOut size={14} /> {lang === 'hi' ? 'लॉगआउट' : 'Logout'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
