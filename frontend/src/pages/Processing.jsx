import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, RefreshCw } from 'lucide-react';

import ProcessingHeader from '../components/processing/ProcessingHeader';
import PipelineTimeline, {
  PROCESSING_STEP_DURATIONS,
} from '../components/processing/PipelineTimeline';
import ProcessingSummary, { RUNNING_LABELS } from '../components/processing/ProcessingSummary';
import { uploadDataset } from '../services/datasetService';
import uploadFileStore from '../services/uploadFileStore';

/**
 * Processing
 *
 * Real upload flow:
 *  1. Receives `file` via React Router location.state from UploadDataset.
 *  2. Immediately calls POST /api/datasets/upload with the real file.
 *  3. While the file is being transferred → phase = 'uploading'.
 *  4. Once the file lands (upload progress = 100%) → phase = 'processing'.
 *     Cosmetic sub-steps advance on a timer so the user sees pipeline stages,
 *     but the final "Completed" step only resolves on real API success.
 *  5. On API 201 success → phase = 'done', navigate to /reports with report data.
 *  6. On API error     → phase = 'error', show error message.
 */
const Processing = () => {
  // React Router location.state carries fileName for display only.
  // The actual File object comes from uploadFileStore — File objects cannot
  // be JSON-serialised through location.state during navigation.
  const location  = useLocation();
  const navigate  = useNavigate();
  const fileName  = location.state?.fileName ?? null;

  // useRef captures the File once during the initial render and holds it across
  // re-renders. This is critical in React 18 Strict Mode (development), where
  // the component function runs TWICE before effects fire. Reading from the store
  // and clearing it at the top of the function body would clear it on the first
  // render, leaving the second render with null. useRef survives re-renders.
  const fileRef = useRef(uploadFileStore.get());

  // phase: 'uploading' | 'processing' | 'done' | 'error'
  const [phase,          setPhase]          = useState('uploading');
  // processingStep: which cosmetic sub-step (0–8) is currently active
  const [processingStep, setProcessingStep] = useState(0);
  const [labelIndex,     setLabelIndex]     = useState(0);
  const [error,          setError]          = useState('');
  const [reportData,     setReportData]     = useState(null);

  // Refs to track timer cleanup
  const stepTimerRef  = useRef(null);
  const labelTimerRef = useRef(null);
  // Guard against state updates after unmount
  const isMounted     = useRef(true);
  // React 18 Strict Mode runs every effect TWICE (mount → unmount → remount).
  // This ref ensures the upload API is called only once, even across that cycle.
  const hasStarted    = useRef(false);

  // ── Cosmetic sub-step advancement ──────────────────────────────────────────
  // Starts when phase becomes 'processing'.
  // Advances processingStep 0→8 using the durations array.
  // Deliberately stops at step 8 (second-to-last) — step 9 (Completed)
  // only resolves when the real API responds.
  const startSubSteps = () => {
    let current = 0;
    const MAX_COSMETIC = PROCESSING_STEP_DURATIONS.length - 1; // stop before "Completed"

    const tick = () => {
      if (!isMounted.current) return;
      if (current >= MAX_COSMETIC) return; // hold at last processing step
      current += 1;
      setProcessingStep(current);
      stepTimerRef.current = setTimeout(tick, PROCESSING_STEP_DURATIONS[current]);
    };

    stepTimerRef.current = setTimeout(tick, PROCESSING_STEP_DURATIONS[0]);
  };

  // ── Cycling status label ───────────────────────────────────────────────────
  useEffect(() => {
    if (phase === 'done' || phase === 'error') return;
    labelTimerRef.current = setInterval(() => {
      if (isMounted.current) setLabelIndex((i) => (i + 1) % RUNNING_LABELS.length);
    }, 2200);
    return () => clearInterval(labelTimerRef.current);
  }, [phase]);

  // ── Main upload effect ─────────────────────────────────────────────────────
  useEffect(() => {
    // React 18 Strict Mode runs effects twice: mount → unmount → remount.
    // The first cleanup sets isMounted=false.  On the second run we MUST
    // re-enable isMounted so the upload that's already in-flight (from the
    // first run) can still call setState when it resolves.
    // We never start a second upload request — that's what hasStarted guards.
    if (hasStarted.current) {
      isMounted.current = true;              // re-enable state updates for the running upload
      return () => { isMounted.current = false; };  // cleanup on real unmount
    }
    hasStarted.current = true;
    isMounted.current = true;

    // Read the file from the ref and clear the store here (inside useEffect),
    // not during render — so Strict Mode's double-render doesn't wipe it.
    const file = fileRef.current;
    uploadFileStore.clear();

    if (!file) {
      setPhase('error');
      setError('No file was provided. Please go back and select a dataset.');
      return;
    }

    const run = async () => {
      try {
        setPhase('uploading');

        const result = await uploadDataset(file, (progressEvent) => {
          // onUploadProgress fires while the file is being transferred.
          // Once progress = 100% the file has landed; backend processing begins.
          if (!isMounted.current) return;
          const pct = Math.round((progressEvent.loaded * 100) / (progressEvent.total ?? 1));
          if (pct >= 100) {
            // File transfer complete → switch to processing phase + start cosmetic sub-steps
            setPhase('processing');
            startSubSteps();
          }
        });

        // API returned 201 with { dataset, report }
        if (isMounted.current) {
          clearTimeout(stepTimerRef.current);
          setProcessingStep(999); // mark all processing steps done
          setPhase('done');
          setReportData(result);
        }
      } catch (err) {
        if (!isMounted.current) return;
        clearTimeout(stepTimerRef.current);
        const message =
          err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          'An unexpected error occurred.';
        setPhase('error');
        setError(message);
      }
    };

    run();

    return () => {
      isMounted.current = false;
      clearTimeout(stepTimerRef.current);
      clearInterval(labelTimerRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps


  const isComplete = phase === 'done';
  const isError    = phase === 'error';

  return (
    <div className="max-w-2xl mx-auto pb-20">

      {/* ── Hero ── */}
      <ProcessingHeader fileName={fileName} />

      {/* ── Error state ── */}
      <AnimatePresence>
        {isError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 px-5 py-4 rounded-2xl mb-6"
            style={{
              backgroundColor: 'rgba(248,113,113,0.07)',
              border: '1px solid rgba(248,113,113,0.22)',
            }}
          >
            <AlertCircle size={18} style={{ color: '#F87171', flexShrink: 0, marginTop: 2 }} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: '#F87171' }}>
                Processing Failed
              </p>
              <p className="text-xs mt-1" style={{ color: 'rgba(248,113,113,0.65)' }}>
                {error}
              </p>
            </div>
            <button
              onClick={() => navigate('/upload')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0"
              style={{
                backgroundColor: 'rgba(248,113,113,0.1)',
                border: '1px solid rgba(248,113,113,0.2)',
                color: '#F87171',
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={12} />
              Try Again
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Pipeline card ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="rounded-2xl px-6 py-8 md:px-8"
        style={{
          backgroundColor: '#111114',
          border: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.35)',
        }}
      >
        <p
          className="text-[10px] font-bold font-mono tracking-widest uppercase mb-6"
          style={{ color: 'rgba(240,240,248,0.2)' }}
        >
          AI Processing Pipeline
        </p>

        {/* PipelineTimeline receives real phase + processingStep — no internal timers */}
        <PipelineTimeline phase={phase} processingStep={processingStep} />
      </motion.div>

      {/* ── Summary bar ── */}
      <ProcessingSummary
        isComplete={isComplete}
        isError={isError}
        activeLabel={RUNNING_LABELS[labelIndex]}
        reportId={reportData?.report?._id}
      />
    </div>
  );
};

export default Processing;
