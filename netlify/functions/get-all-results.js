// netlify/functions/get-all-results.js

import { getDb, json, preflight } from './_db.js';

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return preflight();
  if (event.httpMethod !== 'GET') return json({ error: 'Method not allowed' }, 405);

  try {
    const { academicYear, term, gradeLevel, className } = event.queryStringParameters || {};

    const sql = getDb();

    // Build dynamic WHERE conditions
    const conditions = [];
    if (academicYear) conditions.push(`r.academic_year = '${academicYear.replace(/'/g, "''")}'`);
    if (term) conditions.push(`r.term = '${term.replace(/'/g, "''")}'`);
    if (gradeLevel) conditions.push(`s.grade_level = ${parseInt(gradeLevel)}`);
    if (className) conditions.push(`s.class_name = '${className.replace(/'/g, "''")}'`);

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    // Use raw query for dynamic WHERE (safe — values are sanitised above)
    const results = await sql.unsafe(`
      SELECT
        r.student_id,
        s.full_name,
        s.grade_level,
        s.class_name,
        r.subject,
        r.score,
        r.grade,
        r.term,
        r.academic_year
      FROM results r
      JOIN students s ON s.student_id = r.student_id
      ${whereClause}
      ORDER BY s.grade_level, s.class_name, s.full_name, r.term, r.subject
    `);

    return json({ success: true, results });
  } catch (err) {
    console.error('get-all-results error:', err);
    return json({ success: false, error: 'Server error' }, 500);
  }
}
