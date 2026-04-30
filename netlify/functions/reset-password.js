// netlify/functions/reset-password.js

import { getDb, json, preflight } from './_db.js';

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return preflight();
  if (event.httpMethod !== 'PUT') return json({ error: 'Method not allowed' }, 405);

  try {
    const { studentId, newPassword } = JSON.parse(event.body || '{}');

    if (!studentId || !newPassword) {
      return json({ error: 'Student ID and new password are required' }, 400);
    }

    const sql = getDb();

    const result = await sql`
      UPDATE students
      SET password_hash = ${newPassword}
      WHERE student_id = ${studentId}
      RETURNING student_id
    `;

    if (result.length === 0) {
      return json({ success: false, error: 'Student not found' }, 404);
    }

    return json({ success: true, message: `Password reset for ${studentId}` });
  } catch (err) {
    console.error('reset-password error:', err);
    return json({ success: false, error: 'Server error' }, 500);
  }
}
