import { Link } from 'react-router-dom';
import { UploadCloud, MessageSquare, ArrowRight } from 'lucide-react';

const WelcomeSection = () => {
  return (
    <section style={styles.wrapper}>
      {/* Left — copy */}
      <div style={styles.left}>
        <span style={styles.eyebrow}>AI-Powered Business Intelligence</span>

        <h1 style={styles.heading}>
          Welcome Back&nbsp;
          <span role="img" aria-label="wave">👋</span>
        </h1>

        <p style={styles.subtitle}>
          Continue transforming your business data into actionable intelligence.
        </p>

        <p style={styles.description}>
          Upload a dataset, generate AI-powered executive reports, and explore
          your data conversationally using Retrieval-Augmented Generation.
        </p>

        <div style={styles.actions}>
          {/* Primary CTA */}
          <Link to="/upload" style={styles.primaryBtn} className="welcome-btn-primary">
            <UploadCloud size={17} />
            Upload Dataset
            <ArrowRight size={15} style={{ marginLeft: 'auto', opacity: 0.7 }} />
          </Link>

          {/* Secondary CTA */}
          <Link to="/chat" style={styles.secondaryBtn} className="welcome-btn-secondary">
            <MessageSquare size={17} />
            Open AI Chat
          </Link>
        </div>
      </div>

      {/* Right — decorative visual */}
      <div style={styles.right} aria-hidden="true">
        <div style={styles.orb} />
        <div style={styles.glassCard}>
          <div style={styles.glassRow}>
            <span style={styles.glassDot('#6C63FF')} />
            <span style={styles.glassLabel}>AI Report Generated</span>
            <span style={styles.glassTime}>just now</span>
          </div>
          <div style={styles.glassRow}>
            <span style={styles.glassDot('#4ADE80')} />
            <span style={styles.glassLabel}>Dataset Validated</span>
            <span style={styles.glassTime}>2m ago</span>
          </div>
          <div style={styles.glassRow}>
            <span style={styles.glassDot('#38BDF8')} />
            <span style={styles.glassLabel}>RAG Chat Session</span>
            <span style={styles.glassTime}>5m ago</span>
          </div>
          <div style={styles.glassRow}>
            <span style={styles.glassDot('#FB923C')} />
            <span style={styles.glassLabel}>Report Downloaded</span>
            <span style={styles.glassTime}>12m ago</span>
          </div>
        </div>
      </div>

      {/* Hover style injection */}
      <style>{`
        .welcome-btn-primary {
          transition: box-shadow 0.2s ease, transform 0.18s ease, background 0.2s ease;
        }
        .welcome-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 0 28px rgba(108, 99, 255, 0.45);
          background: linear-gradient(135deg, #7C73FF 0%, #5B52F0 100%) !important;
        }
        .welcome-btn-secondary {
          transition: border-color 0.2s ease, background 0.2s ease, transform 0.18s ease;
        }
        .welcome-btn-secondary:hover {
          transform: translateY(-2px);
          background: rgba(255,255,255,0.06) !important;
          border-color: rgba(255,255,255,0.18) !important;
        }
      `}</style>
    </section>
  );
};

const styles = {
  wrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '48px',
    padding: '48px 0 40px',
    position: 'relative',
    flexWrap: 'wrap',
  },
  left: {
    flex: '1 1 440px',
    maxWidth: '580px',
  },
  eyebrow: {
    display: 'inline-block',
    fontSize: '11px',
    fontWeight: '600',
    letterSpacing: '1.2px',
    textTransform: 'uppercase',
    color: '#6C63FF',
    marginBottom: '16px',
    fontFamily: 'monospace',
  },
  heading: {
    fontSize: 'clamp(2rem, 4vw, 3rem)',
    fontWeight: '800',
    color: '#F0F0F8',
    lineHeight: 1.15,
    margin: '0 0 14px',
    letterSpacing: '-0.5px',
  },
  subtitle: {
    fontSize: '18px',
    fontWeight: '500',
    color: 'rgba(240,240,248,0.75)',
    margin: '0 0 12px',
    lineHeight: 1.5,
  },
  description: {
    fontSize: '14px',
    color: 'rgba(240,240,248,0.45)',
    lineHeight: 1.75,
    margin: '0 0 36px',
    maxWidth: '480px',
  },
  actions: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  },
  primaryBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '9px',
    padding: '13px 24px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #6C63FF 0%, #4F46E5 100%)',
    color: '#fff',
    fontWeight: '600',
    fontSize: '14px',
    textDecoration: 'none',
    boxShadow: '0 4px 20px rgba(108,99,255,0.3)',
    minWidth: '172px',
  },
  secondaryBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '9px',
    padding: '13px 24px',
    borderRadius: '12px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: 'rgba(240,240,248,0.8)',
    fontWeight: '600',
    fontSize: '14px',
    textDecoration: 'none',
  },

  /* Right decorative panel */
  right: {
    flex: '1 1 300px',
    maxWidth: '360px',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '220px',
  },
  orb: {
    position: 'absolute',
    width: '260px',
    height: '260px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(108,99,255,0.18) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  glassCard: {
    position: 'relative',
    width: '100%',
    background: 'rgba(18, 18, 24, 0.85)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '16px',
    padding: '20px',
    backdropFilter: 'blur(12px)',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  glassRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  glassDot: (color) => ({
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: color,
    flexShrink: 0,
    boxShadow: `0 0 6px ${color}80`,
  }),
  glassLabel: {
    flex: 1,
    fontSize: '13px',
    color: 'rgba(240,240,248,0.7)',
    fontWeight: '500',
  },
  glassTime: {
    fontSize: '11px',
    color: 'rgba(240,240,248,0.3)',
    fontFamily: 'monospace',
    whiteSpace: 'nowrap',
  },
};

export default WelcomeSection;
