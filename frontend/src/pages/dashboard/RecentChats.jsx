import { Link } from 'react-router-dom';
import { MessageSquare, ArrowUpRight, ExternalLink } from 'lucide-react';

// Placeholder data — replace with backend API response when ready.
const conversations = [
  {
    id: 'chat-001',
    question: 'Which marketing channel delivered the highest incremental ROI in Q3?',
    time: 'Today, 11:30 AM',
    messages: 14,
  },
  {
    id: 'chat-002',
    question: 'Summarise the adstock decay rates for TV and Digital spend.',
    time: 'Today, 9:15 AM',
    messages: 8,
  },
  {
    id: 'chat-003',
    question: 'What is the saturation curve for Social Media spend in our model?',
    time: 'Yesterday, 5:45 PM',
    messages: 22,
  },
  {
    id: 'chat-004',
    question: 'Compare Q2 vs Q3 attribution across all five spend channels.',
    time: 'Jul 29, 3:10 PM',
    messages: 17,
  },
];

const RecentChats = () => {
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
        {conversations.map((chat) => (
          <div key={chat.id} style={styles.card} className="rc-card">
            {/* Left icon */}
            <div style={styles.iconWrap}>
              <MessageSquare size={15} color="rgba(74,222,128,0.7)" />
            </div>

            {/* Content */}
            <div style={styles.body}>
              <p style={styles.question}>"{chat.question}"</p>
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
                  {chat.messages} messages
                </span>
                <span style={styles.time}>{chat.time}</span>
              </div>
            </div>

            {/* Open action */}
            <Link to="/chat" style={styles.openBtn} className="rc-open-btn" title="Open chat">
              <ExternalLink size={14} color="rgba(240,240,248,0.4)" />
            </Link>
          </div>
        ))}
      </div>

      <style>{`
        .rc-card { transition: background 0.15s ease, border-color 0.15s ease, transform 0.18s ease; }
        .rc-card:hover { background: rgba(255,255,255,0.03) !important; border-color: rgba(74,222,128,0.15) !important; transform: translateX(2px); }
        .rc-open-btn { transition: background 0.15s ease; }
        .rc-open-btn:hover { background: rgba(74,222,128,0.12) !important; }
        .rc-open-btn:hover svg { color: #4ADE80 !important; }
        .rc-view-all { transition: color 0.15s ease; }
        .rc-view-all:hover { color: #6AEA90 !important; }
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
