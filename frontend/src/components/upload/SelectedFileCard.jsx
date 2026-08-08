import { motion } from 'framer-motion';
import { FileText, FileSpreadsheet, X, RefreshCw, CheckCircle2, HardDrive, Clock } from 'lucide-react';

// Map file extensions to visual config
const EXT_CONFIG = {
  csv:  { icon: FileText,        color: '#4ADE80', bg: 'rgba(74,222,128,0.1)',  border: 'rgba(74,222,128,0.25)'  },
  xlsx: { icon: FileSpreadsheet, color: '#38BDF8', bg: 'rgba(56,189,248,0.1)',  border: 'rgba(56,189,248,0.25)'  },
  xls:  { icon: FileSpreadsheet, color: '#38BDF8', bg: 'rgba(56,189,248,0.1)',  border: 'rgba(56,189,248,0.25)'  },
};

const DEFAULT_CONFIG = {
  icon: FileText, color: '#6C63FF', bg: 'rgba(108,99,255,0.1)', border: 'rgba(108,99,255,0.25)',
};

const getExt = (name = '') => name.split('.').pop().toLowerCase();

const SelectedFileCard = ({ file, onRemove, onReplace }) => {
  const ext    = getExt(file.name);
  const config = EXT_CONFIG[ext] || DEFAULT_CONFIG;
  const Icon   = config.icon;

  // Human-readable file size
  const formatSize = (bytes) => {
    if (bytes < 1024)       return `${bytes} B`;
    if (bytes < 1024 ** 2)  return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 ** 2).toFixed(2)} MB`;
  };

  // Human-readable last modified date
  const formatDate = (ts) =>
    new Date(ts).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
    });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97, y: 10 }}
      animate={{ opacity: 1, scale: 1,    y: 0   }}
      exit={{    opacity: 0, scale: 0.97, y: -10 }}
      transition={{ type: 'spring', stiffness: 280, damping: 24 }}
      className="w-full rounded-2xl overflow-hidden"
      style={{
        backgroundColor: '#141419',
        border: `1px solid ${config.border}`,
        boxShadow: `0 0 28px ${config.bg}`,
      }}
    >
      {/* Top accent stripe */}
      <div
        className="h-1 w-full"
        style={{ background: `linear-gradient(90deg, ${config.color}, transparent)` }}
      />

      <div className="flex items-start gap-5 p-6">
        {/* File type icon */}
        <div
          className="flex items-center justify-center w-14 h-14 rounded-xl flex-shrink-0"
          style={{ backgroundColor: config.bg, border: `1px solid ${config.border}` }}
        >
          <Icon size={26} style={{ color: config.color }} />
        </div>

        {/* File info */}
        <div className="flex-1 min-w-0">
          {/* Name + valid badge */}
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3
              className="text-base font-bold truncate"
              style={{ color: 'rgba(240,240,248,0.9)', maxWidth: '360px' }}
            >
              {file.name}
            </h3>
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono flex-shrink-0"
              style={{
                backgroundColor: 'rgba(74,222,128,0.1)',
                border: '1px solid rgba(74,222,128,0.25)',
                color: '#4ADE80',
              }}
            >
              <CheckCircle2 size={10} />
              Valid
            </span>
          </div>

          {/* Extension pill */}
          <span
            className="inline-block px-2 py-0.5 rounded text-[10px] font-bold font-mono mb-4"
            style={{
              backgroundColor: config.bg,
              border: `1px solid ${config.border}`,
              color: config.color,
            }}
          >
            .{ext.toUpperCase()}
          </span>

          {/* Metadata row */}
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <div className="flex items-center gap-1.5">
              <HardDrive size={13} style={{ color: 'rgba(240,240,248,0.25)' }} />
              <span className="text-xs font-mono" style={{ color: 'rgba(240,240,248,0.45)' }}>
                {formatSize(file.size)}
              </span>
            </div>
            {file.lastModified && (
              <div className="flex items-center gap-1.5">
                <Clock size={13} style={{ color: 'rgba(240,240,248,0.25)' }} />
                <span className="text-xs font-mono" style={{ color: 'rgba(240,240,248,0.45)' }}>
                  {formatDate(file.lastModified)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2 flex-shrink-0">
          <motion.button
            whileHover={{ scale: 1.06, y: -1 }}
            whileTap={{ scale: 0.95 }}
            onClick={onReplace}
            title="Replace file"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{
              backgroundColor: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.09)',
              color: 'rgba(240,240,248,0.55)',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={13} />
            Replace
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.06, y: -1 }}
            whileTap={{ scale: 0.95 }}
            onClick={onRemove}
            title="Remove file"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{
              backgroundColor: 'rgba(248,113,113,0.07)',
              border: '1px solid rgba(248,113,113,0.2)',
              color: 'rgba(248,113,113,0.7)',
              cursor: 'pointer',
            }}
          >
            <X size={13} />
            Remove
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default SelectedFileCard;
