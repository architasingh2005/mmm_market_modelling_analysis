import { motion } from 'framer-motion';
import { Cpu, Sparkles } from 'lucide-react';

// ProcessingHeader — page-level hero shown above the pipeline timeline.
const ProcessingHeader = ({ fileName }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex flex-col items-center text-center gap-4 mb-12"
    >
      {/* Animated logo orb */}
      <div className="relative flex items-center justify-center">
        {/* Outer pulse ring */}
        <motion.div
          animate={{ scale: [1, 1.18, 1], opacity: [0.3, 0.08, 0.3] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute w-24 h-24 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(108,99,255,0.35) 0%, transparent 70%)' }}
        />
        {/* Inner glow ring */}
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.15, 0.5] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
          className="absolute w-16 h-16 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(108,99,255,0.5) 0%, transparent 70%)' }}
        />
        {/* Icon container */}
        <div
          className="relative flex items-center justify-center w-14 h-14 rounded-2xl z-10"
          style={{
            background: 'linear-gradient(135deg, #6C63FF 0%, #4F46E5 100%)',
            boxShadow: '0 0 32px rgba(108,99,255,0.45), 0 4px 16px rgba(108,99,255,0.3)',
          }}
        >
          <Cpu size={26} color="#fff" />
        </div>
      </div>

      {/* Eyebrow */}
      <span
        className="text-xs font-bold font-mono tracking-widest uppercase"
        style={{ color: '#6C63FF' }}
      >
        AI Pipeline Running
      </span>

      {/* Heading */}
      <h1
        className="text-3xl md:text-4xl font-extrabold tracking-tight"
        style={{ color: '#F0F0F8', letterSpacing: '-0.5px' }}
      >
        Processing Your Dataset
      </h1>

      {/* Subtitle */}
      <p className="text-base max-w-lg" style={{ color: 'rgba(240,240,248,0.45)' }}>
        MarketMindAI is running your data through the full intelligence pipeline.
        {fileName && (
          <>
            {' '}Processing{' '}
            <span
              className="font-semibold font-mono px-2 py-0.5 rounded-lg text-sm"
              style={{
                color: '#8B83FF',
                backgroundColor: 'rgba(108,99,255,0.12)',
                border: '1px solid rgba(108,99,255,0.2)',
              }}
            >
              {fileName}
            </span>
          </>
        )}
      </p>

      {/* Estimated time pill */}
      <div
        className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-mono"
        style={{
          backgroundColor: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          color: 'rgba(240,240,248,0.35)',
        }}
      >
        <Sparkles size={12} style={{ color: '#6C63FF' }} />
        Estimated time: 20–30 seconds
      </div>
    </motion.div>
  );
};

export default ProcessingHeader;
