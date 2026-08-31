import React, { useEffect, useState } from 'react';
import { Trash2, Plus } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { AdminPageHeader, AdminCard, AdminButton, AdminInput, AdminLabel, AdminBanner } from './AdminUI';

interface Stat {
  id: number;
  stat_key: string;
  value: string;
  label: string;
  sub_stat: string | null;
  display_order: number;
}

function slugify(label: string) {
  return label
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '_');
}

const AdminStats: React.FC = () => {
  const [stats, setStats] = useState<Stat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [value, setValue] = useState('');
  const [label, setLabel] = useState('');
  const [subStat, setSubStat] = useState('');
  const [saving, setSaving] = useState(false);

  // Edits in progress for existing rows, keyed by stat id
  const [edits, setEdits] = useState<Record<number, Partial<Stat>>>({});
  const [savingId, setSavingId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase.from('site_stats').select('*').order('display_order');
    if (err) setError(err.message);
    else setStats(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || !label.trim()) return;
    setSaving(true);
    setError(null);

    try {
      const nextOrder = stats.length > 0 ? Math.max(...stats.map((s) => s.display_order)) + 1 : 1;
      const { error: err } = await supabase.from('site_stats').insert({
        stat_key: slugify(label) || `stat_${Date.now()}`,
        value: value.trim(),
        label: label.trim(),
        sub_stat: subStat.trim() || null,
        display_order: nextOrder,
      });
      if (err) throw err;

      setValue('');
      setLabel('');
      setSubStat('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Remove this stat?')) return;
    const { error: err } = await supabase.from('site_stats').delete().eq('id', id);
    if (err) setError(err.message);
    else setStats((s) => s.filter((x) => x.id !== id));
  };

  const setEdit = (id: number, patch: Partial<Stat>) => {
    setEdits((e) => ({ ...e, [id]: { ...e[id], ...patch } }));
  };

  const hasEdit = (id: number) => Boolean(edits[id]);

  const handleSaveEdit = async (stat: Stat) => {
    const patch = edits[stat.id];
    if (!patch) return;
    setSavingId(stat.id);
    setError(null);
    try {
      const { error: err } = await supabase.from('site_stats').update(patch).eq('id', stat.id);
      if (err) throw err;
      setEdits((e) => {
        const next = { ...e };
        delete next[stat.id];
        return next;
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSavingId(null);
    }
  };

  const moveOrder = async (id: number, direction: -1 | 1) => {
    const idx = stats.findIndex((s) => s.id === id);
    const swapIdx = idx + direction;
    if (idx < 0 || swapIdx < 0 || swapIdx >= stats.length) return;

    const a = stats[idx];
    const b = stats[swapIdx];
    const { error: err } = await supabase.from('site_stats').upsert([
      { id: a.id, display_order: b.display_order },
      { id: b.id, display_order: a.display_order },
    ]);
    if (err) setError(err.message);
    else await load();
  };

  return (
    <div>
      <AdminPageHeader
        title="Stats"
        description="Numbers shown in 'Our Impact So Far' on the homepage and 'By the Numbers' on the Impact page. Use a trailing + for open-ended figures, e.g. 400+."
      />
      {error && <AdminBanner type="error">{error}</AdminBanner>}

      <AdminCard className="mb-8">
        <h2 className="text-sm font-extrabold text-brandGreen uppercase tracking-widest mb-6">Add a Stat</h2>
        <form onSubmit={handleAdd} className="grid md:grid-cols-3 gap-6">
          <div>
            <AdminLabel>Value</AdminLabel>
            <AdminInput value={value} onChange={(e) => setValue(e.target.value)} placeholder="e.g. 400+" required />
          </div>
          <div>
            <AdminLabel>Label</AdminLabel>
            <AdminInput value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Girls Reached" required />
          </div>
          <div>
            <AdminLabel>Sub-label (optional)</AdminLabel>
            <AdminInput value={subStat} onChange={(e) => setSubStat(e.target.value)} placeholder="e.g. Across 12 schools" />
          </div>
          <div className="md:col-span-3">
            <AdminButton type="submit" disabled={saving}>
              <span className="inline-flex items-center gap-2"><Plus size={14} /> {saving ? 'Adding...' : 'Add Stat'}</span>
            </AdminButton>
          </div>
        </form>
      </AdminCard>

      {loading ? (
        <p className="text-brandSlate font-medium">Loading...</p>
      ) : stats.length === 0 ? (
        <p className="text-brandSlate font-medium">No stats yet.</p>
      ) : (
        <div className="space-y-4">
          {stats.map((s, i) => (
            <AdminCard key={s.id} className="flex items-center gap-6">
              <div className="flex flex-col gap-1 text-gray-300 shrink-0">
                <button onClick={() => moveOrder(s.id, -1)} disabled={i === 0} className="disabled:opacity-20">▲</button>
                <button onClick={() => moveOrder(s.id, 1)} disabled={i === stats.length - 1} className="disabled:opacity-20">▼</button>
              </div>

              <div className="flex-grow grid sm:grid-cols-3 gap-4">
                <div>
                  <AdminLabel>Value</AdminLabel>
                  <AdminInput
                    defaultValue={s.value}
                    onChange={(e) => setEdit(s.id, { value: e.target.value })}
                  />
                </div>
                <div>
                  <AdminLabel>Label</AdminLabel>
                  <AdminInput
                    defaultValue={s.label}
                    onChange={(e) => setEdit(s.id, { label: e.target.value })}
                  />
                </div>
                <div>
                  <AdminLabel>Sub-label</AdminLabel>
                  <AdminInput
                    defaultValue={s.sub_stat ?? ''}
                    placeholder="optional"
                    onChange={(e) => setEdit(s.id, { sub_stat: e.target.value || null })}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2 shrink-0">
                <AdminButton
                  onClick={() => handleSaveEdit(s)}
                  disabled={!hasEdit(s.id) || savingId === s.id}
                >
                  {savingId === s.id ? 'Saving...' : 'Save'}
                </AdminButton>
                <AdminButton variant="danger" onClick={() => handleDelete(s.id)}>
                  <Trash2 size={14} />
                </AdminButton>
              </div>
            </AdminCard>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminStats;
