import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ArrowRight, MessageSquare, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

// Labels cycled through while pipeline is running.
const RUNNING_LABELS = [
  'Validating data schema...',
  'Cleaning and normalising data...',
  'Engineering model features...',
  'Running AI attribution engine...',
  'Generating forecasts...',
  'Analysing sentiment signals...',
  'Preparing Executive Report...',
  'Storing to database...',
  'Preparing RAG context...',
];

// ProcessingSummary — sticky bottom bar showing animated status + completion CTA.
const ProcessingSummary = ({ isComplete, isError, activeLabel, reportId }) => {
  if (isError) return null; // hide summary bar entirely on error
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="mt-8 rounded-2xl overflow-hidden"
      style={{
        backgroundColor: '#111114',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <AnimatePresence mode="wait">
        {/* ── Running state ── */}
        {!isComplete && (
          <motion.div
            key="running"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-5"
          >
            {/* Left — animated status text */}
            <div className="flex items-center gap-3">
              {/* Pulsing dot */}
              <div className="relative flex items-center justify-center w-3 h-3 flex-shrink-0">
                <motion.div
                  animate={{ scale: [1, 1.8, 1], opacity: [1, 0, 1] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute w-3 h-3 rounded-full"
                  style={{ backgroundColor: 'rgba(108,99,255,0.4)' }}
                />
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: '#6C63FF' }}
                />
              </div>

              {/* Cycling status label */}
              <AnimatePresence mode="wait">
                <motion.span
                  key={activeLabel}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25 }}
                  className="text-sm font-medium font-mono"
                  style={{ color: 'rgba(240,240,248,0.55)' }}
                >
                  {activeLabel}
                </motion.span>
              </AnimatePresence>
            </div>

            {/* Right — estimated time */}
            <span
              className="text-xs font-mono px-3 py-1.5 rounded-full"
              style={{
                backgroundColor: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
                color: 'rgba(240,240,248,0.25)',
              }}
            >
              Estimated time: 20–30 seconds
            </span>
          </motion.div>
        )}

        {/* ── Complete state ── */}
        {isComplete && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, type: 'spring', stiffness: 260, damping: 22 }}
            className="flex flex-col sm:flex-row items-center justify-between gap-5 px-6 py-5"
            style={{
              background: 'linear-gradient(135deg, rgba(74,222,128,0.05) 0%, rgba(108,99,255,0.05) 100%)',
            }}
          >
            {/* Left — success message */}
            <div className="flex items-center gap-3">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 18, delay: 0.1 }}
              >
                <CheckCircle2 size={22} style={{ color: '#4ADE80' }} />
              </motion.div>
              <div>
                <p
                  className="text-sm font-bold"
                  style={{ color: 'rgba(240,240,248,0.9)' }}
                >
                  Pipeline Complete
                </p>
                <p
                  className="text-xs font-mono"
                  style={{ color: 'rgba(240,240,248,0.35)' }}
                >
                  Your AI report has been generated and is ready to view.
                </p>
              </div>
            </div>

            {/* Right — CTAs */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <Link
                to="/chat"
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(240,240,248,0.65)',
                  textDecoration: 'none',
                  transition: 'background 0.15s ease',
                }}
              >
                <MessageSquare size={15} />
                Open AI Chat
              </Link>
              <Link
                to={reportId ? `/reports/${reportId}` : '/reports'}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold"
                style={{
                  background: 'linear-gradient(135deg, #6C63FF 0%, #4F46E5 100%)',
                  color: '#fff',
                  textDecoration: 'none',
                  boxShadow: '0 4px 18px rgba(108,99,255,0.35)',
                }}
              >
                <FileText size={15} />
                View Report
                <ArrowRight size={14} />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overall progress track */}
      {!isComplete && (
        <div
          className="h-0.5 w-full"
          style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
        >
          <motion.div
            className="h-full"
            style={{
              background: 'linear-gradient(90deg, #6C63FF, #8B83FF)',
              borderRadius: '0 2px 2px 0',
            }}
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            // Duration synced with total pipeline: sum of STEP_DURATIONS ≈ 15.9s
            transition={{ duration: 15.9, ease: 'linear' }}
          />
        </div>
      )}
    </motion.div>
  );
};

export { RUNNING_LABELS };
export default ProcessingSummary;
