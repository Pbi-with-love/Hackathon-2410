import jwt from 'jsonwebtoken';
import type { QueryResult } from 'pg';

export const TEST_JWT_SECRET = 'test-secret';

export function makeToken(userId: string, userType: 'participant' | 'mentor' = 'participant'): string {
  return jwt.sign({ userId, userType }, TEST_JWT_SECRET, { expiresIn: '15m' });
}

export function authHeader(userId: string, userType: 'participant' | 'mentor' = 'participant'): string {
  return `Bearer ${makeToken(userId, userType)}`;
}

/** Build a mock pg QueryResult from an array of row objects. */
export function dbResult(rows: Record<string, unknown>[]): QueryResult {
  return { rows, rowCount: rows.length, command: 'SELECT', oid: 0, fields: [] };
}

/** Empty result (0 rows). */
export const emptyResult: QueryResult = { rows: [], rowCount: 0, command: 'SELECT', oid: 0, fields: [] };
