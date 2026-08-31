import React, { useEffect, useState } from 'react';
import { Trash2, Upload, GripVertical } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { uploadToBucket, describeUploadError } from './uploadFile';
import { AdminPageHeader, AdminCard, AdminButton, AdminInput, AdminLabel, AdminBanner, AdminFileName } from './AdminUI';

interface BureauMember {
  id: number;
  name: string;
  position: string;
  photo_url: string | null;
  linkedin_url: string | null;
  display_order: number;
}

const AdminBureau: React.FC = () => {
  const [members, setMembers] = useState<BureauMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
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

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !position.trim()) return;
    setSaving(true);
    setError(null);

    try {
      let photoUrl: string | null = null;
      if (file) photoUrl = await uploadToBucket('site-assets', file, 'bureau');

      const nextOrder = members.length > 0 ? Math.max(...members.map((m) => m.display_order)) + 1 : 1;
      const { error: err } = await supabase.from('bureau').insert({
        name: name.trim(),
        position: position.trim(),
        linkedin_url: linkedinUrl.trim() || null,
        photo_url: photoUrl,
        display_order: nextOrder,
      });
      if (err) throw err;

      setName('');
      setPosition('');
      setLinkedinUrl('');
      setFile(null);
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

  const handleReplacePhoto = async (id: number, newFile: File) => {
    setError(null);
    try {
      const photoUrl = await uploadToBucket('site-assets', newFile, 'bureau');
      const { error: err } = await supabase.from('bureau').update({ photo_url: photoUrl }).eq('id', id);
      if (err) throw err;
      await load();
    } catch (err) {
      setError(describeUploadError(err));
    }
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
      <AdminPageHeader title="Bureau" description="Executive committee members shown on the About page." />
      {error && <AdminBanner type="error">{error}</AdminBanner>}

      <AdminCard className="mb-8">
        <h2 className="text-sm font-extrabold text-brandGreen uppercase tracking-widest mb-6">Add a Bureau Member</h2>
        <form onSubmit={handleAdd} className="grid md:grid-cols-2 gap-6">
          <div>
            <AdminLabel>Name</AdminLabel>
            <AdminInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" required />
          </div>
          <div>
            <AdminLabel>Position</AdminLabel>
            <AdminInput value={position} onChange={(e) => setPosition(e.target.value)} placeholder="e.g. CEO & Chairperson" required />
          </div>
          <div className="md:col-span-2">
            <AdminLabel>LinkedIn (optional)</AdminLabel>
            <AdminInput value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/..." type="url" />
          </div>
          <div className="md:col-span-2">
            <AdminLabel>Photo (optional — shows initials if left blank)</AdminLabel>
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
              <span className="inline-flex items-center gap-2"><Upload size={14} /> {saving ? 'Adding...' : 'Add Member'}</span>
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

              <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
                {m.photo_url ? (
                  <img src={m.photo_url} alt={m.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[10px] text-gray-400 font-bold text-center px-1">No photo</span>
                )}
              </div>

              <div className="flex-grow min-w-0">
                <p className="font-extrabold text-brandGreen truncate">{m.name}</p>
                <p className="text-brandSlate text-xs font-medium truncate">{m.position}</p>
                {m.linkedin_url && <p className="text-brandSlate text-xs font-medium truncate">{m.linkedin_url}</p>}
                <label className="inline-block mt-2 text-xs font-extrabold text-brandPink uppercase tracking-widest cursor-pointer hover:underline">
                  {m.photo_url ? 'Replace Photo' : 'Add Photo'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleReplacePhoto(m.id, f);
                    }}
                  />
                </label>
              </div>

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
