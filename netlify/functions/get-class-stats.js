// netlify/functions/get-class-stats.js
//
// Returns rank, class total and pass count for a student in a given term.
// Called by the report card overlay in index.html.
//
// Query params:
//   gradeLevel   – e.g. "10"
//   className    – e.g. "A"
//   term         – e.g. "Term 1"
//   academicYear – e.g. "2025-2026"
//   studentId    – e.g. "IM001"

import { getDb, json, preflight } from './_db.js';

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return preflight();
  if (event.httpMethod !== 'GET') return json({ error: 'Method not allowed' }, 405);

  try {
    const {
      gradeLevel,
      className,
      term,
      academicYear,
      studentId,
    } = event.queryStringParameters || {};

    // All params are required
    if (!gradeLevel || !className || !term || !academicYear || !studentId) {
      return json(
        { error: 'gradeLevel, className, term, academicYear and studentId are all required' },
        400,
      );
    }

    const sql = getDb();

    // ── 1. Get every student in this grade+class that has at least one result
    //       for this term/year, together with their total score. ──────────────
    const classRows = await sql`
      SELECT
        r.student_id,
        SUM(r.score) AS total_score
      FROM results r
      JOIN students s ON s.student_id = r.student_id
      WHERE s.grade_level  = ${parseInt(gradeLevel)}
        AND s.class_name   = ${className}
        AND r.term         = ${term}
        AND r.academic_year = ${academicYear}
      GROUP BY r.student_id
      ORDER BY total_score DESC
    `;

    // Total number of students who sat the exam in this class
    const classTotal = classRows.length;

    if (classTotal === 0) {
      // No results recorded for this class yet
      return json({ success: true, rank: '---', classTotal: 0, passTotal: 0 });
    }

    // ── 2. Work out the requesting student's total score ──────────────────────
    const studentRow = classRows.find(r => r.student_id === studentId);

    if (!studentRow) {
      // Student exists but has no results for this term (shouldn't normally happen
      // if the frontend only shows the card when results exist, but handle gracefully)
      return json({ success: true, rank: '---', classTotal, passTotal: 0 });
    }

    const studentTotal = Number(studentRow.total_score);

    // ── 3. Calculate rank (1-based; ties share the same rank) ─────────────────
    // Count how many students scored strictly higher than this student
    const higherCount = classRows.filter(
      r => Number(r.total_score) > studentTotal,
    ).length;
    const rank = higherCount + 1;

    // ── 4. Pass count — students whose average score is ≥ 50 ─────────────────
    // Per-subject pass mark is 50/100, so we check whether total ≥ subjects * 50.
    // We need to know how many subjects were sat to do this properly.
    const subjectCountRows = await sql`
      SELECT COUNT(*) AS subject_count
      FROM results r
      JOIN students s ON s.student_id = r.student_id
      WHERE s.grade_level   = ${parseInt(gradeLevel)}
        AND s.class_name    = ${className}
        AND r.term          = ${term}
        AND r.academic_year = ${academicYear}
        AND r.student_id    = ${studentId}
    `;

    const subjectCount = Number(subjectCountRows[0]?.subject_count || 0);
    const passThreshold = subjectCount * 50; // 50% of total possible marks

    const passTotal = classRows.filter(
      r => Number(r.total_score) >= passThreshold,
    ).length;

    return json({
      success: true,
      rank:       `${rank} / ${classTotal}`,
      classTotal,
      passTotal,
    });

  } catch (err) {
    console.error('get-class-stats error:', err);
    return json({ success: false, error: 'Server error' }, 500);
  }
}
