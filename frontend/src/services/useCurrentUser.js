/**
 * useCurrentUser.js
 *
 * Shared hook that returns the logged-in user's info (name, email, initials).
 *
 * Strategy:
 *  1. Read synchronously from localStorage 'user' key (fast, no flicker).
 *  2. If the token exists but 'user' key is missing (e.g. logged in before
 *     this fix was deployed), fetch /api/auth/profile in the background
 *     and persist the result to localStorage for future renders.
 */

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
  if (!u) return { name: 'User', email: '', initials: 'U' };
  const initials = (u.name || 'U')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return { name: u.name || 'User', email: u.email || '', initials };
}

export function useCurrentUser() {
  const [user, setUser] = useState(() => buildUserObj(parseStoredUser()));

  useEffect(() => {
    // If already have a user in localStorage, nothing more to do
    if (parseStoredUser()) return;

    // Token exists but no cached user — fetch profile from API
    const token = localStorage.getItem('token');
    if (!token) return;

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
      .catch(() => {/* silently ignore */});
  }, []);

  return user;
}
