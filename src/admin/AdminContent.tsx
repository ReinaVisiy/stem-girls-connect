import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { AdminPageHeader, AdminCard, AdminButton, AdminTextarea, AdminLabel, AdminBanner } from './AdminUI';

interface ContentRow {
  key: string;
  content: string;
}

/**
 * Every named editable text block on the site. Adding a new one?
 * Add its key/label here and read it from that page with
 * useSiteContent('the_key', fallbackText).
 */
const BLOCKS: { key: string; label: string; description: string }[] = [
  {
    key: 'about_ceo_bio',
    label: 'About — CEO write-up',
    description: 'Separate paragraphs with a blank line between them.',
  },
];

const AdminContent: React.FC = () => {
  const [values, setValues] = useState<Record<string, string>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [savedKey, setSavedKey] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase.from('site_content').select('*');
    if (err) setError(err.message);
    else {
      const map: Record<string, string> = {};
      for (const row of (data ?? []) as ContentRow[]) map[row.key] = row.content;
      setValues(map);
      setDrafts(map);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (key: string) => {
    setSavingKey(key);
    setError(null);
    setSavedKey(null);
    const { error: err } = await supabase
      .from('site_content')
      .upsert({ key, content: drafts[key] ?? '', updated_at: new Date().toISOString() });
    if (err) setError(err.message);
    else {
      setValues((v) => ({ ...v, [key]: drafts[key] ?? '' }));
      setSavedKey(key);
      setTimeout(() => setSavedKey(null), 2000);
    }
    setSavingKey(null);
  };

  return (
    <div>
      <AdminPageHeader title="Content" description="Editable text blocks used across the site." />
      {error && <AdminBanner type="error">{error}</AdminBanner>}

      {loading ? (
        <p className="text-brandSlate font-medium">Loading...</p>
      ) : (
        <div className="space-y-6">
          {BLOCKS.map(({ key, label, description }) => {
            const draft = drafts[key] ?? '';
            const dirty = draft !== (values[key] ?? '');
            return (
              <AdminCard key={key}>
                <AdminLabel>{label}</AdminLabel>
                <p className="text-brandSlate text-xs font-medium mb-3">{description}</p>
                <AdminTextarea
                  rows={10}
                  value={draft}
                  onChange={(e) => setDrafts((d) => ({ ...d, [key]: e.target.value }))}
                />
                <div className="flex items-center gap-4 mt-4">
                  <AdminButton onClick={() => save(key)} disabled={!dirty || savingKey === key}>
                    {savingKey === key ? 'Saving...' : 'Save Changes'}
                  </AdminButton>
                  {savedKey === key && <span className="text-brandGreen text-xs font-extrabold uppercase tracking-widest">Saved</span>}
                </div>
              </AdminCard>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminContent;
