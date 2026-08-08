import { UploadCloud, FileText, MessageSquare, Download, Sparkles } from 'lucide-react';

// Placeholder data — replace with backend API response when ready.
const events = [
  {
    id: 'evt-001',
    type: 'upload',
    label: 'Dataset Uploaded',
    detail: 'synthetic_mmm_weekly_india.csv',
    time: 'Today · 10:42 AM',
    icon: UploadCloud,
    color: '#6C63FF',
    bg: 'rgba(108,99,255,0.12)',
    border: 'rgba(108,99,255,0.25)',
  },
  {
    id: 'evt-002',
    type: 'report',
    label: 'AI Report Generated',
    detail: 'Q3 Media Mix Attribution Report',
    time: 'Today · 11:15 AM',
    icon: Sparkles,
    color: '#38BDF8',
    bg: 'rgba(56,189,248,0.1)',
    border: 'rgba(56,189,248,0.22)',
  },
  {
    id: 'evt-003',
    type: 'chat',
    label: 'Chat Session Started',
    detail: 'Which channel delivered the highest incremental ROI?',
    time: 'Today · 11:30 AM',
    icon: MessageSquare,
    color: '#4ADE80',
    bg: 'rgba(74,222,128,0.1)',
    border: 'rgba(74,222,128,0.22)',
  },
  {
    id: 'evt-004',
    type: 'report',
    label: 'AI Report Generated',
    detail: 'Customer Sentiment Executive Summary',
    time: 'Yesterday · 4:02 PM',
    icon: Sparkles,
    color: '#38BDF8',
    bg: 'rgba(56,189,248,0.1)',
    border: 'rgba(56,189,248,0.22)',
  },
  {
    id: 'evt-005',
    type: 'download',
    label: 'Report Downloaded',
    detail: 'Q3 Media Mix Attribution Report · PDF',
    time: 'Yesterday · 5:00 PM',
    icon: Download,
    color: '#FB923C',
    bg: 'rgba(251,146,60,0.1)',
    border: 'rgba(251,146,60,0.22)',
  },
  {
    id: 'evt-006',
    type: 'upload',
    label: 'Dataset Uploaded',
    detail: 'brand_spend_channels_q3.xlsx',
    time: 'Jul 29 · 9:05 AM',
    icon: UploadCloud,
    color: '#6C63FF',
    bg: 'rgba(108,99,255,0.12)',
    border: 'rgba(108,99,255,0.25)',
  },
];

const ActivityTimeline = () => {
  return (
    <section style={styles.section}>
      {/* Header */}
      <div style={styles.header}>
        <FileText size={16} color="rgba(251,146,60,0.9)" />
        <h2 style={styles.title}>Activity Timeline</h2>
      </div>

      {/* Timeline */}
      <div style={styles.card}>
        <div style={styles.timeline}>
          {events.map((evt, i) => {
            const Icon = evt.icon;
            const isLast = i === events.length - 1;

            return (
              <div key={evt.id} style={styles.item}>
                {/* Spine column */}
                <div style={styles.spineCol}>
                  {/* Icon node */}
                  <div
                    style={{
                      ...styles.node,
                      backgroundColor: evt.bg,
                      border: `1px solid ${evt.border}`,
                    }}
                  >
                    <Icon size={13} color={evt.color} />
                  </div>

                  {/* Vertical connector (hidden on last item) */}
                  {!isLast && <div style={styles.connector} />}
                </div>

                {/* Content column */}
                <div style={{ ...styles.content, paddingBottom: isLast ? 0 : '28px' }}>
                  <div style={styles.topRow}>
                    <span style={styles.label}>{evt.label}</span>
                    <span style={styles.time}>{evt.time}</span>
                  </div>
                  <p style={styles.detail}>{evt.detail}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

const styles = {
  section: { marginTop: '8px' },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '14px',
  },
  title: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#F0F0F8',
    margin: 0,
    letterSpacing: '-0.2px',
  },
  card: {
    backgroundColor: '#121218',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '16px',
    padding: '24px 24px 8px',
  },
  timeline: {
    display: 'flex',
    flexDirection: 'column',
  },
  item: {
    display: 'flex',
    gap: '16px',
    alignItems: 'flex-start',
  },
  spineCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    flexShrink: 0,
  },
  node: {
    width: '32px',
    height: '32px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    zIndex: 1,
  },
  connector: {
    width: '1px',
    flex: 1,
    minHeight: '20px',
    background:
      'linear-gradient(to bottom, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)',
    margin: '4px 0',
  },
  content: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    paddingTop: '5px',
  },
  topRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
    flexWrap: 'wrap',
  },
  label: {
    fontSize: '13px',
    fontWeight: '600',
    color: 'rgba(240,240,248,0.85)',
  },
  time: {
    fontSize: '11px',
    color: 'rgba(240,240,248,0.28)',
    fontFamily: 'monospace',
    whiteSpace: 'nowrap',
  },
  detail: {
    fontSize: '12px',
    color: 'rgba(240,240,248,0.38)',
    margin: 0,
    lineHeight: 1.5,
    fontStyle: 'italic',
  },
};

export default ActivityTimeline;
