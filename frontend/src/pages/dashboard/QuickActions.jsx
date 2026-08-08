import { Link } from 'react-router-dom';
import { UploadCloud, FileText, MessageSquare, BookOpen } from 'lucide-react';

// Quick action cards — each links to a core workflow step.
const actions = [
  {
    id: 'upload',
    icon: UploadCloud,
    label: 'Upload Dataset',
    description: 'Import a CSV or Excel file to begin AI-powered analysis.',
    to: '/upload',
    accentColor: '#6C63FF',
    glowColor: 'rgba(108,99,255,0.25)',
  },
  {
    id: 'report',
    icon: FileText,
    label: 'Generate Report',
    description: 'Trigger an AI executive report from your latest dataset.',
    to: '/reports',
    accentColor: '#38BDF8',
    glowColor: 'rgba(56,189,248,0.2)',
  },
  {
    id: 'chat',
    icon: MessageSquare,
    label: 'Open AI Chat',
    description: 'Converse with your data using Retrieval-Augmented Generation.',
    to: '/chat',
    accentColor: '#4ADE80',
    glowColor: 'rgba(74,222,128,0.2)',
  },
  {
    id: 'browse',
    icon: BookOpen,
    label: 'Browse Reports',
    description: 'Review, download, and share previously generated reports.',
    to: '/reports',
    accentColor: '#FB923C',
    glowColor: 'rgba(251,146,60,0.2)',
  },
];

const QuickActions = () => {
  return (
    <section style={styles.section}>
      <h2 style={styles.sectionTitle}>Quick Actions</h2>

      <div style={styles.grid}>
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.id}
              to={action.to}
              style={{
                ...styles.card,
                '--glow': action.glowColor,
                '--accent': action.accentColor,
              }}
              className="qa-card"
            >
              {/* Icon badge */}
              <div
                style={{
                  ...styles.iconBadge,
                  backgroundColor: `${action.accentColor}18`,
                  border: `1px solid ${action.accentColor}30`,
                }}
              >
                <Icon size={20} color={action.accentColor} />
              </div>

              <h3 style={styles.cardTitle}>{action.label}</h3>
              <p style={styles.cardDesc}>{action.description}</p>

              {/* Bottom accent line */}
              <div
                style={{
                  ...styles.accentLine,
                  backgroundColor: action.accentColor,
                }}
                className="qa-accent-line"
              />
            </Link>
          );
        })}
      </div>

      <style>{`
        .qa-card {
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }
        .qa-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 32px var(--glow, rgba(108,99,255,0.2));
          border-color: rgba(255,255,255,0.12) !important;
        }
        .qa-card:hover .qa-accent-line {
          opacity: 1 !important;
          width: 100% !important;
        }
        .qa-accent-line {
          transition: width 0.3s ease, opacity 0.3s ease;
        }
      `}</style>
    </section>
  );
};

const styles = {
  section: {
    marginTop: '8px',
  },
  sectionTitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: 'rgba(240,240,248,0.55)',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    fontFamily: 'monospace',
    margin: '0 0 20px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '16px',
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '22px',
    backgroundColor: '#121218',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '16px',
    textDecoration: 'none',
    position: 'relative',
    overflow: 'hidden',
    cursor: 'pointer',
  },
  iconBadge: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#F0F0F8',
    margin: 0,
    letterSpacing: '-0.2px',
  },
  cardDesc: {
    fontSize: '13px',
    color: 'rgba(240,240,248,0.4)',
    lineHeight: 1.6,
    margin: 0,
    flex: 1,
  },
  accentLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: '2px',
    width: '0%',
    opacity: 0,
    borderRadius: '0 2px 0 0',
  },
};

export default QuickActions;
