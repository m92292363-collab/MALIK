// netlify/functions/admin-login.js

import { json, preflight } from './_db.js';

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return preflight();
  if (event.httpMethod !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const { adminId, password } = JSON.parse(event.body || '{}');

    if (!adminId || !password) {
      return json({ error: 'Admin ID and password are required' }, 400);
    }

    const expectedId = process.env.ADMIN_ID || 'admin';
    const expectedPw = process.env.ADMIN_PASSWORD || '';

    if (!expectedPw) {
      return json({ error: 'Admin password is not configured on the server' }, 500);
    }

    if (adminId === expectedId && password === expectedPw) {
      return json({ success: true });
    }

    return json({ success: false, error: 'Incorrect Admin ID or password' }, 401);
  } catch (err) {
    console.error('admin-login error:', err);
    return json({ success: false, error: 'Server error' }, 500);
  }
}
