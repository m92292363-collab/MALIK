// netlify/functions/delete-student.js

import { getDb, json, preflight } from './_db.js';

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return preflight();
  if (event.httpMethod !== 'DELETE') return json({ error: 'Method not allowed' }, 405);

  try {
    const { studentId } = JSON.parse(event.body || '{}');

    if (!studentId) return json({ error: 'Student ID is required' }, 400);

    const sql = getDb();

    // The results table has ON DELETE CASCADE so results are auto-deleted too
    const result = await sql`
      DELETE FROM students WHERE student_id = ${studentId} RETURNING student_id
    `;

    if (result.length === 0) {
      return json({ success: false, error: 'Student not found' }, 404);
    }

    return json({ success: true, message: `Student ${studentId} and all their results deleted` });
  } catch (err) {
    console.error('delete-student error:', err);
    return json({ success: false, error: 'Server error' }, 500);
  }
}
