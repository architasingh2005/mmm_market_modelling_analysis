import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText, Search, SlidersHorizontal, ChevronDown,
  ExternalLink, Download, Trash2, BarChart2, TrendingUp,
  MessageSquare, Layers, AlertCircle, RefreshCw, X,
  ArrowUpDown, ArrowUp, ArrowDown, Sparkles, Database,
  Folder
} from 'lucide-react';

/* ─── Constants ──────────────────────────────────────────────────────── */
const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

const TYPE_META = {
  summary:           { label: 'Dataset Understanding', icon: FileText,      color: '#38BDF8', bg: 'rgba(56,189,248,0.10)',  border: 'rgba(56,189,248,0.22)'  },
  executive:         { label: 'Executive Summary',     icon: Layers,        color: '#F472B6', bg: 'rgba(244,114,182,0.10)', border: 'rgba(244,114,182,0.22)' },
  forecast:          { label: 'Sales Forecast',        icon: TrendingUp,    color: '#A78BFA', bg: 'rgba(167,139,250,0.10)', border: 'rgba(167,139,250,0.22)' },
  sentiment:         { label: 'Sentiment Analysis',    icon: MessageSquare, color: '#34D399', bg: 'rgba(52,211,153,0.10)',  border: 'rgba(52,211,153,0.22)'  },
  marketing:         { label: 'Market Mix Modeling',   icon: BarChart2,     color: '#FB923C', bg: 'rgba(251,146,60,0.10)',  border: 'rgba(251,146,60,0.22)'  },
  business_insights: { label: 'Business Insights',    icon: Layers,        color: '#E879F9', bg: 'rgba(232,121,249,0.10)', border: 'rgba(232,121,249,0.22)' },
};

const STATUS_META = {
  completed: { label: 'Completed', color: '#34D399', bg: 'rgba(52,211,153,0.10)'  },
  pending:   { label: 'Pending',   color: '#FB923C', bg: 'rgba(251,146,60,0.10)'  },
  generated: { label: 'Generated', color: '#38BDF8', bg: 'rgba(56,189,248,0.10)'  },
  failed:    { label: 'Failed',    color: '#F87171', bg: 'rgba(248,113,113,0.10)' },
};

const CATEGORIES = [
  'All',
  'Marketing Mix Modeling',
  'Customer Reviews',
  'Generic',
];

const SORT_OPTIONS = [
  { key: 'date_desc',  label: 'Newest First',   icon: ArrowDown  },
  { key: 'date_asc',   label: 'Oldest First',   icon: ArrowUp    },
  { key: 'title_asc',  label: 'Alphabetical',   icon: ArrowUpDown },
];

/* ─── Helpers ────────────────────────────────────────────────────────── */
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
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getTypeMeta(type) {
  return TYPE_META[type] || TYPE_META.summary;
}

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/* ─── Sub-components ─────────────────────────────────────────────────── */
const Dropdown = ({ label, options, value, onChange, renderLabel }) => {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 14px', borderRadius: 10,
          background: value !== options[0] ? 'rgba(108,99,255,0.12)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${value !== options[0] ? 'rgba(108,99,255,0.35)' : 'rgba(255,255,255,0.09)'}`,
          color: value !== options[0] ? '#A5B4FC' : 'rgba(240,240,248,0.55)',
          fontSize: 13, fontWeight: 500, cursor: 'pointer',
          whiteSpace: 'nowrap', transition: 'all 0.15s ease',
        }}
      >
        {renderLabel ? renderLabel(value) : (options.find(o => o === value) || label)}
        <ChevronDown size={13} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 50,
            minWidth: 170, background: '#18181F', borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 16px 48px rgba(0,0,0,0.6)', overflow: 'hidden',
          }}>
            {options.map(opt => (
              <button
                key={opt}
                onClick={() => { onChange(opt); setOpen(false); }}
                style={{
                  width: '100%', textAlign: 'left', padding: '9px 14px',
                  background: opt === value ? 'rgba(108,99,255,0.12)' : 'transparent',
                  color: opt === value ? '#A5B4FC' : 'rgba(240,240,248,0.7)',
                  fontSize: 13, fontWeight: opt === value ? 600 : 400,
                  border: 'none', cursor: 'pointer',
                  transition: 'background 0.12s ease',
                }}
                onMouseEnter={e => { if (opt !== value) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                onMouseLeave={e => { if (opt !== value) e.currentTarget.style.background = 'transparent'; }}
              >
                {renderLabel ? renderLabel(opt) : opt}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const meta = STATUS_META[status] || STATUS_META.completed;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 9px', borderRadius: 20,
      background: meta.bg, color: meta.color,
      fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: meta.color, display: 'inline-block' }} />
      {meta.label}
    </span>
  );
};

const CategoryBadge = ({ category }) => {
  let color = '#38BDF8';
  let bg = 'rgba(56,189,248,0.10)';
  let border = 'rgba(56,189,248,0.22)';

  if (category === 'Marketing Mix Modeling') {
    color = '#A78BFA';
    bg = 'rgba(167,139,250,0.10)';
    border = 'rgba(167,139,250,0.22)';
  } else if (category === 'Customer Reviews') {
    color = '#34D399';
    bg = 'rgba(52,211,153,0.10)';
    border = 'rgba(52,211,153,0.22)';
  }

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 20,
      background: bg, border: `1px solid ${border}`,
      color: color, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
    }}>
      {category}
    </span>
  );
};

/* ─── Delete Confirmation Modal ──────────────────────────────────────── */
const DeleteModal = ({ report, onConfirm, onCancel, deleting }) => (
  <div style={{
    position: 'fixed', inset: 0, zIndex: 200,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
  }}>
    <div style={{
      background: '#14141A', borderRadius: 20,
      border: '1px solid rgba(248,113,113,0.22)',
      boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
      padding: '32px 28px', maxWidth: 420, width: '90%',
      animation: 'modalIn 0.2s cubic-bezier(0.16,1,0.3,1)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.22)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Trash2 size={18} color="#F87171" />
        </div>
        <div>
          <p style={{ color: '#F0F0F8', fontWeight: 700, fontSize: 16, margin: 0 }}>Delete Report</p>
          <p style={{ color: 'rgba(240,240,248,0.45)', fontSize: 12, margin: 0, marginTop: 2 }}>This action cannot be undone</p>
        </div>
      </div>
      <p style={{ color: 'rgba(240,240,248,0.65)', fontSize: 13, lineHeight: 1.6, marginBottom: 24 }}>
        Are you sure you want to delete <strong style={{ color: '#F0F0F8' }}>"{report?.title}"</strong>? The report document will be permanently removed.
      </p>
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={onCancel}
          style={{
            flex: 1, padding: '10px 0', borderRadius: 10,
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
            color: 'rgba(240,240,248,0.7)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={deleting}
          style={{
            flex: 1, padding: '10px 0', borderRadius: 10,
            background: deleting ? 'rgba(248,113,113,0.4)' : 'rgba(248,113,113,0.85)',
            border: 'none', color: 'white', fontSize: 13, fontWeight: 600,
            cursor: deleting ? 'not-allowed' : 'pointer',
            transition: 'background 0.15s ease',
          }}
        >
          {deleting ? 'Deleting…' : 'Delete Report'}
        </button>
      </div>
    </div>
    <style>{`@keyframes modalIn { from { opacity:0; transform:scale(0.95); } to { opacity:1; transform:scale(1); } }`}</style>
  </div>
);

/* ─── Dataset Card (Expandable Group) ────────────────────────────────── */
const DatasetGroupCard = ({ group, isExpanded, onToggleExpand, onDeleteReport, onDownloadReport }) => {
  const [hovered, setHovered] = useState(false);

  // Icon based on dataset category
  const Icon = group.category === 'Marketing Mix Modeling'
    ? BarChart2
    : group.category === 'Customer Reviews'
      ? MessageSquare
      : Database;

  const iconColor = group.category === 'Marketing Mix Modeling'
    ? '#A78BFA'
    : group.category === 'Customer Reviews'
      ? '#34D399'
      : '#38BDF8';

  const iconBg = group.category === 'Marketing Mix Modeling'
    ? 'rgba(167,139,250,0.10)'
    : group.category === 'Customer Reviews'
      ? 'rgba(52,211,153,0.10)'
      : 'rgba(56,189,248,0.10)';

  const iconBorder = group.category === 'Marketing Mix Modeling'
    ? 'rgba(167,139,250,0.22)'
    : group.category === 'Customer Reviews'
      ? 'rgba(52,211,153,0.22)'
      : 'rgba(56,189,248,0.22)';

  return (
    <div
      style={{
        background: hovered ? 'rgba(255,255,255,0.026)' : '#111118',
        border: `1px solid ${hovered ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: 18,
        overflow: 'hidden',
        transition: 'all 0.18s ease',
      }}
    >
      {/* ── Group Header (Clickable) ────────────────────────────────────── */}
      <div
        onClick={onToggleExpand}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          padding: '20px 24px',
          display: 'flex', alignItems: 'center', gap: 18,
          cursor: 'pointer', userSelect: 'none',
        }}
      >
        {/* Dataset Icon */}
        <div style={{
          width: 48, height: 48, borderRadius: 14, flexShrink: 0,
          background: iconBg, border: `1px solid ${iconBorder}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'transform 0.15s ease',
          transform: hovered ? 'scale(1.05)' : 'scale(1)',
        }}>
          <Icon size={22} color={iconColor} />
        </div>

        {/* Dataset Name & Metadata */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <h3 style={{
              fontSize: 16, fontWeight: 700, color: '#F0F0F8',
              margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {group.datasetName}
            </h3>
            <CategoryBadge category={group.category} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: 'rgba(240,240,248,0.4)' }}>
              Uploaded {formatDate(group.uploadDate)}
            </span>
            <span style={{ fontSize: 12, color: 'rgba(240,240,248,0.25)' }}>•</span>
            <span style={{ fontSize: 12, color: '#A5B4FC', fontWeight: 600 }}>
              {group.reports.length} report{group.reports.length !== 1 ? 's' : ''} generated
            </span>
          </div>
        </div>

        {/* Right side: Overall Status & Expand Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
          <StatusBadge status={group.status} />

          <button
            style={{
              width: 34, height: 34, borderRadius: 10,
              background: isExpanded ? 'rgba(108,99,255,0.15)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${isExpanded ? 'rgba(108,99,255,0.35)' : 'rgba(255,255,255,0.08)'}`,
              color: isExpanded ? '#A5B4FC' : 'rgba(240,240,248,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.2s ease',
            }}
          >
            <ChevronDown
              size={16}
              style={{
                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.25s cubic-bezier(0.16,1,0.3,1)',
              }}
            />
          </button>
        </div>
      </div>

      {/* ── Expanded Reports List ────────────────────────────────────────── */}
      {isExpanded && (
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(0,0,0,0.18)',
          padding: '12px 18px 18px',
        }}>
          <p style={{
            fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.08em', color: 'rgba(240,240,248,0.3)',
            fontFamily: 'monospace', margin: '10px 8px 10px',
          }}>
            Generated Reports
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {group.reports.map((report) => {
              const meta = getTypeMeta(report?.reportType);
              const ReportIcon = meta.icon;

              return (
                <div
                  key={report._id}
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: 12, padding: '12px 16px',
                    display: 'flex', alignItems: 'center', gap: 14,
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                >
                  {/* Bullet / Icon */}
                  <div style={{
                    width: 32, height: 32, borderRadius: 9,
                    background: meta.bg, border: `1px solid ${meta.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <ReportIcon size={14} color={meta.color} />
                  </div>

                  {/* Title & Type */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <p style={{
                        fontSize: 13, fontWeight: 600, color: '#F0F0F8',
                        margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {report.title}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 2 }}>
                      <span style={{ fontSize: 11, color: meta.color, fontWeight: 500 }}>
                        {meta.label}
                      </span>
                      <span style={{ fontSize: 11, color: 'rgba(240,240,248,0.25)' }}>•</span>
                      <span style={{ fontSize: 11, color: 'rgba(240,240,248,0.35)' }}>
                        {formatDate(report.generatedAt || report.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <StatusBadge status={report.status} />

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <Link
                      to={`/reports/${report._id}`}
                      title="View Report"
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        padding: '6px 12px', borderRadius: 8,
                        background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)',
                        color: '#38BDF8', fontSize: 12, fontWeight: 600,
                        textDecoration: 'none', transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(56,189,248,0.18)'; e.currentTarget.style.borderColor = 'rgba(56,189,248,0.4)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(56,189,248,0.08)'; e.currentTarget.style.borderColor = 'rgba(56,189,248,0.2)'; }}
                    >
                      <ExternalLink size={12} />
                      View
                    </Link>

                    <button
                      onClick={() => onDownloadReport(report)}
                      title="Download Report"
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        padding: '6px 12px', borderRadius: 8,
                        background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)',
                        color: '#A78BFA', fontSize: 12, fontWeight: 600,
                        cursor: 'pointer', transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(167,139,250,0.18)'; e.currentTarget.style.borderColor = 'rgba(167,139,250,0.4)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(167,139,250,0.08)'; e.currentTarget.style.borderColor = 'rgba(167,139,250,0.2)'; }}
                    >
                      <Download size={12} />
                      Download
                    </button>

                    <button
                      onClick={() => onDeleteReport(report)}
                      title="Delete Report"
                      style={{
                        width: 30, height: 30, borderRadius: 8,
                        background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.18)'; e.currentTarget.style.borderColor = 'rgba(248,113,113,0.4)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.06)'; e.currentTarget.style.borderColor = 'rgba(248,113,113,0.15)'; }}
                    >
                      <Trash2 size={13} color="#F87171" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Empty State ────────────────────────────────────────────────────── */
const EmptyState = ({ filtered }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', padding: '80px 20px', textAlign: 'center',
  }}>
    <div style={{
      width: 72, height: 72, borderRadius: 20,
      background: 'rgba(108,99,255,0.08)', border: '1px solid rgba(108,99,255,0.18)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20,
    }}>
      <Folder size={32} color="rgba(108,99,255,0.6)" />
    </div>
    <p style={{ color: '#F0F0F8', fontSize: 18, fontWeight: 700, margin: '0 0 8px' }}>
      {filtered ? 'No matching datasets' : 'No reports yet'}
    </p>
    <p style={{ color: 'rgba(240,240,248,0.4)', fontSize: 13, maxWidth: 320, lineHeight: 1.6, margin: 0 }}>
      {filtered
        ? 'Try adjusting your search query or filter selection to find what you\'re looking for.'
        : 'Upload a dataset to automatically generate your AI-powered business reports.'}
    </p>
    {!filtered && (
      <Link
        to="/upload"
        style={{
          marginTop: 24, padding: '10px 22px', borderRadius: 10,
          background: 'linear-gradient(135deg, #6C63FF 0%, #4F46E5 100%)',
          color: 'white', textDecoration: 'none', fontSize: 13, fontWeight: 600,
          boxShadow: '0 4px 16px rgba(108,99,255,0.3)',
        }}
      >
        Upload Dataset
      </Link>
    )}
  </div>
);

/* ═══════════════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════════════ */
const Reports = () => {
  // ── Data ──
  const [reports,  setReports]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [fetchErr, setFetchErr] = useState('');

  // ── Controls ──
  const [search,         setSearch]         = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortKey,        setSortKey]        = useState('date_desc');

  // ── Expanded groups ──
  const [expandedGroups, setExpandedGroups] = useState(new Set());

  // ── Delete modal ──
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting,     setDeleting]     = useState(false);

  /* Fetch reports from backend */
  const fetchReports = useCallback(async () => {
    setLoading(true);
    setFetchErr('');
    try {
      const res  = await fetch(`${API}/reports`, { headers: authHeaders() });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to load reports');
      setReports(data.reports || []);
    } catch (err) {
      setFetchErr(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  /* Download report */
  const handleDownload = useCallback(async (report) => {
    if (!report?._id) return;
    try {
      const res  = await fetch(`${API}/reports/${report._id}/download`, { headers: authHeaders() });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error('Download failed');
      const content = data.report?.reportContent || data.report?.content || JSON.stringify(data.report, null, 2);
      const blob = new Blob([content], { type: 'text/plain' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url;
      a.download = `${(report.title || 'report').replace(/\s+/g, '_')}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Download failed: ' + err.message);
    }
  }, []);

  /* Delete report */
  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget?._id) return;
    setDeleting(true);
    try {
      const res  = await fetch(`${API}/reports/${deleteTarget._id}`, {
        method: 'DELETE', headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Delete failed');
      setReports(prev => prev.filter(r => r._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch (err) {
      alert('Delete failed: ' + err.message);
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget]);

  /* Group reports by parent dataset (100% defensive against null datasetId) */
  const datasetGroups = useMemo(() => {
    if (!Array.isArray(reports) || reports.length === 0) return [];

    const groupMap = new Map();

    reports.forEach((report) => {
      if (!report) return;

      const datasetObj = (report.datasetId && typeof report.datasetId === 'object') ? report.datasetId : null;
      const datasetKey = String(
        datasetObj?._id ||
        (typeof report.datasetId === 'string' || typeof report.datasetId === 'number' ? report.datasetId : null) ||
        report._id
      );

      let dName = datasetObj?.datasetName || datasetObj?.originalFilename;
      if (!dName && report.title && report.title.toLowerCase().includes('.csv')) {
        dName = report.title;
      }

      if (!groupMap.has(datasetKey)) {
        groupMap.set(datasetKey, {
          id: datasetKey,
          datasetName: dName || 'Dataset Analysis',
          uploadDate: datasetObj?.createdAt || report.generatedAt || report.createdAt,
          reports: [],
        });
      }

      const group = groupMap.get(datasetKey);
      group.reports.push(report);

      if (group.datasetName === 'Dataset Analysis' && dName) {
        group.datasetName = dName;
      }
    });

    return Array.from(groupMap.values()).map((group) => {
      const types = group.reports.map(r => r?.reportType || '');
      const dNameLower = (group.datasetName || '').toLowerCase();

      let category = 'Generic';
      if (types.includes('marketing') || dNameLower.includes('mmm') || dNameLower.includes('marketing') || dNameLower.includes('mix')) {
        category = 'Marketing Mix Modeling';
      } else if (types.includes('sentiment') || dNameLower.includes('sentiment') || dNameLower.includes('review')) {
        category = 'Customer Reviews';
      }

      const hasFailed = group.reports.some(r => r?.status === 'failed');
      const hasPending = group.reports.some(r => r?.status === 'pending');
      const status = hasFailed ? 'failed' : (hasPending ? 'pending' : 'completed');

      return {
        ...group,
        category,
        status,
      };
    });
  }, [reports]);

  // Default expand all dataset groups initially
  useEffect(() => {
    if (datasetGroups.length > 0 && expandedGroups.size === 0) {
      setExpandedGroups(new Set(datasetGroups.map(g => g.id)));
    }
  }, [datasetGroups]);

  /* Filtered and sorted dataset groups */
  const displayedGroups = useMemo(() => {
    let list = [...datasetGroups];
    const q = search.trim().toLowerCase();

    // 1. Search filter (matches dataset name or any report title in dataset)
    if (q) {
      list = list.filter(group => (
        (group.datasetName || '').toLowerCase().includes(q) ||
        group.reports.some(r => (r?.title || '').toLowerCase().includes(q) || (r?.reportType || '').toLowerCase().includes(q))
      ));
    }

    // 2. Category filter
    if (categoryFilter !== 'All') {
      list = list.filter(group => group.category === categoryFilter);
    }

    // 3. Sorting
    switch (sortKey) {
      case 'date_desc':
        list.sort((a, b) => new Date(b.uploadDate || 0) - new Date(a.uploadDate || 0));
        break;
      case 'date_asc':
        list.sort((a, b) => new Date(a.uploadDate || 0) - new Date(b.uploadDate || 0));
        break;
      case 'title_asc':
        list.sort((a, b) => (a.datasetName || '').localeCompare(b.datasetName || ''));
        break;
    }

    return list;
  }, [datasetGroups, search, categoryFilter, sortKey]);

  /* Toggle expansion for a dataset group */
  const toggleExpand = (groupId) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const hasActiveFilter = categoryFilter !== 'All' || search.trim() !== '';

  const clearFilters = () => {
    setSearch('');
    setCategoryFilter('All');
    setSortKey('date_desc');
  };

  /* ── Render ── */
  return (
    <div style={{ maxWidth: 920, margin: '0 auto', paddingBottom: 60 }}>

      {/* Delete modal */}
      {deleteTarget && (
        <DeleteModal
          report={deleteTarget}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
          deleting={deleting}
        />
      )}

      {/* ── Hero Header ─────────────────────────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9,
            background: 'linear-gradient(135deg, #38BDF8 0%, #6C63FF 100%)',
            boxShadow: '0 4px 14px rgba(56,189,248,0.28)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <FileText size={15} color="#fff" />
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'monospace', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#38BDF8' }}>
            Analysis Archive
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: '#F0F0F8', margin: 0, letterSpacing: '-0.5px' }}>
              Reports
            </h1>
            <p style={{ fontSize: 13, color: 'rgba(240,240,248,0.45)', margin: '4px 0 0' }}>
              {loading
                ? 'Loading dataset reports…'
                : `${datasetGroups.length} dataset${datasetGroups.length !== 1 ? 's' : ''} • ${reports.length} report${reports.length !== 1 ? 's' : ''} generated`}
            </p>
          </div>

          <Link
            to="/upload"
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '9px 18px', borderRadius: 10,
              background: 'linear-gradient(135deg, #6C63FF 0%, #4F46E5 100%)',
              color: 'white', textDecoration: 'none', fontSize: 13, fontWeight: 600,
              boxShadow: '0 4px 16px rgba(108,99,255,0.3)',
            }}
          >
            <Sparkles size={13} />
            New Report
          </Link>
        </div>
      </div>

      {/* ── Toolbar (Search, Filter, Sort) ──────────────────────────── */}
      <div style={{
        background: '#111118', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 16, padding: '14px 16px', marginBottom: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>

          {/* Search Bar */}
          <div style={{ flex: 1, minWidth: 220, position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(240,240,248,0.3)', pointerEvents: 'none' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search datasets by name…"
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '9px 36px 9px 36px', borderRadius: 10,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                color: '#F0F0F8', fontSize: 13, outline: 'none',
                fontFamily: 'Inter, sans-serif',
                transition: 'border-color 0.15s ease',
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(108,99,255,0.5)'}
              onBlur={e  => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(240,240,248,0.35)', padding: 2 }}>
                <X size={13} />
              </button>
            )}
          </div>

          {/* Filter Dropdown */}
          <Dropdown
            label="Filter Category"
            options={CATEGORIES}
            value={categoryFilter}
            onChange={setCategoryFilter}
            renderLabel={val => val === 'All' ? 'All Categories' : val}
          />

          {/* Sort Dropdown */}
          <Dropdown
            label="Sort"
            options={SORT_OPTIONS.map(s => s.key)}
            value={sortKey}
            onChange={setSortKey}
            renderLabel={key => {
              const opt = SORT_OPTIONS.find(s => s.key === key);
              return opt ? opt.label : 'Sort';
            }}
          />

          {/* Clear Filters Button */}
          {hasActiveFilter && (
            <button
              onClick={clearFilters}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '8px 12px', borderRadius: 10,
                background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.2)',
                color: '#F87171', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}
            >
              <X size={11} /> Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* ── Active Filter Summary ────────────────────────────────────── */}
      {!loading && !fetchErr && hasActiveFilter && (
        <p style={{ fontSize: 12, color: 'rgba(240,240,248,0.35)', marginBottom: 16 }}>
          Showing <strong style={{ color: 'rgba(240,240,248,0.7)' }}>{displayedGroups.length}</strong> of <strong style={{ color: 'rgba(240,240,248,0.7)' }}>{datasetGroups.length}</strong> datasets
        </p>
      )}

      {/* ── Main Content Area ────────────────────────────────────────── */}
      {loading ? (
        /* Skeleton Loading */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[1, 2].map(i => (
            <div key={i} style={{
              background: '#111118', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 18, padding: '22px 24px',
              animation: 'skeletonPulse 1.5s ease-in-out infinite',
              animationDelay: `${i * 0.15}s`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(255,255,255,0.05)' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ width: '45%', height: 16, borderRadius: 6, background: 'rgba(255,255,255,0.06)', marginBottom: 10 }} />
                  <div style={{ width: '25%', height: 11, borderRadius: 6, background: 'rgba(255,255,255,0.04)' }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : fetchErr ? (
        /* Error State */
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 14, padding: '60px 20px', textAlign: 'center',
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <AlertCircle size={24} color="#F87171" />
          </div>
          <div>
            <p style={{ color: '#F87171', fontWeight: 700, fontSize: 16, margin: '0 0 6px' }}>Failed to load reports</p>
            <p style={{ color: 'rgba(240,240,248,0.4)', fontSize: 13, margin: 0 }}>{fetchErr}</p>
          </div>
          <button
            onClick={fetchReports}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '9px 18px', borderRadius: 10,
              background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)',
              color: '#F87171', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            <RefreshCw size={13} /> Retry
          </button>
        </div>
      ) : displayedGroups.length === 0 ? (
        /* Empty State */
        <EmptyState filtered={hasActiveFilter} />
      ) : (
        /* Dataset Group Cards */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {displayedGroups.map(group => (
            <DatasetGroupCard
              key={group.id}
              group={group}
              isExpanded={expandedGroups.has(group.id)}
              onToggleExpand={() => toggleExpand(group.id)}
              onDeleteReport={setDeleteTarget}
              onDownloadReport={handleDownload}
            />
          ))}
        </div>
      )}

      <style>{`
        @keyframes skeletonPulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.5; }
        }
        input::placeholder { color: rgba(240,240,248,0.25) !important; }
      `}</style>
    </div>
  );
};

export default Reports;
