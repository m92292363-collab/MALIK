// netlify/functions/delete-results.js

import { getDb, json, preflight } from './_db.js';

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return preflight();
  if (event.httpMethod !== 'DELETE') return json({ error: 'Method not allowed' }, 405);

  try {
    const { studentId, subject, academicYear, term } = JSON.parse(event.body || '{}');

    if (!studentId) return json({ error: 'Student ID is required' }, 400);

    const sql = getDb();

    let deleted;

    if (subject && academicYear && term) {
      // Delete a specific subject result
      deleted = await sql`
        DELETE FROM results
        WHERE student_id = ${studentId}
          AND subject = ${subject}
          AND academic_year = ${academicYear}
          AND term = ${term}
        RETURNING id
      `;
    } else {
      // Delete ALL results for this student
      deleted = await sql`
        DELETE FROM results WHERE student_id = ${studentId} RETURNING id
      `;
    }

    return json({
      success: true,
      message: `${deleted.length} result(s) deleted for student ${studentId}`,
    });
  } catch (err) {
    console.error('delete-results error:', err);
    return json({ success: false, error: 'Server error' }, 500);
  }
}
