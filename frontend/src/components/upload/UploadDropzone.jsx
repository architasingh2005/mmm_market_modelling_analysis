import { motion } from 'framer-motion';
import { UploadCloud, FolderOpen } from 'lucide-react';

const UploadDropzone = ({ isDragging, onDragOver, onDragLeave, onDrop, onBrowse }) => {
  return (
    // motion.div — Framer Motion component for declarative drag/hover animations.
    <motion.div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      animate={{
        borderColor: isDragging
          ? 'rgba(108,99,255,0.7)'
          : 'rgba(255,255,255,0.1)',
        boxShadow: isDragging
          ? '0 0 0 4px rgba(108,99,255,0.12), 0 0 40px rgba(108,99,255,0.15)'
          : '0 0 0 0px transparent',
        backgroundColor: isDragging
          ? 'rgba(108,99,255,0.06)'
          : 'rgba(255,255,255,0.02)',
      }}
      transition={{ duration: 0.2 }}
      className="relative flex flex-col items-center justify-center gap-6 w-full rounded-2xl cursor-pointer select-none"
      style={{
        minHeight: '300px',
        border: '2px dashed rgba(255,255,255,0.1)',
        padding: '48px 32px',
      }}
      onClick={onBrowse}
    >
      {/* Radial glow behind icon */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          background: isDragging
            ? 'radial-gradient(circle at 50% 50%, rgba(108,99,255,0.1) 0%, transparent 65%)'
            : 'radial-gradient(circle at 50% 50%, rgba(108,99,255,0.04) 0%, transparent 65%)',
          transition: 'background 0.3s ease',
        }}
      />

      {/* Upload Icon — bounces gently when dragging */}
      <motion.div
        animate={{ y: isDragging ? -6 : 0, scale: isDragging ? 1.08 : 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="relative flex items-center justify-center w-20 h-20 rounded-2xl"
        style={{
          background: isDragging
            ? 'linear-gradient(135deg, rgba(108,99,255,0.25) 0%, rgba(79,70,229,0.2) 100%)'
            : 'rgba(255,255,255,0.05)',
          border: `1px solid ${isDragging ? 'rgba(108,99,255,0.4)' : 'rgba(255,255,255,0.08)'}`,
          boxShadow: isDragging ? '0 0 24px rgba(108,99,255,0.25)' : 'none',
          transition: 'background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
        }}
      >
        <UploadCloud
          size={36}
          style={{
            color: isDragging ? '#8B83FF' : 'rgba(240,240,248,0.35)',
            transition: 'color 0.2s ease',
          }}
        />
      </motion.div>

      {/* Text content */}
      <div className="flex flex-col items-center gap-2 text-center z-10">
        <p className="text-lg font-semibold text-white/80">
          {isDragging ? 'Drop your file here' : 'Drag & Drop your dataset'}
        </p>
        <p className="text-sm text-white/35">
          or click anywhere to browse files
        </p>
      </div>

      {/* Browse button */}
      <motion.button
        whileHover={{ scale: 1.03, y: -1 }}
        whileTap={{ scale: 0.97 }}
        onClick={(e) => {
          e.stopPropagation();
          onBrowse();
        }}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm z-10"
        style={{
          background: 'linear-gradient(135deg, #6C63FF 0%, #4F46E5 100%)',
          color: '#fff',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(108,99,255,0.3)',
        }}
      >
        <FolderOpen size={16} />
        Browse Files
      </motion.button>

      {/* Constraints row */}
      <div className="flex items-center gap-4 z-10">
        <span className="text-[11px] text-white/25 font-mono">CSV · XLS · XLSX</span>
        <span
          className="w-1 h-1 rounded-full"
          style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
        />
        <span className="text-[11px] text-white/25 font-mono">Max 100 MB</span>
      </div>
    </motion.div>
  );
};

export default UploadDropzone;
