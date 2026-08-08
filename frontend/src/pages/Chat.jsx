import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Send, Plus, Search, Trash2, RefreshCw, Copy, Check,
  Bot, User, Sparkles, Database, FileText, BarChart2,
  MessageSquare, AlertCircle, ChevronRight, HelpCircle,
  ArrowDown, Menu, X, Globe, Clock,
} from 'lucide-react';

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/* ── UUID generator for session IDs ───────────────────────────────── */
function generateSessionId() {
  return 'sess-' + Math.random().toString(36).slice(2, 10) + '-' + Date.now().toString(36);
}

/* ── Date formatter ───────────────────────────────────────────────── */
function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/* ── Truncate long session titles ─────────────────────────────────── */
function truncate(str, n) {
  if (!str) return 'New conversation';
  return str.length > n ? str.slice(0, n) + '…' : str;
}

/* ── Dataset-type aware suggested questions ───────────────────────── */
function getSuggestedQuestions(datasetType, datasetName) {
  const nameLower = (datasetName || '').toLowerCase();
  const type = datasetType || (
    nameLower.includes('mmm') || nameLower.includes('media') || nameLower.includes('marketing') ? 'mmm' :
    nameLower.includes('review') || nameLower.includes('sentiment') ? 'sentiment' : 'generic'
  );

  if (type === 'mmm') return [
    { text: "Which marketing channel generated the highest ROI?", icon: BarChart2 },
    { text: "Recommend an optimal budget allocation across channels.", icon: Sparkles },
    { text: "Which channel is experiencing diminishing returns?", icon: HelpCircle },
    { text: "Forecast next month's expected sales growth.", icon: FileText },
  ];
  if (type === 'sentiment') return [
    { text: "Summarize overall customer sentiment.", icon: MessageSquare },
    { text: "What are the top customer complaint categories?", icon: AlertCircle },
    { text: "Which product category has the highest ratings?", icon: Sparkles },
    { text: "What features do customers praise most in reviews?", icon: HelpCircle },
  ];
  return [
    { text: "Summarize key statistics of this dataset.", icon: FileText },
    { text: "Are there any missing values or data anomalies?", icon: AlertCircle },
    { text: "What are the strongest correlations in this dataset?", icon: BarChart2 },
    { text: "Provide top 5 strategic recommendations based on the data.", icon: Sparkles },
  ];
}

/* ═══════════════════════════════════════════════════════════
   MARKDOWN RENDERER
═══════════════════════════════════════════════════════════ */
const FormattedMarkdown = ({ content }) => {
  if (!content) return null;
  const lines = content.split('\n');
  const elements = [];
  let inTable = false, tableHeader = [], tableRows = [];

  const flushTable = (key) => {
    if (!tableHeader.length) return;
    elements.push(
      <div key={`tbl-${key}`} style={{ overflowX: 'auto', margin: '14px 0' }}>
        <table style={{
          width: '100%', borderCollapse: 'collapse', fontSize: 13,
          background: 'rgba(255,255,255,0.02)', borderRadius: 10, overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
          <thead>
            <tr style={{ background: 'rgba(108,99,255,0.12)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              {tableHeader.map((h, i) => <th key={i} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#A5B4FC' }}>{h.trim()}</th>)}
            </tr>
          </thead>
          <tbody>
            {tableRows.map((row, ri) => (
              <tr key={ri} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                {row.map((cell, ci) => <td key={ci} style={{ padding: '9px 14px', color: 'rgba(240,240,248,0.8)' }}>{cell.trim()}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
    tableHeader = []; tableRows = []; inTable = false;
  };

  lines.forEach((line, idx) => {
    const t = line.trim();
    if (t.startsWith('|') && t.endsWith('|')) {
      const cells = t.split('|').slice(1, -1);
      if (cells.every(c => c.trim().match(/^:?-+:?$/))) return;
      if (!inTable) { inTable = true; tableHeader = cells; }
      else tableRows.push(cells);
      return;
    }
    if (inTable) { flushTable(idx); }

    if (t.startsWith('### ')) { elements.push(<h3 key={idx} style={{ color: '#A5B4FC', fontSize: 15, fontWeight: 700, margin: '18px 0 8px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 6 }}>{formatInline(t.slice(4))}</h3>); return; }
    if (t.startsWith('## '))  { elements.push(<h2 key={idx} style={{ color: '#C4B5FD', fontSize: 17, fontWeight: 700, margin: '20px 0 10px' }}>{formatInline(t.slice(3))}</h2>); return; }
    if (t.startsWith('# '))   { elements.push(<h1 key={idx} style={{ color: '#E0D9FF', fontSize: 20, fontWeight: 800, margin: '22px 0 12px' }}>{formatInline(t.slice(2))}</h1>); return; }
    if (t.startsWith('```'))  { elements.push(<pre key={idx} style={{ background: 'rgba(0,0,0,0.4)', borderRadius: 10, padding: '12px 16px', fontSize: 12, color: '#7DD3FC', overflowX: 'auto', margin: '12px 0', fontFamily: 'JetBrains Mono, Fira Code, monospace' }}><code>{t.slice(3)}</code></pre>); return; }
    if (t.match(/^(\d+)\. /)) { const n = t.match(/^(\d+)\. /)[1]; elements.push(<div key={idx} style={{ display: 'flex', gap: 10, margin: '4px 0', color: 'rgba(240,240,248,0.85)', fontSize: 13, lineHeight: 1.65 }}><span style={{ color: '#6C63FF', fontWeight: 700, minWidth: 20 }}>{n}.</span><span>{formatInline(t.replace(/^\d+\. /, ''))}</span></div>); return; }
    if (t.startsWith('- ') || t.startsWith('• ')) { elements.push(<div key={idx} style={{ display: 'flex', gap: 8, margin: '3px 0', color: 'rgba(240,240,248,0.85)', fontSize: 13, lineHeight: 1.65 }}><span style={{ color: '#6C63FF', marginTop: 2, flexShrink: 0 }}>▸</span><span>{formatInline(t.slice(2))}</span></div>); return; }
    if (!t) { elements.push(<div key={idx} style={{ height: 6 }} />); return; }
    elements.push(<p key={idx} style={{ color: 'rgba(240,240,248,0.85)', fontSize: 13, lineHeight: 1.75, margin: '4px 0' }}>{formatInline(t)}</p>);
  });

  if (inTable) flushTable('last');
  return <div>{elements}</div>;
};

function formatInline(text) {
  const parts = text.split(/(\*\*.*?\*\*|`[^`]+`)/g);
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) return <strong key={i} style={{ color: '#F0F0F8', fontWeight: 700 }}>{p.slice(2, -2)}</strong>;
    if (p.startsWith('`') && p.endsWith('`')) return <code key={i} style={{ background: 'rgba(108,99,255,0.15)', color: '#A5B4FC', borderRadius: 4, padding: '1px 5px', fontSize: 12, fontFamily: 'monospace' }}>{p.slice(1, -1)}</code>;
    return p;
  });
}

/* ═══════════════════════════════════════════════════════════
   MAIN CHAT PAGE
═══════════════════════════════════════════════════════════ */
const Chat = () => {
  // ── Session state ──
  const [sessions, setSessions]           = useState([]);
  const [activeSession, setActiveSession] = useState(null); // { sessionId, dataset, title }
  const [loadingSessions, setLoadingSessions] = useState(true);

  // ── Dataset state (for optional context) ──
  const [datasets, setDatasets]         = useState([]);
  const [selectedDataset, setSelectedDataset] = useState(null);

  // ── Messages ──
  const [messages, setMessages]         = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [sending, setSending]           = useState(false);
  const [input, setInput]               = useState('');
  const [error, setError]               = useState('');
  const [copiedIndex, setCopiedIndex]   = useState(null);

  // ── Sidebar ──
  const [searchQuery, setSearchQuery]   = useState('');
  const [sidebarOpen, setSidebarOpen]   = useState(true);

  const messagesEndRef = useRef(null);
  const textareaRef    = useRef(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => { scrollToBottom(); }, [messages, sending]);

  /* ── Fetch sessions for sidebar ────────────────────────────────── */
  const fetchSessions = useCallback(async () => {
    setLoadingSessions(true);
    try {
      const res  = await fetch(`${API}/chat/sessions`, { headers: authHeaders() });
      const data = await res.json();
      if (res.ok && data.success) setSessions(data.sessions || []);
    } catch (e) {
      console.error('fetchSessions error:', e);
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  /* ── Fetch datasets for the "add context" picker ───────────────── */
  const fetchDatasets = useCallback(async () => {
    try {
      const res  = await fetch(`${API}/datasets`, { headers: authHeaders() });
      const data = await res.json();
      if (res.ok && data.success) setDatasets(data.datasets || []);
    } catch (e) {
      console.error('fetchDatasets error:', e);
    }
  }, []);

  useEffect(() => { fetchSessions(); fetchDatasets(); }, []);

  /* ── Load message history when session changes ─────────────────── */
  const fetchMessages = useCallback(async (sessionId) => {
    if (!sessionId) { setMessages([]); return; }
    setLoadingHistory(true);
    setError('');
    try {
      const res  = await fetch(`${API}/chat?sessionId=${sessionId}`, { headers: authHeaders() });
      const data = await res.json();
      if (res.ok && data.success) setMessages(data.chats || []);
    } catch {
      setError('Failed to load conversation history.');
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    if (activeSession?.sessionId) fetchMessages(activeSession.sessionId);
    else setMessages([]);
  }, [activeSession?.sessionId, fetchMessages]);

  /* ── Start a new conversation ──────────────────────────────────── */
  const startNewChat = useCallback(() => {
    const newSession = {
      sessionId: generateSessionId(),
      title:     null,
      dataset:   selectedDataset || null,
    };
    setActiveSession(newSession);
    setMessages([]);
    setInput('');
    setError('');
  }, [selectedDataset]);

  /* ── Load an existing session ──────────────────────────────────── */
  const openSession = useCallback((sess) => {
    setActiveSession({
      sessionId: sess.sessionId,
      title:     sess.title,
      dataset:   sess.dataset || null,
    });
    // Also set selectedDataset so subsequent messages in this session use same dataset
    setSelectedDataset(sess.dataset || null);
  }, []);

  /* ── Send message ──────────────────────────────────────────────── */
  const handleSend = async (textOverride) => {
    const queryText = (textOverride || input).trim();
    if (!queryText || sending) return;

    // If no active session, create one now
    let session = activeSession;
    if (!session) {
      session = { sessionId: generateSessionId(), title: queryText, dataset: selectedDataset };
      setActiveSession(session);
    }

    setInput('');
    setError('');
    setSending(true);

    const tempId = `temp-${Date.now()}`;
    setMessages(prev => [...prev, {
      _id:       tempId,
      message:   queryText,
      response:  '',
      pending:   true,
      createdAt: new Date().toISOString(),
    }]);

    try {
      const res = await fetch(`${API}/chat`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          message:   queryText,
          sessionId: session.sessionId,
          datasetId: (session.dataset || selectedDataset)?._id || null,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'AI engine error');

      setMessages(prev => prev.map(m => m._id === tempId ? data.chat : m));

      // Refresh sidebar sessions to include this new one (or update title)
      fetchSessions();
    } catch (err) {
      setError(`Failed to get response: ${err.message}`);
      setMessages(prev => prev.filter(m => m._id !== tempId));
    } finally {
      setSending(false);
    }
  };

  /* ── Clear current session ─────────────────────────────────────── */
  const handleClearSession = async () => {
    if (!activeSession?.sessionId) return;
    if (!window.confirm('Clear this conversation?')) return;
    try {
      await fetch(`${API}/chat?sessionId=${activeSession.sessionId}`, {
        method: 'DELETE', headers: authHeaders(),
      });
      setMessages([]);
      fetchSessions();
    } catch { alert('Failed to clear chat'); }
  };

  /* ── Copy ──────────────────────────────────────────────────────── */
  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  /* ── Filtered sessions ─────────────────────────────────────────── */
  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return sessions;
    const q = searchQuery.toLowerCase();
    return sessions.filter(s =>
      (s.title || '').toLowerCase().includes(q) ||
      (s.dataset?.datasetName || s.dataset?.originalFilename || '').toLowerCase().includes(q)
    );
  }, [sessions, searchQuery]);

  /* ── Suggested questions for current context ───────────────────── */
  const ctx = activeSession?.dataset || selectedDataset;
  const suggestedQuestions = useMemo(() =>
    getSuggestedQuestions(ctx?.datasetType, ctx?.datasetName || ctx?.originalFilename)
  , [ctx]);

  /* ── Active header label ───────────────────────────────────────── */
  const headerLabel = ctx
    ? (ctx.datasetName || ctx.originalFilename)
    : 'General Chat';

  /* ── Input placeholder ─────────────────────────────────────────── */
  const placeholder = ctx
    ? `Ask anything about ${ctx.datasetName || ctx.originalFilename}… (Enter to send, Shift+Enter for newline)`
    : 'Ask MarketMindAI anything… (Enter to send, Shift+Enter for newline)';

  /* ══════════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════════ */
  return (
    <div style={{
      display: 'flex', height: 'calc(100vh - 84px)', margin: '-24px',
      background: '#0B0B0F', overflow: 'hidden',
    }}>

      {/* ── Left Sidebar ────────────────────────────────────────── */}
      <div style={{
        width: sidebarOpen ? 280 : 0,
        flexShrink: 0,
        background: '#111118',
        borderRight: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        transition: 'width 0.25s cubic-bezier(0.16,1,0.3,1)',
      }}>

        {/* New Chat button */}
        <div style={{ padding: '16px 16px 12px', flexShrink: 0 }}>
          <button
            onClick={startNewChat}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '10px 16px', borderRadius: 12,
              background: 'linear-gradient(135deg, #6C63FF 0%, #4F46E5 100%)',
              color: 'white', fontWeight: 600, fontSize: 13, border: 'none',
              cursor: 'pointer', boxShadow: '0 4px 16px rgba(108,99,255,0.25)',
              transition: 'transform 0.15s ease', whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'none'}
          >
            <Plus size={16} /> New Chat
          </button>
        </div>

        {/* Dataset picker (optional context) */}
        <div style={{ padding: '0 16px 12px', flexShrink: 0 }}>
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(240,240,248,0.3)', margin: '0 0 6px' }}>
            Dataset Context (optional)
          </p>
          <select
            value={selectedDataset?._id || ''}
            onChange={e => {
              const d = datasets.find(x => x._id === e.target.value) || null;
              setSelectedDataset(d);
              // If there's an active unsaved session, update its dataset too
              if (activeSession && !activeSession.msgCount) {
                setActiveSession(prev => ({ ...prev, dataset: d }));
              }
            }}
            style={{
              width: '100%', padding: '7px 10px', borderRadius: 8, boxSizing: 'border-box',
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
              color: '#F0F0F8', fontSize: 12, outline: 'none', cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            <option value="" style={{ background: '#14141A' }}>— No dataset (general chat) —</option>
            {datasets.map(d => (
              <option key={d._id} value={d._id} style={{ background: '#14141A' }}>
                {d.datasetName || d.originalFilename}
              </option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div style={{ padding: '0 16px 12px', flexShrink: 0 }}>
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'rgba(240,240,248,0.3)' }} />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search conversations…"
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '7px 10px 7px 30px', borderRadius: 8,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                color: '#F0F0F8', fontSize: 12, outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Session list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 10px 16px' }}>
          <p style={{
            fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
            color: 'rgba(240,240,248,0.3)', fontFamily: 'monospace', padding: '0 8px 8px',
          }}>
            Recent Conversations
          </p>

          {loadingSessions ? (
            [1, 2, 3].map(i => (
              <div key={i} style={{ height: 52, borderRadius: 10, background: 'rgba(255,255,255,0.03)', marginBottom: 6, animation: 'pulse 1.5s ease-in-out infinite' }} />
            ))
          ) : filteredSessions.length === 0 ? (
            <div style={{ padding: '20px 12px', textAlign: 'center' }}>
              <MessageSquare size={24} color="rgba(240,240,248,0.2)" style={{ margin: '0 auto 8px', display: 'block' }} />
              <p style={{ fontSize: 12, color: 'rgba(240,240,248,0.4)', margin: '0 0 4px' }}>No conversations yet</p>
              <p style={{ fontSize: 11, color: 'rgba(240,240,248,0.25)', margin: 0 }}>Click "New Chat" to start</p>
            </div>
          ) : (
            filteredSessions.map(sess => {
              const active = activeSession?.sessionId === sess.sessionId;
              const dsName = sess.dataset?.datasetName || sess.dataset?.originalFilename;
              return (
                <div
                  key={sess.sessionId}
                  onClick={() => openSession(sess)}
                  style={{
                    padding: '9px 12px', borderRadius: 10, marginBottom: 3,
                    background: active ? 'rgba(108,99,255,0.14)' : 'transparent',
                    border: `1px solid ${active ? 'rgba(108,99,255,0.3)' : 'transparent'}`,
                    cursor: 'pointer', transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 8, flexShrink: 0, marginTop: 1,
                      background: dsName ? 'rgba(108,99,255,0.15)' : 'rgba(52,211,153,0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {dsName ? <Database size={13} color="#A5B4FC" /> : <Globe size={13} color="#34D399" />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontSize: 12, fontWeight: active ? 600 : 400,
                        color: active ? '#F0F0F8' : 'rgba(240,240,248,0.75)',
                        margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {truncate(sess.title, 38)}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                        {dsName && (
                          <span style={{ fontSize: 10, color: '#7C3AED', background: 'rgba(124,58,237,0.1)', padding: '1px 5px', borderRadius: 4, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {truncate(dsName, 16)}
                          </span>
                        )}
                        <span style={{ fontSize: 10, color: 'rgba(240,240,248,0.3)' }}>
                          {formatDate(sess.lastMsgAt || sess.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Clear session footer */}
        {activeSession && messages.length > 0 && (
          <div style={{ padding: 12, borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
            <button
              onClick={handleClearSession}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '7px 12px', borderRadius: 8,
                background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.15)',
                color: '#F87171', fontSize: 11, fontWeight: 600, cursor: 'pointer',
              }}
            >
              <Trash2 size={12} /> Clear Conversation
            </button>
          </div>
        )}
      </div>

      {/* ── Main Chat Area ──────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: '#0B0B0F' }}>

        {/* Top bar */}
        <div style={{
          height: 60, padding: '0 24px', borderBottom: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#111118', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => setSidebarOpen(v => !v)}
              style={{ background: 'none', border: 'none', color: 'rgba(240,240,248,0.5)', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}
            >
              {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 9,
                background: 'linear-gradient(135deg, #6C63FF 0%, #4F46E5 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Bot size={18} color="#fff" />
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#F0F0F8', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                  MarketMindAI Chat
                  <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 10, background: 'rgba(52,211,153,0.15)', color: '#34D399' }}>RAG Engine</span>
                </p>
                <p style={{ fontSize: 11, color: 'rgba(240,240,248,0.4)', margin: 0 }}>
                  {ctx
                    ? <>Context: <strong style={{ color: '#A5B4FC', fontWeight: 500 }}>{headerLabel}</strong></>
                    : <span style={{ color: '#34D399' }}>General Chat — ask anything</span>
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Dataset switcher in header */}
          {datasets.length > 0 && (
            <select
              value={selectedDataset?._id || ''}
              onChange={e => {
                const d = datasets.find(x => x._id === e.target.value) || null;
                setSelectedDataset(d);
                if (activeSession) setActiveSession(prev => ({ ...prev, dataset: d }));
              }}
              style={{
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
                borderRadius: 8, color: '#F0F0F8', fontSize: 12, padding: '6px 12px',
                outline: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
              }}
            >
              <option value="" style={{ background: '#14141A' }}>General Chat (no dataset)</option>
              {datasets.map(d => (
                <option key={d._id} value={d._id} style={{ background: '#14141A' }}>
                  {d.datasetName || d.originalFilename}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Message feed */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Loading skeletons */}
          {loadingHistory && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[1, 2, 3].map(i => <div key={i} style={{ width: '60%', height: 60, borderRadius: 14, background: 'rgba(255,255,255,0.03)', animation: 'pulse 1.5s ease-in-out infinite' }} />)}
            </div>
          )}

          {/* Welcome / empty state */}
          {!loadingHistory && messages.length === 0 && (
            <div style={{ maxWidth: 680, margin: '40px auto 0', textAlign: 'center', width: '100%' }}>
              <div style={{
                width: 54, height: 54, borderRadius: 16,
                background: 'linear-gradient(135deg, rgba(108,99,255,0.15), rgba(56,189,248,0.15))',
                border: '1px solid rgba(108,99,255,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
              }}>
                <Sparkles size={26} color="#A5B4FC" />
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#F0F0F8', margin: '0 0 8px', letterSpacing: '-0.3px' }}>
                {ctx ? `Ask about ${headerLabel}` : 'Ask MarketMindAI Anything'}
              </h2>
              <p style={{ fontSize: 13, color: 'rgba(240,240,248,0.45)', margin: '0 0 32px', lineHeight: 1.6 }}>
                {ctx
                  ? <>Dataset <strong style={{ color: '#38BDF8' }}>{headerLabel}</strong> loaded. Select a suggestion or type your question.</>
                  : <>No dataset selected — you can ask general marketing, analytics, or business questions, or select a dataset for data-specific answers.</>
                }
              </p>

              {/* Message history awareness notice */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 20, marginBottom: 24,
                background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.18)',
                color: '#34D399', fontSize: 11,
              }}>
                <Clock size={12} /> Conversation history is remembered within this session
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
                {suggestedQuestions.map((q, idx) => {
                  const Icon = q.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSend(q.text)}
                      style={{
                        padding: '14px 16px', borderRadius: 14,
                        background: '#111118', border: '1px solid rgba(255,255,255,0.07)',
                        color: 'rgba(240,240,248,0.85)', fontSize: 13, fontWeight: 500,
                        textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 12,
                        transition: 'all 0.18s ease',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(108,99,255,0.4)'; e.currentTarget.style.background = 'rgba(108,99,255,0.06)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.background = '#111118'; }}
                    >
                      <Icon size={16} color="#6C63FF" style={{ marginTop: 2, flexShrink: 0 }} />
                      <span>{q.text}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Message bubbles */}
          {!loadingHistory && messages.map((item, idx) => {
            const userText = item.message || item.question;
            const aiText   = item.response || item.answer;
            return (
              <div key={item._id || idx} style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 840, margin: '0 auto', width: '100%' }}>

                {/* User bubble */}
                {userText && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                    <div style={{
                      maxWidth: '75%', padding: '12px 18px', borderRadius: '18px 18px 4px 18px',
                      background: 'linear-gradient(135deg, #6C63FF 0%, #4F46E5 100%)',
                      color: 'white', fontSize: 13, lineHeight: 1.6, fontWeight: 500,
                      boxShadow: '0 4px 16px rgba(108,99,255,0.25)',
                    }}>
                      {userText}
                    </div>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <User size={16} color="#F0F0F8" />
                    </div>
                  </div>
                )}

                {/* AI response */}
                {item.pending ? (
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, #6C63FF 0%, #38BDF8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Bot size={18} color="#fff" />
                    </div>
                    <div style={{
                      padding: '14px 18px', borderRadius: '4px 18px 18px 18px',
                      background: '#111118', border: '1px solid rgba(255,255,255,0.07)',
                      display: 'flex', alignItems: 'center', gap: 10, color: '#A5B4FC', fontSize: 13,
                    }}>
                      <Sparkles size={14} style={{ animation: 'spin 1.5s linear infinite' }} />
                      MarketMindAI is thinking…
                    </div>
                  </div>
                ) : aiText ? (
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, #6C63FF 0%, #38BDF8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Bot size={18} color="#fff" />
                    </div>
                    <div style={{
                      flex: 1, background: '#111118', border: '1px solid rgba(255,255,255,0.07)',
                      borderRadius: '4px 18px 18px 18px', padding: '16px 20px',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                    }}>
                      <FormattedMarkdown content={aiText} />

                      {/* Citations */}
                      {item.citations && item.citations.length > 0 && (
                        <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 11, color: 'rgba(240,240,248,0.35)', fontWeight: 600 }}>Sources:</span>
                          {item.citations.map((c, ci) => (
                            <span key={ci} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 12, background: 'rgba(56,189,248,0.1)', color: '#38BDF8', border: '1px solid rgba(56,189,248,0.2)' }}>
                              {c}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Action buttons */}
                      <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button
                          onClick={() => handleCopy(aiText, idx)}
                          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(240,240,248,0.5)', fontSize: 11, cursor: 'pointer' }}
                        >
                          {copiedIndex === idx ? <Check size={12} color="#34D399" /> : <Copy size={12} />}
                          {copiedIndex === idx ? 'Copied' : 'Copy'}
                        </button>
                        <button
                          onClick={() => handleSend(userText)}
                          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(240,240,248,0.5)', fontSize: 11, cursor: 'pointer' }}
                        >
                          <RefreshCw size={12} /> Regenerate
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}

          <div ref={messagesEndRef} />
        </div>

        {/* Error banner */}
        {error && (
          <div style={{ margin: '0 24px 12px', padding: '10px 16px', borderRadius: 10, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', color: '#F87171', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>{error}</span>
            <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: '#F87171', cursor: 'pointer' }}><X size={14} /></button>
          </div>
        )}

        {/* Input area */}
        <div style={{ padding: '16px 24px', background: '#111118', borderTop: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
          <div style={{ maxWidth: 840, margin: '0 auto', position: 'relative' }}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
              }}
              placeholder={placeholder}
              disabled={sending}
              rows={2}
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '12px 50px 12px 16px', borderRadius: 14,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
                color: '#F0F0F8', fontSize: 13, outline: 'none', resize: 'none',
                fontFamily: 'Inter, sans-serif', lineHeight: 1.5,
                transition: 'border-color 0.15s ease',
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(108,99,255,0.5)'}
              onBlur={e  => e.target.style.borderColor = 'rgba(255,255,255,0.09)'}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || sending}
              style={{
                position: 'absolute', right: 10, bottom: 12,
                width: 36, height: 36, borderRadius: 10,
                background: input.trim() && !sending ? 'linear-gradient(135deg, #6C63FF 0%, #4F46E5 100%)' : 'rgba(255,255,255,0.06)',
                border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: input.trim() && !sending ? 'pointer' : 'not-allowed',
                opacity: input.trim() && !sending ? 1 : 0.4, transition: 'all 0.15s ease',
              }}
            >
              <Send size={15} />
            </button>
          </div>
          <p style={{ fontSize: 10, color: 'rgba(240,240,248,0.25)', textAlign: 'center', margin: '8px 0 0' }}>
            MarketMindAI RAG System • Conversation history is maintained per session • AI models may produce approximations
          </p>
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes spin  { to{transform:rotate(360deg)} }
        textarea::placeholder { color: rgba(240,240,248,0.25) !important; }
        select option { background: #14141A; color: #F0F0F8; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
      `}</style>
    </div>
  );
};

export default Chat;
