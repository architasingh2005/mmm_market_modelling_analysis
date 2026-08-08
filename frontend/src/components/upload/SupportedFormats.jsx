import { motion } from 'framer-motion';
import { FileSpreadsheet, FileText } from 'lucide-react';

const formats = [
  {
    ext: 'CSV',
    icon: FileText,
    desc: 'Comma-Separated Values',
    color: '#4ADE80',
    bg: 'rgba(74,222,128,0.08)',
    border: 'rgba(74,222,128,0.2)',
  },
  {
    ext: 'XLS',
    icon: FileSpreadsheet,
    desc: 'Excel 97–2003 Workbook',
    color: '#38BDF8',
    bg: 'rgba(56,189,248,0.08)',
    border: 'rgba(56,189,248,0.2)',
  },
  {
    ext: 'XLSX',
    icon: FileSpreadsheet,
    desc: 'Excel Open XML Workbook',
    color: '#38BDF8',
    bg: 'rgba(56,189,248,0.08)',
    border: 'rgba(56,189,248,0.2)',
  },
];

// Stagger children animation variant
const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const SupportedFormats = () => {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="flex flex-wrap gap-3 justify-center"
    >
      {formats.map((fmt) => {
        const Icon = fmt.icon;
        return (
          <motion.div
            key={fmt.ext}
            variants={itemVariants}
            className="flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{
              backgroundColor: fmt.bg,
              border: `1px solid ${fmt.border}`,
              minWidth: '180px',
            }}
          >
            <div
              className="flex items-center justify-center w-9 h-9 rounded-lg"
              style={{
                backgroundColor: `${fmt.color}18`,
                border: `1px solid ${fmt.color}30`,
              }}
            >
              <Icon size={18} style={{ color: fmt.color }} />
            </div>
            <div>
              <p
                className="text-sm font-bold tracking-wide"
                style={{ color: fmt.color, lineHeight: 1.2 }}
              >
                .{fmt.ext}
              </p>
              <p className="text-[11px] text-white/30 font-mono">{fmt.desc}</p>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
};

export default SupportedFormats;
