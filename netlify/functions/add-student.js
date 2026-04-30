import { getDb, json, preflight } from './_db.js';

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return preflight();
  if (event.httpMethod !== 'POST') return json({ error: 'Method not allowed' }, 405);
  try {
    const {
      studentId, fullName, password, gradeLevel, className,
      dateOfBirth, gender, studentPhone, guardianName, guardianPhone, address,
    } = JSON.parse(event.body || '{}');
    if (!studentId || !fullName || !password) {
      return json({ error: 'Student ID, full name and password are required' }, 400);
    }
    const sql = getDb();
    await sql`
      INSERT INTO students (
        student_id, full_name, password_hash, grade_level, class_name,
        date_of_birth, gender, student_phone, guardian_name, guardian_phone, address
      ) VALUES (
        ${studentId}, ${fullName}, ${password},
        ${gradeLevel || null}, ${className || null},
        ${dateOfBirth || null}, ${gender || null},
        ${studentPhone || null}, ${guardianName || null},
        ${guardianPhone || null}, ${address || null}
      )
    `;
    return json({ success: true, message: `Student ${fullName} added successfully` });
  } catch (err) {
    console.error('add-student error:', err);
    if (err.message?.includes('unique') || err.code === '23505') {
      return json({ success: false, error: 'A student with this ID already exists' }, 409);
    }
    return json({ success: false, error: 'Server error' }, 500);
  }
}
