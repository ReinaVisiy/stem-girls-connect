import React, { useEffect, useState } from 'react';
import { Trash2, FileText, ExternalLink, Pencil, X, GripVertical } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { uploadToBucket, describeUploadError } from './uploadFile';
import { AdminPageHeader, AdminCard, AdminButton, AdminInput, AdminTextarea, AdminLabel, AdminBanner, AdminFileName } from './AdminUI';

interface Report {
  id: number;
  title: string;
  description: string | null;
  file_url: string;
  start_date: string | null;
  end_date: string | null;
  display_order: number;
}

function formatDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

const emptyForm = { title: '', description: '', startDate: '', endDate: '' };

const AdminReports: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase.from('reports').select('*').order('display_order');
    if (err) setError(err.message);
    else setReports(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const startEdit = (r: Report) => {
    setEditingId(r.id);
    setForm({
      title: r.title,
      description: r.description ?? '',
      startDate: r.start_date ?? '',
      endDate: r.end_date ?? '',
    });
    setFile(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    if (!editingId && !file) return; // new reports require a PDF
    setSaving(true);
    setError(null);

    try {
      let fileUrl: string | null = null;
      if (file) fileUrl = await uploadToBucket('site-assets', file, 'reports');

      if (editingId) {
        const updatePayload: Record<string, unknown> = {
          title: form.title.trim(),
          description: form.description.trim() || null,
          start_date: form.startDate || null,
          end_date: form.endDate || null,
        };
        if (fileUrl) updatePayload.file_url = fileUrl;

        const { error: err } = await supabase.from('reports').update(updatePayload).eq('id', editingId);
        if (err) throw err;
      } else {
        const nextOrder = reports.length > 0 ? Math.max(...reports.map((r) => r.display_order)) + 1 : 1;
        const { error: err } = await supabase.from('reports').insert({
          title: form.title.trim(),
          description: form.description.trim() || null,
          file_url: fileUrl,
          start_date: form.startDate || null,
          end_date: form.endDate || null,
          display_order: nextOrder,
        });
        if (err) throw err;
      }

      cancelEdit();
      await load();
    } catch (err) {
      setError(describeUploadError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Remove this report?')) return;
    const { error: err } = await supabase.from('reports').delete().eq('id', id);
    if (err) setError(err.message);
    else setReports((r) => r.filter((x) => x.id !== id));
  };

  const moveOrder = async (id: number, direction: -1 | 1) => {
    const idx = reports.findIndex((r) => r.id === id);
    const swapIdx = idx + direction;
    if (idx < 0 || swapIdx < 0 || swapIdx >= reports.length) return;

    const a = reports[idx];
    const b = reports[swapIdx];
    const { error: err } = await supabase.from('reports').upsert([
      { id: a.id, display_order: b.display_order },
      { id: b.id, display_order: a.display_order },
    ]);
    if (err) setError(err.message);
    else await load();
  };

  return (
    <div>
      <AdminPageHeader title="Reports" description="Published on the Impact & Evidence page." />
      {error && <AdminBanner type="error">{error}</AdminBanner>}

      <AdminCard className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-extrabold text-brandGreen uppercase tracking-widest">
            {editingId ? 'Edit Report' : 'Add a Report'}
          </h2>
          {editingId && (
            <button onClick={cancelEdit} className="text-xs font-bold text-brandSlate hover:text-brandPink flex items-center gap-1">
              <X size={14} /> Cancel edit
            </button>
          )}
        </div>
        <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <AdminLabel>Title</AdminLabel>
            <AdminInput
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. 2026 Annual Impact Report"
              required
            />
          </div>
          <div>
            <AdminLabel>Start Date</AdminLabel>
            <AdminInput type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} />
          </div>
          <div>
            <AdminLabel>End Date</AdminLabel>
            <AdminInput type="date" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} />
          </div>
          <div className="md:col-span-2">
            <AdminLabel>Description (optional)</AdminLabel>
            <AdminTextarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Short summary shown on the card"
            />
          </div>
          <div className="md:col-span-2">
            <AdminLabel>PDF File {editingId && '(leave empty to keep current)'}</AdminLabel>
            <input
              type="file"
              accept="application/pdf"
              required={!editingId}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-brandSlate file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-xs file:font-extrabold file:uppercase file:tracking-widest file:bg-brandPink/10 file:text-brandPink hover:file:bg-brandPink/20"
            />
            <AdminFileName file={file} />
          </div>
          <div className="md:col-span-2">
            <AdminButton type="submit" disabled={saving}>
              {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Add Report'}
            </AdminButton>
          </div>
        </form>
      </AdminCard>

      {loading ? (
        <p className="text-brandSlate font-medium">Loading...</p>
      ) : reports.length === 0 ? (
        <p className="text-brandSlate font-medium">No reports yet.</p>
      ) : (
        <div className="space-y-4">
          {reports.map((r, i) => (
            <AdminCard key={r.id} className="flex items-center gap-6">
              <div className="flex flex-col gap-1 text-gray-300">
                <button onClick={() => moveOrder(r.id, -1)} disabled={i === 0} className="disabled:opacity-20">▲</button>
                <GripVertical size={16} />
                <button onClick={() => moveOrder(r.id, 1)} disabled={i === reports.length - 1} className="disabled:opacity-20">▼</button>
              </div>
              <div className="w-14 h-14 rounded-xl bg-brandPink/10 flex items-center justify-center shrink-0">
                <FileText color="#82246d" size={24} />
              </div>
              <div className="flex-grow min-w-0">
                <p className="font-extrabold text-brandGreen truncate">{r.title}</p>
                {(r.start_date || r.end_date) && (
                  <p className="text-brandSlate text-xs font-bold">
                    {formatDate(r.start_date)} {r.end_date && `– ${formatDate(r.end_date)}`}
                  </p>
                )}
                <a
                  href={r.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-extrabold text-brandPink uppercase tracking-widest hover:underline mt-1"
                >
                  View PDF <ExternalLink size={12} />
                </a>
              </div>
              <AdminButton variant="ghost" onClick={() => startEdit(r)}>
                <Pencil size={14} />
              </AdminButton>
              <AdminButton variant="danger" onClick={() => handleDelete(r.id)}>
                <Trash2 size={14} />
              </AdminButton>
            </AdminCard>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminReports;
