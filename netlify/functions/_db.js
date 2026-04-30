// netlify/functions/_db.js
// Shared Neon database client — imported by every function

import { neon } from '@neondatabase/serverless';

/**
 * Returns a tagged-template SQL executor connected to Neon.
 * Usage:  const sql = getDb();
 *         const rows = await sql`SELECT * FROM students WHERE student_id = ${id}`;
 */
export function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  return neon(process.env.DATABASE_URL);
}

/**
 * Standard CORS + JSON headers for every response.
 */
export const HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

/**
 * Quick helper: return a JSON response.
 */
export function json(body, statusCode = 200) {
  return { statusCode, headers: HEADERS, body: JSON.stringify(body) };
}

/**
 * Quick helper: handle OPTIONS pre-flight.
 */
export function preflight() {
  return { statusCode: 204, headers: HEADERS, body: '' };
}
