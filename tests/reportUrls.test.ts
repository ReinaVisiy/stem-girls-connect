import { describe, expect, it } from 'vitest';
import { buildReportUrls, makeDownloadName, resolveDownloadName, toPublicReport } from '../src/lib/reportUrls';

const SUPA = 'https://abc.supabase.co';

describe('makeDownloadName', () => {
  it('slugifies titles into readable PDF names', () => {
    expect(makeDownloadName('My Report: 2026!')).toBe('My-Report-2026.pdf');
    expect(makeDownloadName('  STEM Career Guidance Outreach in Bamenda ')).toBe('STEM-Career-Guidance-Outreach-in-Bamenda.pdf');
  });
  it('falls back for titles with no usable characters', () => {
    expect(makeDownloadName('???')).toBe('Report.pdf');
    expect(makeDownloadName('')).toBe('Report.pdf');
  });
});

describe('resolveDownloadName', () => {
  const existing = { title: 'Old Title', download_name: 'Old-Title.pdf' };
  it('regenerates when the title changes without a new PDF (the reported bug)', () => {
    expect(resolveDownloadName(existing, 'New Title', false)).toBe('New-Title.pdf');
  });
  it('regenerates when the PDF is replaced', () => {
    expect(resolveDownloadName(existing, 'Old Title', true)).toBe('Old-Title.pdf');
    expect(resolveDownloadName({ title: 'A', download_name: 'custom.pdf' }, 'A', true)).toBe('A.pdf');
  });
  it('keeps the stored name when nothing relevant changed (including custom names)', () => {
    expect(resolveDownloadName({ title: 'A', download_name: 'custom.pdf' }, 'A', false)).toBe('custom.pdf');
    expect(resolveDownloadName(existing, '  Old Title  ', false)).toBe('Old-Title.pdf');
  });
  it('fills in a name for legacy rows that have none', () => {
    expect(resolveDownloadName({ title: 'Legacy', download_name: null }, 'Legacy', false)).toBe('Legacy.pdf');
  });
});

describe('buildReportUrls / toPublicReport', () => {
  it('builds view and download URLs from file_path with readable filename', () => {
    const u = buildReportUrls(SUPA, { file_path: 'reports/x y.pdf', download_name: 'A-B.pdf' });
    expect(u).toEqual({
      view_url: `${SUPA}/storage/v1/object/public/site-assets/reports/x%20y.pdf`,
      download_url: `${SUPA}/storage/v1/object/public/site-assets/reports/x%20y.pdf?download=A-B.pdf`,
    });
  });
  it('supports legacy rows that only have file_url', () => {
    const u = buildReportUrls(SUPA, { file_url: 'https://cdn/x.pdf', title: 'Legacy Report' });
    expect(u?.view_url).toBe('https://cdn/x.pdf');
    expect(u?.download_url).toBe('https://cdn/x.pdf?download=Legacy-Report.pdf');
  });
  it('returns null when there is no file at all, and toPublicReport drops storage internals', () => {
    expect(buildReportUrls(SUPA, { title: 'x' })).toBeNull();
    const pub = toPublicReport(SUPA, {
      id: 1, title: 'T', description: null, start_date: null, end_date: null, display_order: 1,
      file_path: 'reports/a.pdf', download_name: 'T.pdf', file_url: 'https://old',
    });
    expect(pub).not.toHaveProperty('file_path');
    expect(pub).not.toHaveProperty('file_url');
    expect(pub).not.toHaveProperty('download_name');
    expect(pub?.download_url).toContain('?download=T.pdf');
  });
});
