import React, { useEffect, useState } from 'react';
import { Trash2, GripVertical } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { uploadToBucket } from './uploadFile';
import { AdminPageHeader, AdminCard, AdminButton, AdminInput, AdminLabel, AdminBanner } from './AdminUI';

interface SiteImageRow {
  placement_key: string;
  image_url: string;
  alt_text: string | null;
}

interface SlideRow {
  id: number;
  image_url: string;
  caption: string | null;
  display_order: number;
}

/**
 * Every named photo slot on the site. Adding a new spot on a page?
 * Add its key/label here and reference it from that page with
 * useSiteImage('the_key', fallbackSrc, fallbackAlt).
 */
const PLACEMENTS: { key: string; label: string }[] = [
  { key: 'home_support', label: 'Home — Support Our Mission photo' },
  { key: 'about_team', label: 'About — Team photo' },
  { key: 'activities_hero', label: 'Activities — Hero photo' },
  { key: 'activities_gallery_1', label: 'Activities — Gallery photo 1' },
  { key: 'activities_gallery_2', label: 'Activities — Gallery photo 2' },
  { key: 'joinus_hero', label: 'Join Us — Hero photo' },
];

const AdminPhotos: React.FC = () => {
  const [tab, setTab] = useState<'placements' | 'slideshow'>('placements');
  const [images, setImages] = useState<Record<string, SiteImageRow>>({});
  const [slides, setSlides] = useState<SlideRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newCaption, setNewCaption] = useState('');
  const [newFile, setNewFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data: imgData, error: imgErr }, { data: slideData, error: slideErr }] = await Promise.all([
      supabase.from('site_images').select('*'),
      supabase.from('home_slideshow').select('*').order('display_order'),
    ]);
    if (imgErr) setError(imgErr.message);
    if (slideErr) setError(slideErr.message);

    const map: Record<string, SiteImageRow> = {};
    for (const row of imgData ?? []) map[row.placement_key] = row;
    setImages(map);
    setSlides(slideData ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handlePlacementUpload = async (key: string, label: string, file: File) => {
    setError(null);
    try {
      const url = await uploadToBucket('site-assets', file, 'placements');
      const { error: err } = await supabase
        .from('site_images')
        .upsert({ placement_key: key, image_url: url, alt_text: label, updated_at: new Date().toISOString() });
      if (err) throw err;
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    }
  };

  const handleAddSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFile) return;
    setSaving(true);
    setError(null);
    try {
      const url = await uploadToBucket('site-assets', newFile, 'slideshow');
      const nextOrder = slides.length > 0 ? Math.max(...slides.map((s) => s.display_order)) + 1 : 1;
      const { error: err } = await supabase
        .from('home_slideshow')
        .insert({ image_url: url, caption: newCaption.trim() || null, display_order: nextOrder });
      if (err) throw err;
      setNewCaption('');
      setNewFile(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add slide');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSlide = async (id: number) => {
    if (!confirm('Remove this slide?')) return;
    const { error: err } = await supabase.from('home_slideshow').delete().eq('id', id);
    if (err) setError(err.message);
    else setSlides((s) => s.filter((x) => x.id !== id));
  };

  const moveSlide = async (id: number, direction: -1 | 1) => {
    const idx = slides.findIndex((s) => s.id === id);
    const swapIdx = idx + direction;
    if (idx < 0 || swapIdx < 0 || swapIdx >= slides.length) return;

    const a = slides[idx];
    const b = slides[swapIdx];
    const { error: err } = await supabase.from('home_slideshow').upsert([
      { id: a.id, display_order: b.display_order },
      { id: b.id, display_order: a.display_order },
    ]);
    if (err) setError(err.message);
    else await load();
  };

  return (
    <div>
      <AdminPageHeader title="Photos" description="Control which photo shows in each spot on the site." />
      {error && <AdminBanner type="error">{error}</AdminBanner>}

      <div className="flex bg-gray-100 rounded-2xl p-1 mb-8 w-fit">
        <button
          onClick={() => setTab('placements')}
          className={`px-6 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-widest transition-all ${
            tab === 'placements' ? 'bg-white shadow-sm text-brandPink' : 'text-brandSlate'
          }`}
        >
          Site Photos
        </button>
        <button
          onClick={() => setTab('slideshow')}
          className={`px-6 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-widest transition-all ${
            tab === 'slideshow' ? 'bg-white shadow-sm text-brandPink' : 'text-brandSlate'
          }`}
        >
          Home Slideshow
        </button>
      </div>

      {loading ? (
        <p className="text-brandSlate font-medium">Loading...</p>
      ) : tab === 'placements' ? (
        <div className="space-y-4">
          {PLACEMENTS.map(({ key, label }) => {
            const current = images[key];
            return (
              <AdminCard key={key} className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-xl bg-gray-50 overflow-hidden shrink-0">
                  {current && <img src={current.image_url} alt={label} className="w-full h-full object-cover" />}
                </div>
                <div className="flex-grow min-w-0">
                  <p className="font-extrabold text-brandGreen">{label}</p>
                  <p className="text-brandSlate text-xs font-medium mb-2">
                    {current ? 'Currently set — select a new file to replace it.' : 'Using the site default photo.'}
                  </p>
                  <label className="inline-block text-xs font-extrabold text-brandPink uppercase tracking-widest cursor-pointer hover:underline">
                    {current ? 'Replace Photo' : 'Set Photo'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handlePlacementUpload(key, label, f);
                      }}
                    />
                  </label>
                </div>
              </AdminCard>
            );
          })}
        </div>
      ) : (
        <>
          <AdminCard className="mb-8">
            <h2 className="text-sm font-extrabold text-brandGreen uppercase tracking-widest mb-6">Add a Slide</h2>
            <form onSubmit={handleAddSlide} className="grid md:grid-cols-2 gap-6">
              <div>
                <AdminLabel>Caption (optional)</AdminLabel>
                <AdminInput value={newCaption} onChange={(e) => setNewCaption(e.target.value)} placeholder="e.g. Community Outreach" />
              </div>
              <div>
                <AdminLabel>Photo</AdminLabel>
                <input
                  type="file"
                  accept="image/*"
                  required
                  onChange={(e) => setNewFile(e.target.files?.[0] ?? null)}
                  className="block w-full text-sm text-brandSlate file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-xs file:font-extrabold file:uppercase file:tracking-widest file:bg-brandPink/10 file:text-brandPink hover:file:bg-brandPink/20"
                />
              </div>
              <div className="md:col-span-2">
                <AdminButton type="submit" disabled={saving}>{saving ? 'Adding...' : 'Add Slide'}</AdminButton>
              </div>
            </form>
          </AdminCard>

          <div className="space-y-4">
            {slides.map((s, i) => (
              <AdminCard key={s.id} className="flex items-center gap-6">
                <div className="flex flex-col gap-1 text-gray-300">
                  <button onClick={() => moveSlide(s.id, -1)} disabled={i === 0} className="disabled:opacity-20">▲</button>
                  <GripVertical size={16} />
                  <button onClick={() => moveSlide(s.id, 1)} disabled={i === slides.length - 1} className="disabled:opacity-20">▼</button>
                </div>
                <div className="w-24 h-24 rounded-xl bg-gray-50 overflow-hidden shrink-0">
                  <img src={s.image_url} alt={s.caption ?? ''} className="w-full h-full object-cover" />
                </div>
                <div className="flex-grow min-w-0">
                  <p className="font-extrabold text-brandGreen">{s.caption || <span className="text-gray-400 italic">No caption</span>}</p>
                </div>
                <AdminButton variant="danger" onClick={() => handleDeleteSlide(s.id)}>
                  <Trash2 size={14} />
                </AdminButton>
              </AdminCard>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default AdminPhotos;
