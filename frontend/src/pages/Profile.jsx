import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Mail, Lock, Shield, Save, Eye, EyeOff, CheckCircle,
  AlertCircle, Upload, Link as LinkIcon, Database, FileText,
  MessageSquare, Calendar, LogOut, RefreshCw, KeyRound, Trash2,
  Check, Image as ImageIcon
} from 'lucide-react';

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function formatDate(iso) {
  if (!iso) return 'Not provided';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return 'Not provided';
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
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
  }}>
    {type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
    {msg}
    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', marginLeft: 4, opacity: 0.6 }}>✕</button>
  </div>
);

/* ── Input field component ────────────────────────────────────────────── */
const Field = ({ label, icon: Icon, type = 'text', value, onChange, placeholder, disabled, hint, suffix }) => (
  <div style={{ marginBottom: 20 }}>
    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(240,240,248,0.4)', marginBottom: 6, letterSpacing: '0.6px', textTransform: 'uppercase', fontFamily: 'monospace' }}>
      {label}
    </label>
    <div style={{ position: 'relative' }}>
      {Icon && <Icon size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(240,240,248,0.3)', pointerEvents: 'none' }} />}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          width: '100%', boxSizing: 'border-box',
          padding: Icon ? '11px 14px 11px 40px' : '11px 14px',
          paddingRight: suffix ? 44 : 14,
          background: disabled ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 10, color: disabled ? 'rgba(240,240,248,0.35)' : '#F0F0F8',
          fontSize: 13, outline: 'none', fontFamily: 'Inter, sans-serif',
          cursor: disabled ? 'not-allowed' : 'text',
          transition: 'all 0.15s ease',
        }}
        onFocus={e => { if (!disabled) e.target.style.borderColor = 'rgba(108,99,255,0.5)'; }}
        onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; }}
      />
      {suffix}
    </div>
    {hint && <p style={{ fontSize: 11, color: 'rgba(240,240,248,0.3)', margin: '4px 0 0' }}>{hint}</p>}
  </div>
);

/* ═══════════════════════════════════════════════════════════════════
   MAIN PROFILE PAGE
═══════════════════════════════════════════════════════════════════ */
const Profile = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [user, setUser]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [toast, setToast]           = useState(null);

  // Profile form state
  const [name, setName]                     = useState('');
  const [activeSource, setActiveSource]     = useState('none'); // 'upload' | 'url' | 'none'
  const [selectedFile, setSelectedFile]     = useState(null);
  const [filePreview, setFilePreview]       = useState('');
  const [imageUrl, setImageUrl]             = useState('');
  const [savingProfile, setSavingProfile]   = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Password form state
  const [currentPw, setCurrentPw]     = useState('');
  const [newPw, setNewPw]             = useState('');
  const [confirmPw, setConfirmPw]     = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [savingPw, setSavingPw]       = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  /* Sync updated user to state, localStorage, and broadcast global event */
  const updateLocalUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    window.dispatchEvent(new Event('user-profile-updated'));
  };

  /* Fetch real user profile & database stats on mount */
  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/profile`, { headers: authHeaders() });
      const data = await res.json();
      if (res.ok && data.success) {
        const u = data.user;
        setUser(u);
        setName(u.name || '');
        const src = u.profileImageSource || (u.profilePicture ? 'url' : 'none');
        setActiveSource(src);
        if (src === 'url') {
          setImageUrl(u.profilePicture || '');
        }
        updateLocalUser(u);
      } else {
        throw new Error(data.message || 'Failed to fetch user profile');
      }
    } catch (err) {
      console.error('[Profile] fetchProfile error:', err);
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  /* Source switching handler 1: Device Upload option selected */
  const handleSelectUploadSource = () => {
    setActiveSource('upload');
    setImageUrl(''); // Clear URL source input
  };

  /* Source switching handler 2: Image URL option selected / typing in URL */
  const handleSelectUrlSource = () => {
    setActiveSource('url');
    setSelectedFile(null); // Clear uploaded file selection
    setFilePreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  /* Handle local file selection for Device Upload */
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (< 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image file size must be less than 5MB', 'error');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Validate type
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    if (!allowed.includes(file.type)) {
      showToast('Please select a valid image file (.jpg, .png, .webp, .gif, .svg)', 'error');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setSelectedFile(file);
    setFilePreview(URL.createObjectURL(file));

    // STRICT SOURCE SWITCHING: Switching to Upload clears URL
    setActiveSource('upload');
    setImageUrl('');
  };

  /* Handle typing in Image URL field */
  const handleUrlChange = (e) => {
    const val = e.target.value;
    setImageUrl(val);

    // STRICT SOURCE SWITCHING: Entering URL clears uploaded file
    if (val.trim()) {
      setActiveSource('url');
      setSelectedFile(null);
      setFilePreview('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  /* Remove Profile Photo completely */
  const handleRemovePhoto = async () => {
    setSelectedFile(null);
    setFilePreview('');
    setImageUrl('');
    setActiveSource('none');
    if (fileInputRef.current) fileInputRef.current.value = '';

    setSavingProfile(true);
    try {
      const res = await fetch(`${API}/auth/profile`, {
        method: 'PUT',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          profilePicture: '',
          profileImageSource: 'none',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to remove profile photo');

      updateLocalUser(data.user);
      showToast('Profile photo removed');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  /* Save Profile (handles Device Upload or URL save) */
  const handleSaveProfile = async () => {
    if (!name.trim()) return showToast('Name cannot be empty', 'error');

    setSavingProfile(true);

    try {
      // CASE 1: Device Upload source active with newly selected file
      if (activeSource === 'upload' && selectedFile) {
        setUploadingImage(true);
        const formData = new FormData();
        formData.append('file', selectedFile);

        const uploadRes = await fetch(`${API}/auth/upload-avatar`, {
          method: 'POST',
          headers: authHeaders(), // multipart/form-data browser auto boundary
          body: formData,
        });

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok || !uploadData.success) {
          throw new Error(uploadData.message || 'Image upload failed');
        }

        // Also update name if changed
        if (name.trim() !== user?.name) {
          const nameRes = await fetch(`${API}/auth/profile`, {
            method: 'PUT',
            headers: { ...authHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: name.trim() }),
          });
          const nameData = await nameRes.json();
          if (nameRes.ok && nameData.success) {
            updateLocalUser(nameData.user);
          }
        } else {
          updateLocalUser(uploadData.user);
        }

        setSelectedFile(null);
        setFilePreview('');
        showToast('Profile picture uploaded successfully!');

      // CASE 2: Image URL source active
      } else if (activeSource === 'url') {
        const trimmedUrl = imageUrl.trim();
        if (!trimmedUrl) {
          throw new Error('Please enter a valid image URL');
        }

        // Basic URL validation
        try {
          new URL(trimmedUrl);
        } catch {
          throw new Error('Invalid URL format. Please provide a full HTTP/HTTPS image URL.');
        }

        const res = await fetch(`${API}/auth/profile`, {
          method: 'PUT',
          headers: { ...authHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            profilePicture: trimmedUrl,
            profileImageSource: 'url',
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || 'Profile update failed');

        updateLocalUser(data.user);
        showToast('Profile picture URL updated successfully!');

      // CASE 3: Only name update or active source is none/existing upload
      } else {
        const res = await fetch(`${API}/auth/profile`, {
          method: 'PUT',
          headers: { ...authHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            profilePicture: activeSource === 'upload' ? user?.profilePicture : (activeSource === 'url' ? imageUrl.trim() : ''),
            profileImageSource: activeSource,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || 'Profile update failed');

        updateLocalUser(data.user);
        showToast('Profile details updated successfully');
      }

    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSavingProfile(false);
      setUploadingImage(false);
    }
  };

  /* Change password flow */
  const handleChangePassword = async () => {
    if (!currentPw || !newPw || !confirmPw) return showToast('All password fields are required', 'error');
    if (newPw !== confirmPw) return showToast('New passwords do not match', 'error');
    if (newPw.length < 6) return showToast('New password must be at least 6 characters', 'error');

    setSavingPw(true);
    try {
      const res = await fetch(`${API}/auth/change-password`, {
        method: 'PUT',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Password change failed');

      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
      showToast('Password updated successfully');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSavingPw(false);
    }
  };

  /* Sign Out handler */
  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('user-profile-updated'));
    navigate('/login');
  };

  const initials = user ? (user.name || 'U').split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase() : '...';
  const currentDisplayAvatar = filePreview || (activeSource === 'url' ? imageUrl : '') || user?.profilePicture;

  const pwSuffix = (show, setShow) => (
    <button
      type="button"
      onClick={() => setShow(s => !s)}
      style={{
        position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
        background: 'none', border: 'none', color: 'rgba(240,240,248,0.3)', cursor: 'pointer', padding: 2,
      }}
    >
      {show ? <EyeOff size={14} /> : <Eye size={14} />}
    </button>
  );

  return (
    <div style={styles.page}>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div style={styles.header}>
        <div>
          <span style={styles.eyebrow}>Account Settings</span>
          <h1 style={styles.title}>User Profile & Identity</h1>
          <p style={styles.subtitle}>Manage your profile picture, personal identity, and security preferences.</p>
        </div>
      </div>

      {loading ? (
        <div style={styles.loadingBox}>
          <RefreshCw size={24} className="spin" color="#6C63FF" style={{ marginBottom: 10 }} />
          <p style={{ margin: 0, fontSize: 13, color: 'rgba(240,240,248,0.45)' }}>Loading user profile…</p>
        </div>
      ) : (
        <div style={styles.content}>

          {/* ── 1. Profile Header Card ── */}
          <div style={styles.card}>
            <div style={styles.headerRow}>
              {/* Avatar Image or Initials */}
              <div style={{ position: 'relative' }}>
                {currentDisplayAvatar ? (
                  <img
                    src={currentDisplayAvatar}
                    alt={user?.name || 'User Avatar'}
                    style={styles.avatarImg}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div style={styles.avatarBadge}>
                    {initials}
                  </div>
                )}
              </div>

              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#F0F0F8' }}>{user?.name}</h2>
                  <span style={styles.roleTag}>{user?.role || 'user'}</span>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: 'rgba(240,240,248,0.45)', fontFamily: 'monospace' }}>{user?.email}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10 }}>
                  <span style={styles.statusPill}>
                    <span style={styles.statusDot} />
                    Active Session
                  </span>
                  <span style={{ fontSize: 12, color: 'rgba(240,240,248,0.3)' }}>•</span>
                  <span style={{ fontSize: 12, color: 'rgba(240,240,248,0.35)' }}>
                    Joined {formatDate(user?.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── 2. Account Statistics ── */}
          <div style={styles.statsGrid}>
            <StatCard
              label="Datasets Uploaded"
              value={user?.stats?.datasets ?? 0}
              icon={Database}
              color="#6C63FF"
              bg="rgba(108,99,255,0.1)"
              border="rgba(108,99,255,0.2)"
            />
            <StatCard
              label="Reports Generated"
              value={user?.stats?.reports ?? 0}
              icon={FileText}
              color="#38BDF8"
              bg="rgba(56,189,248,0.1)"
              border="rgba(56,189,248,0.2)"
            />
            <StatCard
              label="AI Chat Sessions"
              value={user?.stats?.chats ?? 0}
              icon={MessageSquare}
              color="#4ADE80"
              bg="rgba(74,222,128,0.1)"
              border="rgba(74,222,128,0.2)"
            />
            <StatCard
              label="Member Since"
              value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Not provided'}
              icon={Calendar}
              color="#A78BFA"
              bg="rgba(167,139,250,0.1)"
              border="rgba(167,139,250,0.2)"
            />
          </div>

          {/* ── 3. Profile Picture Source Selector & Manager ── */}
          <div style={styles.card}>
            <div style={styles.cardSectionHeader}>
              <div style={styles.iconCircle('#6C63FF')}>
                <ImageIcon size={16} color="#6C63FF" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h3 style={styles.cardTitle}>Profile Picture Options</h3>
                  {activeSource !== 'none' && (
                    <span style={styles.activeSourceBadge}>
                      Active Source: {activeSource === 'upload' ? 'Device Upload' : 'Image URL'}
                    </span>
                  )}
                </div>
                <p style={styles.cardSub}>Select ONE profile picture source: upload from device OR provide a direct image URL.</p>
              </div>
            </div>

            {/* Source Tab Switcher */}
            <div style={styles.tabBar}>
              <button
                type="button"
                onClick={handleSelectUploadSource}
                style={{
                  ...styles.tabBtn,
                  ...(activeSource === 'upload' ? styles.tabBtnActive : {}),
                }}
              >
                <Upload size={14} />
                Option 1: Device Upload
              </button>
              <button
                type="button"
                onClick={handleSelectUrlSource}
                style={{
                  ...styles.tabBtn,
                  ...(activeSource === 'url' ? styles.tabBtnActive : {}),
                }}
              >
                <LinkIcon size={14} />
                Option 2: Direct Image URL
              </button>
            </div>

            {/* SOURCE OPTION 1: Device Upload Dropzone */}
            <div style={{
              display: activeSource === 'upload' ? 'block' : 'none',
              marginTop: 16,
            }}>
              <div style={styles.uploadDropzone}>
                <Upload size={24} color="#6C63FF" style={{ marginBottom: 8 }} />
                <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: '#F0F0F8' }}>
                  Click to select an image from your device
                </p>
                <p style={{ margin: 0, fontSize: 11, color: 'rgba(240,240,248,0.35)' }}>
                  Supports JPG, PNG, WEBP, GIF, SVG (Max 5MB)
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                  onChange={handleFileChange}
                  style={styles.fileInputHidden}
                />

                {selectedFile && (
                  <div style={styles.fileSelectedBox}>
                    <Check size={14} color="#4ADE80" />
                    <span style={{ fontSize: 12, color: '#F0F0F8', fontWeight: 500 }}>
                      Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* SOURCE OPTION 2: Direct Image URL Input */}
            <div style={{
              display: activeSource === 'url' ? 'block' : 'none',
              marginTop: 16,
            }}>
              <Field
                label="Direct Image URL"
                icon={LinkIcon}
                value={imageUrl}
                onChange={handleUrlChange}
                placeholder="https://images.unsplash.com/photo-..."
                hint="Provide a direct HTTP/HTTPS link to an image file."
              />
            </div>

            {/* Actions: Save / Remove */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              {(user?.profilePicture || selectedFile || imageUrl) ? (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  disabled={savingProfile}
                  style={styles.removePhotoBtn}
                >
                  <Trash2 size={14} />
                  Remove Photo
                </button>
              ) : <div />}

              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={savingProfile || uploadingImage}
                style={{
                  ...styles.saveBtn,
                  opacity: (savingProfile || uploadingImage) ? 0.5 : 1,
                  cursor: (savingProfile || uploadingImage) ? 'not-allowed' : 'pointer',
                }}
              >
                {uploadingImage ? <RefreshCw size={15} className="spin" /> : <Save size={15} />}
                {uploadingImage ? 'Uploading Image…' : savingProfile ? 'Saving…' : 'Save Profile Picture'}
              </button>
            </div>
          </div>

          {/* ── 4. Personal Information Form ── */}
          <div style={styles.card}>
            <div style={styles.cardSectionHeader}>
              <div style={styles.iconCircle('#8B83FF')}>
                <User size={16} color="#8B83FF" />
              </div>
              <div>
                <h3 style={styles.cardTitle}>Personal Information</h3>
                <p style={styles.cardSub}>Update your account display name</p>
              </div>
            </div>

            <Field
              label="Full Name"
              icon={User}
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Enter full name"
            />

            <Field
              label="Email Address"
              icon={Mail}
              value={user?.email || ''}
              onChange={() => {}}
              placeholder=""
              disabled
              hint="Email address is managed by system authentication and cannot be changed."
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <button
                onClick={handleSaveProfile}
                disabled={savingProfile || name.trim() === user?.name}
                style={{
                  ...styles.saveBtn,
                  opacity: (savingProfile || name.trim() === user?.name) ? 0.45 : 1,
                  cursor: (savingProfile || name.trim() === user?.name) ? 'not-allowed' : 'pointer',
                }}
              >
                <Save size={15} />
                {savingProfile ? 'Saving Changes…' : 'Save Name'}
              </button>
            </div>
          </div>

          {/* ── 5. Change Password Form ── */}
          <div style={styles.card}>
            <div style={styles.cardSectionHeader}>
              <div style={styles.iconCircle('#A78BFA')}>
                <KeyRound size={16} color="#A78BFA" />
              </div>
              <div>
                <h3 style={styles.cardTitle}>Change Password</h3>
                <p style={styles.cardSub}>Update your authentication password</p>
              </div>
            </div>

            <Field
              label="Current Password"
              icon={Lock}
              type={showCurrent ? 'text' : 'password'}
              value={currentPw}
              onChange={e => setCurrentPw(e.target.value)}
              placeholder="Enter current password"
              suffix={pwSuffix(showCurrent, setShowCurrent)}
            />

            <Field
              label="New Password"
              icon={Shield}
              type={showNew ? 'text' : 'password'}
              value={newPw}
              onChange={e => setNewPw(e.target.value)}
              placeholder="At least 6 characters"
              suffix={pwSuffix(showNew, setShowNew)}
            />

            <Field
              label="Confirm New Password"
              icon={Shield}
              type={showConfirm ? 'text' : 'password'}
              value={confirmPw}
              onChange={e => setConfirmPw(e.target.value)}
              placeholder="Repeat new password"
              suffix={pwSuffix(showConfirm, setShowConfirm)}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <button
                onClick={handleChangePassword}
                disabled={savingPw || !currentPw || !newPw || !confirmPw}
                style={{
                  ...styles.saveBtn,
                  background: 'linear-gradient(135deg, #7C73FF 0%, #4F46E5 100%)',
                  opacity: (savingPw || !currentPw || !newPw || !confirmPw) ? 0.45 : 1,
                  cursor: (savingPw || !currentPw || !newPw || !confirmPw) ? 'not-allowed' : 'pointer',
                }}
              >
                <Lock size={15} />
                {savingPw ? 'Updating Password…' : 'Update Password'}
              </button>
            </div>
          </div>

          {/* ── 6. Session Details & Sign Out ── */}
          <div style={styles.card}>
            <div style={styles.cardSectionHeader}>
              <div style={styles.iconCircle('#F87171')}>
                <Shield size={16} color="#F87171" />
              </div>
              <div>
                <h3 style={styles.cardTitle}>Session & Security</h3>
                <p style={styles.cardSub}>Current authentication session controls</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
              <div style={styles.sessionBox}>
                <span style={styles.sessionLabel}>Account ID</span>
                <span style={{ ...styles.sessionVal, fontFamily: 'monospace' }}>
                  {user?._id ? `…${String(user._id).slice(-8)}` : 'Not provided'}
                </span>
              </div>
              <div style={styles.sessionBox}>
                <span style={styles.sessionLabel}>Role</span>
                <span style={{ ...styles.sessionVal, textTransform: 'capitalize' }}>
                  {user?.role || 'user'}
                </span>
              </div>
              <div style={styles.sessionBox}>
                <span style={styles.sessionLabel}>Session Status</span>
                <span style={{ ...styles.sessionVal, color: '#4ADE80' }}>
                  Authenticated
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 20 }}>
              <button
                onClick={handleSignOut}
                style={styles.signOutBtn}
              >
                <LogOut size={16} />
                Sign Out of MarketMindAI
              </button>
            </div>
          </div>

        </div>
      )}

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

/* ── Helper StatCard Subcomponent ───────────────────────────────────────── */

const StatCard = ({ label, value, icon: Icon, color, bg, border }) => (
  <div style={{
    backgroundColor: '#121218',
    border: `1px solid ${border || 'rgba(255,255,255,0.07)'}`,
    borderRadius: 16,
    padding: '18px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  }}>
    <div style={{
      width: 42, height: 42, borderRadius: 12,
      background: bg, border: `1px solid ${border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <Icon size={19} color={color} />
    </div>
    <div style={{ minWidth: 0 }}>
      <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: 'rgba(240,240,248,0.4)', textTransform: 'uppercase', letterSpacing: '0.6px', fontFamily: 'monospace' }}>
        {label}
      </p>
      <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#F0F0F8', letterSpacing: '-0.3px' }}>
        {value}
      </p>
    </div>
  </div>
);

/* ── Styles ─────────────────────────────────────────────────────────────── */

const styles = {
  page: {
    maxWidth: '840px',
    margin: '0 auto',
    paddingBottom: '64px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  header: {
    marginBottom: '4px',
  },
  eyebrow: {
    display: 'inline-block',
    fontSize: '11px',
    fontWeight: '600',
    letterSpacing: '1.2px',
    textTransform: 'uppercase',
    color: '#6C63FF',
    fontFamily: 'monospace',
    marginBottom: '4px',
  },
  title: {
    fontSize: '26px',
    fontWeight: '800',
    color: '#F0F0F8',
    margin: '0 0 6px',
    letterSpacing: '-0.5px',
  },
  subtitle: {
    fontSize: '14px',
    color: 'rgba(240,240,248,0.45)',
    margin: 0,
  },
  loadingBox: {
    padding: '60px 20px',
    textAlign: 'center',
    backgroundColor: '#121218',
    borderRadius: 20,
    border: '1px solid rgba(255,255,255,0.07)',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  card: {
    backgroundColor: '#121218',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 18,
    padding: '24px',
  },
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 20,
    flexWrap: 'wrap',
  },
  avatarImg: {
    width: 68,
    height: 68,
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid #6C63FF',
    boxShadow: '0 4px 16px rgba(108,99,255,0.35)',
    flexShrink: 0,
  },
  avatarBadge: {
    width: 68,
    height: 68,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #6C63FF, #4F46E5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 24,
    fontWeight: 800,
    color: '#fff',
    boxShadow: '0 4px 16px rgba(108,99,255,0.35)',
    flexShrink: 0,
  },
  roleTag: {
    display: 'inline-block',
    padding: '2px 9px',
    background: 'rgba(108,99,255,0.12)',
    border: '1px solid rgba(108,99,255,0.25)',
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 700,
    color: '#8B83FF',
    textTransform: 'capitalize',
    fontFamily: 'monospace',
  },
  statusPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 12,
    fontWeight: 600,
    color: '#4ADE80',
    fontFamily: 'monospace',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    backgroundColor: '#4ADE80',
    boxShadow: '0 0 6px #4ADE80',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '14px',
  },
  cardSectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  iconCircle: (color) => ({
    width: 34,
    height: 34,
    borderRadius: 10,
    background: `${color}18`,
    border: `1px solid ${color}35`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  }),
  cardTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: '#F0F0F8',
    margin: '0 0 2px',
  },
  cardSub: {
    fontSize: 12,
    color: 'rgba(240,240,248,0.4)',
    margin: 0,
  },
  activeSourceBadge: {
    fontSize: 11,
    fontWeight: 700,
    color: '#34D399',
    background: 'rgba(52,211,153,0.1)',
    border: '1px solid rgba(52,211,153,0.25)',
    borderRadius: 12,
    padding: '3px 10px',
    fontFamily: 'monospace',
  },
  tabBar: {
    display: 'flex',
    gap: 10,
    marginBottom: 8,
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    paddingBottom: 12,
  },
  tabBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 16px',
    borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.03)',
    color: 'rgba(240,240,248,0.5)',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  tabBtnActive: {
    background: 'rgba(108,99,255,0.15)',
    borderColor: 'rgba(108,99,255,0.4)',
    color: '#8B83FF',
    boxShadow: '0 0 12px rgba(108,99,255,0.15)',
  },
  uploadDropzone: {
    border: '2px dashed rgba(108,99,255,0.3)',
    borderRadius: 14,
    padding: '24px 16px',
    textAlign: 'center',
    background: 'rgba(108,99,255,0.03)',
    position: 'relative',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  fileInputHidden: {
    position: 'absolute',
    top: 0, left: 0, width: '100%', height: '100%',
    opacity: 0, cursor: 'pointer',
  },
  fileSelectedBox: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    padding: '6px 12px',
    borderRadius: 8,
    background: 'rgba(52,211,153,0.12)',
    border: '1px solid rgba(52,211,153,0.25)',
  },
  saveBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '11px 22px',
    borderRadius: 11,
    border: 'none',
    background: 'linear-gradient(135deg, #6C63FF 0%, #4F46E5 100%)',
    color: '#fff',
    fontSize: 13,
    fontWeight: 600,
    boxShadow: '0 4px 16px rgba(108,99,255,0.3)',
    transition: 'all 0.15s ease',
  },
  removePhotoBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '9px 16px',
    borderRadius: 10,
    border: '1px solid rgba(248,113,113,0.3)',
    background: 'rgba(248,113,113,0.08)',
    color: '#F87171',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  sessionBox: {
    background: 'rgba(255,255,255,0.025)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: '12px 14px',
  },
  sessionLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: 'rgba(240,240,248,0.35)',
    textTransform: 'uppercase',
    letterSpacing: '0.6px',
    display: 'block',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  sessionVal: {
    fontSize: 13,
    fontWeight: 600,
    color: 'rgba(240,240,248,0.8)',
  },
  signOutBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '11px 20px',
    borderRadius: 11,
    border: '1px solid rgba(248,113,113,0.3)',
    background: 'rgba(248,113,113,0.1)',
    color: '#F87171',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
};

export default Profile;
