import { motion } from 'framer-motion';
import { UploadCloud, X } from 'lucide-react';

const UploadActions = ({ hasFile, onCancel, onUpload }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: 0.1 }}
      className="flex items-center justify-end gap-3 pt-2"
    >
      {/* Cancel — ghost button */}
      <motion.button
        whileHover={{ scale: 1.02, y: -1 }}
        whileTap={{ scale: 0.97 }}
        onClick={onCancel}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
        style={{
          backgroundColor: 'transparent',
          border: '1px solid rgba(255,255,255,0.09)',
          color: 'rgba(240,240,248,0.45)',
          cursor: 'pointer',
        }}
      >
        <X size={15} />
        Cancel
      </motion.button>

      {/* Upload Dataset — primary button */}
      <motion.button
        whileHover={
          hasFile
            ? {
                scale: 1.03,
                y: -2,
                boxShadow: '0 8px 28px rgba(108,99,255,0.5)',
              }
            : {}
        }
        whileTap={hasFile ? { scale: 0.97 } : {}}
        disabled={!hasFile}
        onClick={onUpload}
        className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold"
        style={{
          background: hasFile
            ? 'linear-gradient(135deg, #6C63FF 0%, #4F46E5 100%)'
            : 'rgba(255,255,255,0.05)',
          border: hasFile
            ? '1px solid rgba(108,99,255,0.4)'
            : '1px solid rgba(255,255,255,0.07)',
          color: hasFile ? '#fff' : 'rgba(240,240,248,0.2)',
          cursor: hasFile ? 'pointer' : 'not-allowed',
          boxShadow: hasFile ? '0 4px 18px rgba(108,99,255,0.3)' : 'none',
          transition: 'background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease',
        }}
      >
        <UploadCloud size={16} />
        Upload Dataset
      </motion.button>
    </motion.div>
  );
};

export default UploadActions;
