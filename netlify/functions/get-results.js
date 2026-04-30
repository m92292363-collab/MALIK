// netlify/functions/get-results.js

import { getDb, json, preflight } from './_db.js';

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return preflight();
  if (event.httpMethod !== 'GET') return json({ error: 'Method not allowed' }, 405);

  try {
    const { studentId } = event.queryStringParameters || {};

    if (!studentId) return json({ error: 'studentId query parameter is required' }, 400);

    const sql = getDb();

    const results = await sql`
      SELECT
        r.subject,
        r.score,
        r.grade,
        r.academic_year,
        r.term
      FROM results r
      WHERE r.student_id = ${studentId}
      ORDER BY r.academic_year DESC, r.term, r.subject
    `;

    return json({ success: true, results });
  } catch (err) {
    console.error('get-results error:', err);
    return json({ success: false, error: 'Server error' }, 500);
  }
}
