import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Loader2, Circle } from 'lucide-react';

// Status types: 'waiting' | 'active' | 'done'

const STATUS_CONFIG = {
  done: {
    iconColor: '#4ADE80',
    labelColor: 'rgba(74,222,128,0.85)',
    bg: 'rgba(74,222,128,0.06)',
    border: 'rgba(74,222,128,0.18)',
    badge: { text: 'Complete', color: '#4ADE80', bg: 'rgba(74,222,128,0.1)', border: 'rgba(74,222,128,0.25)' },
  },
  active: {
    iconColor: '#6C63FF',
    labelColor: '#F0F0F8',
    bg: 'rgba(108,99,255,0.07)',
    border: 'rgba(108,99,255,0.28)',
    badge: { text: 'Running', color: '#8B83FF', bg: 'rgba(108,99,255,0.12)', border: 'rgba(108,99,255,0.25)' },
  },
  waiting: {
    iconColor: 'rgba(240,240,248,0.18)',
    labelColor: 'rgba(240,240,248,0.28)',
    bg: 'transparent',
    border: 'rgba(255,255,255,0.05)',
    badge: { text: 'Waiting', color: 'rgba(240,240,248,0.3)', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.07)' },
  },
};

// PipelineStep — a single step row in the vertical timeline.
const PipelineStep = ({ step, index, status, isLast }) => {
  const Icon  = step.icon;
  const cfg   = STATUS_CONFIG[status];
  const badge = cfg.badge;

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay: index * 0.07, ease: 'easeOut' }}
      className="flex gap-4 items-stretch"
    >
      {/* ── Left spine: node + connector line ── */}
      <div className="flex flex-col items-center" style={{ width: '44px', flexShrink: 0 }}>
        {/* Node circle */}
        <motion.div
          animate={
            status === 'active'
              ? { boxShadow: ['0 0 0px rgba(108,99,255,0)', '0 0 18px rgba(108,99,255,0.55)', '0 0 0px rgba(108,99,255,0)'] }
              : {}
          }
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          className="flex items-center justify-center w-9 h-9 rounded-full flex-shrink-0"
          style={{
            backgroundColor: status === 'done'
              ? 'rgba(74,222,128,0.12)'
              : status === 'active'
              ? 'rgba(108,99,255,0.15)'
              : 'rgba(255,255,255,0.04)',
            border: `1.5px solid ${
              status === 'done'
                ? 'rgba(74,222,128,0.35)'
                : status === 'active'
                ? 'rgba(108,99,255,0.45)'
                : 'rgba(255,255,255,0.07)'
            }`,
            transition: 'background 0.3s ease, border-color 0.3s ease',
          }}
        >
          <AnimatePresence mode="wait">
            {status === 'done' ? (
              <motion.span
                key="check"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 18 }}
              >
                <CheckCircle2 size={18} style={{ color: '#4ADE80' }} />
              </motion.span>
            ) : status === 'active' ? (
              <motion.span
                key="spin"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, rotate: 360 }}
                transition={{ opacity: { duration: 0.2 }, rotate: { duration: 1.2, repeat: Infinity, ease: 'linear' } }}
              >
                <Loader2 size={18} style={{ color: '#8B83FF' }} />
              </motion.span>
            ) : (
              <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Circle size={14} style={{ color: 'rgba(255,255,255,0.12)' }} />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Connector line to next step */}
        {!isLast && (
          <div className="flex-1 w-px mt-1" style={{ minHeight: '20px' }}>
            <motion.div
              className="w-full h-full"
              style={{
                background: status === 'done'
                  ? 'linear-gradient(to bottom, rgba(74,222,128,0.35) 0%, rgba(74,222,128,0.08) 100%)'
                  : 'linear-gradient(to bottom, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%)',
                transition: 'background 0.4s ease',
              }}
            />
          </div>
        )}
      </div>

      {/* ── Right content card ── */}
      <motion.div
        animate={{
          backgroundColor: cfg.bg,
          borderColor: cfg.border,
        }}
        transition={{ duration: 0.3 }}
        className="flex-1 rounded-xl mb-3 p-4"
        style={{
          border: `1px solid ${cfg.border}`,
          backgroundColor: cfg.bg,
          minHeight: isLast ? 'auto' : '72px',
        }}
      >
        <div className="flex items-start justify-between gap-3">
          {/* Icon + title + description */}
          <div className="flex items-start gap-3">
            <div
              className="flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0 mt-0.5"
              style={{
                backgroundColor: status === 'done'
                  ? 'rgba(74,222,128,0.1)'
                  : status === 'active'
                  ? 'rgba(108,99,255,0.14)'
                  : 'rgba(255,255,255,0.04)',
                border: `1px solid ${cfg.border}`,
                transition: 'all 0.3s ease',
              }}
            >
              <Icon
                size={17}
                style={{
                  color: cfg.iconColor,
                  transition: 'color 0.3s ease',
                }}
              />
            </div>
            <div>
              <p
                className="text-sm font-semibold leading-tight mb-0.5"
                style={{ color: cfg.labelColor, transition: 'color 0.3s ease' }}
              >
                {step.title}
              </p>
              <p
                className="text-xs leading-relaxed"
                style={{ color: 'rgba(240,240,248,0.32)', maxWidth: '420px' }}
              >
                {step.description}
              </p>
            </div>
          </div>

          {/* Status badge */}
          <span
            className="text-[10px] font-bold font-mono px-2.5 py-1 rounded-full flex-shrink-0 whitespace-nowrap"
            style={{
              color: badge.color,
              backgroundColor: badge.bg,
              border: `1px solid ${badge.border}`,
              transition: 'all 0.3s ease',
            }}
          >
            {badge.text}
          </span>
        </div>

        {/* Active progress bar */}
        <AnimatePresence>
          {status === 'active' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 overflow-hidden"
            >
              <div
                className="w-full h-1 rounded-full overflow-hidden"
                style={{ backgroundColor: 'rgba(108,99,255,0.12)' }}
              >
                {/* Indeterminate shimmer bar */}
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: 'linear-gradient(90deg, transparent 0%, #6C63FF 40%, #8B83FF 60%, transparent 100%)',
                    width: '40%',
                  }}
                  animate={{ x: ['-100%', '340%'] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default PipelineStep;
