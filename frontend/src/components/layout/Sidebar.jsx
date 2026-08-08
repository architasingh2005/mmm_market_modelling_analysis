import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useCurrentUser } from '../../services/useCurrentUser';
import {
  LayoutDashboard,
  UploadCloud,
  FileText,
  MessageSquare,
  BarChart3,
  Info,
  Settings,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
} from 'lucide-react';
import { useSidebar } from './SidebarContext';

/* ─── Navigation definition ──────────────────────────────────────────────── */

const NAV_SECTIONS = [
  {
    id: 'main',
    label: 'Workspace',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
      { id: 'upload',    label: 'Upload Dataset', icon: UploadCloud,      to: '/upload'     },
      { id: 'reports',   label: 'Reports',        icon: FileText,          to: '/reports'    },
      { id: 'chat',      label: 'AI Chat',         icon: MessageSquare,    to: '/chat'       },
      { id: 'analytics', label: 'Analytics',       icon: BarChart3,        to: '/analytics'  },
    ],
  },
  {
    id: 'misc',
    label: 'General',
    items: [
      { id: 'about',    label: 'About',    icon: Info,     to: '/about'    },
      { id: 'settings', label: 'Settings', icon: Settings, to: '/profile'  },
    ],
  },
];


const SIDEBAR_EXPANDED = 270;
const SIDEBAR_COLLAPSED = 84;

/* ─── Sub-components ──────────────────────────────────────────────────────── */

// SidebarItem — a single nav link with tooltip support in collapsed mode.
const SidebarItem = ({ item, collapsed }) => {
  const Icon = item.icon;
  const [hovered, setHovered] = useState(false);

  return (
    <div style={{ position: 'relative' }}>
      {/* React Router NavLink automatically applies active styles based on the current route. */}
      <NavLink
        to={item.to}
        end={item.to === '/dashboard'}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={({ isActive }) => ({
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: collapsed ? '10px 0' : '9px 12px',
          justifyContent: collapsed ? 'center' : 'flex-start',
          borderRadius: '10px',
          textDecoration: 'none',
          position: 'relative',
          transition: 'background 0.15s ease, color 0.15s ease',
          backgroundColor: isActive
            ? 'rgba(108,99,255,0.12)'
            : hovered
            ? 'rgba(255,255,255,0.05)'
            : 'transparent',
          color: isActive ? '#8B83FF' : 'rgba(240,240,248,0.55)',
          boxShadow: isActive ? '0 0 0 1px rgba(108,99,255,0.2) inset' : 'none',
        })}
      >
        {({ isActive }) => (
          <>
            {/* Active left indicator bar */}
            {isActive && (
              <span
                style={{
                  position: 'absolute',
                  left: 0,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '3px',
                  height: '18px',
                  borderRadius: '0 3px 3px 0',
                  backgroundColor: '#6C63FF',
                  boxShadow: '0 0 8px rgba(108,99,255,0.6)',
                }}
              />
            )}

            <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
              <Icon
                size={18}
                style={{
                  color: isActive ? '#8B83FF' : hovered ? 'rgba(240,240,248,0.75)' : 'rgba(240,240,248,0.4)',
                  transition: 'color 0.15s ease',
                }}
              />
            </span>

            {/* Label fades out on collapse */}
            {!collapsed && (
              <span
                style={{
                  fontSize: '13.5px',
                  fontWeight: isActive ? '600' : '500',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  letterSpacing: '-0.1px',
                  transition: 'opacity 0.2s ease',
                }}
              >
                {item.label}
              </span>
            )}
          </>
        )}
      </NavLink>

      {/* Tooltip — only shown in collapsed mode */}
      {collapsed && hovered && (
        <div
          style={{
            position: 'fixed',
            left: `${SIDEBAR_COLLAPSED + 10}px`,
            transform: 'translateY(-50%)',
            backgroundColor: '#1E1E26',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            padding: '6px 12px',
            fontSize: '12px',
            fontWeight: '500',
            color: '#F0F0F8',
            whiteSpace: 'nowrap',
            zIndex: 999,
            pointerEvents: 'none',
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          }}
        >
          {item.label}
        </div>
      )}
    </div>
  );
};

// SidebarSection — groups nav items under a labelled heading.
const SidebarSection = ({ section, collapsed }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
    {!collapsed && (
      <p
        style={{
          fontSize: '10px',
          fontWeight: '600',
          letterSpacing: '1px',
          textTransform: 'uppercase',
          color: 'rgba(240,240,248,0.2)',
          fontFamily: 'monospace',
          margin: '0 0 6px 12px',
        }}
      >
        {section.label}
      </p>
    )}
    {section.items.map((item) => (
      <SidebarItem key={item.id} item={item} collapsed={collapsed} />
    ))}
  </div>
);

// SidebarFooter — user profile card + logout.
const SidebarFooter = ({ collapsed }) => {
  const navigate = useNavigate();
  const user = useCurrentUser();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div
      style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: collapsed ? '16px 10px' : '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      {/* Profile card */}
      <NavLink
        to="/profile"
        style={({ isActive }) => ({
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: collapsed ? '8px 0' : '8px 10px',
          justifyContent: collapsed ? 'center' : 'flex-start',
          borderRadius: '10px',
          textDecoration: 'none',
          backgroundColor: isActive ? 'rgba(108,99,255,0.1)' : 'transparent',
          transition: 'background 0.15s ease',
        })}
        className="sidebar-footer-profile"
      >
        {/* Avatar */}
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #6C63FF, #4F46E5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: '700',
            color: '#fff',
            flexShrink: 0,
            boxShadow: '0 2px 8px rgba(108,99,255,0.35)',
          }}
        >
          {user.initials}
        </div>

        {/* Name + email */}
        {!collapsed && (
          <div style={{ minWidth: 0 }}>
            <p
              style={{
                fontSize: '13px',
                fontWeight: '600',
                color: 'rgba(240,240,248,0.85)',
                margin: 0,
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {user.name}
            </p>
            <p
              style={{
                fontSize: '11px',
                color: 'rgba(240,240,248,0.3)',
                margin: 0,
                lineHeight: 1.3,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                fontFamily: 'monospace',
              }}
            >
              {user.email}
            </p>
          </div>
        )}
      </NavLink>

      {/* Logout */}
      <button
        onClick={handleLogout}
        title="Sign Out"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          justifyContent: collapsed ? 'center' : 'flex-start',
          padding: collapsed ? '8px 0' : '8px 10px',
          borderRadius: '10px',
          border: 'none',
          background: 'transparent',
          color: 'rgba(248,113,113,0.6)',
          fontSize: '13px',
          fontWeight: '500',
          cursor: 'pointer',
          width: '100%',
          transition: 'background 0.15s ease, color 0.15s ease',
        }}
        className="sidebar-logout-btn"
      >
        <LogOut size={16} />
        {!collapsed && <span>Sign Out</span>}
      </button>

      <style>{`
        .sidebar-footer-profile:hover { background: rgba(255,255,255,0.05) !important; }
        .sidebar-logout-btn:hover { background: rgba(248,113,113,0.08) !important; color: #F87171 !important; }
      `}</style>
    </div>
  );
};

/* ─── Main Sidebar component ──────────────────────────────────────────────── */

const Sidebar = () => {
  const { collapsed, toggle, mobileOpen, closeMobile } = useSidebar();

  return (
    <>
      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div
          onClick={closeMobile}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(2px)',
            zIndex: 39,
          }}
        />
      )}

      <aside
        style={{
          width: collapsed ? `${SIDEBAR_COLLAPSED}px` : `${SIDEBAR_EXPANDED}px`,
          height: '100vh',
          position: 'fixed',
          top: 0,
          left: 0,
          backgroundColor: '#111114',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 40,
          // Smooth width collapse transition
          transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1), transform 0.3s cubic-bezier(0.4,0,0.2,1)',
          overflow: 'hidden',
          // On mobile: slide in as drawer; on desktop: always visible
          transform: mobileOpen ? 'translateX(0)' : undefined,
        }}
        className="sidebar-root"
      >
        {/* ── Brand header ── */}
        <div
          style={{
            height: '64px',
            padding: collapsed ? '0' : '0 16px 0 18px',
            justifyContent: collapsed ? 'center' : 'space-between',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexShrink: 0,
          }}
        >
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #6C63FF 0%, #4F46E5 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(108,99,255,0.35)',
                flexShrink: 0,
              }}
            >
              <Sparkles size={16} color="#fff" />
            </div>

            {!collapsed && (
              <div style={{ minWidth: 0 }}>
                <p
                  style={{
                    fontSize: '14px',
                    fontWeight: '700',
                    color: '#F0F0F5',
                    letterSpacing: '-0.3px',
                    margin: 0,
                    lineHeight: 1.1,
                  }}
                >
                  MarketMindAI
                </p>
                <p
                  style={{
                    fontSize: '10px',
                    color: '#4ADE80',
                    fontFamily: 'monospace',
                    margin: 0,
                    lineHeight: 1.4,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span
                    style={{
                      width: '5px',
                      height: '5px',
                      borderRadius: '50%',
                      backgroundColor: '#4ADE80',
                      boxShadow: '0 0 5px #4ADE80',
                      display: 'inline-block',
                    }}
                  />
                  Connected
                </p>
              </div>
            )}
          </div>

          {/* Collapse toggle button — only visible on desktop */}
          {!collapsed && (
            <button
              onClick={toggle}
              title="Collapse sidebar"
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.04)',
                color: 'rgba(240,240,248,0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'background 0.15s ease, color 0.15s ease',
              }}
              className="sidebar-collapse-btn"
            >
              <ChevronLeft size={14} />
            </button>
          )}
        </div>

        {/* Expand button when collapsed */}
        {collapsed && (
          <button
            onClick={toggle}
            title="Expand sidebar"
            style={{
              margin: '12px auto 0',
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.04)',
              color: 'rgba(240,240,248,0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'background 0.15s ease, color 0.15s ease',
            }}
            className="sidebar-collapse-btn"
          >
            <ChevronRight size={14} />
          </button>
        )}

        {/* ── Navigation ── */}
        <nav
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: collapsed ? '16px 10px' : '16px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            scrollbarWidth: 'none',
          }}
        >
          {NAV_SECTIONS.map((section) => (
            <SidebarSection key={section.id} section={section} collapsed={collapsed} />
          ))}
        </nav>

        {/* ── Footer ── */}
        <SidebarFooter collapsed={collapsed} />
      </aside>

      <style>{`
        .sidebar-root { scrollbar-width: none; }
        .sidebar-root::-webkit-scrollbar { display: none; }
        .sidebar-collapse-btn:hover {
          background: rgba(255,255,255,0.08) !important;
          color: rgba(240,240,248,0.7) !important;
        }

        /* Mobile: sidebar hidden by default, slides in as drawer */
        @media (max-width: 768px) {
          .sidebar-root {
            transform: ${mobileOpen ? 'translateX(0)' : 'translateX(-100%)'} !important;
            width: 270px !important;
            box-shadow: 4px 0 32px rgba(0,0,0,0.5);
          }
        }
      `}</style>
    </>
  );
};

export default Sidebar;
