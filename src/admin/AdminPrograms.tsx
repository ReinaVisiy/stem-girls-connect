import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Pencil, Eye, EyeOff, Plus, FileJson } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { AdminPageHeader, AdminCard, AdminButton, AdminBanner } from './AdminUI';
import { categoryLabel, statusLabel } from '../lib/programs';
import { readProgramJsonFile } from '../lib/programImport';

interface ProgramRow {
  id: number;
  title: string;
  slug: string;
  status: string;
  category: string;
  page_template: string;
  published: boolean;
  featured: boolean;
  display_order: number;
  updated_at: string;
}

function formatUpdated(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function pageTypeLabel(template: string) {
  return template === 'standard' ? 'Standard page' : `Custom: ${template}`;
}

const AdminPrograms: React.FC = () => {
  const [programs, setPrograms] = useState<ProgramRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('programs')
      .select('id, title, slug, status, category, page_template, published, featured, display_order, updated_at')
      .order('display_order')
      .order('id');
    if (err) setError(err.message);
    else setPrograms((data ?? []) as ProgramRow[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  // Reads the chosen .json here, then hands it to the editor, which validates
  // it and prefills the normal form. Nothing is saved at this point.
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const importText = await readProgramJsonFile(file);
      navigate('/admin/programs/new', { state: { importText, importFileName: file.name } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The file could not be read.');
    }
  };

  const togglePublished = async (p: ProgramRow) => {
    setBusyId(p.id);
    setError(null);
    const { error: err } = await supabase.from('programs').update({ published: !p.published }).eq('id', p.id);
    if (err) setError(err.message);
    else setPrograms((list) => list.map((x) => (x.id === p.id ? { ...x, published: !p.published } : x)));
    setBusyId(null);
  };

  const handleDelete = async (p: ProgramRow) => {
    if (!confirm(`Delete "${p.title}"? This also removes its report links (the reports themselves are kept). This cannot be undone.`)) return;
    setBusyId(p.id);
    setError(null);
    const { error: err } = await supabase.from('programs').delete().eq('id', p.id);
    if (err) setError(err.message);
    else setPrograms((list) => list.filter((x) => x.id !== p.id));
    setBusyId(null);
  };

  // Display order can start out tied (all 0), so renumber the whole list
  // after a swap instead of just exchanging two values.
  const moveOrder = async (index: number, direction: -1 | 1) => {
    const swapIndex = index + direction;
    if (swapIndex < 0 || swapIndex >= programs.length) return;

    const reordered = [...programs];
    [reordered[index], reordered[swapIndex]] = [reordered[swapIndex], reordered[index]];
    const renumbered = reordered.map((p, i) => ({ ...p, display_order: i + 1 }));

    setError(null);
    const results = await Promise.all(
      renumbered.map((p) => supabase.from('programs').update({ display_order: p.display_order }).eq('id', p.id))
    );
    const failed = results.find((r) => r.error);
    if (failed?.error) setError(failed.error.message);
    setPrograms(renumbered);
    if (failed) await load();
  };

  return (
    <div>
      <AdminPageHeader
        title="Programs"
        description="Published programs appear on the Programs page. Unpublished programs stay private."
      />
      {error && <AdminBanner type="error">{error}</AdminBanner>}

      <div className="mb-8 flex flex-wrap gap-3">
        <Link
          to="/admin/programs/new"
          className="inline-flex items-center gap-2 bg-brandPink text-white px-5 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-widest shadow-md shadow-brandPink/20 hover:scale-[1.02] transition-all"
        >
          <Plus size={14} aria-hidden="true" /> Add Program
        </Link>
        <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-widest bg-gray-50 text-brandSlate hover:bg-gray-100 cursor-pointer focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brandPink">
          <FileJson size={14} aria-hidden="true" /> Import Program JSON
          <input type="file" accept=".json,application/json" onChange={handleImportFile} className="sr-only" />
        </label>
      </div>

      {loading ? (
        <p className="text-brandSlate font-medium">Loading...</p>
      ) : programs.length === 0 ? (
        <p className="text-brandSlate font-medium">No programs yet.</p>
      ) : (
        <ul className="space-y-4">
          {programs.map((p, i) => (
            <li key={p.id}>
              <AdminCard className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
                <div className="flex md:flex-col gap-2 text-gray-400">
                  <button
                    onClick={() => moveOrder(i, -1)}
                    disabled={i === 0}
                    aria-label={`Move ${p.title} up`}
                    className="px-2 py-1 min-w-9 min-h-9 disabled:opacity-20"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => moveOrder(i, 1)}
                    disabled={i === programs.length - 1}
                    aria-label={`Move ${p.title} down`}
                    className="px-2 py-1 min-w-9 min-h-9 disabled:opacity-20"
                  >
                    ▼
                  </button>
                </div>

                <div className="flex-grow min-w-0">
                  <p className="font-extrabold text-brandGreen break-words">{p.title}</p>
                  <p className="text-brandSlate text-xs font-bold mt-1">
                    {statusLabel(p.status)} · {categoryLabel(p.category)} · {pageTypeLabel(p.page_template)}
                  </p>
                  <p className="text-xs font-bold mt-1 flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-full uppercase tracking-widest text-[10px] font-extrabold ${
                        p.published ? 'bg-green-50 text-brandGreen' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {p.published ? 'Published' : 'Draft'}
                    </span>
                    {p.featured && (
                      <span className="px-2 py-0.5 rounded-full uppercase tracking-widest text-[10px] font-extrabold bg-brandPink/10 text-brandPink">
                        Featured
                      </span>
                    )}
                    <span className="text-brandSlate font-medium">Updated {formatUpdated(p.updated_at)}</span>
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link
                    to={`/admin/programs/${p.id}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-widest bg-gray-50 text-brandSlate hover:bg-gray-100"
                  >
                    <Pencil size={14} aria-hidden="true" /> Edit
                  </Link>
                  <Link
                    to={`/admin/programs/${p.id}?preview=1`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-widest bg-gray-50 text-brandSlate hover:bg-gray-100"
                  >
                    <Eye size={14} aria-hidden="true" /> Preview
                  </Link>
                  <AdminButton variant="ghost" onClick={() => togglePublished(p)} disabled={busyId === p.id}>
                    {p.published ? (
                      <span className="inline-flex items-center gap-2">
                        <EyeOff size={14} aria-hidden="true" /> Unpublish
                      </span>
                    ) : (
                      'Publish'
                    )}
                  </AdminButton>
                  <AdminButton
                    variant="danger"
                    onClick={() => handleDelete(p)}
                    disabled={busyId === p.id}
                    aria-label={`Delete ${p.title}`}
                  >
                    <Trash2 size={14} aria-hidden="true" />
                  </AdminButton>
                </div>
              </AdminCard>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AdminPrograms;
