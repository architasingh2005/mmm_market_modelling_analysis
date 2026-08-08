import WelcomeSection from './WelcomeSection';
import QuickActions from './QuickActions';
import RecentDatasets from './RecentDatasets';
import RecentReports from './RecentReports';
import RecentChats from './RecentChats';
import ActivityTimeline from './ActivityTimeline';

// DashboardHome — pure composition page.
// Contains NO business logic, NO API calls.
// Every section is its own self-contained component.
const DashboardHome = () => {
  return (
    <div style={styles.page}>

      {/* ── Section 1: Hero welcome ── */}
      <WelcomeSection />

      {/* ── Divider ── */}
      <div style={styles.divider} />

      {/* ── Section 2: Quick action cards ── */}
      <WrapSection>
        <QuickActions />
      </WrapSection>

      {/* ── Section 3 + 4: Datasets & Reports (side-by-side on wide screens) ── */}
      <div style={styles.twoCol}>
        <div style={styles.colMain}>
          <WrapSection>
            <RecentDatasets />
          </WrapSection>

          <WrapSection>
            <RecentReports />
          </WrapSection>
        </div>

        {/* ── Section 5 + 6: Chats & Timeline (stacked right column) ── */}
        <div style={styles.colSide}>
          <WrapSection>
            <RecentChats />
          </WrapSection>

          <WrapSection>
            <ActivityTimeline />
          </WrapSection>
        </div>
      </div>

      {/* Responsive layout rule injected here to avoid a separate CSS file */}
      <style>{`
        @media (max-width: 1100px) {
          .dashboard-two-col {
            flex-direction: column !important;
          }
          .dashboard-col-side {
            max-width: 100% !important;
            min-width: 0 !important;
          }
        }
      `}</style>
    </div>
  );
};

// WrapSection — thin spacing wrapper so sections have consistent vertical rhythm.
const WrapSection = ({ children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
    {children}
  </div>
);

const styles = {
  page: {
    maxWidth: '1400px',
    margin: '0 auto',
    paddingBottom: '64px',
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
  },
  divider: {
    height: '1px',
    background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.07) 30%, rgba(255,255,255,0.07) 70%, transparent)',
    margin: '8px 0 32px',
  },
  twoCol: {
    display: 'flex',
    gap: '24px',
    alignItems: 'flex-start',
    marginTop: '32px',
  },
  colMain: {
    flex: '1 1 0',
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '28px',
  },
  colSide: {
    flex: '0 0 360px',
    maxWidth: '360px',
    minWidth: '320px',
    display: 'flex',
    flexDirection: 'column',
    gap: '28px',
  },
};

export default DashboardHome;
