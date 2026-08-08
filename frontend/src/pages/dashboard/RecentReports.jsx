import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FileText, ArrowUpRight, ExternalLink, RefreshCw, Folder } from 'lucide-react';

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

const RecentReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/reports`, { headers: authHeaders() });
      const data = await res.json();
      if (res.ok && data.success) {
        setReports(data.reports || []);
      }
    } catch (err) {
      console.error("[RecentReports] fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return (
    <section style={styles.section}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <FileText size={16} color="rgba(56,189,248,0.9)" />
          <h2 style={styles.title}>Recent Reports</h2>
        </div>
        <Link to="/reports" style={styles.viewAll} className="rr-view-all">
          View All <ArrowUpRight size={13} />
        </Link>
      </div>

      {/* Minimal table */}
      <div style={styles.card}>
        {loading ? (
          <div style={{ padding: '36px', textAlign: 'center', color: 'rgba(240,240,248,0.45)' }}>
            <RefreshCw size={20} className="spin" style={{ marginBottom: '8px' }} />
            <p style={{ margin: 0, fontSize: '13px' }}>Loading reports…</p>
          </div>
        ) : reports.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <Folder size={28} color="rgba(56,189,248,0.5)" style={{ marginBottom: '10px' }} />
            <p style={{ color: '#F0F0F8', fontSize: '14px', fontWeight: '600', margin: '0 0 4px' }}>No reports generated yet</p>
            <p style={{ color: 'rgba(240,240,248,0.4)', fontSize: '12px', margin: '0 0 16px' }}>Generate executive reports automatically by uploading a dataset.</p>
            <Link to="/upload" style={styles.uploadBtn}>Generate Report</Link>
          </div>
        ) : (
          <>
            {/* Head */}
            <div style={styles.tableHead}>
              <span style={{ ...styles.col, flex: 3 }}>Report Title</span>
              <span style={{ ...styles.col, flex: 2 }}>Generated</span>
              <span style={{ ...styles.col, flex: 2 }}>Dataset Used</span>
              <span style={{ ...styles.col, flex: 1, textAlign: 'right' }}>Actions</span>
            </div>

            {/* Rows */}
            {reports.slice(0, 4).map((rpt, i) => {
              const datasetName = rpt.datasetId?.datasetName || rpt.datasetId?.originalFilename || 'Dataset';
              const dateStr = formatDate(rpt.createdAt || rpt.generatedAt);

              return (
                <div
                  key={rpt._id}
                  style={{
                    ...styles.row,
                    borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.05)',
                  }}
                  className="rr-row"
                >
                  {/* Title */}
                  <div style={{ ...styles.cellGroup, flex: 3 }}>
                    <div style={styles.reportIcon}>
                      <FileText size={13} color="rgba(56,189,248,0.7)" />
                    </div>
                    <span style={styles.reportTitle}>{rpt.title}</span>
                  </div>

                  {/* Generated */}
                  <span style={{ ...styles.cell, flex: 2 }}>{dateStr}</span>

                  {/* Dataset */}
                  <span
                    style={{
                      ...styles.cell,
                      flex: 2,
                      fontFamily: 'monospace',
                      fontSize: '11px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {datasetName}
                  </span>

                  {/* Actions */}
                  <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                    <Link to={`/reports/${rpt._id}`} style={styles.iconBtn} className="rr-btn" title="Open">
                      <ExternalLink size={13} color="rgba(240,240,248,0.5)" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      <style>{`
        .rr-row { transition: background 0.15s ease; }
        .rr-row:hover { background: rgba(255,255,255,0.025) !important; }
        .rr-btn { transition: background 0.15s ease; }
        .rr-btn:hover { background: rgba(56,189,248,0.12) !important; }
        .rr-view-all { transition: color 0.15s ease; }
        .rr-view-all:hover { color: #5BB8F5 !important; }
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
    color: '#38BDF8',
    textDecoration: 'none',
  },
  card: {
    backgroundColor: '#121218',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '16px',
    overflow: 'hidden',
  },
  tableHead: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 20px',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    gap: '8px',
  },
  col: {
    fontSize: '10px',
    fontWeight: '600',
    color: 'rgba(240,240,248,0.3)',
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
    fontFamily: 'monospace',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    padding: '14px 20px',
    gap: '8px',
  },
  cellGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    minWidth: 0,
    overflow: 'hidden',
  },
  reportIcon: {
    width: '28px',
    height: '28px',
    borderRadius: '8px',
    background: 'rgba(56,189,248,0.1)',
    border: '1px solid rgba(56,189,248,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  reportTitle: {
    fontSize: '13px',
    fontWeight: '500',
    color: 'rgba(240,240,248,0.85)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  cell: {
    fontSize: '12px',
    color: 'rgba(240,240,248,0.4)',
  },
  iconBtn: {
    width: '30px',
    height: '30px',
    borderRadius: '8px',
    border: 'none',
    background: 'rgba(255,255,255,0.04)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textDecoration: 'none',
  },
};

export default RecentReports;
