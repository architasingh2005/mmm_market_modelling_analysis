import { Link } from 'react-router-dom';
import { Database, ArrowUpRight, Eye } from 'lucide-react';

// Placeholder data — replace with backend API response when ready.
const datasets = [
  {
    id: 'ds-001',
    name: 'synthetic_mmm_weekly_india.csv',
    uploadedAt: 'Today, 10:42 AM',
    status: 'Ready',
    rows: '109,795',
  },
  {
    id: 'ds-002',
    name: 'q2_customer_sentiment_2024.csv',
    uploadedAt: 'Yesterday, 3:18 PM',
    status: 'Processing',
    rows: '45,210',
  },
  {
    id: 'ds-003',
    name: 'brand_spend_channels_q3.xlsx',
    uploadedAt: 'Jul 29, 9:05 AM',
    status: 'Ready',
    rows: '22,480',
  },
  {
    id: 'ds-004',
    name: 'media_mix_attribution_v2.csv',
    uploadedAt: 'Jul 27, 2:00 PM',
    status: 'Error',
    rows: '—',
  },
];

const statusConfig = {
  Ready: { color: '#4ADE80', bg: 'rgba(74,222,128,0.1)', border: 'rgba(74,222,128,0.2)' },
  Processing: { color: '#38BDF8', bg: 'rgba(56,189,248,0.1)', border: 'rgba(56,189,248,0.2)' },
  Error: { color: '#F87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.2)' },
};

const RecentDatasets = () => {
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
        {/* Table head */}
        <div style={styles.tableHead}>
          <span style={{ ...styles.col, flex: 3 }}>Dataset Name</span>
          <span style={{ ...styles.col, flex: 2 }}>Upload Date</span>
          <span style={{ ...styles.col, flex: 1 }}>Rows</span>
          <span style={{ ...styles.col, flex: 1 }}>Status</span>
          <span style={{ ...styles.col, flex: 1, textAlign: 'right' }}>Actions</span>
        </div>

        {/* Rows */}
        {datasets.map((ds, i) => {
          const sc = statusConfig[ds.status] || statusConfig.Ready;
          return (
            <div
              key={ds.id}
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
                <span style={styles.fileName}>{ds.name}</span>
              </div>

              {/* Date */}
              <span style={{ ...styles.cell, flex: 2 }}>{ds.uploadedAt}</span>

              {/* Rows */}
              <span style={{ ...styles.cell, flex: 1, fontFamily: 'monospace' }}>
                {ds.rows}
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
                  {ds.status}
                </span>
              </div>

              {/* Action */}
              <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
                <button style={styles.actionBtn} className="action-btn" title="View dataset">
                  <Eye size={14} color="rgba(240,240,248,0.5)" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .dataset-row { transition: background 0.15s ease; }
        .dataset-row:hover { background: rgba(255,255,255,0.03) !important; }
        .action-btn { transition: background 0.15s ease, color 0.15s ease; }
        .action-btn:hover { background: rgba(108,99,255,0.15) !important; }
        .action-btn:hover svg { color: #6C63FF !important; }
        .view-all-link { transition: color 0.15s ease; }
        .view-all-link:hover { color: #7C73FF !important; }
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
