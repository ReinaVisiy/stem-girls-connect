import React, { useEffect, useState } from 'react';
import { Trash2, Pencil, X, GripVertical } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { uploadToBucket, describeUploadError } from './uploadFile';
import { AdminPageHeader, AdminCard, AdminButton, AdminInput, AdminLabel, AdminBanner, AdminFileName } from './AdminUI';

interface BureauRow {
  id: number;
  name: string;
  position: string;
  photo_url: string | null;
  linkedin_url: string | null;
  display_order: number;
}

const emptyForm = { name: '', position: '', linkedinUrl: '' };

const AdminBureau: React.FC = () => {
  const [members, setMembers] = useState<BureauRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase.from('bureau').select('*').order('display_order');
    if (err) setError(err.message);
    else setMembers(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const startEdit = (m: BureauRow) => {
    setEditingId(m.id);
    setForm({ name: m.name, position: m.position, linkedinUrl: m.linkedin_url ?? '' });
    setFile(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.position.trim()) return;
    setSaving(true);
    setError(null);

    try {
      let photoUrl: string | null = null;
      if (file) photoUrl = await uploadToBucket('site-assets', file, 'bureau');

      if (editingId) {
        const updatePayload: Record<string, unknown> = {
          name: form.name.trim(),
          position: form.position.trim(),
          linkedin_url: form.linkedinUrl.trim() || null,
        };
        if (photoUrl) updatePayload.photo_url = photoUrl;

        const { error: err } = await supabase.from('bureau').update(updatePayload).eq('id', editingId);
        if (err) throw err;
      } else {
        const nextOrder = members.length > 0 ? Math.max(...members.map((m) => m.display_order)) + 1 : 1;
        const { error: err } = await supabase.from('bureau').insert({
          name: form.name.trim(),
          position: form.position.trim(),
          linkedin_url: form.linkedinUrl.trim() || null,
          photo_url: photoUrl,
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
    if (!confirm('Remove this bureau member?')) return;
    const { error: err } = await supabase.from('bureau').delete().eq('id', id);
    if (err) setError(err.message);
    else setMembers((m) => m.filter((x) => x.id !== id));
  };

  const moveOrder = async (id: number, direction: -1 | 1) => {
    const idx = members.findIndex((m) => m.id === id);
    const swapIdx = idx + direction;
    if (idx < 0 || swapIdx < 0 || swapIdx >= members.length) return;

    const a = members[idx];
    const b = members[swapIdx];
    const { error: err } = await supabase.from('bureau').upsert([
      { id: a.id, display_order: b.display_order },
      { id: b.id, display_order: a.display_order },
    ]);
    if (err) setError(err.message);
    else await load();
  };

  return (
    <div>
      <AdminPageHeader title="Bureau" description="Leadership team shown on the About page." />
      {error && <AdminBanner type="error">{error}</AdminBanner>}

      <AdminCard className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-extrabold text-brandGreen uppercase tracking-widest">
            {editingId ? 'Edit Bureau Member' : 'Add a Bureau Member'}
          </h2>
          {editingId && (
            <button onClick={cancelEdit} className="text-xs font-bold text-brandSlate hover:text-brandPink flex items-center gap-1">
              <X size={14} /> Cancel edit
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-6">
          <div>
            <AdminLabel>Name</AdminLabel>
            <AdminInput value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Full name" required />
          </div>
          <div>
            <AdminLabel>Position</AdminLabel>
            <AdminInput
              value={form.position}
              onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}
              placeholder="e.g. Administrative Secretary"
              required
            />
          </div>
          <div className="md:col-span-2">
            <AdminLabel>LinkedIn URL (optional — leave blank for a non-clickable name)</AdminLabel>
            <AdminInput
              type="url"
              value={form.linkedinUrl}
              onChange={(e) => setForm((f) => ({ ...f, linkedinUrl: e.target.value }))}
              placeholder="https://www.linkedin.com/in/..."
            />
          </div>
          <div className="md:col-span-2">
            <AdminLabel>Photo {editingId && '(leave empty to keep current)'}</AdminLabel>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-brandSlate file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-xs file:font-extrabold file:uppercase file:tracking-widest file:bg-brandPink/10 file:text-brandPink hover:file:bg-brandPink/20"
            />
            <AdminFileName file={file} />
          </div>
          <div className="md:col-span-2">
            <AdminButton type="submit" disabled={saving}>
              {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Add Member'}
            </AdminButton>
          </div>
        </form>
      </AdminCard>

      {loading ? (
        <p className="text-brandSlate font-medium">Loading...</p>
      ) : members.length === 0 ? (
        <p className="text-brandSlate font-medium">No bureau members yet.</p>
      ) : (
        <div className="space-y-4">
          {members.map((m, i) => (
            <AdminCard key={m.id} className="flex items-center gap-6">
              <div className="flex flex-col gap-1 text-gray-300">
                <button onClick={() => moveOrder(m.id, -1)} disabled={i === 0} className="disabled:opacity-20">▲</button>
                <GripVertical size={16} />
                <button onClick={() => moveOrder(m.id, 1)} disabled={i === members.length - 1} className="disabled:opacity-20">▼</button>
              </div>

              <div className="w-16 h-16 rounded-full bg-gray-50 overflow-hidden shrink-0">
                {m.photo_url ? (
                  <img src={m.photo_url} alt={m.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-brandSlate font-extrabold text-sm">
                    {m.name
                      .split(' ')
                      .map((p) => p[0])
                      .slice(0, 2)
                      .join('')}
                  </div>
                )}
              </div>

              <div className="flex-grow min-w-0">
                <p className="font-extrabold text-brandGreen truncate">{m.name}</p>
                <p className="text-brandSlate text-xs font-medium truncate">{m.position}</p>
                {m.linkedin_url ? (
                  <p className="text-brandSlate text-xs font-medium truncate">{m.linkedin_url}</p>
                ) : (
                  <p className="text-gray-400 text-xs font-medium italic">No LinkedIn — name not clickable</p>
                )}
              </div>

              <AdminButton variant="ghost" onClick={() => startEdit(m)}>
                <Pencil size={14} />
              </AdminButton>
              <AdminButton variant="danger" onClick={() => handleDelete(m.id)}>
                <Trash2 size={14} />
              </AdminButton>
            </AdminCard>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminBureau;
