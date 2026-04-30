// netlify/functions/get-all-students.js

import { getDb, json, preflight } from './_db.js';

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return preflight();
  if (event.httpMethod !== 'GET') return json({ error: 'Method not allowed' }, 405);

  try {
    const sql = getDb();

    const students = await sql`
      SELECT
        student_id,
        full_name,
        grade_level,
        class_name,
        date_of_birth,
        student_phone,
        guardian_name,
        guardian_phone,
        address
      FROM students
      ORDER BY grade_level, class_name, full_name
    `;

    return json({ success: true, students });
  } catch (err) {
    console.error('get-all-students error:', err);
    return json({ success: false, error: 'Server error' }, 500);
  }
}
