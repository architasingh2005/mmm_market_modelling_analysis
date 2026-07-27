import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Mail, Lock, Eye, EyeOff, User, Sparkles } from 'lucide-react';

const mono = "'SF Mono','Fira Code',monospace";

/* ─── Animated Background Canvas ─── */
const AnimatedBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let particles = [];
    let w, h;

    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < 55; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        r: Math.random() * 1.4 + 0.3,
        ox: Math.random() * window.innerWidth,
        oy: Math.random() * window.innerHeight,
        speed: Math.random() * 0.0004 + 0.0001,
        phase: Math.random() * Math.PI * 2,
        opacity: Math.random() * 0.35 + 0.08,
      });
    }

    let t = 0;
    const draw = () => {
      t += 0.004;
      ctx.clearRect(0, 0, w, h);

      ctx.strokeStyle = 'rgba(255,255,255,0.022)';
      ctx.lineWidth = 1;
      const gridSize = 52;
      for (let x = 0; x < w; x += gridSize) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let y = 0; y < h; y += gridSize) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }

      particles.forEach(p => {
        const dx = Math.cos(t * p.speed * 1000 + p.phase) * 45;
        const dy = Math.sin(t * p.speed * 1000 + p.phase * 1.3) * 30;
        p.x = p.ox + dx;
        p.y = p.oy + dy;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(129,140,248,${p.opacity})`;
        ctx.fill();
      });

      ctx.strokeStyle = 'rgba(99,102,241,0.06)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 18]);
      for (let i = 0; i < 5; i++) {
        const yPos = (h * 0.15) + i * (h * 0.17) + Math.sin(t + i) * 8;
        const xStart = w * 0.1 + Math.cos(t * 0.3 + i) * 20;
        ctx.beginPath();
        ctx.moveTo(xStart, yPos);
        ctx.lineTo(w * 0.9 + Math.sin(t * 0.3 + i) * 15, yPos);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}
    />
  );
};

/* ════════════════════════════════════════════════════════
   REGISTER PAGE
  ════════════════════════════════════════════════════════ */
const Register = () => {
  const [visible, setVisible]           = useState(false);
  const [showPass, setShowPass]         = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [loading, setLoading]           = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [cardFloat, setCardFloat]       = useState(0);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });

  useEffect(() => {
    window.scrollTo(0, 0);
    setTimeout(() => setVisible(true), 80);

    let frame;
    let t = 0;
    const float = () => {
      t += 0.01;
      setCardFloat(Math.sin(t) * 4);
      frame = requestAnimationFrame(float);
    };
    frame = requestAnimationFrame(float);
    return () => cancelAnimationFrame(frame);
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
    width: '100%',
    padding: '10px 16px 10px 42px',
    background: focusedField === field
      ? 'rgba(79,70,229,0.07)'
      : 'rgba(255,255,255,0.035)',
    border: `1px solid ${focusedField === field ? 'rgba(99,102,241,0.6)' : 'rgba(255,255,255,0.09)'}`,
    borderRadius: 12,
    color: 'rgba(255,255,255,0.9)',
    fontSize: '13.5px',
    outline: 'none',
    fontFamily: "'Inter', sans-serif",
    boxShadow: focusedField === field
      ? '0 0 0 3px rgba(79,70,229,0.15), 0 0 16px rgba(99,102,241,0.12), inset 0 1px 0 rgba(255,255,255,0.06)'
      : 'inset 0 1px 0 rgba(255,255,255,0.03)',
    transition: 'border-color 0.25s ease, box-shadow 0.25s ease, background 0.25s ease',
    caretColor: '#818CF8',
    letterSpacing: '0.01em',
  });

  const labelStyle = {
    fontFamily: mono,
    fontSize: '10px',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    fontWeight: 600,
    color: 'rgba(255,255,255,0.35)',
    marginBottom: 5,
    display: 'block',
  };

  const iconStyle = (field) => ({
    position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
    color: focusedField === field ? '#818CF8' : 'rgba(255,255,255,0.22)',
    transition: 'color 0.25s ease', pointerEvents: 'none',
  });

  const eyeBtnStyle = {
    position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', cursor: 'pointer', padding: 3,
    color: 'rgba(255,255,255,0.28)',
    transition: 'color 0.2s ease, transform 0.2s ease',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#080808',
      fontFamily: "'Inter', system-ui, sans-serif",
      fontFeatureSettings: '"cv11","ss01"',
      WebkitFontSmoothing: 'antialiased',
      overflowX: 'hidden',
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 16,
      paddingBottom: 16,
    }}>
      <AnimatedBackground />

      {/* Background orbs */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 70% 55% at 50% 48%, rgba(79,70,229,0.13) 0%, transparent 65%)',
        }} />
        <div style={{
          position: 'absolute', width: 500, height: 500, borderRadius: '50%',
          background: 'rgba(79,70,229,0.08)', filter: 'blur(100px)',
          top: '-120px', left: '-100px',
          animation: 'orbDrift1 14s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', width: 420, height: 420, borderRadius: '50%',
          background: 'rgba(129,140,248,0.07)', filter: 'blur(90px)',
          bottom: '-80px', right: '-80px',
          animation: 'orbDrift2 18s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', width: 240, height: 240, borderRadius: '50%',
          background: 'rgba(99,102,241,0.06)', filter: 'blur(70px)',
          top: '55%', left: '65%',
          animation: 'orbDrift3 22s ease-in-out infinite',
        }} />
      </div>

      {/* Main content */}
      <div style={{
        position: 'relative', zIndex: 10,
        width: '100%', maxWidth: 440,
        padding: '8px 20px 16px',
        opacity: visible ? 1 : 0,
        transform: visible ? `translateY(${cardFloat}px) scale(1)` : 'translateY(28px) scale(0.96)',
        transition: visible
          ? 'opacity 0.9s cubic-bezier(0.16,1,0.3,1) 0.05s, scale 0.9s cubic-bezier(0.16,1,0.3,1) 0.05s'
          : 'none',
        willChange: 'transform',
      }}>

        {/* ── Top section ── */}
        <div style={{ textAlign: 'center', marginBottom: 16 }}>


          {/* Logo */}
          <Link to="/" style={{ textDecoration: 'none', display: 'inline-block', marginBottom: 12 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 20px rgba(79,70,229,0.45), 0 0 0 1px rgba(99,102,241,0.3)',
              }}>
                <Sparkles size={18} color="white" />
              </div>
              <span style={{ fontSize: '17px', fontWeight: 700, letterSpacing: '-0.035em', color: 'rgba(255,255,255,0.93)' }}>
                MarketMind<span style={{ color: '#818CF8' }}>AI</span>
              </span>
            </div>
          </Link>

          <h1 style={{
            fontSize: '26px', fontWeight: 700, letterSpacing: '-0.045em',
            color: 'rgba(255,255,255,0.95)', marginBottom: 6, lineHeight: 1.15,
          }}>
            Create Your Account
          </h1>
          <p style={{
            fontFamily: mono, fontSize: '11px', lineHeight: 1.7,
            color: 'rgba(255,255,255,0.3)', letterSpacing: '0.01em', maxWidth: 300, margin: '0 auto',
          }}>
            Start transforming your business data into intelligent insights.
          </p>
        </div>

        {/* ── Glass card ── */}
        <div id="register-card" style={{
          background: 'rgba(255,255,255,0.032)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 22,
          padding: '22px 26px',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          boxShadow: '0 0 0 1px rgba(129,140,248,0.08), 0 32px 72px rgba(0,0,0,0.6), 0 8px 24px rgba(79,70,229,0.1), inset 0 1px 0 rgba(255,255,255,0.07)',
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>

            {/* Full Name */}
            <div>
              <label style={labelStyle}>Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={14} style={iconStyle('name')} />
                <input
                  type="text" value={form.name} onChange={handleChange('name')}
                  placeholder="Your full name" required
                  id="register-name"
                  style={inputStyle('name')}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label style={labelStyle}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={14} style={iconStyle('email')} />
                <input
                  type="email" value={form.email} onChange={handleChange('email')}
                  placeholder="you@company.com" required
                  id="register-email"
                  style={inputStyle('email')}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={labelStyle}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={14} style={iconStyle('pass')} />
                <input
                  type={showPass ? 'text' : 'password'} value={form.password} onChange={handleChange('password')}
                  placeholder="Create a strong password" required
                  id="register-password"
                  style={{ ...inputStyle('pass'), paddingRight: 46 }}
                  onFocus={() => setFocusedField('pass')}
                  onBlur={() => setFocusedField(null)}
                />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  style={eyeBtnStyle}
                  onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.72)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.28)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1)'; }}>
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label style={labelStyle}>Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={14} style={iconStyle('confirm')} />
                <input
                  type={showConfirm ? 'text' : 'password'} value={form.confirm} onChange={handleChange('confirm')}
                  placeholder="Repeat your password" required
                  id="register-confirm"
                  style={{ ...inputStyle('confirm'), paddingRight: 46 }}
                  onFocus={() => setFocusedField('confirm')}
                  onBlur={() => setFocusedField(null)}
                />
                <button type="button" onClick={() => setShowConfirm(v => !v)}
                  style={eyeBtnStyle}
                  onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.72)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.28)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1)'; }}>
                  {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit" disabled={loading}
              id="register-submit"
              style={{
                width: '100%', padding: '13.5px', marginTop: 4,
                background: loading ? 'rgba(79,70,229,0.65)' : 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
                border: 'none', borderRadius: 13, cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px', fontWeight: 600, color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: '0 0 0 1px rgba(79,70,229,0.55), 0 6px 22px rgba(79,70,229,0.35)',
                transition: 'all 0.2s cubic-bezier(0.16,1,0.3,1)',
                letterSpacing: '-0.015em',
                fontFamily: "'Inter', sans-serif",
              }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 0 0 1px rgba(99,102,241,0.7), 0 12px 32px rgba(79,70,229,0.45), 0 0 0 4px rgba(79,70,229,0.08)'; }}}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 0 0 1px rgba(79,70,229,0.55), 0 6px 22px rgba(79,70,229,0.35)'; }}>
              {loading ? (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.75s linear infinite' }}>
                    <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '14px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
            <span style={{ fontFamily: mono, fontSize: '9.5px', letterSpacing: '0.18em', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase' }}>or continue with</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
          </div>

          {/* Social buttons */}
          <div style={{ display: 'flex', gap: 10 }}>
            {[
              {
                name: 'Google', id: 'register-google',
                icon: <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115z"/><path fill="#34A853" d="M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078a7.077 7.077 0 0 1-6.723-4.823l-4.04 3.067A11.965 11.965 0 0 0 12 24c2.933 0 5.735-1.043 7.834-3l-3.793-2.987z"/><path fill="#4A90E2" d="M19.834 21c2.195-2.048 3.62-5.096 3.62-9 0-.71-.109-1.473-.272-2.182H12v4.637h6.436c-.317 1.559-1.17 2.766-2.395 3.558L19.834 21z"/><path fill="#FBBC05" d="M5.277 14.268A7.12 7.12 0 0 1 4.909 12c0-.782.125-1.533.357-2.235L1.24 6.65A11.934 11.934 0 0 0 0 12c0 1.92.445 3.73 1.237 5.335l4.04-3.067z"/></svg>,
              },
              {
                name: 'GitHub', id: 'register-github',
                icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="rgba(255,255,255,0.75)"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>,
              },
            ].map(s => (
              <button key={s.name} id={s.id} type="button" style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '11px',
                background: 'rgba(255,255,255,0.035)',
                border: '1px solid rgba(255,255,255,0.09)',
                borderRadius: 12,
                color: 'rgba(255,255,255,0.5)',
                fontSize: '12.5px', fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.16,1,0.3,1)',
                fontFamily: "'Inter', sans-serif",
                letterSpacing: '-0.01em',
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
                  e.currentTarget.style.borderColor = 'rgba(129,140,248,0.22)';
                  e.currentTarget.style.color = 'rgba(255,255,255,0.88)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 18px rgba(0,0,0,0.25), 0 0 0 1px rgba(129,140,248,0.1)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.035)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)';
                  e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}>
                {s.icon} {s.name}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p style={{ textAlign: 'center', marginTop: 26, fontFamily: mono, fontSize: '11px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.02em' }}>
          Already have an account?{' '}
          <Link to="/login"
            style={{ color: '#818CF8', textDecoration: 'none', fontWeight: 600, transition: 'color 0.15s ease' }}
            onMouseEnter={e => { e.target.style.color = '#A5B4FC'; }}
            onMouseLeave={e => { e.target.style.color = '#818CF8'; }}>
            Sign In
          </Link>
        </p>
      </div>

      <style>{`
        @keyframes orbDrift1 { 0%,100%{transform:translate(0,0)} 33%{transform:translate(30px,-20px)} 66%{transform:translate(-15px,25px)} }
        @keyframes orbDrift2 { 0%,100%{transform:translate(0,0)} 33%{transform:translate(-25px,18px)} 66%{transform:translate(20px,-30px)} }
        @keyframes orbDrift3 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(20px,-20px)} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        input::placeholder { color: rgba(255,255,255,0.18); }
        * { box-sizing: border-box; }
        ::selection { background: rgba(79,70,229,.35); color: #fff; }
        @media (max-width: 480px) {
          #register-card { padding: 24px 18px !important; }
        }
      `}</style>
    </div>
  );
};

export default Register;
