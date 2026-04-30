// netlify/functions/init-db.js
// ONE-TIME setup: visit /.netlify/functions/init-db (or /api/init-db)
// to create all tables in your Neon database.
// After running once you don't need to call it again (it's safe to re-run — idempotent).

import { getDb, json, preflight, HEADERS } from './_db.js';

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return preflight();

  // Simple secret guard so random visitors can't call this
  const secret = event.queryStringParameters?.secret;
  if (secret !== process.env.INIT_SECRET && secret !== 'imam-malick-init') {
    return json({ error: 'Forbidden — pass ?secret=imam-malick-init' }, 403);
  }

  try {
    const sql = getDb();

    // ── Students table ──────────────────────────────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS students (
        id              SERIAL PRIMARY KEY,
        student_id      TEXT UNIQUE NOT NULL,
        full_name       TEXT NOT NULL,
        password_hash   TEXT NOT NULL,
        grade_level     INTEGER,
        class_name      TEXT,
        date_of_birth   DATE,
        student_phone   TEXT,
        guardian_name   TEXT,
        guardian_phone  TEXT,
        address         TEXT,
        profile_photo   TEXT,
        created_at      TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    // ── Results table ───────────────────────────────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS results (
        id            SERIAL PRIMARY KEY,
        student_id    TEXT NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
        subject       TEXT NOT NULL,
        score         INTEGER CHECK (score >= 0 AND score <= 100),
        grade         TEXT,
        academic_year TEXT NOT NULL,
        term          TEXT NOT NULL,
        created_at    TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE (student_id, subject, academic_year, term)
      )
    `;

    // ── Index for fast per-student lookups ──────────────────────────────────
    await sql`
      CREATE INDEX IF NOT EXISTS idx_results_student_id ON results(student_id)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_results_grade_class ON results(student_id, academic_year, term)
    `;

    return json({
      success: true,
      message: 'Database tables created (or already existed). You are ready to go!',
    });
  } catch (err) {
    console.error('init-db error:', err);
    return json({ success: false, error: err.message }, 500);
  }
}
