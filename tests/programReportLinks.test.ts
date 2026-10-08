import { describe, expect, it } from 'vitest';
import { describeLinkError, syncProgramReportLinks } from '../src/admin/programReportLinks';

type Op = { op: 'upsert' | 'delete'; payload?: unknown; opts?: unknown; filters?: unknown[] };

function fakeClient(failOn?: 'upsert' | 'delete') {
  const ops: Op[] = [];
  const client: any = {
    from: (table: string) => {
      expect(table).toBe('program_reports');
      return {
        upsert: async (payload: unknown, opts: unknown) => {
          ops.push({ op: 'upsert', payload, opts });
          return { error: failOn === 'upsert' ? { message: 'upsert denied' } : null };
        },
        delete: () => {
          const filters: unknown[] = [];
          const op: Op = { op: 'delete', filters };
          ops.push(op);
          const chain: any = {
            eq: (...a: unknown[]) => { filters.push(['eq', ...a]); return chain; },
            in: async (...a: unknown[]) => { filters.push(['in', ...a]); return { error: failOn === 'delete' ? { message: 'delete denied' } : null }; },
          };
          return chain;
        },
      };
    },
  };
  return { client, ops };
}

describe('syncProgramReportLinks', () => {
  it('upserts all links with order and trimmed labels, then removes dropped ones — in that order', async () => {
    const { client, ops } = fakeClient();
    await syncProgramReportLinks(
      client, 9,
      [{ reportId: 3, editionLabel: ' 2025 edition ' }, { reportId: 5, editionLabel: '' }],
      [3, 4],
    );
    expect(ops.map((o) => o.op)).toEqual(['upsert', 'delete']);
    expect(ops[0].payload).toEqual([
      { program_id: 9, report_id: 3, edition_label: '2025 edition', display_order: 1 },
      { program_id: 9, report_id: 5, edition_label: null, display_order: 2 },
    ]);
    expect(ops[0].opts).toEqual({ onConflict: 'program_id,report_id' });
    expect(ops[1].filters).toEqual([['eq', 'program_id', 9], ['in', 'report_id', [4]]]);
  });

  it('skips the upsert when no links remain and only deletes', async () => {
    const { client, ops } = fakeClient();
    await syncProgramReportLinks(client, 1, [], [7, 8]);
    expect(ops.map((o) => o.op)).toEqual(['delete']);
  });

  it('does nothing when there is nothing to change', async () => {
    const { client, ops } = fakeClient();
    await syncProgramReportLinks(client, 1, [], []);
    expect(ops).toHaveLength(0);
  });

  it('a failed upsert throws and NOTHING is deleted (no link loss)', async () => {
    const { client, ops } = fakeClient('upsert');
    await expect(syncProgramReportLinks(client, 1, [{ reportId: 2, editionLabel: '' }], [2, 3])).rejects.toMatchObject({ message: 'upsert denied' });
    expect(ops.map((o) => o.op)).toEqual(['upsert']);
  });

  it('a failed delete throws instead of reporting success', async () => {
    const { client } = fakeClient('delete');
    await expect(syncProgramReportLinks(client, 1, [{ reportId: 2, editionLabel: '' }], [2, 3])).rejects.toMatchObject({ message: 'delete denied' });
  });
});

describe('describeLinkError', () => {
  it('extracts messages from Error-like objects and falls back safely', () => {
    expect(describeLinkError(new Error('boom'))).toBe('boom');
    expect(describeLinkError({ message: 'rls' })).toBe('rls');
    expect(describeLinkError(null)).toBe('Unknown error');
    expect(describeLinkError('str')).toBe('Unknown error');
  });
});
