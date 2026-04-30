// netlify/functions/add-marks.js

import { getDb, json, preflight } from './_db.js';

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return preflight();
  if (event.httpMethod !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const { studentId, subject, score, grade, academicYear, term } = JSON.parse(event.body || '{}');

    if (!studentId || !subject || score === undefined || !grade || !academicYear || !term) {
      return json({ error: 'All fields are required' }, 400);
    }

    if (score < 0 || score > 100) {
      return json({ error: 'Score must be between 0 and 100' }, 400);
    }

    const sql = getDb();

    // Upsert: update score/grade if the record already exists for same student/subject/year/term
    await sql`
      INSERT INTO results (student_id, subject, score, grade, academic_year, term)
      VALUES (${studentId}, ${subject}, ${score}, ${grade}, ${academicYear}, ${term})
      ON CONFLICT (student_id, subject, academic_year, term)
      DO UPDATE SET
        score = EXCLUDED.score,
        grade = EXCLUDED.grade
    `;

    return json({ success: true, message: 'Result saved successfully' });
  } catch (err) {
    console.error('add-marks error:', err);
    if (err.code === '23503') {
      return json({ success: false, error: 'Student ID does not exist' }, 404);
    }
    return json({ success: false, error: 'Server error' }, 500);
  }
}
