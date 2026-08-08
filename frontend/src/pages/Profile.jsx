import { useState, useEffect } from 'react';
import { User, Mail, Lock, Shield, Save, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

/* ── Toast notification ───────────────────────────────────────────── */
const Toast = ({ msg, type, onClose }) => (
  <div style={{
    position: 'fixed', top: 24, right: 24, zIndex: 9999,
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '12px 18px', borderRadius: 12,
    background: type === 'success' ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)',
    border: `1px solid ${type === 'success' ? 'rgba(52,211,153,0.3)' : 'rgba(248,113,113,0.3)'}`,
    color: type === 'success' ? '#34D399' : '#F87171',
    fontSize: 13, fontWeight: 500,
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    animation: 'slideIn 0.2s ease',
  }}>
    {type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
    {msg}
    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', marginLeft: 4, opacity: 0.6 }}>✕</button>
    <style>{`@keyframes slideIn { from { opacity:0; transform:translateX(20px) } to { opacity:1; transform:translateX(0) } }`}</style>
  </div>
);

/* ── Input component ──────────────────────────────────────────────── */
const Field = ({ label, icon: Icon, type = 'text', value, onChange, placeholder, disabled, suffix }) => (
  <div style={{ marginBottom: 20 }}>
    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(240,240,248,0.5)', marginBottom: 6, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
      {label}
    </label>
    <div style={{ position: 'relative' }}>
      <Icon size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(240,240,248,0.3)', pointerEvents: 'none' }} />
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          width: '100%', boxSizing: 'border-box',
          padding: '11px 14px 11px 40px',
          paddingRight: suffix ? 44 : 14,
          background: disabled ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 10, color: disabled ? 'rgba(240,240,248,0.3)' : '#F0F0F8',
          fontSize: 13, outline: 'none', fontFamily: 'Inter, sans-serif',
          cursor: disabled ? 'not-allowed' : 'text',
        }}
        onFocus={e => { if (!disabled) e.target.style.borderColor = 'rgba(108,99,255,0.5)'; }}
        onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; }}
      />
      {suffix}
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════════
   PROFILE PAGE
═══════════════════════════════════════════════════════════════════ */
const Profile = () => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast]     = useState(null);

  // Profile form
  const [name, setName]         = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password form
  const [currentPw,  setCurrentPw]  = useState('');
  const [newPw,      setNewPw]      = useState('');
  const [confirmPw,  setConfirmPw]  = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew,     setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [savingPw,   setSavingPw]   = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  /* Fetch real user from API on mount */
  useEffect(() => {
    fetch(`${API}/auth/profile`, { headers: authHeaders() })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setUser(data.user);
          setName(data.user.name || '');
          // Also update localStorage cache
          localStorage.setItem('user', JSON.stringify(data.user));
        }
      })
      .catch(() => showToast('Failed to load profile', 'error'))
      .finally(() => setLoading(false));
  }, []);

  /* Save name */
  const handleSaveProfile = async () => {
    if (!name.trim()) return showToast('Name cannot be empty', 'error');
    setSavingProfile(true);
    try {
      const res = await fetch(`${API}/auth/profile`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Update failed');
      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
      showToast('Profile updated successfully');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  /* Change password */
  const handleChangePassword = async () => {
    if (!currentPw || !newPw || !confirmPw) return showToast('All password fields are required', 'error');
    if (newPw !== confirmPw) return showToast('New passwords do not match', 'error');
    if (newPw.length < 6) return showToast('Password must be at least 6 characters', 'error');
    setSavingPw(true);
    try {
      const res = await fetch(`${API}/auth/change-password`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Password change failed');
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      showToast('Password changed successfully');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSavingPw(false);
    }
  };

  const initials = user ? (user.name || 'U').split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase() : '...';

  const card = (children, style = {}) => (
    <div style={{
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 16, padding: 28, marginBottom: 20, ...style,
    }}>
      {children}
    </div>
  );

  const sectionTitle = (icon, title) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(108,99,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </div>
      <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#F0F0F8' }}>{title}</h2>
    </div>
  );

  const pwSuffix = (show, setShow) => (
    <button onClick={() => setShow(s => !s)} style={{
      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
      background: 'none', border: 'none', color: 'rgba(240,240,248,0.3)', cursor: 'pointer', padding: 2,
    }}>
      {show ? <EyeOff size={14} /> : <Eye size={14} />}
    </button>
  );

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', paddingBottom: 40 }}>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#F0F0F8' }}>Account Settings</h1>
        <p style={{ margin: '6px 0 0', fontSize: 13, color: 'rgba(240,240,248,0.35)' }}>
          Manage your identity and security preferences
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(240,240,248,0.3)', fontSize: 13 }}>
          Loading your profile…
        </div>
      ) : (
        <>
          {/* Avatar + basic info */}
          {card(
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'linear-gradient(135deg, #6C63FF, #4F46E5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, fontWeight: 800, color: '#fff',
                boxShadow: '0 4px 16px rgba(108,99,255,0.4)', flexShrink: 0,
              }}>
                {initials}
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#F0F0F8' }}>{user?.name}</p>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: 'rgba(240,240,248,0.35)', fontFamily: 'monospace' }}>{user?.email}</p>
                <span style={{
                  display: 'inline-block', marginTop: 8, padding: '3px 10px',
                  background: 'rgba(108,99,255,0.12)', border: '1px solid rgba(108,99,255,0.2)',
                  borderRadius: 20, fontSize: 11, fontWeight: 600, color: '#8B83FF', textTransform: 'capitalize',
                }}>
                  {user?.role || 'user'}
                </span>
              </div>
            </div>
          )}

          {/* Edit profile */}
          {card(
            <>
              {sectionTitle(<User size={15} color="#8B83FF" />, 'Profile Information')}
              <Field label="Full Name" icon={User} value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" />
              <Field label="Email Address" icon={Mail} value={user?.email || ''} onChange={() => {}} placeholder="" disabled />
              <p style={{ fontSize: 11, color: 'rgba(240,240,248,0.25)', margin: '-12px 0 20px' }}>Email address cannot be changed.</p>
              <button
                onClick={handleSaveProfile}
                disabled={savingProfile || name.trim() === user?.name}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 20px', borderRadius: 10, border: 'none',
                  background: savingProfile || name.trim() === user?.name ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg, #6C63FF, #4F46E5)',
                  color: savingProfile || name.trim() === user?.name ? 'rgba(240,240,248,0.3)' : '#fff',
                  fontSize: 13, fontWeight: 600, cursor: savingProfile || name.trim() === user?.name ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Save size={14} />
                {savingProfile ? 'Saving…' : 'Save Changes'}
              </button>
            </>
          )}

          {/* Change password */}
          {card(
            <>
              {sectionTitle(<Lock size={15} color="#8B83FF" />, 'Change Password')}
              <Field label="Current Password" icon={Lock} type={showCurrent ? 'text' : 'password'} value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="Enter current password" suffix={pwSuffix(showCurrent, setShowCurrent)} />
              <Field label="New Password" icon={Shield} type={showNew ? 'text' : 'password'} value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="At least 6 characters" suffix={pwSuffix(showNew, setShowNew)} />
              <Field label="Confirm New Password" icon={Shield} type={showConfirm ? 'text' : 'password'} value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="Repeat new password" suffix={pwSuffix(showConfirm, setShowConfirm)} />
              <button
                onClick={handleChangePassword}
                disabled={savingPw || !currentPw || !newPw || !confirmPw}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 20px', borderRadius: 10, border: 'none',
                  background: savingPw || !currentPw || !newPw || !confirmPw ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg, #6C63FF, #4F46E5)',
                  color: savingPw || !currentPw || !newPw || !confirmPw ? 'rgba(240,240,248,0.3)' : '#fff',
                  fontSize: 13, fontWeight: 600, cursor: savingPw || !currentPw || !newPw || !confirmPw ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Lock size={14} />
                {savingPw ? 'Updating…' : 'Update Password'}
              </button>
            </>
          )}

          {/* Account metadata */}
          {card(
            <>
              {sectionTitle(<Shield size={15} color="#8B83FF" />, 'Account Details')}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {[
                  { label: 'Account ID', value: user?._id ? `…${String(user._id).slice(-8)}` : '—' },
                  { label: 'Role',       value: user?.role || 'user' },
                  { label: 'Member Since', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—' },
                  { label: 'Status',     value: 'Active' },
                ].map(({ label, value }) => (
                  <div key={label} style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.05)' }}>
                    <p style={{ margin: 0, fontSize: 11, color: 'rgba(240,240,248,0.3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</p>
                    <p style={{ margin: '4px 0 0', fontSize: 13, fontWeight: 600, color: 'rgba(240,240,248,0.75)', fontFamily: label === 'Account ID' ? 'monospace' : 'inherit', textTransform: label === 'Role' || label === 'Status' ? 'capitalize' : 'none' }}>{value}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Profile;
