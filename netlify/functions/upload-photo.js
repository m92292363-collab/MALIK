// netlify/functions/upload-photo.js
// Stores the profile photo as a base64 data-URL directly in Postgres.
// (Works well for compressed circular thumbnails ~20-40 KB each.)

import { getDb, json, preflight } from './_db.js';

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return preflight();
  if (event.httpMethod !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const { studentId, photoDataUrl } = JSON.parse(event.body || '{}');

    if (!studentId || !photoDataUrl) {
      return json({ error: 'studentId and photoDataUrl are required' }, 400);
    }

    // Basic sanity check — must be a JPEG or PNG data URL
    if (!photoDataUrl.startsWith('data:image/')) {
      return json({ error: 'Invalid image format' }, 400);
    }

    // Rough size guard: base64 of 500 KB original ≈ 680 KB string
   if (photoDataUrl.length > 500_000) {
      return json({ error: 'Image is too large. Please use a smaller photo.' }, 400);
    }

    const sql = getDb();

    const result = await sql`
      UPDATE students
      SET profile_photo = ${photoDataUrl}
      WHERE student_id = ${studentId}
      RETURNING student_id
    `;

    if (result.length === 0) {
      return json({ success: false, error: 'Student not found' }, 404);
    }

    return json({ success: true, message: 'Photo saved successfully' });
  } catch (err) {
    console.error('upload-photo error:', err);
    return json({ success: false, error: 'Server error' }, 500);
  }
}
