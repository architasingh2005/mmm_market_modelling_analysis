import { useState, useRef, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useCurrentUser } from '../../services/useCurrentUser';
import {
  Search,
  Bell,
  Sun,
  Moon,
  Menu,
  ChevronRight,
  User,
  Settings,
  LogOut,
  X,
} from 'lucide-react';
import { useSidebar } from './SidebarContext';

/* ─── Route → page title map ─────────────────────────────────────────────── */

const ROUTE_META = {
  '/dashboard':  { title: 'Dashboard',     breadcrumb: ['Dashboard', 'Home']       },
  '/upload':     { title: 'Upload Dataset', breadcrumb: ['Dashboard', 'Upload']     },
  '/processing': { title: 'Processing',    breadcrumb: ['Dashboard', 'Processing'] },
  '/reports':    { title: 'Reports',        breadcrumb: ['Dashboard', 'Reports']    },
  '/chat':       { title: 'AI Chat',         breadcrumb: ['Dashboard', 'AI Chat']   },
  '/profile':    { title: 'Profile',         breadcrumb: ['Dashboard', 'Profile']   },
  '/about':      { title: 'About',           breadcrumb: ['Dashboard', 'About']     },
};

// Mock notifications — replace with real data when backend is ready.
const MOCK_NOTIFICATIONS = [
  { id: 1, text: 'AI Report generated successfully',  time: '2m ago',  read: false },
  { id: 2, text: 'Dataset validation completed',       time: '15m ago', read: false },
  { id: 3, text: 'Chat session saved',                 time: '1h ago',  read: true  },
];

/* ─── SearchBar ──────────────────────────────────────────────────────────── */

const SearchBar = () => {
  const [focused, setFocused] = useState(false);

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        maxWidth: '360px',
      }}
    >
      <Search
        size={14}
        style={{
          position: 'absolute',
          left: '12px',
          color: focused ? '#6C63FF' : 'rgba(240,240,248,0.3)',
          transition: 'color 0.2s ease',
          pointerEvents: 'none',
          flexShrink: 0,
        }}
      />

      <input
        type="text"
        placeholder="Search datasets, reports, or chats..."
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        aria-label="Global search"
        style={{
          width: '100%',
          height: '36px',
          backgroundColor: 'rgba(255,255,255,0.04)',
          border: `1px solid ${focused ? 'rgba(108,99,255,0.5)' : 'rgba(255,255,255,0.07)'}`,
          borderRadius: '10px',
          padding: '0 72px 0 36px',
          fontSize: '13px',
          color: 'rgba(240,240,248,0.8)',
          outline: 'none',
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
          boxShadow: focused ? '0 0 0 3px rgba(108,99,255,0.12)' : 'none',
        }}
      />

      {/* ⌃K shortcut hint */}
      <kbd
        style={{
          position: 'absolute',
          right: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
          fontSize: '10px',
          fontFamily: 'monospace',
          color: 'rgba(240,240,248,0.25)',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '5px',
          padding: '2px 6px',
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        Ctrl K
      </kbd>
    </div>
  );
};

/* ─── NotificationButton ─────────────────────────────────────────────────── */

const NotificationButton = () => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const unread = MOCK_NOTIFICATIONS.filter((n) => !n.read).length;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        style={iconBtnStyle(open)}
        className="topbar-icon-btn"
      >
        <Bell size={17} />
        {unread > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '5px',
              right: '5px',
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: '#6C63FF',
              boxShadow: '0 0 6px rgba(108,99,255,0.7)',
              border: '1.5px solid #111114',
            }}
          />
        )}
      </button>

      {open && (
        <div style={dropdownStyle(280)}>
          <div
            style={{
              padding: '14px 16px 10px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={dropdownTitle}>Notifications</span>
            {unread > 0 && (
              <span
                style={{
                  fontSize: '10px',
                  fontFamily: 'monospace',
                  backgroundColor: 'rgba(108,99,255,0.15)',
                  color: '#8B83FF',
                  padding: '2px 7px',
                  borderRadius: '20px',
                  border: '1px solid rgba(108,99,255,0.2)',
                }}
              >
                {unread} new
              </span>
            )}
          </div>

          {MOCK_NOTIFICATIONS.map((n) => (
            <div
              key={n.id}
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                display: 'flex',
                gap: '10px',
                alignItems: 'flex-start',
                backgroundColor: !n.read ? 'rgba(108,99,255,0.04)' : 'transparent',
              }}
              className="notif-row"
            >
              {!n.read && (
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#6C63FF',
                    marginTop: '5px',
                    flexShrink: 0,
                  }}
                />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontSize: '12.5px',
                    color: n.read ? 'rgba(240,240,248,0.45)' : 'rgba(240,240,248,0.8)',
                    margin: 0,
                    lineHeight: 1.4,
                  }}
                >
                  {n.text}
                </p>
                <p
                  style={{
                    fontSize: '11px',
                    color: 'rgba(240,240,248,0.25)',
                    margin: '3px 0 0',
                    fontFamily: 'monospace',
                  }}
                >
                  {n.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .notif-row { transition: background 0.15s ease; }
        .notif-row:hover { background: rgba(255,255,255,0.03) !important; }
      `}</style>
    </div>
  );
};

/* ─── ProfileMenu ────────────────────────────────────────────────────────── */

const ProfileMenu = () => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const user = useCurrentUser();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const menuItems = [
    { label: 'Profile',  icon: User,     to: '/profile' },
    { label: 'Settings', icon: Settings, to: '/profile' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Open profile menu"
        style={{
          width: '34px',
          height: '34px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #6C63FF, #4F46E5)',
          border: open ? '2px solid rgba(108,99,255,0.6)' : '2px solid transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: '700',
          color: '#fff',
          boxShadow: open ? '0 0 0 3px rgba(108,99,255,0.15)' : 'none',
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
        }}
        className="profile-avatar-btn"
      >
        {user.initials}
      </button>

      {open && (
        <div style={{ ...dropdownStyle(200), right: 0, left: 'auto' }}>
          {/* User info header */}
          <div
            style={{
              padding: '14px 16px 12px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <p
              style={{
                fontSize: '13px',
                fontWeight: '600',
                color: 'rgba(240,240,248,0.85)',
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              {user.name}
            </p>
            <p
              style={{
                fontSize: '11px',
                color: 'rgba(240,240,248,0.3)',
                margin: '2px 0 0',
                fontFamily: 'monospace',
              }}
            >
              {user.email}
            </p>
          </div>

          {/* Menu items */}
          <div style={{ padding: '6px' }}>
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  style={dropdownItemStyle}
                  className="profile-menu-item"
                >
                  <Icon size={14} />
                  {item.label}
                </Link>
              );
            })}

            <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.05)', margin: '6px 0' }} />

            <button
              onClick={handleLogout}
              style={{ ...dropdownItemStyle, color: 'rgba(248,113,113,0.7)', width: '100%' }}
              className="profile-menu-item profile-logout"
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
        </div>
      )}

      <style>{`
        .profile-avatar-btn:hover { box-shadow: 0 0 0 3px rgba(108,99,255,0.2) !important; }
        .profile-menu-item {
          display: flex !important;
          align-items: center !important;
          gap: 9px !important;
          padding: 8px 10px !important;
          border-radius: 8px !important;
          font-size: 13px !important;
          font-weight: 500 !important;
          text-decoration: none !important;
          border: none !important;
          background: transparent !important;
          cursor: pointer !important;
          color: rgba(240,240,248,0.6) !important;
          transition: background 0.15s ease, color 0.15s ease !important;
          width: 100%;
          text-align: left;
        }
        .profile-menu-item:hover { background: rgba(255,255,255,0.05) !important; color: rgba(240,240,248,0.85) !important; }
        .profile-logout:hover { background: rgba(248,113,113,0.08) !important; color: #F87171 !important; }
      `}</style>
    </div>
  );
};

/* ─── Shared style helpers ───────────────────────────────────────────────── */

const iconBtnStyle = (active) => ({
  width: '36px',
  height: '36px',
  borderRadius: '10px',
  border: `1px solid ${active ? 'rgba(108,99,255,0.3)' : 'rgba(255,255,255,0.07)'}`,
  background: active ? 'rgba(108,99,255,0.1)' : 'rgba(255,255,255,0.04)',
  color: active ? '#8B83FF' : 'rgba(240,240,248,0.45)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  position: 'relative',
  transition: 'background 0.15s ease, border-color 0.15s ease, color 0.15s ease',
  flexShrink: 0,
});

const dropdownStyle = (width) => ({
  position: 'absolute',
  top: 'calc(100% + 8px)',
  right: 0,
  width: `${width}px`,
  backgroundColor: '#18181F',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '14px',
  boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
  zIndex: 999,
  overflow: 'hidden',
  animation: 'dropdownOpen 0.15s ease',
});

const dropdownTitle = {
  fontSize: '12px',
  fontWeight: '600',
  color: 'rgba(240,240,248,0.55)',
  letterSpacing: '0.3px',
};

const dropdownItemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '9px',
  padding: '8px 10px',
  borderRadius: '8px',
  fontSize: '13px',
  fontWeight: '500',
  textDecoration: 'none',
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  color: 'rgba(240,240,248,0.6)',
  transition: 'background 0.15s ease, color 0.15s ease',
  width: '100%',
  textAlign: 'left',
};

/* ─── ThemeToggle (UI-only) ──────────────────────────────────────────────── */

const ThemeToggle = () => {
  const [dark, setDark] = useState(true);
  return (
    <button
      onClick={() => setDark((d) => !d)}
      aria-label="Toggle theme"
      style={iconBtnStyle(false)}
      className="topbar-icon-btn"
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {dark ? <Moon size={16} /> : <Sun size={16} />}
    </button>
  );
};

/* ─── Main Topbar ────────────────────────────────────────────────────────── */

const Topbar = () => {
  // React Router useLocation provides the current URL path to derive page title.
  const location = useLocation();
  const { openMobile } = useSidebar();

  const meta = ROUTE_META[location.pathname] || {
    title: 'Page',
    breadcrumb: ['Dashboard', 'Page'],
  };

  return (
    <>
      <header
        style={{
          height: '64px',
          backgroundColor: '#111114',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          position: 'sticky',
          top: 0,
          zIndex: 30,
          flexShrink: 0,
          gap: '16px',
        }}
      >
        {/* ── Left: hamburger (mobile) + breadcrumb ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          {/* Hamburger — visible on mobile/tablet only */}
          <button
            onClick={openMobile}
            aria-label="Open sidebar"
            style={{
              display: 'none',
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.07)',
              background: 'rgba(255,255,255,0.04)',
              color: 'rgba(240,240,248,0.55)',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
            className="topbar-hamburger topbar-icon-btn"
          >
            <Menu size={18} />
          </button>

          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb">
            <ol
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              {meta.breadcrumb.map((crumb, i) => {
                const isLast = i === meta.breadcrumb.length - 1;
                return (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span
                      style={{
                        fontSize: '13.5px',
                        fontWeight: isLast ? '600' : '400',
                        color: isLast
                          ? 'rgba(240,240,248,0.85)'
                          : 'rgba(240,240,248,0.3)',
                        letterSpacing: isLast ? '-0.1px' : '0',
                      }}
                    >
                      {crumb}
                    </span>
                    {!isLast && (
                      <ChevronRight
                        size={12}
                        style={{ color: 'rgba(240,240,248,0.2)', flexShrink: 0 }}
                      />
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
        </div>

        {/* ── Center: Search ── */}
        <div
          style={{ flex: 1, display: 'flex', justifyContent: 'center' }}
          className="topbar-search-wrap"
        >
          <SearchBar />
        </div>

        {/* ── Right: actions ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <ThemeToggle />
          <NotificationButton />
          <div
            style={{
              width: '1px',
              height: '20px',
              backgroundColor: 'rgba(255,255,255,0.07)',
            }}
          />
          <ProfileMenu />
        </div>
      </header>

      {/* Dropdown animation + responsive rules */}
      <style>{`
        @keyframes dropdownOpen {
          from { opacity: 0; transform: scale(0.96) translateY(-4px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .topbar-icon-btn:hover {
          background: rgba(255,255,255,0.07) !important;
          color: rgba(240,240,248,0.75) !important;
          border-color: rgba(255,255,255,0.1) !important;
        }

        /* Hide search on very small screens */
        @media (max-width: 640px) {
          .topbar-search-wrap { display: none !important; }
        }

        /* Show hamburger on tablet/mobile */
        @media (max-width: 1024px) {
          .topbar-hamburger { display: flex !important; }
        }
      `}</style>
    </>
  );
};

export default Topbar;
