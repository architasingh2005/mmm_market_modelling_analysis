import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, ArrowUpRight, ExternalLink, RefreshCw, Folder } from 'lucide-react';

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

const RecentChats = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading]   = useState(true);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/chat/sessions`, { headers: authHeaders() });
      const data = await res.json();
      if (res.ok && data.success) {
        setSessions(data.sessions || []);
      }
    } catch (err) {
      console.error("[RecentChats] fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return (
    <section style={styles.section}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <MessageSquare size={16} color="rgba(74,222,128,0.9)" />
          <h2 style={styles.title}>Recent Conversations</h2>
        </div>
        <Link to="/chat" style={styles.viewAll} className="rc-view-all">
          Open Chat <ArrowUpRight size={13} />
        </Link>
      </div>

      {/* Conversation cards */}
      <div style={styles.list}>
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'rgba(240,240,248,0.45)', backgroundColor: '#121218', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <RefreshCw size={20} className="spin" style={{ marginBottom: '8px' }} />
            <p style={{ margin: 0, fontSize: '13px' }}>Loading conversations…</p>
          </div>
        ) : sessions.length === 0 ? (
          <div style={{ padding: '36px 20px', textAlign: 'center', backgroundColor: '#121218', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <Folder size={26} color="rgba(74,222,128,0.5)" style={{ marginBottom: '10px' }} />
            <p style={{ color: '#F0F0F8', fontSize: '14px', fontWeight: '600', margin: '0 0 4px' }}>No conversations yet</p>
            <p style={{ color: 'rgba(240,240,248,0.4)', fontSize: '12px', margin: '0 0 14px' }}>Ask questions about your uploaded datasets to start an AI chat session.</p>
            <Link to="/chat" style={styles.chatBtn}>Start AI Chat</Link>
          </div>
        ) : (
          sessions.slice(0, 4).map((chat) => (
            <div key={chat.sessionId || chat._id} style={styles.card} className="rc-card">
              {/* Left icon */}
              <div style={styles.iconWrap}>
                <MessageSquare size={15} color="rgba(74,222,128,0.7)" />
              </div>

              {/* Content */}
              <div style={styles.body}>
                <p style={styles.question}>"{chat.title || 'Conversational Chat'}"</p>
                <div style={styles.meta}>
                  <span style={styles.metaChip}>
                    <span
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: '50%',
                        backgroundColor: '#4ADE80',
                        display: 'inline-block',
                      }}
                    />
                    {chat.msgCount || 1} messages
                  </span>
                  <span style={styles.time}>{formatDate(chat.lastMsgAt || chat.createdAt)}</span>
                </div>
              </div>

              {/* Open action */}
              <Link to={`/chat?session=${chat.sessionId}`} style={styles.openBtn} className="rc-open-btn" title="Open chat">
                <ExternalLink size={14} color="rgba(240,240,248,0.4)" />
              </Link>
            </div>
          ))
        )}
      </div>

      <style>{`
        .rc-card { transition: background 0.15s ease, border-color 0.15s ease, transform 0.18s ease; }
        .rc-card:hover { background: rgba(255,255,255,0.03) !important; border-color: rgba(74,222,128,0.15) !important; transform: translateX(2px); }
        .rc-open-btn { transition: background 0.15s ease; }
        .rc-open-btn:hover { background: rgba(74,222,128,0.12) !important; }
        .rc-open-btn:hover svg { color: #4ADE80 !important; }
        .rc-view-all { transition: color 0.15s ease; }
        .rc-view-all:hover { color: #6AEA90 !important; }
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
    justifyContent: 'space-between',
    marginBottom: '14px',
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '8px' },
  title: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#F0F0F8',
    margin: 0,
    letterSpacing: '-0.2px',
  },
  viewAll: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#4ADE80',
    textDecoration: 'none',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  card: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '14px',
    padding: '16px 18px',
    backgroundColor: '#121218',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '14px',
  },
  iconWrap: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    background: 'rgba(74,222,128,0.1)',
    border: '1px solid rgba(74,222,128,0.18)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: '2px',
  },
  body: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    minWidth: 0,
  },
  question: {
    fontSize: '13px',
    fontWeight: '500',
    color: 'rgba(240,240,248,0.8)',
    margin: 0,
    lineHeight: 1.5,
    fontStyle: 'italic',
  },
  meta: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  metaChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: '11px',
    color: '#4ADE80',
    fontFamily: 'monospace',
    background: 'rgba(74,222,128,0.08)',
    padding: '2px 8px',
    borderRadius: '20px',
    border: '1px solid rgba(74,222,128,0.15)',
  },
  time: {
    fontSize: '11px',
    color: 'rgba(240,240,248,0.3)',
    fontFamily: 'monospace',
  },
  openBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    background: 'rgba(255,255,255,0.04)',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
    textDecoration: 'none',
  },
};

export default RecentChats;
