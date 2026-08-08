import {
  UploadCloud,
  ShieldCheck,
  Sparkles,
  Wrench,
  Cpu,
  TrendingUp,
  MessageSquare,
  FileText,
  Database,
  BookOpen,
  CheckCircle2,
} from 'lucide-react';
import PipelineStep from './PipelineStep';

/**
 * Pipeline phases mapped to real backend lifecycle events.
 *
 * PHASE MAPPING (driven by UploadDataset.jsx state):
 *
 *  phase = 'idle'         → nothing active
 *  phase = 'uploading'    → file is being transferred (tracked via onUploadProgress)
 *  phase = 'processing'   → file has landed; FastAPI + MongoDB pipeline is running
 *  phase = 'done'         → API returned 201 success
 *  phase = 'error'        → API returned an error
 *
 * Steps 0–1   are "done"   once phase reaches 'processing'.
 * Steps 2–9   are "active" in sequence while phase = 'processing'.
 * Step  10    is "done"    only when phase = 'done'.
 */
export const PIPELINE_STEPS = [
  {
    id: 'upload',
    icon: UploadCloud,
    title: 'Dataset Uploaded',
    description: 'Your file has been received and queued for processing.',
    phase: 'uploading',      // becomes "done" when upload finishes
  },
  {
    id: 'schema',
    icon: ShieldCheck,
    title: 'Schema Validation',
    description: 'Checking column types, required fields, and data structure integrity.',
    phase: 'processing',
  },
  {
    id: 'cleaning',
    icon: Sparkles,
    title: 'Data Cleaning',
    description: 'Removing duplicates, imputing missing values, and normalising formats.',
    phase: 'processing',
  },
  {
    id: 'features',
    icon: Wrench,
    title: 'Feature Engineering',
    description: 'Constructing adstock decay, saturation curves, and derived media variables.',
    phase: 'processing',
  },
  {
    id: 'engine',
    icon: Cpu,
    title: 'FastAPI AI Engine',
    description: 'Invoking the Python microservice for regression and attribution modeling.',
    phase: 'processing',
  },
  {
    id: 'forecast',
    icon: TrendingUp,
    title: 'Forecasting',
    description: 'Generating spend-response curves and incremental ROI forecasts.',
    phase: 'processing',
  },
  {
    id: 'sentiment',
    icon: MessageSquare,
    title: 'Sentiment Analysis',
    description: 'Running NLP scoring on brand mentions and channel feedback signals.',
    phase: 'processing',
  },
  {
    id: 'report',
    icon: FileText,
    title: 'Executive Report Generation',
    description: 'Compiling findings into a structured, downloadable PDF report.',
    phase: 'processing',
  },
  {
    id: 'mongo',
    icon: Database,
    title: 'Stored in MongoDB',
    description: 'Persisting the dataset, model artefacts, and report to the database.',
    phase: 'processing',
  },
  {
    id: 'rag',
    icon: BookOpen,
    title: 'RAG Context Prepared',
    description: 'Indexing report content into the vector store for conversational queries.',
    phase: 'processing',
  },
  {
    id: 'done',
    icon: CheckCircle2,
    title: 'Completed',
    description: 'Your AI report is ready. You can now explore it or open the AI chat.',
    phase: 'done',           // becomes "done" only on real API success
  },
];

// Time (ms) each "processing" step stays active before the next one lights up.
// These are cosmetic — they divide the real server wait time into visible sub-steps.
// The last step only resolves when the API actually responds.
const PROCESSING_STEP_DURATIONS = [2500, 2800, 3200, 3800, 2600, 2400, 3000, 1500, 1800];

/**
 * getStepStatus
 *
 * Derives the visual status of a step from the real pipeline phase + elapsed time.
 *
 * @param {number} stepIndex       - Index in PIPELINE_STEPS
 * @param {string} phase           - 'idle' | 'uploading' | 'processing' | 'done' | 'error'
 * @param {number} processingStep  - Which processing sub-step is currently active (1-9)
 */
export function getStepStatus(stepIndex, phase, processingStep) {
  if (phase === 'idle')      return 'waiting';
  if (phase === 'error')     return stepIndex === 0 ? 'done' : 'waiting';

  if (phase === 'uploading') {
    if (stepIndex === 0)  return 'active';
    return 'waiting';
  }

  if (phase === 'processing') {
    if (stepIndex === 0)  return 'done';   // upload already finished

    const processingIndex = stepIndex - 1; // steps 1–9 map to processingStep 0–8
    if (processingIndex < processingStep)  return 'done';
    if (processingIndex === processingStep) return 'active';
    return 'waiting';
  }

  if (phase === 'done') return 'done';   // all steps green

  return 'waiting';
}

export { PROCESSING_STEP_DURATIONS };

/**
 * PipelineTimeline
 *
 * Pure presentational component — receives phase + processingStep as props.
 * No timers, no API calls live here.
 */
const PipelineTimeline = ({ phase, processingStep }) => {
  return (
    <div className="flex flex-col">
      {PIPELINE_STEPS.map((step, i) => (
        <PipelineStep
          key={step.id}
          step={step}
          index={i}
          status={getStepStatus(i, phase, processingStep)}
          isLast={i === PIPELINE_STEPS.length - 1}
        />
      ))}
    </div>
  );
};

export default PipelineTimeline;
