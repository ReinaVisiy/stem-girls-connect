import { describe, expect, it } from 'vitest';
import { fetchTotalProgramCount } from '../src/admin/programCount';

function fakeClient(result: { count: number | null; error: unknown } | 'throw') {
  const calls: { table?: string; select?: [string, unknown] } = {};
  const client: any = {
    from: (t: string) => {
      calls.table = t;
      return {
        select: async (cols: string, opts: unknown) => {
          calls.select = [cols, opts];
          if (result === 'throw') throw new Error('network');
          return result;
        },
      };
    },
  };
  return { client, calls };
}

describe('fetchTotalProgramCount', () => {
  it('counts all rows via a head-only exact count on the programs table (drafts included under admin RLS)', async () => {
    const { client, calls } = fakeClient({ count: 7, error: null });
    expect(await fetchTotalProgramCount(client)).toBe(7);
    expect(calls.table).toBe('programs');
    expect(calls.select).toEqual(['id', { count: 'exact', head: true }]);
  });
  it('returns 0 when there are no programs', async () => {
    expect(await fetchTotalProgramCount(fakeClient({ count: 0, error: null }).client)).toBe(0);
  });
  it('returns null on error, null count, or thrown failure (dashboard shows a dash)', async () => {
    expect(await fetchTotalProgramCount(fakeClient({ count: null, error: { message: 'x' } }).client)).toBeNull();
    expect(await fetchTotalProgramCount(fakeClient({ count: null, error: null }).client)).toBeNull();
    expect(await fetchTotalProgramCount(fakeClient('throw').client)).toBeNull();
  });
});
