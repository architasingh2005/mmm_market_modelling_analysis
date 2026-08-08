import { useState, useEffect, useCallback } from 'react';
import { UploadCloud, FileText, MessageSquare, RefreshCw, Folder } from 'lucide-react';

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  const now = new Date();
  const diff = now - d;
  if (diff < 60000)   return 'Just now';
  if (diff < 3600000)  return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 172800000) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const ActivityTimeline = () => {
  const [events, setEvents]   = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTimeline = useCallback(async () => {
    setLoading(true);
    try {
      const headers = authHeaders();

      // Fetch datasets, reports, and sessions concurrently
      const [dsRes, rptRes, chatRes] = await Promise.all([
        fetch(`${API}/datasets`, { headers }).then(r => r.json()).catch(() => ({ success: false })),
        fetch(`${API}/reports`, { headers }).then(r => r.json()).catch(() => ({ success: false })),
        fetch(`${API}/chat/sessions`, { headers }).then(r => r.json()).catch(() => ({ success: false })),
      ]);

      const items = [];

      // Datasets events
      if (dsRes.success && Array.isArray(dsRes.datasets)) {
        dsRes.datasets.forEach(ds => {
          items.push({
            id: `ds-${ds._id}`,
            timestamp: new Date(ds.createdAt).getTime(),
            label: 'Dataset Uploaded',
            detail: ds.datasetName || ds.originalFilename || 'Dataset',
            time: formatDate(ds.createdAt),
            icon: UploadCloud,
            color: '#6C63FF',
            bg: 'rgba(108,99,255,0.12)',
            border: 'rgba(108,99,255,0.25)',
          });
        });
      }

      // Report events
      if (rptRes.success && Array.isArray(rptRes.reports)) {
        rptRes.reports.forEach(rpt => {
          items.push({
            id: `rpt-${rpt._id}`,
            timestamp: new Date(rpt.createdAt || rpt.generatedAt).getTime(),
            label: 'AI Report Generated',
            detail: rpt.title || 'Executive Report',
            time: formatDate(rpt.createdAt || rpt.generatedAt),
            icon: FileText,
            color: '#38BDF8',
            bg: 'rgba(56,189,248,0.1)',
            border: 'rgba(56,189,248,0.22)',
          });
        });
      }

      // Chat session events
      if (chatRes.success && Array.isArray(chatRes.sessions)) {
        chatRes.sessions.forEach(sess => {
          items.push({
            id: `chat-${sess.sessionId}`,
            timestamp: new Date(sess.lastMsgAt || sess.createdAt).getTime(),
            label: 'Chat Session',
            detail: sess.title || 'AI Chat Session',
            time: formatDate(sess.lastMsgAt || sess.createdAt),
            icon: MessageSquare,
            color: '#4ADE80',
            bg: 'rgba(74,222,128,0.1)',
            border: 'rgba(74,222,128,0.22)',
          });
        });
      }

      // Sort newest first
      items.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      setEvents(items.slice(0, 6));

    } catch (err) {
      console.error("[ActivityTimeline] fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  return (
    <section style={styles.section}>
      {/* Header */}
      <div style={styles.header}>
        <FileText size={16} color="rgba(251,146,60,0.9)" />
        <h2 style={styles.title}>Activity Timeline</h2>
      </div>

      {/* Timeline */}
      <div style={styles.card}>
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'rgba(240,240,248,0.45)' }}>
            <RefreshCw size={20} className="spin" style={{ marginBottom: '8px' }} />
            <p style={{ margin: 0, fontSize: '13px' }}>Loading timeline…</p>
          </div>
        ) : events.length === 0 ? (
          <div style={{ padding: '36px 20px', textAlign: 'center' }}>
            <Folder size={26} color="rgba(251,146,60,0.5)" style={{ marginBottom: '10px' }} />
            <p style={{ color: '#F0F0F8', fontSize: '14px', fontWeight: '600', margin: '0 0 4px' }}>No recent activity</p>
            <p style={{ color: 'rgba(240,240,248,0.4)', fontSize: '12px', margin: 0 }}>Activity will appear here after you upload datasets and run analysis.</p>
          </div>
        ) : (
          <div style={styles.timeline}>
            {events.map((evt, i) => {
              const Icon = evt.icon;
              const isLast = i === events.length - 1;

              return (
                <div key={evt.id} style={styles.item}>
                  {/* Spine column */}
                  <div style={styles.spineCol}>
                    <div
                      style={{
                        ...styles.node,
                        backgroundColor: evt.bg,
                        border: `1px solid ${evt.border}`,
                      }}
                    >
                      <Icon size={13} color={evt.color} />
                    </div>

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
        )}
      </div>

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
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
