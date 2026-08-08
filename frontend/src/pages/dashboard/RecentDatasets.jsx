import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Database, ArrowUpRight, Eye, RefreshCw, Folder } from 'lucide-react';

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

const statusConfig = {
  Ready: { color: '#4ADE80', bg: 'rgba(74,222,128,0.1)', border: 'rgba(74,222,128,0.2)' },
  Processing: { color: '#38BDF8', bg: 'rgba(56,189,248,0.1)', border: 'rgba(56,189,248,0.2)' },
  Error: { color: '#F87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.2)' },
};

const RecentDatasets = () => {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading]   = useState(true);

  const fetchDatasets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/datasets`, { headers: authHeaders() });
      const data = await res.json();
      if (res.ok && data.success) {
        setDatasets(data.datasets || []);
      }
    } catch (err) {
      console.error("[RecentDatasets] fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDatasets();
  }, [fetchDatasets]);

  return (
    <section style={styles.section}>
      {/* Section header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <Database size={16} color="rgba(108,99,255,0.9)" />
          <h2 style={styles.title}>Recent Datasets</h2>
        </div>
        <Link to="/upload" style={styles.viewAll} className="view-all-link">
          View All <ArrowUpRight size={13} />
        </Link>
      </div>

      {/* Table card */}
      <div style={styles.card}>
        {loading ? (
          <div style={{ padding: '36px', textAlign: 'center', color: 'rgba(240,240,248,0.45)' }}>
            <RefreshCw size={20} className="spin" style={{ marginBottom: '8px' }} />
            <p style={{ margin: 0, fontSize: '13px' }}>Loading datasets…</p>
          </div>
        ) : datasets.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <Folder size={28} color="rgba(108,99,255,0.5)" style={{ marginBottom: '10px' }} />
            <p style={{ color: '#F0F0F8', fontSize: '14px', fontWeight: '600', margin: '0 0 4px' }}>No datasets uploaded yet</p>
            <p style={{ color: 'rgba(240,240,248,0.4)', fontSize: '12px', margin: '0 0 16px' }}>Upload a CSV or Excel dataset to start generating AI analysis.</p>
            <Link to="/upload" style={styles.uploadBtn}>Upload Dataset</Link>
          </div>
        ) : (
          <>
            {/* Table head */}
            <div style={styles.tableHead}>
              <span style={{ ...styles.col, flex: 3 }}>Dataset Name</span>
              <span style={{ ...styles.col, flex: 2 }}>Upload Date</span>
              <span style={{ ...styles.col, flex: 1 }}>Rows</span>
              <span style={{ ...styles.col, flex: 1 }}>Status</span>
              <span style={{ ...styles.col, flex: 1, textAlign: 'right' }}>Actions</span>
            </div>

            {/* Rows */}
            {datasets.slice(0, 4).map((ds, i) => {
              const status = ds.status || 'Ready';
              const sc = statusConfig[status] || statusConfig.Ready;
              const name = ds.datasetName || ds.originalFilename || 'Dataset';
              const dateStr = formatDate(ds.createdAt);
              const rowsStr = ds.rowCount ? ds.rowCount.toLocaleString() : (ds.summary?.rows ? ds.summary.rows.toLocaleString() : '—');

              return (
                <div
                  key={ds._id}
                  style={{
                    ...styles.tableRow,
                    borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.05)',
                  }}
                  className="dataset-row"
                >
                  {/* Name */}
                  <div style={{ ...styles.cellGroup, flex: 3 }}>
                    <div style={styles.fileIcon}>
                      <Database size={13} color="rgba(108,99,255,0.7)" />
                    </div>
                    <span style={styles.fileName}>{name}</span>
                  </div>

                  {/* Date */}
                  <span style={{ ...styles.cell, flex: 2 }}>{dateStr}</span>

                  {/* Rows */}
                  <span style={{ ...styles.cell, flex: 1, fontFamily: 'monospace' }}>
                    {rowsStr}
                  </span>

                  {/* Status pill */}
                  <div style={{ flex: 1 }}>
                    <span
                      style={{
                        ...styles.statusPill,
                        color: sc.color,
                        backgroundColor: sc.bg,
                        border: `1px solid ${sc.border}`,
                      }}
                    >
                      <span
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: '50%',
                          backgroundColor: sc.color,
                          display: 'inline-block',
                        }}
                      />
                      {status}
                    </span>
                  </div>

                  {/* Action */}
                  <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
                    <Link to="/reports" style={styles.actionBtn} className="action-btn" title="View dataset reports">
                      <Eye size={14} color="rgba(240,240,248,0.5)" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      <style>{`
        .dataset-row { transition: background 0.15s ease; }
        .dataset-row:hover { background: rgba(255,255,255,0.03) !important; }
        .action-btn { transition: background 0.15s ease, color 0.15s ease; }
        .action-btn:hover { background: rgba(108,99,255,0.15) !important; }
        .action-btn:hover svg { color: #6C63FF !important; }
        .view-all-link { transition: color 0.15s ease; }
        .view-all-link:hover { color: #7C73FF !important; }
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
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
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
    color: '#6C63FF',
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
  },
  col: {
    fontSize: '10px',
    fontWeight: '600',
    color: 'rgba(240,240,248,0.3)',
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
    fontFamily: 'monospace',
  },
  tableRow: {
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
  },
  fileIcon: {
    width: '28px',
    height: '28px',
    borderRadius: '8px',
    background: 'rgba(108,99,255,0.1)',
    border: '1px solid rgba(108,99,255,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  fileName: {
    fontSize: '13px',
    fontWeight: '500',
    color: 'rgba(240,240,248,0.85)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  cell: {
    fontSize: '12px',
    color: 'rgba(240,240,248,0.4)',
  },
  statusPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: '11px',
    fontWeight: '600',
    padding: '3px 9px',
    borderRadius: '20px',
    fontFamily: 'monospace',
  },
  actionBtn: {
    width: '30px',
    height: '30px',
    borderRadius: '8px',
    border: 'none',
    background: 'rgba(255,255,255,0.04)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};

export default RecentDatasets;
