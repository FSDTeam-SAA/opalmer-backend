import AppError from '../errors/AppError';
import School from '../models/school.model';
import { District } from '../models/district.model';

export const schoolImportColumns = ['name', 'code', 'districtCode', 'email', 'phone', 'address', 'city', 'state', 'country', 'postalCode', 'establishedYear'];
export const districtImportColumns = ['name', 'code', 'email', 'phone', 'address', 'city', 'state', 'country', 'postalCode'];
export type ImportRow = { row: number; values: Record<string, string>; status: 'ready' | 'error' | 'created'; error?: string };

// Strict RFC-style CSV parsing, including escaped quotes and multiline fields.
export function parseImportCsv(text: string): { row: number; cells: string[] }[] {
  const rows: { row: number; cells: string[] }[] = [];
  let cells: string[] = [], cell = '', quoted = false, closed = false, line = 1, rowLine = 1;
  const source = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < source.length; i++) {
    const c = source[i];
    if (quoted) {
      if (c === '"' && source[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') { quoted = false; closed = true; }
      else { cell += c; if (c === '\n') line++; }
    } else if (c === ',' || c === '\r' || c === '\n') {
      cells.push(cell.trim()); cell = ''; closed = false;
      if (c !== ',') {
        if (cells.some(Boolean)) rows.push({ row: rowLine, cells });
        cells = [];
        if (c === '\r' && source[i + 1] === '\n') i++;
        line++; rowLine = line;
      }
    } else if (c === '"' && !cell && !closed) quoted = true;
    else {
      if (closed || c === '"') throw new AppError(400, `Invalid CSV quoting near line ${line}`);
      cell += c;
    }
  }
  if (quoted) throw new AppError(400, 'Unclosed quote in CSV');
  cells.push(cell.trim());
  if (cells.some(Boolean)) rows.push({ row: rowLine, cells });
  return rows;
}

export function validateImportCsv(csv: unknown, kind: 'schools' | 'districts'): ImportRow[] {
  if (typeof csv !== 'string' || Buffer.byteLength(csv, 'utf8') > 512 * 1024) throw new AppError(400, 'CSV must be 512 KB or smaller');
  const parsed = parseImportCsv(csv);
  const headers = parsed.shift()?.cells ?? [];
  const allowed = kind === 'schools' ? schoolImportColumns : districtImportColumns;
  if (!headers.includes('name') || !headers.includes('code') || (kind === 'schools' && !headers.includes('districtCode')) ||
      new Set(headers).size !== headers.length || headers.some(h => !allowed.includes(h))) {
    throw new AppError(400, `Use the ${kind} CSV template. Name and code${kind === 'schools' ? ' and districtCode' : ''} columns are required.`);
  }
  if (!parsed.length || parsed.length > 500) throw new AppError(400, 'Upload between 1 and 500 records');
  const counts = new Map<string, number>();
  for (const { cells } of parsed) {
    for (const key of ['code', ...(kind === 'schools' ? ['name'] : [])]) {
      const value = cells[headers.indexOf(key)]?.toLowerCase();
      if (value) counts.set(`${key}:${value}`, (counts.get(`${key}:${value}`) ?? 0) + 1);
    }
  }
  return parsed.map(({ row, cells }) => {
    const values = Object.fromEntries(headers.map((h, i) => [h, cells[i] ?? '']));
    const errors: string[] = [];
    if (cells.length !== headers.length) errors.push('Column count does not match header');
    if (!values.name || !values.code) errors.push('Name and code are required');
    if (kind === 'schools' && !values.districtCode) errors.push('District code is required; import the district first');
    if (Object.values(values).some(v => v.length > 500)) errors.push('Fields must be 500 characters or shorter');
    if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) errors.push('Invalid email');
    if (values.establishedYear && (!/^\d{4}$/.test(values.establishedYear) || Number(values.establishedYear) < 1800 || Number(values.establishedYear) > new Date().getUTCFullYear())) errors.push('Invalid establishment year');
    for (const key of ['code', ...(kind === 'schools' ? ['name'] : [])]) {
      if ((counts.get(`${key}:${values[key]?.toLowerCase()}`) ?? 0) > 1) errors.push(`Duplicate ${key} in file`);
    }
    return { row, values, status: errors.length ? 'error' : 'ready', ...(errors.length ? { error: errors.join('; ') } : {}) };
  });
}

const exact = (value: string) => new RegExp(`^${value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');

export async function importSchoolData(csv: unknown, kind: 'schools' | 'districts', commit: boolean) {
  const rows = validateImportCsv(csv, kind);
  for (const row of rows) {
    if (row.status === 'error') continue;
    try {
      const { districtCode, establishedYear, ...strings } = row.values;
      strings.code = strings.code.toUpperCase();
      const payload: Record<string, unknown> = Object.fromEntries(Object.entries(strings).filter(([, value]) => value !== ''));
      if (kind === 'schools') {
        const district = await District.findOne({ code: exact(districtCode) });
        if (!district) throw new Error('Unknown district code; import the district first');
        payload.districtId = district._id;
        if (establishedYear) payload.establishedYear = Number(establishedYear);
        if (await School.exists({ $or: [{ name: exact(strings.name) }, { code: exact(strings.code) }] })) throw new Error('School name or code already exists; existing records are never overwritten');
        if (commit) await School.create(payload);
      } else {
        if (await District.exists({ code: exact(strings.code) })) throw new Error('District code already exists; existing records are never overwritten');
        if (commit) await District.create(payload);
      }
      if (commit) row.status = 'created';
    } catch (error: any) {
      row.status = 'error';
      row.error = error?.code === 11000 ? 'Record already exists; existing records are never overwritten' :
        error?.name === 'MongoServerError' || error?.name === 'MongooseError' ? 'Unable to save record; retry or contact support' : error.message;
    }
  }
  return { kind, committed: commit, rows, total: rows.length,
    ready: rows.filter(r => r.status === 'ready').length,
    created: rows.filter(r => r.status === 'created').length,
    failed: rows.filter(r => r.status === 'error').length };
}
