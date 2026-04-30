import { getDb, json, preflight } from './_db.js';

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return preflight();
  if (event.httpMethod !== 'POST') return json({ error: 'Method not allowed' }, 405);
  try {
    const { adminId, password } = JSON.parse(event.body || '{}');
    if (!adminId || !password) {
      return json({ error: 'Admin ID and password are required' }, 400);
    }
    const sql = getDb();
    const rows = await sql`
      SELECT id FROM admins
      WHERE username = ${adminId}
      AND password = ${password}
      LIMIT 1
    `;
    if (rows.length === 0) {
      return json({ success: false, error: 'Incorrect Admin ID or password' }, 401);
    }
    return json({ success: true });
  } catch (err) {
    console.error('admin-login error:', err);
    return json({ success: false, error: 'Server error' }, 500);
  }
}
