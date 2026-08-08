import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { SidebarProvider, useSidebar } from './SidebarContext';

const SIDEBAR_EXPANDED = 270;
const SIDEBAR_COLLAPSED = 84;

// Inner layout — reads collapsed state from SidebarContext to set margin-left.
const LayoutInner = () => {
  // React Context: useSidebar reads collapsed state provided by SidebarProvider.
  const { collapsed } = useSidebar();

  const sidebarWidth = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED;

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: '#0B0B0D',
        color: '#E8E8F0',
        fontFamily:
          "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* ── Sidebar ── */}
      <Sidebar />

      {/* ── Right column: Topbar + page content ── */}
      {/*
        margin-left tracks the sidebar width as it collapses/expands.
        Transition matches the sidebar's 300ms cubic-bezier.
      */}
      <div
        className="dashboard-content-wrapper"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          marginLeft: `${sidebarWidth}px`,
          transition: 'margin-left 0.3s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        {/* Sticky Topbar */}
        <Topbar />

        {/* ── Main Content Area ── */}
        {/* React Router Outlet: renders the matched child route. */}
        <main
          style={{
            flex: 1,
            padding: '32px',
            overflowY: 'auto',
            animation: 'dashboardPageFadeIn 0.22s ease forwards',
          }}
        >
          <Outlet />
        </main>
      </div>

      <style>{`
        @keyframes dashboardPageFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0);   }
        }

        /* Tablet/Mobile: sidebar becomes a drawer, content takes full width */
        @media (max-width: 1024px) {
          .dashboard-content-wrapper {
            margin-left: 0 !important;
          }
        }

        @media (max-width: 640px) {
          .dashboard-content-wrapper > main {
            padding: 16px !important;
          }
        }
      `}</style>
    </div>
  );
};

// DashboardLayout — wraps LayoutInner in SidebarProvider so both Sidebar and
// Topbar share the same collapsed / mobile-open state tree.
const DashboardLayout = () => (
  <SidebarProvider>
    <LayoutInner />
  </SidebarProvider>
);

export default DashboardLayout;
