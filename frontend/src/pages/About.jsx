import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, ArrowLeft, BarChart2, TrendingUp, MessageSquare,
  FileText, Brain, Search, CheckCircle2, Sparkles, ChevronRight,
  Upload, ShieldCheck, Cpu, Layers, Zap,
} from 'lucide-react';

/* ──────────────────────────────────────────────
   Utilities — mirrors Home.jsx exactly
────────────────────────────────────────────── */
const useInView = (threshold = 0.2) => {
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

const mono = "'SF Mono', 'Fira Code', monospace";

const fadein = (inView, delay = '0ms', axis = 'Y', dist = 20) => ({
  opacity: inView ? 1 : 0,
  transform: inView ? 'none' : `translate${axis}(${dist}px)`,
  transition: `opacity 0.85s cubic-bezier(0.16,1,0.3,1) ${delay}, transform 0.85s cubic-bezier(0.16,1,0.3,1) ${delay}`,
});

const eyebrow = {
  fontFamily: mono,
  fontSize: '10px',
  letterSpacing: '0.24em',
  color: 'rgba(129,140,248,0.6)',
  textTransform: 'uppercase',
  fontWeight: 500,
  marginBottom: 20,
};

const dotGrid = {
  position: 'absolute', inset: 0,
  backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.038) 1px, transparent 1px)',
  backgroundSize: '28px 28px', pointerEvents: 'none',
};

/* ──────────────────────────────────────────────
   Static data
────────────────────────────────────────────── */
const CAPABILITIES = [
  { Icon: BarChart2,     title: 'Marketing Mix Modeling',          tag: 'Live', desc: 'Understand the contribution of every marketing channel and identify which investments generate the greatest business impact.' },
  { Icon: TrendingUp,   title: 'Forecasting',                     tag: 'Live', desc: 'Analyze historical trends to estimate future business performance and support better planning decisions.' },
  { Icon: MessageSquare, title: 'Sentiment Analysis',             tag: 'Live', desc: 'Understand customer opinions by analyzing reviews and identifying common positive and negative themes.' },
  { Icon: FileText,     title: 'Executive Report Generation',     tag: 'Live', desc: 'Automatically transform complex analyses into structured reports with insights, summaries, and actionable recommendations.' },
  { Icon: Search,       title: 'Retrieval-Augmented Generation',  tag: 'Live', desc: 'Enable intelligent conversations with generated reports by retrieving relevant business context before answering user questions.' },
  { Icon: Brain,        title: 'Conversational Business Intelligence', tag: 'Live', desc: 'Interact with reports naturally by asking business questions instead of manually searching through charts and documents.' },
];

const PIPELINE = [
  { Icon: Upload,      title: 'Upload Dataset',      desc: 'Raw data enters the platform as a structured CSV file.' },
  { Icon: ShieldCheck, title: 'Data Validation',     desc: 'Schema detection, quality checks, and completeness verification.' },
  { Icon: Layers,      title: 'Feature Engineering', desc: 'Variables are transformed, encoded, and enriched for modelling.' },
  { Icon: Cpu,         title: 'AI Analysis',         desc: 'Statistical models and AI algorithms process the data.' },
  { Icon: BarChart2,   title: 'Business Insights',   desc: 'Channel contributions, forecasts, and patterns are extracted.' },
  { Icon: FileText,    title: 'Executive Report',    desc: 'Structured, readable reports are generated automatically.' },
  { Icon: Search,      title: 'RAG Retrieval',       desc: 'Relevant report context is indexed for semantic retrieval.' },
  { Icon: Brain,       title: 'Conversational AI',   desc: 'Users ask questions in plain language and receive grounded answers.' },
];

const AVAILABLE_TODAY = [
  'Marketing Mix Modeling', 'Forecasting', 'Sentiment Analysis',
  'Executive Reports', 'RAG-powered Conversations', 'Business Analytics Workflow',
];

const ROADMAP = [
  {
    Icon: Zap, title: 'Agentic AI Business Analyst', badge: 'Planned',
    desc: 'An autonomous AI analyst capable of planning analyses, selecting appropriate models, reasoning over results, and recommending business strategies without manual configuration.',
  },
  {
    Icon: Layers, title: 'Multi-Dataset Intelligence', badge: 'Planned',
    desc: 'A single AI workspace that understands relationships across multiple business datasets — marketing, sales, finance, and customer feedback — simultaneously.',
  },
  {
    Icon: Sparkles, title: 'Multi-Agent Collaboration', badge: 'Planned',
    desc: 'Specialized AI agents working together: Planning → Forecasting → Marketing Mix Modeling → Sentiment Analysis → Executive Strategy. Each contributes before the final recommendation.',
  },
];

/* ══════════════════════════════════════════════
   ABOUT PAGE
══════════════════════════════════════════════ */
const About = () => {
  const [navVisible, setNavVisible] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    const onScroll = () => setNavVisible(window.scrollY > 80);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const [s1Ref, s1In] = useInView(0.15);
  const [s2Ref, s2In] = useInView(0.12);
  const [s3Ref, s3In] = useInView(0.1);
  const [s4Ref, s4In] = useInView(0.1);
  const [s5Ref, s5In] = useInView(0.2);
  const [s6Ref, s6In] = useInView(0.15);
  const [s7Ref, s7In] = useInView(0.1);
  const [s8Ref, s8In] = useInView(0.2);

  const base = {
    background: '#080808',
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    fontFeatureSettings: '"cv11","ss01"',
    WebkitFontSmoothing: 'antialiased',
    color: 'white',
    overflowX: 'hidden',
  };

  /* ── Shared card hover helpers ── */
  const cardHover = (enter, el) => {
    el.style.background = enter ? 'rgba(79,70,229,0.04)' : '#080808';
  };

  return (
    <div style={base}>

      {/* ══ STICKY TOP NAV ══ */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 48, height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 32px',
        background: navVisible ? 'rgba(8,8,8,0.88)' : 'rgba(8,8,8,0.35)',
        backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        borderBottom: navVisible ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(255,255,255,0.02)',
        transition: 'background 0.35s ease, border-color 0.35s ease',
      }}>
        <Link to="/" style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '-0.03em', color: 'rgba(255,255,255,0.9)', textDecoration: 'none' }}>
          MarketMind<span style={{ color: '#818CF8' }}>AI</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link to="/"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '13px', fontWeight: 400, color: 'rgba(255,255,255,0.45)', textDecoration: 'none', padding: '6px 12px', borderRadius: 8, transition: 'all 0.15s ease' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.82)'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; e.currentTarget.style.background = 'transparent'; }}>
            <ArrowLeft size={13} /> Back to Home
          </Link>
          <Link to="/register"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '13px', fontWeight: 600, color: 'white', background: '#4F46E5', padding: '7px 16px', borderRadius: '9px', textDecoration: 'none', boxShadow: '0 0 0 1px rgba(79,70,229,0.5)', transition: 'all 0.15s ease' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#4338CA'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#4F46E5'; }}>
            Get Started <ArrowRight size={12} />
          </Link>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════
          S1 — HERO
         ════════════════════════════════════════════════════════ */}
      <section ref={s1Ref} style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 64, padding: '64px 24px 0', position: 'relative', overflow: 'hidden' }}>
        <div style={dotGrid} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 55% at 50% 48%, rgba(79,70,229,0.12) 0%, transparent 65%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', maxWidth: 760, marginLeft: 'auto', marginRight: 'auto', ...fadein(s1In) }}>
          <p style={{ ...eyebrow, marginBottom: 28 }}>About MarketMindAI</p>

          <h1 style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontSize: 'clamp(36px, 6.5vw, 80px)', fontWeight: 400,
            letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 28,
            background: 'linear-gradient(160deg, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.55) 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            The Intelligence Behind MarketMindAI
          </h1>

          <p style={{ fontSize: 'clamp(15px, 1.8vw, 18px)', fontWeight: 300, lineHeight: 1.8, color: 'rgba(255,255,255,0.4)', maxWidth: 580, margin: '0 auto 52px', letterSpacing: '-0.01em' }}>
            Discover how artificial intelligence, statistical modeling, and retrieval-powered
            reasoning work together to transform raw business data into strategic decisions.
          </p>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="#capabilities"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: '13px', fontWeight: 600, color: 'white', background: '#4F46E5', padding: '11px 24px', borderRadius: '10px', textDecoration: 'none', boxShadow: '0 0 0 1px rgba(79,70,229,0.5), 0 6px 24px rgba(79,70,229,0.3)', transition: 'all 0.18s ease' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#4338CA'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#4F46E5'; e.currentTarget.style.transform = 'translateY(0)'; }}>
              Explore Capabilities <ChevronRight size={13} />
            </a>
            <Link to="/"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.05)', padding: '11px 24px', borderRadius: '10px', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.08)', transition: 'all 0.18s ease' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}>
              View Demo
            </Link>
          </div>
        </div>

        {/* Scroll cue */}
        <div style={{ position: 'absolute', bottom: 36, left: '50%', transform: 'translateX(-50%)', textAlign: 'center', opacity: s1In ? 1 : 0, transition: 'opacity 1s ease 1s' }}>
          <p style={{ fontFamily: mono, fontSize: '10px', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.14)', textTransform: 'uppercase', marginBottom: 8 }}>Scroll</p>
          <div style={{ animation: 'scrollBounce 2s ease-in-out infinite' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          S2 — WHY IT EXISTS
         ════════════════════════════════════════════════════════ */}
      <section ref={s2Ref} style={{ background: '#0B0B0B', padding: '112px 24px', position: 'relative', overflow: 'hidden' }}>
        <div style={dotGrid} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 50% 70% at 10% 50%, rgba(79,70,229,0.09) 0%, transparent 60%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 10, maxWidth: 1152, marginLeft: 'auto', marginRight: 'auto' }}>
          {/* Large pull quote */}
          <div style={{ textAlign: 'center', marginBottom: 80, ...fadein(s2In) }}>
            <p style={eyebrow}>The Problem</p>
            <h2 style={{
              fontFamily: "'DM Serif Display', Georgia, serif",
              fontSize: 'clamp(26px, 4.5vw, 56px)', fontWeight: 400, fontStyle: 'italic',
              letterSpacing: '-0.02em', lineHeight: 1.2,
              color: 'rgba(255,255,255,0.88)', maxWidth: 780, margin: '0 auto',
            }}>
              "Most dashboards only visualize numbers. They rarely explain why something happened."
            </h2>
          </div>

          {/* Split layout */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 64 }}>
            {/* Left — abstract illustration */}
            <div style={{ flex: '1 1 340px', ...fadein(s2In, '100ms', 'X', -24) }}>
              <div style={{
                aspectRatio: '4/3', borderRadius: 20,
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(255,255,255,0.07)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative', overflow: 'hidden',
                boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
              }}>
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(79,70,229,0.06) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 60% at 50% 55%, rgba(79,70,229,0.18) 0%, transparent 70%)' }} />
                {[
                  { label: 'Channel ROI', value: '4.2×', top: '18%', left: '10%', d: '0ms' },
                  { label: 'Revenue Impact', value: '+₹3.2M', top: '44%', left: '52%', d: '180ms' },
                  { label: 'Model Accuracy', value: 'R² 0.94', top: '70%', left: '8%', d: '340ms' },
                ].map(c => (
                  <div key={c.label} style={{
                    position: 'absolute', top: c.top, left: c.left,
                    padding: '10px 16px', background: 'rgba(14,14,14,0.85)',
                    border: '1px solid rgba(255,255,255,0.09)', borderRadius: 12,
                    backdropFilter: 'blur(16px)', zIndex: 2,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                    opacity: s2In ? 1 : 0, transform: s2In ? 'translateY(0)' : 'translateY(8px)',
                    transition: `opacity 0.7s ease ${c.d}, transform 0.7s ease ${c.d}`,
                  }}>
                    <p style={{ fontFamily: mono, fontSize: '9px', letterSpacing: '0.12em', color: 'rgba(129,140,248,0.6)', textTransform: 'uppercase', marginBottom: 4 }}>{c.label}</p>
                    <p style={{ fontFamily: mono, fontSize: '20px', fontWeight: 700, color: 'rgba(255,255,255,0.9)', letterSpacing: '-0.03em' }}>{c.value}</p>
                  </div>
                ))}
                <div style={{ position: 'relative', zIndex: 1, width: 64, height: 64, borderRadius: 20, background: 'rgba(79,70,229,0.2)', border: '1px solid rgba(79,70,229,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 40px rgba(79,70,229,0.25)' }}>
                  <Brain size={28} style={{ color: '#818CF8' }} />
                </div>
              </div>
            </div>

            {/* Right — text */}
            <div style={{ flex: '1 1 340px', ...fadein(s2In, '200ms') }}>
              <p style={eyebrow}>Why It Exists</p>
              <h3 style={{ fontSize: 'clamp(20px, 2.8vw, 32px)', fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1.15, color: 'rgba(255,255,255,0.92)', marginBottom: 28 }}>
                Businesses collect enormous amounts of data. Very little of it becomes decisions.
              </h3>
              {[
                { q: 'Why did this happen?', a: 'Traditional dashboards display what — not why. MarketMindAI identifies the drivers behind business outcomes.' },
                { q: 'What caused it?', a: 'Through statistical attribution and contribution analysis, the platform explains causal relationships in your data.' },
                { q: 'What should be done next?', a: 'Every report includes actionable recommendations based on your actual numbers — not generic benchmarks.' },
              ].map((item, i) => (
                <div key={i} style={{
                  marginBottom: 22, paddingLeft: 20, borderLeft: '2px solid rgba(79,70,229,0.35)',
                  opacity: s2In ? 1 : 0, transform: s2In ? 'none' : 'translateY(12px)',
                  transition: `opacity 0.7s ease ${i * 100 + 300}ms, transform 0.7s ease ${i * 100 + 300}ms`,
                }}>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.75)', marginBottom: 5 }}>{item.q}</p>
                  <p style={{ fontFamily: mono, fontSize: '11.5px', lineHeight: 1.65, color: 'rgba(255,255,255,0.32)' }}>{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          S3 — CURRENT AI CAPABILITIES
         ════════════════════════════════════════════════════════ */}
      <section ref={s3Ref} id="capabilities" style={{ background: '#080808', padding: '112px 24px', position: 'relative', overflow: 'hidden' }}>
        <div style={dotGrid} />
        <div style={{ position: 'relative', zIndex: 10, maxWidth: 1152, marginLeft: 'auto', marginRight: 'auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64, ...fadein(s3In) }}>
            <p style={eyebrow}>Capabilities</p>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1.1, color: 'rgba(255,255,255,0.92)', marginBottom: 14 }}>
              Current AI Capabilities
            </h2>
            <p style={{ fontSize: '15px', fontWeight: 300, color: 'rgba(255,255,255,0.35)', maxWidth: 440, margin: '0 auto', lineHeight: 1.7 }}>
              Every capability below is available in today's platform.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 1, border: '1px solid rgba(255,255,255,0.06)', borderRadius: 18, overflow: 'hidden' }}>
            {CAPABILITIES.map((cap, i) => {
              const { Icon } = cap;
              return (
                <div
                  key={cap.title}
                  style={{
                    padding: '32px 28px', background: '#080808',
                    borderRight: '1px solid rgba(255,255,255,0.06)',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    opacity: s3In ? 1 : 0, transform: s3In ? 'none' : 'translateY(18px)',
                    transition: `opacity 0.75s cubic-bezier(0.16,1,0.3,1) ${i * 60}ms, transform 0.75s cubic-bezier(0.16,1,0.3,1) ${i * 60}ms, background 0.15s ease`,
                    cursor: 'default',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(79,70,229,0.04)'}
                  onMouseLeave={e => e.currentTarget.style.background = '#080808'}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(79,70,229,0.12)', border: '1px solid rgba(79,70,229,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={18} style={{ color: '#818CF8' }} />
                    </div>
                    <span style={{ fontFamily: mono, fontSize: '9px', fontWeight: 600, letterSpacing: '0.12em', color: 'rgba(52,211,153,0.7)', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 6, padding: '3px 9px' }}>
                      {cap.tag}
                    </span>
                  </div>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.88)', letterSpacing: '-0.01em', marginBottom: 10 }}>{cap.title}</p>
                  <p style={{ fontFamily: mono, fontSize: '11.5px', lineHeight: 1.7, color: 'rgba(255,255,255,0.3)' }}>{cap.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          S4 — INTELLIGENCE PIPELINE
         ════════════════════════════════════════════════════════ */}
      <section ref={s4Ref} style={{ background: '#0B0B0B', padding: '112px 24px', position: 'relative', overflow: 'hidden' }}>
        <div style={dotGrid} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 70% at 50% 50%, rgba(79,70,229,0.08) 0%, transparent 65%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 10, maxWidth: 1152, marginLeft: 'auto', marginRight: 'auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 72, ...fadein(s4In) }}>
            <p style={eyebrow}>Intelligence Pipeline</p>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1.1, color: 'rgba(255,255,255,0.92)', marginBottom: 14 }}>
              How Intelligence Flows
            </h2>
            <p style={{ fontSize: '15px', fontWeight: 300, color: 'rgba(255,255,255,0.35)', maxWidth: 440, margin: '0 auto', lineHeight: 1.7 }}>
              From raw data to actionable conversation — every stage of the AI pipeline.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0 40px' }}>
            {PIPELINE.map((stage, i) => {
              const { Icon } = stage;
              return (
                <div key={stage.title} style={{ display: 'flex', marginBottom: 0 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: 16, paddingTop: 4 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                      background: 'rgba(79,70,229,0.18)', border: '1px solid rgba(79,70,229,0.4)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 0 16px rgba(79,70,229,0.2)',
                      opacity: s4In ? 1 : 0, transform: s4In ? 'scale(1)' : 'scale(0.7)',
                      transition: `opacity 0.6s ease ${i * 80}ms, transform 0.6s ease ${i * 80}ms`,
                    }}>
                      <Icon size={15} style={{ color: '#818CF8' }} />
                    </div>
                    {i < PIPELINE.length - 1 && (
                      <div style={{
                        width: 1, flex: 1, minHeight: 24,
                        background: 'linear-gradient(to bottom, rgba(79,70,229,0.4), rgba(79,70,229,0.06))',
                        margin: '6px 0',
                        opacity: s4In ? 1 : 0,
                        transition: `opacity 0.5s ease ${i * 80 + 300}ms`,
                      }} />
                    )}
                  </div>
                  <div style={{
                    paddingBottom: 32, paddingTop: 4,
                    opacity: s4In ? 1 : 0, transform: s4In ? 'none' : 'translateX(-8px)',
                    transition: `opacity 0.7s ease ${i * 80 + 60}ms, transform 0.7s ease ${i * 80 + 60}ms`,
                  }}>
                    <p style={{ fontFamily: mono, fontSize: '9px', letterSpacing: '0.14em', color: 'rgba(129,140,248,0.5)', textTransform: 'uppercase', marginBottom: 5 }}>
                      Stage {String(i + 1).padStart(2, '0')}
                    </p>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.88)', letterSpacing: '-0.01em', marginBottom: 5 }}>{stage.title}</p>
                    <p style={{ fontFamily: mono, fontSize: '11px', lineHeight: 1.6, color: 'rgba(255,255,255,0.3)', maxWidth: 260 }}>{stage.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          S5 — DESIGN PHILOSOPHY
         ════════════════════════════════════════════════════════ */}
      <section ref={s5Ref} style={{ background: '#080808', padding: '112px 24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 75% 55% at 50% 48%, rgba(79,70,229,0.09) 0%, transparent 65%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 10, maxWidth: 720, marginLeft: 'auto', marginRight: 'auto', textAlign: 'center', ...fadein(s5In) }}>
          <p style={eyebrow}>Design Philosophy</p>
          <h2 style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontSize: 'clamp(32px, 5.5vw, 64px)', fontWeight: 400,
            letterSpacing: '-0.02em', lineHeight: 1.1,
            color: 'rgba(255,255,255,0.93)', marginBottom: 28,
          }}>
            Built for Explainability
          </h2>
          <p style={{ fontSize: '16px', fontWeight: 300, lineHeight: 1.8, color: 'rgba(255,255,255,0.4)', marginBottom: 56, letterSpacing: '-0.01em' }}>
            MarketMindAI is built on the principle that intelligence should be transparent.
            Every output should help users understand the full picture — not just the answer.
          </p>

          <div style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden' }}>
            {[
              { num: '01', q: 'What happened?',           desc: 'Every report begins with a clear summary of what the data shows — trends, peaks, drops, and channel contributions.' },
              { num: '02', q: 'Why did it happen?',        desc: 'Statistical attribution and contribution analysis identify the drivers behind business outcomes — not assumptions.' },
              { num: '03', q: 'What should happen next?', desc: 'Recommendations are grounded in your actual numbers, giving teams a clear direction for the next decision.' },
            ].map((item, i) => (
              <div key={i}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 24, padding: '28px 32px',
                  background: '#080808', textAlign: 'left',
                  borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                  opacity: s5In ? 1 : 0, transform: s5In ? 'none' : 'translateY(12px)',
                  transition: `opacity 0.7s ease ${i * 110}ms, transform 0.7s ease ${i * 110}ms, background 0.15s ease`,
                  cursor: 'default',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(79,70,229,0.03)'}
                onMouseLeave={e => e.currentTarget.style.background = '#080808'}
              >
                <span style={{ fontFamily: mono, fontSize: '11px', fontWeight: 600, color: 'rgba(129,140,248,0.5)', flexShrink: 0, paddingTop: 2 }}>{item.num}</span>
                <div>
                  <p style={{ fontSize: '15px', fontWeight: 600, color: 'rgba(255,255,255,0.88)', letterSpacing: '-0.02em', marginBottom: 8 }}>{item.q}</p>
                  <p style={{ fontFamily: mono, fontSize: '12px', lineHeight: 1.7, color: 'rgba(255,255,255,0.32)' }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          S6 — TODAY'S PLATFORM
         ════════════════════════════════════════════════════════ */}
      <section ref={s6Ref} style={{ background: '#0B0B0B', padding: '112px 24px', position: 'relative', overflow: 'hidden' }}>
        <div style={dotGrid} />
        <div style={{ position: 'relative', zIndex: 10, maxWidth: 1152, marginLeft: 'auto', marginRight: 'auto' }}>
          <div style={{ marginBottom: 56, ...fadein(s6In) }}>
            <span style={{ fontFamily: mono, fontSize: '10px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(52,211,153,0.8)', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 6, padding: '5px 14px', display: 'inline-block', marginBottom: 20 }}>
              Available Today
            </span>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1.1, color: 'rgba(255,255,255,0.92)', marginBottom: 12 }}>
              Today's Platform
            </h2>
            <p style={{ fontSize: '14px', fontWeight: 300, color: 'rgba(255,255,255,0.35)', maxWidth: 440, lineHeight: 1.7 }}>
              Everything listed below is fully implemented and available in the current platform.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {AVAILABLE_TODAY.map((item, i) => (
              <div key={item}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '20px 22px',
                  background: 'rgba(52,211,153,0.04)', border: '1px solid rgba(52,211,153,0.12)', borderRadius: 12,
                  opacity: s6In ? 1 : 0, transform: s6In ? 'none' : 'translateY(14px)',
                  transition: `opacity 0.7s ease ${i * 70}ms, transform 0.7s ease ${i * 70}ms, background 0.15s ease, border-color 0.15s ease`,
                  cursor: 'default',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(52,211,153,0.07)'; e.currentTarget.style.borderColor = 'rgba(52,211,153,0.22)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(52,211,153,0.04)'; e.currentTarget.style.borderColor = 'rgba(52,211,153,0.12)'; }}
              >
                <CheckCircle2 size={16} style={{ color: '#34D399', flexShrink: 0 }} />
                <span style={{ fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.78)', letterSpacing: '-0.01em' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          S7 — FUTURE ROADMAP
         ════════════════════════════════════════════════════════ */}
      <section ref={s7Ref} style={{ background: '#080808', padding: '112px 24px', position: 'relative', overflow: 'hidden' }}>
        <div style={dotGrid} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 65% 60% at 80% 30%, rgba(79,70,229,0.07) 0%, transparent 60%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 10, maxWidth: 1152, marginLeft: 'auto', marginRight: 'auto' }}>
          <div style={{ marginBottom: 48, ...fadein(s7In) }}>
            <span style={{ fontFamily: mono, fontSize: '10px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(251,191,36,0.8)', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 6, padding: '5px 14px', display: 'inline-block', marginBottom: 20 }}>
              Future Roadmap — Not Yet Built
            </span>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1.1, color: 'rgba(255,255,255,0.92)', marginBottom: 12 }}>
              What's Coming Next
            </h2>
            <p style={{ fontSize: '14px', fontWeight: 300, color: 'rgba(255,255,255,0.3)', maxWidth: 480, lineHeight: 1.7 }}>
              These capabilities are planned for future development. None of the following are available today.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {ROADMAP.map((item, i) => {
              const { Icon } = item;
              return (
                <div key={item.title}
                  style={{
                    padding: '32px 28px',
                    background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 16, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                    opacity: s7In ? 1 : 0, transform: s7In ? 'none' : 'translateY(20px)',
                    transition: `opacity 0.8s cubic-bezier(0.16,1,0.3,1) ${i * 100}ms, transform 0.8s cubic-bezier(0.16,1,0.3,1) ${i * 100}ms, box-shadow 0.2s ease, border-color 0.2s ease`,
                    cursor: 'default',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 0 1px rgba(99,102,241,0.25), 0 12px 40px rgba(79,70,229,0.12)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.2)'; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(79,70,229,0.12)', border: '1px solid rgba(79,70,229,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={20} style={{ color: '#818CF8' }} />
                    </div>
                    <span style={{ fontFamily: mono, fontSize: '9px', fontWeight: 600, letterSpacing: '0.12em', color: 'rgba(251,191,36,0.7)', background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.18)', borderRadius: 6, padding: '3px 9px' }}>
                      {item.badge}
                    </span>
                  </div>
                  <p style={{ fontSize: '15px', fontWeight: 600, color: 'rgba(255,255,255,0.85)', letterSpacing: '-0.02em', marginBottom: 12 }}>{item.title}</p>
                  <p style={{ fontFamily: mono, fontSize: '11.5px', lineHeight: 1.75, color: 'rgba(255,255,255,0.28)' }}>{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          S8 — VISION
         ════════════════════════════════════════════════════════ */}
      <section ref={s8Ref} style={{ background: '#080808', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '112px 24px', position: 'relative', overflow: 'hidden', textAlign: 'center' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 50% 52%, rgba(79,70,229,0.14) 0%, transparent 68%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 10, maxWidth: 680, ...fadein(s8In) }}>
          <p style={eyebrow}>Vision</p>

          <div style={{ marginBottom: 48 }}>
            <p style={{ fontFamily: mono, fontSize: 'clamp(11px, 1.4vw, 14px)', letterSpacing: '0.04em', color: 'rgba(255,255,255,0.28)', marginBottom: 8 }}>Today's MarketMindAI</p>
            <p style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 'clamp(22px, 4vw, 48px)', fontWeight: 400, letterSpacing: '-0.02em', color: 'rgba(255,255,255,0.88)', lineHeight: 1.2, marginBottom: 20 }}>
              AI-powered Business Intelligence Platform
            </p>
            <div style={{ margin: '18px auto', width: 1, height: 44, background: 'linear-gradient(to bottom, rgba(79,70,229,0.5), rgba(79,70,229,0.05))' }} />
            <p style={{ fontFamily: mono, fontSize: 'clamp(11px, 1.4vw, 14px)', letterSpacing: '0.04em', color: 'rgba(129,140,248,0.5)', marginBottom: 8 }}>Tomorrow's MarketMindAI</p>
            <p style={{
              fontFamily: "'DM Serif Display', Georgia, serif",
              fontSize: 'clamp(22px, 4vw, 48px)', fontWeight: 400, fontStyle: 'italic',
              letterSpacing: '-0.02em', lineHeight: 1.2,
              background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(129,140,248,0.8) 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              marginBottom: 40,
            }}>
              Autonomous Business Intelligence Partner
            </p>
          </div>

          <p style={{ fontSize: '15px', fontWeight: 300, lineHeight: 1.85, color: 'rgba(255,255,255,0.36)', marginBottom: 52, letterSpacing: '-0.01em' }}>
            MarketMindAI is evolving beyond dashboards and reports. Our vision is to build an intelligent
            business partner capable of understanding business goals, reasoning across multiple datasets,
            collaborating through specialized AI agents, and helping organizations make faster, smarter,
            and more informed decisions.
          </p>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: '14px', fontWeight: 600, color: 'white', background: '#4F46E5', padding: '13px 28px', borderRadius: '12px', textDecoration: 'none', boxShadow: '0 0 0 1px rgba(79,70,229,0.5), 0 8px 28px rgba(79,70,229,0.32)', transition: 'all 0.2s ease', letterSpacing: '-0.01em' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#4338CA'; e.currentTarget.style.transform = 'scale(1.02)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#4F46E5'; e.currentTarget.style.transform = 'scale(1)'; }}>
              Get Started <ArrowRight size={14} />
            </Link>
            <Link to="/"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: '14px', fontWeight: 500, color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.05)', padding: '13px 28px', borderRadius: '12px', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.09)', transition: 'all 0.18s ease', letterSpacing: '-0.01em' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}>
              <ArrowLeft size={14} /> Back to Home
            </Link>
          </div>
        </div>

        {/* Footer strip */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, borderTop: '1px solid rgba(255,255,255,0.05)', padding: '18px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '-0.02em', color: 'rgba(255,255,255,0.3)' }}>
            MarketMind<span style={{ color: 'rgba(99,102,241,0.7)' }}>AI</span>
          </span>
          <span style={{ fontFamily: mono, fontSize: '10px', color: 'rgba(255,255,255,0.12)' }}>© 2026 MarketMindAI</span>
        </div>
      </section>

      <style>{`
        @keyframes scrollBounce { 0%,100%{transform:translateY(0);opacity:.4} 50%{transform:translateY(5px);opacity:.8} }
        *{box-sizing:border-box}
        ::selection{background:rgba(79,70,229,.35);color:#fff}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,.08);border-radius:4px}
      `}</style>
    </div>
  );
};

export default About;
