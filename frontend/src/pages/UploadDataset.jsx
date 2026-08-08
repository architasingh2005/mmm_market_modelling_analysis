import { useState, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ShieldCheck } from 'lucide-react';
import uploadFileStore from '../services/uploadFileStore';
import UploadDropzone from '../components/upload/UploadDropzone';
import SupportedFormats from '../components/upload/SupportedFormats';
import SelectedFileCard from '../components/upload/SelectedFileCard';
import UploadActions from '../components/upload/UploadActions';
import EmptyUploadState from '../components/upload/EmptyUploadState';

// Accepted MIME types and extensions — validation only, no upload logic.
const ACCEPTED_TYPES = [
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];
const ACCEPTED_EXTS = ['.csv', '.xls', '.xlsx'];
const MAX_BYTES = 100 * 1024 * 1024; // 100 MB

const UploadDataset = () => {
  // useState manages local UI state — no backend or side effects.
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging]     = useState(false);
  const [error, setError]               = useState('');

  const fileInputRef = useRef(null);
  const navigate     = useNavigate();

  /* ── Validation helper ── */
  const validate = useCallback((file) => {
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!ACCEPTED_EXTS.includes(ext)) {
      return `Unsupported file type. Please upload a CSV or Excel file.`;
    }
    if (file.size > MAX_BYTES) {
      return `File exceeds the 100 MB limit (${(file.size / 1024 ** 2).toFixed(1)} MB).`;
    }
    return null;
  }, []);

  const handleFile = useCallback((file) => {
    if (!file) return;
    const msg = validate(file);
    if (msg) {
      setError(msg);
      setSelectedFile(null);
    } else {
      setError('');
      setSelectedFile(file);
    }
  }, [validate]);

  /* ── Drag handlers ── */
  const onDragOver  = useCallback((e) => { e.preventDefault(); setIsDragging(true);  }, []);
  const onDragLeave = useCallback((e) => { e.preventDefault(); setIsDragging(false); }, []);
  const onDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer?.files?.[0];
    handleFile(file);
  }, [handleFile]);

  /* ── File input ── */
  const onBrowse = () => fileInputRef.current?.click();
  const onFileInput = (e) => handleFile(e.target.files?.[0]);

  /* ── Actions ── */
  const onRemove  = () => { setSelectedFile(null); setError(''); };
  const onReplace = () => fileInputRef.current?.click();
  const onCancel  = () => navigate(-1);

  // Store the File in the module-level uploadFileStore before navigating.
  // File objects cannot survive React Router's JSON serialisation in location.state,
  // so we keep a live reference in a module variable instead.
  const onUpload = () => {
    if (!selectedFile) return;
    uploadFileStore.set(selectedFile);
    navigate('/processing', { state: { fileName: selectedFile.name } });
  };

  return (
    <div className="max-w-3xl mx-auto pb-16">

      {/* ── Hero ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mb-10"
      >
        {/* Eyebrow */}
        <div className="flex items-center gap-2 mb-4">
          <div
            className="flex items-center justify-center w-8 h-8 rounded-lg"
            style={{
              background: 'linear-gradient(135deg, #6C63FF 0%, #4F46E5 100%)',
              boxShadow: '0 4px 14px rgba(108,99,255,0.35)',
            }}
          >
            <Sparkles size={15} color="#fff" />
          </div>
          <span
            className="text-xs font-bold font-mono tracking-widest uppercase"
            style={{ color: '#6C63FF' }}
          >
            AI Pipeline Entry Point
          </span>
        </div>

        <h1
          className="text-3xl md:text-4xl font-extrabold mb-3 tracking-tight"
          style={{ color: '#F0F0F8', letterSpacing: '-0.5px' }}
        >
          Upload Dataset
        </h1>

        <p className="text-base mb-2" style={{ color: 'rgba(240,240,248,0.6)' }}>
          Import your marketing or business dataset to begin AI-powered analysis.
        </p>

        <div className="flex items-start gap-2">
          <ShieldCheck size={14} style={{ color: 'rgba(74,222,128,0.7)', marginTop: '2px', flexShrink: 0 }} />
          <p className="text-sm" style={{ color: 'rgba(240,240,248,0.35)' }}>
            MarketMindAI validates your dataset before passing it to our AI modeling engine.
          </p>
        </div>
      </motion.div>

      {/* ── Main card ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.08 }}
        className="rounded-2xl p-6 md:p-8 flex flex-col gap-8"
        style={{
          backgroundColor: '#111114',
          border: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.35)',
        }}
      >
        {/* Hidden native file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_EXTS.join(',')}
          onChange={onFileInput}
          className="hidden"
          aria-label="File upload input"
        />

        {/* Dropzone */}
        <UploadDropzone
          isDragging={isDragging}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onBrowse={onBrowse}
        />

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.p
              key="error"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-sm px-4 py-3 rounded-xl font-medium"
              style={{
                backgroundColor: 'rgba(248,113,113,0.08)',
                border: '1px solid rgba(248,113,113,0.2)',
                color: '#F87171',
              }}
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Supported formats */}
        <div className="flex flex-col gap-3">
          <p
            className="text-[11px] font-semibold font-mono tracking-widest uppercase"
            style={{ color: 'rgba(240,240,248,0.25)' }}
          >
            Supported Formats
          </p>
          <SupportedFormats />
        </div>

        {/* Divider */}
        <div
          className="w-full h-px"
          style={{
            background:
              'linear-gradient(to right, transparent, rgba(255,255,255,0.07) 30%, rgba(255,255,255,0.07) 70%, transparent)',
          }}
        />

        {/* File preview / empty state */}
        <div className="flex flex-col gap-3">
          <p
            className="text-[11px] font-semibold font-mono tracking-widest uppercase"
            style={{ color: 'rgba(240,240,248,0.25)' }}
          >
            Selected File
          </p>

          {/* AnimatePresence enables exit animation when toggling between states */}
          <AnimatePresence mode="wait">
            {selectedFile ? (
              <SelectedFileCard
                key="file-card"
                file={selectedFile}
                onRemove={onRemove}
                onReplace={onReplace}
              />
            ) : (
              <EmptyUploadState key="empty-state" />
            )}
          </AnimatePresence>
        </div>

        {/* Actions */}
        <UploadActions hasFile={!!selectedFile} onCancel={onCancel} onUpload={onUpload} />
      </motion.div>
    </div>
  );
};

export default UploadDataset;
