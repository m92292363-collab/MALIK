import { getDb, json, preflight, HEADERS } from './_db.js';

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return preflight();
  const secret = event.queryStringParameters?.secret;
  if (secret !== process.env.INIT_SECRET && secret !== 'imam-malick-init') {
    return json({ error: 'Forbidden' }, 403);
  }
  try {
    const sql = getDb();
    await sql`
      CREATE TABLE IF NOT EXISTS students (
        id             SERIAL PRIMARY KEY,
        student_id     TEXT UNIQUE NOT NULL,
        full_name      TEXT NOT NULL,
        password_hash  TEXT NOT NULL,
        grade_level    INTEGER,
        class_name     TEXT,
        date_of_birth  DATE,
        gender         TEXT CHECK (gender IN ('Male', 'Female')),
        student_phone  TEXT,
        guardian_name  TEXT,
        guardian_phone TEXT,
        address        TEXT,
        profile_photo  TEXT,
        created_at     TIMESTAMPTZ DEFAULT NOW()
      )
    `;
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
    await sql`
      CREATE TABLE IF NOT EXISTS admins (
        id         SERIAL PRIMARY KEY,
        username   TEXT UNIQUE NOT NULL,
        password   TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    await sql`
      INSERT INTO admins (username, password)
      VALUES ('admin', 'admin123')
      ON CONFLICT (username) DO NOTHING
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_results_student_id ON results(student_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_results_grade_class ON results(student_id, academic_year, term)`;
    return json({ success: true, message: 'Database ready!' });
  } catch (err) {
    console.error('init-db error:', err);
    return json({ success: false, error: err.message }, 500);
  }
}
