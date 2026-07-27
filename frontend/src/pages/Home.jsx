import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, CheckCircle2, ChevronDown,
  FileUp, ShieldCheck, Cpu, FileBarChart2, Database, MessageCircle,
} from 'lucide-react';

/* ──────────────────────────────────────────────
   Intersection observer hook
────────────────────────────────────────────── */
const useInView = (threshold = 0.3) => {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setInView(true); },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);
  return [ref, inView];
};

/* ──────────────────────────────────────────────
   Static data
────────────────────────────────────────────── */
const CSV_HEADERS = ['Date', 'Sales_Value', 'TV_Spend', 'Search_Spend', 'Trade_Spend', 'Meta_Spend', 'Influencer', 'Adstock_TV', 'ROI_Index'];
const CSV_ROWS = [
  ['2024-01-01', '142,500', '8,200', '3,100', '12,400', '6,700', '4,200', '0.42', '14.2'],
  ['2024-01-08', '138,200', '7,900', '2,800', '13,100', '5,900', '3,800', '0.39', '13.8'],
  ['2024-01-15', '155,800', '9,100', '3,400', '11,800', '7,200', '4,600', '0.45', '15.5'],
  ['2024-01-22', '161,200', '8,700', '3,200', '14,200', '6,800', '4,900', '0.44', '16.1'],
  ['2024-01-29', '148,600', '8,400', '3,000', '12,900', '6,400', '4,400', '0.41', '14.8'],
];

const TERMINAL_LINES = [
  { delay: 0,    text: '$ python fastapi_engine.py --dataset weekly_mmm.csv', type: 'cmd' },
  { delay: 700,  text: '→ Reading CSV...  109,795 rows × 14 columns detected', type: 'info' },
  { delay: 1400, text: '→ Schema validation...  0 missing values ✓',           type: 'ok' },
  { delay: 2100, text: '→ Engineering adstock decay features...',               type: 'info' },
  { delay: 2800, text: '→ Running OLS regression across 5 channels...',         type: 'info' },
  { delay: 3600, text: '✓  Model fit complete.  R² = 0.9423  RMSE = 0.038',    type: 'success' },
  { delay: 4200, text: '✓  FastAPI → Express → MongoDB  Report saved.',         type: 'success' },
];

const CHANNELS = [
  { name: 'TV Campaigns',  roi: 4.2, pct: 88, color: '#4F46E5' },
  { name: 'Google Search', roi: 3.8, pct: 76, color: '#6366F1' },
  { name: 'Meta Ads',      roi: 3.1, pct: 62, color: '#818CF8' },
  { name: 'Trade Spend',   roi: 2.4, pct: 48, color: '#A5B4FC' },
  { name: 'Influencers',   roi: 1.9, pct: 36, color: '#C7D2FE' },
];

const CHAT_MESSAGES = [
  { role: 'user', text: 'Which marketing channel generated the highest ROI?' },
  { role: 'ai',   text: 'TV Campaigns delivered the highest return — ₹4.2M incremental revenue from ₹1M spend. Its impact also persists for 4.2 weeks after a campaign ends, making it your most efficient channel overall.' },
  { role: 'user', text: 'Should I increase next month\'s advertising budget?' },
  { role: 'ai',   text: 'Yes. Based on your current data, TV spend has significant headroom before diminishing returns. A 40% budget increase projects +₹1.4M in incremental revenue based on your historical patterns.' },
];

const WORKFLOW_STEPS = [
  { num: '01', Icon: FileUp,        title: 'Upload Dataset',  desc: 'Drop your CSV — any marketing or sales dataset.' },
  { num: '02', Icon: ShieldCheck,   title: 'Validate Data',   desc: 'Automatic schema detection and quality checks.' },
  { num: '03', Icon: Cpu,           title: 'AI Processing',   desc: 'Our engine runs advanced analytics on your data.' },
  { num: '04', Icon: FileBarChart2, title: 'Generate Report', desc: 'Structured business insights in seconds.' },
  { num: '05', Icon: Database,      title: 'Store Results',   desc: 'Reports saved securely, retrievable via REST API.' },
  { num: '06', Icon: MessageCircle, title: 'Chat with Data',  desc: 'Ask questions about your report in plain language.' },
];

const INSIGHT_CARDS = [
  { tag: 'TOP CHANNEL',       value: 'TV Campaigns', sub: 'Highest performance across all channels' },
  { tag: 'REVENUE POTENTIAL', value: '₹3.2M',       sub: 'Identified incremental revenue' },
  { tag: 'RECOMMENDED BUDGET', value: '₹11.2M',     sub: 'Optimised from current ₹8M spend' },
  { tag: 'DATA QUALITY',      value: '100%',         sub: '109,795 rows · 0 missing values' },
];

const HOW_STEPS = [
  { num: '01', title: 'Upload',   desc: 'Upload your business dataset as a CSV file.' },
  { num: '02', title: 'Validate', desc: 'The system detects the schema and checks data quality automatically.' },
  { num: '03', title: 'Analyze',  desc: 'The AI engine runs attribution, forecasting, and contribution analysis.' },
  { num: '04', title: 'Report',   desc: 'A structured business report is generated with actionable insights.' },
  { num: '05', title: 'Store',    desc: 'Reports are stored in MongoDB and accessible via REST API.' },
  { num: '06', title: 'Chat',     desc: 'Ask questions about your report using natural language.' },
];

const TECH_ITEMS = [
  {
    title: 'Marketing Mix Modeling (MMM)',
    body: 'A statistical framework that measures how each marketing channel — TV, search, social, trade — contributes to overall business outcomes. It separates baseline sales from marketing-driven lift and helps you allocate budget where it actually works.',
  },
  {
    title: 'OLS Regression',
    body: 'Ordinary Least Squares identifies which channels most strongly influence your sales results, ranking them by true contribution while controlling for all other factors. It\'s the mathematical engine behind every channel attribution number in your report.',
  },
  {
    title: 'Adstock Transformation',
    body: 'Advertising doesn\'t stop working the moment a campaign ends. Adstock models the decay of advertising effectiveness over time — a TV campaign today may continue driving sales 4+ weeks later. The decay rate (λ=0.42) is estimated from your own data.',
  },
  {
    title: 'Hill Saturation Curve',
    body: 'Spending twice as much doesn\'t always produce twice the results. The Hill curve models diminishing returns — helping identify the optimal spend level for each channel before returns start falling off significantly.',
  },
  {
    title: 'Business Forecasting',
    body: 'Using historical patterns and planned spend, the model projects future business outcomes — revenue, channel contribution, and the monetary impact of proposed budget changes.',
  },
  {
    title: 'FastAPI (Python Engine)',
    body: 'The AI analytics engine is built on FastAPI — a high-performance Python framework that runs all statistical models, processes datasets, and generates structured report outputs. It exposes endpoints consumed by the Express.js gateway.',
  },
  {
    title: 'Express.js (API Gateway)',
    body: 'The Node.js backend handles JWT authentication, file uploads, API routing, and all communication between the React client and the Python analytics engine.',
  },
  {
    title: 'MongoDB (Database)',
    body: 'All generated reports, analysis results, and user data are stored in MongoDB — a flexible document database that makes it straightforward to retrieve and query complex, nested report structures.',
  },
  {
    title: 'JWT Authentication',
    body: 'Every API request is secured using JSON Web Tokens — a stateless authentication mechanism that ensures only authorized users can access their reports and data.',
  },
  {
    title: 'Vector Search — Roadmap',
    body: 'Planned: semantic search across reports using vector embeddings, enabling you to find relevant insights and patterns without exact keyword matches.',
  },
  {
    title: 'Conversational AI (RAG) — Roadmap',
    body: 'Planned: Retrieval-Augmented Generation will ground AI answers in your actual report data — no hallucinations, no generic responses. Every answer will reference your numbers.',
  },
];

/* ══════════════════════════════════════════════
   HOME — Progressive disclosure narrative
   Visual system preserved · IA restructured
══════════════════════════════════════════════ */
const Home = () => {
  const [navVisible, setNavVisible]     = useState(false);
  const [terminalLines, setTerminalLines] = useState([]);
  const [chartVisible, setChartVisible]  = useState(false);
  const [chatStep, setChatStep]          = useState(0);
  const [openAccordion, setOpenAccordion] = useState(null);

  useEffect(() => {
    const onScroll = () => setNavVisible(window.scrollY > 80);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Scene refs — one per section
  const [s0Ref, s0In] = useInView(0.15); // Hero
  const [s1Ref, s1In] = useInView(0.15); // Workflow
  const [s2Ref, s2In] = useInView(0.2);  // Business Insights
  const [s3Ref, s3In] = useInView(0.2);  // Insight reveal (4.2×)
  const [s4Ref, s4In] = useInView(0.3);  // Interactive Chat
  const [s5Ref, s5In] = useInView(0.15); // How It Works (terminal)
  const [s6Ref, s6In] = useInView(0.15); // Technical Foundation
  const [s7Ref, s7In] = useInView(0.3);  // CTA

  // ROI chart: fires when Business Insights enters view
  useEffect(() => {
    if (s2In) setChartVisible(true);
  }, [s2In]);

  // Terminal: fires when How It Works enters view
  useEffect(() => {
    if (!s5In) return;
    setTerminalLines([]);
    TERMINAL_LINES.forEach(({ delay, text, type }) => {
      setTimeout(() => setTerminalLines(prev => [...prev, { text, type }]), delay);
    });
  }, [s5In]);

  // Chat replay: fires when chat section enters view
  useEffect(() => {
    if (!s4In) return;
    setChatStep(0);
    [600, 2400, 4600, 6600].forEach((delay, i) => {
      setTimeout(() => setChatStep(i + 1), delay);
    });
  }, [s4In]);

  /* ── Shared style tokens ── */
  const mono = "'SF Mono', 'Fira Code', monospace";
  const eyebrow = {
    fontFamily: mono,
    fontSize: '10px',
    letterSpacing: '0.24em',
    color: 'rgba(129,140,248,0.6)',
    textTransform: 'uppercase',
    fontWeight: 500,
    marginBottom: 20,
  };
  const fadein = (inView, delay = '0ms', axis = 'Y', dist = 20) => ({
    opacity: inView ? 1 : 0,
    transform: inView ? 'none' : `translate${axis}(${dist}px)`,
    transition: `opacity 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}, transform 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}`,
  });

  return (
    <div
      className="text-white overflow-x-hidden"
      style={{
        background: '#080808',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        fontFeatureSettings: '"cv11", "ss01"',
        WebkitFontSmoothing: 'antialiased',
      }}
    >


      {/* ══════════════════════ PERMANENT TOP NAVBAR ══════════════════════
          Always visible. Transparent on hero, readable everywhere.
         ══════════════════════════════════════════════════════════════════ */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 48,
        height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 32px',
        background: 'rgba(8,8,8,0.35)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(255,255,255,0.03)',
        opacity: navVisible ? 0 : 1,
        transform: navVisible ? 'translateY(-100%)' : 'translateY(0)',
        pointerEvents: navVisible ? 'none' : 'auto',
        transition: 'opacity 0.35s ease, transform 0.35s ease',
      }}>
        {/* Logo */}
        <span style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '-0.03em', color: 'rgba(255,255,255,0.9)', userSelect: 'none' }}>
          MarketMind<span style={{ color: '#818CF8' }}>AI</span>
        </span>

        {/* Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link
            to="/about"
            style={{ fontSize: '13px', fontWeight: 400, color: 'rgba(255,255,255,0.45)', textDecoration: 'none', padding: '6px 12px', borderRadius: 8, transition: 'color 0.15s ease, background 0.15s ease' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.82)'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; e.currentTarget.style.background = 'transparent'; }}
          >
            About
          </Link>
          <Link
            to="/login"
            style={{ fontSize: '13px', fontWeight: 400, color: 'rgba(255,255,255,0.45)', textDecoration: 'none', padding: '6px 12px', borderRadius: 8, transition: 'color 0.15s ease, background 0.15s ease' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.82)'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; e.currentTarget.style.background = 'transparent'; }}
          >
            Sign In
          </Link>
          <Link
            to="/register"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: '13px', fontWeight: 600, color: 'white',
              background: '#4F46E5', padding: '7px 16px', borderRadius: '9px',
              textDecoration: 'none',
              boxShadow: '0 0 0 1px rgba(79,70,229,0.5), 0 4px 16px rgba(79,70,229,0.25)',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#4338CA'; e.currentTarget.style.boxShadow = '0 0 0 1px rgba(79,70,229,0.7), 0 6px 20px rgba(79,70,229,0.35)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#4F46E5'; e.currentTarget.style.boxShadow = '0 0 0 1px rgba(79,70,229,0.5), 0 4px 16px rgba(79,70,229,0.25)'; }}
          >
            Get Started <ArrowRight size={12} />
          </Link>
        </div>
      </div>

      {/* ══════════════════════ FLOATING NAV ══════════════════════ */}
      <div style={{
        position: 'fixed', top: 18, left: 0, right: 0, zIndex: 50,
        display: 'flex', justifyContent: 'center', pointerEvents: 'none',
        transition: 'opacity 0.45s ease, transform 0.45s ease',
        opacity: navVisible ? 1 : 0,
        transform: navVisible ? 'translateY(0)' : 'translateY(-12px)',
      }}>
        <nav style={{
          display: 'flex', alignItems: 'center', gap: 20, padding: '8px 18px',
          borderRadius: '14px', pointerEvents: navVisible ? 'auto' : 'none',
          background: 'rgba(14,14,14,0.88)', backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          border: '1px solid rgba(255,255,255,0.09)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)',
        }}>
          <span style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '-0.02em', color: 'rgba(255,255,255,0.9)' }}>
            MarketMind<span style={{ color: '#818CF8' }}>AI</span>
          </span>
          <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.12)', flexShrink: 0 }} />
          <Link
            to="/about"
            style={{ fontSize: '13px', fontWeight: 400, color: 'rgba(255,255,255,0.45)', textDecoration: 'none', transition: 'color 0.15s ease' }}
            onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.85)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.45)'}
          >
            About
          </Link>
          <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.12)', flexShrink: 0 }} />
          <Link to="/login" style={{ fontSize: '13px', fontWeight: 400, color: 'rgba(255,255,255,0.45)', textDecoration: 'none', transition: 'color 0.15s ease' }}
            onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.85)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.45)'}>
            Sign In
          </Link>
          <Link to="/register" style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: '13px', fontWeight: 600, color: 'white',
            background: '#4F46E5', padding: '6px 14px', borderRadius: '8px',
            textDecoration: 'none', boxShadow: '0 1px 4px rgba(79,70,229,0.45)',
            transition: 'background 0.15s ease',
          }}
            onMouseEnter={e => e.currentTarget.style.background = '#4338CA'}
            onMouseLeave={e => e.currentTarget.style.background = '#4F46E5'}>
            Get Started <ArrowRight size={12} />
          </Link>
        </nav>
      </div>

      {/* ════════════════════════════════════════════════════════════
          SECTION 0 — Hero
          What is MarketMindAI? Who is it for? What problem does it solve?
         ════════════════════════════════════════════════════════════ */}
      <section
        ref={s0Ref}
        style={{
          minHeight: '100vh', width: '100%', boxSizing: 'border-box',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          paddingLeft: '24px', paddingRight: '24px',
          paddingTop: '64px',
          position: 'relative', overflow: 'hidden', background: '#080808',
        }}
      >
        {/* Dot grid */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '28px 28px', pointerEvents: 'none',
        }} />
        {/* Subtle central bloom */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 70% 55% at 50% 48%, rgba(79,70,229,0.07) 0%, transparent 68%)',
          pointerEvents: 'none',
        }} />

        <div style={{
          position: 'relative', zIndex: 10, textAlign: 'center',
          maxWidth: 680, width: 'calc(100% - 48px)',
          marginLeft: 'auto', marginRight: 'auto',
          ...fadein(s0In),
        }}>
          {/* Primary wordmark */}
          <h1 style={{
            fontSize: 'clamp(40px, 7.5vw, 96px)', fontWeight: 800,
            letterSpacing: '-0.055em', lineHeight: 0.95, marginBottom: 28,
            width: '100%', overflow: 'hidden',
            background: 'linear-gradient(160deg, rgba(255,255,255,0.97) 0%, rgba(255,255,255,0.6) 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            MarketMind
            <span style={{
              background: 'linear-gradient(160deg, #818CF8 0%, #6366F1 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>AI</span>
          </h1>

          {/* Subtitle */}
          <p style={{
            fontFamily: mono, fontSize: 'clamp(10px, 1.1vw, 12px)',
            letterSpacing: '0.22em', textTransform: 'uppercase',
            color: 'rgba(129,140,248,0.65)', fontWeight: 500, marginBottom: 24,
          }}>
            AI-Powered Business Intelligence Platform
          </p>

          {/* Value proposition — DM Serif Display, formal */}
          <p style={{
            fontFamily: "'DM Serif Display', 'Libre Baskerville', Georgia, serif",
            fontSize: 'clamp(17px, 2vw, 21px)', fontWeight: 400, fontStyle: 'normal',
            letterSpacing: '0.005em', lineHeight: 1.65,
            color: 'rgba(255,255,255,0.48)',
            maxWidth: 520, marginLeft: 'auto', marginRight: 'auto', marginBottom: 44,
          }}>
            Turn raw marketing data into actionable business insights
            with AI-powered analytics, automated reports, and conversational AI.
          </p>

          {/* CTA pair */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 52 }}>
            <Link to="/register" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              fontSize: '14px', fontWeight: 600, color: 'white',
              background: '#4F46E5', padding: '12px 26px', borderRadius: '10px',
              textDecoration: 'none',
              boxShadow: '0 0 0 1px rgba(79,70,229,0.5), 0 6px 24px rgba(79,70,229,0.3)',
              transition: 'all 0.18s cubic-bezier(0.16,1,0.3,1)', letterSpacing: '-0.01em',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = '#4338CA'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 0 0 1px rgba(79,70,229,0.7), 0 10px 32px rgba(79,70,229,0.4)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#4F46E5'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 0 0 1px rgba(79,70,229,0.5), 0 6px 24px rgba(79,70,229,0.3)'; }}>
              Get Started <ArrowRight size={14} />
            </Link>
            <a href="#workflow" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              fontSize: '14px', fontWeight: 500, color: 'rgba(255,255,255,0.55)',
              background: 'rgba(255,255,255,0.05)', padding: '12px 26px', borderRadius: '10px',
              textDecoration: 'none', border: '1px solid rgba(255,255,255,0.09)',
              transition: 'all 0.18s cubic-bezier(0.16,1,0.3,1)', letterSpacing: '-0.01em',
            }}
              onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'; }}>
              View Demo
            </a>
          </div>

          {/* Tech badges */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexWrap: 'wrap', gap: 8,
            opacity: s0In ? 1 : 0, transition: 'opacity 0.9s ease 0.4s',
          }}>
            {['React', 'Express.js', 'FastAPI', 'Python', 'MongoDB', 'Tailwind CSS'].map(badge => (
              <span key={badge} style={{
                fontFamily: mono, fontSize: '10px', fontWeight: 500,
                letterSpacing: '0.04em', color: 'rgba(255,255,255,0.22)',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '6px', padding: '5px 11px',
              }}>
                {badge}
              </span>
            ))}
          </div>
        </div>

        {/* Scroll cue */}
        <div style={{
          position: 'absolute', bottom: 36, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          opacity: s0In ? 1 : 0, transition: 'opacity 1s ease 1s', zIndex: 10,
        }}>
          <p style={{ fontFamily: mono, fontSize: '10px', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.14)', textTransform: 'uppercase' }}>
            See it in action
          </p>
          <div style={{ animation: 'scrollBounce 2s ease-in-out infinite' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          SECTION 1 — Workflow
          How does it work? Upload → Analyze → Report
         ════════════════════════════════════════════════════════════ */}
      <section
        ref={s1Ref}
        id="workflow"
        className="relative px-6 md:px-16 py-28 overflow-hidden"
        style={{ background: '#0B0B0B' }}
      >
        {/* Dot grid */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.035) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }} />
        {/* Left glow */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 50% 70% at 5% 50%, rgba(79,70,229,0.09) 0%, transparent 60%)',
        }} />

        <div className="relative z-10 max-w-6xl mx-auto">
          {/* Section label */}
          <div style={{ ...fadein(s1In), marginBottom: 14 }}>
            <p style={eyebrow}>Product Workflow</p>
            <h2 style={{
              fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 700,
              letterSpacing: '-0.04em', lineHeight: 1.1,
              color: 'rgba(255,255,255,0.92)', maxWidth: 580,
            }}>
              From raw data to business intelligence.
              <span style={{ display: 'block', fontWeight: 300, fontSize: '0.72em', color: 'rgba(255,255,255,0.32)', marginTop: 8, letterSpacing: '-0.02em' }}>
                Upload a CSV. Get a structured report. Ask questions.
              </span>
            </h2>
          </div>

          {/* 6-step card grid */}
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px mt-14"
            style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', overflow: 'hidden' }}
          >
            {WORKFLOW_STEPS.map((step, i) => {
              const { Icon } = step;
              return (
                <div
                  key={step.num}
                  style={{
                    padding: '28px 24px',
                    background: '#0B0B0B',
                    borderRight: (i % 3 !== 2) ? '1px solid rgba(255,255,255,0.06)' : 'none',
                    borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                    ...fadein(s1In, `${i * 70}ms`),
                    cursor: 'default',
                    transition: `background 0.15s ease, opacity 0.8s cubic-bezier(0.16,1,0.3,1) ${i * 70}ms, transform 0.8s cubic-bezier(0.16,1,0.3,1) ${i * 70}ms`,
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(79,70,229,0.04)'}
                  onMouseLeave={e => e.currentTarget.style.background = '#0B0B0B'}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
                    <span style={{ fontFamily: mono, fontSize: '10px', fontWeight: 600, letterSpacing: '0.12em', color: 'rgba(129,140,248,0.55)' }}>
                      {step.num}
                    </span>
                    <Icon size={18} style={{ color: 'rgba(129,140,248,0.5)', flexShrink: 0 }} />
                  </div>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.88)', letterSpacing: '-0.01em', marginBottom: 8 }}>
                    {step.title}
                  </p>
                  <p style={{ fontFamily: mono, fontSize: '11px', color: 'rgba(255,255,255,0.32)', lineHeight: 1.6 }}>
                    {step.desc}
                  </p>
                </div>
              );
            })}
          </div>

          {/* CSV table — "this is what your uploaded data looks like" */}
          <div style={{ ...fadein(s1In, '420ms'), marginTop: 48 }}>
            <p style={{ fontFamily: mono, fontSize: '10px', letterSpacing: '0.22em', color: 'rgba(255,255,255,0.18)', textTransform: 'uppercase', marginBottom: 16 }}>
              weekly_mmm_india.csv · Sample input
            </p>
            <div style={{
              border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px',
              overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
            }}>
              {/* Header */}
              <div className="flex overflow-x-auto" style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {CSV_HEADERS.map((h, i) => (
                  <div key={i} style={{
                    flexShrink: 0, minWidth: 110, padding: '9px 14px',
                    fontFamily: mono, fontSize: '9.5px', letterSpacing: '0.1em',
                    textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)',
                    borderRight: i < CSV_HEADERS.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    fontWeight: 500,
                  }}>{h}</div>
                ))}
              </div>
              {/* Rows */}
              {CSV_ROWS.map((row, ri) => (
                <div key={ri} className="flex overflow-x-auto" style={{
                  borderBottom: ri < CSV_ROWS.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  cursor: 'default',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  {row.map((cell, ci) => (
                    <div key={ci} style={{
                      flexShrink: 0, minWidth: 110, padding: '11px 14px',
                      fontFamily: mono, fontSize: '11px',
                      borderRight: ci < row.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                      color: ci === 0 ? 'rgba(255,255,255,0.2)' : ci === 1 ? 'rgba(165,180,252,0.9)' : 'rgba(255,255,255,0.35)',
                      fontWeight: ci === 1 ? 500 : 400,
                    }}>{cell}</div>
                  ))}
                </div>
              ))}
              <div style={{ padding: '12px 16px', fontFamily: mono, fontSize: '10.5px', color: 'rgba(255,255,255,0.1)', textAlign: 'center', background: 'rgba(255,255,255,0.02)', letterSpacing: '0.08em' }}>
                · · · · · · 109,790 more rows · · · · · ·
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          SECTION 2 — Business Insights
          What do I get? Channel performance + actionable output
         ════════════════════════════════════════════════════════════ */}
      <section
        ref={s2Ref}
        className="relative px-6 md:px-16 py-28 overflow-hidden"
        style={{ background: '#080808' }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }} />

        <div className="relative z-10 max-w-6xl mx-auto">
          {/* Heading */}
          <div style={{ ...fadein(s2In), marginBottom: 48 }}>
            <p style={eyebrow}>Business Intelligence</p>
            <h2 style={{
              fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 700,
              letterSpacing: '-0.04em', lineHeight: 1.1,
              color: 'rgba(255,255,255,0.92)', maxWidth: 580,
            }}>
              Understand what's driving your business.
              <span style={{ display: 'block', fontWeight: 300, fontSize: '0.72em', color: 'rgba(255,255,255,0.32)', marginTop: 8, letterSpacing: '-0.02em' }}>
                Every number comes directly from your data — not a benchmark.
              </span>
            </h2>
          </div>

          {/* Two-column: insight cards left, ROI bars right */}
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-20">

            {/* Left — 2×2 insight cards */}
            <div className="w-full lg:flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {INSIGHT_CARDS.map((card, i) => (
                  <div
                    key={card.tag}
                    style={{
                      padding: '22px 20px',
                      background: 'rgba(255,255,255,0.025)',
                      border: '1px solid rgba(255,255,255,0.07)',
                      borderRadius: '12px',
                      ...fadein(s2In, `${i * 80}ms`),
                      transition: `background 0.15s ease, opacity 0.8s cubic-bezier(0.16,1,0.3,1) ${i * 80}ms, transform 0.8s cubic-bezier(0.16,1,0.3,1) ${i * 80}ms`,
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(79,70,229,0.06)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
                  >
                    <p style={{ fontFamily: mono, fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(129,140,248,0.5)', marginBottom: 10 }}>
                      {card.tag}
                    </p>
                    <p style={{ fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 700, letterSpacing: '-0.03em', color: 'rgba(255,255,255,0.92)', lineHeight: 1, marginBottom: 8 }}>
                      {card.value}
                    </p>
                    <p style={{ fontFamily: mono, fontSize: '10.5px', color: 'rgba(255,255,255,0.28)', lineHeight: 1.5 }}>
                      {card.sub}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Channel performance bars */}
            <div className="w-full lg:w-80" style={{ ...fadein(s2In, '240ms', 'X', 20) }}>
              <p style={{ ...eyebrow, marginBottom: 24 }}>Channel Performance</p>
              <div className="space-y-6">
                {CHANNELS.map((ch, i) => (
                  <div key={ch.name} style={{
                    opacity: chartVisible ? 1 : 0,
                    transform: chartVisible ? 'none' : 'translateY(10px)',
                    transition: `opacity 0.6s ease ${i * 120}ms, transform 0.6s ease ${i * 120}ms`,
                  }}>
                    <div className="flex items-baseline justify-between" style={{ marginBottom: 8 }}>
                      <span style={{ fontSize: '12px', fontWeight: 400, color: 'rgba(255,255,255,0.45)', letterSpacing: '-0.01em' }}>
                        {ch.name}
                      </span>
                      <span style={{ fontFamily: mono, fontSize: '16px', fontWeight: 700, color: 'rgba(255,255,255,0.9)', letterSpacing: '-0.02em' }}>
                        {ch.roi}<span style={{ fontSize: '11px', color: '#818CF8' }}>×</span>
                      </span>
                    </div>
                    <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 3, backgroundColor: ch.color,
                        width: chartVisible ? `${ch.pct}%` : '0%',
                        transition: `width 1.2s cubic-bezier(0.16,1,0.3,1) ${i * 80}ms`,
                        boxShadow: `0 0 8px ${ch.color}60`,
                      }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Model quality pill */}
              <div style={{ marginTop: 28, padding: '12px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px' }}>
                <p style={{ fontFamily: mono, fontSize: '11px', lineHeight: 1.7, color: 'rgba(255,255,255,0.3)' }}>
                  Model quality: <span style={{ color: '#34D399', fontWeight: 600 }}>Excellent</span><br />
                  5 channels · 109,795 rows analysed
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          SECTION 3 — How MarketMindAI Works
          Product workflow — no implementation details
         ════════════════════════════════════════════════════════════ */}
      <section
        ref={s3Ref}
        className="relative px-6 md:px-16 py-28 overflow-hidden"
        style={{ background: '#080808' }}
      >
        {/* Dot grid */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.035) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }} />
        {/* Right-side indigo glow */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 55% 65% at 88% 45%, rgba(79,70,229,0.10) 0%, transparent 60%)',
        }} />

        {/* ── Two-column layout ── */}
        <div className="relative z-10 max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-16 lg:gap-20">

          {/* LEFT — 45% */}
          <div className="w-full lg:w-5/12" style={{ ...fadein(s3In) }}>
            <p style={eyebrow}>Product Workflow</p>
            <h2 style={{
              fontSize: 'clamp(28px, 4vw, 46px)', fontWeight: 700,
              letterSpacing: '-0.04em', lineHeight: 1.1,
              color: 'rgba(255,255,255,0.93)', marginBottom: 20,
            }}>
              How MarketMindAI Works
            </h2>
            <p style={{
              fontSize: '15px', fontWeight: 300, lineHeight: 1.8,
              color: 'rgba(255,255,255,0.42)', letterSpacing: '-0.01em',
              maxWidth: 400, marginBottom: 36,
            }}>
              MarketMindAI transforms raw business datasets into actionable
              intelligence through an automated AI workflow. Upload your CSV
              and the platform validates, analyses, forecasts, generates
              executive reports, and enables natural language conversations
              with your data.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <Link
                to="/about"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  fontSize: '13px', fontWeight: 600, color: 'white',
                  background: '#4F46E5', padding: '10px 22px', borderRadius: '10px',
                  textDecoration: 'none',
                  boxShadow: '0 0 0 1px rgba(79,70,229,0.5), 0 6px 20px rgba(79,70,229,0.28)',
                  transition: 'all 0.18s cubic-bezier(0.16,1,0.3,1)',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#4338CA'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 0 0 1px rgba(79,70,229,0.7), 0 10px 28px rgba(79,70,229,0.38)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#4F46E5'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 0 0 1px rgba(79,70,229,0.5), 0 6px 20px rgba(79,70,229,0.28)'; }}
              >
                Learn More <ArrowRight size={13} />
              </Link>
              <a
                href="#workflow"
                style={{
                  display: 'inline-flex', alignItems: 'center',
                  fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.5)',
                  background: 'rgba(255,255,255,0.05)', padding: '10px 22px',
                  borderRadius: '10px', textDecoration: 'none',
                  border: '1px solid rgba(255,255,255,0.08)',
                  transition: 'all 0.18s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.16)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
              >
                View Demo
              </a>
            </div>
          </div>

          {/* RIGHT — 55%: glassmorphism workflow cards */}
          <div className="w-full lg:w-7/12" style={{ ...fadein(s3In, '150ms', 'X', 24) }}>
            {[
              { Icon: FileUp,        title: 'Upload Dataset',   desc: 'Upload marketing, sales, financial, or customer datasets in CSV format.',    delay: 0   },
              { Icon: ShieldCheck,   title: 'Data Validation',  desc: 'Automatic schema detection, quality checks, and missing value reporting.',   delay: 80  },
              { Icon: Cpu,           title: 'AI Analysis',      desc: 'Advanced pattern recognition, forecasting, and contribution modelling.',     delay: 160 },
              { Icon: FileBarChart2, title: 'Executive Report', desc: 'Structured business report with insights, recommendations, and forecasts.',  delay: 240 },
              { Icon: MessageCircle, title: 'Conversational AI', desc: 'Ask questions about your report in plain language and get instant answers.', delay: 320 },
            ].map((step, i, arr) => {
              const { Icon } = step;
              return (
                <div key={step.title}>
                  {/* Glassmorphism card */}
                  <div
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 16,
                      padding: '18px 20px',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.07)',
                      borderRadius: '14px',
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                      opacity: s3In ? 1 : 0,
                      transform: s3In ? 'none' : 'translateY(16px)',
                      transition: `opacity 0.7s cubic-bezier(0.16,1,0.3,1) ${step.delay}ms, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${step.delay}ms, box-shadow 0.2s ease, border-color 0.2s ease`,
                      cursor: 'default',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.boxShadow = '0 0 0 1px rgba(99,102,241,0.3), 0 8px 32px rgba(79,70,229,0.15)';
                      e.currentTarget.style.borderColor = 'rgba(99,102,241,0.28)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
                    }}
                  >
                    {/* Icon + step number */}
                    <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, paddingTop: 2 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: 'rgba(79,70,229,0.15)',
                        border: '1px solid rgba(79,70,229,0.28)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Icon size={16} style={{ color: '#818CF8' }} />
                      </div>
                      <span style={{ fontFamily: mono, fontSize: '9px', fontWeight: 600, letterSpacing: '0.1em', color: 'rgba(129,140,248,0.4)' }}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                    </div>
                    {/* Text */}
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.88)', letterSpacing: '-0.01em', marginBottom: 5 }}>
                        {step.title}
                      </p>
                      <p style={{ fontFamily: mono, fontSize: '11px', lineHeight: 1.6, color: 'rgba(255,255,255,0.32)' }}>
                        {step.desc}
                      </p>
                    </div>
                  </div>

                  {/* Animated glowing connector line */}
                  {i < arr.length - 1 && (
                    <div style={{
                      marginLeft: 34, width: 2, height: 22,
                      background: 'linear-gradient(to bottom, rgba(99,102,241,0.4), rgba(99,102,241,0.05))',
                      borderRadius: 2,
                      opacity: s3In ? 1 : 0,
                      transition: `opacity 0.5s ease ${step.delay + 250}ms`,
                    }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── BOTTOM — AI capability pills ── */}
        <div className="relative z-10 max-w-6xl mx-auto" style={{
          marginTop: 64, paddingTop: 40,
          borderTop: '1px solid rgba(255,255,255,0.05)',
          ...fadein(s3In, '500ms'),
        }}>
          <p style={{
            fontFamily: mono, fontSize: '10px', letterSpacing: '0.24em',
            textTransform: 'uppercase', color: 'rgba(255,255,255,0.16)',
            fontWeight: 500, marginBottom: 20, textAlign: 'center',
          }}>
            Powered by AI Intelligence
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
            {['Marketing Mix Modeling', 'Forecasting', 'Sentiment Analysis', 'Feature Engineering', 'Executive Reports', 'Conversational AI'].map(pill => (
              <span
                key={pill}
                style={{
                  fontSize: '12px', fontWeight: 400,
                  color: 'rgba(255,255,255,0.36)',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '999px', padding: '6px 16px',
                  letterSpacing: '-0.005em',
                  transition: 'all 0.18s ease', cursor: 'default',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.72)'; e.currentTarget.style.background = 'rgba(79,70,229,0.09)'; e.currentTarget.style.borderColor = 'rgba(79,70,229,0.28)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.36)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}
              >
                {pill}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          SECTION 4 — Interactive AI Chat
          How do I interact with it? Natural language queries.
         ════════════════════════════════════════════════════════════ */}
      <section
        ref={s4Ref}
        className="relative px-6 md:px-16 py-28 overflow-hidden"
        style={{ background: '#0B0B0B' }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 50% 60% at 75% 50%, rgba(99,102,241,0.08) 0%, transparent 60%)',
        }} />

        <div className="relative z-10 max-w-6xl mx-auto flex flex-col lg:flex-row items-start gap-16 lg:gap-24">

          {/* Left — framing copy */}
          <div className="w-full lg:w-72 lg:pt-8" style={{ ...fadein(s4In) }}>
            <p style={eyebrow}>Conversational AI</p>
            <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 40px)', fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1.15, color: 'rgba(255,255,255,0.92)', marginBottom: 16 }}>
              Talk to your reports.
            </h2>
            <p style={{ fontSize: '14px', fontWeight: 300, lineHeight: 1.7, color: 'rgba(255,255,255,0.38)', letterSpacing: '-0.01em', marginBottom: 24 }}>
              Ask questions in plain language. Get answers grounded in your actual data — channel performance, budget optimisation, forecasts.
            </p>
            {/* In Development badge */}
            <span style={{
              fontFamily: mono, fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase',
              fontWeight: 600, color: 'rgba(251,191,36,0.85)',
              background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)',
              borderRadius: '6px', padding: '5px 12px', display: 'inline-block',
            }}>
              In Development
            </span>
          </div>

          {/* Right — chat mockup */}
          <div className="w-full lg:flex-1" style={{ ...fadein(s4In, '180ms', 'X', 20) }}>
            <div style={{
              background: '#050505', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '16px', overflow: 'hidden',
              boxShadow: '0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)',
            }}>
              {/* Chat header */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(255,255,255,0.03)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: 10, background: '#4F46E5',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(79,70,229,0.4)',
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 3l1.912 5.813a2 2 0 001.272 1.272L21 12l-5.816 1.912a2 2 0 00-1.272 1.272L12 21l-1.912-5.816a2 2 0 00-1.272-1.272L3 12l5.816-1.912a2 2 0 001.272-1.272L12 3z"/>
                    </svg>
                  </div>
                  <div>
                    <p style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.9)', letterSpacing: '-0.01em' }}>MarketMindAI</p>
                    <p style={{ fontFamily: mono, fontSize: '10px', color: 'rgba(52,211,153,0.7)' }}>Scoped to: weekly_mmm_india.csv</p>
                  </div>
                </div>
                <span style={{
                  fontFamily: mono, fontSize: '10px', color: 'rgba(251,191,36,0.5)',
                  padding: '4px 10px', background: 'rgba(251,191,36,0.06)',
                  border: '1px solid rgba(251,191,36,0.15)', borderRadius: 6,
                }}>
                  chat-history API · scaffolded
                </span>
              </div>

              {/* Messages */}
              <div style={{ padding: '18px 18px 0', minHeight: 280 }}>
                {CHAT_MESSAGES.slice(0, chatStep).map((msg, i) => (
                  <div key={i} className="animate-fadeSlideUp" style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
                    <div style={{
                      maxWidth: '80%', padding: '10px 14px',
                      borderRadius: msg.role === 'user' ? '14px 14px 3px 14px' : '14px 14px 14px 3px',
                      fontSize: '12.5px', lineHeight: 1.6, letterSpacing: '-0.01em',
                      background: msg.role === 'user' ? '#4F46E5' : 'rgba(255,255,255,0.06)',
                      border: msg.role === 'user' ? 'none' : '1px solid rgba(255,255,255,0.08)',
                      color: msg.role === 'user' ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.7)',
                      boxShadow: msg.role === 'user' ? '0 4px 16px rgba(79,70,229,0.3)' : 'none',
                    }}>{msg.text}</div>
                  </div>
                ))}
                {chatStep > 0 && chatStep % 2 !== 0 && chatStep < CHAT_MESSAGES.length && (
                  <div style={{ display: 'flex', marginBottom: 12 }}>
                    <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px 14px 14px 3px', display: 'flex', gap: 5, alignItems: 'center' }}>
                      {[0, 1, 2].map(i => (
                        <span key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: '#818CF8', display: 'inline-block', animation: 'bounce 1s infinite', animationDelay: `${i * 160}ms` }} />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Input bar */}
              <div style={{ padding: '12px 18px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px' }}>
                  <span style={{ flex: 1, fontFamily: mono, fontSize: '11.5px', color: 'rgba(255,255,255,0.2)' }}>
                    Ask about your data...
                  </span>
                  <Link to="/register">
                    <button style={{ width: 28, height: 28, borderRadius: 8, background: '#4F46E5', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s ease', flexShrink: 0 }}
                      onMouseEnter={e => e.currentTarget.style.background = '#4338CA'}
                      onMouseLeave={e => e.currentTarget.style.background = '#4F46E5'}>
                      <ArrowRight size={13} color="white" />
                    </button>
                  </Link>
                </div>
              </div>
            </div>

            <p style={{ marginTop: 18, fontFamily: mono, fontSize: '10.5px', letterSpacing: '0.02em', color: 'rgba(255,255,255,0.14)' }}>
              Chat-history APIs are scaffolded. Vector search + LLM integration is on the roadmap.
            </p>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          SECTION 5 — How It Works
          Simple pipeline explanation + terminal animation
         ════════════════════════════════════════════════════════════ */}
      <section
        ref={s5Ref}
        className="relative px-6 md:px-16 py-28 overflow-hidden"
        style={{ background: '#0a0a0a' }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.035) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }} />
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 50% 70% at 10% 50%, rgba(79,70,229,0.09) 0%, transparent 60%)',
        }} />

        <div className="relative z-10 max-w-6xl mx-auto flex flex-col lg:flex-row items-start gap-12 lg:gap-20">

          {/* Left — simple numbered steps */}
          <div className="w-full lg:w-72" style={{ ...fadein(s5In) }}>
            <p style={eyebrow}>How It Works</p>
            <h2 style={{ fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1.15, color: 'rgba(255,255,255,0.92)', marginBottom: 36 }}>
              Six steps from upload to insight.
            </h2>
            <div className="space-y-0">
              {HOW_STEPS.map((step, i) => (
                <div key={step.num} style={{
                  display: 'flex', gap: 16, paddingBottom: 24,
                  borderLeft: i < HOW_STEPS.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                  marginLeft: 8, paddingLeft: 20,
                  ...fadein(s5In, `${i * 70}ms`),
                }}>
                  <div style={{
                    position: 'relative', marginLeft: -28, marginTop: 2,
                    width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                    background: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 0 0 3px #0a0a0a, 0 0 0 4px rgba(79,70,229,0.3)',
                  }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'white' }} />
                  </div>
                  <div style={{ marginLeft: 6 }}>
                    <p style={{ fontFamily: mono, fontSize: '9px', letterSpacing: '0.14em', color: 'rgba(129,140,248,0.55)', textTransform: 'uppercase', marginBottom: 4 }}>
                      {step.num} · {step.title}
                    </p>
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.42)', lineHeight: 1.6 }}>
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — terminal animation */}
          <div className="relative z-10 w-full lg:flex-1" style={{ ...fadein(s5In, '200ms', 'X', 20) }}>
            <p style={eyebrow}>Live Engine Output</p>
            <div style={{
              background: '#050505', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '14px', overflow: 'hidden',
              boxShadow: '0 24px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)',
            }}>
              {/* Traffic lights */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.03)' }}>
                {['#FF5F57', '#FFBD2E', '#28CA42'].map((c, i) => (
                  <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c, opacity: 0.7 }} />
                ))}
                <span style={{ fontFamily: mono, fontSize: '10px', color: 'rgba(255,255,255,0.2)', marginLeft: 10 }}>
                  app/main.py · FastAPI
                </span>
              </div>
              {/* Terminal body */}
              <div style={{ padding: '20px 22px', minHeight: 280, fontFamily: mono, fontSize: '12px', lineHeight: 1.8 }}>
                {terminalLines.map((line, i) => (
                  <div key={i} className="animate-fadeIn" style={{
                    color: line.type === 'cmd'  ? 'rgba(156,163,175,0.8)'
                         : line.type === 'info' ? 'rgba(165,180,252,0.85)'
                         : line.type === 'ok'   ? 'rgba(107,114,128,0.7)'
                         :                        '#34D399',
                    marginBottom: 2,
                  }}>{line.text}</div>
                ))}
                {terminalLines.length > 0 && terminalLines.length < TERMINAL_LINES.length && (
                  <span style={{ color: '#818CF8', animation: 'pulse 1s infinite' }}>█</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          SECTION 6 — Technical Foundation  (accordion, collapsed)
          For technical users only. Everything behind the product.
         ════════════════════════════════════════════════════════════ */}
      <section
        ref={s6Ref}
        className="relative px-6 md:px-16 py-24 overflow-hidden"
        style={{ background: '#080808' }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }} />

        <div className="relative z-10 max-w-3xl mx-auto">
          <div style={{ ...fadein(s6In), marginBottom: 36 }}>
            <p style={eyebrow}>Technical Foundation</p>
            <h2 style={{ fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1.15, color: 'rgba(255,255,255,0.92)', marginBottom: 10 }}>
              Built for serious analysis.
            </h2>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.7, maxWidth: 480 }}>
              Every concept explained in plain English. Expand any item to understand the technology behind the numbers.
            </p>
          </div>

          {/* Accordion */}
          <div style={{
            border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', overflow: 'hidden',
            ...fadein(s6In, '150ms'),
          }}>
            {TECH_ITEMS.map((item, i) => {
              const isOpen = openAccordion === i;
              return (
                <div key={item.title} style={{ borderBottom: i < TECH_ITEMS.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                  <button
                    onClick={() => setOpenAccordion(isOpen ? null : i)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '18px 20px', background: 'transparent', border: 'none', cursor: 'pointer',
                      textAlign: 'left', transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <span style={{ fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.78)', letterSpacing: '-0.01em', paddingRight: 16 }}>
                      {item.title}
                    </span>
                    <ChevronDown
                      size={15}
                      style={{
                        color: 'rgba(129,140,248,0.6)', flexShrink: 0,
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.25s ease',
                      }}
                    />
                  </button>
                  {isOpen && (
                    <div style={{ padding: '4px 20px 20px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                      <p style={{ fontSize: '13px', fontWeight: 300, lineHeight: 1.75, color: 'rgba(255,255,255,0.45)', letterSpacing: '-0.005em' }}>
                        {item.body}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          SECTION 7 — Final CTA
         ════════════════════════════════════════════════════════════ */}
      <section
        ref={s7Ref}
        className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center overflow-hidden"
        style={{ background: '#080808' }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 70% 50% at 50% 55%, rgba(79,70,229,0.16) 0%, transparent 65%)',
        }} />

        <div style={{
          position: 'relative', zIndex: 10,
          opacity: s7In ? 1 : 0, transform: s7In ? 'none' : 'translateY(28px)',
          transition: 'opacity 1s cubic-bezier(0.16,1,0.3,1), transform 1s cubic-bezier(0.16,1,0.3,1)',
        }}>
          <p style={{ fontFamily: mono, fontSize: '10px', letterSpacing: '0.28em', color: 'rgba(129,140,248,0.55)', textTransform: 'uppercase', marginBottom: 36, fontWeight: 500 }}>
            Now it's your turn
          </p>

          <h2 style={{ fontSize: 'clamp(42px, 8.5vw, 88px)', fontWeight: 800, letterSpacing: '-0.05em', lineHeight: 1.0, marginBottom: 20 }}>
            <span style={{ fontFamily: mono, background: 'linear-gradient(155deg, rgba(255,255,255,0.92) 30%, rgba(255,255,255,0.4) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'block', fontSize: '0.75em', letterSpacing: '-0.04em' }}>
              Run the model.
            </span>
            <span style={{ fontFamily: mono, color: '#818CF8', display: 'block', fontSize: '0.75em', letterSpacing: '-0.04em' }}>
              Read the results.
            </span>
          </h2>

          <p style={{ fontFamily: mono, fontSize: '12px', lineHeight: 1.8, color: 'rgba(255,255,255,0.22)', marginBottom: 48, letterSpacing: '0.02em' }}>
            Express.js → FastAPI → MongoDB · JWT auth live<br />
            Upload a CSV. Get a structured business report.
          </p>

          <Link to="/register" className="inline-flex items-center gap-3 text-white font-semibold" style={{
            fontSize: '15px', letterSpacing: '-0.02em', padding: '15px 32px',
            background: '#4F46E5', borderRadius: '14px',
            transition: 'all 0.2s cubic-bezier(0.16,1,0.3,1)',
            boxShadow: '0 0 0 1px rgba(79,70,229,0.6), 0 8px 32px rgba(79,70,229,0.35)',
            textDecoration: 'none',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = '#4338CA'; e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = '0 0 0 1px rgba(79,70,229,0.8), 0 12px 40px rgba(79,70,229,0.45)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#4F46E5'; e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 0 0 1px rgba(79,70,229,0.6), 0 8px 32px rgba(79,70,229,0.35)'; }}>
            Upload Your First Dataset
            <ArrowRight size={16} />
          </Link>

          <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <CheckCircle2 size={13} style={{ color: 'rgba(52,211,153,0.5)' }} />
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.01em' }}>
              Free to start · No credit card
            </span>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          borderTop: '1px solid rgba(255,255,255,0.05)',
          padding: '18px 32px', display: 'flex', flexDirection: 'row',
          alignItems: 'center', justifyContent: 'space-between', gap: 12,
        }}>
          <span style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '-0.02em', color: 'rgba(255,255,255,0.3)' }}>
            MarketMind<span style={{ color: 'rgba(99,102,241,0.7)' }}>AI</span>
          </span>
          <span style={{ fontFamily: mono, fontSize: '10px', color: 'rgba(255,255,255,0.12)' }}>
            © 2026 MarketMindAI
          </span>
          <div style={{ display: 'flex', gap: 24 }}>
            {['Privacy', 'Terms', 'API Docs'].map(l => (
              <a key={l} href="#" style={{ fontFamily: mono, fontSize: '10px', color: 'rgba(255,255,255,0.15)', textDecoration: 'none', transition: 'color 0.15s ease' }}
                onMouseEnter={e => e.target.style.color = 'rgba(255,255,255,0.45)'}
                onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.15)'}>
                {l}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── Global keyframes ── */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(3px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40%           { transform: translateY(-5px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.3; }
        }
        @keyframes scrollBounce {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50%       { transform: translateY(5px); opacity: 0.8; }
        }
        .animate-fadeIn      { animation: fadeIn      0.4s cubic-bezier(0.16,1,0.3,1) forwards; }
        .animate-fadeSlideUp { animation: fadeSlideUp 0.45s cubic-bezier(0.16,1,0.3,1) forwards; }

        * { box-sizing: border-box; }

        ::selection {
          background: rgba(79, 70, 229, 0.35);
          color: #fff;
        }

        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
      `}</style>
    </div>
  );
};

export default Home;
