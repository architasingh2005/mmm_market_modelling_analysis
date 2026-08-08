import { motion } from 'framer-motion';
import { UploadCloud, FilePlus } from 'lucide-react';

// EmptyUploadState — shown before any file has been selected.
const EmptyUploadState = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col items-center justify-center gap-4 w-full rounded-2xl py-12"
      style={{
        backgroundColor: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Illustration */}
      <div className="relative flex items-center justify-center">
        {/* Outer ring pulse */}
        <div
          className="absolute w-24 h-24 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(108,99,255,0.1) 0%, transparent 70%)',
          }}
        />
        <div
          className="flex items-center justify-center w-16 h-16 rounded-2xl"
          style={{
            backgroundColor: 'rgba(108,99,255,0.08)',
            border: '1px solid rgba(108,99,255,0.18)',
          }}
        >
          <FilePlus size={28} style={{ color: 'rgba(108,99,255,0.6)' }} />
        </div>
      </div>

      <div className="flex flex-col items-center gap-1.5 text-center">
        <p className="text-sm font-semibold" style={{ color: 'rgba(240,240,248,0.5)' }}>
          No dataset selected
        </p>
        <p
          className="text-xs max-w-xs leading-relaxed"
          style={{ color: 'rgba(240,240,248,0.25)' }}
        >
          Drag and drop a CSV or Excel file to begin, or use the dropzone above.
        </p>
      </div>

      <div
        className="flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-mono"
        style={{
          backgroundColor: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          color: 'rgba(240,240,248,0.2)',
        }}
      >
        <UploadCloud size={12} />
        Waiting for file
      </div>
    </motion.div>
  );
};

export default EmptyUploadState;
