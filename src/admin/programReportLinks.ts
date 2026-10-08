import type { SupabaseClient } from '@supabase/supabase-js';

export interface ReportLinkInput {
  reportId: number;
  editionLabel: string;
}

/**
 * Brings a program's `program_reports` rows in line with the editor.
 *
 * Order matters: links are upserted FIRST and dropped links are removed
 * SECOND. If the upsert fails nothing has been deleted yet, so a failure
 * never leaves a program with fewer links than it started with.
 *
 * Every Supabase error is thrown (never swallowed) so callers can show an
 * accurate message instead of reporting a successful save.
 */
export async function syncProgramReportLinks(
  client: Pick<SupabaseClient, 'from'>,
  programId: number,
  links: ReportLinkInput[],
  originalLinkIds: number[],
): Promise<void> {
  const keepIds = links.map((l) => l.reportId);
  const toRemove = originalLinkIds.filter((rid) => !keepIds.includes(rid));

  if (links.length > 0) {
    const { error } = await client.from('program_reports').upsert(
      links.map((l, i) => ({
        program_id: programId,
        report_id: l.reportId,
        edition_label: l.editionLabel.trim() || null,
        display_order: i + 1,
      })),
      { onConflict: 'program_id,report_id' },
    );
    if (error) throw error;
  }

  if (toRemove.length > 0) {
    const { error } = await client.from('program_reports').delete().eq('program_id', programId).in('report_id', toRemove);
    if (error) throw error;
  }
}

/** Plain-text message from whatever a failed Supabase call threw. */
export function describeLinkError(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err && typeof (err as { message: unknown }).message === 'string') {
    return (err as { message: string }).message;
  }
  return 'Unknown error';
}
