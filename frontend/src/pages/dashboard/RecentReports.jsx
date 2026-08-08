import { Link } from 'react-router-dom';
import { FileText, ArrowUpRight, ExternalLink, Trash2 } from 'lucide-react';

// Placeholder data — replace with backend API response when ready.
const reports = [
  {
    id: 'rpt-001',
    title: 'Q3 Media Mix Attribution Report',
    generatedAt: 'Today, 11:15 AM',
    dataset: 'synthetic_mmm_weekly_india.csv',
  },
  {
    id: 'rpt-002',
    title: 'Customer Sentiment Executive Summary',
    generatedAt: 'Yesterday, 4:02 PM',
    dataset: 'q2_customer_sentiment_2024.csv',
  },
  {
    id: 'rpt-003',
    title: 'Brand Spend Channel Analysis — H1',
    generatedAt: 'Jul 29, 9:55 AM',
    dataset: 'brand_spend_channels_q3.xlsx',
  },
  {
    id: 'rpt-004',
    title: 'Incremental Lift Model — Pilot Run',
    generatedAt: 'Jul 26, 6:30 PM',
    dataset: 'media_mix_attribution_v2.csv',
  },
];

const RecentReports = () => {
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
        {/* Head */}
        <div style={styles.tableHead}>
          <span style={{ ...styles.col, flex: 3 }}>Report Title</span>
          <span style={{ ...styles.col, flex: 2 }}>Generated</span>
          <span style={{ ...styles.col, flex: 2 }}>Dataset Used</span>
          <span style={{ ...styles.col, flex: 1, textAlign: 'right' }}>Actions</span>
        </div>

        {/* Rows */}
        {reports.map((rpt, i) => (
          <div
            key={rpt.id}
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
            <span style={{ ...styles.cell, flex: 2 }}>{rpt.generatedAt}</span>

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
              {rpt.dataset}
            </span>

            {/* Actions */}
            <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
              <Link to={`/reports/${rpt.id}`} style={styles.iconBtn} className="rr-btn" title="Open">
                <ExternalLink size={13} color="rgba(240,240,248,0.5)" />
              </Link>
              <button style={styles.iconBtn} className="rr-btn rr-del-btn" title="Delete">
                <Trash2 size={13} color="rgba(248,113,113,0.5)" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .rr-row { transition: background 0.15s ease; }
        .rr-row:hover { background: rgba(255,255,255,0.025) !important; }
        .rr-btn { transition: background 0.15s ease; }
        .rr-btn:hover { background: rgba(56,189,248,0.12) !important; }
        .rr-del-btn:hover { background: rgba(248,113,113,0.12) !important; }
        .rr-view-all { transition: color 0.15s ease; }
        .rr-view-all:hover { color: #5BB8F5 !important; }
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
