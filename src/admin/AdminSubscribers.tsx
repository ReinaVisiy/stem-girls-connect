import React, { useEffect, useState } from 'react';
import { Trash2, Download } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { AdminPageHeader, AdminCard, AdminButton, AdminBanner } from './AdminUI';

interface Subscriber {
  id: number;
  email: string;
  created_at: string | null;
}

function downloadCsv(rows: Subscriber[]) {
  const header = 'email,subscribed_at';
  const lines = rows.map((r) => `${r.email},${r.created_at ?? ''}`);
  const csv = [header, ...lines].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sgc-newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const AdminSubscribers: React.FC = () => {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('subscribers')
      .select('*')
      .order('created_at', { ascending: false });
    if (err) setError(err.message);
    else setSubscribers(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Remove this subscriber?')) return;
    const { error: err } = await supabase.from('subscribers').delete().eq('id', id);
    if (err) setError(err.message);
    else setSubscribers((s) => s.filter((x) => x.id !== id));
  };

  return (
    <div>
      <AdminPageHeader
        title="Subscribers"
        description="Everyone who signed up for the newsletter via the site footer."
      />
      {error && <AdminBanner type="error">{error}</AdminBanner>}

      <div className="flex items-center justify-between mb-6">
        <p className="text-brandSlate text-sm font-bold">
          {loading ? 'Loading...' : `${subscribers.length} subscriber${subscribers.length === 1 ? '' : 's'}`}
        </p>
        <AdminButton
          variant="ghost"
          onClick={() => downloadCsv(subscribers)}
          disabled={loading || subscribers.length === 0}
        >
          <span className="inline-flex items-center gap-2"><Download size={14} /> Export CSV</span>
        </AdminButton>
      </div>

      {loading ? (
        <p className="text-brandSlate font-medium">Loading...</p>
      ) : subscribers.length === 0 ? (
        <p className="text-brandSlate font-medium">No subscribers yet.</p>
      ) : (
        <AdminCard className="!p-0 overflow-hidden">
          <div className="divide-y divide-gray-100">
            {subscribers.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-4 px-6 py-4">
                <div className="min-w-0">
                  <p className="font-bold text-brandGreen truncate">{s.email}</p>
                  {s.created_at && (
                    <p className="text-brandSlate text-xs font-medium">
                      {new Date(s.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                  )}
                </div>
                <AdminButton variant="danger" onClick={() => handleDelete(s.id)}>
                  <Trash2 size={14} />
                </AdminButton>
              </div>
            ))}
          </div>
        </AdminCard>
      )}
    </div>
  );
};

export default AdminSubscribers;
