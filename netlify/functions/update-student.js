import { getDb, json, preflight } from './_db.js';

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return preflight();
  if (event.httpMethod !== 'PUT') return json({ error: 'Method not allowed' }, 405);
  try {
    const { studentId, fullName, gradeLevel, className, gender } = JSON.parse(event.body || '{}');
    if (!studentId) return json({ error: 'Student ID is required' }, 400);
    const sql = getDb();
    if (fullName) await sql`UPDATE students SET full_name = ${fullName} WHERE student_id = ${studentId}`;
    if (gradeLevel) await sql`UPDATE students SET grade_level = ${gradeLevel} WHERE student_id = ${studentId}`;
    if (className) await sql`UPDATE students SET class_name = ${className} WHERE student_id = ${studentId}`;
    if (gender) await sql`UPDATE students SET gender = ${gender} WHERE student_id = ${studentId}`;
    const check = await sql`SELECT student_id FROM students WHERE student_id = ${studentId}`;
    if (check.length === 0) return json({ success: false, error: 'Student not found' }, 404);
    return json({ success: true, message: 'Student updated successfully' });
  } catch (err) {
    console.error('update-student error:', err);
    return json({ success: false, error: 'Server error' }, 500);
  }
}
