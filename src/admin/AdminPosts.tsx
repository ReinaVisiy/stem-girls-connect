import React, { useEffect, useState } from 'react';
import { Trash2, Pencil, X } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { uploadToBucket } from './uploadFile';
import { AdminPageHeader, AdminCard, AdminButton, AdminInput, AdminTextarea, AdminLabel, AdminBanner } from './AdminUI';

interface MediaItem {
  type: 'image' | 'video';
  url: string;
  caption?: string;
}

interface PostRow {
  id: number;
  title: string;
  slug: string;
  body: string;
  image_url: string | null;
  media: MediaItem[];
  published: boolean;
  published_at: string;
}

function slugify(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

const emptyForm = {
  title: '',
  body: '',
  publishedAt: new Date().toISOString().slice(0, 10),
  published: true,
};

const AdminPosts: React.FC = () => {
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [existingMedia, setExistingMedia] = useState<MediaItem[]>([]);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error: err } = await supabase.from('posts').select('*').order('published_at', { ascending: false });
    if (err) setError(err.message);
    else setPosts((data ?? []) as PostRow[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const startEdit = (post: PostRow) => {
    setEditingId(post.id);
    setForm({
      title: post.title,
      body: post.body,
      publishedAt: post.published_at.slice(0, 10),
      published: post.published,
    });
    setExistingMedia(post.media ?? []);
    setCoverFile(null);
    setMediaFiles([]);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
    setCoverFile(null);
    setMediaFiles([]);
    setExistingMedia([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) return;
    setSaving(true);
    setError(null);

    try {
      let imageUrl: string | null = editingId ? null : null;
      const newMedia: MediaItem[] = [...existingMedia];

      if (coverFile) {
        imageUrl = await uploadToBucket('post-media', coverFile, 'covers');
      }

      for (const f of mediaFiles) {
        const url = await uploadToBucket('post-media', f, 'media');
        newMedia.push({ type: f.type.startsWith('video') ? 'video' : 'image', url });
      }

      if (editingId) {
        const updatePayload: Record<string, unknown> = {
          title: form.title.trim(),
          body: form.body,
          published_at: form.publishedAt,
          published: form.published,
          media: newMedia,
        };
        if (imageUrl) updatePayload.image_url = imageUrl;

        const { error: err } = await supabase.from('posts').update(updatePayload).eq('id', editingId);
        if (err) throw err;
      } else {
        const slug = slugify(form.title);
        const { error: err } = await supabase.from('posts').insert({
          title: form.title.trim(),
          slug,
          body: form.body,
          image_url: imageUrl,
          media: newMedia,
          published_at: form.publishedAt,
          published: form.published,
        });
        if (err) throw err;
      }

      cancelEdit();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save post');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this post?')) return;
    const { error: err } = await supabase.from('posts').delete().eq('id', id);
    if (err) setError(err.message);
    else setPosts((p) => p.filter((x) => x.id !== id));
  };

  const removeExistingMedia = (index: number) => {
    setExistingMedia((m) => m.filter((_, i) => i !== index));
  };

  return (
    <div>
      <AdminPageHeader title="Posts" description="News and updates shown on the Blog page." />
      {error && <AdminBanner type="error">{error}</AdminBanner>}

      <AdminCard className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-extrabold text-brandGreen uppercase tracking-widest">
            {editingId ? 'Edit Post' : 'Add a Post'}
          </h2>
          {editingId && (
            <button onClick={cancelEdit} className="text-xs font-bold text-brandSlate hover:text-brandPink flex items-center gap-1">
              <X size={14} /> Cancel edit
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <AdminLabel>Title</AdminLabel>
            <AdminInput value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Post title" required />
          </div>

          <div>
            <AdminLabel>Write-up (Markdown supported)</AdminLabel>
            <AdminTextarea
              rows={8}
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              placeholder="Write the post..."
              required
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <AdminLabel>Date</AdminLabel>
              <AdminInput type="date" value={form.publishedAt} onChange={(e) => setForm((f) => ({ ...f, publishedAt: e.target.value }))} />
            </div>
            <div className="flex items-end pb-3">
              <label className="flex items-center gap-2 text-sm font-bold text-brandSlate cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.published}
                  onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
                  className="w-4 h-4 accent-brandPink"
                />
                Published (visible on site)
              </label>
            </div>
          </div>

          <div>
            <AdminLabel>Cover Photo {editingId && '(leave empty to keep current)'}</AdminLabel>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-brandSlate file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-xs file:font-extrabold file:uppercase file:tracking-widest file:bg-brandPink/10 file:text-brandPink hover:file:bg-brandPink/20"
            />
          </div>

          <div>
            <AdminLabel>Additional Media (photos & videos)</AdminLabel>
            {existingMedia.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-4">
                {existingMedia.map((m, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-50">
                    {m.type === 'video' ? (
                      <video src={m.url} className="w-full h-full object-cover" />
                    ) : (
                      <img src={m.url} alt="" className="w-full h-full object-cover" />
                    )}
                    <button
                      type="button"
                      onClick={() => removeExistingMedia(i)}
                      className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <input
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={(e) => setMediaFiles(Array.from(e.target.files ?? []))}
              className="block w-full text-sm text-brandSlate file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-xs file:font-extrabold file:uppercase file:tracking-widest file:bg-brandPink/10 file:text-brandPink hover:file:bg-brandPink/20"
            />
          </div>

          <AdminButton type="submit" disabled={saving}>
            {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Publish Post'}
          </AdminButton>
        </form>
      </AdminCard>

      {loading ? (
        <p className="text-brandSlate font-medium">Loading...</p>
      ) : posts.length === 0 ? (
        <p className="text-brandSlate font-medium">No posts yet.</p>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <AdminCard key={post.id} className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-xl bg-gray-50 overflow-hidden shrink-0">
                {post.image_url && <img src={post.image_url} alt={post.title} className="w-full h-full object-cover" />}
              </div>
              <div className="flex-grow min-w-0">
                <p className="font-extrabold text-brandGreen truncate">{post.title}</p>
                <p className="text-brandSlate text-xs font-medium">
                  {new Date(post.published_at).toLocaleDateString()} · {post.published ? 'Published' : 'Draft'}
                </p>
              </div>
              <AdminButton variant="ghost" onClick={() => startEdit(post)}>
                <Pencil size={14} />
              </AdminButton>
              <AdminButton variant="danger" onClick={() => handleDelete(post.id)}>
                <Trash2 size={14} />
              </AdminButton>
            </AdminCard>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPosts;
