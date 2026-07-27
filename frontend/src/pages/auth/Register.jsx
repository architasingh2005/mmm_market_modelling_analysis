import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Mail, Lock, Eye, EyeOff, User, Sparkles,
  BarChart2, FileText, Brain, Upload,
} from 'lucide-react';

/* ─── shared design tokens ─── */
const mono = "'SF Mono','Fira Code',monospace";

const WORKFLOW = [
  { Icon: Upload,    label: 'CSV Upload',       desc: 'Drop your dataset' },
  { Icon: BarChart2, label: 'AI Analysis',       desc: 'Models run instantly' },
  { Icon: FileText,  label: 'Executive Report',  desc: 'Structured insights' },
  { Icon: Brain,     label: 'Conversational AI', desc: 'Ask anything' },
];

const FEATURES = [
  { Icon: BarChart2, title: 'AI Business Intelligence', desc: 'Understand your business beyond dashboards.' },
  { Icon: FileText,  title: 'Executive Reports',        desc: 'Automatically generate structured business reports.' },
  { Icon: Brain,     title: 'Conversational Analytics', desc: 'Ask questions about your reports naturally.' },
];

/* ─── Left panel ─── */
const LeftPanel = ({ visible }) => (
  <div style={{
    flex: '0 0 55%', minHeight: '100vh', position: 'relative',
    background: '#080808', overflow: 'hidden',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    padding: '60px 48px',
  }}>
    <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '28px 28px', pointerEvents: 'none' }} />
    <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 75% 60% at 50% 45%, rgba(79,70,229,0.16) 0%, transparent 65%)', pointerEvents: 'none' }} />
    <div style={{ position: 'absolute', width: 320, height: 320, borderRadius: '50%', background: 'rgba(79,70,229,0.07)', filter: 'blur(60px)', top: '-60px', left: '-80px', animation: 'floatOrb 8s ease-in-out infinite', pointerEvents: 'none' }} />
    <div style={{ position: 'absolute', width: 240, height: 240, borderRadius: '50%', background: 'rgba(129,140,248,0.06)', filter: 'blur(50px)', bottom: '60px', right: '-40px', animation: 'floatOrb 10s ease-in-out infinite reverse', pointerEvents: 'none' }} />

    <div style={{ position: 'relative', zIndex: 10, maxWidth: 480, width: '100%' }}>
      <div style={{ opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(20px)', transition: 'opacity 0.8s ease, transform 0.8s ease', marginBottom: 48 }}>
        <p style={{ fontFamily: mono, fontSize: '10px', letterSpacing: '0.24em', color: 'rgba(129,140,248,0.6)', textTransform: 'uppercase', fontWeight: 500, marginBottom: 16 }}>
          AI Business Intelligence
        </p>
        <h2 style={{ fontSize: 'clamp(28px, 3.5vw, 44px)', fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1.1, color: 'rgba(255,255,255,0.93)', marginBottom: 14 }}>
          Welcome to<br />
          <span style={{ background: 'linear-gradient(135deg, #818CF8 0%, #6366F1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            MarketMindAI
          </span>
        </h2>
        <p style={{ fontSize: '14px', fontWeight: 300, lineHeight: 1.7, color: 'rgba(255,255,255,0.38)', maxWidth: 380 }}>
          Transform raw business data into intelligent insights using AI-powered analytics, forecasting, and conversational business intelligence.
        </p>
      </div>

      {/* Workflow pipeline */}
      <div style={{ marginBottom: 48, opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(16px)', transition: 'opacity 0.8s ease 0.15s, transform 0.8s ease 0.15s' }}>
        {WORKFLOW.map((step, i) => {
          const { Icon } = step;
          return (
            <div key={step.label}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, backdropFilter: 'blur(8px)', transition: 'all 0.18s ease' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(79,70,229,0.07)'; e.currentTarget.style.borderColor = 'rgba(79,70,229,0.25)'; e.currentTarget.style.boxShadow = '0 0 0 1px rgba(79,70,229,0.15)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.boxShadow = 'none'; }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(79,70,229,0.18)', border: '1px solid rgba(79,70,229,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={14} style={{ color: '#818CF8' }} />
                </div>
                <div>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.85)', letterSpacing: '-0.01em' }}>{step.label}</p>
                  <p style={{ fontFamily: mono, fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>{step.desc}</p>
                </div>
                <span style={{ marginLeft: 'auto', fontFamily: mono, fontSize: '9px', fontWeight: 600, letterSpacing: '0.1em', color: 'rgba(129,140,248,0.45)' }}>{String(i + 1).padStart(2, '0')}</span>
              </div>
              {i < WORKFLOW.length - 1 && (
                <div style={{ marginLeft: 31, width: 2, height: 16, background: 'linear-gradient(to bottom, rgba(99,102,241,0.4), rgba(99,102,241,0.05))', borderRadius: 2 }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Feature cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(12px)', transition: 'opacity 0.8s ease 0.3s, transform 0.8s ease 0.3s' }}>
        {FEATURES.map((feat, i) => {
          const { Icon } = feat;
          return (
            <div key={feat.title} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, animation: `floatCard 5s ease-in-out infinite ${i * 0.6}s` }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(79,70,229,0.14)', border: '1px solid rgba(79,70,229,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={13} style={{ color: '#818CF8' }} />
              </div>
              <div>
                <p style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.8)', letterSpacing: '-0.01em', marginBottom: 2 }}>{feat.title}</p>
                <p style={{ fontFamily: mono, fontSize: '10.5px', color: 'rgba(255,255,255,0.28)', lineHeight: 1.5 }}>{feat.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </div>
);

/* ════════════════════════════════════════════════════════
   REGISTER PAGE
  ════════════════════════════════════════════════════════ */
const Register = () => {
  const [visible, setVisible]           = useState(false);
  const [showPass, setShowPass]         = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [loading, setLoading]           = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });

  useEffect(() => {
    window.scrollTo(0, 0);
    setTimeout(() => setVisible(true), 80);
  }, []);

  const handleChange = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      localStorage.setItem('token', 'demo-token-12345');
      window.location.href = '/dashboard';
    }, 1400);
  };

  const inputStyle = (field) => ({
    width: '100%', padding: '11px 14px 11px 40px',
    background: 'rgba(255,255,255,0.04)',
    border: `1px solid ${focusedField === field ? 'rgba(99,102,241,0.55)' : 'rgba(255,255,255,0.09)'}`,
    borderRadius: 10, color: 'rgba(255,255,255,0.88)',
    fontSize: '13px', outline: 'none',
    fontFamily: "'Inter', sans-serif",
    boxShadow: focusedField === field ? '0 0 0 3px rgba(79,70,229,0.12), inset 0 1px 0 rgba(255,255,255,0.05)' : 'none',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease',
    caretColor: '#818CF8',
  });

  const labelStyle = {
    fontFamily: mono, fontSize: '10px', letterSpacing: '0.14em',
    textTransform: 'uppercase', fontWeight: 600,
    color: 'rgba(255,255,255,0.38)', marginBottom: 8, display: 'block',
  };

  const iconStyle = (field) => ({
    position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)',
    color: focusedField === field ? '#818CF8' : 'rgba(255,255,255,0.25)',
    transition: 'color 0.2s ease', pointerEvents: 'none',
  });

  return (
    <div style={{
      display: 'flex', minHeight: '100vh', background: '#080808',
      fontFamily: "'Inter', system-ui, sans-serif",
      fontFeatureSettings: '"cv11","ss01"',
      WebkitFontSmoothing: 'antialiased', overflowX: 'hidden',
    }}>
      {/* Left panel */}
      <div className="hidden lg:flex" style={{ flex: '0 0 55%' }}>
        <LeftPanel visible={visible} />
      </div>

      {/* Right — Auth */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', position: 'relative', background: '#0B0B0B', minHeight: '100vh', overflowY: 'auto' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(79,70,229,0.09) 0%, transparent 65%)', pointerEvents: 'none' }} />

        <div style={{
          position: 'relative', zIndex: 10, width: '100%', maxWidth: 400,
          opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(24px)',
          transition: 'opacity 0.85s cubic-bezier(0.16,1,0.3,1) 0.1s, transform 0.85s cubic-bezier(0.16,1,0.3,1) 0.1s',
          paddingTop: 24, paddingBottom: 24,
        }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <Link to="/" style={{ textDecoration: 'none' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(79,70,229,0.4)' }}>
                  <Sparkles size={17} color="white" />
                </div>
                <span style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '-0.03em', color: 'rgba(255,255,255,0.92)' }}>
                  MarketMind<span style={{ color: '#818CF8' }}>AI</span>
                </span>
              </div>
            </Link>
            <h1 style={{ fontSize: '26px', fontWeight: 700, letterSpacing: '-0.04em', color: 'rgba(255,255,255,0.93)', marginBottom: 8 }}>
              Create your account
            </h1>
            <p style={{ fontFamily: mono, fontSize: '11px', color: 'rgba(255,255,255,0.32)', letterSpacing: '0.01em' }}>
              Start transforming your business data into actionable intelligence.
            </p>
          </div>

          {/* Glass card */}
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 18, padding: '28px 28px',
            backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            boxShadow: '0 24px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
          }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Full Name */}
              <div>
                <label style={labelStyle}>Full Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={14} style={iconStyle('name')} />
                  <input type="text" value={form.name} onChange={handleChange('name')} placeholder="Your full name" required
                    style={inputStyle('name')} onFocus={() => setFocusedField('name')} onBlur={() => setFocusedField(null)} />
                </div>
              </div>

              {/* Email */}
              <div>
                <label style={labelStyle}>Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={14} style={iconStyle('email')} />
                  <input type="email" value={form.email} onChange={handleChange('email')} placeholder="you@company.com" required
                    style={inputStyle('email')} onFocus={() => setFocusedField('email')} onBlur={() => setFocusedField(null)} />
                </div>
              </div>

              {/* Password */}
              <div>
                <label style={labelStyle}>Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={14} style={iconStyle('pass')} />
                  <input type={showPass ? 'text' : 'password'} value={form.password} onChange={handleChange('password')} placeholder="Create a strong password" required
                    style={{ ...inputStyle('pass'), paddingRight: 44 }} onFocus={() => setFocusedField('pass')} onBlur={() => setFocusedField(null)} />
                  <button type="button" onClick={() => setShowPass(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', transition: 'color 0.15s ease', padding: 2 }}
                    onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}>
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label style={labelStyle}>Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={14} style={iconStyle('confirm')} />
                  <input type={showConfirm ? 'text' : 'password'} value={form.confirm} onChange={handleChange('confirm')} placeholder="Repeat your password" required
                    style={{ ...inputStyle('confirm'), paddingRight: 44 }} onFocus={() => setFocusedField('confirm')} onBlur={() => setFocusedField(null)} />
                  <button type="button" onClick={() => setShowConfirm(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', transition: 'color 0.15s ease', padding: 2 }}
                    onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}>
                    {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button type="submit" disabled={loading} style={{
                width: '100%', padding: '13px', marginTop: 4,
                background: loading ? 'rgba(79,70,229,0.6)' : '#4F46E5',
                border: 'none', borderRadius: 12, cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px', fontWeight: 600, color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: '0 0 0 1px rgba(79,70,229,0.5), 0 6px 20px rgba(79,70,229,0.3)',
                transition: 'all 0.18s cubic-bezier(0.16,1,0.3,1)',
                letterSpacing: '-0.01em',
              }}
                onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = '#4338CA'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 0 0 1px rgba(79,70,229,0.7), 0 10px 28px rgba(79,70,229,0.4)'; }}}
                onMouseLeave={e => { e.currentTarget.style.background = '#4F46E5'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 0 0 1px rgba(79,70,229,0.5), 0 6px 20px rgba(79,70,229,0.3)'; }}>
                {loading ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
                      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.25)" strokeWidth="3" />
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                    Creating account...
                  </>
                ) : (
                  <>Create Account <ArrowRight size={15} /></>
                )}
              </button>
            </form>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
              <span style={{ fontFamily: mono, fontSize: '10px', letterSpacing: '0.16em', color: 'rgba(255,255,255,0.22)', textTransform: 'uppercase' }}>or continue with</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
            </div>

            {/* Social */}
            <div style={{ display: 'flex', gap: 10 }}>
              {[
                {
                  name: 'Google',
                  icon: <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115z"/><path fill="#34A853" d="M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078a7.077 7.077 0 0 1-6.723-4.823l-4.04 3.067A11.965 11.965 0 0 0 12 24c2.933 0 5.735-1.043 7.834-3l-3.793-2.987z"/><path fill="#4A90E2" d="M19.834 21c2.195-2.048 3.62-5.096 3.62-9 0-.71-.109-1.473-.272-2.182H12v4.637h6.436c-.317 1.559-1.17 2.766-2.395 3.558L19.834 21z"/><path fill="#FBBC05" d="M5.277 14.268A7.12 7.12 0 0 1 4.909 12c0-.782.125-1.533.357-2.235L1.24 6.65A11.934 11.934 0 0 0 0 12c0 1.92.445 3.73 1.237 5.335l4.04-3.067z"/></svg>,
                },
                {
                  name: 'GitHub',
                  icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="rgba(255,255,255,0.7)"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>,
                },
              ].map(s => (
                <button key={s.name} type="button" style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '10px', background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.09)', borderRadius: 10,
                  color: 'rgba(255,255,255,0.55)', fontSize: '12px', fontWeight: 500,
                  cursor: 'pointer', transition: 'all 0.15s ease',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.16)'; e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                  {s.icon} {s.name}
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <p style={{ textAlign: 'center', marginTop: 24, fontFamily: mono, fontSize: '11.5px', color: 'rgba(255,255,255,0.28)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#818CF8', textDecoration: 'none', fontWeight: 600, transition: 'color 0.15s ease' }}
              onMouseEnter={e => e.target.style.color = '#A5B4FC'}
              onMouseLeave={e => e.target.style.color = '#818CF8'}>
              Sign In
            </Link>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes floatOrb { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-20px)} }
        @keyframes floatCard { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        input::placeholder { color: rgba(255,255,255,0.2); }
        * { box-sizing: border-box; }
        ::selection { background: rgba(79,70,229,.35); color: #fff; }
      `}</style>
    </div>
  );
};

export default Register;
