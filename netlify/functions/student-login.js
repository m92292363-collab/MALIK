import { getDb, json, preflight } from './_db.js';

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return preflight();
  if (event.httpMethod !== 'POST') return json({ error: 'Method not allowed' }, 405);
  try {
    const { studentId, password } = JSON.parse(event.body || '{}');
    if (!studentId || !password) {
      return json({ error: 'Student ID and password are required' }, 400);
    }
    const sql = getDb();
    const rows = await sql`
      SELECT
        student_id, full_name, password_hash, grade_level, class_name,
        date_of_birth, gender, student_phone, guardian_name, guardian_phone,
        address, profile_photo
      FROM students
      WHERE student_id = ${studentId}
      LIMIT 1
    `;
    if (rows.length === 0) {
      return json({ success: false, error: 'Student ID not found' }, 401);
    }
    const student = rows[0];
    if (student.password_hash !== password) {
      return json({ success: false, error: 'Incorrect password' }, 401);
    }
    delete student.password_hash;
    return json({ success: true, student });
  } catch (err) {
    console.error('student-login error:', err);
    return json({ success: false, error: 'Server error' }, 500);
  }
}
