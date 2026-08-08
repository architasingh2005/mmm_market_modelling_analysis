import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  FileText, ArrowLeft, Download, Trash2, Calendar,
  Database, AlertCircle, RefreshCw, BarChart2,
  TrendingUp, MessageSquare, Layers, CheckCircle, Clock,
} from 'lucide-react';

/* ─── Constants ───────────────────────────────────────────────────── */
const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

const TYPE_META = {
  summary:           { label: 'Executive Report', icon: FileText,      color: '#38BDF8', bg: 'rgba(56,189,248,0.10)',  border: 'rgba(56,189,248,0.22)'  },
  forecast:          { label: 'Forecast',          icon: TrendingUp,    color: '#A78BFA', bg: 'rgba(167,139,250,0.10)', border: 'rgba(167,139,250,0.22)' },
  sentiment:         { label: 'Sentiment',          icon: MessageSquare, color: '#34D399', bg: 'rgba(52,211,153,0.10)',  border: 'rgba(52,211,153,0.22)'  },
  marketing:         { label: 'MMM Analysis',       icon: BarChart2,     color: '#FB923C', bg: 'rgba(251,146,60,0.10)',  border: 'rgba(251,146,60,0.22)'  },
  business_insights: { label: 'Business Insights',  icon: Layers,        color: '#F472B6', bg: 'rgba(244,114,182,0.10)', border: 'rgba(244,114,182,0.22)' },
};

const STATUS_META = {
  completed: { label: 'Completed', icon: CheckCircle, color: '#34D399' },
  pending:   { label: 'Pending',   icon: Clock,       color: '#FB923C' },
  generated: { label: 'Generated', icon: CheckCircle, color: '#38BDF8' },
  failed:    { label: 'Failed',    icon: AlertCircle, color: '#F87171' },
};

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function getTypeMeta(type) {
  return TYPE_META[type] || TYPE_META.summary;
}

/* ─── Summary Card ─────────────────────────────────────────────────── */
const SummaryCard = ({ label, value, color }) => (
  <div style={{
    background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 12, padding: '14px 16px',
  }}>
    <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'rgba(240,240,248,0.3)', fontFamily: 'monospace', margin: '0 0 6px' }}>
      {label}
    </p>
    <p style={{ fontSize: 14, fontWeight: 600, color: color || '#F0F0F8', margin: 0 }}>
      {value ?? '—'}
    </p>
  </div>
);

/* ─── Report Content Renderer ──────────────────────────────────────── */
const ReportContent = ({ content }) => {
  if (!content || content.trim() === '') {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <p style={{ color: 'rgba(240,240,248,0.35)', fontSize: 13 }}>No report content available.</p>
      </div>
    );
  }

  // Try to render markdown-ish content nicely
  const lines = content.split('\n');
  return (
    <div style={{ fontFamily: 'Inter, sans-serif', lineHeight: 1.8 }}>
      {lines.map((line, i) => {
        if (line.startsWith('# '))   return <h2 key={i} style={{ fontSize: 20, fontWeight: 800, color: '#F0F0F8', margin: '28px 0 10px', letterSpacing: '-0.3px' }}>{line.slice(2)}</h2>;
        if (line.startsWith('## '))  return <h3 key={i} style={{ fontSize: 16, fontWeight: 700, color: '#F0F0F8', margin: '22px 0 8px' }}>{line.slice(3)}</h3>;
        if (line.startsWith('### ')) return <h4 key={i} style={{ fontSize: 14, fontWeight: 700, color: 'rgba(240,240,248,0.8)', margin: '18px 0 6px' }}>{line.slice(4)}</h4>;
        if (line.startsWith('- ') || line.startsWith('* ')) return (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, margin: '4px 0' }}>
            <span style={{ color: '#6C63FF', marginTop: 2, flexShrink: 0 }}>▸</span>
            <span style={{ color: 'rgba(240,240,248,0.75)', fontSize: 13 }}>{line.slice(2)}</span>
          </div>
        );
        if (line.trim() === '') return <div key={i} style={{ height: 6 }} />;
        if (line.startsWith('---')) return <hr key={i} style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.08)', margin: '20px 0' }} />;
        return <p key={i} style={{ color: 'rgba(240,240,248,0.7)', fontSize: 13, margin: '4px 0' }}>{line}</p>;
      })}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════════════ */
const ReportDetails = () => {
  const { id }      = useParams();
  const navigate    = useNavigate();

  const [report,   setReport]   = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [fetchErr, setFetchErr] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setFetchErr('');
    try {
      const res  = await fetch(`${API}/reports/${id}`, { headers: authHeaders() });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Report not found');
      setReport(data.report);
    } catch (err) {
      setFetchErr(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  /* Download */
  const handleDownload = async () => {
    if (!report) return;
    const content = report.reportContent || report.content || JSON.stringify(report, null, 2);
    const blob = new Blob([content], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `${report.title.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* Delete */
  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res  = await fetch(`${API}/reports/${id}`, { method: 'DELETE', headers: authHeaders() });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Delete failed');
      navigate('/reports');
    } catch (err) {
      alert('Delete failed: ' + err.message);
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  /* ── Loading ── */
  if (loading) return (
    <div style={{ maxWidth: 820, margin: '0 auto', paddingBottom: 60 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ width: 80, height: 14, borderRadius: 6, background: 'rgba(255,255,255,0.05)' }} />
      </div>
      <div style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: 32, animation: 'skeletonPulse 1.5s ease-in-out infinite' }}>
        <div style={{ width: '60%', height: 24, borderRadius: 8, background: 'rgba(255,255,255,0.06)', marginBottom: 16 }} />
        <div style={{ width: '35%', height: 14, borderRadius: 6, background: 'rgba(255,255,255,0.04)', marginBottom: 32 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 32 }}>
          {[1,2,3].map(i => <div key={i} style={{ height: 62, borderRadius: 12, background: 'rgba(255,255,255,0.04)' }} />)}
        </div>
        {[1,2,3,4,5].map(i => <div key={i} style={{ height: 13, borderRadius: 6, background: 'rgba(255,255,255,0.04)', marginBottom: 10, width: i % 2 === 0 ? '85%' : '100%' }} />)}
      </div>
      <style>{`@keyframes skeletonPulse { 0%,100%{opacity:1} 50%{opacity:.5} }`}</style>
    </div>
  );

  /* ── Error ── */
  if (fetchErr) return (
    <div style={{ maxWidth: 820, margin: '0 auto', paddingBottom: 60 }}>
      <Link to="/reports" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'rgba(240,240,248,0.45)', fontSize: 13, textDecoration: 'none', marginBottom: 28 }}>
        <ArrowLeft size={14} /> Back to Reports
      </Link>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '60px 20px', textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <AlertCircle size={24} color="#F87171" />
        </div>
        <div>
          <p style={{ color: '#F87171', fontWeight: 700, fontSize: 16, margin: '0 0 6px' }}>Report not found</p>
          <p style={{ color: 'rgba(240,240,248,0.4)', fontSize: 13, margin: 0 }}>{fetchErr}</p>
        </div>
        <button onClick={fetchReport} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 10, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', color: '#F87171', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <RefreshCw size={13} /> Retry
        </button>
      </div>
    </div>
  );

  const meta       = getTypeMeta(report.reportType);
  const Icon       = meta.icon;
  const statusMeta = STATUS_META[report.status] || STATUS_META.completed;
  const StatusIcon = statusMeta.icon;

  const summaryFields = report.summary && typeof report.summary === 'object' ? Object.entries(report.summary) : [];

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', paddingBottom: 60 }}>

      {/* Back */}
      <Link
        to="/reports"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          color: 'rgba(240,240,248,0.4)', fontSize: 13, textDecoration: 'none',
          marginBottom: 24, transition: 'color 0.15s ease',
        }}
        onMouseEnter={e => e.currentTarget.style.color = '#F0F0F8'}
        onMouseLeave={e => e.currentTarget.style.color = 'rgba(240,240,248,0.4)'}
      >
        <ArrowLeft size={14} /> Back to Reports
      </Link>

      {/* ── Report header card ───────────────────────────────────────── */}
      <div style={{
        background: '#111118', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 20, padding: '28px 28px 24px', marginBottom: 16,
      }}>
        {/* Top row: icon + title + actions */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 15, flexShrink: 0,
            background: meta.bg, border: `1px solid ${meta.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon size={22} color={meta.color} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#F0F0F8', margin: '0 0 8px', letterSpacing: '-0.4px', lineHeight: 1.3 }}>
              {report.title}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              {/* Type badge */}
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '3px 10px', borderRadius: 20,
                background: meta.bg, border: `1px solid ${meta.border}`,
                color: meta.color, fontSize: 11, fontWeight: 600,
              }}>
                <Icon size={10} />{meta.label}
              </span>
              {/* Status badge */}
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '3px 10px', borderRadius: 20,
                background: `${statusMeta.color}18`,
                color: statusMeta.color, fontSize: 11, fontWeight: 600,
              }}>
                <StatusIcon size={10} />{statusMeta.label}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button
              onClick={handleDownload}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 14px', borderRadius: 10,
                background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.25)',
                color: '#A78BFA', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(167,139,250,0.2)'; e.currentTarget.style.borderColor = 'rgba(167,139,250,0.45)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(167,139,250,0.1)'; e.currentTarget.style.borderColor = 'rgba(167,139,250,0.25)'; }}
            >
              <Download size={13} /> Download
            </button>
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 14px', borderRadius: 10,
                  background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.2)',
                  color: '#F87171', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.16)'; e.currentTarget.style.borderColor = 'rgba(248,113,113,0.4)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.07)'; e.currentTarget.style.borderColor = 'rgba(248,113,113,0.2)'; }}
              >
                <Trash2 size={13} /> Delete
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => setConfirmDelete(false)} style={{ padding: '8px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(240,240,248,0.6)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  style={{ padding: '8px 14px', borderRadius: 10, background: '#F87171', border: 'none', color: 'white', fontSize: 12, fontWeight: 700, cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.7 : 1 }}
                >
                  {deleting ? 'Deleting…' : 'Confirm Delete'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Meta row */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 20,
          padding: '14px 0 0',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <Calendar size={12} color="rgba(240,240,248,0.3)" />
            <span style={{ fontSize: 12, color: 'rgba(240,240,248,0.45)' }}>
              Generated: <strong style={{ color: 'rgba(240,240,248,0.7)', fontWeight: 500 }}>{formatDate(report.generatedAt || report.createdAt)}</strong>
            </span>
          </div>
          {report.datasetId && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <Database size={12} color="rgba(240,240,248,0.3)" />
              <span style={{ fontSize: 12, color: 'rgba(240,240,248,0.45)' }}>
                Dataset ID: <strong style={{ color: 'rgba(240,240,248,0.7)', fontWeight: 500, fontFamily: 'monospace', fontSize: 11 }}>{report.datasetId}</strong>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Summary stats (if available) ─────────────────────────────── */}
      {summaryFields.length > 0 && (
        <div style={{
          background: '#111118', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 16, padding: '20px 22px', marginBottom: 16,
        }}>
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(240,240,248,0.3)', fontFamily: 'monospace', margin: '0 0 14px' }}>
            Summary Metrics
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
            {summaryFields.slice(0, 6).map(([k, v]) => (
              <SummaryCard
                key={k}
                label={k.replace(/_/g, ' ')}
                value={typeof v === 'object' ? JSON.stringify(v) : String(v)}
                color="#38BDF8"
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Report content ────────────────────────────────────────────── */}
      <div style={{
        background: '#111118', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 16, padding: '24px 26px',
      }}>
        <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(240,240,248,0.3)', fontFamily: 'monospace', margin: '0 0 20px' }}>
          Report Content
        </p>
        <ReportContent content={report.reportContent || report.content} />
      </div>
    </div>
  );
};

export default ReportDetails;
