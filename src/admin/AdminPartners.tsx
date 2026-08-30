import React, { useEffect, useState } from 'react';
import { Trash2, Upload, GripVertical } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { uploadToBucket } from './uploadFile';
import { AdminPageHeader, AdminCard, AdminButton, AdminInput, AdminLabel, AdminBanner, AdminFileName } from './AdminUI';

interface Partner {
  id: number;
  name: string;
  logo_url: string | null;
  website_url: string | null;
  display_order: number;
}

const AdminPartners: React.FC = () => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase.from('partners').select('*').order('display_order');
    if (err) setError(err.message);
    else setPartners(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError(null);

    try {
      let logoUrl: string | null = null;
      if (file) logoUrl = await uploadToBucket('site-assets', file, 'partners');

      const nextOrder = partners.length > 0 ? Math.max(...partners.map((p) => p.display_order)) + 1 : 1;
      const { error: err } = await supabase.from('partners').insert({
        name: name.trim(),
        website_url: websiteUrl.trim() || null,
        logo_url: logoUrl,
        display_order: nextOrder,
      });
      if (err) throw err;

      setName('');
      setWebsiteUrl('');
      setFile(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add partner');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Remove this partner?')) return;
    const { error: err } = await supabase.from('partners').delete().eq('id', id);
    if (err) setError(err.message);
    else setPartners((p) => p.filter((x) => x.id !== id));
  };

  const handleReplaceLogo = async (id: number, newFile: File) => {
    setError(null);
    try {
      const logoUrl = await uploadToBucket('site-assets', newFile, 'partners');
      const { error: err } = await supabase.from('partners').update({ logo_url: logoUrl }).eq('id', id);
      if (err) throw err;
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to replace logo');
    }
  };

  const moveOrder = async (id: number, direction: -1 | 1) => {
    const idx = partners.findIndex((p) => p.id === id);
    const swapIdx = idx + direction;
    if (idx < 0 || swapIdx < 0 || swapIdx >= partners.length) return;

    const a = partners[idx];
    const b = partners[swapIdx];
    const { error: err } = await supabase.from('partners').upsert([
      { id: a.id, display_order: b.display_order },
      { id: b.id, display_order: a.display_order },
    ]);
    if (err) setError(err.message);
    else await load();
  };

  return (
    <div>
      <AdminPageHeader title="Partners" description="Logos shown on the homepage partner strip." />
      {error && <AdminBanner type="error">{error}</AdminBanner>}

      <AdminCard className="mb-8">
        <h2 className="text-sm font-extrabold text-brandGreen uppercase tracking-widest mb-6">Add a Partner</h2>
        <form onSubmit={handleAdd} className="grid md:grid-cols-2 gap-6">
          <div>
            <AdminLabel>Name</AdminLabel>
            <AdminInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Organization name" required />
          </div>
          <div>
            <AdminLabel>Website (optional)</AdminLabel>
            <AdminInput value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://..." type="url" />
          </div>
          <div className="md:col-span-2">
            <AdminLabel>Logo</AdminLabel>
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
              <span className="inline-flex items-center gap-2"><Upload size={14} /> {saving ? 'Adding...' : 'Add Partner'}</span>
            </AdminButton>
          </div>
        </form>
      </AdminCard>

      {loading ? (
        <p className="text-brandSlate font-medium">Loading...</p>
      ) : partners.length === 0 ? (
        <p className="text-brandSlate font-medium">No partners yet.</p>
      ) : (
        <div className="space-y-4">
          {partners.map((p, i) => (
            <AdminCard key={p.id} className="flex items-center gap-6">
              <div className="flex flex-col gap-1 text-gray-300">
                <button onClick={() => moveOrder(p.id, -1)} disabled={i === 0} className="disabled:opacity-20">▲</button>
                <GripVertical size={16} />
                <button onClick={() => moveOrder(p.id, 1)} disabled={i === partners.length - 1} className="disabled:opacity-20">▼</button>
              </div>

              <div className="w-20 h-20 rounded-xl bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
                {p.logo_url ? (
                  <img src={p.logo_url} alt={p.name} className="w-full h-full object-contain" />
                ) : (
                  <span className="text-[10px] text-gray-400 font-bold text-center px-1">No logo</span>
                )}
              </div>

              <div className="flex-grow min-w-0">
                <p className="font-extrabold text-brandGreen truncate">{p.name}</p>
                {p.website_url && <p className="text-brandSlate text-xs font-medium truncate">{p.website_url}</p>}
                <label className="inline-block mt-2 text-xs font-extrabold text-brandPink uppercase tracking-widest cursor-pointer hover:underline">
                  Replace Logo
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleReplaceLogo(p.id, f);
                    }}
                  />
                </label>
              </div>

              <AdminButton variant="danger" onClick={() => handleDelete(p.id)}>
                <Trash2 size={14} />
              </AdminButton>
            </AdminCard>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPartners;
