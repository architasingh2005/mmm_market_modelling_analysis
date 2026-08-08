import { useState, useEffect } from 'react';

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

function parseStoredUser() {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function buildUserObj(u) {
  if (!u) return { name: 'User', email: '', initials: 'U', profilePicture: '', profileImageSource: 'none' };
  const initials = (u.name || 'U')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return {
    ...u,
    name: u.name || 'User',
    email: u.email || '',
    initials,
    profilePicture: u.profilePicture || '',
    profileImageSource: u.profileImageSource || 'none',
  };
}

export function useCurrentUser() {
  const [user, setUser] = useState(() => buildUserObj(parseStoredUser()));

  useEffect(() => {
    const handleUpdate = () => {
      const stored = parseStoredUser();
      if (stored) {
        setUser(buildUserObj(stored));
      }
    };

    window.addEventListener('user-profile-updated', handleUpdate);

    // Initial sync if missing in cache
    const stored = parseStoredUser();
    const token = localStorage.getItem('token');
    if (!stored && token) {
      fetch(`${API}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.user) {
            localStorage.setItem('user', JSON.stringify(data.user));
            setUser(buildUserObj(data.user));
          }
        })
        .catch(() => {});
    }

    return () => {
      window.removeEventListener('user-profile-updated', handleUpdate);
    };
  }, []);

  return user;
}
